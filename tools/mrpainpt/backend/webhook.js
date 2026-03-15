// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Stripe Webhook Handler
//  ─────────────────────────────────────────────────────────────────────────────
//
//  Endpoint:  POST /api/webhooks/stripe
//
//  This route must be mounted BEFORE express.json() because Stripe requires
//  the raw (unparsed) request body for signature verification.
//  server.js uses express.raw({ type: "application/json" }) for this path only.
//
//  Signature verification:
//    Uses STRIPE_WEBHOOK_SECRET from .env (starts with whsec_).
//    If the secret is not configured, signature verification is skipped with
//    a warning — suitable for development only. NEVER deploy without a secret.
//
//  Event → access state mapping
//  ─────────────────────────────
//  Stripe event                         access_status    billing_status
//  ─────────────────────────────────────────────────────────────────────
//  customer.subscription.created        active           active
//  customer.subscription.updated        active|expired   active|past_due
//  customer.subscription.deleted        expired          cancelled
//  customer.subscription.trial_will_end (unchanged)      trial_ending   ← 3-day warning
//  invoice.payment_succeeded            active           active
//  invoice.payment_failed               (unchanged)      past_due
//  checkout.session.completed           active           active
//    (mode: "payment" = one_off)        active           active
//
//  Client lookup order:
//    1. event.data.object.metadata.client_slug
//    2. clients.findBySubscriptionId(event.data.object.subscription)
//    3. clients.findByPaymentField("subscription_id", event.data.object.id)
//
//  After updating, always re-run access.resolve() so the DB mirrors the
//  computed entitlement state accurately.
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const crypto  = require("crypto");
const express = require("express");
const clients = require("./clients");
const access  = require("./access");

const router = express.Router();

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const IS_DEV         = process.env.NODE_ENV !== "production";

if (!WEBHOOK_SECRET) {
  console.warn("  ⚠  STRIPE_WEBHOOK_SECRET not set — webhook signature verification disabled.");
}

// ── Signature verification ────────────────────────────────────────────────────

/**
 * Verify the Stripe-Signature header against the raw request body.
 * Returns { ok: true } or { ok: false, error: string }.
 *
 * Algorithm: https://stripe.com/docs/webhooks/signatures
 */
function verifySignature(rawBody, sigHeader, secret) {
  if (!secret) return { ok: true, warn: "No secret configured — skipping verification" };

  const parts = {};
  (sigHeader || "").split(",").forEach(part => {
    const eq = part.indexOf("=");
    if (eq > -1) parts[part.slice(0, eq)] = part.slice(eq + 1);
  });

  const ts = parts["t"];
  const v1 = parts["v1"];

  if (!ts || !v1) return { ok: false, error: "Malformed Stripe-Signature header" };

  // Reject events older than 5 minutes (replay protection)
  const toleranceSec = 300;
  const nowSec = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSec - parseInt(ts, 10)) > toleranceSec) {
    return { ok: false, error: `Timestamp too old (${Math.abs(nowSec - parseInt(ts, 10))}s)` };
  }

  const signedPayload = `${ts}.${rawBody}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  let match;
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(v1,       "hex");
    match = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch (_) {
    match = false;
  }

  return match ? { ok: true } : { ok: false, error: "Signature mismatch" };
}

// ── Client resolver ───────────────────────────────────────────────────────────

function resolveClientSlug(event) {
  const obj      = event.data?.object || {};
  const meta     = obj.metadata || {};

  // Preferred: explicit metadata set when creating Stripe resources
  if (meta.client_slug) return meta.client_slug;

  // Fall back to DB lookup by subscription ID
  const subId   = obj.subscription || obj.id;
  if (subId) {
    const found = clients.findByPaymentField("subscription_id", subId);
    if (found) return found.slug;
  }

  // Fall back to DB lookup by purchase ID
  const piId = obj.payment_intent;
  if (piId) {
    const found = clients.findByPaymentField("purchase_id", piId);
    if (found) return found.slug;
  }

  return null;
}

// ── Event handlers ────────────────────────────────────────────────────────────

/**
 * Maps a Stripe event to a partial update object for the clients table.
 * Returns null for unhandled events.
 */
function mapEventToUpdate(event) {
  const obj = event.data?.object || {};

  switch (event.type) {

    case "customer.subscription.created":
      return {
        payment: {
          subscriptionId: obj.id,
          purchaseDate:   obj.created ? isoDate(obj.created) : null,
          billingStatus:  "active",
        },
        program: (existing) => ({
          ...existing.program,
          access: { ...existing.program?.access, type: "subscription", status: "active" },
        }),
      };

    case "customer.subscription.updated": {
      const billingStatus = obj.status === "active"   ? "active"
                          : obj.status === "past_due" ? "past_due"
                          : obj.status === "canceled" ? "cancelled"
                          : obj.status;
      const accessStatus  = ["active", "trialing"].includes(obj.status) ? "active"
                          : obj.status === "canceled"                   ? "expired"
                          : "active";
      return {
        payment: { billingStatus },
        program: (existing) => ({
          ...existing.program,
          access: { ...existing.program?.access, status: accessStatus },
        }),
      };
    }

    case "customer.subscription.deleted":
      return {
        payment: { billingStatus: "cancelled" },
        program: (existing) => ({
          ...existing.program,
          access: { ...existing.program?.access, status: "expired" },
        }),
      };

    case "invoice.payment_succeeded":
      return {
        payment: { billingStatus: "active" },
        program: (existing) => ({
          ...existing.program,
          access: { ...existing.program?.access, status: "active" },
        }),
      };

    // 3-day advance warning before trial ends — log only; access unchanged.
    // Use this event to trigger a "trial ending soon" notification to the client.
    case "customer.subscription.trial_will_end":
      console.log(`[webhook] trial_will_end for subscription ${obj.id} — ends ${isoDate(obj.trial_end)}`);
      return {
        payment: { billingStatus: "trial_ending" },
        // Access remains "active" until trial_end passes; expiryDate enforcement handles cutoff
      };

    case "invoice.payment_failed":
      return {
        payment: { billingStatus: "past_due" },
        // Don't auto-expire on first failure — coach or retry handles it
      };

    case "checkout.session.completed": {
      const isRecurring = obj.mode === "subscription";
      const isOneOff    = obj.mode === "payment";
      const update = {
        payment: {
          billingStatus: "active",
          purchaseDate:  obj.created ? isoDate(obj.created) : null,
        },
        program: (existing) => ({
          ...existing.program,
          access: {
            ...existing.program?.access,
            type:   isOneOff ? "one_off_purchase" : "subscription",
            status: "active",
          },
        }),
      };
      if (isOneOff && obj.payment_intent) {
        update.payment.purchaseId = obj.payment_intent;
      }
      if (isRecurring && obj.subscription) {
        update.payment.subscriptionId = obj.subscription;
      }
      return update;
    }

    default:
      return null;
  }
}

function isoDate(unixTs) {
  return new Date(unixTs * 1000).toISOString().split("T")[0];
}

// ── Route ─────────────────────────────────────────────────────────────────────

// express.raw() must be applied to this route BEFORE express.json() in server.js
router.post(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  (req, res) => {
    // Verify signature
    const rawBody   = req.body;  // Buffer (because express.raw)
    const sigHeader = req.headers["stripe-signature"] || "";
    const { ok, error, warn } = verifySignature(rawBody.toString("utf8"), sigHeader, WEBHOOK_SECRET);

    if (!ok) {
      console.error("[webhook] Signature verification failed:", error);
      return res.status(400).json({ error: `Webhook verification failed: ${error}` });
    }
    if (warn) console.warn("[webhook]", warn);

    // Parse event
    let event;
    try {
      event = JSON.parse(rawBody.toString("utf8"));
    } catch (_) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    console.log(`[webhook] ${event.type} — id: ${event.id}`);

    // Resolve client
    const slug = resolveClientSlug(event);
    if (!slug) {
      console.warn(`[webhook] ${event.type}: could not resolve client slug — skipping`);
      return res.status(200).json({ received: true, skipped: "no client resolved" });
    }

    const existing = clients.get(slug);
    if (!existing) {
      console.warn(`[webhook] ${event.type}: client "${slug}" not in DB — skipping`);
      return res.status(200).json({ received: true, skipped: `client ${slug} not found` });
    }

    // Map event to DB update
    const update = mapEventToUpdate(event);
    if (!update) {
      return res.status(200).json({ received: true, skipped: `unhandled event: ${event.type}` });
    }

    // Apply program updater function if present
    const body = { ...update };
    if (typeof body.program === "function") {
      body.program = body.program(existing);
    }

    // Write to DB
    const updated = clients.update(slug, body);

    // Recompute and store resolved access (keeps DB mirrors accurate)
    const resolved = access.resolve(updated.program?.access, updated.payment);
    console.log(`[webhook] ${slug} → access: ${resolved.status} (${resolved.allowed ? "allowed" : "blocked"})`);

    // 200 is critical — Stripe retries on any non-2xx
    res.status(200).json({ received: true, slug, event: event.type });
  }
);

module.exports = router;

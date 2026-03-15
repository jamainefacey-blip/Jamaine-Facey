// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Stripe Checkout Session Creator
// ─────────────────────────────────────────────────────────────────────────────
//
//  Creates Stripe Checkout Sessions via the Stripe REST API.
//  No Stripe SDK — uses Node.js native fetch (Node 18+) or https module.
//
//  Required env:
//    STRIPE_SECRET_KEY — sk_test_... or sk_live_...
//
//  Metadata contract (set on every session and subscription):
//  ──────────────────────────────────────────────────────────────────────────────
//  Field               Where set                          Purpose
//  ──────────────────────────────────────────────────────────────────────────────
//  client_slug         checkout.session.metadata          Webhook → client lookup
//                      subscription_data.metadata         Carried onto subscription
//                      payment_intent_data.metadata       Carried onto payment intent
//  product_type        checkout.session.metadata          "one_off" | "subscription"
//  expiry_date         checkout.session.metadata          ISO date; for fixed-term access
//  ──────────────────────────────────────────────────────────────────────────────
//
//  Client lookup priority in webhook.js:
//    1. event.data.object.metadata.client_slug   (preferred — always set here)
//    2. subscription_id DB lookup                (fallback for sub events)
//    3. purchase_id (payment_intent) DB lookup   (fallback for one-off events)
//
//  Stripe product setup (one-time, in Stripe Dashboard):
//    One-off product:  Price type = One time;    mode = "payment"
//    Subscription:     Price type = Recurring;   mode = "subscription"
//    No special product metadata needed — all routing goes through client_slug.
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_API    = "https://api.stripe.com/v1";

if (!STRIPE_SECRET) {
  console.warn("  ⚠  STRIPE_SECRET_KEY not set — checkout session creation will fail.");
}

/**
 * Create a Stripe Checkout Session.
 *
 * @param {object} opts
 * @param {string}  opts.clientSlug  — Mr Pain PT client slug (becomes metadata.client_slug)
 * @param {string}  opts.priceId     — Stripe Price ID (price_...)
 * @param {string}  opts.mode        — "payment" (one-off) or "subscription"
 * @param {string}  opts.successUrl  — redirect after successful payment
 * @param {string}  opts.cancelUrl   — redirect if customer abandons checkout
 * @param {string} [opts.expiryDate] — ISO YYYY-MM-DD; stored in metadata, sets access expiry
 * @param {string} [opts.customerEmail] — pre-fill email in checkout form
 *
 * @returns {Promise<{ id: string, url: string }>}
 */
async function createCheckoutSession({ clientSlug, priceId, mode, successUrl, cancelUrl, expiryDate, customerEmail }) {
  if (!STRIPE_SECRET) throw new Error("STRIPE_SECRET_KEY not configured");
  if (!clientSlug)    throw new Error("clientSlug is required");
  if (!priceId)       throw new Error("priceId is required");
  if (!mode)          throw new Error("mode is required");
  if (!successUrl)    throw new Error("successUrl is required");
  if (!cancelUrl)     throw new Error("cancelUrl is required");

  const params = new URLSearchParams();

  params.append("mode",                                    mode);
  params.append("line_items[0][price]",                    priceId);
  params.append("line_items[0][quantity]",                 "1");
  params.append("success_url",                             successUrl);
  params.append("cancel_url",                              cancelUrl);

  // ── Session metadata — primary lookup key for all webhook events ──────────
  params.append("metadata[client_slug]",   clientSlug);
  params.append("metadata[product_type]",  mode === "payment" ? "one_off" : "subscription");
  if (expiryDate) params.append("metadata[expiry_date]", expiryDate);

  // ── Mode-specific metadata propagation ───────────────────────────────────
  // Subscriptions: copy client_slug onto the subscription object itself.
  // Required because subscription events (subscription.created etc.) don't
  // carry the checkout session's metadata — only the subscription's metadata.
  if (mode === "subscription") {
    params.append("subscription_data[metadata][client_slug]",  clientSlug);
    params.append("subscription_data[metadata][product_type]", "subscription");
    if (expiryDate) params.append("subscription_data[metadata][expiry_date]", expiryDate);
  }

  // One-off payments: copy client_slug onto the payment intent.
  if (mode === "payment") {
    params.append("payment_intent_data[metadata][client_slug]",  clientSlug);
    params.append("payment_intent_data[metadata][product_type]", "one_off");
  }

  if (customerEmail) params.append("customer_email", customerEmail);

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET}`,
      "Content-Type":  "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const data = await res.json();

  if (!res.ok) {
    const err = Object.assign(
      new Error(data.error?.message || `Stripe API ${res.status}`),
      { status: res.status, stripe: data.error }
    );
    throw err;
  }

  return { id: data.id, url: data.url };
}

module.exports = { createCheckoutSession };

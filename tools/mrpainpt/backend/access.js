// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Server-side access resolution
//
//  This is the authoritative access computation.
//  It mirrors the logic in scripts/shared/access.js (client-side AccessGuard)
//  but runs on the server where it cannot be bypassed.
//
//  Returned by GET /api/clients/:slug as `access` block.
//  Frontend AccessGuard UI states still apply — the source of truth is now
//  server-resolved rather than computed from the raw program.access fields.
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const MESSAGES = {
  expired: {
    subscription:     { heading: "Subscription Ended",   body: "Your coaching subscription has ended. Renew to continue accessing your program.", cta: "Contact Your Coach" },
    one_off_purchase: { heading: "Access Expired",        body: "Your program access period has ended. Contact your coach to discuss next steps.",  cta: "Contact Your Coach" },
    trial:            { heading: "Trial Ended",           body: "Your free trial has ended. Purchase a program or subscription to continue.",       cta: "Get Full Access"    },
    _default:         { heading: "Access Expired",        body: "Your access has expired. Please contact your coach.",                              cta: "Contact Your Coach" },
  },
  suspended: {
    _default: { heading: "Access Suspended", body: "Your access has been temporarily suspended. Contact your coach to resolve this.", cta: "Contact Your Coach" },
  },
  pending: {
    _default: { heading: "Program Pending", body: "Your program is being set up and will be available soon.", cta: "Check Back Soon" },
  },
};

/**
 * Resolve access entitlement from a program.access block + payment fields.
 *
 * This runs on the server and is the authoritative access decision.
 * The frontend AccessGuard reads the resolved block from GET /api/clients/:slug
 * and cannot independently override it.
 *
 * ExpiryDate enforcement:
 *   If payment.expiryDate is set (trials, fixed-term) and the current date is
 *   past it, status is forced to "expired" regardless of the stored value.
 *   This prevents stale "active" records after a trial ends.
 *
 * @param {object} accessBlock  — program?.access  { type, status }
 * @param {object} [payment]    — payment fields from clients row
 * @returns AccessDecision = { type, status, allowed, reason, heading, body, cta }
 */
function resolve(accessBlock, payment) {
  let { status, type } = accessBlock || {};

  // ── ExpiryDate enforcement ────────────────────────────────────────────────
  // Auto-expire when expiryDate is set and has passed.
  // This is the key server-side enforcement step that client-side cannot replicate.
  if (payment?.expiryDate && status === "active") {
    const now    = new Date().toISOString().split("T")[0];
    const expiry = payment.expiryDate;
    if (now > expiry) {
      console.log(`[access] ${type || "?"} expiry enforced: ${expiry} < ${now}`);
      status = "expired";
    }
  }

  if (!status || status === "active") {
    return { type: type || null, status: status || "active", allowed: true, reason: null, heading: null, body: null, cta: null };
  }

  const group = MESSAGES[status];
  if (!group) {
    // Unknown status — allow (conservative; prevents accidental lockouts)
    return { type: type || null, status, allowed: true, reason: null, heading: null, body: null, cta: null };
  }

  const msg = group[type] || group._default;
  return {
    type:    type    || null,
    status,
    allowed: false,
    reason:  status,
    heading: msg.heading,
    body:    msg.body,
    cta:     msg.cta,
  };
}

module.exports = { resolve };

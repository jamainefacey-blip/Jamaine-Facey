// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Auth Middleware
//  ─────────────────────────────────────────────────────────────────────────────
//
//  API-key authentication for coach/admin write operations.
//  Uses Bearer token scheme:  Authorization: Bearer <COACH_API_KEY>
//
//  Protected routes (require valid key):
//    GET    /api/clients          — admin list
//    POST   /api/clients          — create
//    PUT    /api/clients/:slug    — update
//    DELETE /api/clients/:slug    — soft-delete
//
//  Intentionally PUBLIC (no auth required):
//    GET  /api/health             — liveness (safe, no data)
//    GET  /api/clients/:slug      — client reads their own program data
//    POST /api/webhooks/stripe    — Stripe verifies via signature, not Bearer token
//
//  Development mode (NODE_ENV=development, COACH_API_KEY not set):
//    Allows all requests and emits a console warning.
//    This makes local dev frictionless without a configured key.
//    NEVER deploy with COACH_API_KEY unset.
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const CONFIGURED_KEY = process.env.COACH_API_KEY || "";
const IS_DEV         = process.env.NODE_ENV !== "production";

if (!CONFIGURED_KEY) {
  if (IS_DEV) {
    console.warn("\n  ⚠  COACH_API_KEY is not set.");
    console.warn("     All write routes are UNPROTECTED in development mode.");
    console.warn("     Set COACH_API_KEY in .env before deploying.\n");
  } else {
    // In production with no key configured, refuse to start.
    console.error("\n  ✗  FATAL: COACH_API_KEY must be set in production.\n");
    process.exit(1);
  }
}

/**
 * Express middleware: requireAuth
 *
 * Extracts the Bearer token from the Authorization header and compares
 * it to COACH_API_KEY using a constant-time comparison to prevent
 * timing attacks.
 *
 * In development with no key configured, warns and passes through.
 */
function requireAuth(req, res, next) {
  // Dev convenience: pass through when key is not configured
  if (!CONFIGURED_KEY && IS_DEV) {
    req._authDevBypass = true;
    return next();
  }

  const header = req.headers["authorization"] || "";
  const match  = header.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({
      error:   "Unauthorized",
      message: "Authorization: Bearer <key> header is required.",
    });
  }

  const provided = match[1];

  // Constant-time comparison prevents timing attacks that could leak the key
  const crypto      = require("crypto");
  const providedBuf = Buffer.from(provided,      "utf8");
  const expectedBuf = Buffer.from(CONFIGURED_KEY, "utf8");

  if (
    providedBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(providedBuf, expectedBuf)
  ) {
    return res.status(403).json({
      error:   "Forbidden",
      message: "Invalid API key.",
    });
  }

  next();
}

module.exports = { requireAuth };

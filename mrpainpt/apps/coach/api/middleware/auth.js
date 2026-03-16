// ─────────────────────────────────────────────────────────────────────────────
// AUTH MIDDLEWARE — JWT bearer token verification
//
// Wraps a route handler with auth enforcement. Called from api/functions/api.js
// at route registration time (not inside the route handler itself), so route
// files stay clean and free of auth concerns:
//
//   router.get('/api/clients', requireAuth(clientsRoute.list));
//
// Token format: Authorization: Bearer <jwt>
//
// On success: req.coach is populated with the decoded payload and the inner
//   handler is called.
// On failure: returns { status: 401, body: { error } } immediately — the
//   inner handler is never called.
//
// JWT_SECRET environment variable:
//   Set in Netlify dashboard under Site settings → Environment variables.
//   The fallback is ONLY for local development (netlify dev). Any production
//   deploy without the env var set will log a warning at cold start.
//
// Generic by design: req.coach carries { sub, name, email, role } — not
// rehab-specific. Future module types (nutrition, sport, etc.) use the same
// middleware. Multi-coach and multi-role assignment are not blocked by this
// design.
//
// Video module guard rail: req.coach.sub (coachId) is available to future
// video route handlers for signing upload URLs and scoping review access.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

var jwt = require('jsonwebtoken');

var JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // Warn once per cold start — not per request.
  // Production deploys must set JWT_SECRET in Netlify env vars.
  console.warn(
    '[auth] JWT_SECRET environment variable is not set. ' +
    'Using insecure development fallback. ' +
    'Set JWT_SECRET in Netlify Site settings → Environment variables before going live.'
  );
  JWT_SECRET = 'dev-secret-pain-system-do-not-use-in-production';
}

/**
 * Wraps a route handler with JWT auth enforcement.
 *
 * @param  {Function} handler  async function(req) → { status, body }
 * @return {Function}          async function(req) → { status, body }
 */
module.exports.requireAuth = function requireAuth(handler) {
  return async function authGuard(req) {
    var authHeader = (req.headers['authorization'] || req.headers['Authorization'] || '').trim();

    if (!authHeader.startsWith('Bearer ')) {
      return {
        status: 401,
        body: { error: 'Authentication required — provide a Bearer token in the Authorization header' },
      };
    }

    var token = authHeader.slice(7).trim();
    if (!token) {
      return { status: 401, body: { error: 'Authentication required — token is empty' } };
    }

    var decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return {
          status: 401,
          body: { error: 'Session expired — please sign in again', code: 'TOKEN_EXPIRED' },
        };
      }
      return {
        status: 401,
        body: { error: 'Invalid authentication token', code: 'TOKEN_INVALID' },
      };
    }

    // Attach decoded payload to req so downstream handlers can read coach identity.
    // decoded: { sub, name, email, credentials, role, iat, exp }
    req.coach = decoded;

    return handler(req);
  };
};

// Expose JWT_SECRET and jwt for use in routes/auth.js (avoids re-declaring the same constants).
module.exports.JWT_SECRET = function getSecret() { return JWT_SECRET; };
module.exports.jwt = jwt;

// ─────────────────────────────────────────────────────────────────────────────
// AUTH ROUTES
//
//   POST /api/auth/login    — verify credentials, issue JWT
//   POST /api/auth/logout   — stateless; client clears sessionStorage
//   GET  /api/auth/me       — return current coach identity (requireAuth applied
//                             at registration in api/functions/api.js)
//
// Storage: api/db/users.json — a flat JSON file containing seeded coach accounts.
//   No external database. Phase 4 only. This is adequate for a single-coach
//   deployment and straightforward to migrate to a real DB later.
//
// Password hashing: bcryptjs (10 rounds). All comparisons use bcrypt.compare()
//   (async) to avoid blocking the event loop during a hash check.
//
// JWT payload shape:
//   {
//     sub:         string  — stable coachId (UUID from users.json)
//     name:        string  — display name
//     email:       string  — login identifier
//     credentials: string  — professional credentials (e.g. "DPT, CSCS")
//     role:        string  — 'coach' | future: 'admin', 'client'
//     iat:         number  — issued-at epoch (set by jsonwebtoken)
//     exp:         number  — expiry epoch (set by jsonwebtoken)
//   }
//
// Token expiry: 8 hours (28800 s). Appropriate for a coach workday session.
//   The client browser stores the token in sessionStorage (cleared on tab close).
//   No refresh token in Phase 4 — coach re-signs in after expiry.
//
// Security notes:
//   - Invalid credential errors are deliberately generic (do not reveal whether
//     the email exists or the password was wrong — prevents user enumeration).
//   - Logout is stateless (JWT is not blacklisted). The client clears sessionStorage.
//     In a future phase, a token revocation list (Redis / DB) can be added without
//     changing the API contract.
//
// Generic by design: 'role' field in JWT supports future roles (admin, nutritionist,
//   sport coach, etc.) without a schema change.
// Video guard rail: coachId (sub) in JWT payload will be used by the future video
//   upload route to scope signed upload URLs and review access.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

var fs   = require('fs');
var path = require('path');
var bcrypt = require('bcryptjs');

// Re-use jwt + JWT_SECRET from auth middleware (single source of truth for the secret).
var authMiddleware = require('../middleware/auth');
var jwt        = authMiddleware.jwt;
var getSecret  = authMiddleware.JWT_SECRET; // function that returns the resolved secret

var USERS_PATH = path.resolve(__dirname, '../db/users.json');
var TOKEN_TTL  = 60 * 60 * 8; // 8 hours in seconds

// Load users once per warm function instance.
var _users = null;
function getUsers() {
  if (_users) return _users;
  _users = JSON.parse(fs.readFileSync(USERS_PATH, 'utf8'));
  return _users;
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────

/**
 * Verify email + password and issue a JWT on success.
 *
 * Request body:  { email: string, password: string }
 * Response 200:  { token: string, coach: { id, name, email, credentials, role } }
 * Response 400:  { error }  — missing fields
 * Response 401:  { error }  — invalid credentials (generic message, no enumeration)
 * Response 500:  { error }  — internal error
 */
module.exports.login = async function login(req) {
  var body = req.body;

  if (!body || typeof body.email !== 'string' || typeof body.password !== 'string') {
    return { status: 400, body: { error: 'Request body must include email and password' } };
  }

  var email    = body.email.trim().toLowerCase();
  var password = body.password;

  if (!email || !password) {
    return { status: 400, body: { error: 'Email and password are required' } };
  }

  var users = getUsers();
  var coach = null;
  for (var i = 0; i < users.coaches.length; i++) {
    if (users.coaches[i].email.toLowerCase() === email) {
      coach = users.coaches[i];
      break;
    }
  }

  // Time-constant comparison path: always run bcrypt.compare so timing does not
  // reveal whether the email exists (prevents user enumeration via timing).
  var hashToCompare = coach ? coach.passwordHash : '$2a$10$invalidhashpaddingtomaintaintiming0000000000000000000';
  var passwordMatch;
  try {
    passwordMatch = await bcrypt.compare(password, hashToCompare);
  } catch (err) {
    console.error('[auth/login] bcrypt.compare error:', err.message);
    return { status: 500, body: { error: 'Internal authentication error' } };
  }

  if (!coach || !passwordMatch) {
    return { status: 401, body: { error: 'Invalid email or password' } };
  }

  var payload = {
    sub:         coach.id,
    name:        coach.name,
    email:       coach.email,
    credentials: coach.credentials,
    role:        coach.role || 'coach',
  };

  var token;
  try {
    token = jwt.sign(payload, getSecret(), { expiresIn: TOKEN_TTL });
  } catch (err) {
    console.error('[auth/login] jwt.sign error:', err.message);
    return { status: 500, body: { error: 'Failed to issue session token' } };
  }

  return {
    status: 200,
    body: {
      token: token,
      coach: {
        id:          coach.id,
        name:        coach.name,
        email:       coach.email,
        credentials: coach.credentials,
        role:        coach.role || 'coach',
      },
    },
  };
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

/**
 * Stateless logout. The JWT is not server-side blacklisted in Phase 4.
 * Returning 200 signals the client to clear its sessionStorage token.
 *
 * A future phase can add token revocation (Redis blocklist) here without
 * changing the client-facing API contract.
 *
 * Response 200: { message }
 */
module.exports.logout = async function logout(req) {
  return {
    status: 200,
    body: { message: 'Signed out successfully' },
  };
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

/**
 * Return the authenticated coach's identity from the JWT payload.
 * requireAuth middleware in api/functions/api.js populates req.coach.
 *
 * Response 200: { coach: { id, name, email, credentials, role } }
 */
module.exports.me = async function me(req) {
  var coach = req.coach; // set by requireAuth middleware
  return {
    status: 200,
    body: {
      coach: {
        id:          coach.sub,
        name:        coach.name,
        email:       coach.email,
        credentials: coach.credentials,
        role:        coach.role,
      },
    },
  };
};

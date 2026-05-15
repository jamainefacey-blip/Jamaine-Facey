/**
 * VST User API Handlers — Phase 3.2
 *
 * POST /v1/users/register
 * POST /v1/users/login
 * GET  /v1/users/me
 * PATCH /v1/users/me
 */
'use strict';
const { UserStore, jwt, checkPassword } = require('./user-store');

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function json(res, status, body) {
  const buf = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(buf) });
  res.end(buf);
}

/* ── POST /v1/users/register ────────────────────────────────────────────── */
async function handleRegister(req, res) {
  let body;
  try { body = await readBody(req); }
  catch (e) { json(res, 400, { error: 'invalid_request', message: 'Request body must be valid JSON.' }); return; }

  const { email, password, full_name, terms_accepted } = body;

  if (!email || !email.includes('@')) {
    json(res, 400, { error: 'validation_error', message: 'A valid email address is required.' }); return;
  }
  if (!password || password.length < 8) {
    json(res, 400, { error: 'validation_error', message: 'Password must be at least 8 characters.' }); return;
  }
  if (!terms_accepted) {
    json(res, 400, { error: 'validation_error', message: 'You must accept the Terms of Service to register.' }); return;
  }

  let user;
  try {
    user = UserStore.create({ email: email.trim(), password, full_name: (full_name || '').trim(), termsAccepted: true });
  } catch (e) {
    if (e.message === 'EMAIL_TAKEN') {
      json(res, 409, { error: 'email_taken', message: 'An account with this email already exists.' }); return;
    }
    json(res, 500, { error: 'internal_error', message: 'Registration failed. Please try again.' }); return;
  }

  const token = jwt.sign({ sub: user.id, email: user.identity.email, tier: user.tier });
  json(res, 201, {
    token,
    user: UserStore.toPublicProfile(user),
  });
}

/* ── POST /v1/users/login ───────────────────────────────────────────────── */
async function handleLogin(req, res) {
  let body;
  try { body = await readBody(req); }
  catch (e) { json(res, 400, { error: 'invalid_request', message: 'Request body must be valid JSON.' }); return; }

  const { email, password } = body;
  if (!email || !password) {
    json(res, 400, { error: 'validation_error', message: 'Email and password are required.' }); return;
  }

  const user = UserStore.findByEmail(email.trim());
  if (!user || !checkPassword(password, user.password_hash, user.password_salt)) {
    /* Intentionally vague — do not confirm whether email exists */
    json(res, 401, { error: 'invalid_credentials', message: 'Incorrect email or password.' }); return;
  }

  if (user.deleted_at) {
    json(res, 403, { error: 'account_deleted', message: 'This account has been deactivated.' }); return;
  }

  UserStore.touchLogin(user.id);
  const token = jwt.sign({ sub: user.id, email: user.identity.email, tier: user.tier });
  json(res, 200, {
    token,
    user: UserStore.toPublicProfile(user),
  });
}

/* ── GET /v1/users/me ───────────────────────────────────────────────────── */
async function handleGetMe(req, res) {
  let claims;
  try { claims = jwt.fromHeader(req.headers['authorization']); }
  catch (e) { json(res, 401, { error: 'unauthorized', message: 'Valid bearer token required.' }); return; }

  const user = UserStore.findById(claims.sub);
  if (!user) { json(res, 404, { error: 'not_found', message: 'User not found.' }); return; }

  json(res, 200, UserStore.toPublicProfile(user));
}

/* ── PATCH /v1/users/me ─────────────────────────────────────────────────── */
async function handlePatchMe(req, res) {
  let claims;
  try { claims = jwt.fromHeader(req.headers['authorization']); }
  catch (e) { json(res, 401, { error: 'unauthorized', message: 'Valid bearer token required.' }); return; }

  let patch;
  try { patch = await readBody(req); }
  catch (e) { json(res, 400, { error: 'invalid_request', message: 'Request body must be valid JSON.' }); return; }

  let user;
  try { user = UserStore.update(claims.sub, patch); }
  catch (e) { json(res, 404, { error: 'not_found', message: 'User not found.' }); return; }

  json(res, 200, UserStore.toPublicProfile(user));
}

module.exports = { handleRegister, handleLogin, handleGetMe, handlePatchMe };

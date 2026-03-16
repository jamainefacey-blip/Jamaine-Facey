// ─────────────────────────────────────────────────────────────────────────────
// PAIN SYSTEM COACH API — NETLIFY FUNCTION ENTRY POINT
//
// All /api/* requests are proxied here by mrpainpt/apps/coach/netlify.toml.
// This file wires the URL router and registers all active routes.
//
// No framework. No external HTTP library. Pure Node.js + Netlify Function
// handler contract (exports.handler).
//
// ROUTE REGISTRY
// ──────────────
// CP6 (read-only, no auth — complete):
//   GET  /api/clients             coach client roster        [requireAuth]
//   GET  /api/client/:slug        single client full data    [requireAuth]
//
// CP7 (auth — current):
//   POST /api/auth/login          issue JWT (public)
//   POST /api/auth/logout         clear session (public)
//   GET  /api/auth/me             return coach identity      [requireAuth]
//
// CP9 (notes persistence — added in CP9, not yet active):
//   GET  /api/client/:slug/notes
//   POST /api/client/:slug/notes
//
// CP10 (session logging — added in CP10, not yet active):
//   GET  /api/client/:slug/sessions
//   POST /api/client/:slug/session
//
// VIDEO MODULE (future — not in Phase 4):
//   POST /api/client/:slug/videos         async upload (get signed URL)
//   GET  /api/client/:slug/videos         list recordings
//   PATCH /api/client/:slug/notes/:id     attach videoRef to note
//   PATCH /api/client/:slug/sessions/:ref attach videoRef to session
//
// ROUTE ORDER NOTE
// ─────────────────
// More specific patterns must be registered before less specific ones.
// /api/client/:slug/notes  must come before  /api/client/:slug
// The router matches in registration order and stops at first match.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const router         = require('../router');
const { requireAuth } = require('../middleware/auth');
const authRoute      = require('../routes/auth');
const clientsRoute   = require('../routes/clients');
const clientRoute    = require('../routes/client');

// ── Route registration ────────────────────────────────────────────────────────
// Auth routes are public (no requireAuth wrapper).
// All data routes are protected (wrapped with requireAuth).
// More-specific patterns must appear before less-specific ones.

// Public auth routes
router.post('/api/auth/login',   authRoute.login);
router.post('/api/auth/logout',  authRoute.logout);
router.get('/api/auth/me',       requireAuth(authRoute.me));

// Protected data routes — CP9/CP10 sub-resource routes go above these
router.get('/api/clients',       requireAuth(clientsRoute.list));
router.get('/api/client/:slug',  requireAuth(clientRoute.get));

// ── CORS headers ──────────────────────────────────────────────────────────────
// In production the coach portal and API share the same Netlify origin.
// In local development (netlify dev), both run on different ports — CORS
// headers allow the browser to reach the function from the SPA port.
var CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

var JSON_HEADERS = Object.assign({ 'Content-Type': 'application/json' }, CORS_HEADERS);

// ── Netlify Function handler ───────────────────────────────────────────────────
exports.handler = async function handler(event) {
  var method  = event.httpMethod;
  var urlPath = event.path;

  // CORS preflight — browsers send OPTIONS before cross-origin requests
  if (method === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  // Parse request body (POST / PATCH / PUT)
  var body = null;
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (_) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ error: 'Request body is not valid JSON' }),
      };
    }
  }

  var req = {
    method:  method,
    path:    urlPath,
    body:    body,
    headers: event.headers || {},
    params:  {}, // populated by router.dispatch before calling handler
  };

  var result;
  try {
    result = await router.dispatch(method, urlPath, req);
  } catch (err) {
    console.error('[api] Unhandled route error on', method, urlPath, ':', err.message);
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }

  return {
    statusCode: result.status || 200,
    headers:    JSON_HEADERS,
    body:       JSON.stringify(result.body),
  };
};

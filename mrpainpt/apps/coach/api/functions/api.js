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
// CP6 (read-only, no auth — current):
//   GET  /api/clients             coach client roster
//   GET  /api/client/:slug        single client full data set
//
// CP7 (auth — added in CP7, not yet active):
//   POST /api/auth/login
//   POST /api/auth/logout
//   GET  /api/auth/me
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

const router      = require('../router');
const clientsRoute = require('../routes/clients');
const clientRoute  = require('../routes/client');

// ── Route registration ────────────────────────────────────────────────────────
// Specific sub-resource routes will be registered here in CP9/CP10.
// Keep more-specific patterns above less-specific ones.

router.get('/api/clients',       clientsRoute.list);
router.get('/api/client/:slug',  clientRoute.get);

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

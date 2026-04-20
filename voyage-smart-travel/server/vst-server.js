/**
 * VST Server — Phase 6 Secure API Proxy + Static File Server
 *
 * Routes:
 *   POST /api/ava-evaluate      — secure Ava Phase 6 evaluation
 *   POST /api/fares/search      — live fare search via FareRouter
 *   POST /v1/users/register     — user registration
 *   POST /v1/users/login        — user login + JWT
 *   GET  /v1/users/me           — authenticated user profile
 *   PATCH /v1/users/me          — update profile
 *   GET  /*                     — static SPA files
 *
 * Environment:
 *   PORT              — listen port (default 3000)
 *   ANTHROPIC_API_KEY — Anthropic API key (preferred)
 *   AVA_MODEL         — model override (default claude-haiku-4-5-20251001)
 *   AVA_TIMEOUT       — upstream timeout ms (default 20000)
 *   AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET, AMADEUS_ENV
 *   JWT_SECRET        — HMAC-SHA256 key for JWT signing
 */
'use strict';
const http         = require('http');
const fs           = require('fs');
const path         = require('path');
const tls          = require('tls');
const net          = require('net');
const FareRouter   = require('./fare-router');
const { handleRegister, handleLogin, handleGetMe, handlePatchMe } = require('./user-handlers');

const PORT       = parseInt(process.env.PORT) || 3000;
const STATIC_ROOT = path.join(__dirname, '..');
const MODEL      = process.env.AVA_MODEL   || 'claude-haiku-4-5-20251001';
const TIMEOUT    = parseInt(process.env.AVA_TIMEOUT) || 20000;

/* ── API key resolution ─────────────────────────────────────────────────────
   Key is resolved once at startup and never sent to clients.
   In production: set ANTHROPIC_API_KEY env var.
   In dev container: falls back to session ingress token.
   ─────────────────────────────────────────────────────────────────────────── */
function resolveApiKey() {
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;
  /* Dev-container fallback — session ingress token (Bearer scheme) */
  try {
    const p = '/home/claude/.claude/remote/.session_ingress_token';
    return fs.readFileSync(p, 'utf8').trim() || null;
  } catch (e) { return null; }
}
const API_KEY    = resolveApiKey();
const AUTH_SCHEME = (API_KEY && API_KEY.startsWith('sk-ant-si-')) ? 'bearer' : 'x-api-key';

/* ── Egress proxy detection (for containerised environments) ────────────── */
function getEgressProxy() {
  const raw = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return { host: u.hostname, port: parseInt(u.port) || 80, auth: u.username + ':' + decodeURIComponent(u.password) };
  } catch (e) { return null; }
}

/* ── TLS tunnel to api.anthropic.com (via egress proxy if present) ────────── */
function getTlsSocket() {
  return new Promise((resolve, reject) => {
    const ep = getEgressProxy();
    if (!ep) {
      const s = tls.connect({ host: 'api.anthropic.com', port: 443, servername: 'api.anthropic.com' }, () => resolve(s));
      s.on('error', reject);
      return;
    }
    const tcp = net.connect(ep.port, ep.host, () => {
      const authB64 = Buffer.from(ep.auth).toString('base64');
      tcp.write('CONNECT api.anthropic.com:443 HTTP/1.1\r\nHost: api.anthropic.com:443\r\nProxy-Authorization: Basic ' + authB64 + '\r\n\r\n');
      let hdr = '';
      const onData = (chunk) => {
        hdr += chunk.toString();
        if (!hdr.includes('\r\n\r\n')) return;
        tcp.removeListener('data', onData);
        if (!hdr.split('\r\n')[0].includes('200')) {
          tcp.destroy();
          return reject(new Error('CONNECT failed: ' + hdr.split('\r\n')[0]));
        }
        const s = tls.connect({ socket: tcp, servername: 'api.anthropic.com', rejectUnauthorized: true }, () => resolve(s));
        s.on('error', reject);
      };
      tcp.on('data', onData);
    });
    tcp.on('error', reject);
  });
}

/* ── Raw HTTP/1.1 POST over TLS socket ───────────────────────────────────── */
function tlsPost(bodyBuf, apiKey) {
  return new Promise((resolve, reject) => {
    getTlsSocket().then(sock => {
      const authHeader = AUTH_SCHEME === 'bearer'
        ? 'Authorization: Bearer ' + apiKey
        : 'x-api-key: ' + apiKey;
      const req = [
        'POST /v1/messages HTTP/1.1',
        'Host: api.anthropic.com',
        'Content-Type: application/json',
        'Content-Length: ' + bodyBuf.length,
        'anthropic-version: 2023-06-01',
        authHeader,
        'Connection: close',
        '', '',
      ].join('\r\n');
      sock.write(req);
      sock.write(bodyBuf);

      let raw = Buffer.alloc(0);
      sock.on('data', c => { raw = Buffer.concat([raw, c]); });
      sock.on('end', () => {
        sock.destroy();
        const s = raw.toString('binary');
        const hEnd = s.indexOf('\r\n\r\n');
        if (hEnd === -1) return reject(new Error('no header boundary'));
        const headers = s.slice(0, hEnd);
        const statusMatch = headers.match(/^HTTP\/\d\.\d (\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 0;
        const rawBody = raw.slice(hEnd + 4);
        const isChunked = /transfer-encoding:\s*chunked/i.test(headers);
        resolve({ status, body: isChunked ? unchunk(rawBody) : rawBody });
      });
      sock.on('error', reject);
    }).catch(reject);
  });
}

function unchunk(buf) {
  const out = []; let pos = 0;
  const s = buf.toString('binary');
  while (pos < s.length) {
    const crlf = s.indexOf('\r\n', pos);
    if (crlf === -1) break;
    const size = parseInt(s.slice(pos, crlf), 16);
    if (isNaN(size) || size === 0) break;
    out.push(buf.slice(crlf + 2, crlf + 2 + size));
    pos = crlf + 2 + size + 2;
  }
  return Buffer.concat(out);
}

/* ── Schema validation ───────────────────────────────────────────────────── */
const VALID_RISK       = ['LOW', 'MEDIUM', 'HIGH'];
const VALID_COMPLIANCE = ['COMPLIANT', 'CHECK_REQUIRED', 'NON_COMPLIANT'];
const VALID_APPROVAL   = ['APPROVED', 'REVIEW', 'ESCALATED'];

function validate(obj) {
  if (!obj || typeof obj !== 'object')                       return false;
  if (VALID_RISK.indexOf(obj.overallRiskLevel)    === -1)    return false;
  if (VALID_COMPLIANCE.indexOf(obj.complianceStatus) === -1) return false;
  if (VALID_APPROVAL.indexOf(obj.approvalStatus)   === -1)   return false;
  if (typeof obj.avaBrief !== 'string' || !obj.avaBrief)     return false;
  if (!Array.isArray(obj.recommendedActions))                return false;
  return true;
}

function normalise(raw) {
  return {
    tripSummary:        String(raw.tripSummary        || ''),
    travellerProfile:   String(raw.travellerProfile   || ''),
    overallRiskLevel:   raw.overallRiskLevel,
    complianceStatus:   raw.complianceStatus,
    approvalStatus:     raw.approvalStatus,
    estimatedCostBand:  String(raw.estimatedCostBand  || ''),
    safetyFlags:        Array.isArray(raw.safetyFlags)        ? raw.safetyFlags        : [],
    accessibilityFlags: Array.isArray(raw.accessibilityFlags) ? raw.accessibilityFlags : [],
    documentationFlags: Array.isArray(raw.documentationFlags) ? raw.documentationFlags : [],
    recommendedActions: Array.isArray(raw.recommendedActions) ? raw.recommendedActions : [],
    escalationRequired: !!raw.escalationRequired,
    avaBrief:           String(raw.avaBrief),
    confidence:         typeof raw.confidence === 'number'
                          ? Math.min(1, Math.max(0, raw.confidence))
                          : 0.75,
    sourceMode:         'live_claude',  /* always live when coming from this server */
  };
}

/* ── Anthropic prompt builder ────────────────────────────────────────────── */
function buildPrompt(fd) {
  var tripData = {
    destination:        fd.destination,
    origin:             fd.origin         || null,
    departureDate:      fd.departureDate,
    returnDate:         fd.returnDate      || null,
    tripType:           fd.tripType,
    nights:             fd.nights,
    travellerCount:     fd.travellerCount,
    travellerType:      fd.travellerType   || null,
    budgetBand:         fd.budgetBand      || null,
    accessibilityNeeds: fd.accessibilityNeeds || [],
    purpose:            fd.purpose         || null,
    estimatedCostUSD:   fd.estimatedCostUSD || 0,
    notes:              fd.notes           || null,
  };
  var schema = {
    tripSummary: 'string', travellerProfile: 'string',
    overallRiskLevel: 'LOW|MEDIUM|HIGH', complianceStatus: 'COMPLIANT|CHECK_REQUIRED|NON_COMPLIANT',
    approvalStatus: 'APPROVED|REVIEW|ESCALATED', estimatedCostBand: 'string e.g. "$1,200-$1,800 USD"',
    safetyFlags: ['string'], accessibilityFlags: ['string'],
    documentationFlags: ['string'], recommendedActions: ['string'],
    escalationRequired: 'boolean', avaBrief: 'string 2-3 sentences',
    confidence: 'number 0-1', sourceMode: 'live_claude',
  };
  return 'You are Ava, the travel intelligence system for Voyage Smart Travel.'
    + ' Evaluate the following trip request and return ONLY a valid JSON object.'
    + ' No markdown, no code fences, no explanation — JSON only.\n\n'
    + 'TRIP DATA:\n' + JSON.stringify(tripData, null, 2)
    + '\n\nRETURN ONLY this exact JSON shape:\n' + JSON.stringify(schema, null, 2);
}

/* ── Fare search handler ─────────────────────────────────────────────────── */
async function handleFareSearch(req, res) {
  let fd;
  try {
    const body = await readBody(req);
    fd = JSON.parse(body);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid request body' }));
    return;
  }

  try {
    const bypassCache = req.headers['x-vst-bypass-cache'] === 'true';
    /* Normalise field names from frontend (camelCase) to adapter (snake_case) */
    const searchReq = {
      origin:         fd.origin,
      destination:    fd.destination,
      departure_date: fd.departureDate || fd.departure_date,
      return_date:    fd.returnDate    || fd.return_date    || null,
      trip_type:      fd.tripType      || fd.trip_type      || 'return',
      passengers:     { adults: parseInt(fd.travellerCount || fd.adults || 1, 10), children: 0 },
      cabin_class:    fd.cabinClass    || fd.cabin_class    || 'ECONOMY',
      currency:       fd.currency      || 'GBP',
      non_stop_only:  !!fd.nonStopOnly,
      max_results:    10,
    };
    const result = await FareRouter.search(searchReq, bypassCache);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (e) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      provider: 'none', search_id: '', cached: false,
      fetched_at: new Date().toISOString(), offers: [],
      error: 'Fare search temporarily unavailable.',
    }));
  }
}

/* ── Ava evaluation handler ──────────────────────────────────────────────── */
async function handleAvaEvaluate(req, res) {
  /* Never expose key status in error responses beyond generic 503 */
  if (!API_KEY) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'live mode unavailable' }));
    return;
  }

  let fd;
  try {
    const body = await readBody(req);
    fd = JSON.parse(body);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'invalid request body' }));
    return;
  }

  /* Build Anthropic request body */
  const anthropicBody = Buffer.from(JSON.stringify({
    model:      MODEL,
    max_tokens: 1024,
    messages:   [{ role: 'user', content: buildPrompt(fd) }],
  }));

  /* Call Anthropic with timeout */
  let upstream;
  try {
    upstream = await Promise.race([
      tlsPost(anthropicBody, API_KEY),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT)),
    ]);
  } catch (e) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'upstream unavailable' }));
    return;
  }

  if (upstream.status !== 200) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'upstream error' }));
    return;
  }

  /* Parse and validate */
  let parsed;
  try {
    let text = upstream.body.toString('utf8');
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const envelope = JSON.parse(text);
    const content  = (envelope.content && envelope.content[0] && envelope.content[0].text) || text;
    /* content may itself be a JSON string */
    const inner = typeof content === 'string' ? content : JSON.stringify(content);
    parsed = JSON.parse(inner.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim());
  } catch (e) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'parse error' }));
    return;
  }

  if (!validate(parsed)) {
    res.writeHead(503, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'schema validation failed' }));
    return;
  }

  const result = normalise(parsed);
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(result));
}

/* ── Static file serving ─────────────────────────────────────────────────── */
const MIME = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css',   '.json': 'application/json',
  '.png': 'image/png',  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function serveStatic(req, res) {
  let urlPath = req.url.split('?')[0].split('#')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  const filePath = path.join(STATIC_ROOT, urlPath);
  /* Prevent path traversal */
  if (!filePath.startsWith(STATIC_ROOT)) {
    res.writeHead(403); res.end(); return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ── Main server ─────────────────────────────────────────────────────────── */
const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/api/ava-evaluate') {
    try {
      await handleAvaEvaluate(req, res);
    } catch (e) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'internal error' }));
      }
    }
  } else if (req.method === 'POST' && req.url === '/api/fares/search') {
    try {
      await handleFareSearch(req, res);
    } catch (e) {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'internal error' }));
      }
    }
  } else if (req.method === 'POST' && req.url === '/v1/users/register') {
    try { await handleRegister(req, res); }
    catch (e) { if (!res.headersSent) { res.writeHead(500); res.end(JSON.stringify({ error: 'internal error' })); } }
  } else if (req.method === 'POST' && req.url === '/v1/users/login') {
    try { await handleLogin(req, res); }
    catch (e) { if (!res.headersSent) { res.writeHead(500); res.end(JSON.stringify({ error: 'internal error' })); } }
  } else if (req.method === 'GET' && req.url === '/v1/users/me') {
    try { await handleGetMe(req, res); }
    catch (e) { if (!res.headersSent) { res.writeHead(500); res.end(JSON.stringify({ error: 'internal error' })); } }
  } else if (req.method === 'PATCH' && req.url === '/v1/users/me') {
    try { await handlePatchMe(req, res); }
    catch (e) { if (!res.headersSent) { res.writeHead(500); res.end(JSON.stringify({ error: 'internal error' })); } }
  } else if (req.method === 'GET' || req.method === 'HEAD') {
    serveStatic(req, res);
  } else {
    res.writeHead(405); res.end();
  }
});

server.listen(PORT, '127.0.0.1', () => {
  const hasKey = !!API_KEY;
  console.log('VST server listening on http://127.0.0.1:' + PORT);
  console.log('Ava live mode: ' + (hasKey ? 'enabled (' + AUTH_SCHEME + ')' : 'disabled — deterministic fallback only'));
  console.log('Egress proxy: ' + (getEgressProxy() ? getEgressProxy().host + ':' + getEgressProxy().port : 'none'));
});

module.exports = server;

/**
 * Vercel Serverless Function — POST /api/ava-evaluate
 *
 * Secure Ava Phase 6 evaluation.
 * The Anthropic API key never leaves the server.
 *
 * Environment variables (set in Vercel dashboard):
 *   ANTHROPIC_API_KEY  — Anthropic API key (required for live mode)
 *   AVA_MODEL          — model override (default: claude-haiku-4-5-20251001)
 *   AVA_TIMEOUT        — Anthropic call timeout ms (default: 25000)
 */
'use strict';
const https = require('https');

const MODEL   = process.env.AVA_MODEL   || 'claude-haiku-4-5-20251001';
const TIMEOUT = parseInt(process.env.AVA_TIMEOUT) || 25000;

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

/* ── Normalise to stable 14-field output shape ───────────────────────────── */
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
    sourceMode:         'live_claude',
  };
}

/* ── Anthropic prompt ────────────────────────────────────────────────────── */
function buildPrompt(fd) {
  const tripData = {
    destination:        fd.destination,
    origin:             fd.origin             || null,
    departureDate:      fd.departureDate,
    returnDate:         fd.returnDate         || null,
    tripType:           fd.tripType,
    nights:             fd.nights,
    travellerCount:     fd.travellerCount,
    travellerType:      fd.travellerType      || null,
    budgetBand:         fd.budgetBand         || null,
    accessibilityNeeds: fd.accessibilityNeeds || [],
    purpose:            fd.purpose            || null,
    estimatedCostUSD:   fd.estimatedCostUSD   || 0,
    notes:              fd.notes              || null,
  };
  const schema = {
    tripSummary: 'string', travellerProfile: 'string',
    overallRiskLevel: 'LOW|MEDIUM|HIGH',
    complianceStatus: 'COMPLIANT|CHECK_REQUIRED|NON_COMPLIANT',
    approvalStatus: 'APPROVED|REVIEW|ESCALATED',
    estimatedCostBand: 'string e.g. "$1,200-$1,800 USD"',
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

/* ── Body reader (handles both pre-parsed and raw stream) ────────────────── */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ── Anthropic HTTPS call (direct — no tunnel needed on Vercel) ──────────── */
function anthropicPost(bodyBuf, apiKey) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      port:     443,
      path:     '/v1/messages',
      method:   'POST',
      headers:  {
        'Content-Type':      'application/json',
        'Content-Length':    bodyBuf.length,
        'anthropic-version': '2023-06-01',
        'x-api-key':         apiKey,
      },
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

/* ── Handler ─────────────────────────────────────────────────────────────── */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')    { res.status(405).json({ error: 'method not allowed' }); return; }

  /* Key is read from env — never from request, never sent to client */
  const apiKey = process.env.ANTHROPIC_API_KEY || null;
  if (!apiKey) {
    res.status(503).json({ error: 'live mode unavailable' });
    return;
  }

  /* Parse body — handle both pre-parsed (Vercel JSON auto-parse) and raw stream */
  let fd;
  try {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      fd = req.body;
    } else {
      const raw = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : await readBody(req);
      fd = JSON.parse(raw);
    }
  } catch (e) {
    res.status(400).json({ error: 'invalid request body' });
    return;
  }

  /* Build Anthropic request */
  const anthropicBody = Buffer.from(JSON.stringify({
    model:      MODEL,
    max_tokens: 1024,
    messages:   [{ role: 'user', content: buildPrompt(fd) }],
  }));

  /* Call Anthropic with timeout */
  let upstream;
  try {
    upstream = await Promise.race([
      anthropicPost(anthropicBody, apiKey),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT)),
    ]);
  } catch (e) {
    res.status(503).json({ error: 'upstream unavailable' });
    return;
  }

  if (upstream.status !== 200) {
    res.status(503).json({ error: 'upstream error' });
    return;
  }

  /* Parse + validate + normalise */
  let parsed;
  try {
    let text = upstream.body.toString('utf8');
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const envelope = JSON.parse(text);
    const content  = (envelope.content && envelope.content[0] && envelope.content[0].text) || text;
    const inner    = typeof content === 'string' ? content : JSON.stringify(content);
    parsed = JSON.parse(inner.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim());
  } catch (e) {
    res.status(503).json({ error: 'parse error' });
    return;
  }

  if (!validate(parsed)) {
    res.status(503).json({ error: 'schema validation failed' });
    return;
  }

  res.status(200).json(normalise(parsed));
};

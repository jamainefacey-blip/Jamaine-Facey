/**
 * VST Vercel Serverless — POST /api/planner-chat
 *
 * Conversational AI travel planner powered by Claude.
 * Accepts a user message + conversation history and returns AVA's response,
 * optionally with a structured itinerary JSON block.
 *
 * Body: {
 *   message:     string           — current user message
 *   history:     [{role, content}] — up to 20 prior turns
 *   destination: string|null
 *   preferences: object
 * }
 *
 * Response: {
 *   reply:        string  — AVA's conversational reply (cleaned)
 *   itinerary:    object|null — structured itinerary if generated
 *   hasItinerary: boolean
 * }
 *
 * Env: ANTHROPIC_API_KEY (required), AVA_MODEL, AVA_TIMEOUT
 */
'use strict';

const https   = require('https');
const MODEL   = process.env.AVA_MODEL   || 'claude-haiku-4-5-20251001';
const TIMEOUT = parseInt(process.env.AVA_TIMEOUT) || 35000;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/* ── System prompt ───────────────────────────────────────────────────────────
   Instructs AVA to behave as a premium, eco-conscious travel planner.
   When enough context exists, AVA embeds a JSON itinerary block in the reply
   which the frontend parses and renders as rich day cards.
   ─────────────────────────────────────────────────────────────────────────── */
const SYSTEM = `You are AVA, the AI travel intelligence system for Voyage Smart Travel — a premium, eco-conscious travel company.

YOUR EXPERTISE:
- Eco-conscious travel: prefer trains over short-haul flights, recommend carbon offsets, suggest green-certified hotels
- Day-by-day itinerary generation with real venues, opening times, and local tips
- Budget-aware suggestions across economy, mid-range, and luxury tiers
- Accessibility: proactively mention step-free routes, sensory considerations, and mobility-friendly options
- Local immersion: authentic dining, hidden gems, cultural etiquette, seasonal events
- Safety: destination-specific advice, travel advisories, health requirements
- Multi-modal transport: trains, ferries, buses — not just flights

YOUR VOICE:
- Warm, knowledgeable, sophisticated — not corporate or robotic
- Concise for simple questions; richly detailed for itinerary requests
- Always name real places (restaurants, museums, neighbourhoods)
- Mention eco impact naturally: "Taking the Eurostar instead of flying cuts your carbon by 91%"

ITINERARY GENERATION RULES:
When you have enough information (destination + approximate duration at minimum), end your message with a structured itinerary block in this EXACT format — no deviations:

\`\`\`itinerary
{
  "destination": "City, Country",
  "title": "Evocative trip title",
  "summary": "One to two sentence overview of the trip.",
  "days": [
    {
      "day": 1,
      "title": "Arrival & First Impressions",
      "activities": [
        {
          "time": "Morning",
          "activity": "Specific activity at a real named venue",
          "type": "transport",
          "eco_note": "Optional: brief eco tip for this activity"
        },
        {
          "time": "Afternoon",
          "activity": "Another specific activity",
          "type": "sightseeing"
        },
        {
          "time": "Evening",
          "activity": "Dinner at a specific local restaurant",
          "type": "dining"
        }
      ]
    }
  ],
  "highlights": ["Top experience 1", "Top experience 2", "Top experience 3"],
  "eco_tips": ["Specific eco tip 1", "Specific eco tip 2"],
  "eco_score": 78,
  "total_budget": {
    "min": 1200,
    "max": 1800,
    "currency": "GBP",
    "notes": "Excludes flights"
  },
  "accessibility_notes": "General accessibility summary for this destination (or null)"
}
\`\`\`

Activity types must be one of: transport, sightseeing, dining, accommodation, culture, nature, leisure, shopping.
eco_score is 0-100 (higher = greener trip).
Only include the itinerary block when you have destination + duration. Do NOT include it for simple questions or clarifications.
Your conversational reply appears BEFORE the itinerary block.`;

/* ── Body reader ─────────────────────────────────────────────────────────────*/
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ── Anthropic HTTPS call ────────────────────────────────────────────────────*/
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

/* ── Extract itinerary block from response text ──────────────────────────────*/
function parseResponse(text) {
  const itinMatch = text.match(/```itinerary\r?\n([\s\S]*?)\r?\n```/);
  if (!itinMatch) return { reply: text.trim(), itinerary: null };

  let itinerary = null;
  try {
    itinerary = JSON.parse(itinMatch[1]);
  } catch (e) {
    /* malformed JSON — surface the full text anyway */
  }

  const reply = text.replace(/```itinerary\r?\n[\s\S]*?\r?\n```/, '').trim();
  return { reply, itinerary };
}

/* ── Handler ─────────────────────────────────────────────────────────────────*/
module.exports = async (req, res) => {
  Object.keys(CORS).forEach(k => res.setHeader(k, CORS[k]));
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')   { res.status(405).json({ error: 'method not allowed' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'AVA live mode unavailable — API key not configured' });
    return;
  }

  /* Parse body */
  let body;
  try {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      body = req.body;
    } else {
      const raw = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : await readBody(req);
      body = JSON.parse(raw);
    }
  } catch (e) {
    res.status(400).json({ error: 'invalid request body' });
    return;
  }

  const { message, history = [], destination, preferences = {} } = body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  /* Build messages array — history (max 20) + current message */
  const messages = [];

  /* Inject destination/preferences context as a system note in first user turn */
  let contextNote = '';
  if (destination) contextNote += `\n[Context: planning for ${destination}]`;
  if (preferences && Object.keys(preferences).length) {
    contextNote += `\n[Preferences: ${JSON.stringify(preferences)}]`;
  }

  const recentHistory = Array.isArray(history) ? history.slice(-20) : [];
  recentHistory.forEach(h => {
    if (h && h.role && typeof h.content === 'string') {
      messages.push({ role: h.role, content: h.content });
    }
  });

  const userContent = contextNote
    ? message.trim() + contextNote
    : message.trim();
  messages.push({ role: 'user', content: userContent });

  /* Call Claude */
  const anthropicBody = Buffer.from(JSON.stringify({
    model:      MODEL,
    max_tokens: 4096,
    system:     SYSTEM,
    messages,
  }));

  let upstream;
  try {
    upstream = await Promise.race([
      anthropicPost(anthropicBody, apiKey),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), TIMEOUT)),
    ]);
  } catch (e) {
    res.status(503).json({ error: e.message === 'timeout' ? 'request timed out' : 'upstream unavailable' });
    return;
  }

  if (upstream.status !== 200) {
    const errBody = upstream.body.toString('utf8');
    console.error('[planner-chat] Anthropic error', upstream.status, errBody);
    res.status(503).json({ error: 'upstream error' });
    return;
  }

  /* Parse Claude response */
  let responseText;
  try {
    const envelope = JSON.parse(upstream.body.toString('utf8'));
    responseText = (envelope.content && envelope.content[0] && envelope.content[0].text) || '';
  } catch (e) {
    res.status(503).json({ error: 'parse error' });
    return;
  }

  const { reply, itinerary } = parseResponse(responseText);

  res.status(200).json({
    reply,
    itinerary,
    hasItinerary: !!itinerary,
  });
};

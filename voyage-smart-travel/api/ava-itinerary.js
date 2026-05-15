/**
 * VST Vercel Serverless — POST /api/ava-itinerary
 *
 * Conversational itinerary builder via AVA (Claude).
 * Parses natural language trip request → structured itinerary + eco scores.
 *
 * Body: { transcript: string }
 * Returns: { transcript, parsed, itinerary, eco }
 */
'use strict';

const https = require('https');
const { calculate } = require('../server/eco-engine');

const MODEL   = process.env.AVA_MODEL   || 'claude-haiku-4-5-20251001';
const TIMEOUT = parseInt(process.env.AVA_TIMEOUT) || 30000;

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/* ── Prompt builder ──────────────────────────────────────────────────────── */
function buildPrompt(transcript) {
  const schema = {
    parsed: {
      origin_iata:      'IATA code string or null — e.g. "LHR"',
      destination_iata: 'IATA code string or null — e.g. "NRT"',
      origin_name:      'Airport/city name string or null',
      destination_name: 'Airport/city name string or null',
      destination_city: 'City name string — e.g. "Tokyo"',
      departure_date:   'ISO date string or null — e.g. "2026-07-15"',
      return_date:      'ISO date string or null',
      trip_type:        '"return" or "one_way"',
      cabin_class:      '"ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST"',
      passengers:       'integer',
      duration_days:    'integer or null',
      preferences:      ['string — e.g. "eco-conscious", "cultural", "adventure", "luxury"'],
      confidence:       'number 0-1',
    },
    itinerary: {
      title:   'string — catchy trip title',
      summary: 'string — 1-2 sentence trip overview',
      days: [
        {
          day:   'integer — day number',
          title: 'string — theme for this day',
          activities: [
            {
              time:     'string — "Morning" | "Afternoon" | "Evening" | "All day"',
              activity: 'string — specific activity with details',
              type:     '"transport" | "sightseeing" | "dining" | "accommodation" | "culture" | "nature" | "leisure" | "shopping"',
            },
          ],
        },
      ],
      highlights: ['string — top 3-5 must-do experiences'],
      eco_tips:   ['string — 2-3 specific eco-friendly tips for this destination'],
    },
  };

  return 'You are AVA, the AI travel intelligence system for Voyage Smart Travel. '
    + 'Parse the following natural language trip request and generate a detailed day-by-day itinerary. '
    + 'Return ONLY a valid JSON object — no markdown, no code fences, no explanation.\n\n'
    + 'TRIP REQUEST: "' + transcript.replace(/"/g, '\\"') + '"\n\n'
    + 'INSTRUCTIONS:\n'
    + '- Extract origin and destination as IATA airport codes (LHR=London Heathrow, LGW=London Gatwick, MAN=Manchester, '
    + 'NRT=Tokyo Narita, HND=Tokyo Haneda, DXB=Dubai, JFK=New York JFK, EWR=Newark, LAX=Los Angeles, '
    + 'CDG=Paris, AMS=Amsterdam, FRA=Frankfurt, BKK=Bangkok, SIN=Singapore, SYD=Sydney, DPS=Bali, '
    + 'MAD=Madrid, BCN=Barcelona, FCO=Rome, MXP=Milan, ATH=Athens, IST=Istanbul, DEL=Delhi, BOM=Mumbai, '
    + 'HKG=Hong Kong, ICN=Seoul, PEK=Beijing, PVG=Shanghai, MIA=Miami, ORD=Chicago, SFO=San Francisco, '
    + 'YYZ=Toronto, GRU=Sao Paulo, CPT=Cape Town, NBO=Nairobi, CAI=Cairo, DXB=Dubai, DOH=Doha)\n'
    + '- If no origin stated, use LHR as default\n'
    + '- If month stated but no year, use 2026\n'
    + '- Default cabin_class to ECONOMY unless specified\n'
    + '- Generate a realistic day-by-day itinerary for the full trip duration\n'
    + '- Day 1 = arrival day, last day = departure day with morning activities before airport\n'
    + '- Include 2-4 activities per day with specific venue/place names\n'
    + '- Eco tips must be practical and specific to this destination\n\n'
    + 'RETURN ONLY this exact JSON shape:\n' + JSON.stringify(schema, null, 2);
}

/* ── Body reader ─────────────────────────────────────────────────────────── */
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

/* ── Anthropic HTTPS call ─────────────────────────────────────────────────── */
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
  Object.keys(CORS).forEach(k => res.setHeader(k, CORS[k]));
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')   { res.status(405).json({ error: 'method not allowed' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY || null;
  if (!apiKey) {
    res.status(503).json({ error: 'AVA live mode unavailable — ANTHROPIC_API_KEY not configured' });
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

  const transcript = String(body.transcript || '').trim();
  if (!transcript || transcript.length < 3) {
    res.status(400).json({ error: 'transcript is required' });
    return;
  }

  /* Call Claude */
  const anthropicBody = Buffer.from(JSON.stringify({
    model:      MODEL,
    max_tokens: 3000,
    messages:   [{ role: 'user', content: buildPrompt(transcript) }],
  }));

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

  /* Parse Claude response */
  let parsed;
  try {
    let text = upstream.body.toString('utf8');
    const envelope = JSON.parse(text);
    const content  = (envelope.content && envelope.content[0] && envelope.content[0].text) || text;
    const inner    = typeof content === 'string' ? content : JSON.stringify(content);
    const cleaned  = inner.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    res.status(503).json({ error: 'parse error' });
    return;
  }

  /* Calculate eco for flight leg(s) */
  const p = parsed.parsed || {};
  let outbound_eco = null;
  let return_eco   = null;
  const cabin    = p.cabin_class || 'ECONOMY';
  const pax      = p.passengers  || 1;

  if (p.origin_iata && p.destination_iata) {
    outbound_eco = calculate(p.origin_iata, p.destination_iata, cabin, pax);
    if (p.trip_type !== 'one_way') {
      return_eco = calculate(p.destination_iata, p.origin_iata, cabin, pax);
    }
  }

  /* Aggregate eco summary */
  let total_co2_kg     = 0;
  let total_offset_gbp = 0;
  let overall_grade    = null;

  if (outbound_eco && !outbound_eco.error) {
    total_co2_kg     += outbound_eco.co2_kg || 0;
    total_offset_gbp += outbound_eco.offset_cost_gbp || 0;
    overall_grade     = outbound_eco.eco_grade;
  }
  if (return_eco && !return_eco.error) {
    total_co2_kg     += return_eco.co2_kg || 0;
    total_offset_gbp += return_eco.offset_cost_gbp || 0;
  }

  total_co2_kg     = Math.round(total_co2_kg);
  total_offset_gbp = Math.round(total_offset_gbp * 100) / 100;

  res.status(200).json({
    transcript,
    parsed:    p,
    itinerary: parsed.itinerary || null,
    eco: {
      outbound:         outbound_eco,
      return_leg:       return_eco,
      total_co2_kg,
      total_offset_gbp,
      overall_grade,
    },
  });
};

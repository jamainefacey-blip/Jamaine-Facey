/**
 * VST Vercel Serverless — POST /api/fares/search
 *
 * Vercel/Lambda has direct internet access — no egress tunnel needed.
 * Uses the same FareRouter logic but with a direct https.request transport.
 *
 * Env vars (set in Vercel dashboard):
 *   AMADEUS_CLIENT_ID, AMADEUS_CLIENT_SECRET, AMADEUS_ENV
 *   SKYSCANNER_API_KEY, KIWI_API_KEY
 */
'use strict';
const https  = require('https');
const crypto = require('crypto');

/* ── City → IATA (duplicated from fare-router.js for Vercel isolation) ─── */
const CITY_IATA = {
  'london': 'LHR', 'london heathrow': 'LHR', 'london gatwick': 'LGW',
  'london city': 'LCY', 'london stansted': 'STN',
  'new york': 'JFK', 'new york city': 'JFK', 'nyc': 'JFK',
  'paris': 'CDG', 'paris charles de gaulle': 'CDG',
  'tokyo': 'NRT', 'tokyo narita': 'NRT', 'tokyo haneda': 'HND',
  'dubai': 'DXB', 'singapore': 'SIN', 'los angeles': 'LAX', 'la': 'LAX',
  'chicago': 'ORD', 'toronto': 'YYZ', 'sydney': 'SYD', 'amsterdam': 'AMS',
  'frankfurt': 'FRA', 'madrid': 'MAD', 'barcelona': 'BCN', 'rome': 'FCO',
  'milan': 'MXP', 'zurich': 'ZRH', 'vienna': 'VIE', 'brussels': 'BRU',
  'lisbon': 'LIS', 'istanbul': 'IST', 'beijing': 'PEK', 'shanghai': 'PVG',
  'hong kong': 'HKG', 'bangkok': 'BKK', 'mumbai': 'BOM', 'bombay': 'BOM',
  'delhi': 'DEL', 'new delhi': 'DEL', 'cairo': 'CAI', 'johannesburg': 'JNB',
  'nairobi': 'NBO', 'lagos': 'LOS', 'accra': 'ACC', 'miami': 'MIA',
  'boston': 'BOS', 'san francisco': 'SFO', 'seattle': 'SEA', 'dallas': 'DFW',
  'houston': 'IAH', 'denver': 'DEN', 'atlanta': 'ATL', 'washington': 'IAD',
  'washington dc': 'IAD', 'montreal': 'YUL', 'vancouver': 'YVR',
  'manchester': 'MAN', 'edinburgh': 'EDI', 'glasgow': 'GLA', 'dublin': 'DUB',
  'oslo': 'OSL', 'stockholm': 'ARN', 'copenhagen': 'CPH', 'helsinki': 'HEL',
  'athens': 'ATH', 'budapest': 'BUD', 'prague': 'PRG', 'warsaw': 'WAW',
  'bucharest': 'OTP', 'sofia': 'SOF', 'kyiv': 'KBP', 'kiev': 'KBP',
  'moscow': 'SVO', 'mexico city': 'MEX', 'bogota': 'BOG', 'lima': 'LIM',
  'buenos aires': 'EZE', 'sao paulo': 'GRU', 'santiago': 'SCL',
  'jakarta': 'CGK', 'kuala lumpur': 'KUL', 'manila': 'MNL', 'seoul': 'ICN',
  'taipei': 'TPE', 'auckland': 'AKL', 'doha': 'DOH', 'abu dhabi': 'AUH',
  'riyadh': 'RUH', 'tel aviv': 'TLV', 'karachi': 'KHI', 'dhaka': 'DAC',
};

function resolveIata(text) {
  if (!text) return null;
  const t = text.trim();
  if (/^[A-Z]{3}$/.test(t)) return t;
  const lower = t.toLowerCase().replace(/,.*$/, '').trim();
  if (CITY_IATA[lower]) return CITY_IATA[lower];
  for (const [key, code] of Object.entries(CITY_IATA)) {
    if (lower.startsWith(key) || key.startsWith(lower)) return code;
  }
  return null;
}

function parseISODuration(dur) {
  const m = (dur || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  return m ? (parseInt(m[1] || 0) * 60) + parseInt(m[2] || 0) : 0;
}

function uuid() {
  return crypto.randomUUID ? crypto.randomUUID() :
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

/* ── Simple HTTPS request (Vercel has direct internet) ──────────────────── */
function directHttpsPost(host, path, headers, body) {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(body || '');
    const opts = {
      hostname: host, port: 443, path, method: 'POST',
      headers: Object.assign({ 'Content-Length': bodyBuf.length }, headers),
    };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

function directHttpsGet(host, path, headers) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: host, port: 443, path, method: 'GET', headers };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    });
    req.on('error', reject);
    req.end();
  });
}

/* ── Amadeus token cache (module-level, shared across warm invocations) ─── */
let _token = null;
let _tokenExpiry = 0;

async function getAmadeusToken(host, clientId, clientSecret) {
  if (_token && Date.now() < _tokenExpiry) return _token;
  const body = 'grant_type=client_credentials&client_id='
    + encodeURIComponent(clientId) + '&client_secret='
    + encodeURIComponent(clientSecret);
  const resp = await directHttpsPost(host, '/v1/security/oauth2/token',
    { 'Content-Type': 'application/x-www-form-urlencoded' }, body);
  if (resp.status !== 200) throw new Error('Amadeus auth failed: ' + resp.status);
  const data = JSON.parse(resp.body.toString('utf8'));
  _token       = data.access_token;
  _tokenExpiry = Date.now() + ((data.expires_in || 1799) - 60) * 1000;
  return _token;
}

/* ── Normalise one Amadeus offer to FareResult offer shape ──────────────── */
function normalizeOffer(o) {
  const price = o.price || {};
  const total = parseFloat(price.total || price.grandTotal || 0);
  const base  = parseFloat(price.base  || 0);
  const adultPricing = o.travelerPricings && o.travelerPricings[0];
  const adultTotal   = adultPricing ? parseFloat((adultPricing.price || {}).total || 0) : total;
  const checkedBags  = adultPricing && adultPricing.fareDetailsBySegment
    ? (adultPricing.fareDetailsBySegment[0] || {}).includedCheckedBags || {}
    : {};
  return {
    offer_id: 'amadeus_' + (o.id || uuid()),
    price: {
      total, base, taxes: total - base > 0 ? total - base : null,
      currency: price.currency || 'GBP', price_per_adult: adultTotal, is_firm: false,
    },
    itineraries: (o.itineraries || []).map(itin => ({
      duration_minutes: parseISODuration(itin.duration),
      stops: Math.max(0, (itin.segments || []).length - 1),
      segments: (itin.segments || []).map(seg => ({
        origin:              seg.departure.iataCode,
        destination:         seg.arrival.iataCode,
        departure_at:        seg.departure.at,
        arrival_at:          seg.arrival.at,
        carrier:             seg.carrierCode,
        flight_number:       seg.carrierCode + (seg.number || ''),
        duration_minutes:    parseISODuration(seg.duration),
        terminal_origin:     (seg.departure || {}).terminal || null,
        terminal_destination:(seg.arrival   || {}).terminal || null,
        cabin_class:         'ECONOMY',
      })),
    })),
    baggage:           { cabin_included: true, checked_pieces: checkedBags.quantity || 0, checked_kg: 0 },
    carbon_estimate_kg: null,
    self_transfer:      false,
    refundable:         'UNKNOWN',
  };
}

/* ── Body reader ─────────────────────────────────────────────────────────── */
function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
      return resolve(req.body);
    }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

/* ── Vercel handler ──────────────────────────────────────────────────────── */
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'method not allowed' }); return; }

  let fd;
  try { fd = await readBody(req); }
  catch (e) { res.status(400).json({ error: 'invalid request body' }); return; }

  const originIata = resolveIata(fd.origin);
  const destIata   = resolveIata(fd.destination);
  if (!originIata || !destIata) {
    res.status(200).json({
      provider: 'none', search_id: uuid(), cached: false,
      fetched_at: new Date().toISOString(), offers: [],
      error: 'Airport not recognised: ' + (!originIata ? fd.origin : fd.destination)
        + '. Use a city name (e.g. London) or IATA code (e.g. LHR).',
    });
    return;
  }

  const clientId     = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  const amadeusEnv   = (process.env.AMADEUS_ENV || 'test') === 'production' ? 'production' : 'test';
  const host         = amadeusEnv === 'production' ? 'api.amadeus.com' : 'test.api.amadeus.com';

  if (!clientId || !clientSecret) {
    res.status(200).json({
      provider: 'none', search_id: uuid(), cached: false,
      fetched_at: new Date().toISOString(), offers: [],
      error: 'Fare search credentials not configured.',
    });
    return;
  }

  try {
    const token = await getAmadeusToken(host, clientId, clientSecret);
    const params = new URLSearchParams({
      originLocationCode:      originIata,
      destinationLocationCode: destIata,
      departureDate:           fd.departureDate || fd.departure_date,
      adults:                  String(fd.travellerCount || fd.passengers_adults || 1),
      currencyCode:            fd.currency || 'GBP',
      nonStop:                 'false',
      max:                     '10',
    });
    const tripType = fd.tripType || fd.trip_type || 'return';
    const returnDate = fd.returnDate || fd.return_date;
    if (returnDate && tripType !== 'one_way' && tripType !== 'ONE_WAY') {
      params.set('returnDate', returnDate);
    }

    const resp = await directHttpsGet(host,
      '/v2/shopping/flight-offers?' + params.toString(),
      { 'Authorization': 'Bearer ' + token });

    if (resp.status !== 200) {
      const errText = resp.body.toString('utf8');
      let errMsg = 'No fares available for this route.';
      try {
        const errJson = JSON.parse(errText);
        if (errJson.errors && errJson.errors[0]) errMsg = errJson.errors[0].detail || errMsg;
      } catch (_) {}
      res.status(200).json({
        provider: 'amadeus', search_id: uuid(), cached: false,
        fetched_at: new Date().toISOString(), offers: [], error: errMsg,
      });
      return;
    }

    const data = JSON.parse(resp.body.toString('utf8'));
    const offers = (data.data || []).map(normalizeOffer);
    res.status(200).json({
      provider:   'amadeus',
      search_id:  uuid(),
      cached:     false,
      fetched_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 300000).toISOString(),
      origin_iata: originIata,
      dest_iata:   destIata,
      offers,
    });
  } catch (e) {
    res.status(200).json({
      provider: 'none', search_id: uuid(), cached: false,
      fetched_at: new Date().toISOString(), offers: [],
      error: 'Fare search temporarily unavailable.',
    });
  }
};

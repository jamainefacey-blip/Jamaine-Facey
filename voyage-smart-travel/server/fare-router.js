/**
 * VST Fare Router — server-side fare adapter stack
 *
 * Implements: AmadeusAdapter (live sandbox), SkyscannerAdapter (stub),
 *             KiwiAdapter (stub), CircuitBreaker, FareCache, FareRouter.
 *
 * VST product code calls FareRouter.search() only — never a concrete adapter.
 * Credentials via env vars only. Never hardcoded.
 *
 * Env vars:
 *   AMADEUS_CLIENT_ID      — Amadeus OAuth client_id
 *   AMADEUS_CLIENT_SECRET  — Amadeus OAuth client_secret
 *   AMADEUS_ENV            — 'test' (default) | 'production'
 *   SKYSCANNER_API_KEY     — Skyscanner partner key (stub when absent)
 *   KIWI_API_KEY           — Kiwi Tequila partner key (stub when absent)
 *   FARE_PROVIDER_CHAIN    — comma-separated override e.g. 'amadeus,skyscanner,kiwi'
 *   FARE_CACHE_TTL_SECONDS — cache TTL override (default 300)
 *   FARE_TIMEOUT_MS        — per-adapter timeout override (default 8000)
 */
'use strict';
const tls    = require('tls');
const net    = require('net');
const crypto = require('crypto');

/* ── Egress proxy detection (mirrors vst-server.js) ─────────────────────── */
function getEgressProxy() {
  const raw = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || '';
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return { host: u.hostname, port: parseInt(u.port) || 80, auth: u.username + ':' + decodeURIComponent(u.password) };
  } catch (e) { return null; }
}

/* ── TLS tunnel to target host (via egress proxy if present) ─────────────── */
function getTlsSocket(targetHost) {
  return new Promise((resolve, reject) => {
    const ep = getEgressProxy();
    if (!ep) {
      const s = tls.connect({ host: targetHost, port: 443, servername: targetHost }, () => resolve(s));
      s.on('error', reject);
      return;
    }
    const tcp = net.connect(ep.port, ep.host, () => {
      const authB64 = Buffer.from(ep.auth).toString('base64');
      tcp.write('CONNECT ' + targetHost + ':443 HTTP/1.1\r\nHost: ' + targetHost + ':443\r\nProxy-Authorization: Basic ' + authB64 + '\r\n\r\n');
      let hdr = '';
      const onData = (chunk) => {
        hdr += chunk.toString();
        if (!hdr.includes('\r\n\r\n')) return;
        tcp.removeListener('data', onData);
        if (!hdr.split('\r\n')[0].includes('200')) {
          tcp.destroy();
          return reject(new Error('CONNECT failed: ' + hdr.split('\r\n')[0]));
        }
        const s = tls.connect({ socket: tcp, servername: targetHost, rejectUnauthorized: true }, () => resolve(s));
        s.on('error', reject);
      };
      tcp.on('data', onData);
    });
    tcp.on('error', reject);
  });
}

/* ── Chunked transfer encoding decoder ──────────────────────────────────── */
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

/* ── Generic HTTPS request over TLS tunnel ───────────────────────────────── */
function httpsRequest(host, method, path, reqHeaders, body) {
  return new Promise((resolve, reject) => {
    getTlsSocket(host).then(sock => {
      const bodyBuf = body ? (Buffer.isBuffer(body) ? body : Buffer.from(body)) : Buffer.alloc(0);
      const allHeaders = Object.assign({ 'Host': host, 'Connection': 'close' }, reqHeaders);
      if (bodyBuf.length > 0) allHeaders['Content-Length'] = String(bodyBuf.length);

      const lines = [method + ' ' + path + ' HTTP/1.1'];
      for (const [k, v] of Object.entries(allHeaders)) lines.push(k + ': ' + v);
      lines.push('', '');

      sock.write(lines.join('\r\n'));
      if (bodyBuf.length > 0) sock.write(bodyBuf);

      let raw = Buffer.alloc(0);
      sock.on('data', c => { raw = Buffer.concat([raw, c]); });
      sock.on('end', () => {
        sock.destroy();
        const s = raw.toString('binary');
        const hEnd = s.indexOf('\r\n\r\n');
        if (hEnd === -1) return reject(new Error('no header boundary'));
        const headerStr = s.slice(0, hEnd);
        const statusMatch = headerStr.match(/^HTTP\/\d\.\d (\d+)/);
        const status = statusMatch ? parseInt(statusMatch[1]) : 0;
        const rawBody = raw.slice(hEnd + 4);
        const isChunked = /transfer-encoding:\s*chunked/i.test(headerStr);
        resolve({ status, body: isChunked ? unchunk(rawBody) : rawBody });
      });
      sock.on('error', reject);
    }).catch(reject);
  });
}

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function parseISODuration(dur) {
  const m = (dur || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return 0;
  return (parseInt(m[1] || 0) * 60) + parseInt(m[2] || 0);
}

/* ── City name → IATA code mapping ──────────────────────────────────────── */
const CITY_IATA = {
  'london': 'LHR', 'london heathrow': 'LHR', 'london gatwick': 'LGW',
  'london city': 'LCY', 'london stansted': 'STN', 'london luton': 'LTN',
  'new york': 'JFK', 'new york city': 'JFK', 'nyc': 'JFK',
  'paris': 'CDG', 'paris charles de gaulle': 'CDG', 'paris orly': 'ORY',
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
  'bucharest': 'OTP', 'sofia': 'SOF', 'zagreb': 'ZAG', 'kyiv': 'KBP',
  'kiev': 'KBP', 'moscow': 'SVO', 'mexico city': 'MEX', 'bogota': 'BOG',
  'lima': 'LIM', 'buenos aires': 'EZE', 'sao paulo': 'GRU', 'santiago': 'SCL',
  'jakarta': 'CGK', 'kuala lumpur': 'KUL', 'manila': 'MNL', 'seoul': 'ICN',
  'taipei': 'TPE', 'auckland': 'AKL', 'doha': 'DOH', 'abu dhabi': 'AUH',
  'riyadh': 'RUH', 'tel aviv': 'TLV', 'karachi': 'KHI', 'dhaka': 'DAC',
  'colombo': 'CMB', 'kathmandu': 'KTM', 'kabul': 'KBL', 'islamabad': 'ISB',
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

/* ═══════════════════════════════════════════════════════════════════════════
   CIRCUIT BREAKER
   Per-provider state machine: CLOSED → OPEN → HALF_OPEN → CLOSED
   ═══════════════════════════════════════════════════════════════════════════ */
class CircuitBreaker {
  constructor(opts = {}) {
    this.threshold    = opts.threshold    || 5;
    this.windowMs     = (opts.windowSec   || 60)  * 1000;
    this.openDurationMs = (opts.openDurationSec || 30) * 1000;
    this.state        = 'CLOSED';
    this.failures     = [];
    this.openedAt     = 0;
  }

  recordFailure() {
    const now = Date.now();
    this.failures = this.failures.filter(t => now - t < this.windowMs);
    this.failures.push(now);
    if (this.failures.length >= this.threshold) {
      this.state = 'OPEN';
      this.openedAt = now;
    }
  }

  recordSuccess() {
    this.failures = [];
    this.state = 'CLOSED';
  }

  isOpen() {
    if (this.state === 'CLOSED') return false;
    if (this.state === 'OPEN') {
      if (Date.now() - this.openedAt > this.openDurationMs) {
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false; /* HALF_OPEN — allow one probe */
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FARE CACHE
   In-memory map. Cache key = SHA-256 of canonical search params.
   ═══════════════════════════════════════════════════════════════════════════ */
class FareCache {
  constructor(ttlMs = 300000, staleTtlMs = 360000) {
    this.store    = new Map();
    this.ttl      = ttlMs;
    this.staleTtl = staleTtlMs;
  }

  _key(req) {
    const parts = [
      req.origin, req.destination,
      req.departure_date, req.return_date || '',
      String(req.passengers ? req.passengers.adults || 1 : 1),
      String(req.passengers ? req.passengers.children || 0 : 0),
      req.cabin_class || 'ECONOMY',
      req.currency || 'GBP',
    ];
    return crypto.createHash('sha256').update(parts.join('|')).digest('hex');
  }

  get(req) {
    const entry = this.store.get(this._key(req));
    if (!entry) return null;
    const age = Date.now() - entry.storedAt;
    if (age > this.staleTtl) { this.store.delete(this._key(req)); return null; }
    return {
      result:      entry.result,
      stale:       age > this.ttl,
      age_seconds: Math.floor(age / 1000),
    };
  }

  set(req, result) {
    this.store.set(this._key(req), { result, storedAt: Date.now() });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   AMADEUS ADAPTER
   ═══════════════════════════════════════════════════════════════════════════ */
class AmadeusAdapter {
  constructor() {
    this.clientId     = process.env.AMADEUS_CLIENT_ID     || null;
    this.clientSecret = process.env.AMADEUS_CLIENT_SECRET || null;
    this.env          = (process.env.AMADEUS_ENV || 'test') === 'production' ? 'production' : 'test';
    this.host         = this.env === 'production' ? 'api.amadeus.com' : 'test.api.amadeus.com';
    this.timeout      = parseInt(process.env.FARE_TIMEOUT_MS) || 8000;
    this._token       = null;
    this._tokenExpiry = 0;
    this.breaker      = new CircuitBreaker();
  }

  getProviderName() { return 'amadeus'; }

  async _getToken() {
    if (this._token && Date.now() < this._tokenExpiry) return this._token;
    if (!this.clientId || !this.clientSecret) {
      throw Object.assign(new Error('Missing Amadeus credentials'), {
        error_code: 'PROVIDER_AUTH_FAILED', provider: 'amadeus', retryable: false,
      });
    }
    const body = 'grant_type=client_credentials&client_id='
      + encodeURIComponent(this.clientId) + '&client_secret='
      + encodeURIComponent(this.clientSecret);
    const resp = await Promise.race([
      httpsRequest(this.host, 'POST', '/v1/security/oauth2/token',
        { 'Content-Type': 'application/x-www-form-urlencoded' }, body),
      new Promise((_, rej) => setTimeout(() => rej(new Error('token_timeout')), this.timeout)),
    ]);
    if (resp.status !== 200) {
      throw Object.assign(new Error('Amadeus token fetch failed: HTTP ' + resp.status), {
        error_code: 'PROVIDER_AUTH_FAILED', provider: 'amadeus', retryable: false, http_status: resp.status,
      });
    }
    const data = JSON.parse(resp.body.toString('utf8'));
    this._token       = data.access_token;
    this._tokenExpiry = Date.now() + ((data.expires_in || 1799) - 60) * 1000;
    return this._token;
  }

  async healthCheck() {
    const start = Date.now();
    try {
      await this._getToken();
      return { status: 'ok', latency_ms: Date.now() - start };
    } catch (e) {
      return { status: 'down', latency_ms: Date.now() - start, last_error: e.message };
    }
  }

  async search(req) {
    if (this.breaker.isOpen()) {
      throw Object.assign(new Error('Circuit breaker open for amadeus'), {
        error_code: 'CIRCUIT_BREAKER_OPEN', provider: 'amadeus', retryable: false,
      });
    }

    const originIata = resolveIata(req.origin);
    const destIata   = resolveIata(req.destination);
    if (!originIata || !destIata) {
      throw Object.assign(new Error('Unresolvable IATA codes: ' + req.origin + ' / ' + req.destination), {
        error_code: 'PROVIDER_BAD_REQUEST', provider: 'amadeus', retryable: false,
      });
    }

    let token;
    try { token = await this._getToken(); }
    catch (e) { this.breaker.recordFailure(); throw e; }

    const params = new URLSearchParams({
      originLocationCode:      originIata,
      destinationLocationCode: destIata,
      departureDate:           req.departure_date,
      adults:                  String((req.passengers && req.passengers.adults) || 1),
      currencyCode:            req.currency || 'GBP',
      nonStop:                 req.non_stop_only ? 'true' : 'false',
      max:                     String(Math.min(req.max_results || 10, 20)),
    });
    if (req.return_date && req.trip_type !== 'ONE_WAY') params.set('returnDate', req.return_date);
    if (req.cabin_class && req.cabin_class !== 'ECONOMY') {
      const cabinMap = { PREMIUM_ECONOMY: 'PREMIUM_ECONOMY', BUSINESS: 'BUSINESS', FIRST: 'FIRST' };
      if (cabinMap[req.cabin_class]) params.set('travelClass', cabinMap[req.cabin_class]);
    }
    if (req.passengers && req.passengers.children > 0) params.set('children', String(req.passengers.children));

    let resp;
    try {
      resp = await Promise.race([
        httpsRequest(this.host, 'GET', '/v2/shopping/flight-offers?' + params.toString(),
          { 'Authorization': 'Bearer ' + token }),
        new Promise((_, rej) => setTimeout(() => rej(Object.assign(new Error('timeout'), {
          error_code: 'PROVIDER_TIMEOUT', provider: 'amadeus', retryable: false,
        })), this.timeout)),
      ]);
    } catch (e) {
      this.breaker.recordFailure();
      throw Object.assign(e, { error_code: e.error_code || 'PROVIDER_UNAVAILABLE', provider: 'amadeus' });
    }

    if (resp.status === 429) {
      this.breaker.recordFailure();
      throw Object.assign(new Error('Amadeus rate limit'), { error_code: 'PROVIDER_RATE_LIMITED', provider: 'amadeus', http_status: 429, retryable: false });
    }
    if (resp.status === 400) {
      throw Object.assign(new Error('Amadeus bad request'), { error_code: 'PROVIDER_BAD_REQUEST', provider: 'amadeus', http_status: 400, retryable: false });
    }
    if (resp.status >= 400) {
      this.breaker.recordFailure();
      throw Object.assign(new Error('Amadeus HTTP ' + resp.status), { error_code: 'PROVIDER_UNAVAILABLE', provider: 'amadeus', http_status: resp.status, retryable: false });
    }

    let parsed;
    try {
      parsed = JSON.parse(resp.body.toString('utf8'));
    } catch (e) {
      this.breaker.recordFailure();
      throw Object.assign(new Error('Amadeus response parse failed'), { error_code: 'PROVIDER_SCHEMA_MISMATCH', provider: 'amadeus', retryable: false });
    }

    if (!parsed.data || !Array.isArray(parsed.data)) {
      this.breaker.recordFailure();
      throw Object.assign(new Error('Amadeus unexpected response shape'), { error_code: 'PROVIDER_SCHEMA_MISMATCH', provider: 'amadeus', retryable: false });
    }

    this.breaker.recordSuccess();

    const now = new Date();
    return {
      provider:   'amadeus',
      search_id:  uuid(),
      cached:     false,
      fetched_at: now.toISOString(),
      expires_at: new Date(now.getTime() + 300000).toISOString(),
      offers:     parsed.data.map(o => this._normalizeOffer(o, parsed.dictionaries || {})),
    };
  }

  _normalizeOffer(o, dicts) {
    const price = o.price || {};
    const itineraries = (o.itineraries || []).map(itin => ({
      duration_minutes: parseISODuration(itin.duration),
      stops:            Math.max(0, (itin.segments || []).length - 1),
      segments:         (itin.segments || []).map(seg => ({
        origin:           seg.departure.iataCode,
        destination:      seg.arrival.iataCode,
        departure_at:     seg.departure.at,
        arrival_at:       seg.arrival.at,
        carrier:          seg.carrierCode,
        flight_number:    seg.carrierCode + (seg.number || ''),
        aircraft_type:    dicts.aircraft ? dicts.aircraft[seg.aircraft && seg.aircraft.code] || null : null,
        duration_minutes: parseISODuration(seg.duration),
        terminal_origin:  (seg.departure && seg.departure.terminal) || null,
        terminal_destination: (seg.arrival && seg.arrival.terminal) || null,
        cabin_class:      'ECONOMY',
      })),
    }));

    const totalFloat  = parseFloat(price.total  || price.grandTotal || 0);
    const baseFloat   = parseFloat(price.base   || 0);
    const taxesFloat  = totalFloat - baseFloat;
    const adultPricing = o.travelerPricings && o.travelerPricings[0];
    const adultTotal  = adultPricing ? parseFloat((adultPricing.price || {}).total || 0) : totalFloat;

    const checkedBagInfo = adultPricing && adultPricing.fareDetailsBySegment && adultPricing.fareDetailsBySegment[0]
      ? (adultPricing.fareDetailsBySegment[0].includedCheckedBags || {})
      : {};

    return {
      offer_id:   'amadeus_' + (o.id || uuid()),
      price: {
        total:           totalFloat,
        base:            baseFloat,
        taxes:           taxesFloat > 0 ? taxesFloat : null,
        currency:        price.currency || 'GBP',
        price_per_adult: adultTotal,
        is_firm:         false,
      },
      itineraries,
      baggage: {
        cabin_included:  true,
        checked_kg:      0,
        checked_pieces:  checkedBagInfo.quantity || 0,
      },
      carbon_estimate_kg: null,
      self_transfer:       false,
      refundable:          'UNKNOWN',
      fare_rules_available: false,
    };
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   SKYSCANNER ADAPTER — stub (affiliate partnership required)
   Returns empty results; FareRouter falls through to next provider.
   ═══════════════════════════════════════════════════════════════════════════ */
class SkyscannerAdapter {
  constructor() {
    this.apiKey  = process.env.SKYSCANNER_API_KEY || null;
    this.breaker = new CircuitBreaker();
  }

  getProviderName() { return 'skyscanner'; }

  async healthCheck() {
    return this.apiKey
      ? { status: 'degraded', latency_ms: 0, last_error: 'Affiliate partnership not yet configured' }
      : { status: 'down',     latency_ms: 0, last_error: 'SKYSCANNER_API_KEY not set' };
  }

  async search(req) {
    if (this.breaker.isOpen()) {
      throw Object.assign(new Error('Circuit breaker open for skyscanner'), {
        error_code: 'CIRCUIT_BREAKER_OPEN', provider: 'skyscanner', retryable: false,
      });
    }
    if (!this.apiKey) {
      throw Object.assign(new Error('Skyscanner not configured — affiliate partnership required'), {
        error_code: 'PROVIDER_AUTH_FAILED', provider: 'skyscanner', retryable: false,
      });
    }
    /* Stub: affiliate API integration pending. Return empty to trigger fallback. */
    throw Object.assign(new Error('Skyscanner live integration pending'), {
      error_code: 'PROVIDER_UNAVAILABLE', provider: 'skyscanner', retryable: false,
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   KIWI ADAPTER — stub (partner programme sign-up required)
   Returns empty results; FareRouter falls through.
   ═══════════════════════════════════════════════════════════════════════════ */
class KiwiAdapter {
  constructor() {
    this.apiKey  = process.env.KIWI_API_KEY || null;
    this.breaker = new CircuitBreaker();
  }

  getProviderName() { return 'kiwi'; }

  async healthCheck() {
    return this.apiKey
      ? { status: 'degraded', latency_ms: 0, last_error: 'Kiwi partner programme not yet configured' }
      : { status: 'down',     latency_ms: 0, last_error: 'KIWI_API_KEY not set' };
  }

  async search(req) {
    if (this.breaker.isOpen()) {
      throw Object.assign(new Error('Circuit breaker open for kiwi'), {
        error_code: 'CIRCUIT_BREAKER_OPEN', provider: 'kiwi', retryable: false,
      });
    }
    if (!this.apiKey) {
      throw Object.assign(new Error('Kiwi not configured — partner sign-up required'), {
        error_code: 'PROVIDER_AUTH_FAILED', provider: 'kiwi', retryable: false,
      });
    }
    throw Object.assign(new Error('Kiwi live integration pending'), {
      error_code: 'PROVIDER_UNAVAILABLE', provider: 'kiwi', retryable: false,
    });
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   FARE ROUTER
   Executes the fallback chain. Returns first successful non-empty result,
   or a merged result if multiple providers return data.
   ═══════════════════════════════════════════════════════════════════════════ */
const TTL_MS   = (parseInt(process.env.FARE_CACHE_TTL_SECONDS) || 300) * 1000;
const STALE_MS = TTL_MS + 60000;

const ADAPTERS = { amadeus: new AmadeusAdapter(), skyscanner: new SkyscannerAdapter(), kiwi: new KiwiAdapter() };
const CACHE    = new FareCache(TTL_MS, STALE_MS);

const DEFAULT_CHAIN = (process.env.FARE_PROVIDER_CHAIN || 'amadeus,skyscanner,kiwi')
  .split(',').map(s => s.trim()).filter(s => ADAPTERS[s]);

const FareRouter = {
  async search(req, bypassCache = false) {
    /* Cache read */
    if (!bypassCache) {
      const hit = CACHE.get(req);
      if (hit) {
        const result = Object.assign({}, hit.result, {
          cached:           true,
          cache_age_seconds: hit.age_seconds,
        });
        /* Stale-while-revalidate: serve now, refresh async */
        if (hit.stale) {
          setImmediate(() => FareRouter._liveFetch(req).then(r => CACHE.set(req, r)).catch(() => {}));
        }
        return result;
      }
    }
    const result = await FareRouter._liveFetch(req);
    CACHE.set(req, result);
    return result;
  },

  async _liveFetch(req) {
    const errors = [];
    for (const name of DEFAULT_CHAIN) {
      const adapter = ADAPTERS[name];
      try {
        const result = await adapter.search(req);
        if (!result.offers || result.offers.length === 0) {
          errors.push({ provider: name, error_code: 'PROVIDER_EMPTY_RESULT' });
          continue;
        }
        return result;
      } catch (e) {
        errors.push({
          provider:   name,
          error_code: e.error_code || 'PROVIDER_UNAVAILABLE',
          message:    e.message,
        });
        /* PROVIDER_BAD_REQUEST = bad input — do not try next provider */
        if (e.error_code === 'PROVIDER_BAD_REQUEST') break;
      }
    }
    /* All providers failed — return structured no-results result */
    return {
      provider:         'none',
      search_id:        uuid(),
      cached:           false,
      fetched_at:       new Date().toISOString(),
      expires_at:       new Date(Date.now() + 60000).toISOString(),
      offers:           [],
      provider_errors:  errors,
    };
  },

  resolveIata, /* exported for use in search endpoint */
};

module.exports = FareRouter;

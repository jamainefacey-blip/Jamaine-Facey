/* ─────────────────────────────────────────────────────────────────────────────
   VST — Fare Search Frontend Module
   Calls the secure server-side /api/fares/search endpoint.
   API keys never touch the browser.
   ───────────────────────────────────────────────────────────────────────────── */

window.VSTFareSearch = (function () {
  'use strict';

  var ENDPOINT   = '/api/fares/search';
  var TIMEOUT_MS = 15000;

  /* ── Fetch with timeout ──────────────────────────────────────────────────── */
  function fetchWithTimeout(url, opts, ms) {
    return new Promise(function (resolve, reject) {
      var timer = setTimeout(function () { reject(new Error('fares:timeout')); }, ms);
      fetch(url, opts)
        .then(function (r) { clearTimeout(timer); resolve(r); })
        .catch(function (e) { clearTimeout(timer); reject(e); });
    });
  }

  /* ── search(params) → Promise<FareResult> ────────────────────────────────
     params:
       origin         — city name or IATA code
       destination    — city name or IATA code
       departureDate  — YYYY-MM-DD
       returnDate     — YYYY-MM-DD (omit for one-way)
       tripType       — 'return' | 'one_way'
       travellerCount — integer
       currency       — ISO 4217 (default GBP)
   ─────────────────────────────────────────────────────────────────────────── */
  function search(params) {
    return fetchWithTimeout(ENDPOINT, {
      method:  'POST',
      headers: { 'content-type': 'application/json' },
      body:    JSON.stringify(params),
    }, TIMEOUT_MS)
    .then(function (res) {
      if (!res.ok) throw new Error('fares:http:' + res.status);
      return res.json();
    });
  }

  return { search: search };

})();

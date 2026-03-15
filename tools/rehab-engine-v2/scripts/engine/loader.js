// ─────────────────────────────────────────────────────────────────────────────
// LOADER  —  Dynamic client + app bootstrap
//
// Reads ?client= from the URL query string and dynamically loads the matching
// client data file before launching app.js.
//
// Usage:
//   index.html?client=david-park          → loads david-park.js
//   index.html?client=james-chen          → loads james-chen.js
//   index.html                            → loads default client (sarah-thompson)
//
// Load order is strictly sequential:
//   1. engine/progress.js        (loaded statically in index.html)
//   2. engine/validate.js        (loaded statically in index.html)
//   3. engine/access.js          (loaded statically in index.html)
//   4. data/exercises.js         (loaded statically in index.html)
//   5. data/clients/<client>.js  (loaded dynamically here)
//   6. app.js                    (loaded dynamically here, after client)
//
// To add a new client: add the slug to KNOWN_CLIENTS below and create the file.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  const KNOWN_CLIENTS = [
    "sarah-thompson",   // multi_week       — 12-week ACL rehab
    "james-chen",       // one_off          — post-op day 3 single session
    "maria-santos",     // multi_week       — 4-week shoulder block
    "david-park",       // ongoing_coaching — chronic knee pain coaching
  ];

  const DEFAULT_CLIENT = "sarah-thompson";

  // ── Determine which client to load ────────────────────────────────────────
  const params = new URLSearchParams(location.search);
  const requested = params.get("client");
  const client = (requested && KNOWN_CLIENTS.includes(requested))
    ? requested
    : DEFAULT_CLIENT;

  if (requested && !KNOWN_CLIENTS.includes(requested)) {
    console.warn(`[loader] Unknown client "${requested}" — loading default (${DEFAULT_CLIENT}).`);
  }

  // ── Expose active client slug for debug / admin overlays ──────────────────
  window._ACTIVE_CLIENT = client;

  // ── Sequential dynamic loader ─────────────────────────────────────────────
  function loadScript(src, onLoad, onError) {
    const s     = document.createElement("script");
    s.src       = src;
    s.onload    = onLoad  || null;
    s.onerror   = onError || function () { _showLoadError(src); };
    document.head.appendChild(s);
  }

  function _showLoadError(src) {
    const main = document.getElementById("app-main");
    if (!main) return;
    main.innerHTML = `
    <div style="padding:40px 20px;text-align:center;max-width:400px;margin:0 auto">
      <div style="font-size:48px;margin-bottom:16px">&#9888;</div>
      <h2 style="font-size:20px;margin-bottom:8px">Could not load program</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:16px">
        Failed to load: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px">${src}</code>
      </p>
      <p style="color:#64748b;font-size:13px">
        Check that the client data file exists and try again.
      </p>
    </div>`;
  }

  // Chain: client data → app controller
  loadScript(
    `scripts/data/clients/${client}.js`,
    function onClientLoaded() {
      loadScript("scripts/app.js");
    }
  );

})();

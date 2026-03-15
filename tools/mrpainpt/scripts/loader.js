// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Shell Loader  v1.0
//  ─────────────────────────────────────────────────────────────────────────────
//
//  Reads ?module= and ?client= URL params.
//  Loads the appropriate client data file and module app script in sequence,
//  then calls MrPainPT.boot(moduleId) to hand off to the registered module.
//
//  Load order (all static scripts already on page before loader runs):
//    1. shell.js            — MrPainPT namespace + module registry
//    2. scripts/shared/     — progress.js, validate.js, access.js
//    3. Module reg files    — scripts/modules/<id>/<id>.js (register manifests)
//    4. data/exercises.js   — shared exercise library
//    5. loader.js           — this file: reads params, loads client + app, boots
//
//  Dynamic sequence (this file):
//    a) Resolve module ID  → read ?module= (default: "rehab")
//    b) Resolve client slug → read ?client= (default: "sarah-thompson")
//    c) Load styles for the resolved module (link tags)
//    d) Load client data   → scripts/data/clients/<slug>.js
//    e) Load module script → scripts/modules/<id>/app.js (from manifest.appScript)
//    f) Call MrPainPT.boot(moduleId) → shell calls mod.boot() → app inits
//
//  URL examples:
//    index.html                                    → rehab / sarah-thompson
//    index.html?module=rehab&client=james-chen     → rehab / james-chen (one_off)
//    index.html?module=rehab&client=david-park     → rehab / david-park (coaching)
//    index.html?module=rehab&client=maria-santos   → rehab / maria-santos (4-wk)
//
//  Adding a new module:
//    1. Create scripts/modules/<id>/<id>.js  (registerModule call)
//    2. Add <script> tag in index.html for <id>.js before loader.js
//    3. Create scripts/modules/<id>/app.js   (the SPA controller)
//    4. Add module to app.config.json modules[]
//    5. URL: ?module=<id>&client=<client>
//
//  Adding a new client:
//    1. Create scripts/data/clients/<slug>.js
//    2. Add slug to KNOWN_CLIENTS below
//    3. URL: ?client=<slug>
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── Known clients ─────────────────────────────────────────────────────────
  // Add new client slugs here when creating client data files.
  const KNOWN_CLIENTS = [
    "sarah-thompson",   // multi_week       — 12-week ACL rehab
    "james-chen",       // one_off          — post-op day 3 single session
    "maria-santos",     // multi_week       — 4-week shoulder block
    "david-park",       // ongoing_coaching — chronic knee pain coaching
  ];

  const DEFAULT_MODULE = "rehab";
  const DEFAULT_CLIENT = "sarah-thompson";

  // ── Resolve params ────────────────────────────────────────────────────────
  const params         = new URLSearchParams(location.search);
  const requestedMod   = params.get("module");
  const requestedClient = params.get("client");

  const moduleId = requestedMod || DEFAULT_MODULE;
  const client   = (requestedClient && KNOWN_CLIENTS.includes(requestedClient))
    ? requestedClient
    : DEFAULT_CLIENT;

  if (requestedClient && !KNOWN_CLIENTS.includes(requestedClient)) {
    console.warn(`[MrPainPT loader] Unknown client "${requestedClient}" — loading default (${DEFAULT_CLIENT}).`);
  }

  // ── Expose active context for debug ───────────────────────────────────────
  window._ACTIVE_MODULE = moduleId;
  window._ACTIVE_CLIENT = client;

  // ── Utilities ─────────────────────────────────────────────────────────────

  function loadScript(src, onLoad, onError) {
    const s   = document.createElement("script");
    s.src     = src;
    s.onload  = onLoad  || null;
    s.onerror = onError || function () { _showLoadError(src); };
    document.head.appendChild(s);
  }

  function loadStyle(href) {
    const l  = document.createElement("link");
    l.rel    = "stylesheet";
    l.href   = href;
    document.head.appendChild(l);
  }

  function _showLoadError(src) {
    const main = document.getElementById("app-main");
    if (!main) return;
    main.innerHTML = `
    <div style="padding:40px 20px;text-align:center;max-width:400px;margin:0 auto">
      <div style="font-size:48px;margin-bottom:16px">&#9888;</div>
      <h2 style="font-size:20px;margin-bottom:8px">Load error</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:16px">
        Could not load: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px">${src}</code>
      </p>
      <p style="color:#64748b;font-size:13px">
        Check the file exists and the URL params are correct.<br>
        Module: <strong>${moduleId}</strong> &middot; Client: <strong>${client}</strong>
      </p>
    </div>`;
  }

  function _showModuleNotRegistered(id) {
    const main = document.getElementById("app-main");
    if (!main) return;
    const registered = MrPainPT.getModules().map(m => m.id).join(", ") || "none";
    main.innerHTML = `
    <div style="padding:40px 20px;text-align:center;max-width:400px;margin:0 auto">
      <div style="font-size:48px;margin-bottom:16px">&#9888;</div>
      <h2 style="font-size:20px;margin-bottom:8px">Module not registered</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:16px">
        No module registered with id <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">${id}</code>.
      </p>
      <p style="color:#64748b;font-size:13px">
        Registered: <strong>${registered}</strong><br>
        Try: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px">?module=rehab</code>
      </p>
    </div>`;
  }

  // ── Boot sequence ─────────────────────────────────────────────────────────

  function boot() {
    // 1. Resolve the registered module manifest
    if (typeof MrPainPT === "undefined") {
      console.error("[MrPainPT loader] MrPainPT shell not found. Is shell.js loaded?");
      return;
    }

    const manifest = MrPainPT.getModule(moduleId);
    if (!manifest) {
      _showModuleNotRegistered(moduleId);
      return;
    }

    // 2. Inject module styles
    (manifest.styles || []).forEach(href => loadStyle(href));

    // 3a. Modules that manage their own client data skip client file loading.
    //     Set requiresClient: false in the module manifest to enable this.
    if (manifest.requiresClient === false) {
      loadScript(manifest.appScript, function onAppLoaded() {
        MrPainPT.boot(moduleId);
      });
      return;
    }

    // 3b. Load client data → apply any coach edits → load module app → boot
    //
    //  DB-first: if CoachStore is in API mode, fetch the client directly from the
    //  server (which returns server-resolved access). Skip the static file entirely.
    //  Fall back to static file + applyToGlobalsAsync if the API returns 404/error.

    function _bootApp() {
      loadScript(manifest.appScript, function onAppLoaded() {
        MrPainPT.boot(moduleId);
      });
    }

    function _loadStaticClient() {
      loadScript(
        `scripts/data/clients/${client}.js`,
        function onClientLoaded() {
          if (typeof CoachStore !== "undefined") {
            CoachStore.applyToGlobalsAsync(client, _bootApp);
          } else {
            _bootApp();
          }
        }
      );
    }

    if (typeof CoachStore !== "undefined" && CoachStore.getMode() === "api") {
      CoachStore.getClientAsync(client, function onApiClient(err, data) {
        if (!err && data && data.clientConfig) {
          // Server has this client — set globals from API response
          window.CLIENT_CONFIG = data.clientConfig;
          window.PROGRAM       = data.program || {};
          // Mirror server-resolved access (authoritative — cannot be bypassed client-side)
          if (data.access) {
            if (!window.PROGRAM.access) window.PROGRAM.access = {};
            if (data.access.type)   window.PROGRAM.access.type   = data.access.type;
            if (data.access.status) window.PROGRAM.access.status = data.access.status;
          }
          _bootApp();
        } else {
          // Client not yet in DB (404) or API error — fall back to static file
          _loadStaticClient();
        }
      });
    } else {
      _loadStaticClient();
    }
  }

  boot();

})();

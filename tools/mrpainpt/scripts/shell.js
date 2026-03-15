/* ─────────────────────────────────────────────────────────────────────────────
   Mr Pain PT — Application Shell  v1.0
   ─────────────────────────────────────────────────────────────────────────────

   RESPONSIBILITIES
   ─────────────────
   • Owns the global MrPainPT namespace
   • Maintains the module registry (registerModule / getModule / getModules)
   • Orchestrates the boot sequence (shell → module → client data → app)
   • Injects the module indicator into the header chrome
   • Exposes hooks for future cross-module navigation and auth

   BOOT SEQUENCE
   ─────────────
   index.html loads scripts in this order:
     1. shell.js          ← creates MrPainPT namespace (this file)
     2. shared utilities  ← progress.js, validate.js, access.js
     3. module reg files  ← scripts/modules/rehab/rehab.js etc.
     4. exercise library  ← data/exercises.js
     5. loader.js         ← reads ?module=&client=, loads data, calls MrPainPT.boot()

   MODULE API CONTRACT
   ────────────────────
   Each module registers an object with:
     {
       id:          string        — slug, matches ?module= URL param
       name:        string        — display name
       version:     string        — semver
       description: string        — shown in shell module list
       appScript:   string        — path to the module's SPA controller
       styles:      string[]      — CSS files to load at module mount
       boot():      function      — called by shell after all assets loaded
       getStatus(): function      — returns { mode, accessType, accessStatus }
     }

   ADDING A NEW MODULE
   ────────────────────
   1. Create scripts/modules/<id>/<id>.js
   2. Call MrPainPT.registerModule({ id, name, ... }) from that file
   3. Add to app.config.json modules[]
   4. Add to MODULE_APP_SCRIPTS in loader.js
   5. URL: index.html?module=<id>&client=<client-slug>

   FUTURE SHELL FEATURES (not yet built)
   ──────────────────────────────────────
   • Shell-level auth (JWT / session token check before any module loads)
   • Cross-module navigation (e.g. rehab → training → coaching)
   • Shared client account layer (single sign-on identity across modules)
   • Payment / entitlement layer above module-level AccessGuard
   • Module switcher UI in header (shown when > 1 module registered)
   ───────────────────────────────────────────────────────────────────────────── */

const MrPainPT = (function () {
  "use strict";

  const VERSION        = "1.0.0";
  const _modules       = {};          // id → module manifest
  let   _activeModule  = null;        // currently mounted module manifest
  let   _booted        = false;

  // ── Public API ─────────────────────────────────────────────────────────────

  const shell = {

    VERSION,

    // ── Module registry ─────────────────────────────────────────────────────

    /**
     * Register a module with the shell.
     * Called by each module's registration script on load.
     * @param {ModuleManifest} manifest
     */
    registerModule(manifest) {
      const required = ["id", "name", "version", "boot"];
      const missing  = required.filter(k => !manifest[k]);
      if (missing.length) {
        console.error(`[MrPainPT] registerModule: missing fields: ${missing.join(", ")}`, manifest);
        return;
      }
      _modules[manifest.id] = manifest;
      console.log(`[MrPainPT] Registered module: ${manifest.id} v${manifest.version}`);
    },

    getModule(id)  { return _modules[id] || null; },
    getModules()   { return Object.values(_modules); },
    activeModule() { return _activeModule; },

    // ── Boot ────────────────────────────────────────────────────────────────

    /**
     * Boot the requested module.
     * Called by loader.js after all assets (client data, exercise library,
     * module app script) have been loaded into the page.
     *
     * @param {string} moduleId  — the module to activate (matches ?module= param)
     */
    boot(moduleId) {
      if (_booted) return;
      _booted = true;

      const mod = _modules[moduleId];

      if (!mod) {
        _showModuleError(moduleId);
        return;
      }

      _activeModule = mod;

      // Inject the module indicator into the header right slot
      // (only when multiple modules are registered — single module stays clean)
      _injectModuleIndicator(mod);

      // Hand off to the module
      try {
        mod.boot();
        console.log(`[MrPainPT] Module booted: ${mod.id} v${mod.version}`);
      } catch (err) {
        console.error(`[MrPainPT] Module boot error (${mod.id}):`, err);
      }
    },

    // ── Navigation helpers ───────────────────────────────────────────────────

    /**
     * Navigate within the currently active module.
     * Thin wrapper over hash-based routing — the module owns its own hash state.
     */
    navigateInModule(view, param) {
      const newHash = param ? `${view}/${param}` : view;
      window.location.hash = newHash;
    },

    /**
     * Switch to a different module.
     * Future: cross-module navigation — updates ?module= and reloads.
     */
    switchModule(moduleId, clientSlug) {
      const params = new URLSearchParams(location.search);
      params.set("module", moduleId);
      if (clientSlug) params.set("client", clientSlug);
      location.search = params.toString();  // reload with new params
    },

    // ── Shared status ────────────────────────────────────────────────────────

    /**
     * Returns a snapshot of the currently active module's status.
     * Used by shell UI (future: module switcher, account panel).
     */
    getStatus() {
      if (!_activeModule?.getStatus) return null;
      try { return _activeModule.getStatus(); } catch (_) { return null; }
    },

  };

  // ── Private helpers ────────────────────────────────────────────────────────

  function _injectModuleIndicator(mod) {
    // Only inject a module pill when there are multiple modules registered
    // (single-module deployments keep the header clean)
    const all = Object.values(_modules);
    if (all.length <= 1) return;

    const right = document.getElementById("header-right");
    if (!right) return;

    const pill      = document.createElement("span");
    pill.className  = "shell-module-pill";
    pill.textContent = mod.name;
    pill.title       = `Active module: ${mod.name} v${mod.version}`;
    right.prepend(pill);
  }

  function _showModuleError(requestedId) {
    const main = document.getElementById("app-main");
    if (!main) return;
    const registered = Object.keys(_modules).join(", ") || "none";
    main.innerHTML = `
    <div style="padding:40px 24px;text-align:center;max-width:400px;margin:0 auto">
      <div style="font-size:48px;margin-bottom:16px">&#9888;</div>
      <h2 style="font-size:20px;margin-bottom:8px">Module not found</h2>
      <p style="color:#64748b;font-size:14px;line-height:1.6;margin-bottom:16px">
        No module registered with id <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px">${requestedId || "(none)"}</code>.
      </p>
      <p style="color:#64748b;font-size:13px">
        Registered: <strong>${registered}</strong><br>
        Try: <code style="background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:12px">?module=rehab</code>
      </p>
    </div>`;
  }

  return shell;

})();

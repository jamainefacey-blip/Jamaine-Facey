// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Rehab Module  (Module 1 registration)
//  ─────────────────────────────────────────────────────────────────────────────
//
//  This file registers the Rehabilitation module with the MrPainPT shell.
//  It is loaded statically in index.html before loader.js runs.
//
//  Responsibilities:
//   • Declare the module manifest to the shell (id, name, version, etc.)
//   • Provide a boot() that the shell calls after all assets are loaded
//   • Provide getStatus() so the shell can query the active module's state
//
//  The module's SPA controller (app.js) is loaded dynamically by loader.js
//  using the path declared in appScript. At boot() time, the client data and
//  app.js are already present on the page — this file just calls RehabApp.init().
//
//  ADDING A NEW MODULE (reference):
//   1. Create scripts/modules/<id>/<id>.js
//   2. Call MrPainPT.registerModule({ id, name, ... }) from that file
//   3. Add to app.config.json modules[]
//   4. Add <script> tag in index.html before loader.js
//   5. loader.js MODULE_APP_SCRIPTS must map the id to the appScript path
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  if (typeof MrPainPT === "undefined") {
    console.error("[Rehab] MrPainPT shell not found — shell.js must load before rehab.js");
    return;
  }

  MrPainPT.registerModule({

    id:          "rehab",
    name:        "Rehabilitation",
    version:     "2.0.0",
    description: "Coach-prescribed rehab programs. Supports one_off, multi_week, and ongoing_coaching delivery modes.",

    // Path to the SPA controller — loaded dynamically by loader.js before boot() is called.
    appScript:   "scripts/modules/rehab/app.js",

    // CSS files loaded at module mount by loader.js before boot().
    styles:      ["styles/rehab.css"],

    // ── boot ──────────────────────────────────────────────────────────────────
    // Called by the shell after:
    //   1. Client data script has been loaded (CLIENT_CONFIG + PROGRAM globals set)
    //   2. appScript (app.js) has been loaded (RehabApp global set)
    //   3. All styles have been injected
    boot() {
      if (typeof RehabApp === "undefined") {
        console.error("[Rehab] RehabApp not found — app.js did not load correctly.");
        return;
      }
      RehabApp.init();
    },

    // ── getStatus ─────────────────────────────────────────────────────────────
    // Returns a snapshot for the shell UI (module switcher, status panel).
    // RehabApp.getStatus() is defined in app.js.
    getStatus() {
      if (typeof RehabApp !== "undefined" && RehabApp.getStatus) {
        return RehabApp.getStatus();
      }
      return {
        mode:         null,
        accessType:   null,
        accessStatus: null,
      };
    },

  });

})();

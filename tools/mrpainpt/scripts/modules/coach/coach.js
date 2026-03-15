// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Coach Portal Module  (Module 2 registration)
//  ─────────────────────────────────────────────────────────────────────────────
//
//  Registers the Coach Portal with the MrPainPT shell.
//  URL: index.html?module=coach
//
//  requiresClient: false — the coach portal manages all clients itself.
//  loader.js will skip the ?client= resolution step for this module.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  if (typeof MrPainPT === "undefined") {
    console.error("[Coach] MrPainPT shell not found — shell.js must load before coach.js");
    return;
  }

  MrPainPT.registerModule({

    id:             "coach",
    name:           "Coach Portal",
    version:        "1.0.0",
    description:    "Admin panel for managing clients, programs, access, and coach notes without editing source files.",

    // No specific client needed — coach portal manages all clients.
    requiresClient: false,

    appScript:      "scripts/modules/coach/app.js",
    styles:         ["styles/coach.css"],

    boot() {
      if (typeof CoachApp === "undefined") {
        console.error("[Coach] CoachApp not found — app.js did not load correctly.");
        return;
      }
      CoachApp.init();
    },

    getStatus() {
      return typeof CoachApp !== "undefined" && CoachApp.getStatus
        ? CoachApp.getStatus()
        : { module: "coach", activeClient: null };
    },

  });

})();

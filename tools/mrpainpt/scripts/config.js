// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Runtime Config  v1.0
// ─────────────────────────────────────────────────────────────────────────────
//
//  Sets window.MRPAINPT_API_BASE — the base URL for all backend API calls.
//
//  Resolution order (first match wins):
//    1. data-api-base attribute on this <script> tag
//       <script src="scripts/config.js" data-api-base="https://api.mrpainpt.com"></script>
//    2. localhost origin → http://localhost:3000 (dev: separate processes)
//    3. Any other host  → "" (same-origin, production: reverse proxy or co-hosted)
//
//  Deployment guide:
//    Local dev   — no change needed; localhost is auto-detected.
//    Staging     — set data-api-base to your staging backend URL.
//    Production  — if frontend and backend share a domain, leave it empty ("")
//                  and configure a reverse proxy to forward /api/* to the backend.
//                  If they're on different domains, set data-api-base.
//
//  To override without editing this file:
//    Option A (recommended) — set data-api-base on the script tag in index.html.
//    Option B               — set window.MRPAINPT_API_BASE before this script loads.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // Skip if already set (e.g. injected by a CI/CD pipeline before this script)
  if (typeof window.MRPAINPT_API_BASE === "string") return;

  // 1. Explicit data attribute on the script tag
  const scriptEl = document.currentScript;
  if (scriptEl && scriptEl.dataset.apiBase !== undefined) {
    window.MRPAINPT_API_BASE = scriptEl.dataset.apiBase;
    return;
  }

  // 2 & 3. Environment auto-detect
  if (typeof location !== "undefined") {
    window.MRPAINPT_API_BASE = location.hostname === "localhost"
      ? "http://localhost:3000"   // dev: frontend and backend on different ports
      : "";                       // production: same-origin (nginx proxy forwards /api/*)
  } else {
    window.MRPAINPT_API_BASE = "";
  }
}());

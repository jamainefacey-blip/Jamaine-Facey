// ─────────────────────────────────────────────────────────────────────────────
// CLIENT REGISTRY
//
// The single source of truth for which clients exist in this coach portal.
//
// ADDING A CLIENT:
//   1. Create mrpainpt/clients/<slug>/ with the four canonical files.
//   2. Add a { slug, active } entry here.
//   3. Add the client's three <script> tags to apps/coach/index.html
//      (client.config.js, plan.js — exercises.js is not loaded, see loader.js).
//   4. Add the slug to the CLIENT_DATA_MAP in loader.js.
//
// PAUSING / DISCHARGING A CLIENT:
//   Set active: false — they remain in the portal (historical record)
//   but are visually marked and sorted after active clients.
//
// SLUG RULES:
//   Must match the folder name under mrpainpt/clients/<slug>/ exactly.
//   Lowercase, hyphenated, no spaces.
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_REGISTRY = [
  { slug: "sarah-thompson", active: true },
];

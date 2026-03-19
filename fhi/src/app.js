/**
 * Fraud Help Index — App Entry Point
 * Thin bootstrap: wires router, nav, role toggle, seed data.
 * All logic lives in views/ and ui/ modules.
 */

import * as store from "../utils/store.js";
import { loadSeedDataIfEmpty } from "../data/seed.js";
import * as appState from "./state/appState.js";
import * as router from "./ui/router.js";

// Views
import * as feedView from "./views/feed.js";
import * as searchView from "./views/search.js";
import * as reportView from "./views/report.js";
import * as detailView from "./views/detail.js";
import * as moderationView from "./views/moderation.js";

// ── Seed data on first load ───────────────────────────
loadSeedDataIfEmpty(store);

// ── Register views with router ────────────────────────
router.registerView("feed", feedView.render);
router.registerView("search", searchView.render);
router.registerView("report", reportView.render);
router.registerView("detail", detailView.render);
router.registerView("moderation", moderationView.render);

// ── Nav clicks ────────────────────────────────────────
const $nav = document.getElementById("app-nav");
$nav.addEventListener("click", e => {
  const btn = e.target.closest(".nav-item");
  if (!btn) return;
  window.location.hash = `#${btn.dataset.view}`;
});

// ── Role toggle ───────────────────────────────────────
const $role = document.getElementById("role-toggle");
updateRoleUI();

$role.addEventListener("click", () => {
  appState.toggleRole();
  updateRoleUI();
  router.start(); // re-render current view
});

// Re-render role UI when state changes externally
appState.subscribe(() => updateRoleUI());

function updateRoleUI() {
  const role = appState.get("role");
  $role.textContent = role === "moderator" ? "Moderator" : "Reporter";
  $role.className = `role-toggle role-${role}`;
  const modNav = document.getElementById("nav-mod");
  if (modNav) modNav.style.display = role === "moderator" ? "" : "none";
}

// ── Start router ──────────────────────────────────────
router.start();

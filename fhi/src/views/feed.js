/**
 * FHI — Feed View
 * Phase 3: Advanced filter panel (severity, status, harm),
 * category pills, combined filtering.
 */

import { CATEGORIES } from "../../data/categories.js";
import { escapeHtml } from "../../utils/sanitise.js";
import * as store from "../../utils/store.js";
import * as appState from "../state/appState.js";
import { $main, renderReportCards, bindCardClicks, renderFilterPanel, bindFilterPanel } from "../ui/dom.js";

export function render() {
  const reports = store.queryReports({ excludeArchived: true });
  const counts = {
    total: reports.length,
    submitted: reports.filter(r => r.status === "submitted").length,
    confirmed: reports.filter(r => r.status === "confirmed").length,
    resolved:  reports.filter(r => r.status === "resolved").length,
  };

  const activeFilter = appState.get("feedFilter") || "";
  const feedFilters = appState.get("feedAdvanced") || {};

  $main().innerHTML = `
    <div class="hero">
      <div class="hero-title">Fraud Help Index</div>
      <div class="hero-sub">Report scams, search known fraud cases, and help protect others.</div>
      <div class="hero-ctas">
        <a href="#report" class="btn btn-primary btn-lg">Report Fraud</a>
        <a href="#search" class="btn btn-outline btn-lg">Search Cases</a>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-chip"><div class="stat-value">${counts.total}</div><div class="stat-label">Total Reports</div></div>
      <div class="stat-chip"><div class="stat-value">${counts.submitted}</div><div class="stat-label">Pending</div></div>
      <div class="stat-chip"><div class="stat-value">${counts.confirmed}</div><div class="stat-label">Confirmed</div></div>
      <div class="stat-chip"><div class="stat-value">${counts.resolved}</div><div class="stat-label">Resolved</div></div>
    </div>

    <div class="section-title">
      Recent Cases <span class="section-count">${reports.length}</span>
      <button class="btn btn-ghost btn-sm" id="toggle-filters" style="margin-left:auto;">Filters</button>
    </div>

    <div id="advanced-filters" class="collapsible ${feedFilters._open ? "open" : ""}">
      ${renderFilterPanel("feed-advanced", {
        activeSeverity: feedFilters.severity || "",
        activeStatus: feedFilters.status || "",
        activeHarm: feedFilters.harm || "",
      })}
    </div>

    <div class="cat-pills" id="feed-filters">
      <button class="cat-pill ${!activeFilter ? "active" : ""}" data-cat="">All</button>
      ${CATEGORIES.map(c => `<button class="cat-pill ${activeFilter === c.id ? "active" : ""}" data-cat="${c.id}">${c.icon} ${escapeHtml(c.label)}</button>`).join("")}
    </div>

    <div id="feed-list">
      ${renderReportCards(applyFilters(reports, activeFilter, feedFilters))}
    </div>
  `;

  // Toggle advanced filters
  document.getElementById("toggle-filters").addEventListener("click", () => {
    const el = document.getElementById("advanced-filters");
    el.classList.toggle("open");
    const current = appState.get("feedAdvanced") || {};
    appState.set({ feedAdvanced: { ...current, _open: el.classList.contains("open") } });
  });

  // Advanced filter changes
  bindFilterPanel("feed-advanced", (filters) => {
    const current = appState.get("feedAdvanced") || {};
    appState.set({ feedAdvanced: { ...current, ...filters } });
    refreshList();
  });

  // Category filter handler
  document.getElementById("feed-filters").addEventListener("click", e => {
    const pill = e.target.closest(".cat-pill");
    if (!pill) return;
    document.querySelectorAll("#feed-filters .cat-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    appState.set({ feedFilter: pill.dataset.cat });
    refreshList();
  });

  function refreshList() {
    const cat = appState.get("feedFilter") || "";
    const adv = appState.get("feedAdvanced") || {};
    const all = store.queryReports({ excludeArchived: true });
    document.getElementById("feed-list").innerHTML = renderReportCards(applyFilters(all, cat, adv));
    bindCardClicks();
  }

  bindCardClicks();
}

function applyFilters(reports, category, advanced) {
  const opts = { excludeArchived: true };
  if (category) opts.category = category;
  if (advanced.severity) opts.severity = advanced.severity;
  if (advanced.status)   opts.status = advanced.status;
  if (advanced.harm)     opts.harmTier = advanced.harm;
  return store.queryReports(opts);
}

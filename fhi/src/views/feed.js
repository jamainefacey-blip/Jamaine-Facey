/**
 * FHI — Feed View
 * Hero CTAs, stats, category filter, report cards with trust scores.
 */

import { CATEGORIES } from "../../data/categories.js";
import { escapeHtml } from "../../utils/sanitise.js";
import * as store from "../../utils/store.js";
import * as appState from "../state/appState.js";
import { $main, renderReportCards, bindCardClicks } from "../ui/dom.js";

export function render() {
  const reports = store.queryReports({});
  const counts = {
    total: reports.length,
    submitted: reports.filter(r => r.status === "submitted").length,
    confirmed: reports.filter(r => r.status === "confirmed").length,
    resolved:  reports.filter(r => r.status === "resolved").length,
  };

  const activeFilter = appState.get("feedFilter") || "";

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

    <div class="section-title">Recent Cases <span class="section-count">${reports.length}</span></div>

    <div class="cat-pills" id="feed-filters">
      <button class="cat-pill ${!activeFilter ? "active" : ""}" data-cat="">All</button>
      ${CATEGORIES.map(c => `<button class="cat-pill ${activeFilter === c.id ? "active" : ""}" data-cat="${c.id}">${c.icon} ${escapeHtml(c.label)}</button>`).join("")}
    </div>

    <div id="feed-list">
      ${renderReportCards(activeFilter ? store.queryReports({ category: activeFilter }) : reports)}
    </div>
  `;

  // Filter handler
  document.getElementById("feed-filters").addEventListener("click", e => {
    const pill = e.target.closest(".cat-pill");
    if (!pill) return;
    document.querySelectorAll("#feed-filters .cat-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    const cat = pill.dataset.cat;
    appState.set({ feedFilter: cat });
    const filtered = store.queryReports({ category: cat || undefined });
    document.getElementById("feed-list").innerHTML = renderReportCards(filtered);
    bindCardClicks();
  });

  bindCardClicks();
}

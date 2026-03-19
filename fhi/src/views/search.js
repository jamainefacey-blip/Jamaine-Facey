/**
 * FHI — Search View
 * Phase 3: Severity/status/harm filters alongside search,
 * contactMethod included in search results.
 */

import { CATEGORIES } from "../../data/categories.js";
import { escapeHtml } from "../../utils/sanitise.js";
import * as store from "../../utils/store.js";
import * as appState from "../state/appState.js";
import { $main, renderReportCards, bindCardClicks, renderFilterPanel, bindFilterPanel } from "../ui/dom.js";

export function render() {
  const savedQuery = appState.get("searchQuery") || "";
  const savedCat = appState.get("searchCategory") || "";
  const searchFilters = appState.get("searchAdvanced") || {};

  $main().innerHTML = `
    <div class="section-title" style="margin-bottom:16px;">Search Cases</div>
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input class="form-input" id="search-input" type="text"
        placeholder="Search reports, scammer info, phone numbers…"
        value="${escapeHtml(savedQuery)}" autofocus />
      <button class="search-clear ${savedQuery ? "visible" : ""}" id="search-clear">✕</button>
    </div>

    <div class="cat-pills" id="search-cat-filters">
      <button class="cat-pill ${!savedCat ? "active" : ""}" data-cat="">All categories</button>
      ${CATEGORIES.filter(c => c.id !== "other").map(c =>
        `<button class="cat-pill ${savedCat === c.id ? "active" : ""}" data-cat="${c.id}">${c.icon} ${escapeHtml(c.label)}</button>`
      ).join("")}
    </div>

    <details class="search-advanced-toggle" ${searchFilters._open ? "open" : ""}>
      <summary class="btn btn-ghost btn-sm" style="margin-bottom:12px;">Advanced filters</summary>
      ${renderFilterPanel("search-advanced", {
        activeSeverity: searchFilters.severity || "",
        activeStatus: searchFilters.status || "",
        activeHarm: searchFilters.harm || "",
      })}
    </details>

    <div id="search-results">
      ${savedQuery.length >= 2 ? renderResults(savedQuery, savedCat, searchFilters) : renderInitialState()}
    </div>
  `;

  const input = document.getElementById("search-input");
  const clearBtn = document.getElementById("search-clear");

  // Track details open state
  const details = document.querySelector(".search-advanced-toggle");
  if (details) {
    details.addEventListener("toggle", () => {
      const current = appState.get("searchAdvanced") || {};
      appState.set({ searchAdvanced: { ...current, _open: details.open } });
    });
  }

  let debounce = null;
  input.addEventListener("input", () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => doSearch(), 200);
  });

  clearBtn.addEventListener("click", () => {
    input.value = "";
    clearBtn.classList.remove("visible");
    appState.set({ searchQuery: "" });
    document.getElementById("search-results").innerHTML = renderInitialState();
  });

  // Category filter
  document.getElementById("search-cat-filters").addEventListener("click", e => {
    const pill = e.target.closest(".cat-pill");
    if (!pill) return;
    document.querySelectorAll("#search-cat-filters .cat-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    appState.set({ searchCategory: pill.dataset.cat });
    doSearch();
  });

  // Advanced filter changes
  bindFilterPanel("search-advanced", (filters) => {
    const current = appState.get("searchAdvanced") || {};
    appState.set({ searchAdvanced: { ...current, ...filters } });
    doSearch();
  });

  function doSearch() {
    const q = input.value.trim();
    appState.set({ searchQuery: q });
    clearBtn.classList.toggle("visible", q.length > 0);

    if (q.length < 2) {
      document.getElementById("search-results").innerHTML = renderInitialState();
      return;
    }

    const cat = appState.get("searchCategory") || "";
    const adv = appState.get("searchAdvanced") || {};
    document.getElementById("search-results").innerHTML = renderResults(q, cat, adv);
    bindCardClicks();
  }

  // Bind cards if already showing results
  if (savedQuery.length >= 2) bindCardClicks();
}

function renderResults(query, category, advanced = {}) {
  const opts = { search: query, excludeArchived: true };
  if (category)         opts.category = category;
  if (advanced.severity) opts.severity = advanced.severity;
  if (advanced.status)   opts.status = advanced.status;
  if (advanced.harm)     opts.harmTier = advanced.harm;
  const results = store.queryReports(opts);

  const countHtml = `<div class="search-result-count">${results.length} result${results.length !== 1 ? "s" : ""} for "<strong>${escapeHtml(query)}</strong>"</div>`;

  if (results.length === 0) {
    return countHtml + renderNoResults(query);
  }

  return countHtml + renderReportCards(results, { highlight: query });
}

function renderInitialState() {
  return `
    <div class="empty-state">
      <div class="empty-state-icon">🔍</div>
      <div class="empty-state-title">Search the index</div>
      <p>Type a keyword, phone number, email, or URL to find matching fraud reports.</p>
    </div>
  `;
}

function renderNoResults(query) {
  return `
    <div class="empty-state" style="padding-bottom:16px;">
      <div class="empty-state-icon">😔</div>
      <div class="empty-state-title">No matching reports</div>
      <p>We couldn't find anything for "${escapeHtml(query)}".</p>
    </div>
    <div class="search-tips">
      <div class="search-tips-title">Search tips</div>
      <ul>
        <li>Try different keywords (e.g. "HSBC email" or "crypto")</li>
        <li>Search for scammer details: phone numbers, emails, URLs</li>
        <li>Use shorter terms — "phishing" instead of "phishing email scam"</li>
        <li>Remove category or advanced filters to broaden results</li>
        <li>Can't find it? <a href="#report">Submit a new report</a></li>
      </ul>
    </div>
  `;
}

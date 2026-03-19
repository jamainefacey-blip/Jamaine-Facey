/**
 * FHI — DOM Helpers
 * Shared rendering utilities used across views.
 */

import { escapeHtml, escapeReportForRender } from "../../utils/sanitise.js";
import { getCategoryById, getSeverityById, getStatusById } from "../../data/categories.js";
import { renderTrustBadge } from "../../utils/trustScore.js";

/** Main content container */
export function $main() {
  return document.getElementById("app-main");
}

/**
 * Render a list of report cards with trust indicators.
 */
export function renderReportCards(reports, { highlight = "" } = {}) {
  if (reports.length === 0) {
    return `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">No reports found</div><p>Try a different filter or submit a new report.</p></div>`;
  }
  return reports.map(r => renderCard(r, highlight)).join("");
}

function renderCard(r, highlight) {
  const safe = escapeReportForRender(r);
  const cat = getCategoryById(r.category);
  const sev = getSeverityById(r.severity);
  const st  = getStatusById(r.status);
  const trustBadge = renderTrustBadge(r);

  const title = highlight ? highlightText(safe.title, highlight) : safe.title;
  const desc  = highlight ? highlightText(safe.description, highlight) : safe.description;

  return `
    <div class="card card-clickable" data-id="${r.id}">
      <div class="card-header">
        <span class="card-icon">${cat.icon}</span>
        <div class="card-title">${title}</div>
      </div>
      <div class="card-meta">
        ${trustBadge}
        <span class="badge badge-severity-${r.severity}">${sev.label}</span>
        <span class="badge badge-status-${r.status}">${st.label}</span>
        <span>${formatDate(r.createdAt)}</span>
        ${r.amountLost ? `<span>£${Number(r.amountLost).toLocaleString()}</span>` : ""}
      </div>
      <div class="card-desc">${desc}</div>
      <div class="card-footer">
        <span class="card-signal">👍 <span class="card-signal-count">${r.confirmCount || 0}</span></span>
        <span class="card-signal">🚩 <span class="card-signal-count">${r.flagCount || 0}</span></span>
        <span style="margin-left:auto;font-size:11px;color:var(--fhi-text-xdim);">${escapeHtml(cat.label)}</span>
      </div>
    </div>
  `;
}

/**
 * Bind click handlers on all .card-clickable elements in container.
 */
export function bindCardClicks(container) {
  const el = container || document;
  el.querySelectorAll(".card-clickable").forEach(card => {
    card.addEventListener("click", () => {
      window.location.hash = `#detail/${card.dataset.id}`;
    });
  });
}

/**
 * Highlight search term in text (HTML-safe).
 */
export function highlightText(safeText, query) {
  if (!query || query.length < 2) return safeText;
  const safeQuery = escapeHtml(query);
  const regex = new RegExp(`(${escapeRegex(safeQuery)})`, "gi");
  return safeText.replace(regex, `<mark>$1</mark>`);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Render progress bar for multi-step form.
 */
export function renderProgressBar(steps, currentStep) {
  const dots = steps.map((label, i) => {
    const cls = i < currentStep ? "done" : i === currentStep ? "active" : "";
    const icon = i < currentStep ? "✓" : String(i + 1);
    return `
      <div class="progress-step">
        <div class="progress-dot ${cls}">${icon}</div>
        ${i < steps.length - 1 ? `<div class="progress-line ${i < currentStep ? "done" : ""}"></div>` : ""}
      </div>
    `;
  }).join("");

  const labels = steps.map((label, i) => {
    const cls = i < currentStep ? "done" : i === currentStep ? "active" : "";
    return `<div class="progress-label ${cls}">${label}</div>`;
  }).join("");

  return `
    <div class="progress-bar">${dots}</div>
    <div class="progress-labels">${labels}</div>
  `;
}

/**
 * Format ISO date to human-readable.
 */
export function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

/**
 * FHI — Detail View
 * Full report display, trust score breakdown, community signals,
 * moderator actions panel.
 */

import { REPORT_STATUSES, getCategoryById, getSeverityById, getStatusById } from "../../data/categories.js";
import { escapeHtml, escapeReportForRender } from "../../utils/sanitise.js";
import { renderTrustBreakdown } from "../../utils/trustScore.js";
import * as store from "../../utils/store.js";
import * as appState from "../state/appState.js";
import { $main, formatDate } from "../ui/dom.js";
import * as toast from "../ui/toast.js";
import * as modal from "../ui/modal.js";

export function render(params) {
  const id = params[0];
  const report = store.getReportById(id);

  if (!report) {
    $main().innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-title">Report not found</div>
        <p>This report may have been deleted. <a href="#feed">Back to feed</a></p>
      </div>
    `;
    return;
  }

  const safe = escapeReportForRender(report);
  const cat = getCategoryById(report.category);
  const sev = getSeverityById(report.severity);
  const st  = getStatusById(report.status);
  const isMod = appState.isModerator();

  $main().innerHTML = `
    <div class="back-link" id="go-back">← Back</div>

    <div class="detail-header">
      <div class="card-meta" style="margin-bottom:10px;">
        <span class="badge badge-severity-${report.severity}">${sev.label}</span>
        <span class="badge badge-status-${report.status}">${st.label}</span>
        <span>${cat.icon} ${escapeHtml(cat.label)}</span>
      </div>
      <div class="detail-title">${safe.title}</div>
      <div class="card-meta">
        <span>Reported ${formatDate(report.createdAt)}</span>
        ${report.incidentDate ? `<span>Incident: ${escapeHtml(report.incidentDate)}</span>` : ""}
        ${report.amountLost ? `<span>Lost: £${Number(report.amountLost).toLocaleString()}</span>` : ""}
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Trust Score</div>
      ${renderTrustBreakdown(report)}
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Description</div>
      <div class="detail-body">${safe.description}</div>
    </div>

    ${report.contactMethod ? `
      <div class="detail-section">
        <div class="detail-section-title">Contact Method</div>
        <div class="detail-body">${safe.contactMethod}</div>
      </div>
    ` : ""}

    ${report.scammerIdentifiers && report.scammerIdentifiers.length ? `
      <div class="detail-section">
        <div class="detail-section-title">Scammer Identifiers</div>
        <ul class="evidence-list">
          ${report.scammerIdentifiers.map(s => `<li class="evidence-item">${escapeHtml(s)}</li>`).join("")}
        </ul>
      </div>
    ` : ""}

    ${report.evidenceLinks && report.evidenceLinks.length ? `
      <div class="detail-section">
        <div class="detail-section-title">Evidence Links</div>
        <ul class="evidence-list">
          ${report.evidenceLinks.map(l => `<li class="evidence-item"><a href="${escapeHtml(l)}" target="_blank" rel="noopener noreferrer">${escapeHtml(l)}</a></li>`).join("")}
        </ul>
      </div>
    ` : ""}

    <div class="signal-bar">
      <button class="signal-btn" id="btn-confirm">👍 <span>I experienced this too</span> <span class="signal-count">${report.confirmCount || 0}</span></button>
      <button class="signal-btn" id="btn-flag">🚩 <span>Flag</span> <span class="signal-count">${report.flagCount || 0}</span></button>
    </div>

    ${report.moderatorNotes ? `
      <div class="detail-section" style="margin-top:20px;">
        <div class="detail-section-title">Moderator Notes</div>
        <div class="detail-body">${escapeHtml(report.moderatorNotes)}</div>
      </div>
    ` : ""}

    ${isMod ? renderModeratorPanel(report) : ""}
  `;

  // Event bindings
  document.getElementById("go-back").addEventListener("click", () => history.back());

  document.getElementById("btn-confirm").addEventListener("click", () => {
    store.confirmReport(report.id);
    toast.success("Confirmation recorded");
    render(params);
  });

  document.getElementById("btn-flag").addEventListener("click", () => {
    store.flagReport(report.id);
    toast.show("Report flagged", "error");
    render(params);
  });

  if (isMod) bindModeratorActions(report, params);
}

// ── Moderator Panel ───────────────────────────────────

function renderModeratorPanel(report) {
  return `
    <div class="detail-section" style="border-top:1px solid var(--fhi-border);padding-top:20px;margin-top:24px;">
      <div class="detail-section-title">Moderator Actions</div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="mod-notes" placeholder="Add moderator notes…">${escapeHtml(report.moderatorNotes || "")}</textarea>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${REPORT_STATUSES.filter(s => s.id !== report.status).map(s =>
          `<button class="btn btn-sm btn-outline mod-status-btn" data-status="${s.id}">→ ${s.label}</button>`
        ).join("")}
        <button class="btn btn-sm btn-danger" id="mod-delete">Delete</button>
      </div>
    </div>
  `;
}

function bindModeratorActions(report, params) {
  document.querySelectorAll(".mod-status-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const newStatus = btn.dataset.status;
      const notes = document.getElementById("mod-notes")?.value || "";
      store.updateReportStatus(report.id, newStatus, notes);
      toast.success(`Status changed to ${newStatus.replace("_", " ")}`);
      render(params);
    });
  });

  const delBtn = document.getElementById("mod-delete");
  if (delBtn) {
    delBtn.addEventListener("click", async () => {
      const confirmed = await modal.confirm({
        title: "Delete Report",
        body: "This will permanently delete this report. This action cannot be undone.",
        confirmLabel: "Delete",
        confirmClass: "btn-danger",
      });
      if (confirmed) {
        store.deleteReport(report.id);
        toast.success("Report deleted");
        window.location.hash = "#feed";
      }
    });
  }
}

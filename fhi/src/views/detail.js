/**
 * FHI — Detail View
 * Phase 3: Status explanations, moderation history timeline,
 * dispute flow, archive-before-delete, audit trail on detail.
 */

import { REPORT_STATUSES, getCategoryById, getSeverityById, getStatusById } from "../../data/categories.js";
import { escapeHtml, escapeReportForRender } from "../../utils/sanitise.js";
import { renderTrustBreakdown } from "../../utils/trustScore.js";
import * as store from "../../utils/store.js";
import * as appState from "../state/appState.js";
import { $main, formatDate, formatDateTime } from "../ui/dom.js";
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

    <!-- Status explanation -->
    <div class="status-explanation">
      <div class="status-explanation-icon">${getStatusIcon(report.status)}</div>
      <div class="status-explanation-text">${escapeHtml(st.explanation || st.description)}</div>
    </div>

    <div class="detail-section">
      <div class="detail-section-title">Credibility Assessment</div>
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
      <button class="signal-btn" id="btn-flag">🚩 <span>Flag as inaccurate</span> <span class="signal-count">${report.flagCount || 0}</span></button>
      <button class="signal-btn signal-btn-dispute" id="btn-dispute">⚖ <span>Dispute</span> <span class="signal-count">${report.disputeCount || 0}</span></button>
    </div>

    ${renderModerationHistory(report)}

    ${report.moderatorNotes ? `
      <div class="detail-section">
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
    toast.success("Confirmation recorded — this strengthens the report's credibility");
    render(params);
  });

  document.getElementById("btn-flag").addEventListener("click", () => {
    store.flagReport(report.id);
    toast.show("Report flagged for review", "error");
    render(params);
  });

  document.getElementById("btn-dispute").addEventListener("click", async () => {
    const confirmed = await modal.confirm({
      title: "Dispute This Report",
      body: "Filing a dispute will flag this report for moderator re-review. Disputes reduce the report's credibility score. Use this if you believe the report is inaccurate or misleading.",
      confirmLabel: "File Dispute",
      confirmClass: "btn-warn",
    });
    if (confirmed) {
      store.disputeReport(report.id, "Community dispute filed");
      toast.show("Dispute filed — report queued for re-review", "error");
      render(params);
    }
  });

  if (isMod) bindModeratorActions(report, params);
}

// ── Status Icon ───────────────────────────────────────

function getStatusIcon(status) {
  const icons = {
    submitted: "📥", under_review: "🔍", confirmed: "✅",
    resolved: "🏁", disputed: "⚖", rejected: "❌", archived: "📦",
  };
  return icons[status] || "📋";
}

// ── Moderation History Timeline ───────────────────────

function renderModerationHistory(report) {
  const history = report.moderationHistory || [];
  if (history.length === 0) return "";

  const items = history.map(h => {
    const toStatus = getStatusById(h.to);
    return `
      <div class="timeline-item">
        <div class="timeline-dot" style="background:${toStatus.color};"></div>
        <div class="timeline-content">
          <div class="timeline-action">
            <span class="badge badge-status-${h.to}" style="font-size:10px;">${toStatus.label}</span>
            <span class="timeline-time">${formatDateTime(h.timestamp)}</span>
          </div>
          ${h.notes ? `<div class="timeline-notes">${escapeHtml(h.notes)}</div>` : ""}
        </div>
      </div>
    `;
  }).join("");

  return `
    <div class="detail-section" style="margin-top:20px;">
      <div class="detail-section-title">Case History</div>
      <div class="timeline">${items}</div>
    </div>
  `;
}

// ── Moderator Panel ───────────────────────────────────

function renderModeratorPanel(report) {
  // Valid transitions based on current status
  const transitions = getValidTransitions(report.status);

  return `
    <div class="mod-panel">
      <div class="detail-section-title">Moderator Actions</div>
      <div class="form-group">
        <label class="form-label">Moderator Notes</label>
        <textarea class="form-textarea" id="mod-notes" placeholder="Add context, reasoning, or instructions for other moderators…">${escapeHtml(report.moderatorNotes || "")}</textarea>
        <div class="form-hint">Notes are visible on the report and logged in case history.</div>
      </div>
      <div class="mod-actions">
        ${transitions.map(s => {
          const st = getStatusById(s);
          return `<button class="btn btn-sm mod-status-btn mod-btn-${s}" data-status="${s}" title="${escapeHtml(st.explanation || "")}">${st.actionLabel || st.label}</button>`;
        }).join("")}
      </div>
      <div class="mod-danger-zone">
        <div class="mod-danger-label">Danger zone</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-outline" id="mod-archive" style="border-color:var(--fhi-warn);color:var(--fhi-warn);">Archive</button>
          <button class="btn btn-sm btn-danger" id="mod-delete">Permanently Delete</button>
        </div>
      </div>
    </div>
  `;
}

function getValidTransitions(currentStatus) {
  const graph = {
    submitted:    ["under_review", "confirmed", "rejected"],
    under_review: ["confirmed", "rejected", "disputed"],
    confirmed:    ["resolved", "disputed"],
    resolved:     ["confirmed"],
    disputed:     ["under_review", "confirmed", "rejected"],
    rejected:     ["under_review"],
    archived:     ["submitted"],
  };
  return graph[currentStatus] || [];
}

function bindModeratorActions(report, params) {
  document.querySelectorAll(".mod-status-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const newStatus = btn.dataset.status;
      const st = getStatusById(newStatus);
      const notes = document.getElementById("mod-notes")?.value || "";

      // Confirm destructive transitions
      if (newStatus === "rejected") {
        const confirmed = await modal.confirm({
          title: "Reject Report",
          body: "Rejecting this report will mark it as invalid. It will remain on record but receive a negative credibility score.",
          confirmLabel: "Reject",
          confirmClass: "btn-danger",
        });
        if (!confirmed) return;
      }

      store.updateReportStatus(report.id, newStatus, notes);
      toast.success(`Status changed to ${st.label}`);
      render(params);
    });
  });

  // Archive flow
  const archiveBtn = document.getElementById("mod-archive");
  if (archiveBtn) {
    archiveBtn.addEventListener("click", async () => {
      const confirmed = await modal.confirm({
        title: "Archive Report",
        body: "Archiving removes this report from active feeds and search results. It remains on record and can be restored.",
        confirmLabel: "Archive",
        confirmClass: "btn-warn",
      });
      if (confirmed) {
        const notes = document.getElementById("mod-notes")?.value || "";
        store.archiveReport(report.id, notes || "Archived by moderator");
        toast.success("Report archived");
        render(params);
      }
    });
  }

  // Delete flow — requires archive first (unless already archived)
  const delBtn = document.getElementById("mod-delete");
  if (delBtn) {
    delBtn.addEventListener("click", async () => {
      if (report.status !== "archived") {
        const archiveFirst = await modal.confirm({
          title: "Archive First?",
          body: "This report is still active. It's recommended to archive reports before permanent deletion. Archive it first?",
          confirmLabel: "Archive Instead",
          confirmClass: "btn-warn",
          cancelLabel: "Delete Anyway",
        });
        if (archiveFirst) {
          store.archiveReport(report.id, "Archived before deletion attempt");
          toast.success("Report archived — you can delete it from the archived state");
          render(params);
          return;
        }
      }

      const confirmed = await modal.confirm({
        title: "Permanently Delete Report",
        body: "This will permanently and irreversibly delete this report. All case history and audit data will be lost. This action cannot be undone.",
        confirmLabel: "Delete Forever",
        confirmClass: "btn-danger",
      });
      if (confirmed) {
        store.deleteReport(report.id);
        toast.success("Report permanently deleted");
        window.location.hash = "#feed";
      }
    });
  }
}

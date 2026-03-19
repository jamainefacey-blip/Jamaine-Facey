/**
 * FHI — Moderation View
 * Phase 3: Audit log, dispute queue, archived section,
 * per-status stats, stronger review workflow.
 */

import { escapeHtml } from "../../utils/sanitise.js";
import { getStatusById } from "../../data/categories.js";
import * as store from "../../utils/store.js";
import { loadSeedDataIfEmpty } from "../../data/seed.js";
import * as appState from "../state/appState.js";
import { $main, renderReportCards, bindCardClicks, formatDateTime } from "../ui/dom.js";
import * as toast from "../ui/toast.js";
import * as modal from "../ui/modal.js";

export function render() {
  if (!appState.isModerator()) {
    $main().innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔒</div>
        <div class="empty-state-title">Moderator access required</div>
        <p>Toggle your role using the button in the header.</p>
      </div>
    `;
    return;
  }

  const all = store.getAllReports();
  const queue     = all.filter(r => r.status === "submitted" || r.status === "under_review");
  const disputed  = all.filter(r => r.status === "disputed");
  const flagged   = all.filter(r => r.flagCount > 0 && r.status !== "archived").sort((a, b) => b.flagCount - a.flagCount);
  const confirmed = all.filter(r => r.status === "confirmed");
  const resolved  = all.filter(r => r.status === "resolved");
  const archived  = all.filter(r => r.status === "archived");
  const totalLoss = all.reduce((sum, r) => sum + (Number(r.amountLost) || 0), 0);
  const auditLog  = store.getAuditLog().slice(0, 20);

  $main().innerHTML = `
    <div class="section-title" style="margin-bottom:20px;">Moderation Panel</div>

    <div class="stats-row stats-row-wide">
      <div class="stat-chip"><div class="stat-value">${all.length}</div><div class="stat-label">Total</div></div>
      <div class="stat-chip stat-chip-alert"><div class="stat-value">${queue.length}</div><div class="stat-label">Queue</div></div>
      <div class="stat-chip ${disputed.length ? "stat-chip-warn" : ""}"><div class="stat-value">${disputed.length}</div><div class="stat-label">Disputed</div></div>
      <div class="stat-chip"><div class="stat-value">${flagged.length}</div><div class="stat-label">Flagged</div></div>
      <div class="stat-chip"><div class="stat-value">${confirmed.length}</div><div class="stat-label">Confirmed</div></div>
      <div class="stat-chip"><div class="stat-value">£${totalLoss.toLocaleString()}</div><div class="stat-label">Total Loss</div></div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:24px;flex-wrap:wrap;">
      <button class="btn btn-sm btn-outline" id="export-btn">Export JSON</button>
      <button class="btn btn-sm btn-danger" id="reset-btn">Reset Data</button>
    </div>

    <!-- Review Queue -->
    <div class="section-title">Review Queue <span class="section-count">${queue.length}</span></div>
    ${queue.length ? renderReportCards(queue) : `<div class="empty-state" style="padding:20px;"><p>No reports awaiting review.</p></div>`}

    <!-- Disputed -->
    ${disputed.length ? `
      <div class="section-title" style="margin-top:24px;">Disputed Reports <span class="section-count">${disputed.length}</span></div>
      <div class="mod-section-note">These reports have been challenged by the community and need re-review.</div>
      ${renderReportCards(disputed)}
    ` : ""}

    <!-- Flagged -->
    ${flagged.length ? `
      <div class="section-title" style="margin-top:24px;">Flagged Reports <span class="section-count">${flagged.length}</span></div>
      <div class="mod-section-note">Reports flagged by the community as potentially inaccurate.</div>
      ${renderReportCards(flagged)}
    ` : ""}

    <!-- Archived -->
    ${archived.length ? `
      <div class="section-title" style="margin-top:24px;">Archived <span class="section-count">${archived.length}</span></div>
      <div class="mod-section-note">Archived reports are hidden from the public feed. They can be restored or permanently deleted.</div>
      ${renderReportCards(archived)}
    ` : ""}

    <!-- Audit Log -->
    <div class="section-title" style="margin-top:32px;">Recent Activity</div>
    ${auditLog.length ? renderAuditLog(auditLog) : `<div class="empty-state" style="padding:20px;"><p>No activity recorded yet.</p></div>`}
  `;

  bindCardClicks();

  // Export
  document.getElementById("export-btn").addEventListener("click", () => {
    const data = store.exportReportsJSON();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fhi-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Export downloaded");
  });

  // Reset with modal confirmation
  document.getElementById("reset-btn").addEventListener("click", async () => {
    const confirmed = await modal.confirm({
      title: "Reset All Data",
      body: "This will permanently delete ALL reports, audit logs, and settings, then reload the demo seed data. This cannot be undone.",
      confirmLabel: "Reset Everything",
      confirmClass: "btn-danger",
    });
    if (confirmed) {
      localStorage.removeItem("fhi_reports");
      localStorage.removeItem("fhi_audit_log");
      loadSeedDataIfEmpty(store);
      toast.success("Data reset to seed defaults");
      render();
    }
  });
}

function renderAuditLog(entries) {
  const rows = entries.map(e => {
    const shortId = e.reportId ? e.reportId.substring(0, 12) + "…" : "—";
    return `
      <div class="audit-row">
        <span class="audit-time">${formatDateTime(e.timestamp)}</span>
        <span class="audit-action">${escapeHtml(e.action)}</span>
        <span class="audit-id" title="${escapeHtml(e.reportId || "")}">${shortId}</span>
        <span class="audit-detail">${escapeHtml(e.detail)}</span>
      </div>
    `;
  }).join("");

  return `<div class="audit-log">${rows}</div>`;
}

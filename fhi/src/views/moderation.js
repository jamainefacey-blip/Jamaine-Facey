/**
 * FHI — Moderation View
 * Stats, review queue, flagged reports, export, reset with modal confirmation.
 */

import * as store from "../../utils/store.js";
import { loadSeedDataIfEmpty } from "../../data/seed.js";
import * as appState from "../state/appState.js";
import { $main, renderReportCards, bindCardClicks } from "../ui/dom.js";
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
  const queue = all.filter(r => r.status === "submitted" || r.status === "under_review");
  const flagged = all.filter(r => r.flagCount > 0).sort((a, b) => b.flagCount - a.flagCount);
  const resolved = all.filter(r => r.status === "resolved").length;
  const totalLoss = all.reduce((sum, r) => sum + (Number(r.amountLost) || 0), 0);

  $main().innerHTML = `
    <div class="section-title" style="margin-bottom:20px;">Moderation Panel</div>

    <div class="stats-row">
      <div class="stat-chip"><div class="stat-value">${all.length}</div><div class="stat-label">Total</div></div>
      <div class="stat-chip"><div class="stat-value">${queue.length}</div><div class="stat-label">Queue</div></div>
      <div class="stat-chip"><div class="stat-value">${flagged.length}</div><div class="stat-label">Flagged</div></div>
      <div class="stat-chip"><div class="stat-value">£${totalLoss.toLocaleString()}</div><div class="stat-label">Total Loss</div></div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:24px;">
      <button class="btn btn-sm btn-outline" id="export-btn">📥 Export JSON</button>
      <button class="btn btn-sm btn-danger" id="reset-btn">🗑️ Reset Data</button>
    </div>

    <div class="section-title">Review Queue <span class="section-count">${queue.length}</span></div>
    ${renderReportCards(queue)}

    ${flagged.length ? `
      <div class="section-title" style="margin-top:24px;">Flagged Reports <span class="section-count">${flagged.length}</span></div>
      ${renderReportCards(flagged)}
    ` : ""}
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
      body: "This will permanently delete ALL reports and reload the demo seed data. This cannot be undone.",
      confirmLabel: "Reset Everything",
      confirmClass: "btn-danger",
    });
    if (confirmed) {
      localStorage.removeItem("fhi_reports");
      loadSeedDataIfEmpty(store);
      toast.success("Data reset to seed defaults");
      render();
    }
  });
}

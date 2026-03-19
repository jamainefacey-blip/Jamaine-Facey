/**
 * Fraud Help Index — Main App Router
 * Hash-based SPA routing, view management, role toggle.
 */

import { CATEGORIES, SEVERITY_LEVELS, REPORT_STATUSES, getCategoryById, getSeverityById, getStatusById } from "../data/categories.js";
import { createReport, validateReport } from "../data/schema.js";
import { escapeHtml, escapeReportForRender } from "../utils/sanitise.js";
import * as store from "../utils/store.js";
import { SEED_REPORTS, loadSeedDataIfEmpty } from "../data/seed.js";

// ── State ─────────────────────────────────────────────

let currentView = "feed";
let currentReportId = null;
let settings = store.getSettings();

const $main = document.getElementById("app-main");
const $nav  = document.getElementById("app-nav");
const $role = document.getElementById("role-toggle");

// ── Init ──────────────────────────────────────────────

loadSeedDataIfEmpty(store);
updateRoleUI();
route();

window.addEventListener("hashchange", route);

// Nav buttons
$nav.addEventListener("click", e => {
  const btn = e.target.closest(".nav-item");
  if (!btn) return;
  const view = btn.dataset.view;
  window.location.hash = `#${view}`;
});

// Role toggle
$role.addEventListener("click", () => {
  settings.role = settings.role === "reporter" ? "moderator" : "reporter";
  store.saveSettings(settings);
  updateRoleUI();
  route();
});

function updateRoleUI() {
  $role.textContent = settings.role === "moderator" ? "Moderator" : "Reporter";
  $role.className = `role-toggle role-${settings.role}`;
  const modNav = document.getElementById("nav-mod");
  if (modNav) modNav.style.display = settings.role === "moderator" ? "" : "none";
}

// ── Router ────────────────────────────────────────────

function route() {
  const hash = window.location.hash.replace("#", "") || "feed";
  const [view, ...params] = hash.split("/");

  // Update nav
  $nav.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  currentView = view;

  switch (view) {
    case "feed":       renderFeed(); break;
    case "search":     renderSearch(); break;
    case "report":     renderReportForm(); break;
    case "moderation": renderModeration(); break;
    case "detail":     renderDetail(params[0]); break;
    default:           renderFeed(); break;
  }
}

// ── View: Feed ────────────────────────────────────────

function renderFeed() {
  const reports = store.queryReports({});
  const counts = {
    total: reports.length,
    submitted: reports.filter(r => r.status === "submitted").length,
    confirmed: reports.filter(r => r.status === "confirmed").length,
    resolved:  reports.filter(r => r.status === "resolved").length,
  };

  let html = `
    <div class="stats-row">
      <div class="stat-chip"><div class="stat-value">${counts.total}</div><div class="stat-label">Total Reports</div></div>
      <div class="stat-chip"><div class="stat-value">${counts.submitted}</div><div class="stat-label">Pending</div></div>
      <div class="stat-chip"><div class="stat-value">${counts.confirmed}</div><div class="stat-label">Confirmed</div></div>
      <div class="stat-chip"><div class="stat-value">${counts.resolved}</div><div class="stat-label">Resolved</div></div>
    </div>
    <div class="cat-pills" id="feed-filters">
      <button class="cat-pill active" data-cat="">All</button>
      ${CATEGORIES.map(c => `<button class="cat-pill" data-cat="${c.id}">${c.icon} ${escapeHtml(c.label)}</button>`).join("")}
    </div>
    <div id="feed-list">
      ${renderReportCards(reports)}
    </div>
  `;

  $main.innerHTML = html;

  // Filter handler
  document.getElementById("feed-filters").addEventListener("click", e => {
    const pill = e.target.closest(".cat-pill");
    if (!pill) return;
    document.querySelectorAll(".cat-pill").forEach(p => p.classList.remove("active"));
    pill.classList.add("active");
    const cat = pill.dataset.cat;
    const filtered = store.queryReports({ category: cat || undefined });
    document.getElementById("feed-list").innerHTML = renderReportCards(filtered);
    bindCardClicks();
  });

  bindCardClicks();
}

function renderReportCards(reports) {
  if (reports.length === 0) {
    return `<div class="empty-state"><div class="empty-state-icon">📭</div><div class="empty-state-title">No reports found</div><p>Try a different filter or submit a new report.</p></div>`;
  }
  return reports.map(r => {
    const safe = escapeReportForRender(r);
    const cat = getCategoryById(r.category);
    const sev = getSeverityById(r.severity);
    const st  = getStatusById(r.status);
    return `
      <div class="card card-clickable" data-id="${r.id}">
        <div class="card-header">
          <span class="card-icon">${cat.icon}</span>
          <div class="card-title">${safe.title}</div>
        </div>
        <div class="card-meta">
          <span class="badge badge-severity-${r.severity}">${sev.label}</span>
          <span class="badge badge-status-${r.status}">${st.label}</span>
          <span>${escapeHtml(cat.label)}</span>
          <span>${formatDate(r.createdAt)}</span>
          ${r.amountLost ? `<span>£${Number(r.amountLost).toLocaleString()}</span>` : ""}
        </div>
        <div class="card-desc">${safe.description}</div>
      </div>
    `;
  }).join("");
}

function bindCardClicks() {
  document.querySelectorAll(".card-clickable").forEach(card => {
    card.addEventListener("click", () => {
      window.location.hash = `#detail/${card.dataset.id}`;
    });
  });
}

// ── View: Search ──────────────────────────────────────

function renderSearch() {
  $main.innerHTML = `
    <div class="search-bar">
      <span class="search-icon">🔍</span>
      <input class="form-input" id="search-input" type="text" placeholder="Search reports, scammer info, phone numbers…" autofocus />
    </div>
    <div id="search-results">
      <div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Search the index</div><p>Type a keyword, phone number, email, or URL to find matching reports.</p></div>
    </div>
  `;

  let debounce = null;
  document.getElementById("search-input").addEventListener("input", e => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      const q = e.target.value.trim();
      if (q.length < 2) {
        document.getElementById("search-results").innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔍</div><div class="empty-state-title">Search the index</div><p>Type at least 2 characters.</p></div>`;
        return;
      }
      const results = store.queryReports({ search: q });
      document.getElementById("search-results").innerHTML = renderReportCards(results);
      bindCardClicks();
    }, 250);
  });
}

// ── View: Report Form ─────────────────────────────────

function renderReportForm() {
  const steps = ["Category", "Details", "Evidence", "Review"];
  let step = 0;
  let draft = { category: "", title: "", description: "", severity: "", contactMethod: "", evidenceLinks: [""], scammerIdentifiers: [""], incidentDate: "", amountLost: "", currency: "GBP" };

  function render() {
    $main.innerHTML = `
      <h2 style="margin-bottom:12px;">Report Fraud</h2>
      <div class="steps">${steps.map((s, i) => `<div class="step-dot ${i < step ? "done" : ""} ${i === step ? "active" : ""}"></div>`).join("")}</div>
      <div id="step-content"></div>
    `;
    renderStep();
  }

  function renderStep() {
    const $step = document.getElementById("step-content");
    if (step === 0) {
      $step.innerHTML = `
        <p style="margin-bottom:12px;color:var(--fhi-text-dim);">What type of fraud are you reporting?</p>
        <div class="cat-pills" style="flex-direction:column;">
          ${CATEGORIES.map(c => `
            <button class="cat-pill ${draft.category === c.id ? "active" : ""}" data-cat="${c.id}" style="justify-content:flex-start;width:100%;padding:12px 16px;">
              <span style="font-size:20px;">${c.icon}</span>
              <span><strong>${escapeHtml(c.label)}</strong><br><span style="font-size:12px;opacity:0.7;">${escapeHtml(c.description)}</span></span>
            </button>
          `).join("")}
        </div>
      `;
      $step.querySelectorAll(".cat-pill").forEach(pill => {
        pill.addEventListener("click", () => {
          draft.category = pill.dataset.cat;
          const cat = getCategoryById(draft.category);
          draft.severity = cat.severity_default;
          step = 1;
          render();
        });
      });
    } else if (step === 1) {
      $step.innerHTML = `
        <div class="form-group">
          <label class="form-label">Title *</label>
          <input class="form-input" id="f-title" value="${escapeHtml(draft.title)}" placeholder="Brief summary of what happened" maxlength="200" />
          <div class="form-hint">5–200 characters</div>
        </div>
        <div class="form-group">
          <label class="form-label">Description *</label>
          <textarea class="form-textarea" id="f-desc" placeholder="Describe what happened in detail — how you were contacted, what was said, what you did…" maxlength="5000">${escapeHtml(draft.description)}</textarea>
          <div class="form-hint">20–5000 characters</div>
        </div>
        <div class="form-group">
          <label class="form-label">Severity</label>
          <select class="form-select" id="f-severity">
            ${SEVERITY_LEVELS.map(s => `<option value="${s.id}" ${draft.severity === s.id ? "selected" : ""}>${s.label} — ${s.description}</option>`).join("")}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date of Incident</label>
          <input class="form-input" id="f-date" type="date" value="${draft.incidentDate}" />
        </div>
        <div class="form-group">
          <label class="form-label">Amount Lost (£)</label>
          <input class="form-input" id="f-amount" type="number" min="0" step="0.01" value="${draft.amountLost}" placeholder="0.00" />
        </div>
        <div class="form-group">
          <label class="form-label">How were you contacted?</label>
          <input class="form-input" id="f-contact" value="${escapeHtml(draft.contactMethod)}" placeholder="e.g. Email, Phone, Instagram DM, Facebook Marketplace" />
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
          <button class="btn btn-outline" id="step-back">Back</button>
          <button class="btn btn-primary btn-block" id="step-next">Next</button>
        </div>
        <div id="step-errors"></div>
      `;
      document.getElementById("step-back").addEventListener("click", () => { step = 0; render(); });
      document.getElementById("step-next").addEventListener("click", () => {
        draft.title = document.getElementById("f-title").value;
        draft.description = document.getElementById("f-desc").value;
        draft.severity = document.getElementById("f-severity").value;
        draft.incidentDate = document.getElementById("f-date").value;
        draft.amountLost = document.getElementById("f-amount").value;
        draft.contactMethod = document.getElementById("f-contact").value;
        // Quick validation
        const errors = [];
        if (draft.title.trim().length < 5) errors.push("Title must be at least 5 characters.");
        if (draft.description.trim().length < 20) errors.push("Description must be at least 20 characters.");
        if (errors.length) {
          document.getElementById("step-errors").innerHTML = errors.map(e => `<div class="form-error">${escapeHtml(e)}</div>`).join("");
          return;
        }
        step = 2;
        render();
      });
    } else if (step === 2) {
      $step.innerHTML = `
        <div class="form-group">
          <label class="form-label">Evidence Links</label>
          <div id="evidence-fields">
            ${draft.evidenceLinks.map((l, i) => `<input class="form-input" style="margin-bottom:6px;" data-ev="${i}" value="${escapeHtml(l)}" placeholder="https://…" />`).join("")}
          </div>
          <button class="btn btn-ghost btn-sm" id="add-ev">+ Add link</button>
          <div class="form-hint">Screenshots, archived pages, or any supporting URLs (max 10)</div>
        </div>
        <div class="form-group">
          <label class="form-label">Scammer Identifiers</label>
          <div id="scammer-fields">
            ${draft.scammerIdentifiers.map((s, i) => `<input class="form-input" style="margin-bottom:6px;" data-sc="${i}" value="${escapeHtml(s)}" placeholder="Phone, email, website, username…" />`).join("")}
          </div>
          <button class="btn btn-ghost btn-sm" id="add-sc">+ Add identifier</button>
          <div class="form-hint">Phone numbers, emails, websites, social media handles (max 10)</div>
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
          <button class="btn btn-outline" id="step-back">Back</button>
          <button class="btn btn-primary btn-block" id="step-next">Review</button>
        </div>
      `;
      document.getElementById("add-ev").addEventListener("click", () => {
        if (draft.evidenceLinks.length < 10) { draft.evidenceLinks.push(""); render(); }
      });
      document.getElementById("add-sc").addEventListener("click", () => {
        if (draft.scammerIdentifiers.length < 10) { draft.scammerIdentifiers.push(""); render(); }
      });
      document.getElementById("step-back").addEventListener("click", () => {
        collectEvidence();
        step = 1;
        render();
      });
      document.getElementById("step-next").addEventListener("click", () => {
        collectEvidence();
        step = 3;
        render();
      });

      function collectEvidence() {
        draft.evidenceLinks = Array.from(document.querySelectorAll("[data-ev]")).map(el => el.value);
        draft.scammerIdentifiers = Array.from(document.querySelectorAll("[data-sc]")).map(el => el.value);
      }
    } else if (step === 3) {
      const cat = getCategoryById(draft.category);
      const sev = getSeverityById(draft.severity);
      const evLinks = draft.evidenceLinks.filter(l => l.trim());
      const scIds = draft.scammerIdentifiers.filter(s => s.trim());

      $step.innerHTML = `
        <div class="card" style="cursor:default;">
          <div class="card-header">
            <span class="card-icon">${cat.icon}</span>
            <div class="card-title">${escapeHtml(draft.title)}</div>
          </div>
          <div class="card-meta" style="margin-bottom:12px;">
            <span class="badge badge-severity-${draft.severity}">${sev.label}</span>
            <span>${escapeHtml(cat.label)}</span>
            ${draft.incidentDate ? `<span>${draft.incidentDate}</span>` : ""}
            ${draft.amountLost ? `<span>£${Number(draft.amountLost).toLocaleString()}</span>` : ""}
          </div>
          <div class="detail-body" style="margin-bottom:12px;">${escapeHtml(draft.description)}</div>
          ${draft.contactMethod ? `<div style="font-size:13px;color:var(--fhi-text-dim);margin-bottom:8px;"><strong>Contact method:</strong> ${escapeHtml(draft.contactMethod)}</div>` : ""}
          ${evLinks.length ? `<div style="font-size:13px;margin-bottom:8px;"><strong>Evidence:</strong> ${evLinks.length} link(s)</div>` : ""}
          ${scIds.length ? `<div style="font-size:13px;"><strong>Identifiers:</strong> ${scIds.map(s => escapeHtml(s)).join(", ")}</div>` : ""}
        </div>
        <div style="display:flex;gap:8px;margin-top:16px;">
          <button class="btn btn-outline" id="step-back">Edit</button>
          <button class="btn btn-success btn-block" id="submit-report">Submit Report</button>
        </div>
        <div id="step-errors"></div>
      `;
      document.getElementById("step-back").addEventListener("click", () => { step = 1; render(); });
      document.getElementById("submit-report").addEventListener("click", () => {
        const report = createReport({
          category: draft.category,
          title: draft.title,
          description: draft.description,
          severity: draft.severity,
          evidenceLinks: draft.evidenceLinks.filter(l => l.trim()),
          contactMethod: draft.contactMethod,
          scammerIdentifiers: draft.scammerIdentifiers.filter(s => s.trim()),
          incidentDate: draft.incidentDate,
          amountLost: draft.amountLost || null,
          currency: draft.currency,
        });

        const { valid, errors } = validateReport(report);
        if (!valid) {
          document.getElementById("step-errors").innerHTML = errors.map(e => `<div class="form-error">${escapeHtml(e)}</div>`).join("");
          return;
        }

        store.saveReport(report);
        window.location.hash = `#detail/${report.id}`;
      });
    }
  }

  render();
}

// ── View: Detail ──────────────────────────────────────

function renderDetail(id) {
  const report = store.getReportById(id);
  if (!report) {
    $main.innerHTML = `<div class="empty-state"><div class="empty-state-icon">❌</div><div class="empty-state-title">Report not found</div><p><a href="#feed">Back to feed</a></p></div>`;
    return;
  }

  const safe = escapeReportForRender(report);
  const cat = getCategoryById(report.category);
  const sev = getSeverityById(report.severity);
  const st  = getStatusById(report.status);

  $main.innerHTML = `
    <div class="back-link" id="go-back">← Back</div>

    <div class="detail-header">
      <div class="card-meta" style="margin-bottom:8px;">
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
      <div class="detail-section-title">Description</div>
      <div class="detail-body">${safe.description}</div>
    </div>

    ${report.contactMethod ? `<div class="detail-section"><div class="detail-section-title">Contact Method</div><div class="detail-body">${safe.contactMethod}</div></div>` : ""}

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
          ${report.evidenceLinks.map(l => `<li class="evidence-item"><a href="${escapeHtml(l)}" target="_blank" rel="noopener">${escapeHtml(l)}</a></li>`).join("")}
        </ul>
      </div>
    ` : ""}

    <div class="signal-bar">
      <button class="signal-btn" id="btn-confirm">👍 <span>I experienced this too</span> <span class="signal-count">${report.confirmCount || 0}</span></button>
      <button class="signal-btn" id="btn-flag">🚩 <span>Flag</span> <span class="signal-count">${report.flagCount || 0}</span></button>
    </div>

    ${report.moderatorNotes ? `<div class="detail-section"><div class="detail-section-title">Moderator Notes</div><div class="detail-body">${escapeHtml(report.moderatorNotes)}</div></div>` : ""}

    ${settings.role === "moderator" ? renderModeratorActions(report) : ""}
  `;

  document.getElementById("go-back").addEventListener("click", () => history.back());

  document.getElementById("btn-confirm").addEventListener("click", () => {
    store.confirmReport(report.id);
    renderDetail(report.id);
  });
  document.getElementById("btn-flag").addEventListener("click", () => {
    store.flagReport(report.id);
    renderDetail(report.id);
  });

  // Moderator action handlers
  if (settings.role === "moderator") {
    document.querySelectorAll(".mod-status-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const newStatus = btn.dataset.status;
        const notes = document.getElementById("mod-notes")?.value || "";
        store.updateReportStatus(report.id, newStatus, notes);
        renderDetail(report.id);
      });
    });

    const delBtn = document.getElementById("mod-delete");
    if (delBtn) {
      delBtn.addEventListener("click", () => {
        if (confirm("Permanently delete this report?")) {
          store.deleteReport(report.id);
          window.location.hash = "#feed";
        }
      });
    }
  }
}

function renderModeratorActions(report) {
  return `
    <div class="detail-section" style="border-top:1px solid var(--fhi-border);padding-top:16px;">
      <div class="detail-section-title">Moderator Actions</div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="mod-notes" placeholder="Add moderator notes…">${escapeHtml(report.moderatorNotes || "")}</textarea>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        ${REPORT_STATUSES.filter(s => s.id !== report.status).map(s => `<button class="btn btn-sm btn-outline mod-status-btn" data-status="${s.id}">→ ${s.label}</button>`).join("")}
        <button class="btn btn-sm btn-danger" id="mod-delete">Delete</button>
      </div>
    </div>
  `;
}

// ── View: Moderation ──────────────────────────────────

function renderModeration() {
  if (settings.role !== "moderator") {
    $main.innerHTML = `<div class="empty-state"><div class="empty-state-icon">🔒</div><div class="empty-state-title">Moderator access required</div><p>Toggle your role using the button in the header.</p></div>`;
    return;
  }

  const all = store.getAllReports();
  const queue = all.filter(r => r.status === "submitted" || r.status === "under_review");
  const flagged = all.filter(r => r.flagCount > 0).sort((a, b) => b.flagCount - a.flagCount);

  $main.innerHTML = `
    <h2 style="margin-bottom:16px;">Moderation Panel</h2>

    <div class="stats-row">
      <div class="stat-chip"><div class="stat-value">${all.length}</div><div class="stat-label">Total</div></div>
      <div class="stat-chip"><div class="stat-value">${queue.length}</div><div class="stat-label">Review Queue</div></div>
      <div class="stat-chip"><div class="stat-value">${flagged.length}</div><div class="stat-label">Flagged</div></div>
      <div class="stat-chip"><div class="stat-value">${all.filter(r => r.status === "resolved").length}</div><div class="stat-label">Resolved</div></div>
    </div>

    <div style="display:flex;gap:8px;margin-bottom:16px;">
      <button class="btn btn-sm btn-outline" id="export-btn">📥 Export JSON</button>
      <button class="btn btn-sm btn-danger" id="reset-btn">🗑️ Reset All Data</button>
    </div>

    <h3 style="margin-bottom:12px;">Review Queue (${queue.length})</h3>
    ${renderReportCards(queue)}

    ${flagged.length ? `<h3 style="margin:20px 0 12px;">Flagged Reports (${flagged.length})</h3>${renderReportCards(flagged)}` : ""}
  `;

  bindCardClicks();

  document.getElementById("export-btn").addEventListener("click", () => {
    const data = store.exportReportsJSON();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "fhi-reports-export.json"; a.click();
    URL.revokeObjectURL(url);
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("This will delete ALL reports and reload seed data. Continue?")) {
      localStorage.removeItem("fhi_reports");
      loadSeedDataIfEmpty(store);
      renderModeration();
    }
  });
}

// ── Helpers ───────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

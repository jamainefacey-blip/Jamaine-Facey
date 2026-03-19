/**
 * FHI — Report Form View
 * 4-step wizard with progress bar, live validation, char counts.
 */

import { CATEGORIES, SEVERITY_LEVELS, getCategoryById, getSeverityById } from "../../data/categories.js";
import { createReport, validateReport } from "../../data/schema.js";
import { escapeHtml } from "../../utils/sanitise.js";
import * as store from "../../utils/store.js";
import { $main, renderProgressBar } from "../ui/dom.js";
import * as toast from "../ui/toast.js";

const STEPS = ["Category", "Details", "Evidence", "Review"];

let step = 0;
let draft = freshDraft();

function freshDraft() {
  return {
    category: "", title: "", description: "", severity: "",
    contactMethod: "", evidenceLinks: [""], scammerIdentifiers: [""],
    incidentDate: "", amountLost: "", currency: "GBP",
  };
}

export function render() {
  step = 0;
  draft = freshDraft();
  renderForm();
}

function renderForm() {
  $main().innerHTML = `
    <div class="section-title" style="margin-bottom:20px;">Report Fraud</div>
    ${renderProgressBar(STEPS, step)}
    <div id="step-content" style="margin-top:24px;"></div>
  `;
  renderStep();
}

function renderStep() {
  const $step = document.getElementById("step-content");

  switch (step) {
    case 0: renderCategoryStep($step); break;
    case 1: renderDetailsStep($step); break;
    case 2: renderEvidenceStep($step); break;
    case 3: renderReviewStep($step); break;
  }
}

// ── Step 0: Category ──────────────────────────────────

function renderCategoryStep($el) {
  $el.innerHTML = `
    <p style="margin-bottom:16px;color:var(--fhi-text-dim);font-size:14px;">What type of fraud are you reporting?</p>
    <div class="cat-pills" style="flex-direction:column;gap:10px;">
      ${CATEGORIES.map(c => `
        <button class="cat-pill ${draft.category === c.id ? "active" : ""}" data-cat="${c.id}"
          style="justify-content:flex-start;width:100%;padding:14px 16px;text-align:left;gap:12px;">
          <span style="font-size:22px;flex-shrink:0;">${c.icon}</span>
          <span>
            <strong style="font-size:14px;">${escapeHtml(c.label)}</strong><br>
            <span style="font-size:12px;opacity:0.6;">${escapeHtml(c.description)}</span>
          </span>
        </button>
      `).join("")}
    </div>
  `;
  $el.querySelectorAll(".cat-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      draft.category = pill.dataset.cat;
      const cat = getCategoryById(draft.category);
      draft.severity = cat.severity_default;
      step = 1;
      renderForm();
    });
  });
}

// ── Step 1: Details ───────────────────────────────────

function renderDetailsStep($el) {
  $el.innerHTML = `
    <div class="form-group">
      <label class="form-label form-label-req">Title</label>
      <input class="form-input" id="f-title" value="${escapeHtml(draft.title)}"
        placeholder="Brief summary of what happened" maxlength="200" />
      <div class="form-char-count" id="title-count">${draft.title.length}/200</div>
    </div>
    <div class="form-group">
      <label class="form-label form-label-req">Description</label>
      <textarea class="form-textarea" id="f-desc"
        placeholder="Describe what happened in detail — how you were contacted, what was said, what you did…"
        maxlength="5000">${escapeHtml(draft.description)}</textarea>
      <div class="form-char-count" id="desc-count">${draft.description.length}/5000</div>
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
      <div class="form-hint">When did this happen?</div>
    </div>
    <div class="form-group">
      <label class="form-label">Amount Lost (£)</label>
      <input class="form-input" id="f-amount" type="number" min="0" step="0.01"
        value="${draft.amountLost}" placeholder="0.00" />
      <div class="form-hint">Enter 0 if no money was lost</div>
    </div>
    <div class="form-group">
      <label class="form-label">How were you contacted?</label>
      <input class="form-input" id="f-contact" value="${escapeHtml(draft.contactMethod)}"
        placeholder="e.g. Email, Phone, Instagram DM, Facebook Marketplace" />
    </div>
    <div style="display:flex;gap:10px;margin-top:20px;">
      <button class="btn btn-outline" id="step-back">Back</button>
      <button class="btn btn-primary btn-block" id="step-next">Next</button>
    </div>
    <div id="step-errors" style="margin-top:12px;"></div>
  `;

  // Live char counts
  bindCharCount("f-title", "title-count", 200);
  bindCharCount("f-desc", "desc-count", 5000);

  document.getElementById("step-back").addEventListener("click", () => { step = 0; renderForm(); });
  document.getElementById("step-next").addEventListener("click", () => {
    collectDetails();
    const errors = [];
    if (draft.title.trim().length < 5) errors.push("Title must be at least 5 characters.");
    if (draft.description.trim().length < 20) errors.push("Description must be at least 20 characters.");
    if (errors.length) {
      showStepErrors(errors);
      return;
    }
    step = 2;
    renderForm();
  });
}

function collectDetails() {
  draft.title = document.getElementById("f-title").value;
  draft.description = document.getElementById("f-desc").value;
  draft.severity = document.getElementById("f-severity").value;
  draft.incidentDate = document.getElementById("f-date").value;
  draft.amountLost = document.getElementById("f-amount").value;
  draft.contactMethod = document.getElementById("f-contact").value;
}

// ── Step 2: Evidence ──────────────────────────────────

function renderEvidenceStep($el) {
  $el.innerHTML = `
    <div class="form-group">
      <label class="form-label">Evidence Links</label>
      <div id="evidence-fields">
        ${draft.evidenceLinks.map((l, i) => `<input class="form-input" style="margin-bottom:8px;" data-ev="${i}" value="${escapeHtml(l)}" placeholder="https://…" />`).join("")}
      </div>
      <button class="btn btn-ghost btn-sm" id="add-ev">+ Add link</button>
      <div class="form-hint">Screenshots, archived pages, or supporting URLs (max 10)</div>
    </div>
    <div class="form-group">
      <label class="form-label">Scammer Identifiers</label>
      <div id="scammer-fields">
        ${draft.scammerIdentifiers.map((s, i) => `<input class="form-input" style="margin-bottom:8px;" data-sc="${i}" value="${escapeHtml(s)}" placeholder="Phone, email, website, username…" />`).join("")}
      </div>
      <button class="btn btn-ghost btn-sm" id="add-sc">+ Add identifier</button>
      <div class="form-hint">Phone numbers, emails, websites, social handles (max 10)</div>
    </div>
    <div style="display:flex;gap:10px;margin-top:20px;">
      <button class="btn btn-outline" id="step-back">Back</button>
      <button class="btn btn-primary btn-block" id="step-next">Review</button>
    </div>
  `;
  document.getElementById("add-ev").addEventListener("click", () => {
    if (draft.evidenceLinks.length < 10) { collectEvidence(); draft.evidenceLinks.push(""); renderForm(); }
  });
  document.getElementById("add-sc").addEventListener("click", () => {
    if (draft.scammerIdentifiers.length < 10) { collectEvidence(); draft.scammerIdentifiers.push(""); renderForm(); }
  });
  document.getElementById("step-back").addEventListener("click", () => { collectEvidence(); step = 1; renderForm(); });
  document.getElementById("step-next").addEventListener("click", () => { collectEvidence(); step = 3; renderForm(); });
}

function collectEvidence() {
  draft.evidenceLinks = Array.from(document.querySelectorAll("[data-ev]")).map(el => el.value);
  draft.scammerIdentifiers = Array.from(document.querySelectorAll("[data-sc]")).map(el => el.value);
}

// ── Step 3: Review ────────────────────────────────────

function renderReviewStep($el) {
  const cat = getCategoryById(draft.category);
  const sev = getSeverityById(draft.severity);
  const evLinks = draft.evidenceLinks.filter(l => l.trim());
  const scIds = draft.scammerIdentifiers.filter(s => s.trim());

  $el.innerHTML = `
    <div class="card" style="cursor:default;">
      <div class="card-header">
        <span class="card-icon">${cat.icon}</span>
        <div class="card-title">${escapeHtml(draft.title)}</div>
      </div>
      <div class="card-meta" style="margin-bottom:14px;">
        <span class="badge badge-severity-${draft.severity}">${sev.label}</span>
        <span>${escapeHtml(cat.label)}</span>
        ${draft.incidentDate ? `<span>${escapeHtml(draft.incidentDate)}</span>` : ""}
        ${draft.amountLost ? `<span>£${Number(draft.amountLost).toLocaleString()}</span>` : ""}
      </div>
      <div class="detail-body" style="margin-bottom:14px;">${escapeHtml(draft.description)}</div>
      ${draft.contactMethod ? `<div style="font-size:13px;color:var(--fhi-text-dim);margin-bottom:8px;"><strong>Contact method:</strong> ${escapeHtml(draft.contactMethod)}</div>` : ""}
      ${evLinks.length ? `<div style="font-size:13px;margin-bottom:8px;"><strong>Evidence:</strong> ${evLinks.length} link(s)</div>` : ""}
      ${scIds.length ? `<div style="font-size:13px;"><strong>Identifiers:</strong> ${scIds.map(s => escapeHtml(s)).join(", ")}</div>` : ""}
    </div>
    <div style="display:flex;gap:10px;margin-top:20px;">
      <button class="btn btn-outline" id="step-back">Edit</button>
      <button class="btn btn-success btn-block" id="submit-report">Submit Report</button>
    </div>
    <div id="step-errors" style="margin-top:12px;"></div>
  `;

  document.getElementById("step-back").addEventListener("click", () => { step = 1; renderForm(); });
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
      showStepErrors(errors);
      return;
    }

    store.saveReport(report);
    toast.success("Report submitted successfully");
    window.location.hash = `#detail/${report.id}`;
  });
}

// ── Helpers ───────────────────────────────────────────

function showStepErrors(errors) {
  const el = document.getElementById("step-errors");
  if (el) el.innerHTML = errors.map(e => `<div class="form-error">${escapeHtml(e)}</div>`).join("");
}

function bindCharCount(inputId, countId, max) {
  const input = document.getElementById(inputId);
  const counter = document.getElementById(countId);
  if (!input || !counter) return;
  input.addEventListener("input", () => {
    const len = input.value.length;
    counter.textContent = `${len}/${max}`;
    counter.className = "form-char-count" + (len > max ? " over" : len > max * 0.9 ? " warn" : "");
  });
}

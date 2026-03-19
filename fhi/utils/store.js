/**
 * Fraud Help Index — localStorage Persistence Layer
 * CRUD operations for reports, backed by localStorage.
 */

import { sanitiseReport } from "./sanitise.js";

const STORAGE_KEY = "fhi_reports";
const SETTINGS_KEY = "fhi_settings";

// ── Read ──────────────────────────────────────────────

export function getAllReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getReportById(id) {
  return getAllReports().find(r => r.id === id) || null;
}

// ── Write ─────────────────────────────────────────────

export function saveReport(report) {
  const reports = getAllReports();
  const sanitised = sanitiseReport(report);
  const idx = reports.findIndex(r => r.id === sanitised.id);
  if (idx >= 0) {
    sanitised.updatedAt = new Date().toISOString();
    reports[idx] = sanitised;
  } else {
    reports.unshift(sanitised);
  }
  persist(reports);
  return sanitised;
}

export function deleteReport(id) {
  const reports = getAllReports().filter(r => r.id !== id);
  persist(reports);
}

// ── Query ─────────────────────────────────────────────

export function queryReports({ category, status, severity, search, sortBy = "createdAt", sortDir = "desc" } = {}) {
  let results = getAllReports();

  if (category) results = results.filter(r => r.category === category);
  if (status)   results = results.filter(r => r.status === status);
  if (severity) results = results.filter(r => r.severity === severity);

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(r =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.scammerIdentifiers && r.scammerIdentifiers.some(s => s.toLowerCase().includes(q)))
    );
  }

  results.sort((a, b) => {
    const av = a[sortBy] || "";
    const bv = b[sortBy] || "";
    return sortDir === "desc" ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
  });

  return results;
}

// ── Community Signals ─────────────────────────────────

export function confirmReport(id) {
  const report = getReportById(id);
  if (!report) return null;
  report.confirmCount = (report.confirmCount || 0) + 1;
  return saveReport(report);
}

export function flagReport(id) {
  const report = getReportById(id);
  if (!report) return null;
  report.flagCount = (report.flagCount || 0) + 1;
  return saveReport(report);
}

// ── Moderation ────────────────────────────────────────

export function updateReportStatus(id, status, moderatorNotes = "") {
  const report = getReportById(id);
  if (!report) return null;
  report.status = status;
  report.reviewedAt = new Date().toISOString();
  if (moderatorNotes) report.moderatorNotes = moderatorNotes;
  return saveReport(report);
}

// ── Settings ──────────────────────────────────────────

export function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : { role: "reporter" };
  } catch {
    return { role: "reporter" };
  }
}

export function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

// ── Export ─────────────────────────────────────────────

export function exportReportsJSON() {
  return JSON.stringify(getAllReports(), null, 2);
}

// ── Internal ──────────────────────────────────────────

function persist(reports) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
}

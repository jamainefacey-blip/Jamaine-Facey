/**
 * Fraud Help Index — localStorage Persistence Layer
 * CRUD operations for reports, backed by localStorage.
 * Phase 3: Audit log, archive, dispute, advanced query filters.
 */

import { sanitiseReport } from "./sanitise.js";

const STORAGE_KEY = "fhi_reports";
const SETTINGS_KEY = "fhi_settings";
const AUDIT_KEY = "fhi_audit_log";

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
  logAudit(id, "deleted", "Report permanently deleted");
  persist(reports);
}

// ── Query ─────────────────────────────────────────────

export function queryReports({
  category, status, severity, search,
  harmTier, excludeArchived = false,
  sortBy = "createdAt", sortDir = "desc",
} = {}) {
  let results = getAllReports();

  if (category)        results = results.filter(r => r.category === category);
  if (status)          results = results.filter(r => r.status === status);
  if (severity)        results = results.filter(r => r.severity === severity);
  if (excludeArchived) results = results.filter(r => r.status !== "archived");

  if (harmTier) {
    results = results.filter(r => {
      const amt = Number(r.amountLost) || 0;
      switch (harmTier) {
        case "none":   return amt === 0;
        case "low":    return amt > 0 && amt <= 499;
        case "medium": return amt >= 500 && amt <= 5000;
        case "high":   return amt > 5000;
        default:       return true;
      }
    });
  }

  if (search) {
    const q = search.toLowerCase();
    results = results.filter(r =>
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q)) ||
      (r.contactMethod && r.contactMethod.toLowerCase().includes(q)) ||
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
  logAudit(id, "confirmed", "Community confirmation added");
  return saveReport(report);
}

export function flagReport(id) {
  const report = getReportById(id);
  if (!report) return null;
  report.flagCount = (report.flagCount || 0) + 1;
  logAudit(id, "flagged", "Community flag added");
  return saveReport(report);
}

// ── Disputes ──────────────────────────────────────────

export function disputeReport(id, reason) {
  const report = getReportById(id);
  if (!report) return null;
  report.disputeCount = (report.disputeCount || 0) + 1;
  if (!report.disputes) report.disputes = [];
  report.disputes.push({
    reason: reason || "",
    createdAt: new Date().toISOString(),
  });
  logAudit(id, "disputed", reason || "Dispute filed");
  return saveReport(report);
}

// ── Moderation ────────────────────────────────────────

export function updateReportStatus(id, status, moderatorNotes = "") {
  const report = getReportById(id);
  if (!report) return null;
  const oldStatus = report.status;
  report.status = status;
  report.reviewedAt = new Date().toISOString();

  // Append to moderation history instead of overwriting
  if (!report.moderationHistory) report.moderationHistory = [];
  report.moderationHistory.push({
    from: oldStatus,
    to: status,
    notes: moderatorNotes,
    timestamp: new Date().toISOString(),
  });

  if (moderatorNotes) report.moderatorNotes = moderatorNotes;
  logAudit(id, `status:${oldStatus}->${status}`, moderatorNotes || `Status changed to ${status}`);
  return saveReport(report);
}

export function archiveReport(id, reason = "") {
  return updateReportStatus(id, "archived", reason || "Report archived");
}

// ── Audit Log ─────────────────────────────────────────

export function logAudit(reportId, action, detail = "") {
  const log = getAuditLog();
  log.unshift({
    reportId,
    action,
    detail,
    timestamp: new Date().toISOString(),
  });
  // Keep last 200 entries
  if (log.length > 200) log.length = 200;
  localStorage.setItem(AUDIT_KEY, JSON.stringify(log));
}

export function getAuditLog() {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getAuditLogForReport(reportId) {
  return getAuditLog().filter(e => e.reportId === reportId);
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

/**
 * Fraud Help Index — Report Schema
 * Defines the structure for fraud reports and provides
 * factory + validation functions.
 */

import { CATEGORIES, SEVERITY_LEVELS, REPORT_STATUSES } from "./categories.js";

const VALID_CATEGORY_IDS = CATEGORIES.map(c => c.id);
const VALID_SEVERITY_IDS = SEVERITY_LEVELS.map(s => s.id);
const VALID_STATUS_IDS   = REPORT_STATUSES.map(s => s.id);

/**
 * Creates a new blank report with defaults.
 * @returns {object} A fresh report object
 */
export function createReport({
  category = "other",
  title = "",
  description = "",
  severity = null,
  evidenceLinks = [],
  contactMethod = "",
  scammerIdentifiers = [],
  incidentDate = "",
  amountLost = null,
  currency = "GBP",
} = {}) {
  const now = new Date().toISOString();
  const cat = CATEGORIES.find(c => c.id === category);

  return {
    id: generateId(),
    category,
    title: title.trim(),
    description: description.trim(),
    severity: severity || (cat ? cat.severity_default : "medium"),
    status: "submitted",

    // Evidence
    evidenceLinks: evidenceLinks.filter(l => l && l.trim()),
    contactMethod: contactMethod.trim(),
    scammerIdentifiers: scammerIdentifiers.filter(s => s && s.trim()),

    // Incident details
    incidentDate: incidentDate || now.split("T")[0],
    amountLost: amountLost !== null ? Number(amountLost) : null,
    currency,

    // Community signals
    confirmCount: 0,
    flagCount: 0,

    // Timestamps
    createdAt: now,
    updatedAt: now,

    // Moderation
    moderatorNotes: "",
    reviewedAt: null,
  };
}

/**
 * Validates a report object. Returns { valid, errors }.
 */
export function validateReport(report) {
  const errors = [];

  if (!report.title || report.title.trim().length < 5) {
    errors.push("Title must be at least 5 characters.");
  }
  if (report.title && report.title.length > 200) {
    errors.push("Title must be under 200 characters.");
  }
  if (!report.description || report.description.trim().length < 20) {
    errors.push("Description must be at least 20 characters.");
  }
  if (report.description && report.description.length > 5000) {
    errors.push("Description must be under 5000 characters.");
  }
  if (!VALID_CATEGORY_IDS.includes(report.category)) {
    errors.push("Invalid category.");
  }
  if (report.severity && !VALID_SEVERITY_IDS.includes(report.severity)) {
    errors.push("Invalid severity level.");
  }
  if (report.status && !VALID_STATUS_IDS.includes(report.status)) {
    errors.push("Invalid status.");
  }
  if (report.evidenceLinks && report.evidenceLinks.length > 10) {
    errors.push("Maximum 10 evidence links.");
  }
  if (report.evidenceLinks) {
    for (const link of report.evidenceLinks) {
      if (link && !isValidUrl(link)) {
        errors.push(`Invalid evidence URL: ${link}`);
      }
    }
  }
  if (report.amountLost !== null && report.amountLost !== undefined) {
    if (isNaN(Number(report.amountLost)) || Number(report.amountLost) < 0) {
      errors.push("Amount lost must be a positive number.");
    }
  }
  if (report.scammerIdentifiers && report.scammerIdentifiers.length > 10) {
    errors.push("Maximum 10 scammer identifiers.");
  }

  return { valid: errors.length === 0, errors };
}

function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function generateId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `fhi-${ts}-${rand}`;
}

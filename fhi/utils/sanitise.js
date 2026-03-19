/**
 * Fraud Help Index — Sanitisation Layer
 * Cleans all user input before storage and escapes all output before rendering.
 * Zero external dependencies.
 */

const HTML_ESCAPE_MAP = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

const HTML_ESCAPE_RE = /[&<>"'`/]/g;

/**
 * Escapes HTML entities for safe rendering in innerHTML or textContent.
 * Use this on ALL user-supplied strings before inserting into DOM.
 */
export function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str.replace(HTML_ESCAPE_RE, ch => HTML_ESCAPE_MAP[ch]);
}

/**
 * Strips HTML tags completely. Use for plaintext storage.
 */
export function stripTags(str) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Trims, collapses whitespace, and strips tags from a string.
 * Use on all user text inputs before saving.
 */
export function cleanText(str) {
  if (typeof str !== "string") return "";
  return stripTags(str).replace(/\s+/g, " ").trim();
}

/**
 * Sanitises a URL string. Returns empty string if invalid or dangerous.
 */
export function cleanUrl(str) {
  if (typeof str !== "string") return "";
  const trimmed = str.trim();
  // Block javascript: and data: URIs
  if (/^(javascript|data|vbscript):/i.test(trimmed)) return "";
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return "";
    return url.href;
  } catch {
    return "";
  }
}

/**
 * Sanitises an entire report object before storage.
 * Cleans all string fields, validates URLs.
 */
export function sanitiseReport(report) {
  return {
    ...report,
    title: cleanText(report.title || ""),
    description: cleanText(report.description || ""),
    contactMethod: cleanText(report.contactMethod || ""),
    moderatorNotes: cleanText(report.moderatorNotes || ""),
    evidenceLinks: (report.evidenceLinks || [])
      .map(cleanUrl)
      .filter(Boolean),
    scammerIdentifiers: (report.scammerIdentifiers || [])
      .map(cleanText)
      .filter(Boolean),
  };
}

/**
 * Sanitises a report for safe HTML rendering.
 * Escapes all user-generated string fields.
 */
export function escapeReportForRender(report) {
  return {
    ...report,
    title: escapeHtml(report.title || ""),
    description: escapeHtml(report.description || ""),
    contactMethod: escapeHtml(report.contactMethod || ""),
    moderatorNotes: escapeHtml(report.moderatorNotes || ""),
    evidenceLinks: (report.evidenceLinks || []).map(escapeHtml),
    scammerIdentifiers: (report.scammerIdentifiers || []).map(escapeHtml),
  };
}

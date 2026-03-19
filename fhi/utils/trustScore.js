/**
 * Fraud Help Index — Trust Score Engine
 * Phase 3: Clearer credibility labels, authority language,
 * dispute penalty, quality factors.
 *
 * Score range: 0–100
 *   0–25  = "Needs Verification"   — not enough signal
 *   26–50 = "Under Assessment"     — some indicators present
 *   51–75 = "Credible Report"      — solid evidence, corroboration
 *   76–100 = "Verified Threat"     — confirmed, high-severity, well-evidenced
 */

const WEIGHTS = {
  severity:     { low: 5, medium: 15, high: 25, critical: 35 },
  status:       { submitted: 5, under_review: 10, confirmed: 30, resolved: 15, disputed: -5, rejected: -20, archived: 0 },
  meToo:        6,    // per "me too" confirmation, capped at 5
  flag:         -3,   // per flag (reduces trust), capped at 5
  dispute:      -8,   // per dispute, capped at 3
  evidence:     5,    // per evidence link, capped at 3
  identifiers:  4,    // per scammer identifier, capped at 3
  hasContact:   3,    // bonus for providing contact method
  hasDate:      2,    // bonus for providing incident date
  hasAmount:    2,    // bonus for providing financial amount
  recencyDays:  14,
  recencyBonus: 10,
};

/**
 * @param {object} report - A report object from the store
 * @returns {{ score: number, label: string, color: string, tier: string, breakdown: object, qualityFactors: object }}
 */
export function calculateTrustScore(report) {
  const breakdown = {};

  // Severity base
  const sevScore = WEIGHTS.severity[report.severity] || 10;
  breakdown.severity = sevScore;

  // Status modifier
  const statusScore = WEIGHTS.status[report.status] || 0;
  breakdown.status = statusScore;

  // Community "me too" signals (capped)
  const meTooCount = Math.min(report.confirmCount || 0, 5);
  const meTooScore = meTooCount * WEIGHTS.meToo;
  breakdown.confirmations = meTooScore;

  // Flag penalty (capped)
  const flagCount = Math.min(report.flagCount || 0, 5);
  const flagScore = flagCount * WEIGHTS.flag;
  breakdown.flags = flagScore;

  // Dispute penalty (capped)
  const disputeCount = Math.min(report.disputeCount || 0, 3);
  const disputeScore = disputeCount * WEIGHTS.dispute;
  breakdown.disputes = disputeScore;

  // Evidence bonus (capped)
  const evCount = Math.min((report.evidenceLinks || []).length, 3);
  const evScore = evCount * WEIGHTS.evidence;
  breakdown.evidence = evScore;

  // Identifier bonus (capped)
  const idCount = Math.min((report.scammerIdentifiers || []).length, 3);
  const idScore = idCount * WEIGHTS.identifiers;
  breakdown.identifiers = idScore;

  // Quality factors — completeness of the report
  const qualityFactors = {
    hasEvidence:    (report.evidenceLinks || []).length > 0,
    hasIdentifiers: (report.scammerIdentifiers || []).length > 0,
    hasContact:     Boolean(report.contactMethod),
    hasDate:        Boolean(report.incidentDate),
    hasAmount:      report.amountLost !== null && report.amountLost !== undefined,
  };

  let qualityScore = 0;
  if (qualityFactors.hasContact) qualityScore += WEIGHTS.hasContact;
  if (qualityFactors.hasDate)    qualityScore += WEIGHTS.hasDate;
  if (qualityFactors.hasAmount)  qualityScore += WEIGHTS.hasAmount;
  breakdown.quality = qualityScore;

  // Recency bonus
  let recencyScore = 0;
  if (report.createdAt) {
    const ageMs = Date.now() - new Date(report.createdAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays <= WEIGHTS.recencyDays) {
      recencyScore = Math.round(WEIGHTS.recencyBonus * (1 - ageDays / WEIGHTS.recencyDays));
    }
  }
  breakdown.recency = recencyScore;

  // Total (clamped 0–100)
  const raw = sevScore + statusScore + meTooScore + flagScore + disputeScore + evScore + idScore + qualityScore + recencyScore;
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    ...getLabel(score),
    breakdown,
    qualityFactors,
  };
}

function getLabel(score) {
  if (score >= 76) return { label: "Verified Threat",      color: "#e74c3c", tier: "verified" };
  if (score >= 51) return { label: "Credible Report",      color: "#f39c12", tier: "credible" };
  if (score >= 26) return { label: "Under Assessment",     color: "#3498db", tier: "assessment" };
  return                   { label: "Needs Verification",   color: "#636e72", tier: "unverified" };
}

/**
 * Returns a mini HTML badge showing the credibility tier.
 */
export function renderTrustBadge(report) {
  const { score, label, color, tier } = calculateTrustScore(report);
  return `<span class="trust-badge trust-${tier}" style="--trust-color:${color};" title="Credibility: ${score}/100">${label}</span>`;
}

/**
 * Returns a detailed breakdown HTML block for the detail view.
 */
export function renderTrustBreakdown(report) {
  const { score, label, color, tier, breakdown, qualityFactors } = calculateTrustScore(report);

  const factors = [
    { label: "Severity",       value: breakdown.severity,      positive: true },
    { label: "Status",         value: breakdown.status,         positive: breakdown.status >= 0 },
    { label: "Confirmations",  value: breakdown.confirmations,  positive: true },
    { label: "Evidence",       value: breakdown.evidence,       positive: true },
    { label: "Identifiers",    value: breakdown.identifiers,    positive: true },
    { label: "Quality",        value: breakdown.quality,        positive: true },
    { label: "Recency",        value: breakdown.recency,        positive: true },
  ];
  if (breakdown.flags)    factors.push({ label: "Flags",    value: breakdown.flags,    positive: false });
  if (breakdown.disputes) factors.push({ label: "Disputes", value: breakdown.disputes, positive: false });

  const factorHtml = factors
    .filter(f => f.value !== 0)
    .map(f => `<span class="trust-factor ${f.positive ? "" : "trust-factor-neg"}">${f.label} ${f.value >= 0 ? "+" : ""}${f.value}</span>`)
    .join("");

  // Quality checklist
  const checks = [
    { done: qualityFactors.hasEvidence,    label: "Evidence provided" },
    { done: qualityFactors.hasIdentifiers, label: "Scammer identified" },
    { done: qualityFactors.hasContact,     label: "Contact method stated" },
    { done: qualityFactors.hasDate,        label: "Incident date given" },
    { done: qualityFactors.hasAmount,      label: "Financial impact noted" },
  ];
  const qualityHtml = checks.map(c =>
    `<span class="quality-check ${c.done ? "done" : ""}">${c.done ? "✓" : "○"} ${c.label}</span>`
  ).join("");

  return `
    <div class="trust-detail">
      <div class="trust-meter">
        <div class="trust-meter-fill" style="width:${score}%;background:${color};"></div>
      </div>
      <div class="trust-detail-label">
        <span class="trust-badge trust-${tier}" style="--trust-color:${color};">${label}</span>
        <span class="trust-score-num">${score}/100</span>
      </div>
      <div class="trust-breakdown">${factorHtml}</div>
      <div class="quality-checks">
        <div class="quality-checks-title">Report completeness</div>
        ${qualityHtml}
      </div>
    </div>
  `;
}

/**
 * Compute a report quality percentage (0-100) based on field completeness.
 * Used in the report form as live feedback.
 */
export function calculateReportQuality(draft) {
  let filled = 0;
  let total = 7;

  if (draft.category)                                     filled++;
  if (draft.title && draft.title.trim().length >= 5)      filled++;
  if (draft.description && draft.description.trim().length >= 20) filled++;
  if (draft.severity)                                     filled++;
  if (draft.contactMethod && draft.contactMethod.trim())  filled++;
  if (draft.incidentDate)                                 filled++;
  if ((draft.evidenceLinks || []).some(l => l.trim()) ||
      (draft.scammerIdentifiers || []).some(s => s.trim())) filled++;

  return Math.round((filled / total) * 100);
}

/**
 * Fraud Help Index — Trust Score Engine
 * Calculates a risk/trust score per report based on community signals,
 * severity, recency, evidence, and moderation status.
 *
 * Score range: 0–100
 *   0–30  = "Low Signal"
 *   31–60 = "Medium Risk"
 *   61–100 = "High Risk"
 */

const WEIGHTS = {
  severity:     { low: 5, medium: 15, high: 25, critical: 35 },
  status:       { submitted: 5, under_review: 10, confirmed: 30, resolved: 10, rejected: -20 },
  meToo:        6,    // per "me too" confirmation, capped at 5
  flag:         -3,   // per flag (reduces trust), capped at 5
  evidence:     5,    // per evidence link, capped at 3
  identifiers:  4,    // per scammer identifier, capped at 3
  recencyDays:  14,   // reports within this window get full recency bonus
  recencyBonus: 10,   // max recency bonus
};

/**
 * @param {object} report - A report object from the store
 * @returns {{ score: number, label: string, color: string, breakdown: object }}
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
  breakdown.meToo = meTooScore;

  // Flag penalty (capped)
  const flagCount = Math.min(report.flagCount || 0, 5);
  const flagScore = flagCount * WEIGHTS.flag;
  breakdown.flags = flagScore;

  // Evidence bonus (capped)
  const evCount = Math.min((report.evidenceLinks || []).length, 3);
  const evScore = evCount * WEIGHTS.evidence;
  breakdown.evidence = evScore;

  // Identifier bonus (capped)
  const idCount = Math.min((report.scammerIdentifiers || []).length, 3);
  const idScore = idCount * WEIGHTS.identifiers;
  breakdown.identifiers = idScore;

  // Recency bonus — newer reports score higher
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
  const raw = sevScore + statusScore + meTooScore + flagScore + evScore + idScore + recencyScore;
  const score = Math.max(0, Math.min(100, raw));

  return {
    score,
    ...getLabel(score),
    breakdown,
  };
}

function getLabel(score) {
  if (score >= 61) return { label: "High Risk",    color: "#e74c3c", tier: "high" };
  if (score >= 31) return { label: "Medium Risk",   color: "#f39c12", tier: "medium" };
  return                   { label: "Low Signal",    color: "#27ae60", tier: "low" };
}

/**
 * Returns a mini HTML bar showing the trust score visually.
 */
export function renderTrustBadge(report) {
  const { score, label, color, tier } = calculateTrustScore(report);
  return `<span class="trust-badge trust-${tier}" style="--trust-color:${color};" title="Trust Score: ${score}/100">${label} <span class="trust-score-num">${score}</span></span>`;
}

/**
 * Returns a detailed breakdown HTML block for the detail view.
 */
export function renderTrustBreakdown(report) {
  const { score, label, color, tier, breakdown } = calculateTrustScore(report);
  return `
    <div class="trust-detail">
      <div class="trust-meter">
        <div class="trust-meter-fill" style="width:${score}%;background:${color};"></div>
      </div>
      <div class="trust-detail-label">
        <span class="trust-badge trust-${tier}" style="--trust-color:${color};">${label} <span class="trust-score-num">${score}</span>/100</span>
      </div>
      <div class="trust-breakdown">
        <span class="trust-factor">Severity +${breakdown.severity}</span>
        <span class="trust-factor">Status ${breakdown.status >= 0 ? "+" : ""}${breakdown.status}</span>
        <span class="trust-factor">Confirmations +${breakdown.meToo}</span>
        ${breakdown.flags ? `<span class="trust-factor trust-factor-neg">Flags ${breakdown.flags}</span>` : ""}
        <span class="trust-factor">Evidence +${breakdown.evidence}</span>
        <span class="trust-factor">Identifiers +${breakdown.identifiers}</span>
        <span class="trust-factor">Recency +${breakdown.recency}</span>
      </div>
    </div>
  `;
}

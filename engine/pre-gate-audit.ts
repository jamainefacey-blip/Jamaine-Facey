// engine/pre-gate-audit.ts — pre-gate audit layer
// Detects missing SEO, monetisation, UX layers BEFORE gate submission.
// Returns READY_FOR_GATE | NEEDS_WORK | BLOCKED with specific deficiency list.
//
// Usage: import { preGateAudit } from './pre-gate-audit'
//        Or run directly: npx tsx engine/pre-gate-audit.ts <taskId> <lane> <assetType> [filePath]

import fs from 'fs';
import path from 'path';
import { ROOT } from './config';

// ── Standard definitions ──────────────────────────────────────────────────────

export type AuditVerdict = 'READY_FOR_GATE' | 'NEEDS_WORK' | 'BLOCKED';

export interface AuditStandard {
  /** Minimum gate score required before founder review */
  minGateScore: number;
  /** Dimensions that must score above their floor or audit blocks */
  dimensionFloors: Record<string, number>;
  /** Hard-required elements per assetType */
  requiredByAssetType: Record<string, string[]>;
  /** Hard-required elements per lane */
  requiredByLane: Record<string, string[]>;
  /** Patterns that immediately flag BLOCKED */
  blockerPatterns: string[];
}

export interface PreGateFlag {
  severity: 'BLOCKER' | 'REQUIRED' | 'WARN';
  dimension: string;
  message: string;
}

export interface PreGateAuditResult {
  taskId: string;
  lane: string;
  assetType: string;
  auditedAt: string;
  verdict: AuditVerdict;
  flags: PreGateFlag[];
  readyForGate: boolean;
  summary: string;
}

// ── Load standard ─────────────────────────────────────────────────────────────

const STANDARD_FILE = path.join(ROOT, 'engine', 'data', 'audit-standard.json');

export function loadAuditStandard(): AuditStandard {
  try {
    if (fs.existsSync(STANDARD_FILE)) {
      return JSON.parse(fs.readFileSync(STANDARD_FILE, 'utf8')) as AuditStandard;
    }
  } catch { /* fall through */ }
  return DEFAULT_STANDARD;
}

export const DEFAULT_STANDARD: AuditStandard = {
  minGateScore: 70,
  dimensionFloors: {
    BUILD_HEALTH:      80,   // build must be solid
    PREVIEW_PROOF:     80,   // proof required
    COMPLIANCE_SAFETY: 70,   // no dangerous gaps
    UX_VISUAL:         60,   // no obvious broken UI
    COPY_QUALITY:      60,   // no placeholder copy
  },
  requiredByAssetType: {
    ui:     ['has_title', 'has_h1', 'has_viewport', 'no_placeholders', 'has_preview_proof'],
    api:    ['has_preview_proof', 'build_pass'],
    report: ['has_title', 'has_h1', 'has_preview_proof', 'no_placeholders'],
    data:   ['build_pass'],
    config: ['build_pass'],
  },
  requiredByLane: {
    VST: ['has_cta', 'has_preview_proof', 'no_placeholders', 'build_pass'],
    FHI: ['has_preview_proof', 'no_placeholders', 'build_pass', 'compliance_clean'],
    AI_LAB: ['build_pass'],
    ADMIN:  ['build_pass'],
    BACKYARD: [],
  },
  blockerPatterns: [
    'lorem ipsum',
    '[TBD]',
    '[INSERT]',
    '[TODO]',
    'placeholder text',
    'coming soon',
    'under construction',
  ],
};

// ── Content checkers ──────────────────────────────────────────────────────────

function checkContent(content: string, assetType: string, lane: string): PreGateFlag[] {
  const flags: PreGateFlag[] = [];

  // Hard blockers — placeholder patterns
  for (const pattern of DEFAULT_STANDARD.blockerPatterns) {
    if (content.toLowerCase().includes(pattern.toLowerCase())) {
      flags.push({
        severity: 'BLOCKER',
        dimension: 'COPY_QUALITY',
        message: `Placeholder pattern detected: "${pattern}" — must remove before gate`,
      });
    }
  }

  const isHtml = /<html|<!DOCTYPE|<head|<body/i.test(content);

  if (isHtml) {
    // SEO checks
    if (!/<title\b[^>]*>[^<]{1,}/i.test(content)) {
      flags.push({ severity: 'REQUIRED', dimension: 'SEO', message: 'Missing <title> tag — required before gate' });
    }
    if (!/<meta[^>]+name=["']description["']/i.test(content)) {
      flags.push({ severity: 'WARN', dimension: 'SEO', message: 'Missing meta description — recommended for non-internal assets' });
    }
    if (!/<meta[^>]+name=["']viewport["']/i.test(content)) {
      flags.push({ severity: 'REQUIRED', dimension: 'SEO', message: 'Missing viewport meta — mobile SEO signal absent' });
    }
    if (!/<h1\b/i.test(content)) {
      flags.push({ severity: 'REQUIRED', dimension: 'SEO', message: 'Missing <h1> — primary heading required' });
    }

    // UX checks
    if (!/<html[^>]+lang\s*=/i.test(content)) {
      flags.push({ severity: 'REQUIRED', dimension: 'ACCESSIBILITY', message: 'Missing lang attribute on <html>' });
    }
    const imgCount     = (content.match(/<img\b/gi) ?? []).length;
    const imgAltCount  = (content.match(/<img\b[^>]*alt\s*=/gi) ?? []).length;
    if (imgCount > imgAltCount) {
      flags.push({ severity: 'REQUIRED', dimension: 'ACCESSIBILITY', message: `${imgCount - imgAltCount} <img> element(s) missing alt attribute` });
    }

    // Monetisation — lane-specific
    const ctaPatterns = [/get started/i, /sign up/i, /subscribe/i, /buy now/i, /learn more/i, /contact us/i, /free trial/i, /pricing/i];
    const hasCta = ctaPatterns.some(p => p.test(content));
    if (!hasCta) {
      if (lane === 'VST') {
        flags.push({ severity: 'BLOCKER', dimension: 'MONETISATION', message: 'VST asset missing CTA — monetisation path required before gate' });
      } else if (lane === 'FHI') {
        flags.push({ severity: 'REQUIRED', dimension: 'MONETISATION', message: 'FHI asset missing next-step guidance — consider adding clear CTA' });
      } else {
        flags.push({ severity: 'WARN', dimension: 'MONETISATION', message: 'No CTA or monetisation language detected — acceptable for internal tools' });
      }
    }
  }

  return flags;
}

function checkGateResult(gateResult: Record<string, unknown>, standard: AuditStandard): PreGateFlag[] {
  const flags: PreGateFlag[] = [];
  const dims = gateResult.dimensions as Record<string, { score: number; status: string }> | undefined;
  if (!dims) return flags;

  for (const [dimName, floor] of Object.entries(standard.dimensionFloors)) {
    const dim = dims[dimName];
    if (!dim) continue;
    if (dim.score < floor) {
      const severity = dim.score < floor * 0.6 ? 'BLOCKER' : 'REQUIRED';
      flags.push({
        severity,
        dimension: dimName,
        message: `${dimName} score ${dim.score} is below required floor ${floor} — must improve before gate`,
      });
    }
  }

  // Overall score check
  const score = gateResult.score as number ?? 0;
  if (score < standard.minGateScore) {
    flags.push({
      severity: 'BLOCKER',
      dimension: 'OVERALL',
      message: `Gate score ${score} is below minimum ${standard.minGateScore} — NOT GOOD ENOUGH YET`,
    });
  }

  // Hard blockers in last gate result
  const hardBlockers = gateResult.hardBlockers as string[] ?? [];
  for (const blocker of hardBlockers) {
    flags.push({
      severity: 'BLOCKER',
      dimension: 'GATE',
      message: `Previous gate run had hard blocker: ${blocker} — must resolve`,
    });
  }

  return flags;
}

// ── Main audit function ───────────────────────────────────────────────────────

export interface PreGateInput {
  taskId: string;
  lane: string;
  assetType: string;
  buildPass: boolean;
  content?: string;
  gateResultPath?: string;
}

export function preGateAudit(input: PreGateInput): PreGateAuditResult {
  const standard = loadAuditStandard();
  const flags: PreGateFlag[] = [];

  // Build check
  if (!input.buildPass) {
    flags.push({ severity: 'BLOCKER', dimension: 'BUILD_HEALTH', message: 'Build did not pass — cannot proceed to gate' });
  }

  // Content analysis
  if (input.content) {
    flags.push(...checkContent(input.content, input.assetType, input.lane));
  }

  // Gate result analysis (if prior gate result available)
  if (input.gateResultPath && fs.existsSync(input.gateResultPath)) {
    try {
      const gateResult = JSON.parse(fs.readFileSync(input.gateResultPath, 'utf8'));
      flags.push(...checkGateResult(gateResult, standard));
    } catch { /* ignore corrupt gate result */ }
  }

  // Lane-specific required checks
  const laneReqs = standard.requiredByLane[input.lane] ?? [];
  if (laneReqs.includes('has_cta') && input.content) {
    const hasCta = /get started|sign up|subscribe|buy now|learn more|contact us|pricing/i.test(input.content);
    if (!hasCta) {
      flags.push({ severity: 'BLOCKER', dimension: 'MONETISATION', message: `Lane ${input.lane} requires CTA — not found` });
    }
  }
  if (laneReqs.includes('compliance_clean') && input.content) {
    const hasPII = /\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b|ssn|national.?id/i.test(input.content);
    if (hasPII) {
      flags.push({ severity: 'BLOCKER', dimension: 'COMPLIANCE_SAFETY', message: `Lane ${input.lane} compliance issue: PII pattern detected` });
    }
  }

  // Verdict
  const hasBlocker  = flags.some(f => f.severity === 'BLOCKER');
  const hasRequired = flags.some(f => f.severity === 'REQUIRED');

  let verdict: AuditVerdict;
  if (hasBlocker)       verdict = 'BLOCKED';
  else if (hasRequired) verdict = 'NEEDS_WORK';
  else                  verdict = 'READY_FOR_GATE';

  const blockers  = flags.filter(f => f.severity === 'BLOCKER').length;
  const required  = flags.filter(f => f.severity === 'REQUIRED').length;
  const warnings  = flags.filter(f => f.severity === 'WARN').length;

  const summary = verdict === 'READY_FOR_GATE'
    ? `Pre-gate audit passed — ${warnings} warning(s). Asset is ready for gate evaluation.`
    : verdict === 'NEEDS_WORK'
    ? `Pre-gate audit: ${required} required fix(es), ${warnings} warning(s). Resolve before submitting to gate.`
    : `Pre-gate audit BLOCKED — ${blockers} hard blocker(s) detected. NOT GOOD ENOUGH YET.`;

  return {
    taskId:       input.taskId,
    lane:         input.lane,
    assetType:    input.assetType,
    auditedAt:    new Date().toISOString(),
    verdict,
    flags,
    readyForGate: verdict === 'READY_FOR_GATE',
    summary,
  };
}

// ── CLI mode ──────────────────────────────────────────────────────────────────

if (process.argv[2]) {
  const [, , taskId, lane = 'AI_LAB', assetType = 'unknown', filePath] = process.argv;
  const content = filePath && fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : undefined;
  const gateLatest = path.join(ROOT, 'engine', 'data', 'gate-latest.json');

  const result = preGateAudit({
    taskId,
    lane,
    assetType,
    buildPass: true,
    content,
    gateResultPath: gateLatest,
  });

  console.log(JSON.stringify(result, null, 2));
}

// engine/gate.ts — Pain Gate: release quality evaluator
//
// Evaluates whether a completed task/asset is ready for founder review.
// Hard blockers force FAIL regardless of weighted score.
// Config is editable at runtime via engine/data/gate-config.json.

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { ROOT } from './config';
import type { TaskLane } from './types';

// ── Paths ─────────────────────────────────────────────────────────────────────

const DATA_DIR        = path.join(ROOT, 'engine', 'data');
const GATE_CONFIG_FILE = path.join(DATA_DIR, 'gate-config.json');
const GATE_RESULTS_DIR = path.join(DATA_DIR, 'gate-results');
const GATE_LATEST_FILE = path.join(DATA_DIR, 'gate-latest.json');
const GATE_AUDIT_LOG   = path.join(DATA_DIR, 'gate-audit.log');

// ── Config ────────────────────────────────────────────────────────────────────

export interface GateConfig {
  /** Weighted score minimum for PASS (no hard blockers) */
  passThreshold: number;
  /** Weighted score minimum for WARN instead of FAIL (no hard blockers) */
  warnThreshold: number;
  /** Per-dimension weights — must be consistent with evaluator set */
  weights: Record<string, number>;
  /** Toggle individual dimensions on/off */
  dimensionsEnabled: Record<string, boolean>;
}

export const DEFAULT_GATE_CONFIG: GateConfig = {
  passThreshold: 70,
  warnThreshold: 40,
  weights: {
    BUILD_HEALTH:      25,
    PREVIEW_PROOF:     20,
    UX_VISUAL:         15,
    MONETISATION:      10,
    COPY_QUALITY:      10,
    ACCESSIBILITY:      8,
    SEO:                6,
    COMPLIANCE_SAFETY:  4,
    RERUN_RISK:         2,
  },
  dimensionsEnabled: {
    BUILD_HEALTH:      true,
    PREVIEW_PROOF:     true,
    UX_VISUAL:         true,
    MONETISATION:      true,
    COPY_QUALITY:      true,
    ACCESSIBILITY:     true,
    SEO:               true,
    COMPLIANCE_SAFETY: true,
    RERUN_RISK:        true,
  },
};

export function loadGateConfig(): GateConfig {
  try {
    if (fs.existsSync(GATE_CONFIG_FILE)) {
      const raw = fs.readFileSync(GATE_CONFIG_FILE, 'utf8').trim();
      if (raw) return { ...DEFAULT_GATE_CONFIG, ...JSON.parse(raw) } as GateConfig;
    }
  } catch { /* corrupt — fall through */ }
  return { ...DEFAULT_GATE_CONFIG };
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type AssetType = 'ui' | 'api' | 'data' | 'report' | 'config' | 'unknown';
export type GateStatus = 'pass' | 'warn' | 'fail';

/** Hard-blocker condition IDs — trigger immediate FAIL */
export const HARD_BLOCKERS = [
  'BUILD_FAILED',
  'NO_PREVIEW_PROOF',
  'PLACEHOLDER_DETECTED',
  'COMPLIANCE_BLOCK',
  'UNKNOWN_COMPLETION',
] as const;

export type HardBlocker = typeof HARD_BLOCKERS[number];

export interface GateInput {
  taskId: string;
  lane: TaskLane | string;
  assetType?: AssetType;
  /** Task completion status — 'pass' if scheduler task.status=done, 'fail' if failed, 'unknown' if uncertain */
  buildStatus: 'pass' | 'fail' | 'unknown';
  /** URL, file path, description, or screenshot reference */
  previewProof?: string;
  /** HTML/text content to analyse for placeholders, copy quality, SEO, accessibility */
  content?: string;
  /** Arbitrary additional metadata */
  meta?: Record<string, unknown>;
}

export interface DimensionResult {
  dimension: string;
  score: number;       // 0–100
  status: GateStatus;
  findings: string[];
  hardBlocker?: HardBlocker;
}

export interface GateResult {
  id: string;
  taskId: string;
  lane: string;
  assetType: AssetType;
  evaluatedAt: string;
  overallStatus: GateStatus;
  founderReviewReady: boolean;
  score: number;       // weighted 0–100
  hardBlockers: HardBlocker[];
  dimensions: Record<string, DimensionResult>;
  requiredFixes: string[];
  warnings: string[];
}

// ── Placeholder patterns ──────────────────────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  /lorem\s+ipsum/i,
  /\[TBD\]/i,
  /\[TODO\]/i,
  /\[INSERT\]/i,
  /\[PLACEHOLDER\]/i,
  /placeholder\s+text/i,
  /your\s+text\s+here/i,
  /coming\s+soon\.{0,3}$/im,
  /under\s+construction/i,
  /sample\s+content/i,
  /dummy\s+text/i,
  /fill\s+in\s+later/i,
];

const FILLER_PATTERNS = [
  /lorem ipsum/i,
  /foo\s+bar/i,
  /test\s+content/i,
  /asdf/i,
  /qwerty/i,
];

const CTA_KEYWORDS = [
  /\bget started\b/i,
  /\bsign up\b/i,
  /\bbook (a|now|demo)\b/i,
  /\bsubscribe\b/i,
  /\bpurchase\b/i,
  /\bbuy now\b/i,
  /\blearn more\b/i,
  /\bcontact us\b/i,
  /\btry (it|for free|free)\b/i,
  /\bstart (free|now|trial)\b/i,
  /\bpric(e|es|ed|ing)\b/i,
  /\bpricing\s+plans?\b|\bview\s+plans?\b|\bour\s+plans?\b|\bcompare\s+plans?\b/i,
  /\bfree trial\b/i,
];

const CREDENTIAL_PATTERNS = [
  /api[_-]?key\s*[:=]\s*["']?[A-Za-z0-9+/]{20,}/i,
  /secret[_-]?key\s*[:=]\s*["']?[A-Za-z0-9+/]{20,}/i,
  /password\s*[:=]\s*["'][^"']{6,}["']/i,
  /access[_-]?token\s*[:=]\s*["']?[A-Za-z0-9._\-]{20,}/i,
  /private[_-]?key\s*[:=]\s*["']?-----BEGIN/i,
];

// ── Dimension evaluators ──────────────────────────────────────────────────────

function evalBuildHealth(input: GateInput): DimensionResult {
  const findings: string[] = [];

  if (input.buildStatus === 'pass') {
    return { dimension: 'BUILD_HEALTH', score: 100, status: 'pass', findings: ['Task completed successfully'] };
  }
  if (input.buildStatus === 'fail') {
    findings.push('Task reported buildStatus=fail');
    return { dimension: 'BUILD_HEALTH', score: 0, status: 'fail', findings, hardBlocker: 'BUILD_FAILED' };
  }
  // unknown
  findings.push('Completion status unknown — cannot verify build passed');
  return { dimension: 'BUILD_HEALTH', score: 30, status: 'warn', findings, hardBlocker: 'UNKNOWN_COMPLETION' };
}

function evalPreviewProof(input: GateInput): DimensionResult {
  if (input.previewProof && input.previewProof.trim().length > 0) {
    return { dimension: 'PREVIEW_PROOF', score: 100, status: 'pass', findings: [`Proof provided: ${input.previewProof.slice(0, 80)}`] };
  }
  return {
    dimension: 'PREVIEW_PROOF',
    score: 0,
    status: 'fail',
    findings: ['No preview proof attached — screenshot, URL, or render evidence required'],
    hardBlocker: 'NO_PREVIEW_PROOF',
  };
}

function evalUxVisual(input: GateInput): DimensionResult {
  const assetType = input.assetType ?? 'unknown';
  const findings: string[] = [];

  // Non-UI assets: exempt from layout checks
  if (['data', 'config', 'api'].includes(assetType)) {
    return { dimension: 'UX_VISUAL', score: 90, status: 'pass', findings: [`Asset type '${assetType}' — UX/visual check not applicable`] };
  }

  if (!input.content) {
    findings.push('No content provided — cannot evaluate UX quality');
    return { dimension: 'UX_VISUAL', score: 60, status: 'warn', findings };
  }

  const content = input.content;
  let score = 100;

  const placeholderHits = PLACEHOLDER_PATTERNS.filter(p => p.test(content));
  if (placeholderHits.length > 0) {
    score -= Math.min(60, placeholderHits.length * 20);
    findings.push(`Placeholder patterns detected (${placeholderHits.length}): ${placeholderHits.map(p => p.source.slice(0, 20)).join(', ')}`);
  }

  // Check for broken/placeholder image src
  if (/src=["']#["']/i.test(content) || /src=["']\s*["']/i.test(content)) {
    score -= 15;
    findings.push('Empty or broken image src detected');
  }

  // Very short UI content (< 200 chars for a UI asset) suggests stub
  if (assetType === 'ui' && content.length < 200) {
    score -= 20;
    findings.push('Content very short for a UI asset — may be stub/incomplete');
  }

  if (findings.length === 0) findings.push('No obvious UX/visual issues detected');
  score = Math.max(0, score);

  // High placeholder density is a hard blocker
  if (placeholderHits.length >= 3 || score <= 20) {
    return { dimension: 'UX_VISUAL', score, status: 'fail', findings, hardBlocker: 'PLACEHOLDER_DETECTED' };
  }

  return { dimension: 'UX_VISUAL', score, status: score >= 70 ? 'pass' : 'warn', findings };
}

function evalMonetisation(input: GateInput): DimensionResult {
  const assetType = input.assetType ?? 'unknown';
  const lane = input.lane;
  const findings: string[] = [];

  // Data/config/api: monetisation not applicable
  if (['data', 'config', 'api'].includes(assetType)) {
    return { dimension: 'MONETISATION', score: 90, status: 'pass', findings: [`Asset type '${assetType}' — monetisation path check not applicable`] };
  }

  if (!input.content) {
    findings.push('No content — cannot verify monetisation path present');
    return { dimension: 'MONETISATION', score: 50, status: 'warn', findings };
  }

  const content = input.content;
  const ctaFound = CTA_KEYWORDS.filter(p => p.test(content));

  if (ctaFound.length > 0) {
    findings.push(`CTA / monetisation language found (${ctaFound.length} signals)`);
    return { dimension: 'MONETISATION', score: 90, status: 'pass', findings };
  }

  // VST lane requires strong monetisation presence
  if (lane === 'VST') {
    findings.push('VST lane: no CTA or pricing language detected — monetisation path missing');
    return { dimension: 'MONETISATION', score: 20, status: 'fail', findings };
  }

  // FHI: soft monetisation requirement
  if (lane === 'FHI') {
    findings.push('FHI lane: no clear CTA detected — consider adding next-step guidance');
    return { dimension: 'MONETISATION', score: 50, status: 'warn', findings };
  }

  findings.push('No CTA or monetisation language found — consider adding clear next step');
  return { dimension: 'MONETISATION', score: 45, status: 'warn', findings };
}

function evalCopyQuality(input: GateInput): DimensionResult {
  const findings: string[] = [];

  if (!input.content) {
    findings.push('No content provided — cannot evaluate copy quality');
    return { dimension: 'COPY_QUALITY', score: 60, status: 'warn', findings };
  }

  const content = input.content;
  let score = 100;

  // Hard placeholder copy
  const fillerHits = [...PLACEHOLDER_PATTERNS, ...FILLER_PATTERNS].filter(p => p.test(content));
  if (fillerHits.length > 0) {
    score -= Math.min(80, fillerHits.length * 30);
    findings.push(`Placeholder/filler copy detected (${fillerHits.length} patterns)`);
  }

  // Bracket sequences suggest unfilled templates
  const bracketCount = (content.match(/\[[A-Z\s]+\]/g) ?? []).length;
  if (bracketCount > 0) {
    score -= Math.min(40, bracketCount * 15);
    findings.push(`${bracketCount} unfilled template bracket(s) [LIKE THIS] found`);
  }

  // Very thin content
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount < 20 && !['data', 'config', 'api'].includes(input.assetType ?? '')) {
    score -= 25;
    findings.push(`Very thin copy (${wordCount} words) — content may be incomplete`);
  }

  if (findings.length === 0) findings.push('Copy quality check passed — no obvious filler detected');
  score = Math.max(0, score);

  // High filler is a hard blocker
  if (fillerHits.filter(p => PLACEHOLDER_PATTERNS.includes(p as RegExp)).length >= 2 || score <= 15) {
    return { dimension: 'COPY_QUALITY', score, status: 'fail', findings, hardBlocker: 'PLACEHOLDER_DETECTED' };
  }

  return { dimension: 'COPY_QUALITY', score, status: score >= 70 ? 'pass' : 'warn', findings };
}

function evalAccessibility(input: GateInput): DimensionResult {
  const findings: string[] = [];

  if (!input.content) {
    findings.push('No content — accessibility check skipped');
    return { dimension: 'ACCESSIBILITY', score: 70, status: 'warn', findings };
  }

  const content = input.content;
  const isHtml = /<html|<!DOCTYPE|<body|<main|<div/i.test(content);

  if (!isHtml) {
    return { dimension: 'ACCESSIBILITY', score: 90, status: 'pass', findings: ['Non-HTML content — accessibility structural check not applicable'] };
  }

  let score = 100;

  // img without alt
  const imgTotal  = (content.match(/<img\b/gi) ?? []).length;
  const imgWithAlt = (content.match(/<img\b[^>]*\balt\s*=/gi) ?? []).length;
  const imgMissingAlt = imgTotal - imgWithAlt;
  if (imgMissingAlt > 0) {
    score -= Math.min(30, imgMissingAlt * 10);
    findings.push(`${imgMissingAlt} <img> element(s) missing alt attribute`);
  }

  // Semantic structure check
  const semanticTags = ['<main', '<nav', '<header', '<footer', '<section', '<article', '<aside'];
  const semanticFound = semanticTags.filter(t => content.toLowerCase().includes(t));
  if (semanticFound.length === 0) {
    score -= 20;
    findings.push('No semantic HTML structure detected (nav/main/header/footer/section)');
  }

  // lang attribute on html
  if (/<html\b/i.test(content) && !/<html[^>]+\blang\s*=/i.test(content)) {
    score -= 10;
    findings.push('<html> element missing lang attribute');
  }

  // Heading structure
  const hasH1 = /<h1\b/i.test(content);
  if (!hasH1) {
    score -= 15;
    findings.push('No <h1> heading found — missing primary heading structure');
  }

  if (findings.length === 0) findings.push('Accessibility structure check passed');
  score = Math.max(0, score);
  return { dimension: 'ACCESSIBILITY', score, status: score >= 70 ? 'pass' : 'warn', findings };
}

function evalSeo(input: GateInput): DimensionResult {
  const assetType = input.assetType ?? 'unknown';
  const findings: string[] = [];

  if (['data', 'config', 'api'].includes(assetType)) {
    return { dimension: 'SEO', score: 90, status: 'pass', findings: [`Asset type '${assetType}' — SEO check not applicable`] };
  }

  if (!input.content) {
    findings.push('No content — cannot evaluate SEO readiness');
    return { dimension: 'SEO', score: 50, status: 'warn', findings };
  }

  const content = input.content;
  const isHtml = /<html|<!DOCTYPE|<head|<title/i.test(content);

  if (!isHtml) {
    findings.push('Non-HTML content — SEO check limited');
    return { dimension: 'SEO', score: 75, status: 'pass', findings };
  }

  let score = 100;

  // Title tag
  if (!/<title\b[^>]*>[^<]{1,}/i.test(content)) {
    score -= 30;
    findings.push('Missing <title> tag — critical SEO gap');
  }

  // Meta description
  if (!/<meta\b[^>]*\bname\s*=\s*["']description["']/i.test(content)) {
    score -= 20;
    findings.push('Missing <meta name="description"> — SEO description absent');
  }

  // Viewport meta
  if (!/<meta\b[^>]*\bname\s*=\s*["']viewport["']/i.test(content)) {
    score -= 10;
    findings.push('Missing <meta name="viewport"> — mobile SEO signal absent');
  }

  // H1
  if (!/<h1\b/i.test(content)) {
    score -= 15;
    findings.push('No <h1> heading — primary heading missing for SEO');
  }

  // OG tags (bonus / signal only — no penalty)
  if (/<meta\b[^>]*\bproperty\s*=\s*["']og:/i.test(content)) {
    findings.push('Open Graph meta tags present — good for social preview');
  }

  if (findings.length === 0) findings.push('SEO structure check passed');
  score = Math.max(0, score);
  return { dimension: 'SEO', score, status: score >= 70 ? 'pass' : 'warn', findings };
}

function evalComplianceSafety(input: GateInput): DimensionResult {
  const findings: string[] = [];
  const lane = input.lane;
  const content = input.content ?? '';

  let score = 100;

  // Credential / secret pattern detection
  const credHits = CREDENTIAL_PATTERNS.filter(p => p.test(content));
  if (credHits.length > 0) {
    score -= 60;
    findings.push(`Potential credentials/secrets detected in content (${credHits.length} pattern(s)) — must review before release`);
  }

  // FHI/VST: extra sensitivity
  if (['FHI', 'VST'].includes(lane)) {
    // Check for unmasked card / PII-like patterns
    if (/\b\d{4}[\s-]\d{4}[\s-]\d{4}[\s-]\d{4}\b/.test(content)) {
      score -= 40;
      findings.push('Possible card number pattern detected in FHI/VST content');
    }
    if (/\b(?:ssn|national.?id|dob)\b/i.test(content)) {
      score -= 30;
      findings.push('Possible PII field reference (SSN / national-id / dob) in sensitive lane');
    }
  }

  if (score <= 40) {
    findings.push('Compliance/safety issues require review before founder presentation');
    return { dimension: 'COMPLIANCE_SAFETY', score, status: 'fail', findings, hardBlocker: 'COMPLIANCE_BLOCK' };
  }

  if (findings.length === 0) findings.push('No compliance or safety issues detected');
  score = Math.max(0, score);
  return { dimension: 'COMPLIANCE_SAFETY', score, status: score >= 70 ? 'pass' : 'warn', findings };
}

function evalRerunRisk(
  input: GateInput,
  otherDimensions: Record<string, DimensionResult>,
): DimensionResult {
  const findings: string[] = [];
  let score = 100;

  const failedDims  = Object.values(otherDimensions).filter(d => d.status === 'fail').length;
  const warnedDims  = Object.values(otherDimensions).filter(d => d.status === 'warn').length;
  const buildHealth = otherDimensions['BUILD_HEALTH'];

  if (buildHealth && buildHealth.score < 50) {
    score -= 50;
    findings.push('Build health is low — high rerun risk');
  }

  if (failedDims >= 3) {
    score -= 40;
    findings.push(`${failedDims} dimensions failed — output may be incomplete`);
  } else if (failedDims >= 1 || warnedDims >= 3) {
    score -= 20;
    findings.push(`${failedDims} fail(s) + ${warnedDims} warn(s) — moderate rerun risk`);
  }

  if (input.buildStatus === 'unknown') {
    score -= 30;
    findings.push('Completion status unknown — cannot confirm task is safe to release');
  }

  if (findings.length === 0) findings.push('Low rerun risk');
  score = Math.max(0, score);
  return { dimension: 'RERUN_RISK', score, status: score >= 70 ? 'pass' : score >= 40 ? 'warn' : 'fail', findings };
}

// ── Core evaluator ─────────────────────────────────────────────────────────────

export function evaluate(input: GateInput): GateResult {
  const config = loadGateConfig();
  const id = randomUUID();
  const evaluatedAt = new Date().toISOString();
  const assetType: AssetType = input.assetType ?? 'unknown';

  // Run all enabled dimensions (except RERUN_RISK which needs others first)
  const dimensionEvaluators: Record<string, () => DimensionResult> = {
    BUILD_HEALTH:      () => evalBuildHealth(input),
    PREVIEW_PROOF:     () => evalPreviewProof(input),
    UX_VISUAL:        () => evalUxVisual(input),
    MONETISATION:     () => evalMonetisation(input),
    COPY_QUALITY:     () => evalCopyQuality(input),
    ACCESSIBILITY:    () => evalAccessibility(input),
    SEO:              () => evalSeo(input),
    COMPLIANCE_SAFETY: () => evalComplianceSafety(input),
  };

  const dimensions: Record<string, DimensionResult> = {};
  for (const [name, fn] of Object.entries(dimensionEvaluators)) {
    if (config.dimensionsEnabled[name] !== false) {
      dimensions[name] = fn();
    }
  }

  // RERUN_RISK depends on all other results
  if (config.dimensionsEnabled['RERUN_RISK'] !== false) {
    dimensions['RERUN_RISK'] = evalRerunRisk(input, dimensions);
  }

  // Collect hard blockers
  const hardBlockers: HardBlocker[] = [];
  for (const d of Object.values(dimensions)) {
    if (d.hardBlocker && !hardBlockers.includes(d.hardBlocker)) {
      hardBlockers.push(d.hardBlocker);
    }
  }

  // Weighted score
  const weights = config.weights;
  const enabledDimNames = Object.keys(dimensions);
  let totalWeight = enabledDimNames.reduce((sum, n) => sum + (weights[n] ?? 0), 0);
  if (totalWeight === 0) totalWeight = 1;

  const weightedScore = enabledDimNames.reduce((sum, n) => {
    const w = weights[n] ?? 0;
    return sum + (dimensions[n].score * w);
  }, 0) / totalWeight;

  const score = Math.round(weightedScore);

  // Overall status
  let overallStatus: GateStatus;
  if (hardBlockers.length > 0) {
    overallStatus = 'fail';
  } else if (score >= config.passThreshold) {
    overallStatus = 'pass';
  } else if (score >= config.warnThreshold) {
    overallStatus = 'warn';
  } else {
    overallStatus = 'fail';
  }

  const founderReviewReady = overallStatus === 'pass';

  // Collect required fixes and warnings
  const requiredFixes: string[] = [];
  const warnings: string[] = [];

  for (const d of Object.values(dimensions)) {
    for (const finding of d.findings) {
      if (d.status === 'fail') {
        requiredFixes.push(`[${d.dimension}] ${finding}`);
      } else if (d.status === 'warn') {
        warnings.push(`[${d.dimension}] ${finding}`);
      }
    }
  }

  if (hardBlockers.length > 0) {
    requiredFixes.unshift(`HARD BLOCKERS: ${hardBlockers.join(', ')} — must resolve before founder review`);
  }

  const result: GateResult = {
    id,
    taskId: input.taskId,
    lane: input.lane,
    assetType,
    evaluatedAt,
    overallStatus,
    founderReviewReady,
    score,
    hardBlockers,
    dimensions,
    requiredFixes,
    warnings,
  };

  persistResult(result);
  return result;
}

// ── Persistence ───────────────────────────────────────────────────────────────

function persistResult(result: GateResult): void {
  fs.mkdirSync(GATE_RESULTS_DIR, { recursive: true });

  // Per-result file
  const file = path.join(GATE_RESULTS_DIR, `${result.id}.json`);
  fs.writeFileSync(file, JSON.stringify(result, null, 2) + '\n', 'utf8');

  // Latest pointer
  fs.writeFileSync(GATE_LATEST_FILE, JSON.stringify(result, null, 2) + '\n', 'utf8');

  // Audit log
  const logLine = `[${result.evaluatedAt}] gate-eval id=${result.id} task=${result.taskId} lane=${result.lane} ` +
    `status=${result.overallStatus} score=${result.score} founderReady=${result.founderReviewReady} ` +
    `hardBlockers=[${result.hardBlockers.join(',')}]\n`;
  fs.appendFileSync(GATE_AUDIT_LOG, logLine, 'utf8');
}

/** Load latest gate result, or null if none exists. */
export function loadLatestGateResult(): GateResult | null {
  try {
    if (fs.existsSync(GATE_LATEST_FILE)) {
      return JSON.parse(fs.readFileSync(GATE_LATEST_FILE, 'utf8')) as GateResult;
    }
  } catch { /* no result yet */ }
  return null;
}

/** List all gate results (newest first, up to limit). */
export function listGateResults(limit = 20): GateResult[] {
  try {
    fs.mkdirSync(GATE_RESULTS_DIR, { recursive: true });
    const files = fs.readdirSync(GATE_RESULTS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => ({ f, mtime: fs.statSync(path.join(GATE_RESULTS_DIR, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit)
      .map(({ f }) => f);

    return files.map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(GATE_RESULTS_DIR, f), 'utf8')) as GateResult; }
      catch { return null; }
    }).filter((r): r is GateResult => r !== null);
  } catch { return []; }
}

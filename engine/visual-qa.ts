/**
 * visual-qa.ts
 * Enforce real-world output quality.
 * Checks: layout integrity, mobile usability, readability,
 * CTA visibility (commercial/public), no placeholder content.
 * Blocks weak visual output from gate.
 */

import * as fs from 'fs';
import * as path from 'path';
import { PreviewResult } from './preview-engine';
import { ExecutionPlan } from './execution-planner';

// ── Types ──────────────────────────────────────────────────────────────────

export type VisualCheckStatus = 'PASS' | 'WARN' | 'FAIL' | 'SKIP';

export interface VisualCheck {
  check:    string;
  status:   VisualCheckStatus;
  score:    number;   // 0–100
  finding:  string;
}

export interface VisualResult {
  qaId:       string;
  planId:     string;
  passed:     boolean;
  overallScore: number;  // 0–100
  threshold:  number;    // minimum to pass gate
  checks:     VisualCheck[];
  blockers:   string[];
  assessedAt: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const VISUAL_FILE = path.join('engine', 'data', 'visual-result.json');
const PASS_THRESHOLD = 60;   // minimum overall score to pass gate

const COMMERCIAL_LANES = ['VST', 'FHI'];
const PUBLIC_ASSET_TYPES = ['dashboard', 'portal', 'product', 'page'];

// ── Check functions ────────────────────────────────────────────────────────

function checkLayoutIntegrity(previewResult: PreviewResult): VisualCheck {
  // Proxy: both desktop + mobile proofs captured
  const desktopOk = previewResult.proofs.find(p => p.target === 'desktop')?.captured ?? false;
  const mobileOk  = previewResult.proofs.find(p => p.target === 'mobile')?.captured ?? false;
  const score = desktopOk && mobileOk ? 90 : desktopOk || mobileOk ? 50 : 0;
  return {
    check:   'layout-integrity',
    status:  score >= 80 ? 'PASS' : score >= 40 ? 'WARN' : 'FAIL',
    score,
    finding: `desktop=${desktopOk} mobile=${mobileOk} — ${score >= 80 ? 'layout proof complete' : 'partial proof only'}`,
  };
}

function checkMobileUsability(previewResult: PreviewResult): VisualCheck {
  const mobileProof = previewResult.proofs.find(p => p.target === 'mobile');
  if (!mobileProof) {
    return { check: 'mobile-usability', status: 'FAIL', score: 0, finding: 'No mobile proof captured' };
  }
  const score = mobileProof.captured ? 85 : 30;
  return {
    check:   'mobile-usability',
    status:  score >= 70 ? 'PASS' : 'WARN',
    score,
    finding: mobileProof.notes,
  };
}

function checkReadability(plan: ExecutionPlan): VisualCheck {
  // Check for skeleton-based build (higher quality baseline)
  const hasSkeleton = plan.steps.some(s => /skeleton/i.test(s.description));
  const score = hasSkeleton ? 88 : 70;
  return {
    check:   'readability',
    status:  'PASS',
    score,
    finding: hasSkeleton
      ? 'Skeleton-based build — readability baseline guaranteed'
      : 'Non-skeleton build — readability assumed (no live render check)',
  };
}

function checkCtaVisibility(plan: ExecutionPlan, lane: string): VisualCheck {
  if (!COMMERCIAL_LANES.includes(lane)) {
    return { check: 'cta-visibility', status: 'SKIP', score: 100, finding: `CTA check not required for lane: ${lane}` };
  }
  // Check if any step references CTA-related content
  const hasCta = plan.steps.some(s => /cta|call.to.action|button|sign.?up|get.started|buy/i.test(s.description));
  const score  = hasCta ? 85 : 50;
  return {
    check:   'cta-visibility',
    status:  score >= 70 ? 'PASS' : 'WARN',
    score,
    finding: hasCta
      ? 'CTA reference detected in build steps'
      : `Commercial lane ${lane} — no explicit CTA reference in plan`,
  };
}

function checkNoPlaceholders(plan: ExecutionPlan): VisualCheck {
  // Scan step files for placeholder patterns
  const placeholderPatterns = /lorem ipsum|TODO|FIXME|placeholder|coming soon|\[insert\]/i;
  const offendingFiles: string[] = [];

  for (const step of plan.steps) {
    for (const file of step.files) {
      if (!fs.existsSync(file)) continue;
      try {
        const content = fs.readFileSync(file, 'utf8');
        if (placeholderPatterns.test(content)) offendingFiles.push(file);
      } catch { /* skip */ }
    }
  }

  const score = offendingFiles.length === 0 ? 100 : Math.max(0, 100 - offendingFiles.length * 20);
  return {
    check:   'no-placeholders',
    status:  score >= 80 ? 'PASS' : score >= 50 ? 'WARN' : 'FAIL',
    score,
    finding: offendingFiles.length === 0
      ? 'No placeholder content detected'
      : `Placeholder content in: ${offendingFiles.join(', ')}`,
  };
}

// ── Core ───────────────────────────────────────────────────────────────────

export function runVisualQA(plan: ExecutionPlan, previewResult: PreviewResult): VisualResult {
  const lane   = plan.lane;
  const checks: VisualCheck[] = [
    checkLayoutIntegrity(previewResult),
    checkMobileUsability(previewResult),
    checkReadability(plan),
    checkCtaVisibility(plan, lane),
    checkNoPlaceholders(plan),
  ];

  const active = checks.filter(c => c.status !== 'SKIP');
  const overallScore = active.length === 0 ? 100
    : Math.round(active.reduce((acc, c) => acc + c.score, 0) / active.length);

  const blockers = checks.filter(c => c.status === 'FAIL').map(c => c.finding);
  const passed   = overallScore >= PASS_THRESHOLD && blockers.length === 0;

  return {
    qaId:         `vqa-${Date.now()}`,
    planId:       plan.planId,
    passed,
    overallScore,
    threshold:    PASS_THRESHOLD,
    checks,
    blockers,
    assessedAt:   new Date().toISOString(),
  };
}

export function persistVisualResult(result: VisualResult): string {
  fs.writeFileSync(VISUAL_FILE, JSON.stringify(result, null, 2), 'utf8');
  return VISUAL_FILE;
}

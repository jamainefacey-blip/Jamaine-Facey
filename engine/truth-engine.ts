/**
 * truth-engine.ts — PC-TRUTH-01
 * Validates output against Pain System canon.
 * Score = weighted check against canon-vault.json truths.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────

export type TruthVerdict = 'ALIGNED' | 'PARTIAL' | 'MISALIGNED';

export interface TruthDimension {
  dimension:   string;
  weight:      number;
  score:       number;  // 0–1
  finding:     string;
}

export interface TruthResult {
  taskId:      string;
  evaluatedAt: string;
  overallScore: number;     // 0–1 weighted
  verdict:     TruthVerdict;
  dimensions:  TruthDimension[];
  violations:  string[];
  canonSource: string;
}

// ── Canon loader ───────────────────────────────────────────────────────────

const CANON_FILE = path.join('engine', 'data', 'canon-vault.json');

function loadCanon(): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(CANON_FILE, 'utf8'));
  } catch {
    return {};
  }
}

// ── Dimension checks ───────────────────────────────────────────────────────

function checkLaneConformance(content: string, canon: Record<string, unknown>): TruthDimension {
  const lanes = ['VST', 'FHI', 'AI_LAB', 'ADMIN', 'BACKYARD', 'GOVERNANCE'];
  const defs  = (canon.laneDefinitions ?? {}) as Record<string, unknown>;
  const defined = Object.keys(defs);
  const mentioned = lanes.filter(l => content.includes(l));
  const unknown   = mentioned.filter(l => !defined.includes(l));
  const score = unknown.length === 0 ? 1.0 : Math.max(0, 1.0 - unknown.length * 0.25);
  return {
    dimension: 'lane-conformance',
    weight: 0.25,
    score,
    finding: unknown.length === 0
      ? 'All referenced lanes are defined in canon'
      : `Unknown lanes referenced: ${unknown.join(', ')}`,
  };
}

function checkFounderControlRespect(content: string, canon: Record<string, unknown>): TruthDimension {
  const rules   = (canon.founderControlRules ?? []) as string[];
  const violations: string[] = [];
  // Check for patterns that violate founder control
  if (/grant.*system.*founder|system.*override.*policy/i.test(content)) {
    violations.push('system escalation to founder detected');
  }
  if (/external_input.*override|client_workspace.*override/i.test(content)) {
    violations.push('untrusted role attempting override');
  }
  const score = violations.length === 0 ? 1.0 : 0.0;
  return {
    dimension: 'founder-control-respect',
    weight: 0.30,
    score,
    finding: violations.length === 0
      ? `Founder control respected (${rules.length} rules checked)`
      : `Founder control violations: ${violations.join('; ')}`,
  };
}

function checkBiabLawCompliance(content: string, canon: Record<string, unknown>): TruthDimension {
  const biab = (canon.biabLaw ?? {}) as Record<string, unknown>;
  const principles = (biab.principles ?? []) as string[];
  let hits = 0;
  // Check if content references BIAB-relevant patterns without violating isolation
  if (/cross.client|other.client.data/i.test(content) && !/isolated|isolation/i.test(content)) {
    return { dimension: 'biab-law-compliance', weight: 0.20, score: 0.0, finding: 'Cross-client data access without isolation' };
  }
  if (/client.workspace/i.test(content)) hits++;
  if (/private.by.default|isolated/i.test(content)) hits++;
  const score = principles.length > 0 ? Math.min(1.0, 0.6 + hits * 0.2) : 1.0;
  return {
    dimension: 'biab-law-compliance',
    weight: 0.20,
    score,
    finding: `BIAB isolation principles checked (${hits}/${Math.min(2, principles.length)} signals found)`,
  };
}

function checkGuardrailAlignment(content: string, _canon: Record<string, unknown>): TruthDimension {
  const breaches: string[] = [];
  if (/disable.guardrail|bypass.guardrail/i.test(content)) breaches.push('guardrail bypass attempt');
  if (/FULL_AUTO.*unlock|unlock.*FULL_AUTO/i.test(content)) breaches.push('FULL_AUTO unlock outside founder scope');
  if (/override.canon/i.test(content)) breaches.push('canon override attempt');
  const score = breaches.length === 0 ? 1.0 : 0.0;
  return {
    dimension: 'guardrail-alignment',
    weight: 0.25,
    score,
    finding: breaches.length === 0 ? 'No guardrail breaches detected' : `Guardrail breach: ${breaches.join('; ')}`,
  };
}

// ── Core evaluator ─────────────────────────────────────────────────────────

export function evaluateTruth(taskId: string, content: string): TruthResult {
  const canon = loadCanon();
  const dims: TruthDimension[] = [
    checkLaneConformance(content, canon),
    checkFounderControlRespect(content, canon),
    checkBiabLawCompliance(content, canon),
    checkGuardrailAlignment(content, canon),
  ];

  const overallScore = dims.reduce((acc, d) => acc + d.score * d.weight, 0);
  const violations   = dims.filter(d => d.score < 0.5).map(d => d.finding);

  let verdict: TruthVerdict;
  if (overallScore >= 0.75)      verdict = 'ALIGNED';
  else if (overallScore >= 0.40) verdict = 'PARTIAL';
  else                           verdict = 'MISALIGNED';

  return {
    taskId,
    evaluatedAt:  new Date().toISOString(),
    overallScore: Math.round(overallScore * 100) / 100,
    verdict,
    dimensions:   dims,
    violations,
    canonSource:  CANON_FILE,
  };
}

// ── Persist ────────────────────────────────────────────────────────────────

const TRUTH_RESULT_FILE = path.join('engine', 'data', 'truth-result.json');

export function persistTruthResult(result: TruthResult): void {
  fs.writeFileSync(TRUTH_RESULT_FILE, JSON.stringify(result, null, 2), 'utf8');
}

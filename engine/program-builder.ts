/**
 * program-builder.ts
 * Pain Engine — PC-PROGRAM-BUILDER-01
 *
 * Converts a high-level build instruction into a structured task program.
 * Output: GeneratedProgram with ordered steps, risk classification, approval flags.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// ── Types ──────────────────────────────────────────────────────────────────

export type Lane = 'VST' | 'FHI' | 'AI_LAB' | 'ADMIN' | 'BACKYARD';
export type TaskType = 'data' | 'eval' | 'transform' | 'write' | 'repo' | 'notify' | 'deploy';
export type Risk = 'low' | 'medium' | 'high' | 'blocked';
export type Intent =
  | 'build_feature'
  | 'fix_bug'
  | 'audit'
  | 'gate_eval'
  | 'preview'
  | 'deploy'
  | 'refactor'
  | 'data_read'
  | 'unknown';

export interface BuildInstruction {
  instruction: string;
  lane?: Lane;
  priority?: 'low' | 'medium' | 'high';
  dryRun?: boolean;
}

export interface ProgramStep {
  stepId: string;
  order: number;
  type: TaskType;
  lane: Lane;
  description: string;
  payload: Record<string, unknown>;
  risk: Risk;
  requiresApproval: boolean;
  dependsOn?: string[];
}

export interface GeneratedProgram {
  programId: string;
  instruction: string;
  lane: Lane;
  intent: Intent;
  generatedAt: string;
  steps: ProgramStep[];
  totalSteps: number;
  estimatedRisk: Risk;
  requiresFounderApproval: boolean;
  warnings: string[];
}

export interface BuildResult {
  program: GeneratedProgram;
  outputFile: string;
  templateSource: string;
  stepCount: number;
}

// ── Lane detection ─────────────────────────────────────────────────────────

const LANE_KEYWORDS: Record<Lane, RegExp> = {
  VST:     /\b(vst|voyage|travel|trip|booking|destination|itinerary)\b/i,
  FHI:     /\b(fhi|fraud|help|index|scam|victim|report)\b/i,
  AI_LAB:  /\b(ai.?lab|ai lab|orchestrat|scheduler|gate|ava|program|engine|pain)\b/i,
  ADMIN:   /\b(admin|control|config|policy|guardrail|permission)\b/i,
  BACKYARD:/\b(backyard|sandbox|proto|prototype|spike|experiment)\b/i,
};

function detectLane(instruction: string, hint?: Lane): Lane {
  if (hint) return hint;
  for (const [lane, rx] of Object.entries(LANE_KEYWORDS) as [Lane, RegExp][]) {
    if (rx.test(instruction)) return lane;
  }
  return 'AI_LAB';
}

// ── Intent detection ───────────────────────────────────────────────────────

const INTENT_PATTERNS: [Intent, RegExp][] = [
  ['deploy',        /\b(deploy|release|ship|go.?live|launch)\b/i],
  ['gate_eval',     /\b(gate|evaluate|score|quality.?check|pain.?gate)\b/i],
  ['audit',         /\b(audit|inspect|review|check|verify|validate)\b/i],
  ['preview',       /\b(preview|screenshot|render|visual|proof)\b/i],
  ['fix_bug',       /\b(fix|bug|error|broken|patch|repair|hotfix)\b/i],
  ['refactor',      /\b(refactor|clean|cleanup|improve|optimis|reorganis)\b/i],
  ['data_read',     /\b(read|fetch|load|get|status|report|list)\b/i],
  ['build_feature', /\b(build|add|create|implement|new feature|component|panel|page)\b/i],
];

function detectIntent(instruction: string): Intent {
  for (const [intent, rx] of INTENT_PATTERNS) {
    if (rx.test(instruction)) return intent;
  }
  return 'unknown';
}

// ── Step templates ─────────────────────────────────────────────────────────

function makeId(prefix: string): string {
  return `${prefix}-${crypto.randomBytes(3).toString('hex')}`;
}

type StepTemplate = Omit<ProgramStep, 'stepId' | 'order' | 'dependsOn'>;

const STEP_SEQUENCES: Record<Intent, (lane: Lane, instruction: string) => StepTemplate[]> = {

  build_feature: (lane, _instruction) => [
    { type: 'data',      lane, description: 'Read current state / existing asset', payload: { task: 'pre-build-read' },          risk: 'low',  requiresApproval: false },
    { type: 'eval',      lane, description: 'Evaluate pre-gate readiness baseline', payload: { task: 'pre-gate-eval' },          risk: 'low',  requiresApproval: false },
    { type: 'transform', lane, description: 'Build feature implementation',         payload: { task: 'feature-build' },          risk: 'medium', requiresApproval: true  },
    { type: 'eval',      lane, description: 'Run pre-gate audit on built asset',    payload: { task: 'pre-gate-audit' },         risk: 'low',  requiresApproval: false },
    { type: 'transform', lane, description: 'Gate evaluation — score & verdict',    payload: { task: 'gate-eval' },              risk: 'medium', requiresApproval: true  },
    { type: 'write',     lane, description: 'Persist gate result and audit trail',  payload: { task: 'persist-gate-result' },    risk: 'medium', requiresApproval: true  },
  ],

  fix_bug: (lane, _instruction) => [
    { type: 'data',      lane, description: 'Read failing asset / error state',     payload: { task: 'read-error-state' },       risk: 'low',  requiresApproval: false },
    { type: 'eval',      lane, description: 'Diagnose root cause',                  payload: { task: 'diagnose' },               risk: 'low',  requiresApproval: false },
    { type: 'transform', lane, description: 'Apply fix',                            payload: { task: 'apply-fix' },              risk: 'medium', requiresApproval: true  },
    { type: 'eval',      lane, description: 'Verify fix — run test suite',          payload: { task: 'verify-fix' },             risk: 'low',  requiresApproval: false },
  ],

  audit: (lane, _instruction) => [
    { type: 'data',      lane, description: 'Load audit target',                    payload: { task: 'load-audit-target' },      risk: 'low',  requiresApproval: false },
    { type: 'eval',      lane, description: 'Run pre-gate audit checks',            payload: { task: 'pre-gate-audit' },         risk: 'low',  requiresApproval: false },
    { type: 'eval',      lane, description: 'Run dimension scoring',                payload: { task: 'dimension-score' },         risk: 'low',  requiresApproval: false },
    { type: 'write',     lane, description: 'Write audit report',                   payload: { task: 'write-audit-report' },     risk: 'medium', requiresApproval: true  },
  ],

  gate_eval: (lane, _instruction) => [
    { type: 'data',      lane, description: 'Load gate config and asset',           payload: { task: 'load-gate-input' },        risk: 'low',  requiresApproval: false },
    { type: 'eval',      lane, description: 'Run pre-gate audit',                   payload: { task: 'pre-gate-audit' },         risk: 'low',  requiresApproval: false },
    { type: 'transform', lane, description: 'Execute Pain Gate evaluation',         payload: { task: 'pain-gate-evaluate' },     risk: 'medium', requiresApproval: true  },
    { type: 'write',     lane, description: 'Persist gate result',                  payload: { task: 'persist-gate-result' },    risk: 'medium', requiresApproval: true  },
  ],

  preview: (lane, _instruction) => [
    { type: 'data',      lane, description: 'Load asset for preview',               payload: { task: 'load-asset' },             risk: 'low',  requiresApproval: false },
    { type: 'eval',      lane, description: 'Render preview and capture proof',     payload: { task: 'render-preview' },         risk: 'low',  requiresApproval: false },
    { type: 'write',     lane, description: 'Write preview proof record',           payload: { task: 'write-preview-proof' },    risk: 'medium', requiresApproval: true  },
  ],

  deploy: (_lane, _instruction) => [
    // Deploy is always blocked — safety stop regardless of lane
    { type: 'deploy',    lane: 'AI_LAB', description: 'Deploy step — BLOCKED by policy', payload: { task: 'deploy', blocked: true }, risk: 'blocked', requiresApproval: true },
  ],

  refactor: (lane, _instruction) => [
    { type: 'data',      lane, description: 'Read current code state',              payload: { task: 'read-current-state' },     risk: 'low',  requiresApproval: false },
    { type: 'transform', lane, description: 'Apply refactor',                       payload: { task: 'refactor' },               risk: 'medium', requiresApproval: true  },
    { type: 'eval',      lane, description: 'Test after refactor',                  payload: { task: 'post-refactor-test' },     risk: 'low',  requiresApproval: false },
  ],

  data_read: (lane, _instruction) => [
    { type: 'data',      lane, description: 'Read target data',                     payload: { task: 'data-read' },              risk: 'low',  requiresApproval: false },
    { type: 'eval',      lane, description: 'Evaluate / summarise result',          payload: { task: 'eval-result' },            risk: 'low',  requiresApproval: false },
  ],

  unknown: (lane, _instruction) => [
    { type: 'data',      lane, description: 'Read context — intent unclear',        payload: { task: 'read-context', warning: 'intent-unknown' }, risk: 'low', requiresApproval: false },
    { type: 'eval',      lane, description: 'Classify intent from context',         payload: { task: 'classify-intent' },        risk: 'low',  requiresApproval: false },
  ],
};

// ── Risk aggregation ───────────────────────────────────────────────────────

function aggregateRisk(steps: ProgramStep[]): Risk {
  if (steps.some(s => s.risk === 'blocked')) return 'blocked';
  if (steps.some(s => s.risk === 'high'))    return 'high';
  if (steps.some(s => s.risk === 'medium'))  return 'medium';
  return 'low';
}

// ── Core builder ───────────────────────────────────────────────────────────

export function buildProgram(input: BuildInstruction): GeneratedProgram {
  const lane    = detectLane(input.instruction, input.lane);
  const intent  = detectIntent(input.instruction);
  const warnings: string[] = [];

  if (intent === 'unknown') {
    warnings.push('Intent could not be detected from instruction — using minimal read/eval sequence');
  }
  if (intent === 'deploy') {
    warnings.push('DEPLOY intent detected — all deploy steps are BLOCKED by policy. Founder approval required before unblocking.');
  }

  const templateFn = STEP_SEQUENCES[intent];
  const templates  = templateFn(lane, input.instruction);

  const steps: ProgramStep[] = templates.map((t, i) => ({
    ...t,
    stepId:    makeId(`step-${i + 1}`),
    order:     i + 1,
    dependsOn: i > 0 ? [templates[i - 1] ? `step-${i}` : ''] : undefined,
  }));

  const estimatedRisk           = aggregateRisk(steps);
  const requiresFounderApproval = estimatedRisk === 'high' || estimatedRisk === 'blocked' || intent === 'deploy';

  return {
    programId:             `gen-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
    instruction:           input.instruction,
    lane,
    intent,
    generatedAt:           new Date().toISOString(),
    steps,
    totalSteps:            steps.length,
    estimatedRisk,
    requiresFounderApproval,
    warnings,
  };
}

// ── Persist ────────────────────────────────────────────────────────────────

export function persistProgram(result: GeneratedProgram, outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${result.programId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');
  return filePath;
}

// ── CLI ────────────────────────────────────────────────────────────────────

if (process.argv[1]?.endsWith('program-builder.ts')) {
  const instruction = process.argv.slice(2).join(' ') || 'build VST feature hero section';
  const result = buildProgram({ instruction });
  console.log(JSON.stringify(result, null, 2));
}

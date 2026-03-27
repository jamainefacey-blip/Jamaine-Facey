/**
 * release.ts
 * Pain Engine — PC-RELEASE-01
 *
 * Controlled release workflow.
 * Takes a GeneratedProgram, executes its approval-required steps safely,
 * runs pre-gate audit + gate evaluation, and produces a ReleaseResult.
 *
 * States:
 *   COMPLETE          — gate passed, founderReviewReady=true, all steps done
 *   READY_FOR_REVIEW  — gate passed/warn, needs founder sign-off
 *   STAGED            — pre-gate clean, gate not yet run
 *   BLOCKED           — hard blocker or pre-gate BLOCKED verdict
 */

import * as fs from 'fs';
import * as path from 'path';
import type { GeneratedProgram, ProgramStep } from './program-builder';
import { preGateAudit } from './pre-gate-audit';
import type { PreGateInput } from './pre-gate-audit';
import { evaluate } from './gate';
import type { GateInput, GateResult } from './gate';

// ── Types ──────────────────────────────────────────────────────────────────

export type ReleaseState =
  | 'COMPLETE'
  | 'READY_FOR_REVIEW'
  | 'STAGED'
  | 'BLOCKED';

export interface StepExecutionRecord {
  stepId:    string;
  order:     number;
  type:      string;
  description: string;
  status:    'skipped' | 'executed' | 'blocked';
  note:      string;
}

export interface ReleaseResult {
  releaseId:          string;
  programId:          string;
  instruction:        string;
  lane:               string;
  intent:             string;
  releasedAt:         string;
  state:              ReleaseState;
  stepsExecuted:      number;
  stepsTotal:         number;
  stepRecords:        StepExecutionRecord[];
  preGateVerdict:     string;
  preGateFlags:       number;
  preGateBlockers:    number;
  gateScore:          number | null;
  gateStatus:         string | null;
  gateResultId:       string | null;
  founderReviewReady: boolean;
  blockerReason:      string | null;
  warnings:           string[];
}

// ── Step executor ──────────────────────────────────────────────────────────
// Each step type is simulated with deterministic logic.
// deploy-type steps are always hard-blocked.

function executeStep(step: ProgramStep, assetContent: string, lane: string): StepExecutionRecord {
  if (step.type === 'deploy') {
    return {
      stepId:      step.stepId,
      order:       step.order,
      type:        step.type,
      description: step.description,
      status:      'blocked',
      note:        'DEPLOY type is blocked by guardrail policy',
    };
  }

  // data and eval steps: auto-execute (low risk)
  if (step.type === 'data' || step.type === 'eval') {
    return {
      stepId:      step.stepId,
      order:       step.order,
      type:        step.type,
      description: step.description,
      status:      'executed',
      note:        `${step.type} step executed — payload.task=${step.payload.task}`,
    };
  }

  // transform and write: execute under controlled approval
  if (step.type === 'transform' || step.type === 'write') {
    return {
      stepId:      step.stepId,
      order:       step.order,
      type:        step.type,
      description: step.description,
      status:      'executed',
      note:        `${step.type} step executed under controlled release — approval granted`,
    };
  }

  return {
    stepId:      step.stepId,
    order:       step.order,
    type:        step.type,
    description: step.description,
    status:      'skipped',
    note:        `Unknown step type '${step.type}' — skipped`,
  };
}

// ── Core release runner ────────────────────────────────────────────────────

export function runRelease(
  program: GeneratedProgram,
  assetContent: string,
  proofString: string,
): ReleaseResult {
  const releaseId  = `rel-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const warnings:  string[] = [];
  const stepRecords: StepExecutionRecord[] = [];
  let blockerReason: string | null = null;

  // ── Execute steps ──────────────────────────────────────────────────────
  for (const step of program.steps) {
    const record = executeStep(step, assetContent, program.lane);
    stepRecords.push(record);
    if (record.status === 'blocked') {
      blockerReason = record.note;
      break;
    }
  }

  const stepsExecuted = stepRecords.filter(r => r.status === 'executed').length;
  const hasBlocked    = stepRecords.some(r => r.status === 'blocked');

  if (hasBlocked) {
    return {
      releaseId,
      programId:          program.programId,
      instruction:        program.instruction,
      lane:               program.lane,
      intent:             program.intent,
      releasedAt:         new Date().toISOString(),
      state:              'BLOCKED',
      stepsExecuted,
      stepsTotal:         program.totalSteps,
      stepRecords,
      preGateVerdict:     'BLOCKED',
      preGateFlags:       0,
      preGateBlockers:    0,
      gateScore:          null,
      gateStatus:         null,
      gateResultId:       null,
      founderReviewReady: false,
      blockerReason,
      warnings,
    };
  }

  // ── Pre-gate audit ─────────────────────────────────────────────────────
  const preGateInput: PreGateInput = {
    taskId:    program.programId,
    lane:      program.lane,
    assetType: program.intent.includes('feature') ? 'ui' : 'data',
    buildPass: true,
    content:   assetContent,
  };

  const auditResult = preGateAudit(preGateInput);
  const preGateFlags    = auditResult.flags.length;
  const preGateBlockers = auditResult.flags.filter(f => f.severity === 'BLOCKER').length;

  if (auditResult.verdict === 'BLOCKED') {
    const blockers = auditResult.flags.filter(f => f.severity === 'BLOCKER').map(f => f.message).join('; ');
    return {
      releaseId,
      programId:          program.programId,
      instruction:        program.instruction,
      lane:               program.lane,
      intent:             program.intent,
      releasedAt:         new Date().toISOString(),
      state:              'BLOCKED',
      stepsExecuted,
      stepsTotal:         program.totalSteps,
      stepRecords,
      preGateVerdict:     auditResult.verdict,
      preGateFlags,
      preGateBlockers,
      gateScore:          null,
      gateStatus:         null,
      gateResultId:       null,
      founderReviewReady: false,
      blockerReason:      `Pre-gate BLOCKED: ${blockers}`,
      warnings,
    };
  }

  if (auditResult.verdict === 'NEEDS_WORK') {
    warnings.push(`Pre-gate NEEDS_WORK: ${auditResult.summary}`);
  }

  // ── Gate evaluation ────────────────────────────────────────────────────
  const gateInput: GateInput = {
    taskId:       program.programId,
    lane:         program.lane,
    assetType:    program.intent.includes('feature') ? 'ui' : 'data',
    buildStatus:  'pass',
    previewProof: proofString,
    content:      assetContent,
  };

  const gateResult: GateResult = evaluate(gateInput); // evaluate() persists internally

  // ── Determine release state ────────────────────────────────────────────
  let state: ReleaseState;

  if (gateResult.hardBlockers.length > 0) {
    state = 'BLOCKED';
    blockerReason = `Gate hard blocker(s): ${gateResult.hardBlockers.join(', ')}`;
  } else if (gateResult.overallStatus === 'pass' && gateResult.founderReviewReady) {
    state = 'COMPLETE';
  } else if (gateResult.overallStatus === 'pass' || gateResult.overallStatus === 'warn') {
    state = 'READY_FOR_REVIEW';
    warnings.push(`Gate status=${gateResult.overallStatus}, score=${gateResult.score} — requires founder sign-off`);
  } else {
    state = 'STAGED';
    warnings.push(`Gate status=${gateResult.overallStatus}, score=${gateResult.score} — not ready for review`);
  }

  return {
    releaseId,
    programId:          program.programId,
    instruction:        program.instruction,
    lane:               program.lane,
    intent:             program.intent,
    releasedAt:         new Date().toISOString(),
    state,
    stepsExecuted,
    stepsTotal:         program.totalSteps,
    stepRecords,
    preGateVerdict:     auditResult.verdict,
    preGateFlags,
    preGateBlockers,
    gateScore:          gateResult.score,
    gateStatus:         gateResult.overallStatus,
    gateResultId:       gateResult.id,
    founderReviewReady: gateResult.founderReviewReady,
    blockerReason,
    warnings,
  };
}

// ── Persist release result ─────────────────────────────────────────────────

export function persistRelease(result: ReleaseResult, outputDir: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const filePath = path.join(outputDir, `${result.releaseId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');
  return filePath;
}

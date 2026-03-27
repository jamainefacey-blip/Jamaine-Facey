/**
 * execution-orchestrator.ts
 * Run loop: PLAN → BUILD → PREVIEW → TEST → FIX → RETEST → GATE
 * Hard stops on policy breach, blocked task class, retry cap.
 * Full audit trail preserved.
 */

import * as fs from 'fs';
import * as path from 'path';
import { GeneratedProgram }                    from './program-builder';
import { buildExecutionPlan, persistExecutionPlan, ExecutionPlan } from './execution-planner';
import { buildRepoContext, persistRepoContext } from './repo-context';
import { runBuild, persistBuildResult, Patch, BuildResult }  from './builder';
import { generatePreview, persistPreviewResult, assertPreviewProof } from './preview-engine';
import { runTests, persistTestResult, TestResult }           from './test-engine';
import { runFixEngine, persistFixResult }       from './fix-engine';
import { runVisualQA, persistVisualResult }     from './visual-qa';
import { takeSnapshot, rollback, persistRollbackResult } from './rollback';
import { inspect }                             from './defence';

// ── Types ──────────────────────────────────────────────────────────────────

export type OrchestratorStage =
  | 'PLAN' | 'BUILD' | 'PREVIEW' | 'TEST' | 'FIX' | 'RETEST' | 'GATE' | 'DONE';

export type OrchestratorStatus =
  | 'COMPLETE' | 'BLOCKED' | 'FAIL' | 'POLICY_BREACH' | 'RETRY_CAP';

export interface StageRecord {
  stage:       OrchestratorStage;
  status:      'pass' | 'fail' | 'skip' | 'blocked';
  detail:      string;
  timestamp:   string;
}

export interface ExecutionResult {
  execId:         string;
  planId:         string;
  programId:      string;
  status:         OrchestratorStatus;
  currentStage:   OrchestratorStage;
  retryCount:     number;
  maxRetries:     number;
  stages:         StageRecord[];
  auditTrail:     string[];
  completedAt:    string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const EXEC_FILE   = path.join('engine', 'data', 'execution-result.json');
const MAX_RETRIES = 2;

// ── Helpers ────────────────────────────────────────────────────────────────

function audit(trail: string[], msg: string): void {
  const entry = `[${new Date().toISOString()}] ${msg}`;
  trail.push(entry);
}

function stageRecord(stage: OrchestratorStage, status: StageRecord['status'], detail: string): StageRecord {
  return { stage, status, detail, timestamp: new Date().toISOString() };
}

function hardStop(
  execId: string, planId: string, programId: string,
  status: OrchestratorStatus, stage: OrchestratorStage,
  retryCount: number, stages: StageRecord[], trail: string[], reason: string,
): ExecutionResult {
  audit(trail, `HARD STOP: ${status} at ${stage} — ${reason}`);
  return {
    execId, planId, programId, status,
    currentStage: stage,
    retryCount, maxRetries: MAX_RETRIES,
    stages, auditTrail: trail,
    completedAt: new Date().toISOString(),
  };
}

// ── Orchestrator ───────────────────────────────────────────────────────────

export async function runExecution(
  program: GeneratedProgram,
  patches: Patch[] = [],
): Promise<ExecutionResult> {
  const execId   = `exec-${Date.now()}`;
  const trail:    string[] = [];
  const stages:   StageRecord[] = [];
  let   retryCount = 0;

  audit(trail, `Execution started: programId=${program.programId} lane=${program.lane}`);

  // ── DEFENCE CHECK ──────────────────────────────────────────────────────
  const defenceCheck = inspect(JSON.stringify(program), 'internal');
  if (defenceCheck.verdict === 'BLOCKED') {
    stages.push(stageRecord('PLAN', 'blocked', `Defence: ${defenceCheck.reason}`));
    return hardStop(execId, 'unknown', program.programId ?? 'unknown', 'POLICY_BREACH', 'PLAN', 0, stages, trail, defenceCheck.reason);
  }

  // ── STAGE: PLAN ────────────────────────────────────────────────────────
  audit(trail, 'Stage: PLAN');
  let plan: ExecutionPlan;
  try {
    plan = buildExecutionPlan(program);
    persistExecutionPlan(plan);
    stages.push(stageRecord('PLAN', 'pass', `planId=${plan.planId} steps=${plan.steps.length} risk=${plan.estimatedRisk}`));
    audit(trail, `Plan built: ${plan.planId} (${plan.steps.length} steps, risk=${plan.estimatedRisk})`);
  } catch (err: unknown) {
    stages.push(stageRecord('PLAN', 'fail', String(err)));
    return hardStop(execId, 'unknown', program.programId ?? 'unknown', 'FAIL', 'PLAN', 0, stages, trail, String(err));
  }

  // Policy: high-risk requires reduced scope
  if (plan.estimatedRisk === 'high' && plan.steps.some(s => s.protected)) {
    stages.push(stageRecord('PLAN', 'blocked', 'High-risk plan with protected steps — founder review required'));
    return hardStop(execId, plan.planId, program.programId ?? 'unknown', 'POLICY_BREACH', 'PLAN', 0, stages, trail, 'High-risk protected steps require founder approval');
  }

  // ── STAGE: BUILD (with rollback snapshot) ─────────────────────────────
  audit(trail, 'Stage: BUILD — taking snapshot');
  const snapshot = takeSnapshot(plan);
  audit(trail, `Snapshot taken: ${snapshot.snapshotId} (${snapshot.files.length} files)`);

  const ctx = buildRepoContext('.');
  persistRepoContext(ctx);
  audit(trail, `Repo context built: ${ctx.stats.totalFiles} files indexed`);

  let buildResult: BuildResult;
  try {
    buildResult = runBuild(plan, ctx, patches);
    persistBuildResult(buildResult);
    stages.push(stageRecord('BUILD', buildResult.status === 'SUCCESS' || buildResult.status === 'SKIPPED' ? 'pass' : 'fail',
      `buildId=${buildResult.buildId} status=${buildResult.status} patches=${buildResult.patchesApplied} changed=${buildResult.filesChanged.length}`));
    audit(trail, `Build: status=${buildResult.status} files=${buildResult.filesChanged.join(',') || 'none'}`);
  } catch (err: unknown) {
    const rb = rollback(snapshot);
    persistRollbackResult(rb);
    stages.push(stageRecord('BUILD', 'fail', String(err)));
    return hardStop(execId, plan.planId, program.programId ?? 'unknown', 'FAIL', 'BUILD', 0, stages, trail, String(err));
  }

  // ── STAGE: PREVIEW ────────────────────────────────────────────────────
  audit(trail, 'Stage: PREVIEW');
  const previewResult = generatePreview(plan);
  persistPreviewResult(previewResult);
  stages.push(stageRecord('PREVIEW',
    previewResult.status === 'READY' ? 'pass' : previewResult.status === 'PARTIAL' ? 'pass' : 'fail',
    `previewId=${previewResult.previewId} status=${previewResult.status}`));
  audit(trail, `Preview: ${previewResult.status} url=${previewResult.previewUrl}`);

  if (previewResult.status === 'MISSING' || previewResult.status === 'FAILED') {
    const rb = rollback(snapshot);
    persistRollbackResult(rb);
    stages.push(stageRecord('GATE', 'blocked', 'No preview proof — gate blocked'));
    return hardStop(execId, plan.planId, program.programId ?? 'unknown', 'BLOCKED', 'PREVIEW', 0, stages, trail, 'Preview proof missing');
  }

  // ── VISUAL QA ─────────────────────────────────────────────────────────
  audit(trail, 'Stage: VISUAL QA');
  const visualResult = runVisualQA(plan, previewResult);
  persistVisualResult(visualResult);
  stages.push(stageRecord('PREVIEW', visualResult.passed ? 'pass' : 'blocked',
    `vqaId=${visualResult.qaId} score=${visualResult.overallScore}/${visualResult.threshold}`));
  audit(trail, `Visual QA: score=${visualResult.overallScore} passed=${visualResult.passed}`);

  if (!visualResult.passed) {
    stages.push(stageRecord('GATE', 'blocked', `Visual score ${visualResult.overallScore} below threshold ${visualResult.threshold}`));
    return hardStop(execId, plan.planId, program.programId ?? 'unknown', 'BLOCKED', 'GATE', 0, stages, trail, `Visual QA failed: ${visualResult.blockers.join('; ')}`);
  }

  // ── STAGE: TEST ───────────────────────────────────────────────────────
  audit(trail, 'Stage: TEST');
  const scopedFiles = buildResult.filesChanged;
  let testResult: TestResult = runTests(plan.planId, buildResult, scopedFiles, previewResult.allProofsCaptured);
  persistTestResult(testResult);
  stages.push(stageRecord('TEST', testResult.overallPass ? 'pass' : 'fail',
    `testId=${testResult.testId} pass=${testResult.overallPass} blocked=${testResult.blockedClasses.join(',') || 'none'}`));
  audit(trail, `Test: pass=${testResult.overallPass} blocked=[${testResult.blockedClasses.join(',')}]`);

  // ── STAGE: FIX → RETEST (up to MAX_RETRIES) ──────────────────────────
  while (!testResult.overallPass && retryCount < MAX_RETRIES) {
    retryCount++;
    audit(trail, `Stage: FIX (attempt ${retryCount}/${MAX_RETRIES})`);

    const fixResult = runFixEngine(testResult, plan, ctx, buildResult);
    persistFixResult(fixResult);
    stages.push(stageRecord('FIX', fixResult.resolved ? 'pass' : 'fail',
      `fixId=${fixResult.fixId} outcome=${fixResult.outcome} attempts=${fixResult.attempts.length}`));
    audit(trail, `Fix: outcome=${fixResult.outcome} resolved=${fixResult.resolved}`);

    if (fixResult.outcome === 'EXHAUSTED' || fixResult.outcome === 'BLOCKED') {
      const rb = rollback(snapshot);
      persistRollbackResult(rb);
      stages.push(stageRecord('GATE', 'blocked', `Fix exhausted after ${retryCount} attempts`));
      return hardStop(execId, plan.planId, program.programId ?? 'unknown', 'RETRY_CAP', 'FIX', retryCount, stages, trail, `Fix cycles exhausted: ${fixResult.blockedBy.join('; ')}`);
    }

    // RETEST
    audit(trail, `Stage: RETEST (attempt ${retryCount})`);
    testResult = runTests(plan.planId, buildResult, scopedFiles, previewResult.allProofsCaptured);
    persistTestResult(testResult);
    stages.push(stageRecord('RETEST', testResult.overallPass ? 'pass' : 'fail',
      `pass=${testResult.overallPass} blocked=${testResult.blockedClasses.join(',') || 'none'}`));
    audit(trail, `Retest: pass=${testResult.overallPass}`);
  }

  if (!testResult.overallPass) {
    const rb = rollback(snapshot);
    persistRollbackResult(rb);
    stages.push(stageRecord('GATE', 'blocked', `Tests still failing after ${retryCount} fix cycles`));
    return hardStop(execId, plan.planId, program.programId ?? 'unknown', 'RETRY_CAP', 'RETEST', retryCount, stages, trail, `Tests failed after ${retryCount} fix cycles`);
  }

  // ── STAGE: GATE ───────────────────────────────────────────────────────
  audit(trail, 'Stage: GATE');
  // Gate requires: preview proof + tests pass + visual pass
  // No direct production deploy — gate outputs READY_FOR_REVIEW
  stages.push(stageRecord('GATE', 'pass', 'All stages passed — output: READY_FOR_REVIEW (no auto-deploy)'));
  audit(trail, 'Gate: PASSED — status=READY_FOR_REVIEW');

  stages.push(stageRecord('DONE', 'pass', 'Execution complete'));

  const result: ExecutionResult = {
    execId,
    planId:       plan.planId,
    programId:    program.programId ?? 'unknown',
    status:       'COMPLETE',
    currentStage: 'DONE',
    retryCount,
    maxRetries:   MAX_RETRIES,
    stages,
    auditTrail:   trail,
    completedAt:  new Date().toISOString(),
  };

  return result;
}

export function persistExecutionResult(result: ExecutionResult): string {
  fs.writeFileSync(EXEC_FILE, JSON.stringify(result, null, 2), 'utf8');
  return EXEC_FILE;
}

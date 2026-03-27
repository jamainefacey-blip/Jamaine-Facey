// engine/scheduler-test.ts — automated validation of scheduler + guardrail loop
//
// Test cases (PC-GUARD-01):
//  G1. eval task            → risk=low,    decision=allowed,           runs, status=done
//  G2. data task            → risk=low,    decision=allowed,           runs, status=done
//  G3. repo task            → risk=medium, decision=approval_required, does not run
//  G4. deploy task          → risk=high,   decision=blocked,           does not run
//  G5. unknown type         → risk=high,   decision=blocked,           does not run
//
// Regression (PC-SCHED-01):
//  R1. 3 tasks processed one-per-cycle
//  R2. Failure retries 3× then FAILED
//  R3. Stop halts processing
//  R4. No overlapping runs

import {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  addTask,
  listTasks,
  resetScheduler,
} from './scheduler';
import { decide, classifyRisk, GUARDRAIL_POLICY } from './guardrail';
import { log } from './logger';
import type { SchedulerTask } from './types';

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function assert(cond: boolean, msg: string): void {
  if (!cond) { log('ERROR', `ASSERT FAIL: ${msg}`); process.exit(1); }
  log('INFO', `  ✓ ${msg}`);
}

async function waitFor(
  pred: () => boolean,
  label: string,
  timeoutMs = 4000,
  tickMs = 80,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pred()) return;
    await sleep(tickMs);
  }
  log('ERROR', `TIMEOUT: ${label}`);
  process.exit(1);
}

const INTERVAL = 250; // ms — short for test speed

async function runTests(): Promise<void> {
  log('INFO', '══════════════════════════════════════════════════');
  log('INFO', 'GUARDRAIL TEST SUITE — PC-GUARD-01 + PC-SCHED-01');
  log('INFO', '══════════════════════════════════════════════════');

  // ── Guardrail unit tests (no scheduler needed) ───────────────────────────
  log('INFO', '\n[UNIT] Guardrail classify + decide');

  const mkTask = (type: string): SchedulerTask => ({
    id: `u-${type}`, type: type as SchedulerTask['type'], payload: {},
    status: 'queued', attempts: 0,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  });

  assert(classifyRisk(mkTask('eval'))    === 'low',    'eval → risk=low');
  assert(classifyRisk(mkTask('data'))    === 'low',    'data → risk=low');
  assert(classifyRisk(mkTask('write'))   === 'medium', 'write → risk=medium');
  assert(classifyRisk(mkTask('repo'))    === 'medium', 'repo → risk=medium');
  assert(classifyRisk(mkTask('deploy'))  === 'high',   'deploy → risk=high');
  assert(classifyRisk(mkTask('notify'))  === 'high',   'notify → risk=high');
  assert(classifyRisk(mkTask('unknown')) === 'high',   'unknown → risk=high (fallback)');

  assert(decide(mkTask('eval')).decision    === 'allowed',           'eval → allowed');
  assert(decide(mkTask('data')).decision    === 'allowed',           'data → allowed');
  assert(decide(mkTask('write')).decision   === 'approval_required', 'write → approval_required');
  assert(decide(mkTask('repo')).decision    === 'approval_required', 'repo → approval_required');
  assert(decide(mkTask('deploy')).decision  === 'blocked',           'deploy → blocked');
  assert(decide(mkTask('notify')).decision  === 'blocked',           'notify → blocked');
  assert(decide(mkTask('unknown')).decision === 'blocked',           'unknown → blocked (safety rule)');

  // Overnight mode escalates medium → approval_required (already true — confirm)
  const overnight = { ...GUARDRAIL_POLICY, overnightMode: true };
  assert(decide(mkTask('write'), overnight).decision === 'approval_required', 'write+overnight → approval_required');
  // Without overnight mode, 'write' is still approval_required (it's in approvalTypes)
  const noOvernight = { ...GUARDRAIL_POLICY, overnightMode: false };
  assert(decide(mkTask('write'), noOvernight).decision === 'approval_required', 'write+no-overnight → approval_required (in approvalTypes)');
  // eval without overnight still allowed
  assert(decide(mkTask('eval'), noOvernight).decision === 'allowed', 'eval+no-overnight → allowed');

  // ── G1: eval task → allowed, runs, done ──────────────────────────────────
  log('INFO', '\n[G1] eval task → allowed, runs, status=done');
  resetScheduler();
  addTask('eval', { expression: '7 * 6' }, 'g1-eval');
  startScheduler(INTERVAL);

  await waitFor(() => {
    const t = listTasks().find(t => t.id === 'g1-eval');
    return t?.status === 'done';
  }, 'g1-eval done');

  const g1 = listTasks().find(t => t.id === 'g1-eval')!;
  assert(g1.risk === 'low',      `G1: risk=low (got ${g1.risk})`);
  assert(g1.decision === 'allowed', `G1: decision=allowed (got ${g1.decision})`);
  assert(g1.status === 'done',   `G1: status=done (got ${g1.status})`);
  assert(g1.result === 42,       `G1: result=42 (got ${String(g1.result)})`);
  stopScheduler();

  // ── G2: data task → allowed, runs, done ──────────────────────────────────
  log('INFO', '\n[G2] data task → allowed, runs, status=done');
  resetScheduler();
  addTask('data', { file: 'status.json' }, 'g2-data');
  startScheduler(INTERVAL);

  await waitFor(() => listTasks().find(t => t.id === 'g2-data')?.status === 'done', 'g2-data done');

  const g2 = listTasks().find(t => t.id === 'g2-data')!;
  assert(g2.risk === 'low',      `G2: risk=low (got ${g2.risk})`);
  assert(g2.decision === 'allowed', `G2: decision=allowed (got ${g2.decision})`);
  assert(g2.status === 'done',   `G2: status=done`);
  stopScheduler();

  // ── G3: repo task → approval_required, does NOT run ──────────────────────
  log('INFO', '\n[G3] repo task → approval_required, not executed');
  resetScheduler();
  addTask('repo', { branch: 'main' }, 'g3-repo');
  startScheduler(INTERVAL);

  // Wait 3 cycles — task must NOT become done/running
  await sleep(INTERVAL * 3 + 200);

  const g3 = listTasks().find(t => t.id === 'g3-repo')!;
  assert(g3.risk === 'medium',               `G3: risk=medium (got ${g3.risk})`);
  assert(g3.decision === 'approval_required',`G3: decision=approval_required (got ${g3.decision})`);
  assert(g3.status === 'awaiting_approval',  `G3: status=awaiting_approval (got ${g3.status})`);
  assert(g3.attempts === 0,                  `G3: attempts=0 (task never executed, got ${g3.attempts})`);
  stopScheduler();

  // ── G4: deploy task → blocked, does NOT run ──────────────────────────────
  log('INFO', '\n[G4] deploy task → blocked immediately');
  resetScheduler();
  addTask('deploy', { branch: 'main' }, 'g4-deploy');
  startScheduler(INTERVAL);

  await waitFor(() => listTasks().find(t => t.id === 'g4-deploy')?.status === 'failed', 'g4-deploy failed');

  const g4 = listTasks().find(t => t.id === 'g4-deploy')!;
  assert(g4.risk === 'high',      `G4: risk=high (got ${g4.risk})`);
  assert(g4.decision === 'blocked', `G4: decision=blocked (got ${g4.decision})`);
  assert(g4.status === 'failed',  `G4: status=failed (got ${g4.status})`);
  assert(g4.attempts === 0,       `G4: attempts=0 (not executed, got ${g4.attempts})`);
  assert(!!g4.blockReason,        'G4: blockReason populated');
  stopScheduler();

  // ── G5: unknown type → blocked, does NOT run ─────────────────────────────
  log('INFO', '\n[G5] unknown type → blocked immediately');
  resetScheduler();
  addTask('mystery_action' as SchedulerTask['type'], {}, 'g5-unknown');
  startScheduler(INTERVAL);

  await waitFor(() => listTasks().find(t => t.id === 'g5-unknown')?.status === 'failed', 'g5-unknown failed');

  const g5 = listTasks().find(t => t.id === 'g5-unknown')!;
  assert(g5.risk === 'high',       `G5: risk=high (got ${g5.risk})`);
  assert(g5.decision === 'blocked', `G5: decision=blocked (got ${g5.decision})`);
  assert(g5.status === 'failed',   `G5: status=failed`);
  assert(g5.attempts === 0,        `G5: attempts=0 (not executed)`);
  assert(g5.blockReason?.includes('Unknown type') ?? false, 'G5: blockReason mentions Unknown type');
  stopScheduler();

  // ── R1: 3 tasks, one per cycle (regression) ───────────────────────────────
  log('INFO', '\n[R1] 3 safe tasks processed one-per-interval (regression)');
  resetScheduler();
  addTask('eval', { expression: '1+1' }, 'r1-a');
  addTask('eval', { expression: '2+2' }, 'r1-b');
  addTask('eval', { expression: '3+3' }, 'r1-c');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().filter(t => t.status === 'done').length === 3, 'all 3 done');
  assert(listTasks().every(t => t.status === 'done'), 'R1: all 3 done');
  assert(getSchedulerStatus().totalRuns >= 3, 'R1: totalRuns >= 3');
  stopScheduler();

  // ── R2: retry 3× then FAILED (regression) ────────────────────────────────
  log('INFO', '\n[R2] Failure retries 3× → FAILED (regression)');
  resetScheduler();
  addTask('eval', { expression: 'require("os").platform()' }, 'r2-fail');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().find(t => t.id === 'r2-fail')?.status === 'failed', 'r2-fail failed', 5000);
  const r2 = listTasks().find(t => t.id === 'r2-fail')!;
  assert(r2.status === 'failed',  'R2: status=failed');
  assert(r2.attempts === 3,       `R2: attempts=3 (got ${r2.attempts})`);
  stopScheduler();

  // ── R3: stop halts (regression) ───────────────────────────────────────────
  log('INFO', '\n[R3] Stop halts scheduler (regression)');
  resetScheduler();
  startScheduler(INTERVAL);
  assert(getSchedulerStatus().isTimerActive, 'R3: running before stop');
  stopScheduler();
  assert(!getSchedulerStatus().isTimerActive, 'R3: stopped');
  assert(getSchedulerStatus().status === 'idle', 'R3: status=idle');

  // ── R4: no overlap (regression) ───────────────────────────────────────────
  log('INFO', '\n[R4] No overlap — task processed exactly once');
  resetScheduler();
  addTask('eval', { expression: '5*5' }, 'r4-single');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().find(t => t.id === 'r4-single')?.status === 'done', 'r4-single done');
  stopScheduler();
  assert(listTasks().find(t => t.id === 'r4-single')?.attempts === 1, 'R4: attempts=1 (no overlap)');

  log('INFO', '\n══════════════════════════════════════════════════');
  log('INFO', 'ALL TESTS PASSED — PC-GUARD-01 + PC-SCHED-01');
  log('INFO', '══════════════════════════════════════════════════');
  resetScheduler();
}

runTests().catch(err => { console.error('[scheduler-test] fatal:', err); process.exit(1); });

// engine/scheduler-test.ts — full test suite
// PC-POLICY-01 + PC-APPROVAL-01 + PC-GUARD-01 + PC-SCHED-01 + PC-GATE-01

import {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  addTask,
  listTasks,
  resetScheduler,
  approveTask,
  setOvernightMode,
  getGuardrailPolicy,
} from './scheduler';
import {
  decide,
  classifyRisk,
  GUARDRAIL_POLICY,
  updateGuardrailPolicy,
  resetGuardrailPolicy,
  loadLivePolicy,
} from './guardrail';
import { evaluate } from './gate';
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

const INTERVAL = 250;

async function runTests(): Promise<void> {
  log('INFO', '══════════════════════════════════════════════════════');
  log('INFO', 'TEST SUITE — PC-POLICY-01 + PC-APPROVAL-01 + PC-GUARD-01 + PC-SCHED-01');
  log('INFO', '══════════════════════════════════════════════════════');

  // ── Guardrail unit tests ──────────────────────────────────────────────────
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

  // ── pc-routing-01: lane field tests ──────────────────────────────────────
  log('INFO', '\n[LANE] Lane field — addTask, default, RunLog stamping');
  resetScheduler();

  const laneTask = addTask('eval' as SchedulerTask['type'], { expression: '1' }, 'lane-explicit', 'AI_LAB');
  assert(laneTask.lane === 'AI_LAB',  'LANE: explicit lane=AI_LAB stamped on task');

  const defaultTask = addTask('eval' as SchedulerTask['type'], { expression: '2' }, 'lane-default');
  assert(defaultTask.lane === 'BACKYARD', 'LANE: omitted lane defaults to BACKYARD');

  // Run both — verify lane survives execution and is stamped on RunLog
  startScheduler(INTERVAL);
  await waitFor(
    () => listTasks().filter(t => ['lane-explicit','lane-default'].includes(t.id) && t.status === 'done').length === 2,
    'lane tasks done',
  );
  stopScheduler();

  const laneAfter = listTasks().find(t => t.id === 'lane-explicit')!;
  const defAfter  = listTasks().find(t => t.id === 'lane-default')!;
  assert(laneAfter.lane === 'AI_LAB',   'LANE: AI_LAB preserved after execution');
  assert(defAfter.lane  === 'BACKYARD', 'LANE: BACKYARD preserved after execution');

  // getSchedulerStatus should have correct byLane counts once tasks are loaded
  // (status counts are derived from tasks at call time — just verify field exists)
  resetScheduler();

  // ── PC-POLICY-01 tests ────────────────────────────────────────────────────

  // P1: promote repo from approvalTypes → allowedTypes → decision changes
  log('INFO', '\n[P1] repo: approvalTypes → promote → allowedTypes (decision=allowed)');
  resetGuardrailPolicy();
  const p1base = loadLivePolicy();
  assert(p1base.approvalTypes.includes('repo' as SchedulerTask['type']), 'P1: repo starts in approvalTypes');
  assert(!p1base.allowedTypes.includes('repo' as SchedulerTask['type']), 'P1: repo not in allowedTypes initially');

  // Verify baseline: repo → approval_required
  assert(decide(mkTask('repo'), p1base).decision === 'approval_required', 'P1: repo → approval_required at baseline');

  const p1result = updateGuardrailPolicy({ promoteToAllowed: ['repo'] });
  assert(p1result.ok,                    'P1: promote ok=true');
  assert(p1result.errors.length === 0,   'P1: no errors on valid promote');

  const p1live = loadLivePolicy();
  assert(p1live.allowedTypes.includes('repo' as SchedulerTask['type']),  'P1: repo now in allowedTypes (persisted)');
  assert(!p1live.approvalTypes.includes('repo' as SchedulerTask['type']), 'P1: repo removed from approvalTypes');

  // With overnight=off: repo decision now=allowed
  const p1dec = decide(mkTask('repo'), { ...p1live, overnightMode: false });
  assert(p1dec.decision === 'allowed', 'P1: repo → allowed after promote (overnight=off)');

  // P2: transform promoted → allowed (overnight=off)
  log('INFO', '\n[P2] transform: approvalTypes → promote → allowedTypes');
  resetGuardrailPolicy();
  const p2result = updateGuardrailPolicy({ promoteToAllowed: ['transform'] });
  assert(p2result.ok, 'P2: transform promote ok');
  const p2live = loadLivePolicy();
  assert(p2live.allowedTypes.includes('transform' as SchedulerTask['type']), 'P2: transform in allowedTypes');
  const p2dec = decide(mkTask('transform'), { ...p2live, overnightMode: false });
  assert(p2dec.decision === 'allowed', 'P2: transform → allowed after promote (overnight=off)');

  // P3: deploy → promote rejected (immutable blocked)
  log('INFO', '\n[P3] deploy: promote attempt rejected (immutable blocked)');
  resetGuardrailPolicy();
  const p3result = updateGuardrailPolicy({ promoteToAllowed: ['deploy'] });
  assert(!p3result.ok,                   'P3: deploy promote ok=false');
  assert(p3result.errors.length > 0,     'P3: errors list non-empty');
  assert(p3result.errors[0].includes('immutable'), 'P3: error mentions immutable');
  const p3live = loadLivePolicy();
  assert(p3live.blockedTypes.includes('deploy' as SchedulerTask['type']), 'P3: deploy remains in blockedTypes');
  assert(decide(mkTask('deploy'), p3live).decision === 'blocked', 'P3: deploy still → blocked');

  // P4: notify → promote rejected (immutable blocked)
  log('INFO', '\n[P4] notify: promote attempt rejected (immutable blocked)');
  resetGuardrailPolicy();
  const p4result = updateGuardrailPolicy({ promoteToAllowed: ['notify'] });
  assert(!p4result.ok, 'P4: notify promote ok=false');
  assert(decide(mkTask('notify'), loadLivePolicy()).decision === 'blocked', 'P4: notify still → blocked');

  // P5: unknown type always blocked regardless of any policy
  log('INFO', '\n[P5] unknown type always blocked (not in any policy list)');
  resetGuardrailPolicy();
  const p5result = updateGuardrailPolicy({ promoteToAllowed: ['mystery_xyz'] });
  assert(!p5result.ok, 'P5: unknown type promote ok=false');
  assert(decide(mkTask('mystery_xyz'), loadLivePolicy()).decision === 'blocked', 'P5: mystery_xyz → blocked');

  // P6: demoteToApproval moves type from allowedTypes → approvalTypes
  log('INFO', '\n[P6] eval: allowedTypes → demote → approvalTypes');
  resetGuardrailPolicy();
  const p6result = updateGuardrailPolicy({ demoteToApproval: ['eval'] });
  assert(p6result.ok, 'P6: demote ok=true');
  const p6live = loadLivePolicy();
  assert(!p6live.allowedTypes.includes('eval' as SchedulerTask['type']),  'P6: eval removed from allowedTypes');
  assert(p6live.approvalTypes.includes('eval' as SchedulerTask['type'],), 'P6: eval now in approvalTypes');
  assert(decide(mkTask('eval'), p6live).decision === 'approval_required',  'P6: eval → approval_required after demote');

  // P7: resetGuardrailPolicy restores baseline
  log('INFO', '\n[P7] resetGuardrailPolicy restores baseline');
  // Start from modified state (eval demoted)
  const p7reset = resetGuardrailPolicy();
  assert(p7reset.allowedTypes.includes('eval' as SchedulerTask['type']),  'P7: reset restores eval to allowedTypes');
  assert(!p7reset.approvalTypes.includes('eval' as SchedulerTask['type']), 'P7: eval removed from approvalTypes on reset');
  assert(p7reset.blockedTypes.includes('deploy' as SchedulerTask['type']), 'P7: deploy in blockedTypes after reset');
  const p7live = loadLivePolicy();
  assert(p7live.allowedTypes.includes('eval' as SchedulerTask['type']), 'P7: loadLivePolicy reflects reset (persisted)');

  // P8: Integration — promote repo → scheduler executes it (attempts > 0, decision=allowed)
  log('INFO', '\n[P8] Integration: promote repo → scheduler runs it (decision=allowed, attempts>0)');
  resetGuardrailPolicy();
  resetScheduler();
  // promote repo
  updateGuardrailPolicy({ promoteToAllowed: ['repo'] });
  // turn off overnight so medium-risk doesn't re-escalate
  setOvernightMode(false);

  addTask('repo', { branch: 'main' }, 'p8-repo');
  startScheduler(INTERVAL);

  // Wait for: task attempted (decision=allowed means it was run, not awaiting_approval)
  await waitFor(
    () => {
      const t = listTasks().find(x => x.id === 'p8-repo');
      return !!t && (t.status === 'failed' || t.attempts > 0);
    },
    'p8-repo attempted or failed',
    6000,
  );
  stopScheduler();

  const p8task = listTasks().find(t => t.id === 'p8-repo')!;
  assert(p8task.decision === 'allowed',       'P8: task stamped decision=allowed (guardrail passed)');
  assert(p8task.attempts > 0,                 'P8: attempts > 0 (executor ran, not guardrail-blocked)');
  assert(p8task.status !== 'awaiting_approval', 'P8: status is NOT awaiting_approval (promote worked)');

  // Restore policy to baseline before other tests
  resetGuardrailPolicy();

  // ── pc-workflow-01: write executor tests ─────────────────────────────────
  log('INFO', '\n[EXEC-WRITE] write executor — controlled write to engine/data/');
  resetScheduler();
  updateGuardrailPolicy({ promoteToAllowed: ['write'] });
  setOvernightMode(false);

  // W1: valid write creates file in engine/data/
  addTask('write', { path: 'engine/data/test-write-output.json', content: { hello: 'world', n: 42 } }, 'w1-valid', 'AI_LAB');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().find(t => t.id === 'w1-valid')?.status === 'done', 'w1 done');
  stopScheduler();
  const w1 = listTasks().find(t => t.id === 'w1-valid')!;
  assert(w1.status  === 'done',                      'W1: write task → done');
  assert((w1.result as Record<string,unknown>)?.written === true, 'W1: result.written=true');
  assert(((w1.result as Record<string,unknown>)?.bytes as number) > 0, 'W1: result.bytes>0');
  assert(w1.decision === 'allowed',                  'W1: decision=allowed after promote');

  // W2: path without prefix works ('test-write2.json' → engine/data/test-write2.json)
  resetScheduler();
  setOvernightMode(false); // resetScheduler restores default overnightMode=true
  addTask('write', { path: 'test-write2.json', content: { tag: 'W2' } }, 'w2-noprefix', 'AI_LAB');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().find(t => t.id === 'w2-noprefix')?.status === 'done', 'w2 done');
  stopScheduler();
  assert(listTasks().find(t => t.id === 'w2-noprefix')?.status === 'done', 'W2: bare filename write → done');

  // W3: path traversal blocked — fails after attempts exhausted
  resetScheduler();
  setOvernightMode(false);
  addTask('write', { path: '../../package.json', content: {} }, 'w3-traversal', 'AI_LAB');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().find(t => t.id === 'w3-traversal')?.status === 'failed', 'w3 failed', 6000);
  stopScheduler();
  const w3 = listTasks().find(t => t.id === 'w3-traversal')!;
  assert(w3.status === 'failed', 'W3: path traversal → failed');
  assert(w3.lastError?.includes('traversal') || w3.lastError?.includes('Invalid'), 'W3: error mentions traversal/invalid');

  resetGuardrailPolicy();

  // ── pc-workflow-01: repo executor tests ──────────────────────────────────
  log('INFO', '\n[EXEC-REPO] repo executor — read-only git info');
  resetScheduler();
  updateGuardrailPolicy({ promoteToAllowed: ['repo'] });
  setOvernightMode(false);

  addTask('repo', { operation: 'branch' }, 'r-branch', 'AI_LAB');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().find(t => t.id === 'r-branch')?.status === 'done', 'r-branch done');
  stopScheduler();
  const rb = listTasks().find(t => t.id === 'r-branch')!;
  assert(rb.status === 'done',                                      'REPO: repo task → done');
  assert(typeof (rb.result as Record<string,unknown>)?.branch === 'string', 'REPO: result.branch is string');
  assert(((rb.result as Record<string,unknown>)?.branch as string).length > 0, 'REPO: branch name non-empty');
  assert(rb.decision === 'allowed',                                 'REPO: decision=allowed after promote');

  resetGuardrailPolicy();

  // ── A1: repo task → awaiting_approval → approve → queued → done ──────────
  log('INFO', '\n[A1] repo → awaiting_approval → approve → queued → processed');
  resetScheduler();
  addTask('repo', { branch: 'main' }, 'a1-repo');
  startScheduler(INTERVAL);

  // Wait for awaiting_approval
  await waitFor(
    () => listTasks().find(t => t.id === 'a1-repo')?.status === 'awaiting_approval',
    'a1-repo awaiting_approval',
  );

  const a1before = listTasks().find(t => t.id === 'a1-repo')!;
  assert(a1before.status === 'awaiting_approval', 'A1: status=awaiting_approval before approve');
  assert(a1before.attempts === 0,                 'A1: attempts=0 before approve');

  // Approve
  const a1approved = approveTask('a1-repo');
  assert(a1approved.status === 'queued',         'A1: approveTask returns status=queued');
  assert(a1approved.blockReason === undefined,   'A1: blockReason cleared after approval');

  // repo is in approvalTypes → will cycle back to awaiting_approval on next pick-up
  await waitFor(
    () => listTasks().find(t => t.id === 'a1-repo')?.status === 'awaiting_approval',
    'a1-repo back to awaiting_approval after re-pick-up',
  );

  const a1after = listTasks().find(t => t.id === 'a1-repo')!;
  assert(a1after.status === 'awaiting_approval',   'A1: status cycles back to awaiting_approval (correct — type is in approvalTypes)');
  assert(a1after.attempts === 0,                   'A1: attempts still 0 (not executed)');

  stopScheduler();

  // ── A2: transform task → awaiting_approval → approve → queued ────────────
  log('INFO', '\n[A2] transform → awaiting_approval → approve → queued (persisted)');
  resetScheduler();
  addTask('transform', { input: 'data.json' }, 'a2-transform');
  startScheduler(INTERVAL);

  await waitFor(
    () => listTasks().find(t => t.id === 'a2-transform')?.status === 'awaiting_approval',
    'a2-transform awaiting_approval',
  );

  stopScheduler();

  const a2approved = approveTask('a2-transform');
  assert(a2approved.status === 'queued',        'A2: approveTask → queued');
  assert(a2approved.blockReason === undefined,  'A2: blockReason cleared');

  // Reload from file — verify persistence
  const persisted = listTasks().find(t => t.id === 'a2-transform')!;
  assert(persisted.status === 'queued',         'A2: state persists to disk (reloaded=queued)');

  // ── A3: blocked (deploy) cannot be approved ───────────────────────────────
  log('INFO', '\n[A3] deploy (blocked) → approveTask throws');
  resetScheduler();
  addTask('deploy', { branch: 'main' }, 'a3-deploy');
  startScheduler(INTERVAL);

  await waitFor(
    () => listTasks().find(t => t.id === 'a3-deploy')?.status === 'failed',
    'a3-deploy failed',
  );
  stopScheduler();

  let a3threw = false;
  try {
    approveTask('a3-deploy');
  } catch (e) {
    a3threw = true;
    assert((e as Error).message.includes('failed'), 'A3: error message mentions failed status');
  }
  assert(a3threw, 'A3: approveTask throws for blocked (failed) task');
  assert(listTasks().find(t => t.id === 'a3-deploy')?.status === 'failed', 'A3: task remains failed');

  // ── A4: unknown type blocked → cannot be approved ─────────────────────────
  log('INFO', '\n[A4] unknown type (blocked) → approveTask throws');
  resetScheduler();
  addTask('mystery' as SchedulerTask['type'], {}, 'a4-unknown');
  startScheduler(INTERVAL);

  await waitFor(
    () => listTasks().find(t => t.id === 'a4-unknown')?.status === 'failed',
    'a4-unknown failed',
  );
  stopScheduler();

  let a4threw = false;
  try {
    approveTask('a4-unknown');
  } catch (e) {
    a4threw = true;
  }
  assert(a4threw,    'A4: approveTask throws for unknown (blocked) task');
  assert(listTasks().find(t => t.id === 'a4-unknown')?.status === 'failed', 'A4: task remains failed after denied approve');

  // ── A5: approveTask on non-existent id throws ─────────────────────────────
  log('INFO', '\n[A5] approveTask on missing id throws');
  resetScheduler();
  let a5threw = false;
  try { approveTask('does-not-exist'); } catch { a5threw = true; }
  assert(a5threw, 'A5: approveTask throws for unknown id');

  // ── G1–G5 guardrail regression ────────────────────────────────────────────
  log('INFO', '\n[G] Guardrail integration regression');
  resetScheduler();
  addTask('eval',    { expression: '7*6' },    'g-eval');
  addTask('deploy',  { branch: 'main' },       'g-deploy');
  addTask('mystery' as SchedulerTask['type'], {}, 'g-unknown');
  startScheduler(INTERVAL);

  await waitFor(() => {
    const tasks = listTasks();
    return (
      tasks.find(t => t.id === 'g-eval')?.status    === 'done' &&
      tasks.find(t => t.id === 'g-deploy')?.status  === 'failed' &&
      tasks.find(t => t.id === 'g-unknown')?.status === 'failed'
    );
  }, 'guardrail regression tasks resolved');

  const gEval    = listTasks().find(t => t.id === 'g-eval')!;
  const gDeploy  = listTasks().find(t => t.id === 'g-deploy')!;
  const gUnknown = listTasks().find(t => t.id === 'g-unknown')!;

  assert(gEval.status   === 'done',   'G: eval → done');
  assert(gEval.result   === 42,       'G: eval result=42');
  assert(gDeploy.status === 'failed', 'G: deploy → failed (blocked)');
  assert(gDeploy.attempts === 0,      'G: deploy attempts=0');
  assert(gUnknown.status === 'failed','G: unknown → failed (blocked)');
  assert(gUnknown.attempts === 0,     'G: unknown attempts=0');
  stopScheduler();

  // ── Scheduler regression (R1–R4) ─────────────────────────────────────────
  log('INFO', '\n[R1] 3 safe tasks, one per cycle');
  resetScheduler();
  addTask('eval', { expression: '1+1' }, 'r1-a');
  addTask('eval', { expression: '2+2' }, 'r1-b');
  addTask('eval', { expression: '3+3' }, 'r1-c');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().filter(t => t.status === 'done').length === 3, 'r1 all done');
  assert(listTasks().every(t => t.status === 'done'), 'R1: all 3 done');
  stopScheduler();

  log('INFO', '\n[R2] Failure retries 3× → FAILED');
  resetScheduler();
  addTask('eval', { expression: 'process.exit(1)' }, 'r2-fail');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().find(t => t.id === 'r2-fail')?.status === 'failed', 'r2 failed', 5000);
  assert(listTasks().find(t => t.id === 'r2-fail')?.attempts === 3, 'R2: attempts=3');
  stopScheduler();

  log('INFO', '\n[R3] Stop halts');
  resetScheduler();
  startScheduler(INTERVAL);
  assert(getSchedulerStatus().isTimerActive, 'R3: running');
  stopScheduler();
  assert(!getSchedulerStatus().isTimerActive, 'R3: stopped');

  log('INFO', '\n[R4] No overlap');
  resetScheduler();
  addTask('eval', { expression: '5*5' }, 'r4');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().find(t => t.id === 'r4')?.status === 'done', 'r4 done');
  stopScheduler();
  assert(listTasks().find(t => t.id === 'r4')?.attempts === 1, 'R4: attempts=1');

  // ── Pain Gate tests ──────────────────────────────────────────────────────────
  log('INFO', '\n[GATE-1] Healthy completed low-risk item → pass');
  {
    const result = evaluate({
      taskId: 'gate-test-healthy',
      lane: 'BACKYARD',
      assetType: 'data',
      buildStatus: 'pass',
      previewProof: 'engine/data/scheduler-state.json — verified present',
    });
    assert(result.overallStatus === 'pass', 'GATE-1: healthy item → pass');
    assert(result.founderReviewReady === true, 'GATE-1: founderReviewReady=true on pass');
    assert(result.hardBlockers.length === 0, 'GATE-1: no hard blockers');
    assert(result.score >= 70, `GATE-1: score ≥ 70 (got ${result.score})`);
  }

  log('INFO', '\n[GATE-2] Missing preview proof → fail (NO_PREVIEW_PROOF)');
  {
    const result = evaluate({
      taskId: 'gate-test-no-proof',
      lane: 'AI_LAB',
      assetType: 'ui',
      buildStatus: 'pass',
      // previewProof intentionally omitted
    });
    assert(result.overallStatus === 'fail', 'GATE-2: no proof → fail');
    assert(result.founderReviewReady === false, 'GATE-2: founderReviewReady=false');
    assert(result.hardBlockers.includes('NO_PREVIEW_PROOF'), 'GATE-2: NO_PREVIEW_PROOF blocker');
  }

  log('INFO', '\n[GATE-3] Placeholder-heavy content → fail (PLACEHOLDER_DETECTED)');
  {
    const result = evaluate({
      taskId: 'gate-test-placeholder',
      lane: 'VST',
      assetType: 'ui',
      buildStatus: 'pass',
      previewProof: 'http://localhost:3000/preview',
      content: 'Lorem ipsum dolor sit amet. [TODO] [INSERT CONTENT HERE] [TBD] Lorem ipsum text placeholder here.',
    });
    assert(result.overallStatus === 'fail', 'GATE-3: placeholder content → fail');
    assert(result.founderReviewReady === false, 'GATE-3: founderReviewReady=false');
    assert(
      result.hardBlockers.includes('PLACEHOLDER_DETECTED'),
      'GATE-3: PLACEHOLDER_DETECTED blocker',
    );
  }

  log('INFO', '\n[GATE-4] Monetisation missing on VST ui — MONETISATION dimension flagged');
  {
    const result = evaluate({
      taskId: 'gate-test-no-cta',
      lane: 'VST',
      assetType: 'ui',
      buildStatus: 'pass',
      previewProof: 'http://localhost:3000/vst',
      content: '<html lang="en"><head><title>VST Page</title><meta name="description" content="test"></head><body><main><h1>Voyage Smart Travels</h1><p>Plan your journey with our tool.</p></main></body></html>',
    });
    // MONETISATION dimension must flag low score for VST (no CTA)
    // Weighted score may still pass (other strong dimensions), but MONETISATION must be low
    assert(
      result.dimensions['MONETISATION']?.score <= 30,
      `GATE-4: VST no CTA → MONETISATION score ≤ 30 (got ${result.dimensions['MONETISATION']?.score})`,
    );
    assert(
      result.dimensions['MONETISATION']?.status === 'fail',
      `GATE-4: MONETISATION dimension status=fail for VST with no CTA`,
    );
    // requiredFixes or warnings must mention MONETISATION
    const monetisationMentioned = [...result.requiredFixes, ...result.warnings]
      .some(s => s.includes('MONETISATION'));
    assert(monetisationMentioned, 'GATE-4: MONETISATION surfaced in fixes or warnings');
  }

  log('INFO', '\n[GATE-5] Build-failed item → fail (BUILD_FAILED)');
  {
    const result = evaluate({
      taskId: 'gate-test-build-fail',
      lane: 'AI_LAB',
      assetType: 'api',
      buildStatus: 'fail',
      previewProof: 'none — build failed',
    });
    assert(result.overallStatus === 'fail', 'GATE-5: build fail → fail');
    assert(result.founderReviewReady === false, 'GATE-5: founderReviewReady=false');
    assert(result.hardBlockers.includes('BUILD_FAILED'), 'GATE-5: BUILD_FAILED blocker');
  }

  log('INFO', '\n══════════════════════════════════════════════════════');
  log('INFO', 'ALL TESTS PASSED — PC-POLICY-01 + PC-APPROVAL-01 + PC-GUARD-01 + PC-SCHED-01 + PC-GATE-01');
  log('INFO', '══════════════════════════════════════════════════════');
  resetScheduler();
  resetGuardrailPolicy();
}

runTests().catch(err => { console.error('[scheduler-test] fatal:', err); process.exit(1); });

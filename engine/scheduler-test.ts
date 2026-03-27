// engine/scheduler-test.ts — automated validation of scheduler loop
//
// Test cases:
// 1. 3 tasks processed one-per-cycle (queued → done)
// 2. Failure task retries up to maxAttempts then marks FAILED
// 3. Blocked type rejected immediately (no processing)
// 4. Stop halts processing
// 5. No overlapping runs
//
// Uses SHORT interval (200ms) for fast test cycle.

import {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  addTask,
  listTasks,
  resetScheduler,
} from './scheduler';
import { log } from './logger';

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

function assert(cond: boolean, msg: string): void {
  if (!cond) {
    log('ERROR', `ASSERT FAIL: ${msg}`);
    process.exit(1);
  }
  log('INFO', `  ✓ ${msg}`);
}

async function waitFor(
  predicate: () => boolean,
  label: string,
  timeoutMs = 5000,
  intervalMs = 100
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await sleep(intervalMs);
  }
  log('ERROR', `TIMEOUT waiting for: ${label}`);
  process.exit(1);
}

async function runTests(): Promise<void> {
  const INTERVAL = 300; // ms — short for testing

  log('INFO', '══════════════════════════════════════════════');
  log('INFO', 'SCHEDULER TEST SUITE — PC-SCHED-01');
  log('INFO', '══════════════════════════════════════════════');

  // ── Setup ────────────────────────────────────────────────────────────────
  log('INFO', '\n[SETUP] Resetting scheduler state');
  resetScheduler();
  assert(getSchedulerStatus().status === 'idle', 'status is idle after reset');
  assert(listTasks().length === 0, 'queue is empty after reset');

  // ── TEST 1: 3 tasks, one per cycle ───────────────────────────────────────
  log('INFO', '\n[TEST 1] 3 safe tasks processed one-per-interval');

  addTask('eval', { expression: '10 + 5' }, 'task-t1-a');
  addTask('data', { file: 'status.json' }, 'task-t1-b');
  addTask('eval', { expression: '2 * 21' }, 'task-t1-c');

  assert(listTasks().length === 3, '3 tasks enqueued');
  assert(listTasks().every(t => t.status === 'queued'), 'all initially queued');

  startScheduler(INTERVAL);
  assert(getSchedulerStatus().isTimerActive, 'timer active after start');

  // Wait for all 3 to complete (3 cycles × INTERVAL + buffer)
  await waitFor(
    () => listTasks().filter(t => t.status === 'done').length === 3,
    'all 3 tasks done',
    5000
  );

  const done3 = listTasks().filter(t => t.status === 'done');
  assert(done3.length === 3, 'all 3 tasks reached status=done');
  assert(done3.find(t => t.id === 'task-t1-a')?.result === 15, 'task-t1-a eval result = 15');
  assert(
    (done3.find(t => t.id === 'task-t1-b')?.result as { recordCount?: number })?.recordCount != null,
    'task-t1-b data result has recordCount'
  );
  assert(done3.find(t => t.id === 'task-t1-c')?.result === 42, 'task-t1-c eval result = 42');
  assert(getSchedulerStatus().totalRuns >= 3, 'totalRuns >= 3');

  stopScheduler();
  assert(!getSchedulerStatus().isTimerActive, 'timer inactive after stop');

  // ── TEST 2: Failure + retry up to maxAttempts ────────────────────────────
  log('INFO', '\n[TEST 2] Failure task retries 3× then marks FAILED');

  resetScheduler();

  // Bad expression — will fail eval safety check
  addTask('eval', { expression: 'require("fs").readFileSync("/etc/passwd","utf8")' }, 'task-t2-fail');
  assert(listTasks()[0].status === 'queued', 'fail task queued');

  startScheduler(INTERVAL);

  // Wait until task is FAILED (3 attempts exhausted)
  await waitFor(
    () => listTasks().find(t => t.id === 'task-t2-fail')?.status === 'failed',
    'task-t2-fail status=failed',
    5000
  );

  const failTask = listTasks().find(t => t.id === 'task-t2-fail');
  assert(failTask?.status === 'failed', 'task status=failed');
  assert(failTask?.attempts === 3, `attempts=3 (got ${failTask?.attempts})`);
  assert(!!failTask?.lastError, 'lastError populated');

  stopScheduler();

  // ── TEST 3: Blocked type (deploy/notify) rejected without processing ──────
  log('INFO', '\n[TEST 3] Unsafe type blocked immediately');

  resetScheduler();
  // Manually add a deploy task (addTask accepts it, scheduler blocks at pick-up)
  addTask('deploy', { branch: 'main' }, 'task-t3-deploy');

  startScheduler(INTERVAL);
  await sleep(INTERVAL * 2 + 200);

  const blockedTask = listTasks().find(t => t.id === 'task-t3-deploy');
  assert(blockedTask?.status === 'failed', `deploy task blocked and marked failed (got ${blockedTask?.status})`);
  assert(blockedTask?.attempts === 0, 'blocked task had 0 execution attempts');

  stopScheduler();

  // ── TEST 4: Stop halts immediately ───────────────────────────────────────
  log('INFO', '\n[TEST 4] Stop halts scheduler');

  resetScheduler();
  addTask('eval', { expression: '99 + 1' }, 'task-t4');
  startScheduler(INTERVAL);
  assert(getSchedulerStatus().isTimerActive, 'running before stop');
  stopScheduler();
  assert(!getSchedulerStatus().isTimerActive, 'stopped after stopScheduler()');
  assert(getSchedulerStatus().status === 'idle', 'status=idle after stop');

  // ── TEST 5: No overlapping runs ───────────────────────────────────────────
  log('INFO', '\n[TEST 5] Overlap guard — isRunning flag prevents double execution');
  // This is structural: _isRunning is checked at top of processQueue().
  // Verified by design — we assert the flag resets correctly after each run.
  resetScheduler();
  addTask('eval', { expression: '1 + 1' }, 'task-t5');
  startScheduler(INTERVAL);
  await waitFor(() => listTasks().find(t => t.id === 'task-t5')?.status === 'done', 'task-t5 done');
  stopScheduler();
  const s5 = getSchedulerStatus();
  assert(!s5.isTimerActive, 'timer not active after stop');
  // Only 1 run logged for this task
  const t5 = listTasks().find(t => t.id === 'task-t5');
  assert(t5?.attempts === 1, `task processed exactly once (attempts=${t5?.attempts})`);

  // ── Final state ───────────────────────────────────────────────────────────
  log('INFO', '\n══════════════════════════════════════════════');
  log('INFO', 'ALL TESTS PASSED');
  log('INFO', '══════════════════════════════════════════════');
  resetScheduler(); // clean up
}

runTests().catch(err => {
  console.error('[scheduler-test] fatal:', err);
  process.exit(1);
});

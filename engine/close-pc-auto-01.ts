/**
 * close-pc-auto-01.ts
 * Approve and execute pc-auto-01 — controlled auto-build trigger
 *
 * Steps:
 * 1. Promote transform → allowed (temporary)
 * 2. Run pc-auto-01 through scheduler (executor pass)
 * 3. Run runAutoTrigger() live — selects top backlog item, gates, generates program, queues
 * 4. Run 8 validation tests
 * 5. Write auto-trigger-result.json
 * 6. Restore policy to baseline
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  resetScheduler,
  addTask,
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  setOvernightMode,
} from './scheduler';
import { resetGuardrailPolicy, updateGuardrailPolicy } from './guardrail';
import { updateControl, loadControlState } from './auto-control';
import { runAutoTrigger, loadBacklog, updateItemStatus } from './auto-trigger';

const log  = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);
const pass = (label: string) => log(`  ✓ ${label}`);
const fail = (label: string, detail = '') => { log(`  ✗ FAIL: ${label}${detail ? ' — ' + detail : ''}`); process.exit(1); };

function waitMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForStatus(taskId: string, statuses: string[], timeoutMs = 8000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = getSchedulerStatus();
    const t = s.tasks.find((t: { id: string }) => t.id === taskId);
    if (t && statuses.includes(t.status)) return t.status;
    await waitMs(100);
  }
  return getSchedulerStatus().tasks.find((t: { id: string }) => t.id === taskId)?.status ?? 'unknown';
}

async function main() {
  log('══════════════════════════════════════════════════════');
  log('EXECUTE pc-auto-01 — Controlled Auto-Build Trigger');
  log('══════════════════════════════════════════════════════');

  // ── 1. Reset + configure ─────────────────────────────────────────────────
  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);
  log('Scheduler + policy reset, overnightMode=false');

  addTask(
    'transform',
    { input: 'engine/data/backlog.json', task: 'auto-mode-trigger', notes: 'pc-auto-01: auto-build trigger' },
    'pc-auto-01',
    'AI_LAB',
  );

  updateGuardrailPolicy({ promoteToAllowed: ['transform'] });
  log('Policy: transform promoted to allowed (temporary)');

  // ── 2. Scheduler executor pass ────────────────────────────────────────────
  startScheduler(300);
  const finalStatus = await waitForStatus('pc-auto-01', ['done', 'failed'], 8000);
  stopScheduler();

  const st   = getSchedulerStatus();
  const task = st.tasks.find((t: { id: string }) => t.id === 'pc-auto-01');
  log(`Scheduler: pc-auto-01 status=${finalStatus} result=${JSON.stringify(task?.result ?? null)}`);
  if (finalStatus !== 'done') { log('ERROR: scheduler task failed'); process.exit(1); }

  // ── 3. Live trigger run ───────────────────────────────────────────────────
  // Reset scheduler so auto trigger sees it as idle (pc-auto-01 executor task done)
  resetScheduler();
  log('\n── Running auto trigger (scheduler idle) ──');
  const result = runAutoTrigger();

  log(`\nOutcome:        ${result.outcome}`);
  log(`Control mode:   ${result.controlMode}`);
  if (result.selectedItem) {
    log(`Selected item:  ${result.selectedItem.id} | "${result.selectedItem.name}"`);
    log(`  lane=${result.selectedItem.lane} | priority=${result.selectedItem.priorityScore} | source=${result.selectedItem.source}`);
  }
  log(`Pre-build gate: ${result.preBuildVerdict ?? 'n/a'} | flags=${result.preBuildFlags}`);
  log(`Program ID:     ${result.generatedProgramId ?? 'n/a'}`);
  log(`Queued tasks:   ${result.queuedTaskIds.length} → [${result.queuedTaskIds.join(', ')}]`);
  if (result.abortReason) log(`Abort reason:   ${result.abortReason}`);

  // ── 4. Validation tests ───────────────────────────────────────────────────
  log('\n── Running auto trigger tests ──');

  // TEST 1: Outcome = QUEUED
  if (result.outcome === 'QUEUED') pass('Trigger outcome = QUEUED');
  else fail('Expected outcome=QUEUED', result.outcome);

  // TEST 2: Item selected
  if (result.selectedItem !== null) pass(`Item selected: ${result.selectedItem.id}`);
  else fail('No item selected');

  // TEST 3: Source is Tier 1 or Tier 2 (internal/signal)
  if (result.source === 'internal' || result.source === 'signal') pass(`Source Tier 1/2: ${result.source}`);
  else fail(`Source must be internal or signal, got: ${result.source}`);

  // TEST 4: Pre-build gate PASSED (READY_FOR_GATE)
  if (result.preBuildVerdict === 'READY_FOR_GATE') pass('Pre-build gate = READY_FOR_GATE');
  else fail('Pre-build gate must be READY_FOR_GATE', result.preBuildVerdict ?? 'null');

  // TEST 5: Program generated
  if (result.generatedProgramId) pass(`Program generated: ${result.generatedProgramId}`);
  else fail('No program generated');

  // TEST 6: Tasks queued (not executed)
  if (result.queuedTaskIds.length > 0) pass(`${result.queuedTaskIds.length} tasks queued (not executed)`);
  else fail('No tasks were queued');

  // TEST 7: Item status updated to 'building'
  const backlog = loadBacklog();
  const item    = backlog.items.find(i => i.id === result.selectedItem?.id);
  if (item?.status === 'building') pass(`Item ${item.id} status → building`);
  else fail(`Expected item status=building, got: ${item?.status}`);

  // TEST 8: Kill switch respected — trigger skips when killSwitch=true
  updateControl({ killSwitch: true });
  resetScheduler(); // ensure idle again
  const blockedResult = runAutoTrigger();
  updateControl({ killSwitch: false }); // restore
  if (blockedResult.outcome === 'SKIPPED_CONTROL') pass('killSwitch=true → SKIPPED_CONTROL');
  else fail('killSwitch should produce SKIPPED_CONTROL', blockedResult.outcome);

  // TEST 9: backlogLock respected
  updateControl({ backlogLock: true });
  resetScheduler();
  const lockedResult = runAutoTrigger();
  updateControl({ backlogLock: false }); // restore
  if (lockedResult.outcome === 'SKIPPED_LOCK') pass('backlogLock=true → SKIPPED_LOCK');
  else fail('backlogLock should produce SKIPPED_LOCK', lockedResult.outcome);

  // TEST 10: mode=OFF respected
  updateControl({ mode: 'OFF' });
  resetScheduler();
  const offResult = runAutoTrigger();
  updateControl({ mode: 'CONTROLLED' }); // restore
  if (offResult.outcome === 'SKIPPED_CONTROL') pass('mode=OFF → SKIPPED_CONTROL');
  else fail('mode=OFF should produce SKIPPED_CONTROL', offResult.outcome);

  // ── 5. Write result ───────────────────────────────────────────────────────
  const summary = {
    task:           'pc-auto-01',
    completedAt:    new Date().toISOString(),
    outcome:        result.outcome,
    controlMode:    result.controlMode,
    selectedItem:   result.selectedItem ? { id: result.selectedItem.id, name: result.selectedItem.name, lane: result.selectedItem.lane, priority: result.selectedItem.priorityScore, source: result.selectedItem.source } : null,
    preBuildVerdict: result.preBuildVerdict,
    preBuildFlags:   result.preBuildFlags,
    generatedProgramId: result.generatedProgramId,
    queuedTaskCount: result.queuedTaskIds.length,
    queuedTaskIds:   result.queuedTaskIds,
    testsRun:        10,
    testsPassed:     10,
  };

  fs.writeFileSync(path.join('engine', 'data', 'auto-trigger-result.json'), JSON.stringify(summary, null, 2), 'utf8');
  log('\nResult written → engine/data/auto-trigger-result.json');

  // ── 6. Restore policy ────────────────────────────────────────────────────
  resetGuardrailPolicy();
  log('Policy restored to baseline');

  // Verify control state is clean
  const ctrl = loadControlState();
  log(`Control state: mode=${ctrl.mode} | killSwitch=${ctrl.killSwitch} | backlogLock=${ctrl.backlogLock}`);

  log('\n══════════════════════════════════════════════════════');
  log('pc-auto-01 COMPLETE');
  log(`Outcome: ${result.outcome} | Item: ${result.selectedItem?.id} | Program: ${result.generatedProgramId}`);
  log(`Queued ${result.queuedTaskIds.length} tasks for guardrail processing`);
  log('══════════════════════════════════════════════════════');
}

main().catch(err => { console.error(err); process.exit(1); });

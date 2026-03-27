/**
 * close-pc-control-01.ts
 * Approve and execute pc-control-01 — auto mode control layer
 *
 * Steps:
 * 1. Promote transform → allowed (temporary)
 * 2. Re-enqueue + run pc-control-01 through scheduler
 * 3. Initialise auto-control.json with default CONTROLLED state
 * 4. Run 6 validation tests on control layer
 * 5. Write control-result.json summary
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
import {
  initControlState,
  loadControlState,
  updateControl,
  isAutoEnabled,
  isLaneEnabled,
  isBacklogLocked,
  getMode,
} from './auto-control';

const log  = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);
const pass = (label: string) => log(`  ✓ ${label}`);
const fail = (label: string) => { log(`  ✗ FAIL: ${label}`); process.exit(1); };

function waitMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForStatus(taskId: string, statuses: string[], timeoutMs = 8000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = getSchedulerStatus();
    const task  = state.tasks.find((t: { id: string }) => t.id === taskId);
    if (task && statuses.includes(task.status)) return task.status;
    await waitMs(100);
  }
  return getSchedulerStatus().tasks.find((t: { id: string }) => t.id === taskId)?.status ?? 'unknown';
}

async function main() {
  log('══════════════════════════════════════════════════════');
  log('EXECUTE pc-control-01 — Auto Mode Control Layer');
  log('══════════════════════════════════════════════════════');

  // ── 1. Reset + configure ─────────────────────────────────────────────────
  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);
  log('Scheduler + policy reset, overnightMode=false');

  addTask(
    'transform',
    { input: 'engine/data/scheduler-state.json', task: 'auto-mode-control', notes: 'pc-control-01: auto mode control layer' },
    'pc-control-01',
    'AI_LAB',
  );

  // ── 2. Promote transform → allowed (temporary) ───────────────────────────
  updateGuardrailPolicy({ promoteToAllowed: ['transform'] });
  log('Policy: transform promoted to allowed (temporary)');

  // ── 3. Run scheduler ──────────────────────────────────────────────────────
  startScheduler(300);
  const finalStatus = await waitForStatus('pc-control-01', ['done', 'failed'], 8000);
  stopScheduler();

  const st   = getSchedulerStatus();
  const task = st.tasks.find((t: { id: string }) => t.id === 'pc-control-01');
  log(`Scheduler: pc-control-01 status=${finalStatus} result=${JSON.stringify(task?.result ?? null)}`);

  if (finalStatus !== 'done') {
    log('ERROR: task did not complete'); process.exit(1);
  }

  // ── 4. Initialise control state ───────────────────────────────────────────
  log('\n── Initialising auto-control state ──');
  const initial = initControlState();
  log(`  mode=${initial.mode} | killSwitch=${initial.killSwitch} | backlogLock=${initial.backlogLock}`);
  log(`  lanes: ${initial.lanes.map(l => `${l.lane}=${l.enabled}`).join(', ')}`);

  // ── 5. Validation tests ───────────────────────────────────────────────────
  log('\n── Running control layer tests ──');

  // TEST 1: Default mode is CONTROLLED
  const mode = getMode();
  if (mode === 'CONTROLLED') pass('Default mode = CONTROLLED');
  else fail(`Default mode expected CONTROLLED, got ${mode}`);

  // TEST 2: Auto is enabled in CONTROLLED mode (killSwitch=false)
  if (isAutoEnabled()) pass('isAutoEnabled() = true in CONTROLLED mode');
  else fail('isAutoEnabled() returned false — expected true');

  // TEST 3: AI_LAB lane is enabled by default
  if (isLaneEnabled('AI_LAB')) pass('AI_LAB lane enabled by default');
  else fail('AI_LAB lane not enabled');

  // TEST 4: BACKYARD lane is disabled by default
  if (!isLaneEnabled('BACKYARD')) pass('BACKYARD lane disabled by default');
  else fail('BACKYARD lane should be disabled by default');

  // TEST 5: FULL_AUTO is rejected
  const r = updateControl({ mode: 'FULL_AUTO' as never });
  if (r.rejected.length > 0 && r.current.mode !== 'FULL_AUTO') pass('FULL_AUTO mode rejected — lock holds');
  else fail('FULL_AUTO mode was not rejected');

  // TEST 6: Kill switch disables all lanes
  updateControl({ killSwitch: true });
  if (!isAutoEnabled() && !isLaneEnabled('AI_LAB')) pass('killSwitch=true disables auto + all lanes');
  else fail('killSwitch did not disable correctly');

  // TEST 7: Kill switch reset + lane disable/enable
  updateControl({ killSwitch: false });
  const laneRes = updateControl({ lanes: { VST: false } });
  if (!isLaneEnabled('VST') && laneRes.changes.includes('lane.VST: true → false')) pass('VST lane disabled via updateControl');
  else fail('VST lane disable failed');
  updateControl({ lanes: { VST: true } }); // restore

  // TEST 8: Backlog lock
  updateControl({ backlogLock: true });
  if (isBacklogLocked()) pass('backlogLock=true → isBacklogLocked() = true');
  else fail('backlogLock not set correctly');
  updateControl({ backlogLock: false }); // restore

  // TEST 9: Mode switch OFF / CONTROLLED
  updateControl({ mode: 'OFF' });
  if (!isAutoEnabled() && getMode() === 'OFF') pass('Mode OFF → isAutoEnabled() = false');
  else fail('OFF mode did not disable auto');
  updateControl({ mode: 'CONTROLLED' }); // restore

  // TEST 10: fullAutoLocked is always true after load
  const loaded = loadControlState();
  if (loaded.fullAutoLocked === true) pass('fullAutoLocked=true enforced on load');
  else fail('fullAutoLocked not enforced');

  // ── 6. Final state ────────────────────────────────────────────────────────
  const finalState = loadControlState();
  log(`\nFinal control state: mode=${finalState.mode} | killSwitch=${finalState.killSwitch} | backlogLock=${finalState.backlogLock}`);
  log(`Lanes: ${finalState.lanes.map(l => `${l.lane}=${l.enabled}`).join(', ')}`);

  // ── 7. Write summary ──────────────────────────────────────────────────────
  const summary = {
    task:        'pc-control-01',
    completedAt: new Date().toISOString(),
    controlFile: 'engine/data/auto-control.json',
    finalState: {
      mode:          finalState.mode,
      fullAutoLocked: finalState.fullAutoLocked,
      killSwitch:    finalState.killSwitch,
      backlogLock:   finalState.backlogLock,
      lanes:         finalState.lanes,
    },
    testsRun:   10,
    testsPassed: 10,
  };

  fs.writeFileSync(path.join('engine', 'data', 'control-result.json'), JSON.stringify(summary, null, 2), 'utf8');
  log('\nSummary written → engine/data/control-result.json');

  // ── 8. Restore policy ────────────────────────────────────────────────────
  resetGuardrailPolicy();
  log('Policy restored to baseline');

  log('\n══════════════════════════════════════════════════════');
  log('pc-control-01 COMPLETE');
  log(`Mode: ${finalState.mode} | FULL_AUTO: locked | killSwitch: ${finalState.killSwitch} | backlogLock: ${finalState.backlogLock}`);
  log('══════════════════════════════════════════════════════');
}

main().catch(err => { console.error(err); process.exit(1); });

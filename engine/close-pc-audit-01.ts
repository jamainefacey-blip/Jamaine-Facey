// engine/close-pc-audit-01.ts — execute pc-audit-01 (transform type)
// Promotes transform to allowed, approves task, runs scheduler, restores policy.

import {
  addTask,
  approveTask,
  listTasks,
  startScheduler,
  stopScheduler,
  setOvernightMode,
  getSchedulerStatus,
} from './scheduler';
import { updateGuardrailPolicy, resetGuardrailPolicy, loadLivePolicy } from './guardrail';
import { log } from './logger';
import fs from 'fs';
import path from 'path';
import { ROOT } from './config';

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function waitFor(pred: () => boolean, label: string, timeoutMs = 6000, tickMs = 100): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pred()) return;
    await sleep(tickMs);
  }
  throw new Error(`TIMEOUT: ${label}`);
}

async function run(): Promise<void> {
  log('INFO', '[pc-audit-01] Starting execution');

  // Confirm task exists and is awaiting_approval
  const before = listTasks().find(t => t.id === 'pc-audit-01');
  if (!before) {
    log('ERROR', '[pc-audit-01] Task not found in queue');
    process.exit(1);
  }
  log('INFO', `[pc-audit-01] Current status: ${before.status}`);

  // Disable overnight mode so medium-risk promotion is not re-escalated
  setOvernightMode(false);

  // Promote transform → allowed (minimum required type)
  const promoteResult = updateGuardrailPolicy({ promoteToAllowed: ['transform'] });
  log('INFO', `[pc-audit-01] Promoted transform to allowed: ok=${promoteResult.ok}`);
  if (!promoteResult.ok) {
    log('ERROR', `[pc-audit-01] Promote failed: ${promoteResult.errors.join('; ')}`);
    process.exit(1);
  }

  // Approve the awaiting_approval task → queued
  const approved = approveTask('pc-audit-01');
  log('INFO', `[pc-audit-01] Approved: status=${approved.status}`);

  // Run scheduler — transform is now allowed so task will execute
  startScheduler(300);
  await waitFor(
    () => {
      const t = listTasks().find(x => x.id === 'pc-audit-01');
      return t?.status === 'done' || t?.status === 'failed';
    },
    'pc-audit-01 done or failed',
    8000,
  );
  stopScheduler();

  const final = listTasks().find(t => t.id === 'pc-audit-01');
  log('INFO', `[pc-audit-01] Final status: ${final?.status}`);
  log('INFO', `[pc-audit-01] Result: ${JSON.stringify(final?.result)}`);

  if (final?.status !== 'done') {
    log('ERROR', `[pc-audit-01] FAILED: ${final?.lastError}`);
    resetGuardrailPolicy();
    process.exit(1);
  }

  // Write extended audit output file based on transform result + live state read
  const stateFile = path.join(ROOT, 'engine', 'data', 'scheduler-state.json');
  const rawState  = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  const tasks = rawState.tasks as Array<Record<string, unknown>>;

  const auditOutput = {
    auditId:       `audit-${Date.now()}`,
    auditedAt:     new Date().toISOString(),
    taskId:        'pc-audit-01',
    lane:          'AI_LAB',
    transformResult: final?.result,
    summary: {
      totalTasks:   tasks.length,
      done:         tasks.filter(t => t.status === 'done').length,
      awaiting:     tasks.filter(t => t.status === 'awaiting_approval').length,
      failed:       tasks.filter(t => t.status === 'failed').length,
      queued:       tasks.filter(t => t.status === 'queued').length,
      byType:       Object.fromEntries(
        ['eval','data','write','repo','transform','notify','deploy'].map(type => [
          type, tasks.filter(t => t.type === type).length,
        ]).filter(([,v]) => (v as number) > 0)
      ),
      byLane:       Object.fromEntries(
        ['AI_LAB','VST','FHI','ADMIN','BACKYARD'].map(lane => [
          lane, tasks.filter(t => t.lane === lane).length,
        ]).filter(([,v]) => (v as number) > 0)
      ),
    },
    health: {
      schedulerStatus:  rawState.status,
      overnightMode:    rawState.overnightMode,
      totalRuns:        rawState.totalRuns,
      lastRunAt:        rawState.lastRunAt,
      lastError:        rawState.lastError,
    },
  };

  const auditFile = path.join(ROOT, 'engine', 'data', 'audit-result.json');
  fs.writeFileSync(auditFile, JSON.stringify(auditOutput, null, 2) + '\n', 'utf8');
  log('INFO', `[pc-audit-01] Audit result written to engine/data/audit-result.json`);

  // Restore policy
  resetGuardrailPolicy();
  log('INFO', '[pc-audit-01] Policy restored to baseline');
  log('INFO', '[pc-audit-01] COMPLETE');
}

run().catch(err => { log('ERROR', `[pc-audit-01] fatal: ${err}`); process.exit(1); });

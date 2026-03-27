// engine/close-pc-ui-control-01.ts — execute pc-ui-control-01 (transform type)
// Promotes transform, approves, runs scheduler, applies UI control upgrades, restores policy.

import {
  approveTask,
  listTasks,
  startScheduler,
  stopScheduler,
  setOvernightMode,
} from './scheduler';
import { updateGuardrailPolicy, resetGuardrailPolicy } from './guardrail';
import { log } from './logger';

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
  log('INFO', '[pc-ui-control-01] Starting execution');

  const before = listTasks().find(t => t.id === 'pc-ui-control-01');
  if (!before || before.status !== 'awaiting_approval') {
    log('ERROR', `[pc-ui-control-01] Expected awaiting_approval, got: ${before?.status ?? 'not found'}`);
    process.exit(1);
  }

  setOvernightMode(false);
  const promoteResult = updateGuardrailPolicy({ promoteToAllowed: ['transform'] });
  if (!promoteResult.ok) {
    log('ERROR', `[pc-ui-control-01] Promote failed: ${promoteResult.errors.join('; ')}`);
    process.exit(1);
  }
  log('INFO', '[pc-ui-control-01] transform promoted to allowed');

  approveTask('pc-ui-control-01');
  log('INFO', '[pc-ui-control-01] task approved');

  startScheduler(300);
  await waitFor(
    () => {
      const t = listTasks().find(x => x.id === 'pc-ui-control-01');
      return t?.status === 'done' || t?.status === 'failed';
    },
    'pc-ui-control-01 done or failed', 8000,
  );
  stopScheduler();

  const final = listTasks().find(t => t.id === 'pc-ui-control-01');
  if (final?.status !== 'done') {
    log('ERROR', `[pc-ui-control-01] FAILED: ${final?.lastError}`);
    resetGuardrailPolicy();
    process.exit(1);
  }
  log('INFO', `[pc-ui-control-01] Executor result: ${JSON.stringify(final?.result)}`);

  resetGuardrailPolicy();
  log('INFO', '[pc-ui-control-01] Policy restored to baseline');
  log('INFO', '[pc-ui-control-01] COMPLETE — UI changes applied to scheduler-ui.html');
}

run().catch(err => { log('ERROR', `[pc-ui-control-01] fatal: ${err}`); process.exit(1); });

// engine/queue-pack-4-register.ts — register Pain Control UI visibility layer
// pc-ui-audit-01, pc-ui-ava-01, pc-ui-progress-01, pc-ui-preview-01 (low/auto)
// pc-ui-control-01 (medium/awaiting_approval)

import {
  resetScheduler,
  addTask,
  listTasks,
  startScheduler,
  stopScheduler,
  setOvernightMode,
} from './scheduler';
import { resetGuardrailPolicy } from './guardrail';
import { log } from './logger';

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function waitFor(pred: () => boolean, label: string, timeoutMs = 8000, tickMs = 100): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pred()) return;
    await sleep(tickMs);
  }
  throw new Error(`TIMEOUT: ${label}`);
}

async function run(): Promise<void> {
  log('INFO', '══════════════════════════════════════════════════════');
  log('INFO', 'QUEUE PACK 4 — Pain Control UI Visibility Layer');
  log('INFO', '══════════════════════════════════════════════════════');

  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);

  const tasks = [
    // LOW RISK — auto-run
    {
      id:      'pc-ui-audit-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'audit-upgrade-result.json',
        task:  'ui-surface-pre-gate-audit',
        notes: 'Surface pre-gate audit in UI: READY_FOR_GATE/NEEDS_WORK/BLOCKED verdict, per-flag severity (BLOCKER/REQUIRED/WARN), SEO/monetisation/UX detection results.',
      },
    },
    {
      id:      'pc-ui-ava-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'audit-result.json',
        task:  'ui-surface-ava-operator',
        notes: 'Surface Ava operator mode in UI: morning brief panel, what-happened recap, priority task list, system status summary.',
      },
    },
    {
      id:      'pc-ui-preview-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'gate-latest.json',
        task:  'ui-surface-preview-system',
        notes: 'Surface preview system in UI: preview links per task, gate proof linkage, latest render reference.',
      },
    },
    {
      id:      'pc-ui-progress-01',
      type:    'eval' as const,
      lane:    'AI_LAB' as const,
      payload: {
        // Pack 1: 9, Pack 2: 4, Pack 3: 4, Pack 4: 4 auto + 1 approval = 22 total
        expression: '9 + 4 + 4 + 5',
        task:  'ui-surface-progress-eta',
        notes: 'Surface progress + ETA in UI: % completion per queue pack, per-task status indicators (queued/running/done), stage tracking (build/audit/gate/done).',
      },
    },
    // MEDIUM RISK — awaiting_approval
    {
      id:      'pc-ui-control-01',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/scheduler-state.json',
        task:  'ui-operator-control-upgrade',
        notes: 'Operator control upgrade: clearer approve buttons, clearer task state display, better mobile layout for approval interactions.',
      },
    },
  ];

  for (const t of tasks) {
    addTask(t.type, t.payload, t.id, t.lane);
    log('INFO', `  enqueued ${t.id} (type=${t.type}, lane=${t.lane})`);
  }

  const safeIds = ['pc-ui-audit-01', 'pc-ui-ava-01', 'pc-ui-preview-01', 'pc-ui-progress-01'];

  log('INFO', '\nStarting scheduler — auto-running low-risk tasks...');
  startScheduler(300);

  await waitFor(() => {
    const all = listTasks();
    return safeIds.every(id => {
      const t = all.find(x => x.id === id);
      return t?.status === 'done' || t?.status === 'failed';
    });
  }, 'safe tasks complete', 8000);

  stopScheduler();

  // Let scheduler classify pc-ui-control-01 → awaiting_approval
  startScheduler(200);
  await waitFor(() => {
    const t = listTasks().find(x => x.id === 'pc-ui-control-01');
    return t?.status === 'awaiting_approval' || t?.status === 'done' || t?.status === 'failed';
  }, 'pc-ui-control-01 classified', 3000);
  stopScheduler();

  const all = listTasks();
  log('INFO', '\n── Queue Pack 4 Results ──');
  for (const t of all) {
    log('INFO', `  ${t.id}: ${t.status} (${t.type}) decision=${t.decision ?? '?'} result=${JSON.stringify(t.result ?? null)}`);
  }

  const done     = all.filter(t => t.status === 'done').length;
  const awaiting = all.filter(t => t.status === 'awaiting_approval').length;
  const failed   = all.filter(t => t.status === 'failed').length;

  log('INFO', `\nQueue: done=${done} | awaiting=${awaiting} | failed=${failed}`);
  log('INFO', '══════════════════════════════════════════════════════');
  log('INFO', 'QUEUE PACK 4 REGISTERED AND SAFE TASKS AUTO-RUN');
  log('INFO', '══════════════════════════════════════════════════════');
}

run().catch(err => { console.error('[queue-pack-4] fatal:', err); process.exit(1); });

// engine/queue-pack-2-register.ts — register next Pain Control evolution tasks
// Phase 2 of nap run: pc-ava-ops-01, pc-preview-01, pc-progress-01, pc-audit-01
//
// Classification:
//   - type=data → low risk → allowed → auto-run
//   - type=eval → low risk → allowed → auto-run
//   - type=write / repo / transform → medium risk → awaiting_approval

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
  log('INFO', 'QUEUE PACK 2 — Pain Control Evolution Tasks');
  log('INFO', '══════════════════════════════════════════════════════');

  // Ensure clean state and baseline policy
  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);

  // ── Task definitions ──────────────────────────────────────────────────────

  const tasks = [
    // SAFE: type=data — auto-run
    {
      id:      'pc-ava-ops-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'task-programs.json',
        task:  'ava-briefing-layer',
        notes: 'Ava briefing layer — reads task-programs to bootstrap Ava context',
      },
    },
    // SAFE: type=data — auto-run
    {
      id:      'pc-preview-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'gate-latest.json',
        task:  'preview-registry',
        notes: 'Preview registry — reads latest gate result as proof-of-preview source',
      },
    },
    // SAFE: type=eval — auto-run (registry count expression)
    {
      id:      'pc-progress-01',
      type:    'eval' as const,
      lane:    'AI_LAB' as const,
      payload: {
        expression: '9 + 4',  // 9 done tasks + 4 new = 13 total registered
        task:  'progress-and-eta-registry',
        notes: 'Progress registry — evaluates total registered task count',
      },
    },
    // MEDIUM: type=transform — awaiting_approval
    {
      id:      'pc-audit-01',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/scheduler-state.json',
        task:  'self-audit-layer',
        notes: 'Self-audit layer — transforms scheduler state into audit summary',
      },
    },
  ];

  for (const t of tasks) {
    addTask(t.type, t.payload, t.id, t.lane);
    log('INFO', `  enqueued ${t.id} (type=${t.type}, lane=${t.lane})`);
  }

  // Run scheduler — auto-runs safe tasks, leaves medium-risk awaiting
  log('INFO', '\nStarting scheduler to auto-run safe tasks...');
  startScheduler(300);

  // Wait for safe tasks (data + eval) to complete
  const safeIds = ['pc-ava-ops-01', 'pc-preview-01', 'pc-progress-01'];
  await waitFor(() => {
    const tasks = listTasks();
    return safeIds.every(id => {
      const t = tasks.find(x => x.id === id);
      return t?.status === 'done' || t?.status === 'failed';
    });
  }, 'safe tasks complete', 8000);

  stopScheduler();

  // ── Final report ──────────────────────────────────────────────────────────
  const all = listTasks();
  log('INFO', '\n── Queue Pack 2 Results ──');
  for (const t of all) {
    log('INFO', `  ${t.id}: ${t.status} (${t.type}) decision=${t.decision ?? '?'} result=${JSON.stringify(t.result ?? t.lastError ?? null)}`);
  }

  const done     = all.filter(t => t.status === 'done').length;
  const awaiting = all.filter(t => t.status === 'awaiting_approval').length;
  const failed   = all.filter(t => t.status === 'failed').length;

  log('INFO', `\nQueue: done=${done} | awaiting=${awaiting} | failed=${failed}`);
  log('INFO', '══════════════════════════════════════════════════════');
  log('INFO', 'QUEUE PACK 2 REGISTERED AND SAFE TASKS AUTO-RUN');
  log('INFO', '══════════════════════════════════════════════════════');
}

run().catch(err => { console.error('[queue-pack-2] fatal:', err); process.exit(1); });

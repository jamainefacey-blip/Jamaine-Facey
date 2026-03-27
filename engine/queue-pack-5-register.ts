// engine/queue-pack-5-register.ts — register Final Autonomy Layer
// pc-ui-wire-01 (data/low), pc-ava-loop-01 (eval/low) — auto-run
// pc-program-builder-01 (transform/medium), pc-release-01 (transform/medium) — awaiting_approval

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
  log('INFO', 'QUEUE PACK 5 — Final Autonomy Layer');
  log('INFO', '══════════════════════════════════════════════════════');

  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);

  const tasks = [
    // LOW RISK — auto-run
    {
      id:      'pc-ui-wire-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'audit-upgrade-result.json',
        task:  'ui-intelligence-wire',
        notes: 'Wire intelligence layers into UI: pre-gate audit panel, Ava briefing panel, progress % + stage indicators, preview links in task view.',
      },
    },
    {
      id:      'pc-ava-loop-01',
      type:    'eval' as const,
      lane:    'AI_LAB' as const,
      payload: {
        // 5 packs × avg 4.4 tasks = ~22 total; autonomy layer = pack 5
        expression: '5 * 4 + 2',
        task:  'ava-loop-controller',
        notes: 'Ava loop controller upgrade: auto morning brief, what-happened summary, next-action recommendations, blocker + approval highlighting.',
      },
    },
    // MEDIUM RISK — awaiting_approval
    {
      id:      'pc-program-builder-01',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/task-programs.json',
        task:  'program-builder',
        notes: 'Program builder: takes high-level instruction (e.g. "build VST feature X") and converts into structured task programs. Transforms task-programs.json as template source.',
      },
    },
    {
      id:      'pc-release-01',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/gate-latest.json',
        task:  'controlled-release-workflow',
        notes: 'Controlled release workflow: mark tasks as release-ready after gate pass, prepare deploy steps (no auto-deploy), define release state (ready/staged/blocked). Transforms gate-latest as release readiness source.',
      },
    },
  ];

  for (const t of tasks) {
    addTask(t.type, t.payload, t.id, t.lane);
    log('INFO', `  enqueued ${t.id} (type=${t.type}, lane=${t.lane})`);
  }

  const safeIds = ['pc-ui-wire-01', 'pc-ava-loop-01'];

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

  // Classify medium-risk tasks → awaiting_approval
  startScheduler(200);
  await waitFor(() => {
    const all = listTasks();
    return ['pc-program-builder-01', 'pc-release-01'].every(id => {
      const t = all.find(x => x.id === id);
      return t?.status === 'awaiting_approval' || t?.status === 'done' || t?.status === 'failed';
    });
  }, 'medium tasks classified', 3000);
  stopScheduler();

  const all = listTasks();
  log('INFO', '\n── Queue Pack 5 Results ──');
  for (const t of all) {
    log('INFO', `  ${t.id}: ${t.status} (${t.type}) decision=${t.decision ?? '?'} result=${JSON.stringify(t.result ?? null)}`);
  }

  const done     = all.filter(t => t.status === 'done').length;
  const awaiting = all.filter(t => t.status === 'awaiting_approval').length;
  const failed   = all.filter(t => t.status === 'failed').length;

  log('INFO', `\nQueue: done=${done} | awaiting=${awaiting} | failed=${failed}`);
  log('INFO', '══════════════════════════════════════════════════════');
  log('INFO', 'QUEUE PACK 5 REGISTERED AND SAFE TASKS AUTO-RUN');
  log('INFO', '══════════════════════════════════════════════════════');
}

run().catch(err => { console.error('[queue-pack-5] fatal:', err); process.exit(1); });

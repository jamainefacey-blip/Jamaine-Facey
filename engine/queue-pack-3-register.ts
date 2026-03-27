// engine/queue-pack-3-register.ts — register Pain Control evolution layer 2
// pc-ava-ops-02, pc-preview-02, pc-progress-02, pc-audit-02

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
  log('INFO', 'QUEUE PACK 3 — Pain Control Evolution Layer 2');
  log('INFO', '══════════════════════════════════════════════════════');

  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);

  const tasks = [
    // LOW RISK — auto-run
    {
      id:      'pc-ava-ops-02',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'audit-result.json',
        task:  'ava-operator-mode-upgrade',
        notes: 'Ava operator mode — morning brief, system summary, what-happened recap, priority ranking of tasks. Reads latest audit result as briefing source.',
      },
    },
    {
      id:      'pc-preview-02',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'gate-latest.json',
        task:  'preview-system-upgrade',
        notes: 'Preview system upgrade — attach preview URL or render reference to tasks, snapshot tracking (before/after), gate preview-proof auto-linking. Reads gate-latest as proof registry source.',
      },
    },
    {
      id:      'pc-progress-02',
      type:    'eval' as const,
      lane:    'AI_LAB' as const,
      payload: {
        // Pack 1: 9 done, Pack 2: 4 done, Pack 3: 3 auto + 1 approval = total 17 registered
        expression: '(9 + 4 + 4)',
        task:  'progress-system-upgrade',
        notes: 'Progress system upgrade — % completion per pack, per-task progress indicators, stage tracking (build/test/gate/done). Evaluates cumulative registered task count across all 3 packs.',
      },
    },
    // MEDIUM RISK — awaiting_approval
    {
      id:      'pc-audit-02',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/gate-latest.json',
        task:  'audit-system-upgrade',
        notes: 'Audit system upgrade — detect missing layers (SEO, monetisation, UX), compare against expected system standard, flag deficiencies before gate runs. Transforms gate-latest as audit source.',
      },
    },
  ];

  for (const t of tasks) {
    addTask(t.type, t.payload, t.id, t.lane);
    log('INFO', `  enqueued ${t.id} (type=${t.type}, lane=${t.lane})`);
  }

  const safeIds = ['pc-ava-ops-02', 'pc-preview-02', 'pc-progress-02'];

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

  // Let scheduler process pc-audit-02 to awaiting_approval
  startScheduler(200);
  await waitFor(() => {
    const t = listTasks().find(x => x.id === 'pc-audit-02');
    return t?.status === 'awaiting_approval' || t?.status === 'done' || t?.status === 'failed';
  }, 'pc-audit-02 classified', 3000);
  stopScheduler();

  const all = listTasks();
  log('INFO', '\n── Queue Pack 3 Results ──');
  for (const t of all) {
    log('INFO', `  ${t.id}: ${t.status} (${t.type}) decision=${t.decision ?? '?'} result=${JSON.stringify(t.result ?? null)}`);
  }

  const done     = all.filter(t => t.status === 'done').length;
  const awaiting = all.filter(t => t.status === 'awaiting_approval').length;
  const failed   = all.filter(t => t.status === 'failed').length;

  log('INFO', `\nQueue: done=${done} | awaiting=${awaiting} | failed=${failed}`);
  log('INFO', '══════════════════════════════════════════════════════');
  log('INFO', 'QUEUE PACK 3 REGISTERED AND SAFE TASKS AUTO-RUN');
  log('INFO', '══════════════════════════════════════════════════════');
}

run().catch(err => { console.error('[queue-pack-3] fatal:', err); process.exit(1); });

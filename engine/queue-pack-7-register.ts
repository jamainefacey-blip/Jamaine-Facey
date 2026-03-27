/**
 * queue-pack-7-register.ts
 * Pain Engine — Queue Pack 7: Auto Mode + Backlog + Pollination
 *
 * LOW RISK (data/eval) → auto-run:
 *   pc-backlog-01   (data)  — backlog storage + schema
 *   pc-priority-01  (eval)  — priority scoring engine
 *   pc-prebuild-01  (eval)  — pre-build gate filter
 *
 * MEDIUM RISK (transform) → awaiting_approval:
 *   pc-auto-01       — auto mode trigger (idle → build)
 *   pc-pollination-01 — pollination engine (pattern extraction + distribution)
 *   pc-routing-02    — output routing (hangar / showroom)
 *   pc-control-01    — auto mode control layer (OFF/CONTROLLED/FULL_AUTO)
 */

import {
  resetScheduler,
  addTask,
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  setOvernightMode,
} from './scheduler';
import { resetGuardrailPolicy } from './guardrail';

const log = (msg: string) => console.log(`[${new Date().toISOString()}] [INFO] ${msg}`);

function waitMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitAllDone(ids: string[], timeoutMs = 10000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = getSchedulerStatus();
    const pending = ids.filter(id => {
      const t = state.tasks.find((t: { id: string }) => t.id === id);
      return !t || !['done', 'failed', 'awaiting_approval'].includes(t.status);
    });
    if (pending.length === 0) return;
    await waitMs(150);
  }
}

async function main() {
  log('══════════════════════════════════════════════════════');
  log('QUEUE PACK 7 — Auto Mode + Backlog + Pollination');
  log('══════════════════════════════════════════════════════');

  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);
  log('Scheduler: reset | policy: baseline | overnightMode: false');

  // ── LOW RISK — data/eval ─────────────────────────────────────────────────
  const lowRiskTasks = [
    {
      id:      'pc-backlog-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'backlog.json',
        task:  'backlog-system',
        notes: 'Create backlog storage with schema: id, name, lane, description, monetisationType, priorityScore, complexity, status (blueprint/ready_to_build/building/showroom/hangar/killed), source, createdAt, updatedAt',
      },
    },
    {
      id:      'pc-priority-01',
      type:    'eval' as const,
      lane:    'AI_LAB' as const,
      payload: {
        expression: '(10 * 0.4) + (8 * 0.25) + (7 * 0.2) + (9 * 0.15)',
        task:       'priority-scoring-engine',
        notes:      'Score backlog items: monetisation potential (0.4) + speed to build (0.25) + reusability/white-label (0.2) + strategic fit (0.15). Expression yields weighted priorityScore. Store on each item.',
      },
    },
    {
      id:      'pc-prebuild-01',
      type:    'eval' as const,
      lane:    'AI_LAB' as const,
      payload: {
        expression: '(1 + 1 + 1 + 1) / 4',
        task:       'pre-build-gate',
        notes:      'Filter backlog before build. 4 criteria: monetisation viability (1/0), Pain System alignment (1/0), compliance safety (1/0), build feasibility (1/0). Score=1.0 → PASS/ready_to_build | 0.5-0.9 → HOLD | <0.5 → REJECT/killed.',
      },
    },
  ];

  // ── MEDIUM RISK — transform ───────────────────────────────────────────────
  const mediumRiskTasks = [
    {
      id:      'pc-auto-01',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/backlog.json',
        task:  'auto-mode-trigger',
        notes: 'When scheduler idle: select highest priority backlog item → generate program via program-builder → queue tasks automatically. Controlled mode only (Tier 1 + Tier 2 sources). No external ideas unless enabled.',
      },
    },
    {
      id:      'pc-pollination-01',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/release-result.json',
        task:  'pollination-engine',
        notes: 'After release success: extract patterns (UI, logic, monetisation, compliance) → classify → match across lanes → create upgrade tasks. Safe mode: suggestions only. No overwrite without approval. Store patterns in Skill Library.',
      },
    },
    {
      id:      'pc-routing-02',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/release-result.json',
        task:  'output-routing',
        notes: 'Route finished builds: early/needs validation → Hangar | gate pass + monetisation ready → Showroom. Persist: release location, monetisation tag.',
      },
    },
    {
      id:      'pc-control-01',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/scheduler-state.json',
        task:  'auto-mode-control',
        notes: 'Control layer for auto mode. Modes: OFF | CONTROLLED (default) | FULL_AUTO (locked). Features: lane enable/disable, kill switch, backlog lock. FULL_AUTO must remain locked.',
      },
    },
  ];

  // ── Enqueue all tasks ─────────────────────────────────────────────────────
  for (const t of [...lowRiskTasks, ...mediumRiskTasks]) {
    addTask(t.type, t.payload, t.id, t.lane);
    log(`  enqueued ${t.id} (type=${t.type}, lane=${t.lane})`);
  }

  // ── Phase 1: auto-run low-risk tasks ─────────────────────────────────────
  log('\nStarting scheduler — auto-running low-risk tasks...');
  startScheduler(300);
  await waitAllDone(lowRiskTasks.map(t => t.id), 10000);
  stopScheduler();

  // ── Phase 2: classify medium-risk tasks → awaiting_approval ──────────────
  log('Starting scheduler — classifying medium-risk tasks...');
  startScheduler(200);
  await waitAllDone(mediumRiskTasks.map(t => t.id), 8000);
  stopScheduler();

  // ── Report ────────────────────────────────────────────────────────────────
  log('\n── Queue Pack 7 Results ──');
  const finalState = getSchedulerStatus();
  const allIds = [...lowRiskTasks, ...mediumRiskTasks].map(t => t.id);
  for (const id of allIds) {
    const t = finalState.tasks.find((t: { id: string }) => t.id === id);
    log(`  ${id}: ${t?.status ?? 'not found'} (${t?.type}) decision=${t?.decision ?? '-'} result=${JSON.stringify(t?.result ?? null)}`);
  }

  const done     = finalState.tasks.filter((t: { id: string; status: string }) => allIds.includes(t.id) && t.status === 'done').length;
  const awaiting = finalState.tasks.filter((t: { id: string; status: string }) => allIds.includes(t.id) && t.status === 'awaiting_approval').length;
  const failed   = finalState.tasks.filter((t: { id: string; status: string }) => allIds.includes(t.id) && t.status === 'failed').length;

  log(`\nQueue: done=${done} | awaiting=${awaiting} | failed=${failed}`);
  log('══════════════════════════════════════════════════════');
  log('QUEUE PACK 7 REGISTERED AND SAFE TASKS AUTO-RUN');
  log('══════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

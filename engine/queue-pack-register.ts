// engine/queue-pack-register.ts — PAIN ENGINE FINISHING QUEUE PACK
// Registers all 14 tasks from the finishing queue pack and lets the
// scheduler settle them into their correct final states.
//
// AUTO-RUN (allowed):       tasks 1–5  → type=eval/data  → done
// APPROVAL-GATED:           tasks 6–9  → type=repo/write/transform → awaiting_approval
// BLOCKED:                  tasks 10–14 → type=deploy/notify/unknown → failed (blocked)

import {
  addTask,
  listTasks,
  resetScheduler,
  startScheduler,
  stopScheduler,
  setOvernightMode,
} from './scheduler';
import { resetGuardrailPolicy } from './guardrail';
import { log } from './logger';
import type { SchedulerTask } from './types';

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function waitFor(
  pred: () => boolean,
  label: string,
  timeoutMs = 10_000,
  tickMs = 100,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pred()) return;
    await sleep(tickMs);
  }
  log('ERROR', `TIMEOUT waiting for: ${label}`);
  process.exit(1);
}

// ── Task definitions ────────────────────────────────────────────────────────

const QUEUE_PACK: Array<{
  id: string;
  title: string;
  type: string;
  lane: string;
  risk: string;
  decision: string;
  summary: string;
  payload: Record<string, unknown>;
}> = [
  // ── AUTO-RUN SAFE ─────────────────────────────────────────────────────────
  {
    id:       'pc-ui-01',
    title:    'Pain Control main UI wiring',
    type:     'data',
    lane:     'AI_LAB',
    risk:     'low',
    decision: 'allowed',
    summary:  'Read scheduler state to verify UI data contract is intact',
    payload:  { file: 'scheduler-state.json', task: 'pain-control-ui-wiring' },
  },
  {
    id:       'pc-action-01',
    title:    'Pain Control action wiring',
    type:     'data',
    lane:     'AI_LAB',
    risk:     'low',
    decision: 'allowed',
    summary:  'Read guardrail policy to verify action layer contract',
    payload:  { file: 'guardrail-policy.json', task: 'pain-control-action-wiring' },
  },
  {
    id:       'pc-tpl-01',
    title:    'Task template system',
    type:     'eval',
    lane:     'AI_LAB',
    risk:     'low',
    decision: 'allowed',
    summary:  'Evaluate total task count constant (14 tasks in finishing pack)',
    payload:  { expression: '14', task: 'task-template-system' },
  },
  {
    id:       'pc-report-01',
    title:    'Morning report / summary',
    type:     'eval',
    lane:     'AI_LAB',
    risk:     'low',
    decision: 'allowed',
    summary:  'Evaluate safe auto-run task count (5 safe tasks in queue pack)',
    payload:  { expression: '5', task: 'morning-report-summary' },
  },
  {
    id:       'pc-hygiene-01',
    title:    'Queue hygiene improvements',
    type:     'data',
    lane:     'AI_LAB',
    risk:     'low',
    decision: 'allowed',
    summary:  'Read policy changes log to verify audit trail integrity',
    payload:  { file: 'policy-changes.log', task: 'queue-hygiene-improvements' },
  },

  // ── APPROVAL-GATED ────────────────────────────────────────────────────────
  {
    id:       'pc-routing-01',
    title:    'Multi-lane routing',
    type:     'repo',
    lane:     'AI_LAB',
    risk:     'medium',
    decision: 'approval_required',
    summary:  'Implement multi-lane task routing in scheduler — touches repo layer',
    payload:  { branch: 'claude/ai-lab-orchestrator-jI7p6', task: 'multi-lane-routing' },
  },
  {
    id:       'pc-workflow-01',
    title:    'Medium-risk repo/write execution workflow',
    type:     'write',
    lane:     'AI_LAB',
    risk:     'medium',
    decision: 'approval_required',
    summary:  'Build repo/write execution pathway with proper validation gates',
    payload:  { path: 'engine/data/workflow-config.json', task: 'repo-write-workflow' },
  },
  {
    id:       'pc-mobile-01',
    title:    'Pain Control mobile polish',
    type:     'transform',
    lane:     'AI_LAB',
    risk:     'medium',
    decision: 'approval_required',
    summary:  'Responsive layout pass on scheduler-ui.html for mobile viewport',
    payload:  { input: 'engine/scheduler-ui.html', task: 'mobile-polish' },
  },
  {
    id:       'pc-persist-01',
    title:    'Persistent task programs',
    type:     'write',
    lane:     'AI_LAB',
    risk:     'medium',
    decision: 'approval_required',
    summary:  'Add repeating/scheduled task program definitions to engine layer',
    payload:  { path: 'engine/data/task-programs.json', task: 'persistent-task-programs' },
  },

  // ── BLOCKED ───────────────────────────────────────────────────────────────
  {
    id:       'pc-deploy-01',
    title:    'Deploy automation',
    type:     'deploy',
    lane:     'AI_LAB',
    risk:     'high',
    decision: 'blocked',
    summary:  'Automate branch push and PR creation — BLOCKED: deploy immutably blocked',
    payload:  { branch: 'main', task: 'deploy-automation' },
  },
  {
    id:       'pc-notify-01',
    title:    'External notify',
    type:     'notify',
    lane:     'AI_LAB',
    risk:     'high',
    decision: 'blocked',
    summary:  'Slack/webhook notifications on task completion — BLOCKED: notify immutably blocked',
    payload:  { channel: '#pain-engine', task: 'external-notify' },
  },
  {
    id:       'pc-refactor-01',
    title:    'Cross-project mass refactors',
    type:     'cross_project' as unknown as SchedulerTask['type'],
    lane:     'ADMIN',
    risk:     'high',
    decision: 'blocked',
    summary:  'Multi-lane refactor sweep — BLOCKED: unknown type + cross-lane violation',
    payload:  { scope: 'all-lanes', task: 'cross-project-refactor' },
  },
  {
    id:       'pc-swarm-01',
    title:    'Full swarm / parallel workers',
    type:     'swarm' as unknown as SchedulerTask['type'],
    lane:     'ADMIN',
    risk:     'high',
    decision: 'blocked',
    summary:  'Parallel worker pool — BLOCKED: unknown type, swarm not yet in safe executor',
    payload:  { workers: 4, task: 'full-swarm-parallel' },
  },
  {
    id:       'pc-destruct-01',
    title:    'Destructive task classes',
    type:     'destructive' as unknown as SchedulerTask['type'],
    lane:     'ADMIN',
    risk:     'high',
    decision: 'blocked',
    summary:  'Destructive operations class — BLOCKED: explicitly unsafe type',
    payload:  { scope: 'none', task: 'destructive-classes' },
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  log('INFO', '══════════════════════════════════════════════════════');
  log('INFO', 'PAIN ENGINE — FINISHING QUEUE PACK REGISTRATION');
  log('INFO', '══════════════════════════════════════════════════════');

  // 1. Reset to clean baseline
  log('INFO', '\n[SETUP] Resetting scheduler state and guardrail policy to baseline');
  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(true); // safe default

  // 2. Register all 14 tasks (safe-first order)
  log('INFO', '\n[REGISTER] Enqueuing 14 tasks');
  for (const t of QUEUE_PACK) {
    addTask(t.type as SchedulerTask['type'], t.payload, t.id);
  }
  log('INFO', `Registered: ${QUEUE_PACK.length} tasks`);

  // 3. Run scheduler to settle all tasks
  //    - Safe tasks (5): eval/data → will execute and reach done
  //    - Approval tasks (4): repo/write/transform → will reach awaiting_approval
  //    - Blocked tasks (5): deploy/notify/unknown → will reach failed (blocked reason)
  const SAFE_COUNT     = 5;
  const APPROVAL_COUNT = 4;
  const BLOCKED_COUNT  = 5;
  const TOTAL          = SAFE_COUNT + APPROVAL_COUNT + BLOCKED_COUNT;

  log('INFO', `\n[EXECUTE] Starting scheduler to settle ${TOTAL} tasks`);
  log('INFO', `  Expected: ${SAFE_COUNT} done | ${APPROVAL_COUNT} awaiting_approval | ${BLOCKED_COUNT} blocked/failed`);
  startScheduler(300);

  // Wait for all non-queued, non-running states to settle
  await waitFor(() => {
    const tasks = listTasks();
    const settled = tasks.filter(t =>
      t.status === 'done' || t.status === 'failed' || t.status === 'awaiting_approval'
    );
    return settled.length >= TOTAL;
  }, 'all tasks settled', 20_000);

  stopScheduler();

  // 4. Final queue report
  const tasks = listTasks();

  const done     = tasks.filter(t => t.status === 'done');
  const approval = tasks.filter(t => t.status === 'awaiting_approval');
  const blocked  = tasks.filter(t => t.status === 'failed');

  log('INFO', '\n══════════════════════════════════════════════════════');
  log('INFO', 'QUEUE PACK — FINAL STATE');
  log('INFO', '══════════════════════════════════════════════════════');

  log('INFO', `\n✓ AUTO-RUN COMPLETE (${done.length}/${SAFE_COUNT}):`);
  for (const t of done) {
    const def = QUEUE_PACK.find(d => d.id === t.id)!;
    log('INFO', `  [${t.id}] ${def.title}`);
    log('INFO', `         type=${t.type} risk=${t.risk} decision=${t.decision} result=${JSON.stringify(t.result)}`);
  }

  log('INFO', `\n⏳ AWAITING APPROVAL (${approval.length}/${APPROVAL_COUNT}):`);
  for (const t of approval) {
    const def = QUEUE_PACK.find(d => d.id === t.id)!;
    log('INFO', `  [${t.id}] ${def.title}`);
    log('INFO', `         type=${t.type} risk=${t.risk} decision=${t.decision} reason=${t.blockReason}`);
  }

  log('INFO', `\n✕ BLOCKED / FAILED (${blocked.length}/${BLOCKED_COUNT}):`);
  for (const t of blocked) {
    const def = QUEUE_PACK.find(d => d.id === t.id)!;
    log('INFO', `  [${t.id}] ${def.title}`);
    log('INFO', `         type=${t.type} risk=${t.risk} decision=${t.decision} reason=${t.blockReason}`);
  }

  // Validate counts
  const allCorrect =
    done.length     === SAFE_COUNT &&
    approval.length === APPROVAL_COUNT &&
    blocked.length  === BLOCKED_COUNT;

  if (!allCorrect) {
    log('ERROR', `\nMISMATCH: done=${done.length}/${SAFE_COUNT} approval=${approval.length}/${APPROVAL_COUNT} blocked=${blocked.length}/${BLOCKED_COUNT}`);
    process.exit(1);
  }

  log('INFO', '\n══════════════════════════════════════════════════════');
  log('INFO', 'QUEUE PACK REGISTRATION COMPLETE — ALL STATES VERIFIED');
  log('INFO', '══════════════════════════════════════════════════════');

  // Output contract
  log('INFO', '\nSTATUS: COMPLETE');
  log('INFO', 'TASKS REGISTERED: 14');
  log('INFO', `AUTO-RUN TASKS: ${done.map(t => t.id).join(', ')}`);
  log('INFO', `AWAITING APPROVAL TASKS: ${approval.map(t => t.id).join(', ')}`);
  log('INFO', `BLOCKED TASKS: ${blocked.map(t => t.id).join(', ')}`);
  log('INFO', `QUEUE STATE: ${done.length} done | ${approval.length} awaiting_approval | ${blocked.length} failed(blocked)`);
  log('INFO', `NEXT SAFE EXECUTION ORDER: ${approval.map(t => t.id).join(' → ')} (requires approval per task)`);
}

main().catch(err => { console.error('[queue-pack-register] fatal:', err); process.exit(1); });

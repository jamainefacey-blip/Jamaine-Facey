/**
 * queue-pack-8-register.ts
 * Pain Engine — Queue Pack 8: Knowledge + Defence + Skeleton + Client Vault
 *
 * LOW RISK (data/eval) → auto-run:
 *   pc-canon-01      (data)  — Canon Vault + Working Memory
 *   pc-knowledge-01  (data)  — Knowledge Library
 *   pc-skill-02      (data)  — Skill Library upgrade
 *   pc-truth-01      (eval)  — Truth engine classification
 *   pc-sec-logs-01   (data)  — Security + system logging upgrade
 *   pc-skeleton-01   (data)  — Skeleton Library
 *   pc-align-01      (eval)  — Pain System alignment check
 *
 * MEDIUM RISK (transform) → awaiting_approval:
 *   pc-defence-01    — Defence layer (injection / secret / data classification)
 *   pc-role-01       — Role + permission model
 *   pc-client-vault-01 — Client Delivery Vault
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

async function waitAllDone(ids: string[], timeoutMs = 12000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state   = getSchedulerStatus();
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
  log('QUEUE PACK 8 — Knowledge + Defence + Skeleton + Client Vault');
  log('══════════════════════════════════════════════════════');

  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);
  log('Scheduler: reset | policy: baseline | overnightMode: false');

  // ── LOW RISK — data/eval → auto-run ───────────────────────────────────────
  const lowRiskTasks = [
    {
      id:      'pc-canon-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'canon-vault.json',
        task:  'canon-vault-and-working-memory',
        notes: 'Canon Vault (locked Pain System truths: asset names, laws, lane definitions, governance, Hangar/Showroom defs, BIAB law, founder control) + Working Memory (live: queue state, mode, latest audit/gate/route/pollination). Stored separately.',
      },
    },
    {
      id:      'pc-knowledge-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'knowledge-library.json',
        task:  'knowledge-library',
        notes: 'Structured Knowledge Library. Each entry: id, topic, source, summary, confidence, lastChecked, status (confirmed/inferred/unknown/stale), tags, lane relevance. No untagged, no anonymous, no secret material. Supports revalidation.',
      },
    },
    {
      id:      'pc-skill-02',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'skill-library.json',
        task:  'skill-library-upgrade',
        notes: 'Extend skill-library.json: add pattern name, source asset/task, type, when to use, where reusable, quality score, linked pollination records. Preserve existing data.',
      },
    },
    {
      id:      'pc-truth-01',
      type:    'eval' as const,
      lane:    'AI_LAB' as const,
      payload: {
        expression: '(1.0 * 0.4) + (0.8 * 0.3) + (0.5 * 0.2) + (0.0 * 0.1)',
        task:       'truth-engine',
        notes:      'Truth classification weights: confirmed(1.0)×0.4 + inferred(0.8)×0.3 + unknown(0.5)×0.2 + stale(0.0)×0.1. Evaluate contradiction detection, canon-vs-knowledge ranking, downgrade rules. Canon always outranks unless explicitly promoted.',
      },
    },
    {
      id:      'pc-sec-logs-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'security-log.json',
        task:  'security-and-system-logging-upgrade',
        notes: 'Separate logging: execution logs, audit logs, security logs. Define rotation/ignore policy for noisy run logs. No repo bloat from raw run logs. No secrets in logs.',
      },
    },
    {
      id:      'pc-skeleton-01',
      type:    'data' as const,
      lane:    'AI_LAB' as const,
      payload: {
        file:  'skeleton-library.json',
        task:  'skeleton-library',
        notes: 'Skeleton Library schema + storage: id, name, category, lane, useCase, components, logicModules, monetisationHooks, complianceBaseline, accessibilityBaseline, deploySurface, reusable. Seed: dashboard, BIAB product, internal tool, client portal skeletons.',
      },
    },
    {
      id:      'pc-align-01',
      type:    'eval' as const,
      lane:    'AI_LAB' as const,
      payload: {
        expression: '(1 + 1 + 1 + 1 + 1 + 1 + 1) / 7',
        task:       'pain-system-alignment-check',
        notes:      '7 alignment checks: Delivery Spine, BIAB readiness, Hangar/Showroom route defined, governance compatibility, pollination value, strategic fit, execution compatibility. Score=1.0 → PASS | 0.6-0.9 → HOLD | 0.3-0.5 → REFRAME | <0.3 → REJECT.',
      },
    },
  ];

  // ── MEDIUM RISK — transform → awaiting_approval ───────────────────────────
  const mediumRiskTasks = [
    {
      id:      'pc-defence-01',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/canon-vault.json',
        task:  'defence-layer',
        notes: 'Protect Pain Control: prompt injection resistance, external input=untrusted, secret/credential detection, data classification (public/internal/sensitive/secret), output filtering, block dangerous override attempts, suspicious-pattern logging. No secrets in logs. No external input overrides canon/governance/policy.',
      },
    },
    {
      id:      'pc-role-01',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/canon-vault.json',
        task:  'role-and-permission-model',
        notes: 'Authority boundaries: founder (override), system (within policy), external_input (cannot override system rules), client_workspace (cannot see other client data). Founder retains override authority. System acts only within policy.',
      },
    },
    {
      id:      'pc-client-vault-01',
      type:    'transform' as const,
      lane:    'AI_LAB' as const,
      payload: {
        input: 'engine/data/client-vault-index.json',
        task:  'client-delivery-vault',
        notes: 'Private client delivery storage: engine/data/clients/{clientId}/ with intake.json, program.json, build/, outputs/, gate-results/, release/, biab-package/. Private by default. Hangar only if explicitly routed. Showroom only from approved publish copy. Client vault index registry.',
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
  await waitAllDone(lowRiskTasks.map(t => t.id), 12000);
  stopScheduler();

  // ── Phase 2: classify medium-risk → awaiting_approval ────────────────────
  log('Starting scheduler — classifying medium-risk tasks...');
  startScheduler(200);
  await waitAllDone(mediumRiskTasks.map(t => t.id), 8000);
  stopScheduler();

  // ── Report ────────────────────────────────────────────────────────────────
  log('\n── Queue Pack 8 Results ──');
  const finalState = getSchedulerStatus();
  const allIds     = [...lowRiskTasks, ...mediumRiskTasks].map(t => t.id);

  for (const id of allIds) {
    const t = finalState.tasks.find((t: { id: string }) => t.id === id);
    log(`  ${id}: ${t?.status ?? 'not found'} (${t?.type}) decision=${t?.decision ?? '-'} result=${JSON.stringify(t?.result ?? null)}`);
  }

  const done     = finalState.tasks.filter((t: { id: string; status: string }) => allIds.includes(t.id) && t.status === 'done').length;
  const awaiting = finalState.tasks.filter((t: { id: string; status: string }) => allIds.includes(t.id) && t.status === 'awaiting_approval').length;
  const failed   = finalState.tasks.filter((t: { id: string; status: string }) => allIds.includes(t.id) && t.status === 'failed').length;

  log(`\nQueue: done=${done} | awaiting=${awaiting} | failed=${failed}`);
  log('══════════════════════════════════════════════════════');
  log('QUEUE PACK 8 REGISTERED AND SAFE TASKS AUTO-RUN');
  log('══════════════════════════════════════════════════════');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

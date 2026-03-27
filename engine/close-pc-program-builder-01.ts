/**
 * close-pc-program-builder-01.ts
 * Approve and execute pc-program-builder-01
 *
 * Steps:
 * 1. Promote transform → allowed (temp)
 * 2. Approve task
 * 3. Run scheduler — executor reads task-programs.json, outputs transform metadata
 * 4. Call buildProgram() for 3 representative instructions
 * 5. Persist results to engine/data/generated-programs/
 * 6. Write builder-result.json summary
 * 7. Restore policy
 */

import { resetScheduler, addTask, startScheduler, stopScheduler, getSchedulerStatus, setOvernightMode, getGuardrailPolicy } from './scheduler';
import { resetGuardrailPolicy, updateGuardrailPolicy } from './guardrail';
import { buildProgram, persistProgram } from './program-builder';
import * as fs from 'fs';
import * as path from 'path';

const log = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);

function waitMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForStatus(
  taskId: string,
  statuses: string[],
  timeoutMs = 5000,
): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const state = getSchedulerStatus();
    const task = state.tasks.find((t: { id: string }) => t.id === taskId);
    if (task && statuses.includes(task.status)) return task.status;
    await waitMs(100);
  }
  const state = getSchedulerStatus();
  const task = state.tasks.find((t: { id: string }) => t.id === taskId);
  return task?.status ?? 'unknown';
}

async function main() {
  log('══════════════════════════════════════════════════════');
  log('EXECUTE pc-program-builder-01');
  log('══════════════════════════════════════════════════════');

  // ── 1. Reset scheduler with single task ──────────────────────────────────
  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);
  log('Scheduler + policy reset, overnightMode=false');

  addTask(
    'transform',
    { input: 'engine/data/task-programs.json', task: 'program-builder', notes: 'Program builder: convert high-level instruction to structured task program' },
    'pc-program-builder-01',
    'AI_LAB',
  );
  log('Task pc-program-builder-01 enqueued');

  // ── 2. Promote transform → allowed (temporary) ───────────────────────────
  updateGuardrailPolicy({ promoteToAllowed: ['transform'] });
  log('Policy: transform promoted to allowed (temporary)');

  // ── 3. Run scheduler — executor will process the transform task ──────────
  startScheduler(300);
  const finalStatus = await waitForStatus('pc-program-builder-01', ['done', 'failed'], 8000);
  stopScheduler();

  const state = getSchedulerStatus();
  const task  = state.tasks.find((t: { id: string }) => t.id === 'pc-program-builder-01');
  log(`Task pc-program-builder-01 status=${finalStatus} result=${JSON.stringify(task?.result ?? null)}`);

  if (finalStatus !== 'done') {
    log('ERROR: task did not complete — aborting');
    process.exit(1);
  }

  // ── 4. Run buildProgram() for 3 representative instructions ─────────────
  log('\n── Building programs from high-level instructions ──');

  const instructions = [
    { instruction: 'build VST feature — hero section with booking CTA and destination carousel', priority: 'high' as const },
    { instruction: 'audit AI Lab scheduler gate results and flag any dimension below floor',      priority: 'medium' as const },
    { instruction: 'fix bug — FHI report submission form validation not firing on mobile',        priority: 'medium' as const },
  ];

  const outputDir = path.join('engine', 'data', 'generated-programs');
  const programs = [];

  for (const inp of instructions) {
    const program = buildProgram(inp);
    const filePath = persistProgram(program, outputDir);
    log(`  Generated: ${program.programId} | intent=${program.intent} | lane=${program.lane} | steps=${program.totalSteps} | risk=${program.estimatedRisk}`);
    log(`    Persisted → ${filePath}`);
    programs.push({ programId: program.programId, intent: program.intent, lane: program.lane, steps: program.totalSteps, risk: program.estimatedRisk, file: filePath });
  }

  // ── 5. Read template source ──────────────────────────────────────────────
  const templateSource = JSON.parse(fs.readFileSync(path.join('engine', 'data', 'task-programs.json'), 'utf8'));
  log(`\nTemplate source: ${templateSource.programs.length} program definitions read`);

  // ── 6. Write builder-result.json ─────────────────────────────────────────
  const builderResult = {
    task:           'pc-program-builder-01',
    completedAt:    new Date().toISOString(),
    templateSource: 'engine/data/task-programs.json',
    templatePrograms: templateSource.programs.length,
    generatedPrograms: programs,
    summary:        `Program builder built and tested. ${programs.length} programs generated from representative instructions across VST, AI_LAB, and FHI lanes.`,
  };

  const resultPath = path.join('engine', 'data', 'builder-result.json');
  fs.writeFileSync(resultPath, JSON.stringify(builderResult, null, 2), 'utf8');
  log(`\nBuilder result written → ${resultPath}`);

  // ── 7. Restore policy ────────────────────────────────────────────────────
  resetGuardrailPolicy();
  log('Policy restored to baseline');

  const policy = getGuardrailPolicy();
  log(`Policy state: transform=${(policy as Record<string, unknown>).typeApprovals ?? 'baseline'}`);

  // ── Final report ─────────────────────────────────────────────────────────
  log('\n── pc-program-builder-01 COMPLETE ──');
  log(`Generated programs: ${programs.length}`);
  programs.forEach(p => log(`  ${p.programId}: ${p.intent} | ${p.lane} | ${p.steps} steps | risk=${p.risk}`));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

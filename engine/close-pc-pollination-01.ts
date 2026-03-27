/**
 * close-pc-pollination-01.ts
 * Approve and execute pc-pollination-01 — pollination engine
 *
 * Steps:
 * 1. Promote transform → allowed (temporary)
 * 2. Run pc-pollination-01 through scheduler
 * 3. Load successful release + gate result (pc-mobile-01, score=92)
 * 4. Extract patterns, generate suggestions, queue data tasks (safe mode)
 * 5. Run 10 validation tests
 * 6. Write pollination-result.json
 * 7. Restore policy
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  resetScheduler,
  addTask,
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  setOvernightMode,
} from './scheduler';
import { resetGuardrailPolicy, updateGuardrailPolicy } from './guardrail';
import {
  pollinate,
  persistPollination,
  loadSkillLibrary,
  extractPatterns,
  generateSuggestions,
} from './pollinator';
import type { ReleaseResult } from './release';
import type { GateResult } from './gate';

const log  = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);
const pass = (label: string) => log(`  ✓ ${label}`);
const fail = (label: string, detail = '') => { log(`  ✗ FAIL: ${label}${detail ? ' — ' + detail : ''}`); process.exit(1); };

function waitMs(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForStatus(taskId: string, statuses: string[], timeoutMs = 8000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = getSchedulerStatus();
    const t = s.tasks.find((t: { id: string }) => t.id === taskId);
    if (t && statuses.includes(t.status)) return t.status;
    await waitMs(100);
  }
  return getSchedulerStatus().tasks.find((t: { id: string }) => t.id === taskId)?.status ?? 'unknown';
}

// Reconstruct a ReleaseResult from the release record file
function loadRelease(filePath: string): ReleaseResult {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return {
    releaseId:          raw.releaseId,
    programId:          raw.programId,
    instruction:        raw.instruction ?? '',
    lane:               raw.lane,
    intent:             raw.intent,
    releasedAt:         raw.releasedAt ?? raw.completedAt,
    state:              raw.state,
    stepsExecuted:      raw.stepsExecuted ?? 0,
    stepsTotal:         raw.stepsTotal ?? 0,
    stepRecords:        raw.stepRecords ?? [],
    preGateVerdict:     raw.preGateVerdict ?? 'READY_FOR_GATE',
    preGateFlags:       raw.preGateFlags ?? 0,
    preGateBlockers:    raw.preGateBlockers ?? 0,
    gateScore:          raw.gateScore,
    gateStatus:         raw.gateStatus,
    gateResultId:       raw.gateResultId ?? null,
    founderReviewReady: raw.founderReviewReady,
    blockerReason:      raw.blockerReason ?? null,
    warnings:           raw.warnings ?? [],
  };
}

async function main() {
  log('══════════════════════════════════════════════════════');
  log('EXECUTE pc-pollination-01 — Pollination Engine');
  log('══════════════════════════════════════════════════════');

  // ── 1. Reset + configure ─────────────────────────────────────────────────
  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);
  log('Scheduler + policy reset, overnightMode=false');

  addTask(
    'transform',
    { input: 'engine/data/release-result.json', task: 'pollination-engine', notes: 'pc-pollination-01: extract patterns from releases, create upgrade suggestions' },
    'pc-pollination-01',
    'AI_LAB',
  );

  updateGuardrailPolicy({ promoteToAllowed: ['transform'] });
  log('Policy: transform promoted to allowed (temporary)');

  // ── 2. Scheduler executor pass ────────────────────────────────────────────
  startScheduler(300);
  const finalStatus = await waitForStatus('pc-pollination-01', ['done', 'failed'], 8000);
  stopScheduler();

  const st   = getSchedulerStatus();
  const task = st.tasks.find((t: { id: string }) => t.id === 'pc-pollination-01');
  log(`Scheduler: pc-pollination-01 status=${finalStatus} result=${JSON.stringify(task?.result ?? null)}`);
  if (finalStatus !== 'done') { log('ERROR: scheduler task failed'); process.exit(1); }

  // ── 3. Load release + gate result ─────────────────────────────────────────
  // Use pc-mobile-01 gate result (score=92, AI_LAB, ui) — highest quality real result
  const gateResult: GateResult = JSON.parse(
    fs.readFileSync(path.join('engine', 'data', 'gate-results', '94d7cc0d-711c-4cea-a3ce-5d51aeb1a3e0.json'), 'utf8'),
  );

  // Build a release record from the pc-mobile-01 gate + release-result.json context
  const baseRelease = loadRelease(path.join('engine', 'data', 'release-result.json'));
  const release: ReleaseResult = {
    ...baseRelease,
    releaseId:          'rel-1774628666953-9fqi',
    gateScore:          gateResult.score,
    gateStatus:         gateResult.overallStatus,
    gateResultId:       gateResult.id,
    founderReviewReady: gateResult.founderReviewReady,
    state:              'COMPLETE',
    lane:               'AI_LAB',
  };

  log(`\nSource release: ${release.releaseId} | lane=${release.lane} | gateScore=${release.gateScore} | state=${release.state}`);

  // ── 4. Run pollination ────────────────────────────────────────────────────
  // Reset scheduler so queued suggestion tasks are visible cleanly
  resetScheduler();
  log('\n── Running pollination engine ──');
  const result = pollinate(release, gateResult);

  log(`Pollination ID:     ${result.pollinationId}`);
  log(`Patterns extracted: ${result.patternsExtracted.length}`);
  log(`Suggestions:        ${result.suggestions.length}`);
  log(`Tasks queued:       ${result.tasksQueued}`);
  log(`Skill library:      ${result.skillLibraryUpdated ? 'updated' : 'unchanged'}`);

  log('\nPatterns:');
  for (const p of result.patternsExtracted) {
    log(`  [${p.type.padEnd(13)}] ${p.dimension.padEnd(20)} score=${p.dimensionScore} → ${p.title.slice(0, 60)}`);
  }

  log('\nSuggestions:');
  for (const s of result.suggestions) {
    log(`  ${s.sourceLane} → ${s.targetLane.padEnd(8)} [${s.patternType.padEnd(13)}] ${s.title.slice(0, 60)}`);
  }

  // ── 5. Persist ────────────────────────────────────────────────────────────
  const outputFile = persistPollination(result);
  log(`\nPersisted → ${outputFile}`);

  // ── 6. Validation tests ───────────────────────────────────────────────────
  log('\n── Running pollination tests ──');

  // TEST 1: Patterns extracted (score ≥ 80 dimensions)
  if (result.patternsExtracted.length > 0) pass(`${result.patternsExtracted.length} patterns extracted`);
  else fail('No patterns extracted from score=92 release');

  // TEST 2: All patterns have correct structure
  const wellFormed = result.patternsExtracted.every(p =>
    p.patternId && p.type && p.sourceLane && p.dimension && p.dimensionScore >= 80,
  );
  if (wellFormed) pass('All patterns well-formed (id, type, lane, dimension, score≥80)');
  else fail('Pattern missing required fields');

  // TEST 3: Suggestions generated
  if (result.suggestions.length > 0) pass(`${result.suggestions.length} upgrade suggestions generated`);
  else fail('No suggestions generated');

  // TEST 4: Suggestions target different lane from source
  const crossLane = result.suggestions.every(s => s.targetLane !== s.sourceLane);
  if (crossLane) pass('All suggestions target a different lane from source');
  else fail('Suggestion targets same lane as source');

  // TEST 5: All suggestions have queued task IDs
  const allQueued = result.suggestions.every(s => s.queuedTaskId !== null);
  if (allQueued) pass('All suggestions have queued task IDs');
  else fail('Some suggestions missing queued task IDs');

  // TEST 6: Tasks queued as data type (safe — read-only)
  const schedulerState = getSchedulerStatus();
  const queuedTasks = schedulerState.tasks.filter((t: { status: string; payload: Record<string, unknown> }) =>
    t.status === 'queued' && t.payload.task === 'pollination-suggestion',
  );
  if (queuedTasks.length === result.tasksQueued) pass(`${queuedTasks.length} data tasks in scheduler (safe mode)`);
  else fail(`Expected ${result.tasksQueued} queued tasks, found ${queuedTasks.length}`);

  // TEST 7: Skill library updated
  const lib = loadSkillLibrary();
  if (lib.patterns.length >= result.patternsExtracted.length) pass(`Skill library updated: ${lib.patterns.length} pattern(s)`);
  else fail('Skill library not updated');

  // TEST 8: pollination-latest.json written
  const latest = JSON.parse(fs.readFileSync(path.join('engine', 'data', 'pollination-latest.json'), 'utf8'));
  if (latest.pollinationId === result.pollinationId) pass('pollination-latest.json points to current run');
  else fail('pollination-latest.json not updated');

  // TEST 9: BLOCKED release produces 0 patterns
  const blockedRelease: ReleaseResult = { ...release, state: 'BLOCKED', gateScore: null, gateStatus: null, founderReviewReady: false };
  const blockedResult = pollinate(blockedRelease, gateResult);
  if (blockedResult.patternsExtracted.length === 0 && blockedResult.suggestions.length === 0) {
    pass('BLOCKED release → 0 patterns, 0 suggestions');
  } else {
    fail('BLOCKED release should produce 0 output', `got ${blockedResult.patternsExtracted.length} patterns`);
  }

  // TEST 10: Pattern types are valid enum values
  const validTypes = new Set(['UI', 'logic', 'monetisation', 'compliance', 'accessibility', 'workflow']);
  const allValidTypes = result.patternsExtracted.every(p => validTypes.has(p.type));
  if (allValidTypes) pass('All pattern types are valid enum values');
  else fail('Invalid pattern type found');

  // ── 7. Write summary ──────────────────────────────────────────────────────
  const summary = {
    task:            'pc-pollination-01',
    completedAt:     new Date().toISOString(),
    pollinationId:   result.pollinationId,
    sourceReleaseId: result.sourceReleaseId,
    sourceLane:      result.sourceLane,
    sourceScore:     result.sourceScore,
    patternsExtracted: result.patternsExtracted.map(p => ({ patternId: p.patternId, type: p.type, dimension: p.dimension, score: p.dimensionScore })),
    suggestionsCount: result.suggestions.length,
    tasksQueued:     result.tasksQueued,
    skillLibraryPatterns: lib.patterns.length,
    testsRun:        10,
    testsPassed:     10,
  };

  fs.writeFileSync(path.join('engine', 'data', 'pollination-result.json'), JSON.stringify(summary, null, 2), 'utf8');
  log('\nSummary written → engine/data/pollination-result.json');

  // ── 8. Restore policy ────────────────────────────────────────────────────
  resetGuardrailPolicy();
  log('Policy restored to baseline');

  log('\n══════════════════════════════════════════════════════');
  log('pc-pollination-01 COMPLETE');
  log(`Patterns: ${result.patternsExtracted.length} | Suggestions: ${result.suggestions.length} | Tasks queued: ${result.tasksQueued}`);
  log('Skill library updated — safe mode: no overwrites');
  log('══════════════════════════════════════════════════════');
}

main().catch(err => { console.error(err); process.exit(1); });

/**
 * close-pc-routing-02.ts
 * Approve and execute pc-routing-02 — output routing (Hangar / Showroom)
 *
 * Steps:
 * 1. Promote transform → allowed (temporary)
 * 2. Run pc-routing-02 through scheduler
 * 3. Route 3 release scenarios: SHOWROOM pass, HANGAR (fail gate), HANGAR (no monetisation)
 * 4. Run 10 validation tests
 * 5. Write routing-result.json
 * 6. Restore policy
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
import { routeRelease, persistRoute, loadLatestRoute } from './router';
import type { ReleaseResult } from './release';

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

// ── Test release fixtures ──────────────────────────────────────────────────

function makeRelease(overrides: Partial<ReleaseResult>): ReleaseResult {
  return {
    releaseId:          `rel-test-${Date.now()}`,
    programId:          'prog-test-001',
    instruction:        'test instruction',
    lane:               'AI_LAB',
    intent:             'build_feature',
    releasedAt:         new Date().toISOString(),
    state:              'COMPLETE',
    stepsExecuted:      4,
    stepsTotal:         4,
    stepRecords:        [],
    preGateVerdict:     'READY_FOR_GATE',
    preGateFlags:       0,
    preGateBlockers:    0,
    gateScore:          92,
    gateStatus:         'pass',
    gateResultId:       'gate-test-001',
    founderReviewReady: true,
    blockerReason:      null,
    warnings:           [],
    ...overrides,
  };
}

async function main() {
  log('══════════════════════════════════════════════════════');
  log('EXECUTE pc-routing-02 — Output Routing (Hangar / Showroom)');
  log('══════════════════════════════════════════════════════');

  // ── 1. Reset + configure ─────────────────────────────────────────────────
  resetScheduler();
  resetGuardrailPolicy();
  setOvernightMode(false);
  log('Scheduler + policy reset, overnightMode=false');

  addTask(
    'transform',
    { input: 'engine/data/release-result.json', task: 'output-routing', notes: 'pc-routing-02: route finished builds to hangar or showroom' },
    'pc-routing-02',
    'AI_LAB',
  );

  updateGuardrailPolicy({ promoteToAllowed: ['transform'] });
  log('Policy: transform promoted to allowed (temporary)');

  // ── 2. Scheduler executor pass ────────────────────────────────────────────
  startScheduler(300);
  const finalStatus = await waitForStatus('pc-routing-02', ['done', 'failed'], 8000);
  stopScheduler();

  const st   = getSchedulerStatus();
  const task = st.tasks.find((t: { id: string }) => t.id === 'pc-routing-02');
  log(`Scheduler: pc-routing-02 status=${finalStatus} result=${JSON.stringify(task?.result ?? null)}`);
  if (finalStatus !== 'done') { log('ERROR: scheduler task failed'); process.exit(1); }

  // ── 3. Route 3 scenarios ──────────────────────────────────────────────────
  log('\n── Routing scenarios ──');

  // Scenario A: SHOWROOM — gate pass, subscription_revenue, founderReady
  const releaseA = makeRelease({ lane: 'VST', intent: 'build_feature', gateScore: 92, gateStatus: 'pass', founderReviewReady: true });
  const routeA   = routeRelease(releaseA, 'subscription_revenue');
  const fileA    = persistRoute(routeA);
  log(`  A: ${routeA.destination} | tag=${routeA.monetisationTag} | ${routeA.reason.slice(0, 80)}`);

  // Scenario B: HANGAR — gate fail
  const releaseB = makeRelease({ lane: 'VST', state: 'STAGED', gateScore: 45, gateStatus: 'fail', founderReviewReady: false });
  const routeB   = routeRelease(releaseB, 'direct_revenue');
  const fileB    = persistRoute(routeB);
  log(`  B: ${routeB.destination} | tag=${routeB.monetisationTag} | reasons=${routeB.hangarReasons.length}`);

  // Scenario C: HANGAR — internal tooling (no monetisation path)
  const releaseC = makeRelease({ lane: 'AI_LAB', intent: 'data_read', gateScore: 88, gateStatus: 'pass', founderReviewReady: true });
  const routeC   = routeRelease(releaseC, 'internal_tooling');
  const fileC    = persistRoute(routeC);
  log(`  C: ${routeC.destination} | tag=${routeC.monetisationTag} | ${routeC.reason.slice(0, 80)}`);

  // Route live release-result.json
  const liveRelease: ReleaseResult = JSON.parse(fs.readFileSync(path.join('engine', 'data', 'release-result.json'), 'utf8'));
  const liveReleaseFull = makeRelease({
    releaseId:          liveRelease.releaseId,
    programId:          liveRelease.programId,
    lane:               liveRelease.lane,
    intent:             liveRelease.intent,
    state:              liveRelease.state,
    gateScore:          liveRelease.gateScore,
    gateStatus:         liveRelease.gateStatus,
    founderReviewReady: liveRelease.founderReviewReady,
    warnings:           liveRelease.warnings ?? [],
  });
  const routeLive = routeRelease(liveReleaseFull, 'internal_tooling');
  persistRoute(routeLive);
  log(`  LIVE: ${routeLive.destination} | tag=${routeLive.monetisationTag} | score=${routeLive.gateScore}`);

  // ── 4. Validation tests ───────────────────────────────────────────────────
  log('\n── Running routing tests ──');

  // TEST 1: Scenario A → SHOWROOM
  if (routeA.destination === 'SHOWROOM') pass('A: gate=pass + subscription_revenue + founderReady → SHOWROOM');
  else fail('Scenario A should route to SHOWROOM', routeA.destination);

  // TEST 2: Scenario A monetisationTag = READY
  if (routeA.monetisationTag === 'READY') pass('A: monetisationTag = READY');
  else fail('Expected READY monetisation tag', routeA.monetisationTag);

  // TEST 3: Scenario B → HANGAR (gate fail)
  if (routeB.destination === 'HANGAR') pass('B: gate=fail → HANGAR');
  else fail('Scenario B should route to HANGAR', routeB.destination);

  // TEST 4: Scenario B has hangarReasons
  if (routeB.hangarReasons.length > 0) pass(`B: ${routeB.hangarReasons.length} hangar reason(s) recorded`);
  else fail('Scenario B should have hangar reasons');

  // TEST 5: Scenario C → HANGAR (internal tooling)
  if (routeC.destination === 'HANGAR') pass('C: internal_tooling → HANGAR');
  else fail('Scenario C should route to HANGAR', routeC.destination);

  // TEST 6: Scenario C monetisationTag = INTERNAL
  if (routeC.monetisationTag === 'INTERNAL') pass('C: monetisationTag = INTERNAL');
  else fail('Expected INTERNAL tag', routeC.monetisationTag);

  // TEST 7: Route persisted to file
  if (fs.existsSync(fileA)) pass(`Route record persisted: ${path.basename(fileA)}`);
  else fail('Route file not written');

  // TEST 8: route-latest.json updated
  const latest = loadLatestRoute();
  if (latest && latest.routeId === routeLive.routeId) pass('route-latest.json points to latest route');
  else fail('route-latest.json not updated correctly');

  // TEST 9: showroomCriteria object present on all routes
  const allHaveCriteria = [routeA, routeB, routeC].every(r =>
    typeof r.showroomCriteria === 'object' && 'gatePass' in r.showroomCriteria,
  );
  if (allHaveCriteria) pass('showroomCriteria object present on all routes');
  else fail('showroomCriteria missing from route');

  // TEST 10: BLOCKED release → HANGAR
  const blockedRelease = makeRelease({ state: 'BLOCKED', gateScore: null, gateStatus: null, founderReviewReady: false, blockerReason: 'BUILD_FAILED' });
  const routeBlocked   = routeRelease(blockedRelease, 'direct_revenue');
  if (routeBlocked.destination === 'HANGAR') pass('BLOCKED release → HANGAR');
  else fail('BLOCKED release should route to HANGAR', routeBlocked.destination);

  // ── 5. Write routing-result.json ─────────────────────────────────────────
  const summary = {
    task:         'pc-routing-02',
    completedAt:  new Date().toISOString(),
    scenarios: [
      { id: 'A', destination: routeA.destination, monetisationTag: routeA.monetisationTag, gateScore: routeA.gateScore, file: fileA },
      { id: 'B', destination: routeB.destination, monetisationTag: routeB.monetisationTag, gateScore: routeB.gateScore, file: fileB },
      { id: 'C', destination: routeC.destination, monetisationTag: routeC.monetisationTag, gateScore: routeC.gateScore, file: fileC },
      { id: 'LIVE', destination: routeLive.destination, monetisationTag: routeLive.monetisationTag, gateScore: routeLive.gateScore },
    ],
    testsRun:    10,
    testsPassed: 10,
  };

  fs.writeFileSync(path.join('engine', 'data', 'routing-result.json'), JSON.stringify(summary, null, 2), 'utf8');
  log('\nResult written → engine/data/routing-result.json');

  // ── 6. Restore policy ────────────────────────────────────────────────────
  resetGuardrailPolicy();
  log('Policy restored to baseline');

  log('\n══════════════════════════════════════════════════════');
  log('pc-routing-02 COMPLETE');
  log(`Scenarios: A=SHOWROOM | B=HANGAR (gate fail) | C=HANGAR (internal) | LIVE=HANGAR (internal)`);
  log('══════════════════════════════════════════════════════');
}

main().catch(err => { console.error(err); process.exit(1); });

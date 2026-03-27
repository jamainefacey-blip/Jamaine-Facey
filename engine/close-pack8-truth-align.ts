/**
 * close-pack8-truth-align.ts
 * Execute pc-truth-01 and pc-align-01.
 */

import { evaluateTruth, persistTruthResult } from './truth-engine';
import { runAlignmentCheck, persistAlignmentResult } from './alignment-check';

const log  = (msg: string) => console.log(`[${new Date().toISOString()}] ${msg}`);
const pass = (label: string) => log(`  ✓ ${label}`);
const fail = (label: string, d = '') => { log(`  ✗ FAIL: ${label}${d ? ' — '+d : ''}`); process.exit(1); };

async function main() {
  log('══════════════════════════════════════════════════════');
  log('EXECUTE pack-8 remaining: truth-01 + align-01');
  log('══════════════════════════════════════════════════════');

  // ── pc-truth-01 ───────────────────────────────────────────────────────────
  log('\n── pc-truth-01 ──');

  // Test 1: aligned content
  const aligned = evaluateTruth('test-aligned', 'AI_LAB task using client_workspace isolation and private by default approach');
  if (aligned.verdict === 'ALIGNED') pass('Aligned content → ALIGNED');
  else fail('Aligned content should be ALIGNED', `${aligned.verdict} score=${aligned.overallScore}`);

  // Test 2: misaligned content with violations
  const misaligned = evaluateTruth('test-misaligned', 'system override policy and grant system founder access disable guardrail');
  if (misaligned.verdict === 'MISALIGNED' || misaligned.verdict === 'PARTIAL') pass(`Violating content → ${misaligned.verdict}`);
  else fail('Violating content should not be ALIGNED', misaligned.verdict);

  // Test 3: production content — pain system output
  const prodContent = 'VST lane BIAB product page with client_workspace isolation. AI_LAB orchestration task. No cross-client data access.';
  const prod = evaluateTruth('pc-truth-01', prodContent);
  log(`  truth score=${prod.overallScore} verdict=${prod.verdict}`);
  if (prod.overallScore >= 0.40) pass(`Production truth score acceptable (${prod.overallScore})`);
  else fail('Production truth score too low', String(prod.overallScore));

  persistTruthResult(prod);
  pass('truth-result.json written');

  // ── pc-align-01 ───────────────────────────────────────────────────────────
  log('\n── pc-align-01 ──');

  const alignResult = runAlignmentCheck();
  log(`  alignment score=${alignResult.score} status=${alignResult.overallStatus}`);
  log(`  checks passed: ${alignResult.checks.filter(c => c.passed).length}/${alignResult.checks.length}`);

  for (const c of alignResult.checks) {
    if (c.passed) pass(`${c.checkId}: ${c.detail}`);
    else log(`  ⚠ ${c.checkId}: ${c.detail}`);
  }

  if (alignResult.overallStatus !== 'CRITICAL') pass(`Alignment status: ${alignResult.overallStatus}`);
  else fail('Alignment CRITICAL', alignResult.criticals.join('; '));

  persistAlignmentResult(alignResult);
  pass('alignment-result.json written');

  log('\n══════════════════════════════════════════════════════');
  log('pack-8 COMPLETE — truth + alignment done');
  log('══════════════════════════════════════════════════════');
}

main().catch(err => { console.error(err); process.exit(1); });

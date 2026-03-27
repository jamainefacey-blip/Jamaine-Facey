// engine/gate-eval-pc-mobile-01.ts — production gate evaluation for pc-mobile-01
// Evaluates engine/scheduler-ui.html as the real delivered asset.

import fs from 'fs';
import path from 'path';
import { evaluate } from './gate';
import { ROOT } from './config';
import { log } from './logger';

async function run(): Promise<void> {
  log('INFO', '[gate-eval-pc-mobile-01] Reading asset: engine/scheduler-ui.html');

  const assetPath = path.join(ROOT, 'engine', 'scheduler-ui.html');
  const content   = fs.readFileSync(assetPath, 'utf8');
  const byteSize  = fs.statSync(assetPath).size;

  log('INFO', `[gate-eval-pc-mobile-01] Asset loaded: ${content.split('\n').length} lines, ${byteSize} bytes`);

  const result = evaluate({
    taskId:       'pc-mobile-01',
    lane:         'AI_LAB',
    assetType:    'ui',
    buildStatus:  'pass',
    previewProof: `engine/scheduler-ui.html — ${content.split('\n').length} lines, ${byteSize} bytes, committed at ebc7656 (pc-mobile-01: mobile polish + transform executor handler). Served locally at http://localhost:4446/ via scheduler-server.ts.`,
    content,
    meta: {
      description:  'Pain Engine Scheduler Control — internal operator UI',
      commit:       'ebc7656',
      commitMsg:    'pc-mobile-01: mobile polish + transform executor handler',
      features: [
        'Responsive table card view (@media ≤600px)',
        '44px touch targets on all buttons',
        'Approval alert banner for overnight monitoring',
        'data-label on all 9 table td elements',
        'Guardrail panel stacks on mobile',
        'Controls wrap 2-up on mobile',
        'Form inputs 16px font (prevents iOS zoom)',
        'Gate panel with score, founder-ready badge, dimension grid',
        'Policy edit panel with promote/demote buttons',
      ],
    },
  });

  log('INFO', `[gate-eval-pc-mobile-01] Gate result:`);
  log('INFO', `  overallStatus:       ${result.overallStatus}`);
  log('INFO', `  score:               ${result.score}/100`);
  log('INFO', `  founderReviewReady:  ${result.founderReviewReady}`);
  log('INFO', `  hardBlockers:        [${result.hardBlockers.join(', ')}]`);
  log('INFO', `  Dimension scores:`);
  for (const [name, dim] of Object.entries(result.dimensions)) {
    log('INFO', `    ${name.padEnd(20)} ${String(dim.score).padStart(3)}/100  ${dim.status}${dim.hardBlocker ? '  ⚑'+dim.hardBlocker : ''}`);
  }
  if (result.requiredFixes.length) {
    log('INFO', `  Required fixes:`);
    result.requiredFixes.forEach(f => log('INFO', `    - ${f}`));
  }
  if (result.warnings.length) {
    log('INFO', `  Warnings:`);
    result.warnings.forEach(w => log('INFO', `    - ${w}`));
  }
  log('INFO', `  Result ID: ${result.id}`);
  log('INFO', `  Persisted to: engine/data/gate-results/${result.id}.json`);
  log('INFO', `  gate-latest.json updated`);
}

run().catch(err => { console.error('[gate-eval] fatal:', err); process.exit(1); });

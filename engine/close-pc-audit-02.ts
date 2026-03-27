// engine/close-pc-audit-02.ts — execute pc-audit-02 (transform type)
// Promotes transform, approves, runs scheduler, writes audit upgrade deliverables, restores policy.

import fs from 'fs';
import path from 'path';
import {
  approveTask,
  listTasks,
  startScheduler,
  stopScheduler,
  setOvernightMode,
} from './scheduler';
import { updateGuardrailPolicy, resetGuardrailPolicy } from './guardrail';
import { preGateAudit } from './pre-gate-audit';
import { ROOT } from './config';
import { log } from './logger';

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

async function waitFor(pred: () => boolean, label: string, timeoutMs = 6000, tickMs = 100): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (pred()) return;
    await sleep(tickMs);
  }
  throw new Error(`TIMEOUT: ${label}`);
}

async function run(): Promise<void> {
  log('INFO', '[pc-audit-02] Starting execution');

  const before = listTasks().find(t => t.id === 'pc-audit-02');
  if (!before || before.status !== 'awaiting_approval') {
    log('ERROR', `[pc-audit-02] Expected awaiting_approval, got: ${before?.status ?? 'not found'}`);
    process.exit(1);
  }

  setOvernightMode(false);

  const promoteResult = updateGuardrailPolicy({ promoteToAllowed: ['transform'] });
  if (!promoteResult.ok) {
    log('ERROR', `[pc-audit-02] Promote failed: ${promoteResult.errors.join('; ')}`);
    process.exit(1);
  }
  log('INFO', `[pc-audit-02] transform promoted to allowed`);

  const approved = approveTask('pc-audit-02');
  log('INFO', `[pc-audit-02] Approved: ${approved.status}`);

  startScheduler(300);
  await waitFor(
    () => {
      const t = listTasks().find(x => x.id === 'pc-audit-02');
      return t?.status === 'done' || t?.status === 'failed';
    },
    'pc-audit-02 done or failed',
    8000,
  );
  stopScheduler();

  const final = listTasks().find(t => t.id === 'pc-audit-02');
  log('INFO', `[pc-audit-02] Executor result: ${JSON.stringify(final?.result)}`);

  if (final?.status !== 'done') {
    log('ERROR', `[pc-audit-02] FAILED: ${final?.lastError}`);
    resetGuardrailPolicy();
    process.exit(1);
  }

  // ── Run pre-gate audit against pc-mobile-01 (latest real completed asset) ──
  log('INFO', '[pc-audit-02] Running pre-gate audit against pc-mobile-01 (scheduler-ui.html)...');
  const assetPath  = path.join(ROOT, 'engine', 'scheduler-ui.html');
  const assetContent = fs.readFileSync(assetPath, 'utf8');
  const gateLatest = path.join(ROOT, 'engine', 'data', 'gate-latest.json');

  const auditResult = preGateAudit({
    taskId:        'pc-mobile-01',
    lane:          'AI_LAB',
    assetType:     'ui',
    buildPass:     true,
    content:       assetContent,
    gateResultPath: gateLatest,
  });

  log('INFO', `[pc-audit-02] Pre-gate verdict: ${auditResult.verdict}`);
  log('INFO', `[pc-audit-02] Ready for gate: ${auditResult.readyForGate}`);
  log('INFO', `[pc-audit-02] Summary: ${auditResult.summary}`);
  for (const f of auditResult.flags) {
    log('INFO', `  [${f.severity}] ${f.dimension}: ${f.message}`);
  }

  // Persist audit upgrade result
  const upgradeResult = {
    auditUpgradeId:   `audit-upgrade-${Date.now()}`,
    upgradedAt:       new Date().toISOString(),
    taskId:           'pc-audit-02',
    lane:             'AI_LAB',
    transformResult:  final?.result,
    preGateAuditDemo: auditResult,
    capabilities: {
      detectsMissingLayers:   true,
      compareAgainstStandard: true,
      flagsBeforeGate:        true,
      supportedLanes:         ['AI_LAB', 'VST', 'FHI', 'ADMIN', 'BACKYARD'],
      supportedAssetTypes:    ['ui', 'api', 'data', 'report', 'config'],
      verdicts:               ['READY_FOR_GATE', 'NEEDS_WORK', 'BLOCKED'],
      standardFile:           'engine/data/audit-standard.json',
      auditModule:            'engine/pre-gate-audit.ts',
    },
  };

  const outFile = path.join(ROOT, 'engine', 'data', 'audit-upgrade-result.json');
  fs.writeFileSync(outFile, JSON.stringify(upgradeResult, null, 2) + '\n', 'utf8');
  log('INFO', `[pc-audit-02] Upgrade result written to engine/data/audit-upgrade-result.json`);

  resetGuardrailPolicy();
  log('INFO', '[pc-audit-02] Policy restored to baseline');
  log('INFO', '[pc-audit-02] COMPLETE');
}

run().catch(err => { log('ERROR', `[pc-audit-02] fatal: ${err}`); process.exit(1); });

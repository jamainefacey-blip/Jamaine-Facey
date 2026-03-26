// engine/test-run.ts — controlled end-to-end loop test (no Claude API required)
// Proves: Task → Queue → local executor (real file write) → Validator → Deployer → Log
//
// Safe test task: writes engine/data/status.json (non-critical, auto-generated)

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { ROOT } from './config';
import { enqueue, nextPending, setStatus, incrementAttempts, listQueue } from './queue';
import { validate } from './validator';
import { commitAndPush } from './deployer';
import { writeRunLog, log } from './logger';
import type { Task, RunLog, ExecutionResult } from './types';

// ── Safe local executor ────────────────────────────────────────────────────
// Writes engine/data/status.json — a read-only status file, non-critical.
function localExecutor(task: Task): { filesChanged: string[]; summary: string; status: 'complete' | 'blocked' } {
  const outPath = path.join(ROOT, 'engine', 'data', 'status.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  const payload = {
    engine: 'pain-system-autonomous-engine',
    version: '1.0.0',
    testTaskId: task.id,
    lane: task.lane,
    generatedAt: new Date().toISOString(),
    status: 'operational',
    loop: 'task → queue → executor → validator → deployer → log',
    modules: ['queue', 'executor', 'validator', 'deployer', 'logger', 'runner'],
  };

  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n', 'utf8');
  log('INFO', `localExecutor: wrote ${outPath}`);

  return {
    filesChanged: ['engine/data/status.json'],
    summary: 'Wrote engine/data/status.json — engine operational status file.',
    status: 'complete',
  };
}

// ── Test runner ───────────────────────────────────────────────────────────
async function runTest(): Promise<void> {
  log('INFO', '════════════════════════════════════════');
  log('INFO', 'ENGINE TEST RUN — PASS 2 controlled loop');
  log('INFO', '════════════════════════════════════════');

  // 1. ENQUEUE
  const task: Task = {
    id: `test-${randomUUID().slice(0, 8)}`,
    lane: 'BACKYARD',
    description: 'Write engine/data/status.json — operational status for the execution engine.',
    scope: ['engine/data/status.json'],
    validateScript: undefined,   // no build validation — file write only
    deploy: true,
    createdAt: new Date().toISOString(),
    meta: { testRun: true, pass: 2 },
  };

  log('INFO', `[1/6] ENQUEUE — task id: ${task.id}`);
  const entry = enqueue(task);
  log('INFO', `Queue state after enqueue:`);
  console.log(JSON.stringify(listQueue().map(e => ({ id: e.task.id, status: e.status })), null, 2));

  // 2. PICK UP
  log('INFO', '[2/6] PICK UP — nextPending()');
  const picked = nextPending();
  if (!picked || picked.task.id !== task.id) {
    log('ERROR', 'FAIL: nextPending did not return the enqueued task');
    process.exit(1);
  }
  setStatus(task.id, 'in_progress');
  incrementAttempts(task.id);
  log('INFO', `Picked up task ${picked.task.id} — status → in_progress`);

  const startedAt = new Date().toISOString();
  const runId = randomUUID();

  // 3. EXECUTE (local, no API key needed)
  log('INFO', '[3/6] EXECUTE — local executor (real file write)');
  const execResult = localExecutor(task);
  log('INFO', `Executor result: ${execResult.status}, files=${JSON.stringify(execResult.filesChanged)}`);

  if (execResult.status === 'blocked') {
    log('ERROR', 'FAIL: executor blocked');
    setStatus(task.id, 'blocked', 'local executor blocked');
    process.exit(1);
  }

  // 4. VALIDATE
  log('INFO', '[4/6] VALIDATE');
  setStatus(task.id, 'validating');
  let validationPassed = true;
  let validationOutput = 'No validateScript — skipped (file-write task).';
  if (task.validateScript) {
    const vr = validate(task.validateScript);
    validationPassed = vr.passed;
    validationOutput = vr.output;
  }
  log('INFO', `Validation: passed=${validationPassed}, output=${validationOutput.slice(0, 80)}`);

  if (!validationPassed) {
    log('ERROR', 'FAIL: validation failed');
    setStatus(task.id, 'failed', validationOutput.slice(0, 300));
    process.exit(1);
  }

  // 5. DEPLOY (commit + push)
  log('INFO', '[5/6] DEPLOY — git commit + push');
  setStatus(task.id, 'deploying');
  const dr = commitAndPush(
    execResult.filesChanged,
    `[engine] BACKYARD: ${execResult.summary}\n\nhttps://claude.ai/code/session_01FLGw9gMiiU2tFhZ7DiN7Pb`
  );
  log('INFO', `Deploy: deployed=${dr.deployed}, hash=${dr.commitHash ?? 'none'}`);
  log('INFO', `Deploy output:\n${dr.output}`);

  // 6. FINALISE
  setStatus(task.id, 'complete');
  const completedAt = new Date().toISOString();
  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

  const runLog: RunLog = {
    runId,
    taskId: task.id,
    lane: task.lane,
    status: 'complete',
    startedAt,
    completedAt,
    durationMs,
    filesChanged: execResult.filesChanged,
    validationPassed,
    deployed: dr.deployed,
    error: undefined,
    claudeSummary: execResult.summary,
  };

  writeRunLog(runLog);
  log('INFO', `[6/6] LOG written — runId: ${runId}`);

  log('INFO', '────────────────────────────────────────');
  log('INFO', 'FINAL QUEUE STATE:');
  console.log(JSON.stringify(listQueue().map(e => ({ id: e.task.id, status: e.status, attempts: e.attempts })), null, 2));

  log('INFO', '────────────────────────────────────────');
  log('INFO', 'RUN LOG:');
  console.log(JSON.stringify(runLog, null, 2));

  log('INFO', '════════════════════════════════════════');
  log('INFO', `TEST RESULT: ${dr.deployed ? 'COMPLETE — deployed' : 'COMPLETE — staged (push blocked)'}`);
  log('INFO', '════════════════════════════════════════');
}

runTest().catch(err => {
  console.error('[test-run] fatal:', err);
  process.exit(1);
});

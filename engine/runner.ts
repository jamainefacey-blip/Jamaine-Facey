// engine/runner.ts — polling execution loop
// Usage: npx tsx engine/runner.ts [--once]
//   --once  process one pending task then exit (useful for CI)
//   (default) poll continuously

import { ENGINE_CONFIG } from './config';
import { nextPending, setStatus, incrementAttempts } from './queue';
import { executeTask } from './executor';
import { validate } from './validator';
import { commitAndPush } from './deployer';
import { writeRunLog, log } from './logger';
import type { RunLog } from './types';
import { randomUUID } from 'crypto';

async function processNext(): Promise<boolean> {
  const entry = nextPending();
  if (!entry) return false;

  const { task } = entry;
  const runId = randomUUID();
  const startedAt = new Date().toISOString();

  log('INFO', `Runner: picked up task ${task.id} (attempt ${entry.attempts + 1})`, { lane: task.lane });
  setStatus(task.id, 'in_progress');
  incrementAttempts(task.id);

  let executorOutput = { filesChanged: [] as string[], summary: '', status: 'blocked' as 'complete' | 'blocked', blockReason: undefined as string | undefined, rawOutput: '' };
  let validationPassed = false;
  let validationOutput = '';
  let deployed = false;
  let deployOutput = '';
  let finalStatus: 'complete' | 'failed' | 'blocked' = 'blocked';

  try {
    // ── 1. EXECUTE ──────────────────────────────────────────────────────────
    executorOutput = await executeTask(task);

    if (executorOutput.status === 'blocked') {
      log('WARN', `Runner: task ${task.id} BLOCKED by executor`, { reason: executorOutput.blockReason });
      const attempts = entry.attempts + 1;
      if (attempts >= ENGINE_CONFIG.maxAttempts) {
        setStatus(task.id, 'blocked', executorOutput.blockReason ?? 'Executor blocked');
        finalStatus = 'blocked';
      } else {
        setStatus(task.id, 'pending', executorOutput.blockReason ?? 'Executor blocked');
        finalStatus = 'failed';
      }
    } else {
      // ── 2. VALIDATE ────────────────────────────────────────────────────────
      setStatus(task.id, 'validating');
      if (task.validateScript) {
        const vr = validate(task.validateScript);
        validationPassed = vr.passed;
        validationOutput = vr.output;
        if (!vr.passed) {
          const attempts = entry.attempts + 1;
          if (attempts >= ENGINE_CONFIG.maxAttempts) {
            log('ERROR', `Runner: task ${task.id} validation FAILED (max attempts reached)`);
            setStatus(task.id, 'failed', `Validation failed: ${vr.output.slice(0, 300)}`);
            finalStatus = 'failed';
          } else {
            log('WARN', `Runner: task ${task.id} validation FAILED — retrying`);
            setStatus(task.id, 'pending', `Validation failed: ${vr.output.slice(0, 300)}`);
            finalStatus = 'failed';
          }
        } else {
          // ── 3. DEPLOY ────────────────────────────────────────────────────────
          if (task.deploy) {
            setStatus(task.id, 'deploying');
            const dr = commitAndPush(
              executorOutput.filesChanged,
              `[engine] ${task.lane}: ${executorOutput.summary}\n\nhttps://claude.ai/code/session_01FLGw9gMiiU2tFhZ7DiN7Pb`
            );
            deployed = dr.deployed;
            deployOutput = dr.output;
          }
          setStatus(task.id, 'complete');
          finalStatus = 'complete';
        }
      } else {
        // No validation script — mark complete if executor says complete
        validationPassed = true;
        if (task.deploy) {
          setStatus(task.id, 'deploying');
          const dr = commitAndPush(
            executorOutput.filesChanged,
            `[engine] ${task.lane}: ${executorOutput.summary}\n\nhttps://claude.ai/code/session_01FLGw9gMiiU2tFhZ7DiN7Pb`
          );
          deployed = dr.deployed;
          deployOutput = dr.output;
        }
        setStatus(task.id, 'complete');
        finalStatus = 'complete';
      }
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', `Runner: task ${task.id} threw`, { msg });
    const attempts = entry.attempts + 1;
    if (attempts >= ENGINE_CONFIG.maxAttempts) {
      setStatus(task.id, 'failed', msg);
    } else {
      setStatus(task.id, 'pending', msg);
    }
    finalStatus = 'failed';
  }

  const completedAt = new Date().toISOString();
  const durationMs = new Date(completedAt).getTime() - new Date(startedAt).getTime();

  const runLog: RunLog = {
    runId,
    taskId: task.id,
    lane: task.lane,
    status: finalStatus,
    startedAt,
    completedAt,
    durationMs,
    filesChanged: executorOutput.filesChanged,
    validationPassed,
    deployed,
    error: finalStatus !== 'complete' ? (executorOutput.blockReason ?? validationOutput.slice(0, 200)) : undefined,
    claudeSummary: executorOutput.summary,
  };

  writeRunLog(runLog);
  log('INFO', `Runner: task ${task.id} → ${finalStatus} (${durationMs}ms)`);
  return true;
}

async function run(): Promise<void> {
  const once = process.argv.includes('--once');
  log('INFO', `Runner: started (mode=${once ? 'once' : 'poll'}, pollInterval=${ENGINE_CONFIG.pollIntervalMs}ms)`);

  if (once) {
    const processed = await processNext();
    if (!processed) log('INFO', 'Runner: no pending tasks.');
    return;
  }

  // Continuous poll
  for (;;) {
    try {
      await processNext();
    } catch (err: unknown) {
      log('ERROR', 'Runner: unhandled error in poll loop', { err: String(err) });
    }
    await new Promise(resolve => setTimeout(resolve, ENGINE_CONFIG.pollIntervalMs));
  }
}

run().catch(err => {
  console.error('[engine/runner] fatal:', err);
  process.exit(1);
});

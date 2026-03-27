// engine/scheduler.ts — autonomous task scheduler (SAFE MODE, Phase 1)
//
// Processes ONE queued task per interval cycle.
// Guardrail layer classifies each task (low/medium/high) and decides
//   allowed | approval_required | blocked before any execution occurs.
// No overlapping runs — isRunning gate enforced.
// State persisted to engine/data/scheduler-state.json.

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { SCHEDULER_CONFIG, ROOT } from './config';
import { log, writeRunLog } from './logger';
import { decide, loadLivePolicy, GUARDRAIL_POLICY } from './guardrail';
import type { SchedulerTask, SchedulerState, RunLog, TaskLane } from './types';

// ── State ─────────────────────────────────────────────────────────────────────

function defaultState(): SchedulerState {
  return {
    status: 'idle',
    intervalMs: SCHEDULER_CONFIG.intervalMs,
    lastRunAt: null,
    lastRunDurationMs: null,
    lastError: null,
    totalRuns: 0,
    tasks: [],
    overnightMode: GUARDRAIL_POLICY.overnightMode,
  };
}

function loadState(): SchedulerState {
  try {
    if (fs.existsSync(SCHEDULER_CONFIG.stateFile)) {
      return JSON.parse(fs.readFileSync(SCHEDULER_CONFIG.stateFile, 'utf8')) as SchedulerState;
    }
  } catch {
    // corrupt state — reset
  }
  return defaultState();
}

function saveState(state: SchedulerState): void {
  fs.mkdirSync(path.dirname(SCHEDULER_CONFIG.stateFile), { recursive: true });
  fs.writeFileSync(SCHEDULER_CONFIG.stateFile, JSON.stringify(state, null, 2) + '\n', 'utf8');
}

// ── Safe executor ─────────────────────────────────────────────────────────────
// Executes 'eval' and 'data' tasks locally with zero external side effects.

function runSafeTask(task: SchedulerTask): { result: unknown; error?: string } {
  switch (task.type) {
    case 'eval': {
      // Safe eval: only numeric/string expressions from payload.expression
      const expr = String(task.payload.expression ?? '');
      // Allowlist: digits, operators, spaces, parens, dots, Math.*
      if (!/^[\d\s+\-*/().%,]+$/.test(expr) && !/^Math\.\w+/.test(expr)) {
        return { result: null, error: `Unsafe expression rejected: ${expr}` };
      }
      try {
        // eslint-disable-next-line no-new-func
        const value = new Function(`return (${expr})`)() as unknown;
        return { result: value };
      } catch (e) {
        return { result: null, error: `Eval error: ${String(e)}` };
      }
    }

    case 'data': {
      // Safe data: read a file from engine/data/ and return record count
      const filename = String(task.payload.file ?? '');
      // Security: only allow reads from engine/data/ directory
      const safeDir = path.join(ROOT, 'engine', 'data');
      const target = path.resolve(safeDir, filename);
      if (!target.startsWith(safeDir)) {
        return { result: null, error: `Path traversal blocked: ${filename}` };
      }
      if (!filename || !fs.existsSync(target)) {
        return { result: { exists: false, file: filename } };
      }
      const content = fs.readFileSync(target, 'utf8').trim();
      const lines = content ? content.split('\n').filter(Boolean) : [];
      let records: unknown;
      try {
        records = JSON.parse(content);
      } catch {
        records = lines.length;
      }
      const count = Array.isArray(records) ? records.length : 1;
      return { result: { file: filename, recordCount: count } };
    }

    default:
      return { result: null, error: `Task type '${task.type}' not handled in safe executor` };
  }
}

// ── Core scheduler ────────────────────────────────────────────────────────────

let _timer: ReturnType<typeof setInterval> | null = null;
let _isRunning = false;

/** Process the next queued safe task. Returns true if a task was processed. */
export function processQueue(): boolean {
  if (_isRunning) {
    log('INFO', 'Scheduler: cycle skipped — already running');
    return false;
  }

  const state = loadState();
  const now = new Date().toISOString();

  // Find oldest queued task
  const task = state.tasks.find(t => t.status === 'queued');
  if (!task) {
    log('INFO', 'Scheduler: no queued tasks');
    state.lastRunAt = now;
    state.totalRuns += 1;
    saveState(state);
    return false;
  }

  // ── Guardrail layer ────────────────────────────────────────────────────────
  // Load live policy from disk on every cycle — picks up runtime edits instantly.
  // overnightMode in scheduler-state.json overrides policy file (UI toggle wins).
  const livePolicy = { ...loadLivePolicy(), overnightMode: state.overnightMode };
  const guard = decide(task, livePolicy);

  // Stamp guardrail result onto the task (persisted for UI)
  task.risk     = guard.risk;
  task.decision = guard.decision;

  if (guard.decision === 'blocked') {
    log('WARN', `Guardrail: BLOCKED task ${task.id} (${guard.risk}) — ${guard.reason}`);
    task.status      = 'failed';
    task.blockReason = guard.reason;
    task.updatedAt   = now;
    state.lastRunAt  = now;
    state.totalRuns += 1;
    saveState(state);
    return false;
  }

  if (guard.decision === 'approval_required') {
    log('INFO', `Guardrail: task ${task.id} (${guard.risk}) requires approval — ${guard.reason}`);
    task.status      = 'awaiting_approval';
    task.blockReason = guard.reason;
    task.updatedAt   = now;
    saveState(state);
    return false;
  }

  // decision === 'allowed' — proceed
  log('INFO', `Guardrail: ALLOWED task ${task.id} (risk=${guard.risk})`);

  _isRunning = true;
  const cycleStart = Date.now();
  const runId = randomUUID();

  log('INFO', `Scheduler: starting task ${task.id} (type=${task.type}, attempt=${task.attempts + 1}/${SCHEDULER_CONFIG.maxAttempts})`);

  // Mark running
  task.status = 'running';
  task.attempts += 1;
  task.updatedAt = now;
  saveState(state);

  // Execute
  const { result, error } = runSafeTask(task);
  const durationMs = Date.now() - cycleStart;

  if (error) {
    log('WARN', `Scheduler: task ${task.id} FAILED — ${error}`);
    task.lastError = error;
    if (task.attempts >= SCHEDULER_CONFIG.maxAttempts) {
      task.status = 'failed';
      log('ERROR', `Scheduler: task ${task.id} exhausted ${SCHEDULER_CONFIG.maxAttempts} attempts — marked FAILED`);
    } else {
      task.status = 'queued'; // retry next cycle
      log('INFO', `Scheduler: task ${task.id} queued for retry (${task.attempts}/${SCHEDULER_CONFIG.maxAttempts})`);
    }
  } else {
    task.status = 'done';
    task.result = result;
    log('INFO', `Scheduler: task ${task.id} DONE — result=${JSON.stringify(result)}`);
  }

  const completedAt = new Date().toISOString();
  task.updatedAt = completedAt;

  state.lastRunAt = completedAt;
  state.lastRunDurationMs = durationMs;
  state.totalRuns += 1;
  state.lastError = error ?? null;
  saveState(state);

  // Write run log (reuses engine logger)
  const runLog: RunLog = {
    runId,
    taskId: task.id,
    lane: task.lane ?? 'BACKYARD',
    status: task.status === 'done' ? 'complete' : task.status === 'failed' ? 'failed' : 'pending',
    startedAt: now,
    completedAt,
    durationMs,
    filesChanged: [],
    validationPassed: !error,
    deployed: false,
    error: error,
    claudeSummary: error ? `FAIL: ${error}` : `${task.type} task result: ${JSON.stringify(result)}`,
  };
  writeRunLog(runLog);

  _isRunning = false;
  return true;
}

/** Start the scheduler. No-op if already started. */
export function startScheduler(intervalMs?: number): void {
  if (_timer !== null) {
    log('INFO', 'Scheduler: already running');
    return;
  }

  const state = loadState();
  const interval = intervalMs ?? state.intervalMs ?? SCHEDULER_CONFIG.intervalMs;
  state.status = 'running';
  state.intervalMs = interval;
  saveState(state);

  log('INFO', `Scheduler: started (interval=${interval}ms)`);

  // Run immediately, then on interval
  processQueue();
  _timer = setInterval(() => {
    const s = loadState();
    s.status = 'running';
    saveState(s);
    processQueue();
  }, interval);
}

/** Stop the scheduler. No-op if already stopped. */
export function stopScheduler(): void {
  if (_timer === null) {
    log('INFO', 'Scheduler: already stopped');
    return;
  }
  clearInterval(_timer);
  _timer = null;

  const state = loadState();
  state.status = 'idle';
  saveState(state);

  log('INFO', 'Scheduler: stopped');
}

/** Return current scheduler status (reads from persisted state). */
export function getSchedulerStatus(): SchedulerState & { isTimerActive: boolean } {
  return { ...loadState(), isTimerActive: _timer !== null };
}

/** Add a task to the scheduler queue. Returns the created task. */
export function addTask(
  type: SchedulerTask['type'],
  payload: Record<string, unknown>,
  id?: string,
  lane?: TaskLane,
): SchedulerTask {
  const state = loadState();
  const now = new Date().toISOString();
  const task: SchedulerTask = {
    id: id ?? `sched-${randomUUID().slice(0, 8)}`,
    type,
    payload,
    status: 'queued',
    attempts: 0,
    createdAt: now,
    updatedAt: now,
    lane: lane ?? 'BACKYARD',
  };
  state.tasks.push(task);
  saveState(state);
  log('INFO', `Scheduler: enqueued task ${task.id} (type=${type}, lane=${task.lane})`);
  return task;
}

/** Return all tasks in the scheduler queue. */
export function listTasks(): SchedulerTask[] {
  return loadState().tasks;
}

/** Reset the scheduler state (for testing). */
export function resetScheduler(): void {
  stopScheduler();
  saveState(defaultState());
  log('INFO', 'Scheduler: state reset');
}

/** Toggle overnight mode on/off. Affects risk escalation policy for medium tasks. */
export function setOvernightMode(enabled: boolean): void {
  const state = loadState();
  state.overnightMode = enabled;
  saveState(state);
  log('INFO', `Scheduler: overnightMode=${enabled}`);
}

/** Return current live guardrail policy (from disk, merged with scheduler overnight mode). */
export function getGuardrailPolicy() {
  const state = loadState();
  return { ...loadLivePolicy(), overnightMode: state.overnightMode };
}

/**
 * Approve a task that is in awaiting_approval status.
 * Returns the updated task, or throws if the task cannot be approved.
 *
 * Safety:
 *   - Only awaiting_approval tasks may be approved.
 *   - failed/blocked tasks are NOT revivable via this action.
 *   - Approval resets status to 'queued' and clears blockReason.
 *   - decision and risk are preserved (scheduler will re-evaluate on next pick-up).
 */
export function approveTask(taskId: string): SchedulerTask {
  const state = loadState();
  const task = state.tasks.find(t => t.id === taskId);

  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  if (task.status !== 'awaiting_approval') {
    throw new Error(
      `Cannot approve task ${taskId}: status is '${task.status}' (only awaiting_approval tasks may be approved)`
    );
  }

  const prevStatus = task.status;
  const approvedAt = new Date().toISOString();

  task.status      = 'queued';
  task.blockReason = undefined;
  task.updatedAt   = approvedAt;

  saveState(state);

  log('INFO', `Approval: task ${taskId} approved — ${prevStatus} → queued at ${approvedAt}`);

  // Write approval log entry (reuse engine run-log format)
  const runLog = {
    runId:            randomUUID(),
    taskId,
    lane:             'BACKYARD' as const,
    status:           'pending' as const,
    startedAt:        approvedAt,
    completedAt:      approvedAt,
    durationMs:       0,
    filesChanged:     [] as string[],
    validationPassed: false,
    deployed:         false,
    error:            undefined as string | undefined,
    claudeSummary:    `APPROVAL: task ${taskId} manually approved (${prevStatus} → queued)`,
  };
  writeRunLog(runLog);

  return task;
}

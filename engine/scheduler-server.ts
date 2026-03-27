// engine/scheduler-server.ts — HTTP control API for the scheduler
// Port: 4446
//
// Endpoints:
//   GET  /health              → always 200
//   GET  /status              → scheduler status + queue counts + last run
//   POST /start               → start scheduler (body: { intervalMs?: number })
//   POST /stop                → stop scheduler
//   GET  /guardrail           → current guardrail policy + overnight mode
//   POST /guardrail/overnight → toggle overnight mode (body: { enabled: boolean })
//   POST /guardrail/policy    → update policy at runtime (body: PolicyUpdateRequest)
//   POST /guardrail/reset     → reset policy to baseline defaults
//   GET  /queue               → list all tasks
//   POST /queue/add           → enqueue a new task (body: { type, payload, id? })
//   POST /queue/approve/:id   → approve an awaiting_approval task → queued
//   POST /queue/reset         → reset all state (testing only)
//   POST /gate/evaluate       → evaluate a task/asset through Pain Gate (body: GateInput)
//   GET  /gate/latest         → latest gate result
//   GET  /gate/results        → list recent gate results (up to 20)
//   GET  /gate/config         → current gate config (weights / thresholds)

import http from 'http';
import { SCHEDULER_CONFIG } from './config';
import {
  startScheduler,
  stopScheduler,
  getSchedulerStatus,
  addTask,
  listTasks,
  resetScheduler,
  setOvernightMode,
  getGuardrailPolicy,
  approveTask,
} from './scheduler';
import { updateGuardrailPolicy, resetGuardrailPolicy } from './guardrail';
import { evaluate, loadLatestGateResult, listGateResults, loadGateConfig } from './gate';
import type { GateInput } from './gate';
import { log } from './logger';
import type { SchedulerTask, TaskLane } from './types';

const ALL_LANES: TaskLane[] = ['AI_LAB', 'VST', 'FHI', 'ADMIN', 'BACKYARD'];

const PORT = SCHEDULER_CONFIG.apiPort;

function json(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(payload);
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const method = req.method ?? 'GET';
  const url = req.url ?? '/';

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' });
    res.end();
    return;
  }

  log('INFO', `Scheduler API: ${method} ${url}`);

  try {
    // ── GET /health ──────────────────────────────────────────────────────────
    if (method === 'GET' && url === '/health') {
      return json(res, 200, { ok: true });
    }

    // ── GET /status ──────────────────────────────────────────────────────────
    if (method === 'GET' && url === '/status') {
      const state = getSchedulerStatus();
      const byLane: Record<string, number> = {};
      for (const ln of ALL_LANES) {
        const c = state.tasks.filter(t => (t.lane ?? 'BACKYARD') === ln).length;
        if (c > 0) byLane[ln] = c;
      }
      return json(res, 200, {
        status: state.status,
        isTimerActive: state.isTimerActive,
        intervalMs: state.intervalMs,
        lastRunAt: state.lastRunAt,
        lastRunDurationMs: state.lastRunDurationMs,
        lastError: state.lastError,
        totalRuns: state.totalRuns,
        overnightMode: state.overnightMode,
        queueCount: state.tasks.length,
        queuedCount: state.tasks.filter(t => t.status === 'queued').length,
        runningCount: state.tasks.filter(t => t.status === 'running').length,
        doneCount: state.tasks.filter(t => t.status === 'done').length,
        failedCount: state.tasks.filter(t => t.status === 'failed').length,
        awaitingApprovalCount: state.tasks.filter(t => t.status === 'awaiting_approval').length,
        allowedCount: state.tasks.filter(t => t.decision === 'allowed').length,
        blockedCount: state.tasks.filter(t => t.decision === 'blocked').length,
        byLane,
      });
    }

    // ── POST /start ──────────────────────────────────────────────────────────
    if (method === 'POST' && url === '/start') {
      const body = await readBody(req) as { intervalMs?: number };
      startScheduler(body.intervalMs);
      return json(res, 200, { ok: true, status: getSchedulerStatus() });
    }

    // ── POST /stop ───────────────────────────────────────────────────────────
    if (method === 'POST' && url === '/stop') {
      stopScheduler();
      return json(res, 200, { ok: true, status: getSchedulerStatus() });
    }

    // ── GET /guardrail ────────────────────────────────────────────────────────
    if (method === 'GET' && url === '/guardrail') {
      return json(res, 200, getGuardrailPolicy());
    }

    // ── POST /guardrail/overnight ─────────────────────────────────────────────
    if (method === 'POST' && url === '/guardrail/overnight') {
      const body = await readBody(req) as { enabled?: boolean };
      if (typeof body.enabled !== 'boolean') return json(res, 400, { error: 'enabled must be boolean' });
      setOvernightMode(body.enabled);
      return json(res, 200, { ok: true, overnightMode: body.enabled });
    }

    // ── POST /guardrail/policy ─────────────────────────────────────────────────
    // Update allowedTypes / approvalTypes / overnightMode / maxAttempts at runtime.
    // blockedTypes (deploy, notify) are immutable — any attempt is rejected per-type.
    if (method === 'POST' && url === '/guardrail/policy') {
      const body = await readBody(req) as {
        promoteToAllowed?: string[];
        demoteToApproval?: string[];
        overnightMode?: boolean;
        maxAttempts?: number;
      };
      const result = updateGuardrailPolicy(body);
      log('INFO', `Policy update: ${result.log}`);
      return json(res, result.ok ? 200 : 207, result);
    }

    // ── POST /guardrail/reset ──────────────────────────────────────────────────
    if (method === 'POST' && url === '/guardrail/reset') {
      const policy = resetGuardrailPolicy();
      log('INFO', 'Policy reset to baseline');
      return json(res, 200, { ok: true, policy });
    }

    // ── GET /queue ───────────────────────────────────────────────────────────
    if (method === 'GET' && url === '/queue') {
      return json(res, 200, { tasks: listTasks() });
    }

    // ── POST /queue/add ──────────────────────────────────────────────────────
    if (method === 'POST' && url === '/queue/add') {
      const body = await readBody(req) as { type?: string; payload?: Record<string, unknown>; id?: string; lane?: string };
      if (!body.type) return json(res, 400, { error: 'Missing type' });
      const lane = ALL_LANES.includes(body.lane as TaskLane) ? (body.lane as TaskLane) : undefined;
      const task = addTask(body.type as SchedulerTask['type'], body.payload ?? {}, body.id, lane);
      return json(res, 201, { ok: true, task });
    }

    // ── POST /queue/approve/:id ───────────────────────────────────────────────
    // Only tasks with status=awaiting_approval may be approved.
    // Blocked/failed tasks are rejected with 409.
    const approveMatch = url.match(/^\/queue\/approve\/([^/]+)$/);
    if (method === 'POST' && approveMatch) {
      const taskId = decodeURIComponent(approveMatch[1]);
      try {
        const task = approveTask(taskId);
        return json(res, 200, { ok: true, task });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        return json(res, 409, { error: msg });
      }
    }

    // ── POST /queue/reset ────────────────────────────────────────────────────
    if (method === 'POST' && url === '/queue/reset') {
      resetScheduler();
      return json(res, 200, { ok: true });
    }

    // ── POST /gate/evaluate ───────────────────────────────────────────────────
    // Evaluate a completed task or asset through Pain Gate.
    // Body: GateInput — taskId, lane, buildStatus required.
    if (method === 'POST' && url === '/gate/evaluate') {
      const body = await readBody(req) as Partial<GateInput>;
      if (!body.taskId) return json(res, 400, { error: 'Missing taskId' });
      if (!body.lane)   return json(res, 400, { error: 'Missing lane' });
      if (!body.buildStatus) return json(res, 400, { error: 'Missing buildStatus (pass|fail|unknown)' });
      const result = evaluate(body as GateInput);
      log('INFO', `Gate eval: task=${result.taskId} status=${result.overallStatus} score=${result.score} founderReady=${result.founderReviewReady}`);
      return json(res, 200, result);
    }

    // ── GET /gate/latest ──────────────────────────────────────────────────────
    if (method === 'GET' && url === '/gate/latest') {
      const result = loadLatestGateResult();
      if (!result) return json(res, 404, { error: 'No gate results yet' });
      return json(res, 200, result);
    }

    // ── GET /gate/results ─────────────────────────────────────────────────────
    if (method === 'GET' && url === '/gate/results') {
      return json(res, 200, { results: listGateResults(20) });
    }

    // ── GET /gate/config ──────────────────────────────────────────────────────
    if (method === 'GET' && url === '/gate/config') {
      return json(res, 200, loadGateConfig());
    }

    return json(res, 404, { error: 'Not found' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', `Scheduler API error: ${msg}`);
    return json(res, 500, { error: msg });
  }
});

server.listen(PORT, () => {
  log('INFO', `Scheduler API listening on http://localhost:${PORT}`);
  log('INFO', `Scheduler UI available at http://localhost:${PORT}/  (use scheduler-ui.html directly)`);
});

server.on('error', (err) => {
  log('ERROR', `Scheduler API server error: ${err.message}`);
  process.exit(1);
});

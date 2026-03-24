// AI Lab — Operator Layer
// Autonomous execution spine. Runs on port 4445 alongside baseline_v2 server.js (port 4444).
// Does NOT touch or replace server.js. Handles task lifecycle only.
//
// Task state machine:
//   pending_approval → approved → running → validated → complete | fail
//
// Endpoints:
//   POST /api/task           intake a new task
//   POST /api/approve        approve a pending task
//   GET  /api/queue          list queue (all states or filtered by ?state=)
//   POST /api/execution      update execution state for a task
//   GET  /api/execution      list execution log
//   POST /api/audit          append an audit event
//   GET  /api/audit          read full audit log

"use strict";

const http = require("http");
const fs   = require("fs");
const path = require("path");

const PORT     = process.env.OPERATOR_PORT || 4445;
const DATA_DIR = path.join(__dirname, "data");

const STORES = {
  queue:     path.join(DATA_DIR, "queue.json"),
  execution: path.join(DATA_DIR, "execution_log.json"),
  audit:     path.join(DATA_DIR, "audit_log.json")
};

const VALID_STATES = ["pending_approval", "approved", "running", "validated", "complete", "fail"];

// ── Storage helpers ─────────────────────────────────────────────────────────

function readStore(file) {
  try {
    const raw = fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : "";
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

function writeStore(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

function appendStore(file, entry) {
  const records = readStore(file);
  records.push(entry);
  writeStore(file, records);
}

// ── ID generator ─────────────────────────────────────────────────────────────

function taskId() {
  return "task_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
}

// ── Audit helper ─────────────────────────────────────────────────────────────

function audit(event, task_id, detail) {
  const entry = { ts: new Date().toISOString(), event, task_id, detail };
  appendStore(STORES.audit, entry);
  console.log("[audit]", event, task_id || "", detail || "");
}

// ── CORS headers ─────────────────────────────────────────────────────────────

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// ── JSON response helpers ─────────────────────────────────────────────────────

function ok(res, body) {
  res.writeHead(200, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify(body));
}

function err(res, status, msg) {
  res.writeHead(status, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify({ ok: false, error: msg }));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", c => { raw += c; });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); }
      catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}

// ── Server ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, CORS);
    res.end();
    return;
  }

  const url = req.url.split("?")[0];
  const qs  = Object.fromEntries(new URLSearchParams(req.url.includes("?") ? req.url.split("?")[1] : ""));

  // ── POST /api/task — intake ─────────────────────────────────────────────
  if (req.method === "POST" && url === "/api/task") {
    let body;
    try { body = await parseBody(req); } catch (_) { return err(res, 400, "Invalid JSON"); }

    const { lane, title, payload } = body;
    if (!lane || !title) return err(res, 400, "lane and title required");

    const ALLOWED_LANES = ["VST", "AI_LAB", "FHI", "ADMIN", "BACKYARD", "GOVERNANCE"];
    if (!ALLOWED_LANES.includes(lane)) return err(res, 400, "Unknown lane: " + lane);

    const id    = taskId();
    const entry = {
      id,
      lane,
      title,
      payload:    payload || null,
      state:      "pending_approval",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    appendStore(STORES.queue, entry);
    audit("INTAKE", id, lane + " | " + title);
    return ok(res, { ok: true, task_id: id, state: "pending_approval" });
  }

  // ── POST /api/approve — approve a queued task ───────────────────────────
  if (req.method === "POST" && url === "/api/approve") {
    let body;
    try { body = await parseBody(req); } catch (_) { return err(res, 400, "Invalid JSON"); }

    const { task_id, approved_by } = body;
    if (!task_id) return err(res, 400, "task_id required");

    const queue = readStore(STORES.queue);
    const idx   = queue.findIndex(t => t.id === task_id);
    if (idx === -1) return err(res, 404, "Task not found: " + task_id);

    const task = queue[idx];
    if (task.state !== "pending_approval") {
      return err(res, 409, "Task is not in pending_approval state (current: " + task.state + ")");
    }

    queue[idx] = {
      ...task,
      state:       "approved",
      approved_by: approved_by || "operator",
      approved_at: new Date().toISOString(),
      updated_at:  new Date().toISOString()
    };
    writeStore(STORES.queue, queue);
    audit("APPROVED", task_id, "approved_by=" + (approved_by || "operator"));
    return ok(res, { ok: true, task_id, state: "approved" });
  }

  // ── GET /api/queue — list queue ─────────────────────────────────────────
  if (req.method === "GET" && url === "/api/queue") {
    const queue = readStore(STORES.queue);
    const state = qs.state;
    const result = state ? queue.filter(t => t.state === state) : queue;
    return ok(res, { ok: true, count: result.length, tasks: result });
  }

  // ── POST /api/execution — update execution state ────────────────────────
  if (req.method === "POST" && url === "/api/execution") {
    let body;
    try { body = await parseBody(req); } catch (_) { return err(res, 400, "Invalid JSON"); }

    const { task_id, state, result, contract } = body;
    if (!task_id || !state) return err(res, 400, "task_id and state required");
    if (!VALID_STATES.includes(state)) return err(res, 400, "Invalid state: " + state);

    // Update queue entry
    const queue = readStore(STORES.queue);
    const idx   = queue.findIndex(t => t.id === task_id);
    if (idx !== -1) {
      queue[idx] = { ...queue[idx], state, updated_at: new Date().toISOString() };
      writeStore(STORES.queue, queue);
    }

    // Append to execution log
    const entry = {
      ts:       new Date().toISOString(),
      task_id,
      state,
      result:   result   || null,
      contract: contract || null
    };
    appendStore(STORES.execution, entry);
    audit("EXECUTION", task_id, "state=" + state);
    return ok(res, { ok: true, task_id, state });
  }

  // ── GET /api/execution — read execution log ─────────────────────────────
  if (req.method === "GET" && url === "/api/execution") {
    const log     = readStore(STORES.execution);
    const task_id = qs.task_id;
    const result  = task_id ? log.filter(e => e.task_id === task_id) : log;
    return ok(res, { ok: true, count: result.length, log: result });
  }

  // ── POST /api/audit — append audit event ───────────────────────────────
  if (req.method === "POST" && url === "/api/audit") {
    let body;
    try { body = await parseBody(req); } catch (_) { return err(res, 400, "Invalid JSON"); }

    const { event, task_id, detail } = body;
    if (!event) return err(res, 400, "event required");

    audit(event, task_id || null, detail || null);
    return ok(res, { ok: true, event, task_id: task_id || null });
  }

  // ── GET /api/audit — read audit log ────────────────────────────────────
  if (req.method === "GET" && url === "/api/audit") {
    const log     = readStore(STORES.audit);
    const task_id = qs.task_id;
    const result  = task_id ? log.filter(e => e.task_id === task_id) : log;
    return ok(res, { ok: true, count: result.length, log: result });
  }

  // ── 404 ─────────────────────────────────────────────────────────────────
  res.writeHead(404, { "Content-Type": "application/json", ...CORS });
  res.end(JSON.stringify({ ok: false, error: "Not found: " + url }));
});

// ── Init stores + start ──────────────────────────────────────────────────────

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
Object.values(STORES).forEach(f => { if (!fs.existsSync(f)) writeStore(f, []); });

server.listen(PORT, "127.0.0.1", () => {
  console.log("AI Lab Operator running at http://localhost:" + PORT);
  console.log("Stores:", Object.entries(STORES).map(([k, v]) => k + "=" + path.relative(process.cwd(), v)).join(", "));
});

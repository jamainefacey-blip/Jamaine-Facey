// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — API Server  v1.0
//
//  Start:  node server.js        (default port 3000)
//          PORT=8080 node server.js
//
//  Development (auto-restart on change):
//          node --watch server.js   (Node 18+)
//
//  Endpoints:
//    GET    /api/health               — liveness check
//    GET    /api/clients              — list all clients
//    POST   /api/clients              — create new client
//    GET    /api/clients/:slug        — get full client record + resolved access
//    PUT    /api/clients/:slug        — update client record
//    DELETE /api/clients/:slug        — soft-delete (sets access_status = suspended)
//
//  CORS:
//    In production, replace the wildcard origin with your actual frontend domain.
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const express = require("express");
const cors    = require("cors");
const clients = require("./clients");
const access  = require("./access");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin:  process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "1mb" }));

// ── Request logger ────────────────────────────────────────────────────────────

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────

// GET /api/health
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: "1.0.0", ts: new Date().toISOString() });
});

// GET /api/clients  — list all (summary, no full JSON blobs)
app.get("/api/clients", (_req, res) => {
  try {
    res.json({ clients: clients.listAll() });
  } catch (err) {
    _error(res, 500, "Failed to list clients", err);
  }
});

// POST /api/clients  — create
app.post("/api/clients", (req, res) => {
  const { slug, clientConfig, program } = req.body || {};

  if (!slug || typeof slug !== "string") {
    return res.status(400).json({ error: "slug is required and must be a string" });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({ error: "slug must be lowercase letters, numbers and hyphens only" });
  }
  if (clients.exists(slug)) {
    return res.status(409).json({ error: `Client "${slug}" already exists` });
  }

  try {
    const record = clients.create(slug, clientConfig || {}, program || {});
    record.access = access.resolve(record.program?.access);
    res.status(201).json(record);
  } catch (err) {
    _error(res, 500, "Failed to create client", err);
  }
});

// GET /api/clients/:slug  — full record + server-resolved access
app.get("/api/clients/:slug", (req, res) => {
  const record = clients.get(req.params.slug);
  if (!record) return res.status(404).json({ error: `Client "${req.params.slug}" not found` });

  record.access = access.resolve(record.program?.access, record.payment);
  res.json(record);
});

// PUT /api/clients/:slug  — update
app.put("/api/clients/:slug", (req, res) => {
  const { slug } = req.params;

  if (!clients.exists(slug)) {
    return res.status(404).json({ error: `Client "${slug}" not found` });
  }

  try {
    // Always mark as edited when coach saves
    const body = { ...req.body, _hasEdits: true };
    const updated = clients.update(slug, body);
    updated.access = access.resolve(updated.program?.access, updated.payment);
    res.json(updated);
  } catch (err) {
    _error(res, 500, "Failed to update client", err);
  }
});

// DELETE /api/clients/:slug  — soft delete (suspend access)
app.delete("/api/clients/:slug", (req, res) => {
  const { slug } = req.params;

  if (!clients.exists(slug)) {
    return res.status(404).json({ error: `Client "${slug}" not found` });
  }

  try {
    const record = clients.get(slug);
    // Merge suspended status into program and persist
    const program = { ...record.program };
    if (!program.access) program.access = {};
    program.access.status = "suspended";
    const updated = clients.update(slug, { program, _hasEdits: true });
    updated.access = access.resolve(updated.program?.access);
    res.json({ message: "Access suspended", client: updated });
  } catch (err) {
    _error(res, 500, "Failed to suspend client", err);
  }
});

// ── 404 catch-all ─────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[API error]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  Mr Pain PT API  v1.0`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Listening → http://localhost:${PORT}`);
  console.log(`  Health   → http://localhost:${PORT}/api/health`);
  console.log(`  Clients  → http://localhost:${PORT}/api/clients`);
  console.log(`  Database → backend/data/mrpainpt.db`);
  console.log(`  ─────────────────────────────────────────\n`);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function _error(res, status, message, err) {
  console.error(`[${status}] ${message}:`, err?.message || err);
  res.status(status).json({ error: message });
}

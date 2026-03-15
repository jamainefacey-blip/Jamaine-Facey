// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — API Server  v2.0
//
//  Start:  cp .env.example .env && node server.js
//          PORT=8080 node server.js
//  Dev:    node --watch server.js
//
//  Auth model:
//    Public (no key required):
//      GET  /api/health             — liveness
//      GET  /api/clients/:slug      — client reads their own program (rehab module)
//      POST /api/webhooks/stripe    — Stripe verifies via signature, not Bearer
//
//    Protected (requires: Authorization: Bearer <COACH_API_KEY>):
//      GET    /api/clients          — list all clients (admin)
//      POST   /api/clients          — create client
//      PUT    /api/clients/:slug    — update client
//      DELETE /api/clients/:slug    — suspend access
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

require("dotenv").config();

const express    = require("express");
const cors       = require("cors");
const clients    = require("./clients");
const access     = require("./access");
const { requireAuth } = require("./auth");
const webhookRouter   = require("./webhook");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin:  process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Webhook route must be mounted BEFORE express.json() — it needs the raw Buffer.
// express.raw() is applied inside webhook.js for this specific path only.
app.use(webhookRouter);

// All other routes use JSON body parsing
app.use(express.json({ limit: "1mb" }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}${req._authDevBypass ? " [dev-bypass]" : ""}`);
  next();
});

// ── Public routes ─────────────────────────────────────────────────────────────

// GET /api/health
app.get("/api/health", (_req, res) => {
  res.json({
    status:  "ok",
    version: "2.0.0",
    ts:      new Date().toISOString(),
    auth:    !!process.env.COACH_API_KEY,
    webhook: !!process.env.STRIPE_WEBHOOK_SECRET,
  });
});

// GET /api/clients/:slug — public read (rehab module + client-facing)
// Returns full record + server-resolved access. No auth required.
app.get("/api/clients/:slug", (req, res) => {
  const record = clients.get(req.params.slug);
  if (!record) return res.status(404).json({ error: `Client "${req.params.slug}" not found` });
  record.access = access.resolve(record.program?.access, record.payment);
  res.json(record);
});

// ── Protected routes (require coach API key) ──────────────────────────────────

// GET /api/clients — admin list
app.get("/api/clients", requireAuth, (_req, res) => {
  try {
    res.json({ clients: clients.listAll() });
  } catch (err) {
    _error(res, 500, "Failed to list clients", err);
  }
});

// POST /api/clients — create
app.post("/api/clients", requireAuth, (req, res) => {
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
    record.access = access.resolve(record.program?.access, record.payment);
    res.status(201).json(record);
  } catch (err) {
    _error(res, 500, "Failed to create client", err);
  }
});

// PUT /api/clients/:slug — update
app.put("/api/clients/:slug", requireAuth, (req, res) => {
  const { slug } = req.params;
  if (!clients.exists(slug)) {
    return res.status(404).json({ error: `Client "${slug}" not found` });
  }
  try {
    const updated = clients.update(slug, { ...req.body, _hasEdits: true });
    updated.access = access.resolve(updated.program?.access, updated.payment);
    res.json(updated);
  } catch (err) {
    _error(res, 500, "Failed to update client", err);
  }
});

// DELETE /api/clients/:slug — soft delete (suspend access)
app.delete("/api/clients/:slug", requireAuth, (req, res) => {
  const { slug } = req.params;
  if (!clients.exists(slug)) {
    return res.status(404).json({ error: `Client "${slug}" not found` });
  }
  try {
    const record  = clients.get(slug);
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

// ── 404 catch-all ──────────────────────────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ── Error handler ──────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error("[API error]", err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  const authStatus    = process.env.COACH_API_KEY     ? "✓ configured" : "⚠ not set (dev mode)";
  const webhookStatus = process.env.STRIPE_WEBHOOK_SECRET ? "✓ configured" : "⚠ not set";
  console.log(`\n  Mr Pain PT API  v2.0`);
  console.log(`  ─────────────────────────────────────────`);
  console.log(`  Listening → http://localhost:${PORT}`);
  console.log(`  Auth      → ${authStatus}`);
  console.log(`  Webhook   → ${webhookStatus}`);
  console.log(`  Database  → backend/data/mrpainpt.db`);
  console.log(`  ─────────────────────────────────────────\n`);
});

function _error(res, status, message, err) {
  console.error(`[${status}] ${message}:`, err?.message || err);
  res.status(status).json({ error: message });
}

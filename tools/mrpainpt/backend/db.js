// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — SQLite initialisation
//
//  Database file: backend/data/mrpainpt.db  (gitignored)
//
//  Schema design notes:
//  • client_config and program are stored as JSON TEXT — the full objects from
//    CLIENT_CONFIG and PROGRAM globals, matching the shape of the static JS files.
//  • access.type and access.status are mirrored as top-level columns so they can
//    be queried directly (e.g. "how many expired subscribers") without JSON parsing.
//  • payment_* columns are null until a payment provider is integrated.
//    They match the fields the AccessGuard and CoachPortal already reference.
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const Database = require("better-sqlite3");
const path     = require("path");
const fs       = require("fs");

const DB_DIR  = path.join(__dirname, "data");
const DB_PATH = path.join(DB_DIR, "mrpainpt.db");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);

// WAL mode — better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (

    -- Identity
    slug             TEXT PRIMARY KEY,

    -- Full JSON objects matching static client file shape
    client_config    TEXT    NOT NULL DEFAULT '{}',
    program          TEXT    NOT NULL DEFAULT '{}',

    -- Access mirror columns (denormalised from program.access for easy querying)
    access_type      TEXT    NOT NULL DEFAULT 'subscription',
    access_status    TEXT    NOT NULL DEFAULT 'active',

    -- Payment-ready fields (null until payment provider wired up)
    -- These mirror the fields that will be sent to Stripe / LemonSqueezy / etc.
    payment_provider TEXT,        -- "stripe" | "lemonsqueezy" | null
    product_id       TEXT,        -- provider product/price ID
    subscription_id  TEXT,        -- provider subscription ID (recurring)
    purchase_id      TEXT,        -- provider one-off purchase ID
    purchase_date    TEXT,        -- ISO date
    expiry_date      TEXT,        -- ISO date (for trials, fixed-term)
    billing_status   TEXT,        -- "active" | "past_due" | "cancelled" | null

    -- Meta
    has_edits        INTEGER NOT NULL DEFAULT 0,   -- 1 = coach has saved overrides
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;

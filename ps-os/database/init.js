'use strict';

const Database = require('better-sqlite3');
const path = require('path');

let db;

function getDb() {
  if (db) return db;

  const dbPath = path.join(process.cwd(), 'database', 'ps-os.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS assets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      type        TEXT    NOT NULL CHECK(type IN ('project','tool','workflow','system')),
      purpose     TEXT,
      status      TEXT    DEFAULT 'idea'
                          CHECK(status IN ('idea','defined','building','active','monetising','exit')),
      priority    INTEGER DEFAULT 3 CHECK(priority BETWEEN 1 AND 5),
      last_updated TEXT   DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id   INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      content    TEXT    NOT NULL,
      source     TEXT,
      created_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS links (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id        INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
      linked_asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS ingestion_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      filename   TEXT,
      status     TEXT,
      message    TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS system_state (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    INSERT OR IGNORE INTO system_state(key, value) VALUES ('last_updated', datetime('now'));

    CREATE TABLE IF NOT EXISTS ava_memory (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT    NOT NULL,
      input      TEXT    NOT NULL,
      response   TEXT    NOT NULL,
      created_at TEXT    DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT    NOT NULL,
      endpoint   TEXT    NOT NULL,
      tokens     INTEGER DEFAULT 0,
      created_at TEXT    DEFAULT (datetime('now'))
    );
  `);

  return db;
}

module.exports = { getDb };

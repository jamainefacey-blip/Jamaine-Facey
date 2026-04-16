'use strict';

const { getDb } = require('../database/init');

function storeMemory(sessionId, input, response) {
  const db = getDb();
  db.prepare(
    `INSERT INTO ava_memory (session_id, input, response, created_at)
     VALUES (?, ?, ?, datetime('now'))`
  ).run(
    String(sessionId),
    String(input),
    typeof response === 'string' ? response : JSON.stringify(response)
  );
}

function getMemory(sessionId, limit = 10) {
  const db = getDb();
  const rows = db.prepare(
    `SELECT id, session_id, input, response, created_at
     FROM ava_memory
     WHERE session_id = ?
     ORDER BY created_at DESC
     LIMIT ?`
  ).all(String(sessionId), limit);

  return rows.map(r => ({
    ...r,
    response: (() => { try { return JSON.parse(r.response); } catch { return r.response; } })(),
  }));
}

function trackUsage(sessionId, endpoint, tokens = 0) {
  const db = getDb();
  db.prepare(
    `INSERT INTO usage_logs (session_id, endpoint, tokens, created_at)
     VALUES (?, ?, ?, datetime('now'))`
  ).run(String(sessionId), String(endpoint), Number(tokens) || 0);
}

function getUsage(sessionId) {
  const db = getDb();
  return db.prepare(
    `SELECT id, session_id, endpoint, tokens, created_at
     FROM usage_logs WHERE session_id = ?
     ORDER BY created_at DESC LIMIT 100`
  ).all(String(sessionId));
}

module.exports = { storeMemory, getMemory, trackUsage, getUsage };

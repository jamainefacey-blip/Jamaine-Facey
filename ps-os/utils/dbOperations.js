'use strict';

const { getDb } = require('../database/init');

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findSimilarAsset(name) {
  const db = getDb();
  const target = normalizeName(name);
  if (!target) return null;
  const assets = db.prepare('SELECT * FROM assets').all();
  for (const a of assets) {
    if (normalizeName(a.name) === target) return a;
  }
  return null;
}

function upsertAsset(assetData, source = 'ingestion') {
  const db = getDb();
  const { name, type, purpose, status, priority, notes = [] } = assetData;

  if (!name || !type) return null;

  const validTypes = ['project', 'tool', 'workflow', 'system'];
  const validStatuses = ['idea', 'defined', 'building', 'active', 'monetising', 'exit'];

  const safeType = validTypes.includes(type) ? type : 'project';
  const safeStatus = validStatuses.includes(status) ? status : 'idea';
  const safePriority = Math.min(5, Math.max(1, parseInt(priority) || 3));

  const existing = findSimilarAsset(name);

  let assetId;
  if (existing) {
    db.prepare(`
      UPDATE assets SET
        purpose      = COALESCE(?, purpose),
        status       = ?,
        priority     = ?,
        last_updated = datetime('now')
      WHERE id = ?
    `).run(purpose || null, safeStatus, safePriority, existing.id);
    assetId = existing.id;
  } else {
    const result = db.prepare(`
      INSERT INTO assets (name, type, purpose, status, priority, last_updated)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(name, safeType, purpose || null, safeStatus, safePriority);
    assetId = result.lastInsertRowid;
  }

  for (const note of notes) {
    if (note && note.trim()) {
      db.prepare(`
        INSERT INTO notes (asset_id, content, source) VALUES (?, ?, ?)
      `).run(assetId, note.trim(), source);
    }
  }

  touchSystemState();
  return assetId;
}

function createLink(assetId, linkedAssetId) {
  const db = getDb();
  const exists = db.prepare(
    'SELECT id FROM links WHERE asset_id = ? AND linked_asset_id = ?'
  ).get(assetId, linkedAssetId);
  if (!exists) {
    db.prepare('INSERT INTO links (asset_id, linked_asset_id) VALUES (?, ?)').run(assetId, linkedAssetId);
  }
}

function logIngestion(filename, status, message = '') {
  const db = getDb();
  db.prepare(`
    INSERT INTO ingestion_logs (filename, status, message) VALUES (?, ?, ?)
  `).run(filename, status, message);
  touchSystemState();
}

function touchSystemState() {
  const db = getDb();
  db.prepare(`
    INSERT OR REPLACE INTO system_state (key, value) VALUES ('last_updated', datetime('now'))
  `).run();
}

function getAllAssets(filters = {}) {
  const db = getDb();
  let query = 'SELECT * FROM assets WHERE 1=1';
  const params = [];

  if (filters.type) {
    query += ' AND type = ?';
    params.push(filters.type);
  }
  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  if (filters.priority) {
    query += ' AND priority = ?';
    params.push(parseInt(filters.priority));
  }

  query += ' ORDER BY last_updated DESC';
  return db.prepare(query).all(...params);
}

function getAssetById(id) {
  const db = getDb();
  const asset = db.prepare('SELECT * FROM assets WHERE id = ?').get(id);
  if (!asset) return null;

  const notes = db.prepare(
    'SELECT * FROM notes WHERE asset_id = ? ORDER BY created_at ASC'
  ).all(id);

  const linkRows = db.prepare(`
    SELECT a.* FROM links l
    JOIN assets a ON a.id = l.linked_asset_id
    WHERE l.asset_id = ?
  `).all(id);

  return { ...asset, notes, links: linkRows };
}

function getIngestionLogs(limit = 50) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM ingestion_logs ORDER BY created_at DESC LIMIT ?'
  ).all(limit);
}

function getSystemState() {
  const db = getDb();
  const row = db.prepare("SELECT value FROM system_state WHERE key = 'last_updated'").get();
  return row ? row.value : null;
}

function updateAsset(id, fields) {
  const db = getDb();
  const validTypes = ['project', 'tool', 'workflow', 'system'];
  const validStatuses = ['idea', 'defined', 'building', 'active', 'monetising', 'exit'];

  const sets = [];
  const params = [];

  if (fields.name !== undefined) {
    if (!fields.name.trim()) throw new Error('name cannot be empty');
    sets.push('name = ?'); params.push(fields.name.trim());
  }
  if (fields.type !== undefined) {
    if (!validTypes.includes(fields.type)) throw new Error('invalid type');
    sets.push('type = ?'); params.push(fields.type);
  }
  if (fields.status !== undefined) {
    if (!validStatuses.includes(fields.status)) throw new Error('invalid status');
    sets.push('status = ?'); params.push(fields.status);
  }
  if (fields.priority !== undefined) {
    const p = parseInt(fields.priority);
    if (isNaN(p) || p < 1 || p > 5) throw new Error('priority must be 1–5');
    sets.push('priority = ?'); params.push(p);
  }
  if (fields.purpose !== undefined) {
    sets.push('purpose = ?'); params.push(fields.purpose);
  }

  if (sets.length === 0) throw new Error('no fields to update');

  sets.push("last_updated = datetime('now')");
  params.push(id);

  const result = db.prepare(
    `UPDATE assets SET ${sets.join(', ')} WHERE id = ?`
  ).run(...params);

  if (result.changes === 0) return null;
  touchSystemState();
  return getAssetById(id);
}

function deleteAsset(id) {
  const db = getDb();
  const result = db.prepare('DELETE FROM assets WHERE id = ?').run(id);
  if (result.changes === 0) return false;
  touchSystemState();
  return true;
}

function addNote(assetId, text, source = 'manual') {
  const db = getDb();
  const exists = db.prepare('SELECT id FROM assets WHERE id = ?').get(assetId);
  if (!exists) return null;
  const result = db.prepare(
    "INSERT INTO notes (asset_id, content, source, created_at) VALUES (?, ?, ?, datetime('now'))"
  ).run(assetId, text.trim(), source);
  touchSystemState();
  return db.prepare('SELECT * FROM notes WHERE id = ?').get(result.lastInsertRowid);
}

module.exports = {
  upsertAsset,
  createLink,
  logIngestion,
  getAllAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  addNote,
  getIngestionLogs,
  getSystemState,
};

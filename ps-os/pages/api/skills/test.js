import { searchGitHub } from '../../../utils/githubConnector';
import { normalise, extractSkill } from '../../../utils/skillExtractor';
import { getDb } from '../../../database/init';

function findOrCreateHub() {
  const db = getDb();
  const existing = db.prepare(
    `SELECT id FROM assets WHERE name = 'Skills Hub' LIMIT 1`
  ).get();
  if (existing) return existing.id;

  const result = db.prepare(`
    INSERT INTO assets (name, type, purpose, status, priority, last_updated)
    VALUES ('Skills Hub', 'system', 'Extracted skill repository', 'active', 3, datetime('now'))
  `).run();
  return result.lastInsertRowid;
}

function getExistingSourceUrls(hubId) {
  const db = getDb();
  const notes = db.prepare(`SELECT content FROM notes WHERE asset_id = ?`).all(hubId);
  const urls = new Set();
  for (const note of notes) {
    const m = note.content.match(/Source:\s*(https?:\/\/[^\s|]+)/);
    if (m) urls.add(m[1].trim());
  }
  return urls;
}

function insertSkillNote(hubId, skill) {
  const db = getDb();
  const text = `Skill: ${skill.name} | Category: ${skill.category} | Source: ${skill.source} | Purpose: ${skill.purpose}`;
  db.prepare(
    `INSERT INTO notes (asset_id, content, source, created_at) VALUES (?, ?, 'skill-mining', datetime('now'))`
  ).run(hubId, text);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { query, store } = req.query;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'query parameter required' });
  }

  const { results, rateLimited, error } = await searchGitHub(query.trim());

  const skills = [];
  for (const raw of results) {
    try {
      skills.push(extractSkill(normalise(raw)));
    } catch {
      // skip failed extractions silently
    }
  }

  const response = {
    query:       query.trim(),
    count:       skills.length,
    skills,
    rateLimited: rateLimited || false,
  };
  if (error) response.error = error;

  if (store === '1' && skills.length > 0) {
    try {
      const hubId       = findOrCreateHub();
      const existingUrls = getExistingSourceUrls(hubId);
      let storedCount   = 0;

      for (const skill of skills) {
        if (existingUrls.has(skill.source)) continue;
        insertSkillNote(hubId, skill);
        storedCount++;
      }

      response.stored      = true;
      response.storedCount = storedCount;
    } catch (err) {
      response.stored     = false;
      response.storeError = err.message;
    }
  }

  return res.status(200).json(response);
}

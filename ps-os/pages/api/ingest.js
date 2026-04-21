import { parseRawInput } from '../../utils/aiParser';
import { upsertAsset, createLink, logIngestion } from '../../utils/dbOperations';
import { getDb } from '../../database/init';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, source = 'api' } = req.body || {};
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text field required' });
  }

  try {
    logIngestion(source, 'processing');
    const { data, skippedAI } = await parseRawInput(text, source);
    const createdIds = [];

    const typeMap = {
      projects:  'project',
      tools:     'tool',
      workflows: 'workflow',
      systems:   'system',
    };

    for (const [key, type] of Object.entries(typeMap)) {
      const items = data[key] || [];
      for (const item of items) {
        const id = upsertAsset({ ...item, type }, source);
        if (id) createdIds.push(id);
      }
    }

    if (data.notes && data.notes.length > 0 && createdIds.length > 0) {
      const db = getDb();
      for (const note of data.notes) {
        if (note && note.trim()) {
          db.prepare('INSERT INTO notes (asset_id, content, source) VALUES (?, ?, ?)').run(
            createdIds[0], note.trim(), source
          );
        }
      }
    }

    if (createdIds.length > 1) {
      for (let i = 0; i < createdIds.length; i++) {
        for (let j = i + 1; j < createdIds.length; j++) {
          createLink(createdIds[i], createdIds[j]);
          createLink(createdIds[j], createdIds[i]);
        }
      }
    }

    logIngestion(source, 'success', `${createdIds.length} assets`);
    res.status(200).json({ ok: true, assetIds: createdIds, skippedAI });
  } catch (err) {
    logIngestion(source, 'error', err.message);
    res.status(500).json({ error: err.message });
  }
}

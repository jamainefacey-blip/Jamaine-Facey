import { addNote } from '../../../../utils/dbOperations';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const id = parseInt(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  const text = (req.body?.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text cannot be empty' });

  try {
    const note = addNote(id, text, 'manual');
    if (!note) return res.status(404).json({ error: 'Asset not found' });
    return res.status(201).json({ note });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

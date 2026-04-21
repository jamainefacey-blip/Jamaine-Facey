import { storeMemory, getMemory } from '../../utils/usageTracker';

export default function handler(req, res) {
  const { sessionId } = req.method === 'GET' ? req.query : (req.body || {});

  if (!sessionId || typeof sessionId !== 'string' || !sessionId.trim()) {
    return res.status(400).json({ error: 'sessionId required' });
  }

  const sid = sessionId.trim().slice(0, 64);

  if (req.method === 'POST') {
    const { input, response } = req.body || {};
    if (!input || !response) return res.status(400).json({ error: 'input and response required' });
    try {
      storeMemory(sid, String(input), response);
      return res.status(201).json({ stored: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const records = getMemory(sid, 10);
      return res.status(200).json({ sessionId: sid, count: records.length, records });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

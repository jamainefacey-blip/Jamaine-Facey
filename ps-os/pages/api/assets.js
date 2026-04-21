import { getAllAssets, searchAssets } from '../../utils/dbOperations';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const { type, status, priority, query } = req.query;
    const q = (query || '').trim();
    const assets = q
      ? searchAssets(q, { type, status, priority })
      : getAllAssets({ type, status, priority });
    res.status(200).json({ assets });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

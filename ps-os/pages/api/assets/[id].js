import { getAssetById } from '../../../utils/dbOperations';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const id = parseInt(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  try {
    const asset = getAssetById(id);
    if (!asset) return res.status(404).json({ error: 'Asset not found' });
    res.status(200).json({ asset });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

import { getAssetById, updateAsset, deleteAsset } from '../../../utils/dbOperations';

export default function handler(req, res) {
  const id = parseInt(req.query.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

  if (req.method === 'GET') {
    try {
      const asset = getAssetById(id);
      if (!asset) return res.status(404).json({ error: 'Asset not found' });
      return res.status(200).json({ asset });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { name, type, status, priority, purpose } = req.body || {};
      const updated = updateAsset(id, { name, type, status, priority, purpose });
      if (!updated) return res.status(404).json({ error: 'Asset not found' });
      return res.status(200).json({ asset: updated });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const ok = deleteAsset(id);
      if (!ok) return res.status(404).json({ error: 'Asset not found' });
      return res.status(200).json({ ok: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).end();
}

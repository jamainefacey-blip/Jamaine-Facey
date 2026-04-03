import { getSystemState, getIngestionLogs } from '../../utils/dbOperations';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const lastUpdated = getSystemState();
    const recentLogs = getIngestionLogs(10);
    res.status(200).json({ lastUpdated, recentLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

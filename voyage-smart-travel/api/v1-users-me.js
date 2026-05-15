/**
 * Vercel serverless — GET /v1/users/me  +  PATCH /v1/users/me
 */
'use strict';
const { UserStore, jwt } = require('../server/user-store');

function readBody(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return resolve(req.body);
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }

  let claims;
  try { claims = jwt.fromHeader(req.headers['authorization']); }
  catch (e) { res.status(401).json({ error: 'unauthorized', message: 'Valid bearer token required.' }); return; }

  const user = UserStore.findById(claims.sub);
  if (!user) { res.status(404).json({ error: 'not_found' }); return; }

  if (req.method === 'GET') {
    res.status(200).json(UserStore.toPublicProfile(user));
    return;
  }

  if (req.method === 'PATCH') {
    let patch;
    try { patch = await readBody(req); } catch (e) { res.status(400).json({ error: 'invalid JSON' }); return; }
    try {
      const updated = UserStore.update(claims.sub, patch);
      res.status(200).json(UserStore.toPublicProfile(updated));
    } catch (e) {
      res.status(500).json({ error: 'update_failed' });
    }
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
};

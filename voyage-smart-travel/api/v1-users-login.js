/**
 * Vercel serverless — POST /v1/users/login
 */
'use strict';
const { UserStore, jwt, checkPassword } = require('../server/user-store');

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
  if (req.method !== 'POST') { res.status(405).json({ error: 'method not allowed' }); return; }

  let body;
  try { body = await readBody(req); } catch (e) { res.status(400).json({ error: 'invalid JSON' }); return; }

  const { email, password } = body;
  if (!email || !password) { res.status(400).json({ error: 'validation_error', message: 'Email and password required.' }); return; }

  const user = UserStore.findByEmail(email.trim());
  if (!user || !checkPassword(password, user.password_hash, user.password_salt)) {
    res.status(401).json({ error: 'invalid_credentials', message: 'Incorrect email or password.' }); return;
  }
  if (user.deleted_at) { res.status(403).json({ error: 'account_deleted' }); return; }

  UserStore.touchLogin(user.id);
  const token = jwt.sign({ sub: user.id, email: user.identity.email, tier: user.tier });
  res.status(200).json({ token, user: UserStore.toPublicProfile(user) });
};

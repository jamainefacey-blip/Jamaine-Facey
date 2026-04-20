/**
 * Vercel serverless — POST /v1/users/register
 * NOTE: in-memory store resets on cold start. Use a real DB before production.
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

  const { email, password, full_name, terms_accepted } = body;
  if (!email || !email.includes('@')) { res.status(400).json({ error: 'validation_error', message: 'Valid email required.' }); return; }
  if (!password || password.length < 8) { res.status(400).json({ error: 'validation_error', message: 'Password must be at least 8 characters.' }); return; }
  if (!terms_accepted) { res.status(400).json({ error: 'validation_error', message: 'Terms acceptance required.' }); return; }

  let user;
  try { user = UserStore.create({ email: email.trim(), password, full_name: (full_name || '').trim(), termsAccepted: true }); }
  catch (e) {
    if (e.message === 'EMAIL_TAKEN') { res.status(409).json({ error: 'email_taken', message: 'Account already exists.' }); return; }
    res.status(500).json({ error: 'internal_error' }); return;
  }

  const token = jwt.sign({ sub: user.id, email: user.identity.email, tier: user.tier });
  res.status(201).json({ token, user: UserStore.toPublicProfile(user) });
};

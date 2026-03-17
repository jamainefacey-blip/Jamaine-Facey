const config = require('../../config');

/**
 * API key authentication middleware.
 * Expects header: x-api-key: <key>
 */
function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];

  if (!config.apiKey) {
    // No key configured — skip in development
    return next();
  }

  if (!apiKey || apiKey !== config.apiKey) {
    return res.status(401).json({ error: 'Unauthorized: invalid or missing API key' });
  }

  return next();
}

module.exports = { requireApiKey };

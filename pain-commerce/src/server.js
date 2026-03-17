const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const config = require('../config');
const commerceRoutes = require('./routes/commerce');
const CommerceController = require('./controllers/commerceController');
const { requireApiKey } = require('./middleware/auth');

const app = express();

// --- Security ---
app.use(helmet());
app.use(cors({ origin: config.cors.origin }));

// --- Stripe webhook route (must use raw body) ---
app.post(
  '/commerce/webhook',
  express.raw({ type: 'application/json' }),
  CommerceController.webhook,
);

// --- JSON parsing for all other routes ---
app.use(express.json());

// --- API key protection ---
app.use('/commerce', requireApiKey);

// --- Commerce routes ---
app.use('/commerce', commerceRoutes);

// --- Health check ---
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'pain-commerce' });
});

// --- Start server ---
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Pain Commerce engine running on port ${PORT}`);
});

module.exports = app;

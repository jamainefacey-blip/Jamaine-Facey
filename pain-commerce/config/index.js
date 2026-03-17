require('dotenv').config();

const config = {
  port: process.env.PORT || 4000,

  db: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  apiKey: process.env.API_KEY,

  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

// Validate required env vars in production
if (process.env.NODE_ENV === 'production') {
  const required = [
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'API_KEY',
  ];
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}

module.exports = config;

# Pain Commerce

Central commerce engine for the Pain System. Handles payments, subscriptions, licensing, and revenue tracking via the Spider Strategy ledger.

## Stack

- **Runtime:** Node.js (>=18)
- **Framework:** Express
- **Payments:** Stripe
- **Database:** PostgreSQL (Supabase compatible)

## Directory Structure

```
pain-commerce/
├── src/
│   ├── server.js              # Express entry point
│   ├── routes/
│   │   └── commerce.js        # Route definitions
│   ├── controllers/
│   │   └── commerceController.js
│   ├── services/
│   │   ├── stripeService.js   # Stripe API wrapper
│   │   ├── licenseService.js  # License issuance
│   │   └── ledgerService.js   # Spider Strategy ledger
│   ├── models/
│   │   ├── customer.js
│   │   ├── subscription.js
│   │   ├── license.js
│   │   └── spiderLedger.js
│   └── middleware/
│       └── auth.js            # API key middleware
├── config/
│   └── index.js               # Environment config
├── db/
│   ├── schema.sql             # Full database schema
│   ├── pool.js                # pg Pool singleton
│   └── init.js                # Schema initialisation script
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Setup

### 1. Install dependencies

```bash
cd pain-commerce
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 3. Set up the database

**Option A — Local PostgreSQL:**

```bash
createdb pain_commerce
npm run db:init
```

**Option B — Supabase:**

1. Create a new Supabase project.
2. Copy the connection string into `DATABASE_URL` in `.env`.
3. Set `DB_SSL=true`.
4. Run the SQL from `db/schema.sql` in the Supabase SQL editor, or run `npm run db:init`.

### 4. Configure Stripe

1. Get your **test mode** secret key from <https://dashboard.stripe.com/test/apikeys>.
2. Create a product and price in the Stripe dashboard.
3. Set `STRIPE_SECRET_KEY` in `.env`.
4. For webhooks, use the Stripe CLI or dashboard to point to `http://localhost:4000/commerce/webhook`.
5. Set the webhook signing secret as `STRIPE_WEBHOOK_SECRET`.

### 5. Start the server

```bash
npm run dev   # development (auto-restart on changes)
npm start     # production
```

## API Endpoints

All endpoints (except webhook and health) require the `x-api-key` header.

| Method | Path                           | Description                  |
|--------|--------------------------------|------------------------------|
| POST   | `/commerce/create-checkout`    | Create a Stripe Checkout session |
| POST   | `/commerce/webhook`            | Stripe webhook receiver      |
| GET    | `/commerce/licenses/:user`     | Get licenses for a customer  |
| GET    | `/commerce/subscriptions/:user`| Get subscriptions for a customer |
| GET    | `/health`                      | Health check                 |

### POST /commerce/create-checkout

```json
{
  "email": "customer@example.com",
  "name": "Jane Doe",
  "priceId": "price_xxx",
  "mode": "payment",
  "successUrl": "https://yoursite.com/success",
  "cancelUrl": "https://yoursite.com/cancel",
  "productId": "pain-tool-v1"
}
```

**Response:**

```json
{
  "sessionId": "cs_test_xxx",
  "url": "https://checkout.stripe.com/c/pay/cs_test_xxx"
}
```

## Example Stripe Test Payment Flow

1. **Create a checkout session:**

```bash
curl -X POST http://localhost:4000/commerce/create-checkout \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key-here" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "priceId": "price_xxx",
    "mode": "payment",
    "successUrl": "http://localhost:3000/success",
    "cancelUrl": "http://localhost:3000/cancel",
    "productId": "pain-tool-v1"
  }'
```

2. **Open the returned `url`** in a browser. Use Stripe test card `4242 4242 4242 4242`, any future expiry, any CVC.

3. **Stripe sends a webhook** to `/commerce/webhook`. The server:
   - Verifies the signature
   - Creates/updates the customer record
   - Issues a license
   - Writes a record to the `spider_ledger`

4. **Verify the license was issued:**

```bash
curl http://localhost:4000/commerce/licenses/<customer_id> \
  -H "x-api-key: your-api-key-here"
```

5. **Check the Spider Strategy ledger** directly in the database:

```sql
SELECT * FROM spider_ledger ORDER BY timestamp DESC;
```

## Database Tables

| Table           | Purpose                                |
|-----------------|----------------------------------------|
| `customers`     | Customer profiles with Stripe mapping  |
| `subscriptions` | Active/canceled subscriptions          |
| `licenses`      | Product licenses per customer          |
| `spider_ledger` | Revenue tracking (Spider Strategy)     |

## Security

- **Webhook signature validation** — Stripe signatures verified on every webhook call
- **Environment variables** — All secrets loaded from `.env`, validated in production
- **API key protection** — `x-api-key` header required on all commerce endpoints
- **Helmet** — HTTP security headers
- **CORS** — Configurable origin whitelist

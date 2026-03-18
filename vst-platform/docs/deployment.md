# VST Platform — Deployment Architecture

---

## Production Topology

```
Vercel Edge Network
└── apps/web (Next.js)
    ├── /                  → Marketing pages (SSG)
    ├── /dashboard/**      → Authenticated app (SSR + RSC)
    └── /api/webhooks/**   → Clerk + Stripe webhook receivers

Railway
└── apps/api (NestJS)
    ├── REST API           → :3001
    └── Background Jobs    → Scheduled tasks (price alerts, passport expiry)

Upstash Redis
└── Session cache + price alert job queue

Supabase / Neon
└── PostgreSQL (managed, connection pooling via pgBouncer)

Cloudflare R2
└── User media uploads (review images/videos, explorer pin media)

n8n Cloud
└── Automation workflows
    ├── Price alert checker (cron: every 4h)
    ├── Passport expiry notifier (cron: daily)
    ├── SOS escalation (webhook-triggered)
    └── Checkin missed escalation (webhook-triggered)
```

---

## Vercel Config (apps/web)

```json
// vercel.json
{
  "framework": "nextjs",
  "env": {
    "NEXT_PUBLIC_API_URL": "@vst-api-url"
  }
}
```

Environment variables set in Vercel dashboard — never in repo.

---

## Railway Config (apps/api)

- Start command: `node dist/main`
- Build command: `npm run build`
- Health check: `GET /health` → 200
- Auto-deploy: on push to `main`

---

## Local Development

```bash
# 1. Start Postgres + Redis
docker-compose up -d

# 2. Copy env
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# 3. Run migrations
npm run db:migrate

# 4. Generate Prisma client
npm run db:generate

# 5. Start all apps
npm run dev
```

---

## CI/CD Pipeline (GitHub Actions)

```
on: push to main

jobs:
  test:
    - Install deps
    - Run prisma generate
    - Run lint
    - Run unit tests

  deploy-api:
    needs: test
    - Railway deploy via CLI

  deploy-web:
    needs: test
    - Vercel deploy (automatic via Vercel GitHub integration)
```

---

## Secrets Management

- All secrets in Vercel environment variables (web)
- All secrets in Railway environment variables (api)
- No secrets in `.env` files committed to repo
- `.env.example` committed — values are empty placeholders only
- Stripe webhook secrets validated server-side with `stripe.webhooks.constructEvent()`
- Clerk webhook secrets validated with `svix` library

---

## Database Migrations

```bash
# Dev
npx prisma migrate dev --name <description>

# Production (run in CI before deploy)
npx prisma migrate deploy
```

Never run `prisma migrate reset` in production.

---

## Scaling Notes

- NestJS API is stateless — horizontal scaling via Railway replicas
- Redis handles distributed session state
- Postgres connection pooling required at scale (PgBouncer / Neon pooler)
- Price alert job should move to dedicated queue worker at >10k users
- Media uploads proxied through API initially; move to direct-to-R2 presigned URLs at scale

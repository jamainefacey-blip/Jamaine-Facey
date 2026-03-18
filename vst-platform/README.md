# VST Platform — System Architecture

## Overview

Voyage Smart Travel (VST) is a full-stack travel platform built for global scale.
This monorepo contains the web frontend, backend API, shared packages, and infrastructure.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                                  │
│   Next.js 14 App Router  ·  React Server Components  ·  Tailwind   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────▼──────────────────────────────────────┐
│                        API LAYER (NestJS)                            │
│   Auth Guard (Clerk JWT)  ·  Rate Limiting  ·  Request Validation   │
│                                                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │   Auth   │ │ Booking  │ │  Safety  │ │  Notifs  │ │  Payments│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Users   │ │Membership│ │ Partners │ │   Visa   │ │Community │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
└──────────┬──────────────────────────┬───────────────────────────────┘
           │                          │
┌──────────▼──────────┐   ┌──────────▼──────────────────────────────┐
│    PostgreSQL        │   │         EXTERNAL INTEGRATIONS           │
│    (primary DB)      │   │                                         │
│                      │   │  Clerk      → Auth & user management    │
│    Redis             │   │  Stripe     → Payments & subscriptions  │
│    (cache/queue)     │   │  Twilio     → SMS alerts                │
└─────────────────────┘   │  Skyscanner → Flight search             │
                           │  Booking.com→ Hotel search              │
                           │  Mapbox     → Explorer map              │
                           │  n8n        → Automation workflows      │
                           └─────────────────────────────────────────┘
```

---

## Tier 1 Modules

| Module | Status | Priority |
|--------|--------|----------|
| Auth & Profile | Scaffold ready | 1 |
| Booking Engine | Scaffold ready | 2 |
| SOS Safety System | Scaffold ready | 3 |
| Notification Engine | Scaffold ready | 4 |
| Membership System | Scaffold ready | 5 |
| Payment & Affiliate | Scaffold ready | 6 |
| Partner Dashboard | Scaffold ready | 7 |
| Visa & Embassy | Scaffold ready | 8 |
| Community | Scaffold ready | 9 |
| Explorer Map | Scaffold ready | 10 |

---

## Tech Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | Next.js 14 (App Router) | SSR, RSC, SEO, Vercel native |
| Backend | NestJS | Modular, typed, scalable |
| Database | PostgreSQL via Prisma | Relational, migrations, type-safe |
| Cache / Queue | Redis (Upstash) | Sessions, price alert queue |
| Auth | Clerk | Hosted auth, webhooks, MFA |
| Payments | Stripe | Subscriptions, webhooks |
| SMS | Twilio | SOS & alert delivery |
| Email | Resend | Transactional email |
| Push | Web Push / Expo | Browser & mobile push |
| Maps | Mapbox | Explorer map, embassy pins |
| Flight Search | Skyscanner API | Flight search aggregation |
| Hotel Search | Booking.com Affiliate | Hotel search aggregation |
| Automation | n8n | Price alert jobs, SOS escalation |
| CI/CD | GitHub Actions | Test, lint, deploy |
| Deployment | Vercel (web) + Railway (API) | Global edge + managed infra |
| Monitoring | Sentry + Vercel Analytics | Error tracking, performance |

---

## Monorepo Structure

```
vst-platform/
├── apps/
│   ├── web/                    Next.js 14 frontend
│   └── api/                    NestJS backend
├── packages/
│   ├── db/                     Prisma schema + migrations
│   ├── types/                  Shared TypeScript types
│   └── config/                 Shared config/env validation
├── infra/
│   ├── docker-compose.yml      Local dev: Postgres + Redis
│   └── nginx/                  Production reverse proxy
├── docs/
│   ├── api-spec.md             REST API specification
│   └── deployment.md           Deployment runbook
├── turbo.json                  Turborepo pipeline
├── package.json                Workspace root
└── .env.example                All required environment variables
```

---

## GDPR Compliance Notes

- Passport numbers stored encrypted at rest (AES-256)
- PII deletable on account deletion (cascade rules in schema)
- Location data stored only during active SOS event
- Cookie consent required before analytics
- Data residency: EU-West primary, no cross-border transfer without consent

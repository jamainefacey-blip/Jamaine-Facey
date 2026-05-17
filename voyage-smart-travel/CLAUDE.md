# Voyage Smart Travel — Operator Context

## Operator Identity
**Mr Pain** — Founder. VST is a Pain System product. All changes require Round Table Council sign-off. See `/pain-system/docs/ROUND_TABLE_COUNCIL.md`.

---

## 6 Canon Rules

1. **Council First** — No build, deploy, or API change without Round Table quorum.
2. **Security Officer Hard Veto** — 47-point checklist must pass before any deploy.
3. **Secrets Out-of-Band** — ANTHROPIC_API_KEY, JWT_SECRET, Amadeus creds: env vars only, never in source.
4. **API Contract Versioned** — All `/v1/` endpoints are stable. Breaking changes require Architect sign-off.
5. **Ava Safety Non-Negotiable** — AVA evaluation gate must not be bypassed or degraded.
6. **Rollback Plan Required** — Every Vercel deploy has a documented rollback before it ships.

---

## Phase Status

| Phase | Status | Notes |
|---|---|---|
| Phase 1 — Core platform | Complete | Auth, booking search, AI planner, eco score |
| Phase 2 — Safety + Accessibility | In Progress | Safety engine (safety.html), accessibility audit |

---

## Infrastructure

| Resource | Value |
|---|---|
| Vercel Project | `voyage-smart-travel` |
| Supabase Project ID | `[SET IN ENV — see Operator for credentials]` |
| AI Model (Ava) | `claude-haiku-4-5-20251001` (override: AVA_MODEL env) |
| Auth | JWT / HMAC-SHA256 (JWT_SECRET env) |
| Fare data | Amadeus API (AMADEUS_CLIENT_ID / SECRET / ENV) |

---

## Key API Tables

| Endpoint | Method | Purpose |
|---|---|---|
| `/v1/users/register` | POST | User registration |
| `/v1/users/login` | POST | Login + JWT |
| `/v1/users/me` | GET/PATCH | Profile |
| `/v1/bookings` | GET/POST | Bookings list + create |
| `/v1/bookings/:id` | GET | Booking detail |
| `/v1/bookings/:id/cancel` | POST | Cancel |
| `/api/ava-evaluate` | POST | Ava Phase 6 safety eval |
| `/api/planner-chat` | POST | AI trip planner |
| `/api/ava-itinerary` | POST | Itinerary generation |
| `/api/fares/search` | POST | Fare search |
| `/v1/eco/calculate` | POST | Eco score |

---

## Current Priorities

1. Phase 2 completion — safety.html and accessibility.html hardening
2. Security audit pass on all `/v1/` endpoints
3. Supabase schema migration for Phase 2 user preferences
4. Vercel deployment pipeline documentation

---

## Project State Files

- `/voyage-smart-travel/specs/` — API specs and schemas
- `/voyage-smart-travel/server/` — server modules
- `/voyage-smart-travel/api/` — Vercel serverless functions
- `/pain-system/CLAUDE.md` — parent operator context

# VST Platform — Architecture Diagram

---

## Full System Architecture

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║                         VOYAGE SMART TRAVEL — SYSTEM ARCHITECTURE                  ║
╚══════════════════════════════════════════════════════════════════════════════════════╝

┌──────────────────────────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                                        │
│                                                                                      │
│   ┌──────────────────────────────────┐       ┌──────────────────────────────────┐   │
│   │  NEXT.JS WEB  (Vercel CDN/Edge)  │       │  MOBILE — FUTURE (React Native)  │   │
│   │                                  │       │                                  │   │
│   │  /(marketing)    SSG             │       │  iOS App        Android App      │   │
│   │    landing · about · pricing     │       │                                  │   │
│   │                                  │       │  Same API surface                │   │
│   │  /(dashboard)    SSR + RSC       │       │  Expo push notifications         │   │
│   │    bookings · safety · profile   │       │  Native SOS trigger (foreground) │   │
│   │    explorer map · membership     │       │                                  │   │
│   │                                  │       │  NOT BUILT YET                   │   │
│   │  /api/webhooks   Vercel Edge Fn  │       │  Slot reserved in architecture   │   │
│   │    /clerk   /stripe              │       └──────────────────────────────────┘   │
│   └────────────────┬─────────────────┘                       │                      │
└────────────────────│─────────────────────────────────────────│────────────────────┘
                     │ HTTPS + Bearer JWT                       │ HTTPS + Bearer JWT
                     └─────────────────────┬───────────────────┘

┌────────────────────────────────────────────▼───────────────────────────────────────┐
│  IDENTITY LAYER  (Clerk — Hosted)                                                   │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  JWT Issuance  ·  JWKS Endpoint  ·  MFA  ·  Social Login  ·  Webhooks       │  │
│  │                                                                              │  │
│  │  user.created ──► POST /v1/webhooks/clerk ──► AuthService.syncUser()         │  │
│  │  user.updated ──► POST /v1/webhooks/clerk ──► AuthService.syncUser()         │  │
│  │  user.deleted ──► POST /v1/webhooks/clerk ──► AuthService.deleteUser()       │  │
│  │                    (svix HMAC signature verified before processing)          │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
                                          │ Bearer JWT (per request)

┌─────────────────────────────────────────▼──────────────────────────────────────────┐
│  API LAYER  (NestJS — Railway)  :3001                                              │
│                                                                                     │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │  REQUEST PIPELINE                                                            │  │
│  │  ClerkAuthGuard ──► JWKS verify ──► DB user lookup ──► attach req.user      │  │
│  │  ThrottlerModule ──► rate limit by tier (GUEST:60/min, ELITE:600/min)       │  │
│  │  ValidationPipe  ──► class-validator DTOs, whitelist, transform             │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  ┌────────────────────────────────── CORE MODULES ─────────────────────────────┐  │
│  │                                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │    AUTH     │  │    USERS    │  │   SAFETY    │  │   BOOKING   │        │  │
│  │  │  Phase 2 ✅ │  │  Phase 2 ✅ │  │  Phase 2 ✅ │  │  Phase 2 ✅ │        │  │
│  │  │             │  │             │  │             │  │             │        │  │
│  │  │ Clerk sync  │  │ Profile     │  │ SOS Trigger │  │ Flt Search  │        │  │
│  │  │ JWT guard   │  │ Preferences │  │ Check-ins   │  │ Htl Search  │        │  │
│  │  │ User upsert │  │ Safety      │  │ Escalation  │  │ Booking rec │        │  │
│  │  │ GDPR delete │  │  contacts   │  │ Cron/5min   │  │ Price alerts│        │  │
│  │  │             │  │ Passport    │  │             │  │ Affiliate   │        │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  │                                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│  │  │NOTIFICATIONS│  │ MEMBERSHIP  │  │  PAYMENTS   │  │    VISA     │        │  │
│  │  │  Phase 3 ⏳ │  │  Phase 3 ⏳ │  │  Phase 3 ⏳ │  │  Phase 3 ⏳ │        │  │
│  │  │             │  │             │  │             │  │             │        │  │
│  │  │ Email route │  │ Tier mgmt   │  │ Stripe subs │  │ Visa check  │        │  │
│  │  │ SMS route   │  │ Status mgmt │  │ Webhooks    │  │ Embassy dir │        │  │
│  │  │ Push route  │  │ Upgrade flow│  │ History     │  │ Passport    │        │  │
│  │  │ In-app      │  │             │  │             │  │  expiry job │        │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│  │                                                                              │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                          │  │
│  │  │  COMMUNITY  │  │  EXPLORER   │  │  PARTNERS   │   ← DEFERRED             │  │
│  │  │  Deferred ⏸ │  │  Deferred ⏸ │  │  Deferred ⏸ │                          │  │
│  │  │             │  │             │  │             │                          │  │
│  │  │ Reviews     │  │ Map pins    │  │ Campaigns   │                          │  │
│  │  │ Media upload│  │ Geocoding   │  │ Affiliates  │                          │  │
│  │  │ Right-reply │  │ Bbox query  │  │ Analytics   │                          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                          │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  ┌──────────────────────── INTEGRATION SERVICES ───────────────────────────────┐  │
│  │  SkyscannerService  ·  BookingComService  ·  StripeService  ·  TwilioService │  │
│  │  ResendService      ·  MapboxService      ·  WebPushService                  │  │
│  │  (Phase 2: stubs with mock data  ──►  Phase 3: real API calls + Redis cache) │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬──────────────────────────────────────────────┘
                                   │ Prisma ORM

┌──────────────────────────────────▼──────────────────────────────────────────────────┐
│  DATA LAYER                                                                         │
│                                                                                     │
│  ┌──────────────────────────────────────┐    ┌─────────────────────────────────┐  │
│  │  POSTGRESQL  (Neon / Supabase)        │    │  REDIS  (Upstash)               │  │
│  │  Primary — 18 models, 10 domains     │    │                                 │  │
│  │                                      │    │  Flight search cache  10min TTL  │  │
│  │  users            memberships        │    │  Hotel search cache   15min TTL  │  │
│  │  user_profiles    subscriptions      │    │  Price alert queue    BullMQ     │  │
│  │  user_preferences payments           │    │  Session store                  │  │
│  │  safety_contacts  bookings           │    │                                 │  │
│  │  sos_events       flight_bookings    │    └─────────────────────────────────┘  │
│  │  check_ins        hotel_bookings     │                                          │
│  │  sos_notifs       price_alerts       │    ┌─────────────────────────────────┐  │
│  │  passports        notifications      │    │  CLOUDFLARE R2  (S3-compatible) │  │
│  │  destinations     reviews            │    │                                 │  │
│  │  visa_requirements review_media      │    │  Review images                  │  │
│  │  embassies        explorer_pins      │    │  Review videos                  │  │
│  │  partners         partner_campaigns  │    │  Explorer pin media             │  │
│  │  affiliates                          │    │  User avatar originals          │  │
│  └──────────────────────────────────────┘    └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  EXTERNAL INTEGRATIONS                                                              │
│                                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │ SKYSCANNER  │  │ BOOKING.COM │  │   STRIPE    │  │   TWILIO    │              │
│  │ RapidAPI    │  │ Affiliate   │  │             │  │             │              │
│  │             │  │             │  │ Subscriptions│  │ SMS — SOS   │              │
│  │ Flight      │  │ Hotel       │  │ Webhooks    │  │ Price alerts│              │
│  │  search     │  │  search     │  │ Billing     │  │ Check-in    │              │
│  │ Affiliate   │  │ Affiliate   │  │  portal     │  │  reminders  │              │
│  │  deeplinks  │  │  deeplinks  │  │ PCI DSS     │  │             │              │
│  │             │  │             │  │  compliant  │  │             │              │
│  │ VST earns   │  │ VST earns   │  │ Card data   │  │ E.164 phone │              │
│  │  commission │  │  commission │  │  never hits │  │  required   │              │
│  │  per booking│  │  per booking│  │  VST servers│  │             │              │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘              │
│                                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                               │
│  │   RESEND    │  │   MAPBOX    │  │    CLERK    │                               │
│  │             │  │             │  │             │                               │
│  │ Transact.   │  │ Explorer    │  │ Hosted auth │                               │
│  │  email      │  │  map tiles  │  │ JWT/JWKS    │                               │
│  │ Welcome     │  │ Geocoding   │  │ MFA / SSO   │                               │
│  │ SOS alerts  │  │  (reverse)  │  │ Webhooks    │                               │
│  │ Price alerts│  │ Embassy     │  │             │                               │
│  │ Passport exp│  │  pin display│  │             │                               │
│  └─────────────┘  └─────────────┘  └─────────────┘                               │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│  AUTOMATION LAYER  (n8n)                                                            │
│                                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────────┐ │
│  │   PRICE ALERT CHECK  │  │  PASSPORT EXPIRY     │  │  SOS ESCALATION          │ │
│  │   Cron: every 4h     │  │  Cron: daily 08:00   │  │  Webhook: on ESCALATED   │ │
│  │                      │  │                      │  │                          │ │
│  │  1. Pull active       │  │  1. Find passports   │  │  1. Receive event ID     │ │
│  │     price_alerts      │  │     expiring in      │  │  2. Fetch SOS event      │ │
│  │  2. Call search API   │  │     alertDaysBefore  │  │  3. Get all contacts     │ │
│  │  3. Compare price     │  │  2. Queue email      │  │  4. Send urgent SMS      │ │
│  │  4. Queue notification│  │     notification     │  │     to all channels      │ │
│  │     if threshold hit  │  │  3. Mark notified    │  │  5. Log escalation       │ │
│  └──────────────────────┘  └──────────────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. User Sign-Up Flow

```
  Browser          Clerk           Clerk Webhook        NestJS API           Postgres
     │                │                   │                  │                   │
     │─ Sign Up ──────►│                   │                  │                   │
     │                │─ Issue JWT ───────►│                  │                  │
     │                │── user.created ───►│                  │                   │
     │                │                   │─ POST /webhooks ─►│                   │
     │                │                   │   /clerk          │─ upsert user ────►│
     │                │                   │                   │─ create profile ─►│
     │                │                   │                   │─ create prefs ───►│
     │                │                   │                   │─ membership:GUEST►│
     │                │                   │◄──────────────────│  { received:true }│
     │◄── Redirect ───│                   │                   │                   │
     │   /dashboard   │                   │                   │                   │
     │── GET /users/me (Bearer JWT) ──────────────────────────►│                   │
     │                │                   │                   │─ verify JWT ─────►Clerk JWKS
     │                │                   │                   │◄── payload.sub ───│
     │                │                   │                   │─ findUnique ─────►│
     │◄───────────────────────────────────────────────────────│  user + profile   │
```

### 2. SOS Trigger Flow

```
  User App         NestJS API           Postgres         Notification Queue    Contacts
     │                  │                   │                    │                  │
     │── POST /sos ─────►│                   │                    │                  │
     │  (+ lat/lng)      │                   │                    │                  │
     │                  │─ check active SOS ►│                    │                  │
     │                  │◄── none found ─────│                    │                  │
     │                  │─ create SOS event ►│                    │                  │
     │                  │─ get contacts ────►│                    │                  │
     │                  │◄── [{name,phone}] ─│                    │                  │
     │                  │─ create notif rows►│                    │                  │
     │                  │◄── saved ──────────│                    │                  │
     │◄── SOS event ────│                    │                    │                  │
     │    (201)         │─ dispatch ────────────────────────────►│                  │
     │                  │  (Phase 3)         │                    │─ Twilio SMS ────►│
     │                  │                   │                    │─ Resend email ──►│
     │                  │                   │                    │                  │
     │                  │ [If not resolved in 30min]             │                  │
     │                  │◄── SosEscalationTask (Cron/5min)       │                  │
     │                  │─ update status:ESCALATED ─────────────►│                  │
     │                  │─ re-dispatch ─────────────────────────►│─ Urgent SMS ────►│
```

### 3. Booking (Affiliate) Flow

```
  User             NestJS API         SkyscannerService     Skyscanner API    Partner Site
     │                  │                    │                     │                 │
     │─GET /search/     │                    │                     │                 │
     │  flights?... ───►│                    │                     │                 │
     │                  │─ searchFlights() ─►│                     │                 │
     │                  │                    │─ GET /flights ─────►│                 │
     │                  │                    │◄─── results ────────│                 │
     │                  │                    │─ append VST aff.    │                 │
     │                  │                    │   tracking code     │                 │
     │◄── [FlightResult]│◄── results ────────│                     │                 │
     │    + affiliateUrl│                    │                     │                 │
     │                  │                    │                     │                 │
     │─ click affiliate link ────────────────────────────────────────────────────────►│
     │                  │                    │                     │    (booking     │
     │                  │                    │                     │     completed   │
     │                  │                    │                     │     on partner) │
     │─ POST /bookings ►│                    │                     │                 │
     │  affiliateCode   │─ create record ───►Postgres              │                 │
     │  externalRef     │◄── saved ──────────│                     │                 │
     │◄── booking {id} ─│                    │                     │                 │
```

### 4. Membership Upgrade Flow (Phase 3)

```
  User             Next.js           NestJS API           Stripe            Postgres
     │                │                  │                   │                  │
     │─ Upgrade ──────►│                  │                  │                  │
     │                │─POST /membership/subscribe ─────────►│                  │
     │                │                  │─ create checkout ►│                  │
     │                │◄──────────────── checkout.url ───────│                  │
     │◄──── redirect ─│                  │                   │                  │
     │                │                  │                   │                  │
     │── Pay ─────────────────────────────────────────────────►│                  │
     │                │                  │                   │─ webhook ─────────►│
     │                │                  │◄── POST /webhooks/│  (NestJS)         │
     │                │                  │    stripe         │                   │
     │                │                  │─ update membership────────────────────►│
     │                │                  │    tier: PREMIUM  │                   │
     │◄─── redirect ──│◄── success ──────│                   │                   │
     │    /dashboard  │                  │                   │                   │
```

---

## Infrastructure Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  INFRASTRUCTURE                                                                  │
│                                                                                  │
│  ┌──────────────────────────────────┐   ┌───────────────────────────────────┐  │
│  │  VERCEL                           │   │  RAILWAY                          │  │
│  │                                  │   │                                   │  │
│  │  apps/web (Next.js 14)           │   │  apps/api (NestJS)                │  │
│  │                                  │   │                                   │  │
│  │  Global CDN — 100+ edge nodes    │   │  Auto-deploy on push to main      │  │
│  │  SSG pages cached at edge        │   │  Health check: GET /health        │  │
│  │  SSR/RSC close to user           │   │  Horizontal scaling: replicas     │  │
│  │  Zero cold starts (Edge Runtime) │   │                                   │  │
│  │                                  │   │  Environment vars in Railway      │  │
│  │  Env vars in Vercel dashboard    │   │  dashboard — never in repo        │  │
│  │  — never in repo                 │   │                                   │  │
│  │                                  │   │  n8n workers run here or on       │  │
│  │  Clerk + Stripe webhook          │   │  separate Railway service         │  │
│  │  receivers deployed as           │   │                                   │  │
│  │  Vercel serverless functions     │   └───────────────────────────────────┘  │
│  └──────────────────────────────────┘                                           │
│                                                                                  │
│  ┌──────────────────────────────────┐   ┌───────────────────────────────────┐  │
│  │  NEON / SUPABASE                 │   │  UPSTASH                          │  │
│  │  Managed PostgreSQL              │   │  Serverless Redis                 │  │
│  │                                  │   │                                   │  │
│  │  Connection pooling via          │   │  Per-request billing              │  │
│  │  pgBouncer (Neon built-in)       │   │  Global replication               │  │
│  │                                  │   │  REST + redis protocol            │  │
│  │  Branching per PR environment    │   │                                   │  │
│  │  Point-in-time restore           │   └───────────────────────────────────┘  │
│  └──────────────────────────────────┘                                           │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Dependency Map

```
                        ┌─────────────┐
                        │ PrismaModule│  (Global — injected everywhere)
                        └──────┬──────┘
                               │
              ┌────────────────┼───────────────────┐
              │                │                   │
       ┌──────▼──────┐         │                   │
       │  AuthModule │         │                   │
       │             │         │                   │
       │ AuthService │         │                   │
       │ ClerkGuard  │         │                   │
       └──────┬──────┘         │                   │
              │ exports        │                   │
    ┌─────────┼──────────────────────────────────────────┐
    │         │                │                   │      │
    ▼         ▼                ▼                   ▼      │
┌────────┐ ┌────────┐    ┌────────────┐   ┌─────────────┐│
│ Users  │ │ Safety │    │  Booking   │   │Notifications││
│ Module │ │ Module │    │   Module   │   │   Module    ││
│        │ │        │    │            │   │  (Phase 3)  ││
│imports │ │imports │    │  imports   │   │             ││
│ Auth   │ │ Auth   │    │  Auth      │   │imports Auth ││
│        │ │        │    │            │   │             ││
│exports │ │exports │    │  Skyscanner│   │exports      ││
│UsersS. │ │SafetyS.│    │  BookingCom│   │NotifService ││
└────────┘ └────────┘    │  services  │   └─────────────┘│
                         └────────────┘                   │
                                                          │
    ┌─────────────┐  ┌──────────────┐  ┌─────────────┐   │
    │  Membership │  │   Payments   │  │    Visa     │   │
    │   Module    │  │    Module    │  │   Module    │   │
    │  (Phase 3)  │  │  (Phase 3)   │  │  (Phase 3)  │   │
    │             │  │              │  │             │   │
    │  imports    │  │  imports     │  │  imports    │   │
    │  Auth       │  │  Auth        │  │  Auth       │   │
    └─────────────┘  └──────────────┘  └─────────────┘   │
                                                          │
    ┌─────────────┐  ┌──────────────┐  ┌─────────────┐   │
    │  Community  │  │   Explorer   │  │   Partners  │   │
    │  (Deferred) │  │  (Deferred)  │  │  (Deferred) │   │
    └─────────────┘  └──────────────┘  └─────────────┘   │
    └────────────────────────────────────────────────────────────────┘
```

---

## System Boundaries

| Boundary | Inside VST | Outside VST |
|----------|-----------|-------------|
| Identity | User DB record, preferences, tier | Passwords, sessions, MFA — all Clerk |
| Payments | Subscription records, payment history | Card data, checkout flow — all Stripe |
| Bookings | Booking record, affiliate code | Actual reservation, payment — partner site |
| Auth tokens | JWT validation, DB user lookup | JWT issuance, key management — Clerk |
| Media storage | Upload orchestration, DB reference | File bytes — Cloudflare R2 |
| Notifications | Routing logic, delivery records | SMTP relay — Resend; SMS delivery — Twilio |
| Maps | Pin data, search queries | Tile rendering, geocoding API — Mapbox |

---

## Security Boundaries

```
UNTRUSTED                          TRUST BOUNDARY                         TRUSTED
─────────                          ──────────────                         ───────
Public internet   ──► Vercel/Railway edge ──► ClerkAuthGuard ──► NestJS controllers
Clerk webhooks    ──► svix HMAC verify    ──► AuthController  ──► AuthService
Stripe webhooks   ──► Stripe sig verify   ──► PaymentsCtrl    ──► PaymentsService
User file uploads ──► Virus scan stub     ──► R2 presigned URL ──► Cloudflare R2
```

---

## Phase Completion Status

```
PHASE 1 — Architecture + Schema    ████████████████████  100% ✅
PHASE 2 — Core Modules (4/10)      ████████░░░░░░░░░░░░   40% ✅
PHASE 3 — Integrations + Notifs    ░░░░░░░░░░░░░░░░░░░░    0% ⏳
PHASE 4 — Deployment Prep          ░░░░░░░░░░░░░░░░░░░░    0% ⏳
```

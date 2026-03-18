# VST Platform — Mermaid Diagrams

Renders on GitHub. For the full ASCII diagram see `architecture-diagram.md`.

---

## Full System Topology

```mermaid
graph TB
    subgraph CLIENT["CLIENT LAYER"]
        WEB["Next.js Web App<br/>Vercel CDN / Edge<br/>SSG · SSR · RSC"]
        MOB["Mobile App<br/>React Native / Expo<br/>⏸ Future"]
    end

    subgraph IDENTITY["IDENTITY — Clerk (Hosted)"]
        CLERK["JWT Issuance · JWKS · MFA<br/>Social Login · Webhooks"]
    end

    subgraph API["API LAYER — NestJS (Railway :3001)"]
        PIPELINE["ClerkAuthGuard · ThrottlerModule · ValidationPipe"]

        subgraph MODULES_LIVE["Core Modules — Phase 2 ✅"]
            AUTH["Auth Module<br/>Clerk sync · JWT guard<br/>GDPR delete"]
            USERS["Users Module<br/>Profile · Prefs<br/>Contacts · Passport"]
            SAFETY["Safety Module<br/>SOS · Check-ins<br/>Escalation Cron/5min"]
            BOOKING["Booking Module<br/>Flight · Hotel search<br/>Records · Price Alerts"]
        end

        subgraph MODULES_P3["Phase 3 Modules ⏳"]
            NOTIF["Notifications<br/>Email · SMS · Push"]
            MEMBER["Membership<br/>Tier mgmt · Upgrade"]
            PAYMENTS["Payments<br/>Stripe subs · Webhooks"]
            VISA["Visa & Embassy<br/>Passport expiry"]
        end

        subgraph MODULES_DEF["Deferred ⏸"]
            COMMUNITY["Community<br/>Reviews · Media"]
            EXPLORER["Explorer Map<br/>Pins · Geocoding"]
            PARTNERS["Partners<br/>Campaigns · Affiliates"]
        end

        subgraph INTEGRATIONS["Integration Services"]
            SKYSVC["SkyscannerService"]
            BCOMSVC["BookingComService"]
            STRIPESVC["StripeService"]
            TWILSVC["TwilioService"]
            RESENDSVC["ResendService"]
            MAPBOXSVC["MapboxService"]
        end
    end

    subgraph DATA["DATA LAYER"]
        PG["PostgreSQL<br/>Neon / Supabase<br/>18 models · Prisma ORM"]
        REDIS["Redis<br/>Upstash<br/>Cache · Queues"]
        R2["Cloudflare R2<br/>Media Storage"]
    end

    subgraph EXTERNAL["EXTERNAL INTEGRATIONS"]
        SKY["Skyscanner<br/>Flight Search<br/>Affiliate deeplinks"]
        BCOM["Booking.com<br/>Hotel Search<br/>Affiliate deeplinks"]
        STRIPE["Stripe<br/>Subscriptions<br/>PCI DSS compliant"]
        TWILIO["Twilio<br/>SMS — SOS Alerts<br/>Price Alerts"]
        RESEND["Resend<br/>Transactional Email<br/>SOS · Passport · Alerts"]
        MAPBOX["Mapbox<br/>Explorer Map<br/>Geocoding"]
        N8N["n8n Automation<br/>Price alerts · Passport expiry<br/>SOS escalation"]
    end

    WEB -->|"Bearer JWT"| IDENTITY
    MOB -->|"Bearer JWT"| IDENTITY
    CLERK -->|"user.created/updated/deleted"| AUTH

    WEB -->|"HTTPS + JWT"| PIPELINE
    MOB -->|"HTTPS + JWT"| PIPELINE
    PIPELINE --> AUTH
    PIPELINE --> USERS
    PIPELINE --> SAFETY
    PIPELINE --> BOOKING
    PIPELINE --> NOTIF
    PIPELINE --> MEMBER
    PIPELINE --> PAYMENTS
    PIPELINE --> VISA

    BOOKING --> SKYSVC
    BOOKING --> BCOMSVC
    PAYMENTS --> STRIPESVC
    NOTIF --> TWILSVC
    NOTIF --> RESENDSVC
    EXPLORER --> MAPBOXSVC

    SKYSVC -->|"RapidAPI"| SKY
    BCOMSVC -->|"Affiliate API"| BCOM
    STRIPESVC -->|"Stripe SDK"| STRIPE
    TWILSVC -->|"REST API"| TWILIO
    RESENDSVC -->|"REST API"| RESEND
    MAPBOXSVC -->|"REST API"| MAPBOX

    AUTH --> PG
    USERS --> PG
    SAFETY --> PG
    BOOKING --> PG
    NOTIF --> PG
    MEMBER --> PG
    PAYMENTS --> PG
    VISA --> PG

    BOOKING -->|"Search cache"| REDIS
    NOTIF -->|"Job queue"| REDIS

    COMMUNITY -->|"Media refs"| R2
    EXPLORER -->|"Media refs"| R2

    N8N -->|"Webhook triggers"| API

    style MODULES_LIVE fill:#1a3a1a,stroke:#4ade80,color:#e2e8f0
    style MODULES_P3 fill:#1a1a3a,stroke:#818cf8,color:#e2e8f0
    style MODULES_DEF fill:#2a2a2a,stroke:#6b7280,color:#9ca3af
    style CLIENT fill:#0f172a,stroke:#d4a853,color:#e2e8f0
    style IDENTITY fill:#1e1a0a,stroke:#d4a853,color:#e2e8f0
    style API fill:#0f1a2a,stroke:#3b82f6,color:#e2e8f0
    style DATA fill:#0f1a2a,stroke:#06b6d4,color:#e2e8f0
    style EXTERNAL fill:#1a0f2a,stroke:#a855f7,color:#e2e8f0
```

---

## SOS Data Flow

```mermaid
sequenceDiagram
    participant U as User App
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Q as Notification Queue
    participant T as Twilio SMS
    participant E as Resend Email

    U->>API: POST /v1/sos {lat, lng, message}
    API->>DB: findFirst(status: ACTIVE|ESCALATED)
    DB-->>API: none found
    API->>DB: create SosEvent {ACTIVE}
    API->>DB: findMany SafetyContacts {notifyOnSos: true}
    DB-->>API: [{name, phone, email}]
    API->>DB: create SosContactNotification rows
    DB-->>API: saved
    API-->>U: 201 {sosEvent}

    Note over API,Q: Phase 3 — dispatch wired
    API->>Q: dispatch notifications
    Q->>T: SMS to all contacts (PREMIUM+)
    Q->>E: Email to all contacts (all tiers)

    Note over API: If not resolved in 30min
    API->>API: SosEscalationTask (Cron/5min)
    API->>DB: update status: ESCALATED
    API->>Q: re-dispatch urgent notifications
    Q->>T: Urgent SMS re-send
```

---

## Booking Affiliate Flow

```mermaid
sequenceDiagram
    participant U as User
    participant WEB as Next.js
    participant API as NestJS API
    participant SKY as SkyscannerService
    participant EXT as Skyscanner API
    participant PART as Partner Site

    U->>WEB: Search flights
    WEB->>API: GET /v1/search/flights?origin=LHR&...
    API->>SKY: searchFlights(dto)
    SKY->>EXT: GET /flights/search (Phase 3)
    EXT-->>SKY: results[]
    SKY-->>API: FlightResult[] + affiliateUrl
    API-->>WEB: results
    WEB-->>U: Display results

    U->>PART: Click affiliate deeplink
    Note over PART: User books and pays on partner site
    PART-->>U: Booking confirmation + ref

    U->>API: POST /v1/bookings {affiliateCode, externalRef}
    API->>API: create booking record
    API-->>U: 201 {booking}
    Note over API: VST never touches payment
```

---

## Membership Upgrade Flow

```mermaid
sequenceDiagram
    participant U as User
    participant WEB as Next.js
    participant API as NestJS API
    participant STR as Stripe
    participant DB as PostgreSQL

    U->>WEB: Click Upgrade to Premium
    WEB->>API: POST /v1/membership/subscribe {tier: PREMIUM}
    API->>STR: create checkout session
    STR-->>API: {url: checkout.stripe.com/...}
    API-->>WEB: {url}
    WEB-->>U: Redirect to Stripe Checkout

    U->>STR: Enter card + pay
    Note over STR: Card data never hits VST
    STR-->>U: Redirect to /dashboard?success=true

    STR->>API: POST /v1/webhooks/stripe
    Note over API: customer.subscription.created
    API->>DB: update Membership {tier: PREMIUM}
    API->>DB: create Subscription record
    API->>DB: create Notification {MEMBERSHIP_RENEWAL}
```

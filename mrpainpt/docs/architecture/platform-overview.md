# Mr Pain PT — Platform Architecture Overview

**Version:** 2.0 (Phase 2 — Canonical data structure)
**Last updated:** 2026-03

---

## What Mr Pain PT is

Mr Pain PT is a white-label rehabilitation coaching platform for physiotherapists and sports medicine practitioners. It allows clinicians to deliver personalised, app-based rehab programs to individual clients without requiring a custom app build for each.

The platform consists of:

1. **Client app** — A mobile-first web app each client uses to follow their program
2. **Coach portal** — A web interface for PTs to manage clients, review progress, and publish notes
3. **Shared exercise library** — A clinically organised library of rehab exercises reusable across clients
4. **White-label config system** — A folder-per-client registry that drives personalised deployments
5. **API layer** — A thin serverless API that merges client configs and exercise data at request time

---

## Folder structure

```
mrpainpt/
│
├── apps/
│   ├── client/         The client-facing rehab app (Phase 1 — live)
│   └── coach/          The coach-facing management portal (Phase 3)
│
├── packages/
│   ├── exercise-library/   Canonical shared exercise database
│   ├── progress-engine/    Progress calculation and session state logic
│   ├── auth/               Auth utilities — PIN, session tokens
│   └── ui-tokens/          Shared CSS design tokens for cross-app theming
│
├── clients/
│   ├── _template/          Reference config for onboarding new clients
│   └── <client-slug>/      One folder per client — canonical data source
│
├── api/                Netlify Edge Function API handlers (Phase 4)
│
└── docs/               Platform documentation (this folder)
    ├── architecture/
    ├── coach-portal-plan.md
    ├── api-plan.md
    └── whitelabel-deployment-plan.md
```

---

## The five phases

### Phase 1 — Client app (COMPLETE)

**What was built:**
The first working product: a single-client mobile rehab web app for Sarah Thompson (ACL rehabilitation). Deployed as a static site on Netlify with no build step.

**Key characteristics:**
- Pure static HTML/CSS/JS — no framework, no build tool
- localStorage-based session state
- Hash-based client-side routing
- Client data (profile, exercises, plan) hardcoded into three JS files
- White-labelling = copy-pasting the folder and editing data files

**Live at:** `mrpainpt/apps/client/`
**Fallback:** `tools/rehab-client/`

---

### Phase 2 — Canonical data structure (IN PROGRESS)

**What changes:**
The developer-side structure is established. Client data moves to its permanent canonical home. The exercise library gets a single authoritative source. The browser-facing data files in `apps/client/scripts/data/` continue to be served, but they are formally acknowledged as deployment artifacts — manually-synced copies of the canonical sources.

**Key changes:**
- `mrpainpt/clients/sarah-thompson/` — canonical client config and plan
- `mrpainpt/packages/exercise-library/` — canonical exercise library
- `mrpainpt/clients/_template/` — reference template for new clients
- No changes to `apps/client/` — live app is untouched
- No deployment changes

**Constraint:** Without a build step, files outside the Netlify publish directory (`mrpainpt/apps/client/`) are invisible to the browser. Phase 2 establishes the pattern; Phase 4 automates the sync.

**Sync pattern:**
```
[Developer edits canonical source]
clients/sarah-thompson/client.config.js   →  (manual sync)  →  apps/client/scripts/data/client.js
clients/sarah-thompson/plan.js            →  (manual sync)  →  apps/client/scripts/data/plan.js
packages/exercise-library/index.js        →  (manual sync)  →  apps/client/scripts/data/exercises.js
```

---

### Phase 3 — Coach portal

**What will be built:**
A separate web app (`mrpainpt/apps/coach/`) that gives PTs visibility and control over their clients' programs.

**Capabilities:**
- View all clients and their current status
- Review session history, pain scores, and effort ratings
- Write and publish coach notes
- View exercise completion and progress timelines

**Data source (Phase 3):** Reads from `clients/` config files — still static at this stage. No write-back to a database yet.

**Auth:** URL-based access initially (internal tool). Full auth introduced in Phase 4.

See `docs/coach-portal-plan.md` for full design.

---

### Phase 4 — API layer

**What changes:**
A thin serverless API layer (Netlify Edge Functions under `mrpainpt/api/`) replaces the static data files as the browser-facing data source.

**Key changes:**
- `api/` edge functions handle `/api/client/:id`, `/api/exercises`, `/api/progress`, etc.
- A persistence backend is introduced (Supabase recommended — lowest friction with static/edge stack)
- `clients/` config files become the seeding source for the database
- `apps/client/` is updated to call the API instead of loading inline JS data files
- Session state moves from localStorage to `POST /api/client/:id/sessions`
- Auth is introduced: client PIN gate, coach login

**Impact:** The manual sync pattern from Phase 2 is eliminated. The canonical data in `clients/` is now the live source.

See `docs/api-plan.md` for full design.

---

### Phase 5 — White-label deployment

**What changes:**
Adding a new client becomes a configuration operation rather than a manual deploy.

**Key changes:**
- A provisioning script reads all `clients/*/client.meta.json` files
- For each `status: "active"` client, it triggers a Netlify deploy scoped to that client
- Each deployment gets its own URL: `<slug>.mrpainpt.com` or a custom domain
- `client.meta.json` is updated with the `deployUrl` on successful provision
- A coach-side admin UI lists all clients and their deployment status

See `docs/whitelabel-deployment-plan.md` for full design.

---

## Component responsibilities

### `apps/client/`

The client-facing rehab app. A single-page application (SPA) using hash-based routing. Screens: welcome, dashboard, overview, plan, session, exercises, progress, coach notes.

**Owned by:** clients (read-only view of their program)
**Data flow:**
- Phase 1–3: Reads from `scripts/data/*.js` (static data, baked in at deploy time)
- Phase 4+: Reads from the API (`/api/client/:id`, `/api/exercises`, `/api/progress`)

---

### `apps/coach/`

The coach-facing management portal. A separate SPA with a different UX optimised for managing multiple clients simultaneously.

**Owned by:** coaches (read + write)
**Data flow:**
- Phase 3: Reads from `clients/` config files (static)
- Phase 4+: Reads and writes via the API

---

### `packages/exercise-library/`

The canonical database of all reusable rehabilitation exercises. Condition-agnostic, not owned by any client.

**Used by:**
- `apps/client/` (via `scripts/data/exercises.js` in Phase 1–3, via API in Phase 4+)
- `apps/coach/` (exercise assignment, library browsing)
- `api/exercises` endpoint (serves and merges with client overrides)

---

### `packages/progress-engine/`

Shared logic for calculating client progress. Extracted from `apps/client/scripts/app.js` in Phase 2.

**Functions (planned):**
- `calculateProgress(plan, sessionState)` → percentage and stats
- `getCurrentPhase(plan, sessionState)` → current phase object
- `getMilestoneStatus(config, sessionState)` → achieved/pending milestones
- `getSessionHistory(sessionState)` → array of completed sessions with ratings

**Used by:** `apps/client/`, `apps/coach/`, `api/progress`

---

### `clients/<slug>/`

One folder per client. The single source of truth for everything specific to that client: their profile, program plan, exercise overrides, and deployment metadata.

**Contents:**
- `client.config.js` — identity, branding, goals, milestones, coach notes
- `plan.js` — session schedule
- `exercises.js` — client-specific exercises and prescription overrides
- `client.meta.json` — registry metadata, deployment status

---

### `api/`

Thin serverless API layer (Netlify Edge Functions, TypeScript). No business logic — the edge functions are thin handlers that read from the database (Phase 4+) or from `clients/` config files (Phase 3).

See `docs/api-plan.md`.

---

## How the platform scales to many PT clients

### One deployment per client (Phase 5)

Each client gets their own isolated Netlify site. Isolation means:
- Their data is never mixed with another client's
- Their app can have custom branding (colour, name, logo)
- A URL or subdomain can be assigned per client

```
sarah.mrpainpt.com   →  Sarah Thompson's ACL rehab app
james.mrpainpt.com   →  James Okonkwo's shoulder rehab app
lisa.mrpainpt.com    →  Lisa Yamamoto's hip replacement program
```

### The coach manages all from one portal

The coach portal is a separate deployment that can query all clients. A PT with 20 clients sees a single dashboard. They write notes, review progress, assign new exercises — all from one interface.

### White-label for multiple PTs (Phase 5+)

A PT clinic (not just an individual) can white-label the platform entirely:
- Custom domain: `rehab.clinicname.com`
- Custom branding across all their clients
- Coach portal at `coach.clinicname.com`

This requires adding a coach registry (mirroring the client registry) and a tenant layer to the API.

### Scaling constraints and mitigations

| Constraint | Phase | Mitigation |
|------------|-------|------------|
| Static data baked into client app | 1–3 | Phase 4 API layer eliminates this |
| No real-time progress sync | 1–3 | localStorage is per-device; Phase 4 adds database |
| Manual deploy per client | 1–4 | Phase 5 provisioning script automates this |
| Single coach per client | 1–5 | Multi-coach support via coach registry in Phase 5+ |
| No offline support | 1+ | PWA service worker added in Phase 3 or 4 |

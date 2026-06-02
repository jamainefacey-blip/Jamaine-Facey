# PAIN SYSTEM — MASTER ARCHITECTURE
# One Truth Document
# Status classification: VERIFIED | INFERRED | ASSUMED | UNVERIFIED

Last updated: 2026-06-02
Updated by: Claude Code (session d1c7bdbc)
Branch at time of update: claude/add-llm-router-models-moa3U
Evidence source: Live session inspection, git log, Vercel probe, Supabase probe

---

## AUTHORITATIVE SOURCE HIERARCHY

```
TIER 1 — RUNTIME TRUTH (live operational state)
  governance/RUNTIME_TRUTH.md
  Updated every session. Evidence-based only. No assumptions.

TIER 2 — GITHUB (code and committed project state)
  jamainefacey-blip/Jamaine-Facey
  Canonical source for all code, config, and committed architecture.
  If it is not committed, it does not exist for agents.

TIER 3 — OBSIDIAN (human-readable knowledge vault)
  C:\painSystemVault\Pain-System-Vault (INFERRED — see OBSIDIAN_LINK_STATUS.md)
  Human operator's long-form thinking, decisions, SOPs, governance.
  NOT accessible to agents without Local REST API bridge.

TIER 4 — AVA (operator and decision surface)
  AI Lab orchestration panel (port 4444, local only)
  Produces structured output: ExtractedSystem, GapRiskReport, BuildSpec
  Routes output via A/B/C/D to data/ stores

TIER 5 — DECISION QUEUE (founder action layer)
  governance/QUEUE.md (this repo)
  Items requiring founder action before agents can proceed.
  Agents surface blockers here. Founder clears them.
```

---

## SYSTEM INVENTORY

### 1. AVA
**Lane:** AI_LAB
**Status:** VERIFIED — local execution, not live-deployed as a service
**Description:** AI Lab orchestration panel. Pipelines: vst-trip, vst-lead, vst-ava. Routes A (Lead Capture) / B (Booking Flow) / C (Enterprise Flag) / D (Internal Analysis).
**Location:** tools/rehab-client/ai-lab/ (baseline_v2, protected)
**Entry point:** `pnpm open:ai-lab` → http://localhost:4444
**Baseline lock:** commit e6a0552 (2026-03-24). Protected: server.js, index.html pipeline and routing logic.
**Live URL:** NONE — local only
**Evidence:** memory/ai-lab/baseline_v2.md, memory/governance/codespaces.md

### 2. AVACORE
**Lane:** AI_LAB
**Status:** VERIFIED — code committed, DARK (no live endpoint)
**Description:** 10-model multi-LLM router. Task-type assignments, auto-fallback chains. Extends (does not replace) baseline_v2 router.
**Location:** ai-lab/model-router.ts (AVACORE extension appended), ai-lab/types.ts
**Commit:** ac903ce (branch: claude/add-llm-router-models-moa3U)
**Spec:** LLM_ROUTER_SPEC.md
**Live endpoint:** NONE — routeAvacore() is unreachable from any external system
**Evidence:** git log, TypeScript compilation verified (0 errors), LLM_ROUTER_SPEC.md

### 3. PAIN BUSINESS OS
**Lane:** ADMIN
**Status:** UNVERIFIED — no code found in repo
**Description:** Declared system. No files, no endpoints, no schema found in any inspected directory.
**Location:** UNKNOWN
**Live URL:** UNKNOWN
**Evidence:** NONE — referenced in user task only

### 4. VOYAGE SMART TRAVEL (VST)
**Lane:** VST
**Status:** VERIFIED (frontend) / DEAD (database)
**Description:** Corporate travel platform SPA. Static HTML + Vercel Lambda functions.
**Location:** voyage-smart-travel/
**Frontend live:** https://voyage-smart-travel.vercel.app
**Vercel project:** prj_Oi4nDouiclT7oEQmaoYqbhGB6kU7
**Second Vercel project:** prj_W6MPl8lPo2Qv7EJTQQcu4WvcziFc (voyage-smart-travel-live) — AMBIGUOUS, canonical not declared
**Database:** Supabase ovmlmregvcekbvoctywe — 0 tables applied (all 4 TABLE_MISSING as of 2026-06-02)
**Lambda env confirmed present:** ANTHROPIC_API_KEY, JWT_SECRET
**Lambda env confirmed absent:** SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, any Supabase credentials
**Critical finding:** JWT_SECRET is VST's own user-auth HMAC-SHA256 signing key. It is NOT the Supabase project JWT secret. Derived service_role JWTs from JWT_SECRET return HTTP 401 from Supabase.
**Tech debt:** Root api/run-migrations.js (temp file) + root vercel.json functions block — both added for migration attempt, not cleaned up.
**Open PR:** #22 (founder 401 access fix) — unresolved
**Evidence:** Vercel probe HTTP 200/401, envkeys inspection, Supabase table probe, git log

#### VST API Endpoints (VERIFIED — code exists)
| Endpoint | Method | File |
|---|---|---|
| /v1/users/register | POST | voyage-smart-travel/api/v1-users-register.js |
| /v1/users/login | POST | voyage-smart-travel/api/v1-users-login.js |
| /v1/users/me | GET/PATCH | voyage-smart-travel/api/v1-users-me.js |
| /v1/bookings | GET/POST | voyage-smart-travel/api/v1-bookings.js |
| /v1/bookings/:id | GET | voyage-smart-travel/api/v1-bookings-id.js |
| /api/ava-evaluate | POST | voyage-smart-travel/api/ava-evaluate.js |
| /api/planner-chat | POST | voyage-smart-travel/api/planner-chat.js |
| /api/ava-itinerary | POST | voyage-smart-travel/api/ava-itinerary.js |
| /api/fares/search | POST | voyage-smart-travel/api/flights-search.js |
| /v1/eco/calculate | POST | voyage-smart-travel/api/eco-calculate.js |

#### VST Migrations (VERIFIED — SQL exists, NOT APPLIED)
| File | Tables | Applied |
|---|---|---|
| 001_user_profiles.sql (main branch) | user_profiles | NO |
| 002_user_dashboard.sql (main branch) | user_dashboard | NO |
| 003_planner_memory.sql | planner_memory | NO |
| 004_bookings.sql | bookings | NO |
| ALL_MIGRATIONS.sql | Consolidated idempotent | NO |

### 5. FRAUD HELP INDEX (FHI)
**Lane:** FHI
**Status:** INFERRED — agent definition exists, no product code found
**Description:** Fraud Help Index system. Agent builder configured with scope tools/rehab-client/fhi/** and memory/fhi/**. Neither directory found in repo.
**Location:** UNKNOWN — declared scope does not exist in filesystem
**Live URL:** UNKNOWN
**Evidence:** .claude/agents/fhi-builder.md (scope declared), ls tools/rehab-client/ (no fhi/ directory)

### 6. PAIN SYSTEM WEBSITE
**Lane:** ADMIN / BACKYARD (sandbox)
**Status:** VERIFIED — edge function deployed via Netlify
**Description:** Pain System health/status endpoint. Netlify Edge Function (Deno runtime).
**Location:** netlify/edge-functions/pain-system.ts
**Endpoint:** /pain-system
**Response:** `{"system":"Pain System","status":"online","node":"Netlify Edge Sandbox"}`
**Additional tools:** /tools/hello-pain (tools/hello-pain/handler.ts), /tools/rehab-client (tools/rehab-client/)
**Evidence:** MODULE_REGISTRY.md, file confirmed present

### 7. OBSIDIAN
**Lane:** GOVERNANCE
**Status:** INFERRED — vault path from Codex report, structure from founder confirmation
**Description:** Human-readable knowledge vault. Operator's primary long-form knowledge layer.
**Vault path:** C:\painSystemVault\Pain-System-Vault (INFERRED — Codex report)
**Vault structure (founder confirmed, INFERRED):**
  00-GOVERNANCE, 01-AVA, 02-VST, 03-DISPATCH, 04-OPERATIONS, 05-RESEARCH,
  06-PROMPTS, 07-HANDOFFS, 08-FAILURES, 09-SOPS, 10-MONETISATION,
  11-PROVIDERS, 12-SECURITY, 99-ARCHIVE, SYSTEM
**SYSTEM folder contains (founder confirmed, INFERRED):**
  SESSION_BOOT, SYSTEM_MAP, HANDOFF, PROGRESS, QUEUE, ACTIVE_TASK
**Agent access:** NONE — Local REST API not configured, no bridge to any automated agent
**Sync status:** UNKNOWN — device-local on Windows, iCloud sync status unknown
**Critical gap:** Obsidian is the human knowledge layer but is invisible to all agents. Every session insight is lost unless operator manually copies to Obsidian.
**Evidence:** Founder statement in session, Codex report reference (neither directly verified)
**See:** OBSIDIAN_LINK_STATUS.md

### 8. RUNTIME TRUTH
**Lane:** GOVERNANCE
**Status:** CREATED THIS SESSION — was ABSENT before 2026-06-02
**Description:** Canonical live operational state. Evidence-based. Updated every session.
**Location:** governance/RUNTIME_TRUTH.md (this repo)
**Previous state:** File did not exist. Agents were operating without a shared state document.
**Evidence:** ls /home/user/Jamaine-Facey — file not found before this session

### 9. GITHUB
**Lane:** GOVERNANCE
**Status:** VERIFIED — fully operational
**Description:** Single source of truth for code and committed architecture.
**Repo:** jamainefacey-blip/Jamaine-Facey
**Active branches:** main, claude/add-llm-router-models-moa3U
**Latest commit (feature branch):** 852e8a2 (chore: ignore *.tsbuildinfo)
**Latest commit (main):** 57af118 (fix(vst): derive service_role JWT from JWT_SECRET env var)
**Open PRs:** #22 (founder 401 access fix)
**Evidence:** git log, git status (clean)

### 10. VERCEL
**Lane:** VST / ADMIN
**Status:** VERIFIED — deployment pipeline functional
**Team:** team_0vHSlDi27pKmZh2dD1VzrPFd (SmartTrip's projects)
**Projects:**
  - voyage-smart-travel (prj_Oi4nDouiclT7oEQmaoYqbhGB6kU7) — VERIFIED production
  - voyage-smart-travel-live (prj_W6MPl8lPo2Qv7EJTQQcu4WvcziFc) — AMBIGUOUS
**Runtime:** Node.js 24
**Package manager:** pnpm v10.33.0
**Latest deployment:** dpl_BDJ4SHAA6iUmGNE8AC9ff8QhC8Cb — READY (production)
**Root vercel.json:** outputDirectory: voyage-smart-travel (confirmed)
**Root vercel.json temp debt:** functions block for api/run-migrations.js — needs cleanup
**Evidence:** Vercel MCP probe, root vercel.json read, deployment status confirmed

### 11. SUPABASE
**Lane:** VST
**Status:** VERIFIED (connectivity) / DEAD (schema)
**Project ID:** ovmlmregvcekbvoctywe
**URL:** https://ovmlmregvcekbvoctywe.supabase.co
**Container access:** BLOCKED — IP allowlist prevents direct access from Claude Code sessions
**Lambda access:** VERIFIED reachable — HTTP 401 (no credentials), not 403 (IP block)
**Schema state:** 0 tables applied. All 4 expected tables: TABLE_MISSING
**Missing credential:** SUPABASE_SERVICE_ROLE_KEY not in any accessible env
**Evidence:** HTTP probe from Lambda (401 not 403), table existence check, envkeys inspection

### 12. DISPATCH
**Lane:** ADMIN / GOVERNANCE
**Status:** UNVERIFIED — referenced as system component, no code found
**Description:** Declared routing/dispatch layer. No files, endpoints, or schema identified.
**Location:** UNKNOWN
**Evidence:** NONE beyond system-level references

### 13. CODEX
**Lane:** GOVERNANCE
**Status:** ASSUMED — referenced as session report generator
**Description:** Appears to function as a session agent that produces system reports (e.g., the Obsidian vault path report). May be a GPT-based session or a separate agent configuration.
**Location:** UNKNOWN
**Evidence:** Referenced in user instructions: "Inspect Obsidian status evidence from latest Codex report"

### 14. CLAUDE
**Lane:** GOVERNANCE
**Status:** VERIFIED — active session
**Description:** This session. Claude Code running in remote execution environment.
**Model:** claude-sonnet-4-6
**Session:** d1c7bdbc-517c-454e-84df-a0cba96e1ecf
**Tool access:** GitHub MCP, Vercel MCP, Notion MCP, Canva MCP, standard tools
**Constraint:** Remote container — direct Supabase access blocked by IP allowlist

---

## INTEGRATION MAP

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAIN SYSTEM TOPOLOGY                         │
│                    (VERIFIED connections only)                  │
└─────────────────────────────────────────────────────────────────┘

GITHUB ──────────────────────────────────────────────────────────
  │ (code push)          │ (deployment trigger)
  ▼                      ▼
CLAUDE CODE          VERCEL LAMBDA
  │                      │
  │ (no Supabase creds)  │ (no Supabase creds in env)
  │                      ▼
  │                  SUPABASE ← [CREDENTIAL GAP — unblocked by operator]
  │                  (reachable, schema empty)
  │
  ▼
NETLIFY EDGE (/pain-system, /tools/*)
  [separate from VST, no shared state]

LOCAL (operator machine)
  AVA (port 4444) ← [not network-accessible]
  OBSIDIAN vault ← [no agent bridge]
  CODEX ← [unknown runtime]

DISCONNECTED ISLANDS:
  AVACORE → built, no endpoint
  FHI → agent defined, no code
  DISPATCH → referenced, no code
  PAIN BUSINESS OS → referenced, no code
```

---

## GOVERNANCE RULES (from CLAUDE.md — VERIFIED)

1. Council First — No build, deploy, or API change without Round Table quorum.
2. Security Officer Hard Veto — 47-point checklist must pass before any deploy.
3. Secrets Out-of-Band — ANTHROPIC_API_KEY, JWT_SECRET, Amadeus creds: env vars only, never in source.
4. API Contract Versioned — All /v1/ endpoints are stable. Breaking changes require Architect sign-off.
5. Ava Safety Non-Negotiable — AVA evaluation gate must not be bypassed or degraded.
6. Rollback Plan Required — Every Vercel deploy has a documented rollback before it ships.

---

## BASELINE LOCKS

| Baseline | Commit | Protected Files | Status |
|---|---|---|---|
| baseline_v2 | e6a0552 | tools/rehab-client/ai-lab/server.js, index.html (pipeline/routing/action layers) | ACTIVE — do not modify |

---

## LANE REGISTRY

| Lane | System | Port | Owner |
|---|---|---|---|
| VST | Voyage Smart Travel | 3000 / Vercel | VST team |
| AI_LAB | AVA + AVACORE | 4444 (local) | AI Lab team |
| FHI | Fraud Help Index | UNKNOWN | FHI team |
| ADMIN | Pain Business OS, Pain System Website | Netlify | Founder |
| BACKYARD | Rehab Client, Hello Pain | Netlify | Sandbox |
| GOVERNANCE | Runtime Truth, Obsidian, Session Files | N/A | All agents |

---

## VERSION

| Field | Value |
|---|---|
| Document version | 1.0.0 |
| Created | 2026-06-02 |
| Next review | Every session boundary |
| Owner | All agents — update on every significant change |

# PAIN SYSTEM — CONTROL PLANE ARCHITECTURE
# Chief Architecture & Knowledge Officer
# Version: 1.0.0 | Date: 2026-06-02

Agents used: B (Runtime Truth), C (Technology Watch), D (Provider Mastery),
             E (Archaeology), H (Capability Benchmark), G (Control Plane synthesis)
Branch: claude/add-llm-router-models-moa3U | Commit: see HANDOFF.md

---

## PART I — ONE TRUTH ACTIVATION ARCHITECTURE

```
┌──────────────────────────────────────────────────────────────────────┐
│                   PAIN SYSTEM ONE TRUTH HIERARCHY                    │
│                   (authoritative source, top to bottom)              │
└──────────────────────────────────────────────────────────────────────┘

TIER 0 — LIVE PROBE (always wins)
  HTTP status, git status, Supabase table check
  Overrides any document claim.

TIER 1 — GITHUB (code and committed architecture)
  jamainefacey-blip/Jamaine-Facey
  What is committed is real. What is not committed does not exist for agents.
  ↓ push triggers
  ↓

TIER 2 — VERCEL / NETLIFY (live deployed state)
  voyage-smart-travel.vercel.app (canonical VST production)
  netlify edge functions (Pain System Website)
  ↓ deployment updates
  ↓

TIER 3 — RUNTIME TRUTH (governance/RUNTIME_TRUTH.md)
  Updated every session. Evidence-based. No predictions.
  Reconciles GitHub commits with live deployment state.
  ↓ agent reads on boot
  ↓

TIER 4 — OBSIDIAN (human knowledge vault)
  C:\painSystemVault\Pain-System-Vault (INFERRED — not yet verified)
  Human-readable decisions, SOPs, long-form thinking.
  Receives sync from GitHub governance/ folder (manual until bridge built).
  ↓ operator reads and adds context
  ↓

TIER 5 — AVA CONTROL PLANE (orchestration surface)
  AI Lab panel (local, port 4444) + future live endpoint
  Pipelines: asset-extraction → reconstruction → gap-risk → monetisation → build-output
  Routes: A (Lead) / B (Booking) / C (Enterprise) / D (Internal)
  ↓ routes to
  ↓

TIER 6 — DECISION QUEUE (governance/QUEUE.md)
  Items requiring founder action before agents can proceed.
  Agents surface blockers here. Founder clears them.
  ↓ cleared items trigger
  ↓

TIER 7 — AGENT EXECUTION (Claude / Codex / Dispatch)
  Reads Tiers 1-6 on boot.
  Executes within declared lane.
  Updates Tier 3 on exit.
```

---

## PART II — CONTROL PLANE ARCHITECTURE

### 2.1 Control Plane Definition

The Control Plane is the governance, routing, and observability layer that sits
above all Pain System products. It does not build features. It operates the system.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CONTROL PLANE                                 │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  RUNTIME     │  │  KNOWLEDGE   │  │  DECISION    │              │
│  │  TRUTH       │  │  VAULT       │  │  QUEUE       │              │
│  │  (live state)│  │  (Obsidian)  │  │  (QUEUE.md)  │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                  │                       │
│  ┌──────▼─────────────────▼──────────────────▼───────┐              │
│  │              CONTROL PLANE ROUTER                  │              │
│  │  Reads state → assigns agent → logs result         │              │
│  └──────┬──────────────────────────────────┬──────────┘              │
│         │                                  │                         │
│  ┌──────▼───────┐                  ┌───────▼──────┐                 │
│  │  AVACORE     │                  │  LANE AGENTS │                 │
│  │  (model      │                  │  vst-builder │                 │
│  │   routing)   │                  │  fhi-builder │                 │
│  └──────┬───────┘                  │  ai-lab-op   │                 │
│         │                          │  audit       │                 │
│  ┌──────▼───────┐                  │  deploy      │                 │
│  │  PROVIDERS   │                  └──────────────┘                 │
│  │  Anthropic   │                                                    │
│  │  OpenAI      │                                                    │
│  │  Gemini      │                                                    │
│  │  Mistral etc │                                                    │
│  └──────────────┘                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Control Plane Components

| Component | Current Status | Location | Priority |
|---|---|---|---|
| Runtime Truth | LIVE (created 2026-06-02) | governance/RUNTIME_TRUTH.md | Operational |
| Decision Queue | LIVE (created 2026-06-02) | governance/QUEUE.md | Operational |
| Handoff Protocol | LIVE (created 2026-06-02) | governance/HANDOFF.md | Operational |
| AVACORE Router | BUILT, DARK | ai-lab/model-router.ts | Needs endpoint |
| Lane Agents | DEFINED | .claude/agents/*.md | Need runtime |
| Knowledge Vault Bridge | NOT BUILT | Obsidian Local REST API | Needs operator |
| Control Plane Endpoint | NOT BUILT | /api/control-plane (proposed) | Phase 1 |
| Agent Task Dispatcher | NOT BUILT | governance/QUEUE.md → live queue | Phase 2 |
| Provider Health Monitor | NOT BUILT | — | Phase 2 |
| Session Boot Hook | NOT BUILT | governance/SESSION_BOOT.md | Immediate |

### 2.3 Control Plane Boot Sequence (every agent session)

```
BOOT STEP 1:  git pull origin <branch>
BOOT STEP 2:  read governance/RUNTIME_TRUTH.md
              → if stale (last-updated > 24h): WARN and proceed with caution
BOOT STEP 3:  read governance/HANDOFF.md
              → identify where previous session ended
BOOT STEP 4:  read governance/ACTIVE_TASK.md
              → confirm task hasn't been completed by another session
BOOT STEP 5:  read governance/QUEUE.md
              → check if any operator blockers were cleared
BOOT STEP 6:  run connectivity probe (Supabase, Vercel)
              → update RUNTIME_TRUTH.md if state has changed
BOOT STEP 7:  declare lane and task
              → execute within scope
BOOT STEP 8:  on exit — update all governance files
              → commit and push
```

---

## PART III — SYSTEM ARCHITECTURE (CURRENT REALITY)

### 3.1 What Actually Exists (Archaeology-verified)

**BUILT AND LIVE:**
- VST frontend SPA at voyage-smart-travel.vercel.app (live)
- 12 Vercel Lambda functions (api/ directory) — at Vercel's hard cap
- Pain System Website edge function (/pain-system)
- AI Lab local panel (port 4444, operator machine only)

**BUILT BUT DARK:**
- AVACORE 10-model router (code committed, no live endpoint)
- ALL_MIGRATIONS.sql (consolidated, not applied)

**BUILT BUT WRONG LAYER:**
- user-store.js and booking-store.js — in-memory mocks, explicitly temporary,
  never replaced with Supabase (6+ weeks overdue per commit messages)

**DEFINED BUT EMPTY:**
- FHI lane (agent defined, zero product code)
- Dispatch (referenced, no code)
- Pain Business OS (desktop app stalled since 2026-04-17, 2 env keys blocking)

**ABANDONED (recoverable from git history):**
- NestJS + Prisma + Clerk monorepo (vst-platform/, 15+ commits, never merged)
  → Contains: 18-model Prisma schema, 45 REST endpoints, Clerk auth, Railway deploy config
  → Recovery branch: remotes/origin/claude/vst-platform-core-Wq7fZ
- Cloudflare R2 storage (passport uploads, AES-256 encryption — specced, never built)
- Skyscanner + Kiwi flight adapters (stubs since 2026-04-20, ~6 weeks unactioned)
- Netlify (26 edge functions deleted 2026-05-17, Vercel declared sole platform)

### 3.2 Hard Architectural Constraints (undocumented until now)

| Constraint | Evidence | Impact |
|---|---|---|
| Vercel 12-function hard cap | Commit 8cba5b1 — fares-search.js deleted to stay under limit | No new Lambda functions without deleting existing ones |
| JWT_SECRET ≠ Supabase JWT | Confirmed by HTTP 401 on derived JWT | Cannot derive Supabase service_role key from JWT_SECRET |
| IP allowlist blocks container | Confirmed by probe pattern (401 not 403 from Lambda) | Direct Supabase access only via Vercel Lambda or operator |
| AVACORE has 0 live API keys except Anthropic | No keys for GPT-4o, Gemini, Grok etc in any env | 9 of 10 models in AVACORE registry are unusable |
| in-memory stores reset on Lambda cold start | user-store.js comment: "resets on server restart" | All user data and bookings lost between Lambda invocations |

---

## PART IV — CAPABILITY SCORECARD

Source: Agent H findings (2026-06-02). Evidence-based scores.

| System | Score | Status | Single highest-impact action |
|---|---|---|---|
| AVA (local panel) | 38/100 | PARTIAL — local only | Expose as live API endpoint |
| AVACORE (router) | 32/100 | BUILT, DARK | Wire to Vercel Lambda endpoint |
| VST Frontend | 52/100 | LIVE but database-dead | Apply Supabase migrations |
| VST Backend/Database | 18/100 | IN-MEMORY MOCK | Swap user-store for Supabase client |
| VST API Layer | 48/100 | LIVE, STATELESS | Run migrations, connect to Supabase |
| FHI | 8/100 | DEFINED ONLY | Create tools/rehab-client/fhi/ with any code |
| Pain System Website | 35/100 | ASSUMED LIVE | Probe and add real health payload |
| Runtime Truth / Governance | 55/100 | CREATED THIS SESSION | Enforce via session boot hook |
| Knowledge Vault / Obsidian | 5/100 | DISCONNECTED | Install Local REST API plugin |
| Agent Orchestration | 42/100 | DEFINED, NOT LIVE | Build task-dispatch endpoint |
| **OVERALL** | **33/100** | **FRAGMENTED** | **B1: Add Supabase service_role key** |

### Missing layers (not scored — don't exist):
- Session boot enforcement (hook that reads Runtime Truth on start)
- Provider health monitoring (are Anthropic, Amadeus reachable?)
- Cost accounting (no token/API usage tracking)
- Rate limiting on any Lambda endpoint
- Staging/production environment separation
- Automated testing for any feature
- Error alerting (no Sentry, no structured error logging)

---

## PART V — TECHNOLOGY WATCH

Source: Agent C findings + synthesis. Classification: ADOPT / SANDBOX / IGNORE.

### Anthropic

| Finding | Classification | Reason |
|---|---|---|
| Prompt caching (cache_control) | ADOPT | ava-evaluate, planner-chat, ava-itinerary have static system prompts. Caching cuts input token cost ~90% on cache hits. Zero infrastructure change. | 
| Tool use / structured output | ADOPT | ava-evaluate validates JSON manually with a 14-field normaliser. Native tool use eliminates parse-fail loops. |
| Batch API (MessageBatch) | ADOPT | AI Lab pipeline stages flagged PARALLEL_SAFE but run sequentially. Batch API runs them concurrently at 50% cost. |
| Extended thinking (claude-opus-4-8) | SANDBOX | Useful for complex reasoning tasks in AVACORE. Not worth switching from claude-sonnet-4-6 until AVACORE is live. |
| Files API | SANDBOX | Useful for persistent asset ingestion. Implement after AVACORE endpoint is live. |
| Computer use | IGNORE | No UI automation use case in current stack. |

### OpenAI

| Finding | Classification | Reason |
|---|---|---|
| Responses API (stateful sessions) | SANDBOX | Relevant once AVACORE has live endpoint. Enables persistent conversation state across AVACORE sessions. |
| o3 reasoning model | SANDBOX | Add to AVACORE fallback chain for reasoning task type once API key is available. |
| Agents SDK (tool orchestration) | SANDBOX | Compare against AVACORE once AVACORE is live. Not replacing a working system. |

### GitHub

| Finding | Classification | Reason |
|---|---|---|
| Actions OIDC (keyless auth) | ADOPT | Long-lived Anthropic + Supabase secrets stored as repo secrets with no rotation. OIDC eliminates this risk. |
| Environments + deployment rules | ADOPT | No staging/production separation exists. Environments block accidental production pushes. |
| Actions pnpm store caching | ADOPT | CI install time improvement, trivial to add. |
| Copilot Workspace | SANDBOX | Useful future capability. Not replacing Claude Code sessions. |

### Vercel

| Finding | Classification | Reason |
|---|---|---|
| Edge Middleware (auth + rate limiting) | ADOPT | Zero auth on any Lambda route today. Edge Middleware enforces API key checks before cold start. |
| KV store (caching) | ADOPT | ava-evaluate has no response caching. KV on request hash serves repeated evaluations without hitting Anthropic. |
| Cron Jobs | ADOPT | Schedule regular Supabase health checks and AVACORE status checks without manual invocation. |
| Fluid Compute (streaming) | SANDBOX | planner-chat and ava-itinerary buffer full responses. Streaming improves UX. Implement in Phase 2. |
| AI SDK v4 | SANDBOX | Useful abstraction once multiple providers are wired. Adds value when AVACORE is live. |

### Supabase

| Finding | Classification | Reason |
|---|---|---|
| Database tables + RLS | ADOPT (BLOCKED) | Zero tables applied. All VST data features dead. Operator must add service_role key. |
| Supabase Auth (OAuth) | ADOPT | No auth on any endpoint. Supabase Auth adds Google/GitHub login with zero custom code. |
| Edge Functions (Deno) | ADOPT | Co-locate API logic with database. Eliminates Vercel Lambda cold-start for data-access routes. |
| pgvector + embeddings | SANDBOX | Useful for AI Lab asset similarity search. Implement after basic tables are live. |
| Realtime | SANDBOX | Useful for live booking status updates. Implement in VST Phase 3. |
| Database branching | SANDBOX | Useful for safe migration testing. Worth adopting once migration workflow is stable. |

### Open-Source Agent Systems

| Finding | Classification | Reason |
|---|---|---|
| LangGraph (stateful agent graphs) | SANDBOX | Relevant for AVACORE stateful routing. Worth benchmarking against current AVACORE design once AVACORE is live. |
| smolagents (HuggingFace) | SANDBOX | Lightweight. Relevant for adding open-source model routing to AVACORE. |
| Agno | SANDBOX | Multi-modal agent framework. Watch only — not replacing AVACORE. |
| CrewAI / AutoGen | IGNORE | Heavy frameworks. AVACORE's custom routing is lighter and Pain System-specific. |
| Pydantic AI | SANDBOX | Structured output validation. Relevant if Pain System adds Python-based pipelines. |

---

## PART VI — OBSIDIAN VERDICT

### Which vault is authoritative?
INFERRED: C:\painSystemVault\Pain-System-Vault (founder-confirmed structure, not agent-verified)
There is one declared vault. There is no evidence of multiple vaults.

### Which vault is operational?
INFERRED: The vault at C:\painSystemVault\ with 15+ folder structure is operational on the
operator's Windows machine. It contains SYSTEM/SESSION_BOOT, SYSTEM_MAP, HANDOFF, PROGRESS,
QUEUE, ACTIVE_TASK — the same documents now mirrored in governance/ (created 2026-06-02).

### Which vault is archival?
The 99-ARCHIVE folder within the vault serves as archival. No separate archival vault identified.

### What sync mechanism should exist?

```
PHASE 1 — MANUAL (immediate, no tooling needed)
  Operator copies governance/*.md files to Obsidian SYSTEM/ folder after each session.
  Agent: paste final governance file contents at session end.
  SOP: "After any agent session updates governance/, copy to Obsidian SYSTEM/."

PHASE 2 — SEMI-AUTOMATED (after Local REST API is enabled)
  Agent posts governance/ updates to Obsidian via REST API at session end.
  Endpoint: POST http://localhost:27123/vault/SYSTEM/RUNTIME_TRUTH.md
  with Authorization: Bearer <api-key>

PHASE 3 — FULL PIPELINE (after bridge is stable)
  Bidirectional sync: Obsidian writes (operator notes) → GitHub governance/
  Agent reads Obsidian directly at session start (GET /vault/SYSTEM/)
  Conflicts resolved by: Live probe > GitHub > Obsidian
```

### How does AVA read it?
Currently: AVA cannot read Obsidian. AVA (local panel) has no REST API client.
Required: Add a fetch() call in ai-lab/orchestrator.ts that reads the Obsidian
Local REST API endpoint for the SYSTEM_MAP and SESSION_BOOT files before any pipeline run.
This makes AVA context-aware of current system state.

### How do agents consume it?
Currently: Agents cannot. No bridge exists.
Required: Add to SESSION_BOOT.md (when created):
  1. GET http://localhost:27123/vault/SYSTEM/RUNTIME_TRUTH.md
  2. Compare with governance/RUNTIME_TRUTH.md (GitHub version)
  3. Use higher-tier source (GitHub wins on conflict)
  4. Proceed with verified state

### CONTRADICTION STATUS: RESOLVED
Codex found root path only. Founder confirmed full internal structure.
Both are true simultaneously. No contradiction exists — Codex had limited depth access.
The vault is structurally mature (15+ folders) but invisible to all agents.

---

## PART VII — KNOWLEDGE PIPELINE (REFINED)

```
PRODUCER                  TRANSPORT              CONSUMER
─────────────────────────────────────────────────────────

Agent session             git commit + push       Next agent session
  │                           │                       │
  │ writes                    │ triggers              │ reads
  ▼                           ▼                       ▼
governance/             GitHub repo              governance/
RUNTIME_TRUTH.md        (canonical)              RUNTIME_TRUTH.md
HANDOFF.md                                       HANDOFF.md
ACTIVE_TASK.md                                   ACTIVE_TASK.md
QUEUE.md                                         QUEUE.md

  │                                                   │
  │ operator manual sync (Phase 1)                    │
  │ REST API sync (Phase 2)                           │
  ▼                                                   ▼
Obsidian SYSTEM/                               Obsidian SYSTEM/
(human-readable)                               (operator reads)

  │                                                   │
  │ operator decision                                 │
  ▼                                                   ▼
governance/QUEUE.md     ←── founder clears ───  Decision Queue
(cleared items)              blockers            (open items)

  │
  │ agent executes cleared items
  ▼
Product code changes
  │
  │ git commit + push
  ▼
Back to top ──────────────────────────────────────────►
```

### Pipeline Health (current)

| Segment | Status | Blocking issue |
|---|---|---|
| Agent → RUNTIME_TRUTH → GitHub | OPERATIONAL | None |
| GitHub → RUNTIME_TRUTH → Next agent | OPERATIONAL | None |
| GitHub → Vercel deploy | OPERATIONAL | None |
| RUNTIME_TRUTH → Obsidian | MANUAL (Phase 1) | Operator copies manually |
| Obsidian → Agent | BLOCKED | No Local REST API |
| QUEUE → Agent → Product code | PARTIALLY OPERATIONAL | B1 (Supabase creds) blocks VST work |
| AVACORE → Live endpoint | BLOCKED | No endpoint exists |
| VST Lambda → Supabase | BLOCKED | No service_role key in env |

---

## PART VIII — FOUNDER EXPERIENCE GOVERNANCE

### Current Founder Experience Score: 31/100

| Dimension | Score | Evidence |
|---|---|---|
| Session continuity | 10/100 | Every session restarts cold. No shared state before 2026-06-02. Re-diagnoses same failures. |
| Clarity of system state | 35/100 | RUNTIME_TRUTH.md now exists but just created. Not yet proven across sessions. |
| Time to first productive action | 20/100 | Multiple sessions consumed diagnosing credential gap. Migrations still blocked. |
| Confidence in what is live | 40/100 | VST frontend confirmed live. Database state confirmed. Clear blocker documented. |
| Ability to unblock without coding | 45/100 | QUEUE.md now shows exact operator actions with step-by-step paths. |
| Knowledge persistence | 15/100 | Obsidian vault exists but no bridge to agents. Every insight lost at session boundary. |
| Decision visibility | 30/100 | QUEUE.md exists. No live dashboard or status page for founder. |
| Tech debt awareness | 40/100 | Archaeology recovered 6 major abandoned paths now documented. |

### Founder Experience Targets

| Dimension | Target score | What gets it there |
|---|---|---|
| Session continuity | 80 | SESSION_BOOT.md + agent reads RUNTIME_TRUTH.md before any action |
| Clarity of system state | 80 | RUNTIME_TRUTH.md updated every session, Obsidian sync operational |
| Time to first productive action | 70 | Stop hook linked to QUEUE.md — agent knows exact next action on boot |
| Confidence in what is live | 85 | Automated probe on boot reports live state in <10s |
| Ability to unblock without coding | 80 | QUEUE.md with exact copy-paste operator actions (already partially done) |
| Knowledge persistence | 75 | Obsidian Local REST API bridge operational |
| Decision visibility | 70 | Minimal status dashboard at /pain-system endpoint |
| Tech debt awareness | 75 | CONTROL_PLANE_ARCHITECTURE.md + archaeology committed |

---

## PART IX — PROVIDER MASTERY SUMMARY

Source: Agent D findings (2026-06-02).

### Highest-value unused capabilities (ADOPT tier):

| Provider | Capability | Current cost | After adoption |
|---|---|---|---|
| Anthropic | Prompt caching | Full token cost on every ava-evaluate call | ~10% of current cost on repeated system prompts |
| Anthropic | Tool use (structured output) | 14-field manual JSON normaliser + retry loop | Schema-guaranteed output, no retry |
| Vercel | Edge Middleware | Zero auth on 12 Lambda routes | API key enforcement before cold start |
| Vercel | KV cache | Claude called on every identical ava-evaluate | Cached response served in <5ms |
| Supabase | Auth (OAuth) | No auth anywhere | Google/GitHub login, zero custom code |
| GitHub | OIDC (keyless) | Long-lived secrets, no rotation | Short-lived tokens, no secret storage |

---

## PART X — NEXT LANDMARK ACTIONS

Ordered by impact on overall system score and founder experience.

### IMMEDIATE (operator actions — no code needed)

| # | Action | Impact | Where |
|---|---|---|---|
| I-1 | Add SUPABASE_SERVICE_ROLE_KEY to Vercel env | +30 points VST Backend | Vercel → voyage-smart-travel → Settings → Env Vars |
| I-2 | OR paste ALL_MIGRATIONS.sql in Supabase SQL Editor | Same as above | Supabase → ovmlmregvcekbvoctywe → SQL Editor |
| I-3 | Install Obsidian Local REST API plugin | Unblocks knowledge pipeline | Obsidian → Settings → Community Plugins |
| I-4 | Add SUPABASE_ACCESS_TOKEN to GitHub Actions secrets | Enables CI migration path | GitHub → Repo Settings → Secrets → Actions |

### PHASE 1 (agent actions — after I-1 or I-2)

| # | Action | Impact | Task ID |
|---|---|---|---|
| P1-1 | Apply Supabase migrations (probe → confirm → log) | VST Backend: 18 → 50 | TASK-001 |
| P1-2 | Wire user-store.js to Supabase client | VST Backend: 50 → 65 | TASK-001b |
| P1-3 | Create AVACORE live endpoint (/api/avacore-route) | AVACORE: 32 → 55 | TASK-002 |
| P1-4 | Clean up migration scaffolding (root api/, vercel.json) | Remove tech debt | TASK-003 |
| P1-5 | Add Anthropic prompt caching to ava-evaluate.js | -90% token cost | New task |
| P1-6 | Add Vercel Edge Middleware auth (API key check) | Security | New task |
| P1-7 | Create governance/SESSION_BOOT.md | Session continuity | TASK-007 |

### PHASE 2 (after Phase 1 stable)

| # | Action | Impact |
|---|---|---|
| P2-1 | Obsidian REST API bridge (auto-sync governance/) | Knowledge pipeline: 5 → 60 |
| P2-2 | Add Supabase Auth (Google OAuth) | Auth on VST and AI Lab |
| P2-3 | Add Vercel KV caching on ava-evaluate | Performance + cost |
| P2-4 | FHI scope declaration + skeleton | FHI: 8 → 25 |
| P2-5 | GitHub OIDC for keyless credential management | Security posture |

---

## DOCUMENT REGISTRY

| File | Purpose | Status |
|---|---|---|
| CONTROL_PLANE_ARCHITECTURE.md | This file — operating model | CREATED 2026-06-02 |
| PAIN_SYSTEM_MASTER_ARCHITECTURE.md | 14-system inventory | CREATED 2026-06-02 |
| KNOWLEDGE_PIPELINE.md | Information flow design | CREATED 2026-06-02 |
| OBSIDIAN_LINK_STATUS.md | Vault evidence and bridge path | CREATED 2026-06-02 |
| governance/RUNTIME_TRUTH.md | Live operational state | CREATED + UPDATED 2026-06-02 |
| governance/HANDOFF.md | Session boundary document | CREATED 2026-06-02 |
| governance/ACTIVE_TASK.md | Current task | CREATED 2026-06-02 |
| governance/QUEUE.md | Ordered task queue | CREATED 2026-06-02 |
| governance/SESSION_BOOT.md | Session boot checklist | NOT YET CREATED (TASK-007) |
| governance/SYSTEM_MAP.md | Quick-reference topology | NOT YET CREATED (TASK-008) |
| LLM_ROUTER_SPEC.md | AVACORE specification | EXISTS |
| MODULE_REGISTRY.md | Module inventory | EXISTS (needs update) |
| PRIMER.md | Lane and port reference | EXISTS |

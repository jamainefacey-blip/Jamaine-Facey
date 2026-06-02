# PAIN SYSTEM — QUEUE
# Ordered list of pending tasks

Last updated: 2026-06-02
Updated by: Claude Code (session d1c7bdbc)

RULE: Items are ordered by priority (CRITICAL → HIGH → MEDIUM → LOW).
RULE: ACTIVE task lives in ACTIVE_TASK.md, not here.
RULE: When an item is complete, mark DONE with date and move to DONE section.
RULE: Every item must have a clear owner (OPERATOR / AGENT / BOTH).

---

## ACTIVE

See governance/ACTIVE_TASK.md — TASK-001: VST Supabase Migrations

---

## QUEUE — PENDING

### TASK-002 — Connect AVACORE to Live Endpoint
**Priority:** HIGH
**Owner:** AGENT (independent of TASK-001)
**Lane:** AI_LAB
**Description:** Create a Vercel Lambda or Netlify Edge Function endpoint that receives a task description and calls `routeAvacore()` from `ai-lab/model-router.ts`. Return the routing decision as JSON. Wire endpoint to AI Lab UI or expose as `/ai-lab/route`.
**Depends on:** NONE — dependency on TASK-001 removed (Agent B finding: AVACORE endpoint does not require Supabase)
**NOTE:** AVACORE can route to 10 models but only ANTHROPIC_API_KEY is in Vercel env. 9 models are dark until provider API keys are added.
**Acceptance criteria:**
- Endpoint exists and returns valid AvacoreRouteResult JSON
- TypeScript 0 errors
- Documented in MODULE_REGISTRY.md

### TASK-003 — Clean Up Migration Scaffolding
**Priority:** HIGH
**Owner:** AGENT (after migrations confirmed in TASK-001)
**Lane:** VST
**Description:** Remove temporary migration infrastructure added during migration attempt:
1. Delete root `api/run-migrations.js`
2. Remove `functions` block from root `vercel.json`
3. Assess whether `voyage-smart-travel/api/run-migrations.js` should remain as a permanent admin endpoint (with proper auth) or be removed
**Acceptance criteria:** Root api/ clean, vercel.json reverted to no functions block

### TASK-004 — Resolve PR #22 (Founder 401 Access Fix)
**Priority:** HIGH
**Owner:** OPERATOR (review) + AGENT (if changes needed)
**Lane:** VST
**Description:** PR #22 is open with a founder 401 access fix. Must be reviewed and either merged or closed with documented reason.
**Acceptance criteria:** PR #22 status = MERGED or CLOSED (not OPEN)

### TASK-005 — Declare Canonical Vercel Production Project
**Priority:** HIGH
**Owner:** OPERATOR (decision) + AGENT (documentation)
**Lane:** VST
**Description:** Two Vercel projects exist:
- voyage-smart-travel (prj_Oi4nDouiclT7oEQmaoYqbhGB6kU7)
- voyage-smart-travel-live (prj_W6MPl8lPo2Qv7EJTQQcu4WvcziFc)
Operator must declare which is the canonical production project. Agent will document decision in governance/RUNTIME_TRUTH.md and PAIN_SYSTEM_MASTER_ARCHITECTURE.md.
**Acceptance criteria:** One project declared canonical, the other archived or documented as staging/preview

### TASK-006 — Configure Obsidian Agent Bridge
**Priority:** HIGH
**Owner:** OPERATOR (plugin install) + AGENT (configuration docs)
**Lane:** GOVERNANCE
**Description:** Enable Obsidian Local REST API plugin. Document vault path, API port, key folder paths. Test agent read/write access. Once working: automate session-end sync from governance/ to Obsidian SYSTEM/ folder.
**Depends on:** Operator completing OBSIDIAN_LINK_STATUS.md Step 1
**Acceptance criteria:**
- Agent can list vault root contents via REST API
- governance/ files successfully written to Obsidian SYSTEM/ folder
- Session-end checklist includes sync step

### TASK-007 — Create governance/SESSION_BOOT.md
**Priority:** MEDIUM
**Owner:** AGENT
**Lane:** GOVERNANCE
**Description:** Create the session boot checklist that every agent reads on startup. Includes: read RUNTIME_TRUTH.md, verify Supabase table status, confirm Vercel deployment, check AVACORE endpoint, load ACTIVE_TASK.md and QUEUE.md.
**Acceptance criteria:** File created, structured as a runnable checklist with verification steps

### TASK-008 — Create governance/SYSTEM_MAP.md
**Priority:** MEDIUM
**Owner:** AGENT
**Lane:** GOVERNANCE
**Description:** Create a topology map showing every system, its connections, its status, and its owner. Derived from PAIN_SYSTEM_MASTER_ARCHITECTURE.md but structured as a quick-reference navigation document for agents.
**Acceptance criteria:** File created, lists all 14 systems with current status

### TASK-009 — FHI Scope Declaration
**Priority:** MEDIUM
**Owner:** OPERATOR (decision)
**Lane:** FHI
**Description:** FHI builder agent is configured (scope: tools/rehab-client/fhi/**, memory/fhi/**) but neither directory exists in the filesystem. Operator must declare:
- Is FHI active or planned?
- What does FHI build? (endpoint, schema, UI)
- Initiate FHI lane with at minimum a README and initial spec
**Acceptance criteria:** tools/rehab-client/fhi/ directory exists with at minimum an INDEX or README

### TASK-010 — Dispatch Architecture Declaration
**Priority:** MEDIUM
**Owner:** OPERATOR (decision)
**Lane:** ADMIN
**Description:** Dispatch is referenced as a Pain System component but has no code, no endpoint, and no schema in the repo. Operator must declare what Dispatch is, what it does, and initiate its implementation.
**Acceptance criteria:** Memory or governance file declares Dispatch purpose and architecture

### TASK-011 — Pain Business OS Declaration
**Priority:** MEDIUM
**Owner:** OPERATOR (decision)
**Lane:** ADMIN
**Description:** Pain Business OS is declared as a system but has no code in the repo. Operator must declare scope and initiate build.
**Acceptance criteria:** Governance file declares Pain Business OS purpose and architecture

### TASK-012 — Netlify Edge Function Live Status Verification
**Priority:** LOW
**Owner:** AGENT
**Lane:** ADMIN
**Description:** Verify that /pain-system, /tools/hello-pain, and /tools/rehab-client are live and returning expected responses. Code exists but no probe has been run in recent sessions.
**Acceptance criteria:** HTTP probe results logged in RUNTIME_TRUTH.md

---

### TASK-013 — Merge Feature Branch to Main (PR)
**Priority:** HIGH
**Owner:** AGENT
**Lane:** GOVERNANCE
**Description:** Feature branch `claude/add-llm-router-models-moa3U` contains AVACORE router,
ALL_MIGRATIONS.sql, and governance/ directory — none of which are on main. Main contains
001+002 standalone migrations and tech debt (root api/, vercel.json functions block) that
feature branch does not. A PR is needed to reconcile both branches. Cleanup of main branch
tech debt must happen as part of this PR.
**Conflicts to resolve:** root vercel.json (main has functions block, feature has clean file),
root api/run-migrations.js (main has it, feature does not), migration file differences.
**Acceptance criteria:** Single unified main branch with all governance/, AVACORE, migrations,
and no temp migration scaffolding.

### TASK-014 — Add Anthropic Prompt Caching
**Priority:** HIGH
**Owner:** AGENT (after TASK-013)
**Lane:** VST / AI_LAB
**Description:** Add `cache_control` markers to static system prompts in:
- voyage-smart-travel/api/ava-evaluate.js
- voyage-smart-travel/api/planner-chat.js
- voyage-smart-travel/api/ava-itinerary.js
Expected impact: ~90% reduction in input token cost on repeated system prompt segments.
**No infrastructure change required** — API-level change only.
**Acceptance criteria:** cache_control added to system prompt in all 3 files, confirmed via Anthropic response headers showing cache hit.

### TASK-015 — Add Vercel Edge Middleware (Auth Layer)
**Priority:** HIGH
**Owner:** AGENT (after TASK-013)
**Lane:** VST
**Description:** Zero authentication sits in front of 12 Lambda routes today. Add Vercel
Edge Middleware that enforces API key validation before any Lambda cold start.
Use `x-api-key` header pattern. Key stored as Vercel env var `VST_API_KEY`.
**Acceptance criteria:** Requests without valid x-api-key header receive 401 before Lambda executes.

### TASK-016 — Create governance/SESSION_BOOT.md (session boot checklist)
**Priority:** HIGH
**Owner:** AGENT (immediate, no dependencies)
**Lane:** GOVERNANCE
**Description:** (was TASK-007) Create the session boot checklist agents read on startup.
Includes: read RUNTIME_TRUTH.md, verify branch state, check Supabase connectivity,
confirm Vercel deployment, check AVACORE endpoint, load ACTIVE_TASK and QUEUE.
Agent B finding: stop hook details not documented — include stop hook explanation.
**Acceptance criteria:** File created with runnable verification steps.

### TASK-017 — Create governance/SYSTEM_MAP.md
**Priority:** MEDIUM
**Owner:** AGENT (after TASK-016)
**Lane:** GOVERNANCE
**Description:** (was TASK-008) Quick-reference topology map for all 14 systems.
**Acceptance criteria:** File created, all 14 systems listed with current status.

---

## DONE

(No tasks completed with shared state tracking before 2026-06-02 — this is the first session with a QUEUE.)

---

## DEFERRED / PARKED

TASK-007 → merged into TASK-016 (renumbered)
TASK-008 → merged into TASK-017 (renumbered)

---

## QUEUE STATS

| Status | Count |
|---|---|
| ACTIVE | 1 (TASK-001) |
| PENDING | 16 |
| DONE | 0 |
| DEFERRED | 2 (renumbered) |
| TOTAL | 17 |

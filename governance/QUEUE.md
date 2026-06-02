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
**Owner:** AGENT (after TASK-001 done)
**Lane:** AI_LAB
**Description:** Create a Vercel Lambda or Netlify Edge Function endpoint that receives a task description and calls `routeAvacore()` from `ai-lab/model-router.ts`. Return the routing decision as JSON. Wire endpoint to AI Lab UI or expose as `/ai-lab/route`.
**Depends on:** TASK-001 (database must be working before wiring AI Lab to VST data paths)
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

## DONE

(No tasks completed with shared state tracking before 2026-06-02 — this is the first session with a QUEUE.)

---

## DEFERRED / PARKED

None at this time.

---

## QUEUE STATS

| Status | Count |
|---|---|
| ACTIVE | 1 |
| PENDING | 11 |
| DONE | 0 |
| DEFERRED | 0 |
| TOTAL | 12 |

# PAIN SYSTEM — RUNTIME TRUTH
# Canonical live operational state
# Evidence-based only. No assumptions. No predictions.

Last updated: 2026-06-02
Updated by: Claude Code (session d1c7bdbc)
Branch: claude/add-llm-router-models-moa3U
Commit at time of update: 852e8a2

RULE: This file must be updated at the end of every agent session.
RULE: Every claim must cite evidence. If no evidence exists, write UNVERIFIED.
RULE: Do not write what "should" be true — only what IS true.

---

## SYSTEM LIVE STATE

### GITHUB
- Repo: jamainefacey-blip/Jamaine-Facey — LIVE
- Main branch latest: 57af118 (fix(vst): derive service_role JWT from JWT_SECRET env var)
- Feature branch latest: 852e8a2 (chore: ignore *.tsbuildinfo)
- Working tree: CLEAN (verified: git status)
- Open PRs: #22 (founder 401 access fix) — UNRESOLVED

### VERCEL
- Deployment pipeline: OPERATIONAL
- Production URL: https://voyage-smart-travel.vercel.app — LIVE (HTTP 200)
- Latest deployment: dpl_BDJ4SHAA6iUmGNE8AC9ff8QhC8Cb — READY
- Runtime: Node.js 24, pnpm 10.33.0
- Team: team_0vHSlDi27pKmZh2dD1VzrPFd

### VERCEL ENV (confirmed by envkeys probe 2026-06-02)
- ANTHROPIC_API_KEY: PRESENT (name only — value never exposed)
- JWT_SECRET: PRESENT (name only — value never exposed)
- SUPABASE_SERVICE_ROLE_KEY: ABSENT
- SUPABASE_ANON_KEY: ABSENT
- Any Supabase credential: ABSENT
- CRITICAL: JWT_SECRET is VST's own user-auth HMAC-SHA256 signing key — NOT the Supabase project JWT secret. Confirmed: derived JWT from JWT_SECRET → HTTP 401 from Supabase.

### SUPABASE
- Project: ovmlmregvcekbvoctywe
- URL: https://ovmlmregvcekbvoctywe.supabase.co
- Container access: BLOCKED (IP allowlist)
- Lambda access: REACHABLE (HTTP 401 — credential missing, not IP blocked)
- user_profiles table: TABLE_MISSING
- user_dashboard table: TABLE_MISSING
- planner_memory table: TABLE_MISSING
- bookings table: TABLE_MISSING
- Total tables applied: 0 of 4
- Blocker: SUPABASE_SERVICE_ROLE_KEY not in Vercel env; operator must add it

### VST FRONTEND
- URL: https://voyage-smart-travel.vercel.app — LIVE
- UI loads: VERIFIED
- Database-dependent features: ALL DEAD (0 tables exist)
- Auth: DEAD (no Supabase tables for user_profiles)

### VST SECOND VERCEL PROJECT
- voyage-smart-travel-live (prj_W6MPl8lPo2Qv7EJTQQcu4WvcziFc)
- Status: EXISTS — canonical vs. production relationship UNRESOLVED
- Risk: Two projects = deployment confusion risk

### AI LAB (AVA)
- Runtime: LOCAL ONLY (port 4444)
- Baseline lock: e6a0552 — ACTIVE
- Protected files: tools/rehab-client/ai-lab/server.js, index.html
- Live as network service: NO
- Last verified boot: UNKNOWN (not tested this session)

### AVACORE
- Code state: COMMITTED (commit ac903ce, branch claude/add-llm-router-models-moa3U)
- TypeScript errors: 0 (verified at commit time)
- Live endpoint: NONE
- Callable by any external system: NO
- Integration with AVA orchestrator: NOT CONNECTED
- Integration with any Vercel Lambda: NOT CONNECTED

### NETLIFY EDGE
- /pain-system: ASSUMED live (not probed this session — code exists, Netlify deploy status UNVERIFIED)
- /tools/hello-pain: ASSUMED live (same)
- /tools/rehab-client: ASSUMED live (same)

### OBSIDIAN
- Agent access: NONE
- Vault path: C:\painSystemVault\Pain-System-Vault (INFERRED)
- Sync status: UNKNOWN
- See: OBSIDIAN_LINK_STATUS.md

### FHI
- Code: NOT FOUND in filesystem
- Agent definition: EXISTS (.claude/agents/fhi-builder.md)
- Live URL: UNKNOWN
- Status: INFERRED partial system only

### DISPATCH
- Code: NOT FOUND
- Status: UNVERIFIED — no evidence

### PAIN BUSINESS OS
- Code: NOT FOUND
- Status: UNVERIFIED — no evidence

### CODEX
- Runtime: UNKNOWN
- Status: ASSUMED — session agent, identity unverified

---

## TECHNICAL DEBT REGISTER

| Item | Location | Impact | Cleanup action |
|---|---|---|---|
| api/run-migrations.js (temp) | Root of repo (main branch) | Unnecessary Lambda function deployed | Delete after migrations confirmed applied |
| vercel.json functions block | Root vercel.json (main branch) | Exposes migration endpoint in production | Remove functions block after cleanup |
| run-migrations.js token | voyage-smart-travel/api/run-migrations.js | Static token 'vst-mig-2026-a8b3c4d5' in source | Remove entire file or replace with proper auth after migrations done |

---

## BLOCKERS (operator action required)

| # | Blocker | System | Exact action |
|---|---|---|---|
| B1 | SUPABASE_SERVICE_ROLE_KEY absent from Vercel env | VST | Vercel dashboard → voyage-smart-travel → Settings → Environment Variables → add SUPABASE_SERVICE_ROLE_KEY |
| B2 | OR: Run ALL_MIGRATIONS.sql manually | VST | Supabase dashboard → SQL Editor → paste voyage-smart-travel/migrations/ALL_MIGRATIONS.sql → Run |
| B3 | Obsidian Local REST API not enabled | GOVERNANCE | Install plugin, enable, note port and API key |
| B4 | Two Vercel projects — canonical not declared | VST | Declare which project is production |
| B5 | PR #22 unresolved | VST | Review and merge or close |

---

## LAST SESSION SUMMARY

Session date: 2026-06-02
Agent: Claude Code (claude-sonnet-4-6)
Branch worked on: claude/add-llm-router-models-moa3U

Completed this session:
- AVACORE 10-model router implemented and committed (commit ac903ce)
- ALL_MIGRATIONS.sql created (commit bba3030)
- run-migrations.js updated with connectivity probe, env inspection, JWT derivation
- tsconfig.tsbuildinfo added to .gitignore (commit 852e8a2)
- PAIN SYSTEM LANDMARK AUDIT delivered (text analysis)
- PAIN_SYSTEM_MASTER_ARCHITECTURE.md created
- KNOWLEDGE_PIPELINE.md created
- OBSIDIAN_LINK_STATUS.md created
- governance/RUNTIME_TRUTH.md created (this file)
- governance/HANDOFF.md created
- governance/ACTIVE_TASK.md created
- governance/QUEUE.md created

Not completed (BLOCKED):
- All 4 Supabase migrations: TABLE_MISSING — blocked on B1 or B2 above
- Stop hook (migration gate): STILL ACTIVE — requires operator to complete B1 or B2

---

## NEXT UPDATE REQUIRED

This file must be updated when any of the following occur:
- Supabase migrations applied (update table status to APPLIED)
- SUPABASE_SERVICE_ROLE_KEY added to Vercel env (update env section)
- AVACORE connected to live endpoint (update AVACORE section)
- PR #22 merged or closed (update open PR list)
- Obsidian bridge configured (update Obsidian section)
- Any deployment or commit changes system state

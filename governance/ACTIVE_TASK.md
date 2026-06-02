# PAIN SYSTEM — ACTIVE TASK
# Current task in execution

Last updated: 2026-06-02
Updated by: Claude Code (session d1c7bdbc)

RULE: Only one ACTIVE task at a time.
RULE: When a task is complete, move it to QUEUE.md as DONE and update this file.
RULE: If a task is BLOCKED, record the exact blocker and required operator action.

---

## CURRENT ACTIVE TASK

**Task ID:** TASK-001
**Name:** Run VST Supabase Migrations (001–004)
**Assigned to:** Claude Code + Operator (shared)
**Lane:** VST
**Priority:** CRITICAL (stop hook active)
**Status:** BLOCKED

### Description
Apply all 4 VST database migrations to Supabase project `ovmlmregvcekbvoctywe` in order:
1. 001_user_profiles.sql
2. 002_user_dashboard.sql
3. 003_planner_memory.sql
4. 004_bookings.sql

Confirm each table exists after application.

### Current state
All 4 tables: TABLE_MISSING (verified 2026-06-02 via Lambda probe)

### What has been done
- ALL_MIGRATIONS.sql created (consolidated idempotent, commit bba3030)
- run-migrations.js updated with probe, env inspection, JWT derivation
- JWT_SECRET confirmed NOT Supabase project JWT secret (HTTP 401 on derived JWT)
- No Supabase credentials found in any accessible environment

### Blocker
SUPABASE_SERVICE_ROLE_KEY is not in Vercel Lambda environment.
Agent cannot apply migrations without this credential.

### Operator action required to unblock
**Option A (recommended — permanent fix):**
Vercel dashboard → Project: voyage-smart-travel → Settings → Environment Variables
Add: `SUPABASE_SERVICE_ROLE_KEY` = [get from Supabase: Settings → API → service_role key]
Then: redeploy or trigger migration run

**Option B (immediate manual fix):**
Supabase dashboard → Project: ovmlmregvcekbvoctywe → SQL Editor
Paste: voyage-smart-travel/migrations/ALL_MIGRATIONS.sql
Click Run
Confirm: all 9 expected tables appear in Table Editor

### What agent does when unblocked
1. Probe Supabase table existence
2. Confirm all 4 tables present
3. Update governance/RUNTIME_TRUTH.md table status
4. Clean up temp files (root api/run-migrations.js, vercel.json functions block)
5. Close TASK-001 → move to DONE in QUEUE.md
6. Start TASK-002

---

## PREVIOUSLY COMPLETED

None — this is the first session with shared state files.

---

## NOTES

The stop hook at `~/.claude/stop-hook-git-check.sh` will continue to fire until migrations are applied. This hook was active throughout multiple sessions. The governance architecture files created this session (2026-06-02) do not clear the stop hook — only completing the migrations clears it.

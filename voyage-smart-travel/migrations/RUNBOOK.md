# VST Migration Runbook — Operator-Controlled Path

**Status of the old path:** the temporary public endpoint (`api/run-migrations.js` and its
root proxy) has been **removed from source**. Its static access token is compromised and
must never be reintroduced or accepted anywhere. Do not recreate a public migration
endpoint.

## What ships in this directory

| File | Creates |
|---|---|
| `001_user_profiles.sql` | `user_profiles` (+ triggers, RLS) |
| `002_user_dashboard.sql` | `booking_history`, `dashboard_widgets`, `eco_milestones` (+ RLS) |
| `003_planner_memory.sql` | `planner_sessions`, `planner_messages`, `planner_itineraries` (+ RLS) |
| `004_bookings.sql` | `flight_searches`, `hotel_searches` (+ RLS; alters `booking_history`) |

Nine expected tables in total. As of 2026-07-16 a direct database read found **none** of
them in the Supabase project's public schema — do not assume any migration is applied
without direct verification.

## Approval boundary (non-negotiable)

Production DDL runs only when **all** of the following are recorded first:

1. Independent review of the exact migration SQL at the exact commit to be applied.
2. Explicit founder (Mr Pain) production approval.
3. Security Officer sign-off per the Round Table Council rules.

## How to apply (choose one)

### Option A — GitHub Actions (preferred, auditable)

1. Add **one** repository secret (GitHub → Settings → Secrets and variables → Actions):
   - `SUPABASE_ACCESS_TOKEN` — a Supabase personal access token, **or**
   - `DATABASE_URL` — the Postgres connection URI.
   Secrets live only in GitHub's secret store — never in source, never in request headers.
2. Actions → **Supabase Migrations** → *Run workflow* → type `APPLY-PRODUCTION` in the
   confirmation field.
3. The run log is the audit receipt (approver, UTC timestamp, run id). Link it in the
   tracking issue/PR. The workflow is manual-dispatch only; merges never trigger it.

### Option B — Supabase SQL Editor (manual)

Paste `001` → `002` → `003` → `004` in order into the Supabase dashboard SQL editor for
the project and run each. Record who ran it, when, and the dashboard result as the
audit receipt.

## Post-apply verification (required)

From the Supabase dashboard or `psql`, confirm:

- all nine tables exist in `public`;
- `rowsecurity = true` for each (`select relname, relrowsecurity from pg_class ...`);
- owner-scoped policies and `set_updated_at` / `handle_new_user` triggers are present;
- anon key cannot read another user's rows (least-privilege spot check).

Record the output alongside the audit receipt. Only after this may migrations be
reported as applied.

## Credential rotation (pending founder approval)

Treat as compromised or derivable, and rotate once approved:

- the old static migration token (already removed from source; revoke anywhere reused);
- `JWT_SECRET` — the removed endpoint could derive a `service_role` JWT from it;
- Supabase service-role / anon keys and any `SUPABASE_*` tokens present in Vercel env.

Rotation itself requires founder approval per
`voyage-smart-travel/.claude/rules/vst-source-and-security.md`.

# Pain System — Operator Context & Deployment Policy

## Operator Identity
**Mr Pain** — Founder. All builds and deployments require Round Table Council sign-off before proceeding. See `docs/ROUND_TABLE_COUNCIL.md`.

---

## 6 Canon Rules

1. **Council First** — No build, deploy, or system change without Round Table quorum (4/6 seats).
2. **Security Officer Hard Veto** — 47-point checklist must pass. No exceptions.
3. **Secrets Out-of-Band** — No API keys, tokens, or credentials in source. Ever.
4. **One Source of Truth** — PROJECT_STATE files are authoritative. Keep them current.
5. **No Silent Failures** — All errors surface. No swallowing exceptions without logging.
6. **Rollback First** — Every deployment has a documented rollback plan before it ships.

---

## Canonical Deployment Platform: Vercel

**Vercel is the only authorized deployment platform for all Pain System assets.**

Netlify has been permanently decommissioned from the Pain System. Do not:
- Add `netlify.toml` files to this repository
- Create files under `netlify/` directories
- Use Netlify edge functions, redirects, or build configs
- Reference Netlify environment variables or deployment hooks
- Connect this repository to any Netlify project

## Vercel Configuration

- Static assets and SPA routes are handled via `vercel.json`
- Edge functions are implemented as Vercel Edge Functions (TypeScript, compatible with the Vercel Edge Runtime)
- Environment variables are managed in the Vercel dashboard
- All CI/CD deployments trigger via Vercel's GitHub integration

## Security

- Secrets must be stored in Vercel Environment Variables — never in committed files
- No platform credentials (Netlify tokens, Netlify build hooks) are valid or active

## Required Manual Steps to Complete Decommission

The Netlify GitHub App is still installed on this repository and must be removed manually:

### Option A — Remove via Netlify Dashboard (recommended)
1. Log in to [app.netlify.com](https://app.netlify.com)
2. Navigate to the **pain-system-hub** project
3. Go to **Site configuration → Build & deploy → Continuous deployment**
4. Click **Disconnect** to unlink the GitHub repository
5. Optionally: delete the pain-system-hub project from Netlify entirely

### Option B — Remove via GitHub (removes all Netlify access)
1. Go to [github.com/jamainefacey-blip/Jamaine-Facey/settings/installations](https://github.com/jamainefacey-blip/Jamaine-Facey/settings/installations)
2. Find the **Netlify** GitHub App
3. Click **Configure** → scroll to **Repository access** → remove this repository, OR
4. Click **Uninstall** to remove Netlify's GitHub App entirely

### Verification
After disconnection, new PRs should show no Netlify check runs.

---

## Active Systems

| System | URL | Status |
|---|---|---|
| Pain System Sandbox | Vercel deployment | Live (Vercel) |
| Pain System Endpoint | Vercel Edge Runtime | Live |
| Voyage Smart Travel | See `/voyage-smart-travel/CLAUDE.md` | Phase 2 active |
| Rehab Client | `/tools/rehab-client/` | MVP static |

---

## Current Priorities

1. Governance infrastructure — Round Table Council operational
2. VST Phase 2 completion — safety engine and accessibility
3. Security hardening — 47-point validation across all modules
4. MODULE_REGISTRY updates as new tools land

---

## Project State Files

- `MODULE_REGISTRY.md` — all sandbox modules and endpoints
- `COMPETITIVE_ANALYSIS.md` — market context
- `pain-system/docs/ROUND_TABLE_COUNCIL.md` — council charter
- `voyage-smart-travel/CLAUDE.md` — VST operator context

---

## Repo Structure

```
/pain-system/          — governance docs
/voyage-smart-travel/  — VST product (Phase 2)
/tools/                — sandbox tools (hello-pain, rehab-client)
/netlify/              — DELETED (Netlify decommissioned 2026-05-17)
```

---

## Platform Status

| Platform | Status |
|----------|--------|
| Vercel   | Active |
| Netlify  | Decommissioned (code 2026-05-17) — GitHub App removal pending (manual step required) |

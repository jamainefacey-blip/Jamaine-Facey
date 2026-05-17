# Pain System — Deployment Policy

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
After disconnection, new PRs should show no Netlify check runs. The existing checks on PR #11 showing "Redirect rules - pain-system-hub", "Header rules - pain-system-hub", and "Pages changed - pain-system-hub" confirm the app is still active.

## Module Endpoints

See [../MODULE_REGISTRY.md](../MODULE_REGISTRY.md) for the full registry of sandbox modules and their Vercel-compatible endpoint definitions.

## Status

| Platform | Status      |
|----------|-------------|
| Vercel   | Active      |
| Netlify  | Decommissioned (code 2026-05-17) — GitHub App removal pending (manual step required) |

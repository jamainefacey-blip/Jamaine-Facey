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

## Module Endpoints

See [../MODULE_REGISTRY.md](../MODULE_REGISTRY.md) for the full registry of sandbox modules and their Vercel-compatible endpoint definitions.

## Status

| Platform | Status      |
|----------|-------------|
| Vercel   | Active      |
| Netlify  | Decommissioned (2026-05-17) |

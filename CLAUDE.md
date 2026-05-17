# Pain System — Claude Context

## Operator Identity
Pain System sandbox repo (Jamaine-Facey). No-build, no-framework Netlify Edge Functions project. All runtime logic executes at CDN edge via Deno-compatible TypeScript.

## Active Systems
| System | Endpoint | Location |
|---|---|---|
| Pain System status | `/pain-system` | `netlify/edge-functions/pain-system.ts` |
| Hello Pain tool | `/tools/hello-pain` | `tools/hello-pain/handler.ts` |
| Rehab Client SPA | `/tools/rehab-client` | `tools/rehab-client/` |
| Voyage Smart Travel | `/voyage-smart-travel/` | `voyage-smart-travel/` |

## Canonical Asset Locations
| Asset type | Path |
|---|---|
| Edge functions | `netlify/edge-functions/` |
| Shared UI components | `components/` |
| Demo pages | `pages/` |
| Sandbox tools | `tools/` |
| Static assets | `public/` |
| Module registry | `MODULE_REGISTRY.md` |
| Netlify config | `netlify.toml` |
| Architecture map | `.claude/ARCHITECTURE_MAP.md` |

## Build Rules
- No bundler, no compiler, no build framework
- Edge functions: Deno-compatible TypeScript, export `default` handler + `config` with `path`
- Pages: plain JS functions returning HTML strings
- Components: server-rendered HTML, plain JS
- Deploy target: Netlify (edge functions + static, publish dir = `public/`)

## Coding Rules
- Do not add bundlers or build steps
- Do not add npm runtime dependencies without strong justification
- New sandbox modules → document in `MODULE_REGISTRY.md`
- New tools → follow pattern in `tools/tool-template/`
- Keep edge functions stateless; no persistent server state

## Key Config Files
- `netlify.toml` — routing, redirects, edge function path bindings
- `package.json` — project metadata only (no build scripts, no runtime deps)
- `.claudeignore` — directories Claude Code never reads
- `.claude/settings.json` — Claude Code token and model settings

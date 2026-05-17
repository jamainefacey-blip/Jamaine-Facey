# Pain System Architecture Map

## Repository
- **Repo**: jamainefacey-blip/jamaine-facey
- **Platform**: Netlify Edge Functions (Deno runtime)
- **Deploy branch**: main
- **Vercel project**: [FILL IN — add Vercel project name/ID if applicable]
- **Supabase project ID**: [FILL IN — add Supabase project ref]

---

## Canonical Assets (33 total)

### Edge Functions — `netlify/edge-functions/` (26)
| # | File | Path | Purpose |
|---|---|---|---|
| 1 | `[page].js` | dynamic | Catch-all page router |
| 2 | `abtest.ts` | `/abtest` | A/B testing via cookies |
| 3 | `context-site.ts` | `/context-site` | Reads Netlify site context |
| 4 | `cookies.ts` | shared utility | Cookie helpers |
| 5 | `country-block.ts` | `/country-block` | Country-based access control |
| 6 | `environment.ts` | `/environment` | Reads Netlify env vars |
| 7 | `error.ts` | `/error` | Error handling demo |
| 8 | `geolocation.ts` | `/geolocation` | Geo data from request context |
| 9 | `hello.js` | `/hello` | Hello World response |
| 10 | `htmlrewriter.ts` | `/htmlrewriter` | On-the-fly HTML transformation |
| 11 | `image-external.ts` | `/image-external` | Proxy external image |
| 12 | `image-internal.ts` | `/image-internal` | Serve internal image |
| 13 | `include.ts` | `/include` | Edge-side content includes |
| 14 | `json.ts` | `/json` | JSON response |
| 15 | `localized-content.js` | `/localized-content` | Locale-based content serving |
| 16 | `log.ts` | `/log` | Edge function logging |
| 17 | `long-running.ts` | `/long-running` | Streaming long-running response |
| 18 | `method.ts` | `/method` | HTTP method inspection |
| 19 | `pain-system.ts` | `/pain-system` | Pain System status/health check |
| 20 | `proxy-requests.ts` | `/proxy-requests` | Upstream request proxying |
| 21 | `rewrite.ts` | `/rewrite` | URL rewrite demo |
| 22 | `set-request-header.ts` | `/set-request-header` | Inject request headers |
| 23 | `set-response-header.ts` | `/set-response-header` | Inject response headers |
| 24 | `sse.ts` | `/sse` | Server-Sent Events stream |
| 25 | `transform.ts` | `/*` (global) | Global response transformation |
| 26 | `wasm.ts` | `/wasm` | WebAssembly at edge |

### Sandbox Tools — `tools/` (3)
| # | Tool | Endpoint | Purpose |
|---|---|---|---|
| 27 | `hello-pain` | `/tools/hello-pain` | Sandbox tool health check |
| 28 | `rehab-client` | `/tools/rehab-client` | PT/rehab coaching SPA |
| 29 | `tool-template` | — | Template for new tools |

### Applications — repo subdirectories (2)
| # | App | Location | Purpose |
|---|---|---|---|
| 30 | Voyage Smart Travel | `voyage-smart-travel/` | Travel planning SPA with Anthropic proxy |
| 31 | Pain System Test | `pain-system-test/` | Static test harness |

### Config & Registry (2)
| # | File | Purpose |
|---|---|---|
| 32 | `netlify.toml` | Netlify routing, redirects, edge function bindings |
| 33 | `MODULE_REGISTRY.md` | Canonical module documentation |

---

## Active Repos
| Repo | Purpose |
|---|---|
| `jamainefacey-blip/jamaine-facey` | Pain System sandbox — this repo |
| [FILL IN] | Add additional active repos here |

---

## Active Vercel Projects
| Project | URL | Notes |
|---|---|---|
| [FILL IN] | [FILL IN] | Add Vercel project details |

---

## Supabase
| Field | Value |
|---|---|
| Project ID | [FILL IN] |
| Region | [FILL IN] |
| URL | [FILL IN] |

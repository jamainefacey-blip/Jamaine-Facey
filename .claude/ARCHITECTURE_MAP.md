# Pain System Architecture Map

## Active Repos
| Repo | Description |
|---|---|
| Jamaine-Facey | Pain System sandbox — Netlify Edge Functions, no-build |

## Vercel Projects
| Project | Notes |
|---|---|
| [FILL IN] | Add Vercel project name/URL when configured |

## Supabase
| Field | Value |
|---|---|
| Project ID | [FILL IN] |
| Region | [FILL IN] |

---

## Canonical Assets (33)

### Edge Functions (26) — `netlify/edge-functions/`
| # | File | Path |
|---|---|---|
| 1 | [page].js | Dynamic catch-all page router |
| 2 | abtest.ts | `/abtest` — A/B testing via cookies |
| 3 | context-site.ts | `/context-site` — Netlify site context |
| 4 | cookies.ts | `/cookies` — Cookie utilities |
| 5 | country-block.ts | `/country-block` — Geo-based access block |
| 6 | environment.ts | `/environment` — Env variable reader |
| 7 | error.ts | `/error` — Error/exception demo |
| 8 | geolocation.ts | `/geolocation` — Geo data from request |
| 9 | hello.js | `/hello` — Hello world response |
| 10 | htmlrewriter.ts | `/htmlrewriter` — On-the-fly HTML transform |
| 11 | image-external.ts | `/image-external` — Fetch external image |
| 12 | image-internal.ts | `/image-internal` — Fetch internal image |
| 13 | include.ts | `/include` — Edge-side content includes |
| 14 | json.ts | `/json` — JSON response |
| 15 | localized-content.js | `/localized-content` — Locale-based content |
| 16 | log.ts | `/log` — Write to edge logs |
| 17 | long-running.ts | `/long-running` — Streaming long response |
| 18 | method.ts | `/method` — HTTP method reader |
| 19 | pain-system.ts | `/pain-system` — Pain System status/health |
| 20 | proxy-requests.ts | `/proxy-requests` — Upstream proxy |
| 21 | rewrite.ts | `/rewrite` — URL rewrite |
| 22 | set-request-header.ts | `/set-request-header` — Add request headers |
| 23 | set-response-header.ts | `/set-response-header` — Add response headers |
| 24 | sse.ts | `/sse` — Server-Sent Events |
| 25 | transform.ts | `/*` — Global response transform |
| 26 | wasm.ts | `/wasm` — WebAssembly at edge |

### Tools (3) — `tools/`
| # | Tool | Endpoint |
|---|---|---|
| 27 | hello-pain | `/tools/hello-pain` |
| 28 | rehab-client | `/tools/rehab-client` |
| 29 | tool-template | (template, no endpoint) |

### UI Components (7) — `components/`
| # | File | Purpose |
|---|---|---|
| 30 | head.js | HTML `<head>` (meta, styles, fonts) |
| 31 | header.js | Site navigation/header |
| 32 | footer.js | Page footer |
| 33 | layout.js | Full page shell |

### Additional Systems
| System | Location |
|---|---|
| Voyage Smart Travel | `voyage-smart-travel/` |
| pain-system-test | `pain-system-test/` |
| Static assets | `public/` |
| Demo pages | `pages/` |

---

## Key Config Files
| File | Purpose |
|---|---|
| `netlify.toml` | Routing, redirects, edge function bindings |
| `package.json` | Project metadata only |
| `MODULE_REGISTRY.md` | All registered sandbox modules |
| `.claudeignore` | Dirs Claude Code never reads |
| `.claude/settings.json` | Claude Code token/model settings |

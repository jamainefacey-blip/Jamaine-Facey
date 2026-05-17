# Pain System — Operator Context

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

## Active Systems

| System | URL | Status |
|---|---|---|
| Pain System Sandbox | https://edge-functions-examples.netlify.app/ | Live |
| Pain System Endpoint | https://edge-functions-examples.netlify.app/pain-system | Live |
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
/netlify/edge-functions/ — edge function handlers
```

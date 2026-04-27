# PAIN SYSTEM — CLAUDE CODE CONTROL v3
# Behaviour Enforcement Layer — Updated 2026-04-27

---

## IDENTITY

This repository contains multiple lanes. Do not mix them.

### Allowed lanes
- VST = Voyage Smart Travels (port 3000)
- AI_LAB = AI Lab orchestration panel (port 4444)
- FHI = Fraud Help Index
- ADMIN = Pain System admin/control layer
- BACKYARD = sandbox/prototype lane
- GOVERNANCE = rules, memory, control layer

If a task belongs to a lane not listed above, reject it.
If a task spans lanes without explicit permission, reject it.

---

## EXECUTION RULES

### Workflow — mandatory order
1. PLAN
2. BUILD
3. QA
4. REVIEW
5. DEPLOY
6. VERIFY

No step may be skipped. Do not return output before VERIFY passes.

### Failure loop (mandatory)
If QA fails:
1. Run investigation (DEBUG mode)
2. Fix issue
3. Re-run QA
4. Proceed only when pass confirmed
5. Max 2 fix cycles — then STOP and return BLOCKED

### Execution over explanation
- Write code, not descriptions of code
- Edit files, do not quote them back
- If blocked, state the blocker — do not speculate around it

### Fail fast
- If a command hangs after 10s: kill it, log it, move on
- Do not retry a hanging command more than once

---

## OUTPUT CONTRACT

Every response to a task MUST use this exact structure. No exceptions.

```
STATUS:   COMPLETE | BLOCKED | PARTIAL | FAIL
FILES:    list of files changed (path only, one per line)
RESULT:   what was done — verified facts only
TESTS:    what was run and what passed/failed
NEXT:     one concrete next action, or NONE
```

### Rules
- STATUS must be one of the four values above — no free text
- FILES must list only files actually changed in this response
- RESULT must contain only verified output — no predictions, no assumptions
- TESTS must reference actual commands run or checks performed
- NEXT must be a single actionable item, not a list
- If a section has nothing to report: write the key with a dash (`FILES: —`)
- Return production-ready outputs only
- No placeholders or partial implementations

---

## TOKEN DISCIPLINE

- Do not restate instructions
- Do not explain reasoning unless explicitly asked
- Do not narrate steps
- Do not add preamble or closing remarks
- Minimise tokens, minimise steps, maximise execution speed
- Prefer editing files over prose
- One sentence per point — never pad

---

## TOOL CONTROL

- Use `/browse` for all web access
- Never use `mcp__claude-in-chrome__*` tools

### Command set (gstack — restricted)

| Category | Commands |
|----------|----------|
| Execution | `/plan-eng-review`, `/ship`, `/land-and-deploy`, `/canary` |
| Validation | `/qa`, `/review`, `/benchmark` |
| Debug | `/investigate`, `/retro` |
| Browser | `/browse` |

---

## MONETISATION AWARENESS

When output touches AI_LAB or VST:
- Note route type if routing layer fired (A / B / C / D)
- Flag any output that has commercial value or escalation potential
- Do not suppress HIGH VALUE tags — surface them in RESULT

---

## NO SPECULATIVE OUTPUT

- Do not predict future behaviour
- Do not describe what "should" happen — only what did happen
- If something is unknown, write: `UNKNOWN: <what is unknown>`
- Do not fill gaps with assumptions

---

## SYSTEM PROTECTION

### Baseline lock
- baseline_v2 (commit e6a0552, locked 2026-03-24) is the protected AI Lab state
- Do not modify: pipeline stages, routing logic, action layer, server.js write logic
- Protected file: `tools/rehab-client/ai-lab/server.js`
- Any task that would break baseline_v2 must be rejected or explicitly approved

### File protection
- Do not change unrelated files
- Do not refactor working code unless the task explicitly says so
- Do not delete files without explicit instruction

### No scope expansion
- Do not add features not requested
- Do not redesign unless explicitly requested
- Scope is exactly what the task states — nothing more

---

## FAIL CONDITIONS

Stop immediately and return `STATUS: FAIL` if any of the following occur:

| # | Condition |
|---|-----------|
| F1 | A command fails twice with the same error |
| F2 | A test cannot be run (missing dependency, wrong env) |
| F3 | A change would modify a baseline-locked file without approval |
| F4 | Task requires mixing lanes without explicit permission |
| F5 | Output cannot be verified (no test, no log, no observable result) |
| F6 | Fix cycle limit (2) reached without passing tests |
| F7 | A file write would overwrite data (not append) in data/ stores |
| F8 | Task specifies a layer and a modification targets a different layer |

On FAIL: state condition number + exact reason. Do not attempt workarounds.

---

## SCOPE LOCK

If a task specifies a layer (UI / PIPELINE / ROUTING / ACTION / STORAGE):
- ONLY that layer may be modified
- Any cross-layer modification = F8

Forbidden without explicit instruction:
- .gitignore changes
- file tracking changes
- storage behaviour changes
- repo structure changes

If uncertain → STOP and ask. Never assume optimisation permission.

---

## EXECUTION MODE SWITCHES

Declare mode at start of task if non-default.

### BUILD (default)
- Write or modify code to meet spec
- Follow full PLAN → BUILD → QA → REVIEW → DEPLOY → VERIFY cycle
- Return OUTPUT CONTRACT on completion

### DEBUG
- Diagnose only — do not change logic
- Identify root cause with evidence (log lines, file refs, line numbers)
- Return: root cause + affected files + recommended fix (no code written unless asked)

### AUDIT
- Read-only inspection of a system or file set
- List findings only — no changes
- Flag: broken contracts, missing tests, baseline violations, security issues
- Return OUTPUT CONTRACT with RESULT = findings list

### DEPLOY
- Default target: Vercel deployment flow
- All outputs must be compatible with CI/CD pipeline
- Push verified build to target branch only
- Confirm: branch, commit hash, files pushed
- Do not push unverified or partial builds
- Return OUTPUT CONTRACT with FILES = pushed files, RESULT = confirmed commit

---

## OVERRIDE RULE

If user explicitly overrides a workflow step:
- Follow the user instruction
- Still enforce QA before deploy
- Log the override in RESULT

---

## CODEBASE STRUCTURE

```
/
├── ai-lab/                  AI Lab TypeScript orchestration (Deno runtime)
│   ├── agents/              Extractor, architect, product-manager, monetisation, validator
│   ├── pipelines/           5 stages: extraction → reconstruction → gap-risk → monetisation → build-output
│   ├── runner/              CLI runners: run-asset.ts, run-vst-analysis.ts, run-vst-fhi.ts
│   ├── assets/              vst-seed.ts, fhi-seed.ts
│   ├── runs/                Timestamped execution logs (JSON)
│   ├── orchestrator.ts      Main orchestration logic (retry, failure classification)
│   ├── model-router.ts      Tier routing: local (haiku) / external (opus) / fallback (sonnet)
│   ├── agent-validator.ts   Validation engine
│   ├── config.ts            Asset registry + defaults
│   └── types.ts             TypeScript type definitions
├── tools/
│   ├── rehab-client/
│   │   ├── ai-lab/
│   │   │   ├── server.js    BASELINE LOCKED — Node.js HTTP, port 4444, POST /api/action
│   │   │   ├── index.html   AI Lab UI shell
│   │   │   └── data/        Append-only stores: leads.json, bookings.json, enterprise.json, analysis.json
│   │   └── scripts/         SPA router, exercise/plan data
│   ├── hello-pain/          Sandbox test handler
│   ├── tool-template/       Template for new tools
│   └── build-ai-lab-index.js Build script for AI Lab index
├── pages/                   Next.js pages (VST) + Netlify edge function demos
│   ├── index.tsx            VST homepage
│   ├── business-travel.tsx, pricing.tsx, compliance.tsx, how-it-works.tsx
│   ├── login.tsx, signup.tsx, demo.tsx
│   └── _app.tsx             Next.js app wrapper
├── components/vst/          Layout.tsx, Nav.tsx, Footer.tsx
├── styles/                  VST CSS
├── netlify/edge-functions/  Deno edge functions (22+ demos + pain-system.ts)
├── public/                  Static assets, PWA manifest, AI Lab copy (build output)
├── memory/
│   ├── vst/decisions.md     VST architectural decisions
│   ├── vst/flows.md         Trip, Lead, Ava data flows
│   ├── ai-lab/baseline_v2.md Locked baseline state
│   └── governance/codespaces.md Dev environment baseline
├── types/                   Shared TypeScript type definitions
├── .github/workflows/validate.yml CI: JSON validation + baseline guard + node install
├── CLAUDE.md                This file — behaviour enforcement layer
├── PRIMER.md                Quick lane/port reference
├── MODULE_REGISTRY.md       Sandbox module documentation
├── package.json             NPM scripts and dependencies
├── next.config.js           Next.js config
├── netlify.toml             Netlify deployment config
└── vercel.json              Vercel deployment config
```

---

## TECH STACK

| Layer | Technology |
|-------|------------|
| VST frontend | Next.js 14.2.3 + React 18.2.0 + TypeScript 6.0.2 |
| AI Lab orchestration | TypeScript (tsx runner), Deno for edge |
| AI Lab server | Node.js built-ins only (http, fs, path) |
| Package manager | pnpm (primary), npm (fallback) |
| Hosting | Vercel (VST/Next.js), Netlify (edge functions) |
| CI/CD | GitHub Actions (validate.yml) |
| Claude models | haiku-4-5 (local), opus-4-6 (external), sonnet-4-6 (fallback) |

---

## PORT ALLOCATION

| Port | Service | Entry point |
|------|---------|-------------|
| 3000 | VST (Next.js) | `npm run dev` or `npm run open:vst` |
| 4444 | AI Lab (Node) | `npm run open:ai-lab` |

Rule: Never confuse VST (3000) with AI Lab (4444).

---

## KEY COMMANDS

```bash
# VST
npm run dev              # Next.js dev server (port 3000)
npm run build            # Full production build
npm run preview:vst      # Build + serve locally

# AI Lab
npm run open:ai-lab      # Start server.js on port 4444
npm run restart:ai-lab   # Kill + restart server.js
npm run ai-lab:vst       # Run VST analysis pipeline (CLI)
npm run ai-lab:vst:json  # VST analysis with JSON output
npm run ai-lab:vst-fhi   # Run VST + FHI in parallel

# Health checks
npm run check:vst        # curl -I localhost:3000
npm run check:ai-lab     # curl -I localhost:4444
```

---

## AI LAB ROUTING LAYER

Routes determined by `determineRoute()` post-pipeline:

| Route | Name | Data store | Enrichments |
|-------|------|-----------|-------------|
| A | Lead Capture | data/leads.json | source=ai-lab, savedAt |
| B | Booking Flow | data/bookings.json | source=ai-lab, savedAt, status=pending |
| C | Enterprise Flag | data/enterprise.json | source=ai-lab, savedAt, priority=HIGH |
| D | Internal Analysis | data/analysis.json | source=ai-lab, savedAt |

All writes are append-only. Overwriting data stores = F7.

---

## AI LAB MODEL ROUTER

| Tier | Model | Condition |
|------|-------|-----------|
| local | claude-haiku-4-5-20251001 | Low complexity, first attempt |
| external | claude-opus-4-6 | High complexity or source >80,000 chars |
| fallback | claude-sonnet-4-6 | Retry attempt or routing failure |

---

## BUILD PROCESS

```bash
node tools/build-ai-lab-index.js          # Generate AI Lab index
mkdir -p public/ai-lab                    # Ensure public dir exists
cp -r tools/rehab-client/ai-lab/. public/ai-lab/  # Copy static files
next build                                # Build VST Next.js app
```

Output: `.next/` (VST), `public/ai-lab/` (AI Lab static copy).

---

## CI/CD (GitHub Actions)

File: `.github/workflows/validate.yml` — runs on all pushes and PRs.

| Job | Checks |
|-----|--------|
| validate-json | package.json syntax, data store JSON validity |
| baseline-guard | Warns if server.js modified (baseline commit e6a0552) |
| node-install | Node 18, pnpm install --frozen-lockfile, syntax check server.js |

No unit test framework. CI validation is syntactic and JSON-based.

---

## DEPLOYMENT

### Vercel (VST)
- Framework: nextjs
- Build: full build command above
- Rewrites: `/ai-lab/*` → `/ai-lab/index.html` (SPA fallback)

### Netlify (Edge functions)
- Edge functions at `/*` (global transform) and per-route handlers
- `netlify/edge-functions/pain-system.ts` — status endpoint

---

## SECURITY CONSTRAINTS

- `ANTHROPIC_API_KEY` required for AI Lab runners — env var only, never committed
- AI Lab server includes path traversal guard on static file serving
- CORS enabled on POST `/api/action` only
- AI Lab defaults to `mode: "analysis"` — no write operations without explicit mode switch
- `allowMultiAsset: false` — single-asset per run enforced

---

## ASSET REGISTRY

| Asset ID | Name | Seed file |
|----------|------|-----------|
| `vst` | Voyage Smart Travels | `ai-lab/assets/vst-seed.ts` |
| `fhi` | Fraud Help Index | `ai-lab/assets/fhi-seed.ts` |
| `biab` | Business In A Box | registry only |
| `rehab-client` | Rehab Client | registry only |

---

## MEMORY REFERENCES

| File | Purpose |
|------|---------|
| `memory/vst/decisions.md` | VST system decisions |
| `memory/vst/flows.md` | VST pipeline flows (Trip, Lead, Ava) |
| `memory/ai-lab/baseline_v2.md` | AI Lab locked baseline (commit e6a0552) |
| `memory/governance/codespaces.md` | Dev environment baseline and first-run checks |
| `PRIMER.md` | Lane and port quick reference |
| `MODULE_REGISTRY.md` | Sandbox module documentation |

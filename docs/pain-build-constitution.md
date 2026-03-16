# Pain System — Build Constitution

**Version:** 1.0
**Last updated:** 2026-03-16
**Purpose:** Permanent reference for Claude-assisted development. Future checkpoint prompts reference this document instead of repeating architecture instructions.

---

## Section 1 — Project Purpose

The Pain System is a file-driven rehabilitation coaching platform delivered as two separate SPAs inside the `mrpainpt/` directory.

| App | Path | Audience |
|-----|------|----------|
| Client rehab experience | `mrpainpt/apps/client/` | The patient / rehab client |
| Coach portal | `mrpainpt/apps/coach/` | The physiotherapist / coach |

### Design intent

The system is intentionally designed to be:

- **File-driven** — all programme data lives in versioned JS files; no database required
- **Git-versioned** — every data change is a commit; full history is preserved
- **Static-deployable** — both SPAs serve as plain HTML/CSS/JS with no server runtime
- **Portable with zero vendor lock-in** — no proprietary SDK, no framework, no build pipeline required to run

The architecture must remain true to these properties through all phases. Any change that introduces a vendor dependency, a required build step, or server-side state without an explicit phase-gate decision violates this constitution.

---

## Section 2 — Canonical Data Model

### Canonical sources — the ONLY sources of truth

```
mrpainpt/clients/<slug>/client.config.js   → CLIENT_CONFIG   (profile, goals, notes)
mrpainpt/clients/<slug>/plan.js            → REHAB_PLAN      (phases, weeks, sessions)
mrpainpt/clients/<slug>/exercises.js       → CLIENT_EXERCISE_OVERRIDES (per-client overrides)
mrpainpt/packages/exercise-library/index.js → EXERCISE_LIBRARY (shared canonical exercises)
```

These files are the authoritative record. No other file, script, or runtime artefact may be treated as a data source by any other application.

### Runtime artefacts — deployment copies only

```
mrpainpt/apps/client/scripts/data/
```

Files under this path are generated or derived copies for the client SPA runtime. They must **never** be used as a data source by the coach portal or any other application. If coach portal needs client data, it reads from `mrpainpt/clients/<slug>/` directly via `loadClient(slug)`.

### Known Phase 3 limitation — exercises.js naming conflict

`clients/<slug>/exercises.js` declares `const EXERCISE_LIBRARY`, which collides with the canonical library's global of the same name. For Phase 3, `clients/<slug>/exercises.js` is **not** loaded as a `<script>` tag. Exercise overrides are passed as an empty array. Resolution in Phase 4: the API layer performs the merge server-side, or the client override file is renamed to `CLIENT_EXERCISE_OVERRIDES`.

### Adding a new client (Phase 3 checklist)

1. Create `mrpainpt/clients/<slug>/` with `client.config.js`, `plan.js`, and `exercises.js`.
2. Add `{ slug, active }` entry to `mrpainpt/apps/coach/scripts/data/registry.js`.
3. Add `<slug>` entry to `CLIENT_DATA_MAP` in `mrpainpt/apps/coach/scripts/data/loader.js`.
4. Add two `<script>` tags to `mrpainpt/apps/coach/index.html` (before `coach-app.js`):
   - `clients/<slug>/client.config.js`
   - `clients/<slug>/plan.js`

---

## Section 3 — Architecture Principles

### Hard rules — Phase 3

| Rule | Detail |
|------|--------|
| No build step | Both SPAs must open directly in a browser from the file system |
| No external frameworks | No React, Vue, Angular, Svelte, or equivalent |
| No API calls | No `fetch()`, `XMLHttpRequest`, or WebSocket in Phase 3 |
| No database dependency | All state lives in canonical JS files and git |
| No auth layer | Authentication is a Phase 4 concern |
| Hash-based routing only | Both SPAs use `location.hash`; no `pushState` routing |
| Separate SPAs | `apps/client` and `apps/coach` are fully independent; no shared runtime |
| No coach→client coupling | Coach portal must never import from or depend on `apps/client/` scripts |

### Script load order — coach portal (`apps/coach/index.html`)

```
1. packages/exercise-library/index.js   → EXERCISE_LIBRARY
2. clients/<slug>/client.config.js      → CLIENT_CONFIG
3. clients/<slug>/plan.js               → REHAB_PLAN
   (exercises.js NOT loaded — see naming conflict note above)
4. scripts/data/registry.js             → CLIENT_REGISTRY
5. scripts/data/loader.js               → loadClient()
6. scripts/coach-app.js                 → router boot
7. scripts/views/client-list.js         → registers 'clients' route
8. scripts/views/client-detail.js       → registers 'client-detail' route
9. scripts/views/tab-*.js               → register COACH_TAB_HANDLERS[key] (CP4+)
10. scripts/views/exercise-library.js   → registers 'library' route (CP5)
```

Do not change this order without updating this constitution.

### Coach portal public API surface

```javascript
// Router
COACH_APP.registerRoute(name, handler)   // view files self-register on load
COACH_APP.parseRoute(hash)               // returns { name, slug, tab }
COACH_APP.refresh()                      // re-dispatch current hash

// Tab handlers (installed by tab-*.js files in CP4)
window.COACH_TAB_HANDLERS[tabKey] = function(client, slug) { return htmlString; }

// Data
loadClient(slug)    // returns { config, plan, exercises } or null
CLIENT_REGISTRY     // [{ slug, active }]
```

### Supported routes — coach portal

| Hash pattern | Route name | Description |
|---|---|---|
| `#clients` | `clients` | Client list dashboard |
| `#client/:slug/profile` | `client-detail` | Client profile tab |
| `#client/:slug/plan` | `client-detail` | Rehab plan tab |
| `#client/:slug/progress` | `client-detail` | Progress / pain trend tab |
| `#client/:slug/notes` | `client-detail` | Coach notes tab |
| `#library` | `library` | Exercise library browser |

Default route: empty or bare `#` redirects to `#clients`.

### Pain colour tokens (defined in `coach.css`)

| Token | Value | Applies when |
|---|---|---|
| `--pain-green` | `#059669` | Score ≤ 3 |
| `--pain-amber` | `#d97706` | Score 4–6 |
| `--pain-red` | `#dc2626` | Score ≥ 7 |

These tokens and their `*-bg` variants must be used for all pain score rendering. Do not hardcode colour values in view files.

---

## Section 4 — Protected Directories

Claude must **never** modify these paths unless the active checkpoint prompt contains an explicit instruction to do so for a specific file.

```
mrpainpt/apps/client/                          Client SPA — do not touch
tools/rehab-client/                            CLI tooling — do not touch
netlify.toml  (root)                           Root deployment config — do not touch
mrpainpt/clients/                              All canonical client data — do not touch
mrpainpt/packages/exercise-library/           Shared exercise library — do not touch
```

### Checkpoint-scoped protections

The following files become protected once created. They may only be modified if the checkpoint prompt explicitly lists them in scope:

```
mrpainpt/apps/coach/scripts/data/registry.js
mrpainpt/apps/coach/scripts/data/loader.js
mrpainpt/apps/coach/index.html
mrpainpt/apps/coach/styles/coach.css
mrpainpt/apps/coach/scripts/coach-app.js
mrpainpt/apps/coach/scripts/views/client-list.js
mrpainpt/apps/coach/scripts/views/client-detail.js
```

### If a protected file must change

Stop. Report the required change in the checkpoint output under `FILES_MODIFIED` with a full explanation. Do not make the change silently. Do not proceed with the checkpoint until the change is explicitly approved.

---

## Section 5 — Checkpoint Development Protocol

All development work must follow numbered checkpoints. Each checkpoint is an atomic unit of work with a defined file scope.

### Checkpoint rules

1. Each checkpoint prompt defines the **exact set of files** to create or modify.
2. **Never create files outside the checkpoint scope.**
3. **Never modify existing files** unless the checkpoint prompt explicitly allows it.
4. After completing all files in a checkpoint, **stop and report**. Do not begin the next checkpoint.

### Mandatory response structure

Every checkpoint response must be a single fenced code block containing exactly these sections in this order:

```
STATUS
WHAT_YOU_READ
FILES_CREATED
FILES_MODIFIED
FILES_NOT_TOUCHED
COMPETITOR_GAPS_CHECK
LOCAL_VERIFICATION
COMMIT_MESSAGE
ROLLBACK_COMMAND
NEXT_ACTION
```

**No text outside the fenced code block.**

### NEXT_ACTION values

Set `NEXT_ACTION` to one of:

```
APPROVE_CHECKPOINT_<N>
FIX_CHECKPOINT_<N>_FIRST
```

### Verification before commit

Before committing, Claude must confirm:

1. All created files load without console errors in a Node.js `vm.createContext()` test.
2. All route dispatches render content (not undefined/null/empty).
3. `git diff` shows only the files listed in `FILES_CREATED` and `FILES_MODIFIED`.
4. All protected paths show zero diff.
5. Zero `localStorage` writes (unless the checkpoint explicitly requires them).
6. Zero `fetch()` calls (Phase 3).

### Rollback

Every checkpoint response must include a single `git revert <sha>` command that undoes only that checkpoint's commit without affecting earlier work.

---

## Section 6 — Safety Principles

Claude must always:

- Confirm `git diff` shows only intended files before committing
- Run Node.js `vm.createContext()` verification before every commit
- Escape all user-controlled or data-derived strings with an `esc()` helper before rendering to innerHTML
- Confirm zero `localStorage` writes unless the checkpoint explicitly requires them
- Confirm zero `fetch()` calls in Phase 3
- Use `COACH_APP.registerRoute()` for self-registration rather than modifying `coach-app.js`
- Use `window.COACH_TAB_HANDLERS[key]` for tab content rather than modifying `client-detail.js`
- Never introduce a `<script src="...">` that loads from an external CDN or third-party domain

Claude must never:

- Run `git push --force` without explicit user instruction
- Amend a previous commit (create a new one instead)
- Delete files without explicit instruction
- Skip `--no-verify` hooks
- Add `console.log` debug statements to committed code

---

## Section 7 — Future API Layer (Phase 4)

Phase 4 will replace the file-driven data layer with a server API. The following changes are planned:

| Concern | Phase 3 | Phase 4 |
|---|---|---|
| Client data | `loadClient(slug)` reads from `<script>` globals | `loadClient(slug)` calls `await fetch('/api/client/' + slug)` |
| Notes writes | Not supported | `POST /api/client/:slug/notes` |
| Auth | None | Session-based or JWT |
| Persistence | Git files | Server database |

### Drop-in replacement contract

`loadClient(slug)` must remain the single entry point for all view files. Its return shape must not change:

```javascript
{
  config:    object,   // CLIENT_CONFIG shape
  plan:      object,   // REHAB_PLAN shape
  exercises: array,    // merged exercise set
}
```

When Phase 4 replaces the body of `loadClient()` with a `fetch()` call, **no view file requires any change**. This is a hard architectural constraint.

### Phase 4 checklist (not yet in scope)

- [ ] Create `mrpainpt/apps/coach/api/` server layer
- [ ] Replace `loadClient()` body in `loader.js` with async fetch
- [ ] Update all view files that call `loadClient()` to await the result
- [ ] Add authentication middleware
- [ ] Add write endpoint for notes
- [ ] Add `mrpainpt/apps/coach/netlify.toml` with redirect rules for the API

---

## Section 8 — Response Discipline

All Claude responses for development checkpoints must:

- Return **exactly one** fenced code block
- Contain **no text outside** the fenced code block
- Follow the checkpoint report structure defined in Section 5
- Not include explanatory prose, apologies, summaries, or markdown outside the block

If a checkpoint cannot be completed (blocked dependency, ambiguous requirement, protected file conflict), Claude must still return a single fenced code block and set `NEXT_ACTION` to `FIX_CHECKPOINT_<N>_FIRST` with a clear explanation inside the block.

---

## Section 9 — Token Efficiency

Future checkpoint prompts should reference this constitution instead of repeating architecture instructions.

### Minimal checkpoint prompt pattern

```
Execute Checkpoint <N> according to docs/pain-build-constitution.md.

CREATE ONLY THESE FILES:
1. <path>

REQUIREMENTS:
<brief delta from constitution defaults>

COMMIT MESSAGE:
<exact message>
```

Claude must read `docs/pain-build-constitution.md` before executing any new checkpoint and treat it as authoritative for all rules not overridden by the checkpoint prompt.

### Constitution update protocol

If a checkpoint introduces a structural change that is not covered by this document (new route, new global API surface, new script load order entry), Claude must:

1. Complete the checkpoint as specified.
2. Include a `CONSTITUTION_UPDATE_REQUIRED` note in the checkpoint output.
3. Wait for explicit instruction before modifying this file.

---

*End of constitution.*

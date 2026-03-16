# Mr Pain PT — Platform

All Mr Pain PT product code lives under this folder.

## Structure

```
mrpainpt/
├── apps/
│   ├── client/       Client-facing rehab coaching app (promoted from tools/rehab-client/)
│   └── coach/        Coach portal — Phase 3
├── packages/
│   ├── exercise-library/   Canonical shared exercise library — Phase 2
│   ├── progress-engine/    Shared progress calculation and session state — Phase 2
│   ├── auth/               Auth utilities (PIN, session tokens) — Phase 4
│   └── ui-tokens/          Shared CSS custom properties — Phase 2
├── clients/
│   ├── _template/    Reference config for new client instances — Phase 2
│   └── sarah-thompson/     First client — config migrated from apps/client/scripts/data/ in Phase 2
└── api/              Edge function API layer — Phase 4
```

## Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | Establish structure, promote client app | In progress |
| 2 | Extract shared packages, create clients/ registry | Pending |
| 3 | Coach portal | Pending |
| 4 | API layer, real persistence, auth | Pending |
| 5 | White-label automation | Pending |

## Data sync pattern

### 1. Canonical sources

These files are the source of truth. Developers edit these first.

- `mrpainpt/clients/<slug>/client.config.js`
- `mrpainpt/clients/<slug>/plan.js`
- `mrpainpt/packages/exercise-library/index.js`

### 2. Deployment artifacts

These are the files the live app reads at runtime.

- `mrpainpt/apps/client/scripts/data/client.js`
- `mrpainpt/apps/client/scripts/data/plan.js`
- `mrpainpt/apps/client/scripts/data/exercises.js`

### 3. Current rule

- Developers edit canonical files first.
- Runtime files under `apps/client/scripts/data/` are manually synced copies for now.
- There is currently no build-step automation.
- There is currently no API-based sync.
- Phase 4 will automate this through a build step or API layer.

### 4. Sync mapping

```
clients/<slug>/client.config.js     ->  apps/client/scripts/data/client.js
clients/<slug>/plan.js              ->  apps/client/scripts/data/plan.js
packages/exercise-library/index.js  ->  apps/client/scripts/data/exercises.js
```

### 5. Protection statement

- `apps/client` remains the live deployed app. This checkpoint must not change live behaviour.
- `tools/rehab-client` remains the fallback. It is not modified here.
- `netlify.toml` remains untouched.

---

## Development

The client app (`apps/client/`) requires no build step.
Open `apps/client/index.html` directly in a browser or serve with:

```bash
cd mrpainpt/apps/client
python3 -m http.server 8080
```

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

## Development

The client app (`apps/client/`) requires no build step.
Open `apps/client/index.html` directly in a browser or serve with:

```bash
cd mrpainpt/apps/client
python3 -m http.server 8080
```

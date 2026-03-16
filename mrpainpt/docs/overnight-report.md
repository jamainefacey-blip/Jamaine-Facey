# Mr Pain PT — Overnight Work Report

**Date:** 2026-03-16
**Mode:** Non-destructive repository preparation (overnight safe mode)
**Branch:** claude/analyze-repo-structure-PGZu4

---

## Summary

All 8 tasks completed. 16 new files created. 0 existing files modified. 0 files deleted. 0 deployment changes. The live application at `mrpainpt/apps/client/` is untouched. `tools/rehab-client/` fallback is untouched. `netlify.toml` is untouched.

---

## Files created

### Task 1 — Client template system

| File | Purpose |
|------|---------|
| `mrpainpt/clients/_template/client.config.js` | Full template with every CLIENT_CONFIG field, EDIT markers, and inline documentation |
| `mrpainpt/clients/_template/plan.js` | REHAB_PLAN template with phases, weeks, sessions, and session ID convention documented |
| `mrpainpt/clients/_template/exercises.js` | Client-specific exercise override file with merge behaviour documented |
| `mrpainpt/clients/_template/client.meta.json` | Registry metadata including deployment, program, and coach fields |
| `mrpainpt/clients/_template/README.md` | Full how-to guide covering: adding a new client, program structure, exercise overrides, and white-label path |

### Task 2 — Exercise library

| File | Purpose |
|------|---------|
| `mrpainpt/packages/exercise-library/index.js` | 13 production-quality exercises across Phases 1–3, covering ACL/knee, hip, and lumbar spine |
| `mrpainpt/packages/exercise-library/schema.js` | Documentation-only schema for the exercise object. All fields documented with type, required/optional status, and purpose |
| `mrpainpt/packages/exercise-library/README.md` | Usage guide covering phase classification, override behaviour, draft promotion, and Phase 4 transition |

### Task 3 — Platform architecture

| File | Purpose |
|------|---------|
| `mrpainpt/docs/architecture/platform-overview.md` | Full 5-phase roadmap with folder structure, component responsibilities, data flow per phase, and scaling analysis |

### Task 4 — Coach portal

| File | Purpose |
|------|---------|
| `mrpainpt/docs/coach-portal-plan.md` | Full design for the coach portal including navigation structure, all screens (client list, client detail, progress, notes), data flow per phase, component breakdown, and Phase 3 build sequence |

### Task 5 — API layer

| File | Purpose |
|------|---------|
| `mrpainpt/docs/api-plan.md` | Full API endpoint design including all routes, request/response shapes, auth model, exercise merge algorithm, database schema (PostgreSQL/Supabase), and Phase 3→4 migration path |

### Task 6 — White-label deployment

| File | Purpose |
|------|---------|
| `mrpainpt/docs/whitelabel-deployment-plan.md` | `client.meta.json` full field specification, provisioning flow, URL structure, custom domain support, clinic tenant model, security considerations, and rollback/deprovisioning procedures |

### Task 7 — Exercise database drafts

| File | Exercises | Conditions |
|------|-----------|------------|
| `mrpainpt/packages/exercise-library/drafts/knee-acl.json` | 8 | Short arc quad, wall squat, step-down eccentric, hamstring curl, Nordic curl, single-leg squat, lateral step-up, bilateral box jump |
| `mrpainpt/packages/exercise-library/drafts/shoulder.json` | 8 | Pendulum, shoulder ER sidelying, IR with band, scapular retraction, wall slide, prone Y raise, prone T raise, band pull-apart |
| `mrpainpt/packages/exercise-library/drafts/hip-mobility.json` | 8 | Hip flexor stretch, 90/90 stretch, sidelying abduction, single-leg bridge, hip circumduction, hip CAR, lateral hip stretch, fire hydrant |
| `mrpainpt/packages/exercise-library/drafts/lower-back.json` | 8 | Pelvic tilt, McGill curl-up, McGill side plank, prone press-up, cat-cow, Pallof press, Superman/back extension, dead bug with band |

**Exercise counts:**

| Source | Count |
|--------|-------|
| `packages/exercise-library/index.js` (shared library, production) | 13 |
| `drafts/knee-acl.json` | 8 |
| `drafts/shoulder.json` | 8 |
| `drafts/hip-mobility.json` | 8 |
| `drafts/lower-back.json` | 8 |
| **Total** | **45** |

---

## Architecture decisions

### 1. All docs live under `mrpainpt/docs/`

Documentation is scoped to the platform folder rather than the repo root. This keeps the Netlify demo infrastructure's existing `README.md` and `MODULE_REGISTRY.md` untouched, and ensures all Mr Pain PT documentation is co-located with the product code.

### 2. Exercise library uses JS format (not JSON) for `index.js`

The shared library (`index.js`) uses JavaScript object notation to stay consistent with the existing `apps/client/scripts/data/exercises.js` format. This allows the file to be loaded directly as a `<script>` tag in Phase 3 without a build step. Draft files use JSON because they are not loaded at runtime.

### 3. Schema is documentation-only

`packages/exercise-library/schema.js` is a comment-only file. This was a deliberate choice to avoid runtime validation overhead in Phase 2 while still having a canonical reference for the exercise object shape. Runtime validation can be introduced in Phase 4 at the API layer using a library like Zod or a custom validator.

### 4. `client.meta.json` separates deployment from clinical data

`client.config.js` holds all clinically relevant data. `client.meta.json` holds deployment state, registry metadata, and Phase 5 provisioning data. Keeping them separate means the provisioning script in Phase 5 can read `client.meta.json` without needing to parse clinical data, and clinical data can be updated independently of deployment config.

### 5. Exercise overrides are designed for shallow merge only

The override system in `clients/<slug>/exercises.js` is designed as a shallow merge (one level). Nested array fields (e.g. `contraindications`, `muscleGroup`) are replaced entirely by the override, not concatenated. This is simpler to reason about and avoids partial-array merge edge cases. Documented clearly in both `schema.js` and `_template/exercises.js`.

### 6. Phase 3 coach portal will write to `clients/<slug>/client.config.js` directly

Rather than introducing a database in Phase 3, the coach portal will write coach notes directly to the `client.config.js` file, followed by a redeploy. This is a manual process and is acknowledged as temporary. This avoids introducing backend dependencies before the API architecture is defined. Phase 4 replaces this with a database write.

---

## Risks found

### Risk 1 — `clients/_template/.gitkeep` and `packages/exercise-library/.gitkeep` still present
**Severity:** Low
**Detail:** The Phase 1 commit added `.gitkeep` placeholders in these folders. The overnight tasks added real files alongside them but did not delete the `.gitkeep` files (per overnight safe mode rules — no deletions). Before committing Phase 2 work, these `.gitkeep` files should be removed: `clients/_template/.gitkeep` and `packages/exercise-library/.gitkeep`. This is not a functional issue — they are inert files — but it is noise.

### Risk 2 — `clients/sarah-thompson/` still only has `.gitkeep`
**Severity:** Low
**Detail:** The Phase 2 specification calls for populating `clients/sarah-thompson/` with the canonical data from `apps/client/scripts/data/`. This was not done overnight because the overnight instructions focused on the `_template/` and exercise library, not the sarah-thompson folder. This is the first item that should be completed in the Phase 2 commit sequence.

### Risk 3 — Draft exercises have not been clinically reviewed
**Severity:** Medium
**Detail:** The 32 draft exercises in `packages/exercise-library/drafts/` were written based on standard rehabilitation practice. They must not be assigned to a client or promoted to `index.js` without review by a qualified physiotherapist. The draft files include a `_comment` field making this explicit. A review process should be established before Phase 3 (coach portal) includes the ability to assign exercises to clients.

### Risk 4 — No validation on `client.meta.json` schema
**Severity:** Low
**Detail:** The provisioning script in Phase 5 will read `client.meta.json` files. If a field is missing or malformed, the provisioning will silently fail or produce incorrect output. The schema is documented but not enforced. Recommend adding a validation step to the provisioning script that validates each `client.meta.json` against the schema before attempting a deploy.

### Risk 5 — The API plan assumes Supabase as the database
**Severity:** Low
**Detail:** Supabase is recommended in `docs/api-plan.md` but the decision has not been confirmed. Supabase is the lowest-friction choice for the current stack (static site + Netlify Edge Functions), but other options (PlanetScale, Firebase, Turso) may be preferred. The API endpoint design is database-agnostic — only the database schema section assumes PostgreSQL/Supabase. This should be confirmed before Phase 4 begins.

### Risk 6 — The coach portal (Phase 3) reads from `clients/` files, not from `localStorage`
**Severity:** Medium
**Detail:** The Phase 3 coach portal reads session history from `localStorage`, which means it requires the same device as the client. This is a fundamental limitation of the pre-API architecture. It is acceptable for internal use with a small number of clients but must be clearly communicated to the coach. Document this limitation explicitly in the Phase 3 build.

---

## Recommended next steps (in priority order)

### Immediate — Before next PR
1. Remove `.gitkeep` from `clients/_template/` and `packages/exercise-library/` — they are now replaced by real files
2. Commit all overnight work as Phase 2 Checkpoint 1–4 per the Phase 2 spec

### Phase 2 completion
3. Populate `clients/sarah-thompson/` — copy and rename data from `apps/client/scripts/data/` into canonical location
4. Update `mrpainpt/README.md` with the data sync pattern section (as specified in Phase 2 spec)
5. Confirm exercise counts and review `packages/exercise-library/index.js` with Marcus (the coach) for clinical accuracy

### Phase 3 readiness
6. Confirm database choice (Supabase vs alternatives) before Phase 4 design is finalised
7. Have a qualified physiotherapist review the 32 draft exercises before any are promoted to `index.js`
8. Define the coach's device/access setup for Phase 3 (will they use the same device as clients, or do they need real persistence?)

### Ongoing
9. Establish a naming convention for coach IDs — the `client.meta.json → coach.coachId` field references a "coach registry" that does not yet exist. Define this before Phase 5.
10. Decide on custom domain strategy — `<slug>.mrpainpt.com` requires a Netlify team plan (for wildcard subdomains via Netlify). Verify this is available on the current account.

---

## Confirmation of safe mode compliance

| Rule | Status |
|------|--------|
| Did not modify `mrpainpt/apps/client/` | ✅ Confirmed |
| Did not modify `netlify.toml` | ✅ Confirmed |
| Did not modify `tools/rehab-client/` | ✅ Confirmed |
| Did not deploy anything | ✅ Confirmed |
| Did not merge any pull requests | ✅ Confirmed |
| Only created new files | ✅ Confirmed — 16 new files, 0 modifications, 0 deletions |
| All work is reversible | ✅ Confirmed — all changes are additive; `git rm -r mrpainpt/` fully reverses all overnight work |

---

*Report generated at end of overnight session. Stopping now.*

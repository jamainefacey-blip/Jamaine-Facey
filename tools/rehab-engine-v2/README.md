# Rehab Engine v2

A configurable, white-label rehabilitation coaching SPA built on the Pain System platform.

Upgrades the single-client `rehab-client` (v1) into a configurable engine supporting three program modes, a fully separated data model, visible exercise validation, and three example client datasets.

---

## Quick Start

1. Open `index.html` in a browser (or serve with any static file server)
2. The app loads with **Sarah Thompson** (full-program, 12-week ACL rehab) by default
3. To switch clients, edit the `<script>` block near the bottom of `index.html`

---

## Program Modes

| Mode | Use case | Example client |
|---|---|---|
| `single-instruction` | One-off session — post-op day 3, home exercises | James Chen |
| `short-block` | 2–8 week targeted block | Maria Santos (shoulder) |
| `full-program` | Multi-phase, 12-week program with milestones | Sarah Thompson (ACL) |

---

## Switching Clients

Open `index.html` and find the active client block near the bottom:

```html
<!-- Active client — uncomment ONE: -->
<script src="scripts/data/clients/sarah-thompson.js"></script>  <!-- full-program   -->
<!-- <script src="scripts/data/clients/james-chen.js"></script>     single-instruction -->
<!-- <script src="scripts/data/clients/maria-santos.js"></script>    short-block        -->
```

Comment out the current active line and uncomment the desired client. Reload the page.

---

## File Structure

```
index.html                  App shell + client selection
netlify.toml                Deploy config (no build step)
tool.config.json            Module metadata
styles/
  app.css                   Mobile-first stylesheet
scripts/
  engine/
    progress.js             Isolated localStorage layer (swap for backend here)
    validate.js             Exercise reference validator
  data/
    exercises.js            Shared exercise library (16 exercises: knee + shoulder)
    clients/
      sarah-thompson.js     full-program  — 12-week ACL
      james-chen.js         single-instruction — post-op day 3
      maria-santos.js       short-block — 4-week shoulder
  app.js                    Mode-aware SPA controller
docs/
  schema.md                 Full schema reference + how-to guide
```

---

## Creating a New Client

See `docs/schema.md` for the complete guide. Short version:

1. Copy a client file from `scripts/data/clients/`
2. Edit `CLIENT_CONFIG` (branding, identity, disclaimer)
3. Edit `PROGRAM` (mode, sessions, phases if needed)
4. Add any new exercises to `scripts/data/exercises.js`
5. Activate in `index.html`
6. Deploy

---

## Deployment (Netlify)

**Drag-and-drop:** Drag the `tools/rehab-engine-v2/` folder to [app.netlify.com](https://app.netlify.com).

**Git-connected:** Point Netlify to this repository with:
- Base directory: `tools/rehab-engine-v2`
- Publish directory: `.`
- Build command: *(leave empty)*

---

## Key v2 Improvements

- **Three program modes** — `single-instruction`, `short-block`, `full-program`
- **Flat session model** — sessions are no longer nested inside weeks; `weekNumber` and `phaseId` are fields on each session
- **Data-driven program length** — `PROGRAM_WEEKS` is computed from session data, never hard-coded
- **Isolated progress layer** — `ProgressStore` owns all localStorage reads/writes; replace its internals to use a backend
- **Visible validation errors** — missing exercise IDs show warning banners and error cards (no silent skips)
- **Enriched exercise schema** — `bodyRegion`, `movementType`, `imageSrc`, `videoSrc` fields; body-region filters in exercise library
- **Seed data separation** — pre-completed history uses `_seed` field, applied once on fresh devices only
- **Goals/milestones/notes** moved from `CLIENT_CONFIG` to `PROGRAM` — clean separation of branding from content

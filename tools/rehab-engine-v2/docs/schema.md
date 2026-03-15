# Rehab Engine v2 — Schema Reference

## What Changed from v1

| Area | v1 | v2 |
|---|---|---|
| Session storage | Nested inside `REHAB_PLAN.weeks[n].sessions` | Flat array in `PROGRAM.sessions[]` with `weekNumber` and `phaseId` fields |
| Progress state | Inline `completed`, `painRating`, `effortRating` booleans in session data | Isolated `ProgressStore` module (localStorage only, swappable) |
| Seed data | Static `completed: true` booleans in source | `_seed` field on sessions, applied once via `ProgressStore.seedFromProgram()` |
| Program length | Hard-coded `programWeeks: 12` in `CLIENT_CONFIG` | Derived: `Math.max(...sessions.map(s => s.weekNumber))` |
| Exercise schema | 12 fields | 16 fields: `bodyRegion`, `movementType`, `imageSrc`, `videoSrc` added |
| Missing exercises | Silent skip | `Validator` checks all session exercise IDs; visible error cards shown in UI |
| Program modes | Single mode (full-program implied) | Three explicit modes: `single-instruction`, `short-block`, `full-program` |
| Goals/milestones/notes | In `CLIENT_CONFIG` | In `PROGRAM` (separated from branding/identity) |
| Exercise library filters | Phase 1/2/3 only | Phase + body region dynamic filters |

---

## File Structure

```
tools/rehab-engine-v2/
├── index.html                          App shell (edit to switch active client)
├── netlify.toml                        Deploy config
├── tool.config.json                    Module registry metadata
├── styles/
│   └── app.css                         Mobile-first stylesheet
├── scripts/
│   ├── engine/
│   │   ├── progress.js                 Isolated localStorage progress layer
│   │   └── validate.js                 Exercise reference validator
│   ├── data/
│   │   ├── exercises.js                Shared exercise library (all clients)
│   │   └── clients/
│   │       ├── sarah-thompson.js       full-program — 12-week ACL rehab
│   │       ├── james-chen.js           single-instruction — post-op day 3
│   │       └── maria-santos.js         short-block — 4-week shoulder
│   └── app.js                          Engine SPA controller
└── docs/
    └── schema.md                        This file
```

---

## Data Schemas

### `CLIENT_CONFIG` (global)

Branding and identity only. Shared by all program modes.

```js
{
  appName:     string,   // displayed in header and browser tab
  accentColor: string,   // CSS hex — applied at runtime to CSS custom properties
  logoText:    string,   // 2-letter initials shown in header

  client: {
    firstName:       string,
    lastName:        string,
    age:             number,
    condition:       string,   // e.g. "Post-surgical knee rehabilitation"
    conditionDetail: string,   // more specific detail line
    startDate:       string,   // ISO 8601: "YYYY-MM-DD"
  },

  coach: {
    name:        string,
    credentials: string,
    contactNote: string,   // contact/portal instruction shown to client
  },

  disclaimer: string,   // full safety disclaimer text
}
```

---

### `PROGRAM` (global)

Program content. All program modes share this shape, with mode-specific fields.

```js
{
  id:          string,   // unique slug, e.g. "sarah-acl-rehab-2026"
  mode:        "single-instruction" | "short-block" | "full-program",
  currentWeek: number,   // manually maintained — update to advance the program

  // ── single-instruction only ──
  session?: Session,     // the one session to show

  // ── short-block and full-program ──
  sessions?: Session[],  // flat list of all sessions
  weeks?:    WeekMeta[], // week metadata (focus labels, phase assignment)

  // ── full-program only ──
  phases?: Phase[],

  // ── short-block and full-program ──
  goals?:       string[],
  milestones?:  Milestone[],
  coachNotes?:  CoachNote[],
}
```

---

### `Session`

```js
{
  id:         string,          // unique, e.g. "w1-s1" or "ms-w2-s1"
  label:      string,          // display name, e.g. "Session 1"
  day?:       string,          // display day, e.g. "Monday" or "Today"
  duration:   string,          // display string, e.g. "30 min"
  weekNumber?: number,          // used to group sessions in plan view
  phaseId?:   number,          // links to Phase.id (full-program only)
  exercises:  string[],         // ordered list of exercise IDs from EXERCISE_LIBRARY

  // Seed data — applied once to ProgressStore on first load (fresh device only)
  _seed?: {
    completed:    boolean,
    painRating?:  number | null,    // 0–10
    effortRating?: number | null,   // 1–5
  },
}
```

**Sessions can exist independently** — `weekNumber` and `phaseId` are optional.
For `single-instruction` mode, the single session has no week/phase fields.

---

### `WeekMeta`

```js
{
  weekNumber: number,
  focus:      string,    // e.g. "Early activation, swelling management"
  phaseId?:   number,    // required for full-program, omit for short-block
}
```

---

### `Phase` (full-program only)

```js
{
  id:    number,
  label: string,    // e.g. "Phase 1 — Activation & ROM"
  weeks: string,    // display range, e.g. "1–4"
  focus: string,    // one-sentence phase description
  color: string,    // CSS hex for phase color coding
}
```

---

### `Milestone`

```js
{
  week:     number,
  label:    string,
  achieved: boolean,   // update manually when milestone is reached
}
```

---

### `CoachNote`

```js
{
  date:  string,   // ISO 8601: "YYYY-MM-DD"
  title: string,
  body:  string,
}
```

---

### `Exercise` (in `EXERCISE_LIBRARY`)

```js
{
  id:           string,              // unique slug — must match references in Session.exercises
  name:         string,
  category:     string,              // e.g. "Activation", "Strength", "Range of Motion"
  bodyRegion:   string,              // NEW v2: "knee" | "hip" | "ankle" | "shoulder" | "full-body" | ...
  movementType: string,              // NEW v2: "isometric" | "isotonic" | "plyometric" | "stretch" | "balance"
  phase:        number | null,       // suggested phase; null if appropriate for all phases
  imageSrc:     string | null,       // NEW v2: URL to image; null = use placeholder
  videoSrc:     string | null,       // NEW v2: URL to video; null = no video
  imageAlt:     string,              // accessible description for image/placeholder
  description:  string,              // plain-language movement description
  sets:         number | null,
  reps:         number | string | null,   // can be a descriptive string
  hold:         string | null,       // e.g. "5 s" or "20–30 s"
  tempo:        string | null,
  rest:         string | null,
  cue:          string,              // coaching cue shown to client
  painNote:     string | null,       // safety guidance specific to this exercise
}
```

---

## Progress Layer

`ProgressStore` (in `scripts/engine/progress.js`) owns all read/write to localStorage.

### Storage key
`ps_rehab_v2_progress`

### Stored shape
```js
{
  [sessionId: string]: {
    completed:    boolean,
    painRating:   number | null,
    effortRating: number | null,
    exercises: {
      [exerciseId: string]: boolean
    }
  }
}
```

### Swapping to a backend
Replace the `_load()` and `_persist()` private functions inside `ProgressStore` with async fetch calls. The public API surface (`getSession`, `saveSession`, `toggleExercise`, `isSessionDone`, `seedFromProgram`) does not change.

---

## How to Create a New Client

1. Copy an existing client file from `scripts/data/clients/` to a new file.
2. Choose a `mode` matching your use case:
   - `single-instruction` — one session, no navigation
   - `short-block` — 2–8 weeks, week grouping, no phases
   - `full-program` — multi-phase, milestones, full progress tracking
3. Edit `CLIENT_CONFIG` — branding, client identity, coach info, disclaimer.
4. Edit `PROGRAM` — sessions, weeks, phases (if applicable), goals, milestones, notes.
5. Verify all exercise IDs in `sessions[].exercises` exist in `EXERCISE_LIBRARY`.
   Add new exercises to `scripts/data/exercises.js` if needed.
6. Open `index.html` and uncomment the new `<script>` tag, comment out the others.
7. Redeploy (drag-and-drop the folder to Netlify, or push to Git).

---

## How to Update a Program Without Rebuilding App Logic

- **Add a new session**: Add a new object to `PROGRAM.sessions[]` with a unique `id`, `weekNumber`, and exercise references. The UI rebuilds automatically.
- **Add a new week**: Add the session objects with the new `weekNumber`. Add a matching entry to `PROGRAM.weeks[]` for the focus label.
- **Change session exercises**: Update the `exercises: [...]` array in the session object. If a new exercise is needed, add it to `EXERCISE_LIBRARY` first.
- **Mark a milestone achieved**: Set `achieved: true` on the milestone in `PROGRAM.milestones[]`.
- **Add a coach note**: Prepend a new `{ date, title, body }` object to `PROGRAM.coachNotes[]`.
- **Advance the current week**: Update `PROGRAM.currentWeek`. This changes the "Current" badge in plan view and affects progress stats.
- **Program length**: `PROGRAM_WEEKS` is computed automatically from `Math.max(...sessions.map(s => s.weekNumber))`. No manual update needed when sessions are added/removed.

---

## Program Mode Differences

| Feature | `single-instruction` | `short-block` | `full-program` |
|---|---|---|---|
| Bottom nav | Hidden | Shown | Shown |
| Welcome "Enter" → | Session view | Dashboard | Dashboard |
| Plan view | Not shown | Flat week list | Phased week list |
| Phase dividers | No | No | Yes |
| Phase progress bars | No | No | Yes |
| Overview phases section | No | No | Yes |
| Milestones | No | Optional | Yes |
| Current week display | No | Yes | Yes |
| `PROGRAM.session` | Required | Not used | Not used |
| `PROGRAM.sessions[]` | Not used | Required | Required |
| `PROGRAM.phases[]` | Not used | Not used | Required |

# Mr Pain PT — Rehab Engine v2 Schema Reference

## What Changed from v1

| Area | v1 | v2 |
|---|---|---|
| Session storage | Nested inside `REHAB_PLAN.weeks[n].sessions` | Flat array in `PROGRAM.sessions[]` with `weekNumber` and `phaseId` fields |
| Progress state | Inline `completed`, `painRating`, `effortRating` booleans in session data | Isolated `ProgressStore` module (localStorage only, swappable) |
| Seed data | Static `completed: true` booleans in source | `_seed` field on sessions, applied once via `ProgressStore.seedFromProgram()` |
| Program length | Hard-coded `programWeeks: 12` in `CLIENT_CONFIG` | Derived: `Math.max(...sessions.map(s => s.weekNumber))` |
| Exercise schema | 12 fields | 18 fields: `bodyRegion`, `movementPattern`, `imageSrc`, `videoSrc`, `equipment`, `contraindications` added |
| Missing exercises | Silent skip | `Validator` checks all session exercise IDs; visible error cards shown in UI |
| Program modes | Single mode (full-program implied) | Three explicit modes: `one_off`, `multi_week`, `ongoing_coaching` |
| Goals/milestones/notes | In `CLIENT_CONFIG` | In `PROGRAM` (separated from branding/identity) |
| Outcomes tracking | None | `outcomes` object in `PROGRAM`: pain, ROM, strength, readiness |
| Reassessments | None | `assessments[]` array in `PROGRAM`: coach-recorded monthly checkpoints |
| Payment readiness | None | `access` object stub in `PROGRAM`: `type`, `status` |
| Progress display | Single progress ring | Mode-conditional: ring for `multi_week`, streak + pain trend for `ongoing_coaching` |
| Product branding | "Pain System Rehab" / "PS" | "Mr Pain PT" / "MP" |

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
│   │       ├── sarah-thompson.js       multi_week       — 12-week ACL rehab
│   │       ├── james-chen.js           one_off          — post-op day 3 single session
│   │       ├── maria-santos.js         multi_week       — 4-week shoulder block
│   │       └── david-park.js           ongoing_coaching — chronic knee pain coaching
│   └── app.js                          Engine SPA controller
└── docs/
    └── schema.md                        This file
```

---

## Program Modes

### `one_off`
A single prescribed session. No navigation, no history, no progress tracking. The client opens the app and sees exactly what to do today. Use for: post-op day-of instructions, one-off assessment homework.

### `multi_week`
A fixed block of 2–N weeks. Progress ring shows percentage completion. Optional phases divide the block into labelled stages. Milestones track key achievements. Use for: post-surgical rehab blocks, structured return-to-sport programs.

### `ongoing_coaching`
Open-ended coaching — no fixed end week. The coach adds sessions and weeks over time. No completion percentage ring (meaningless for open-ended programs). Progress is displayed as: week streak + average pain + session count + pain trend card. The plan view shows a rolling window of ±2 weeks around the current week. Use for: chronic pain management, performance coaching, maintenance programs.

---

## Mode Comparison

| Feature | `one_off` | `multi_week` | `ongoing_coaching` |
|---|---|---|---|
| Bottom nav | Hidden | Shown | Shown |
| Welcome "Enter" → | Session view | Dashboard | Dashboard |
| Progress display | Not shown | Progress ring (%) | Streak + pain trend |
| Plan view | Not shown | Full week list | Rolling window (curWk ±2) |
| Phase dividers | No | Optional | No |
| "Program complete" state | No | Yes | Never fires |
| Milestones | No | Optional | Optional |
| `PROGRAM.session` | Required | Not used | Not used |
| `PROGRAM.sessions[]` | Not used | Required | Required |
| `PROGRAM.phases[]` | Not used | Optional | Not used |
| `PROGRAM.outcomes` | null | Optional | Optional |
| `PROGRAM.assessments[]` | Empty | Optional | Recommended |

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
  mode:        "one_off" | "multi_week" | "ongoing_coaching",
  currentWeek: number,   // manually maintained — update to advance the program
                         // (omit for one_off mode)

  // ── Access stub (future payment/entitlement layer) ──
  access: {
    type:   "one_off_purchase" | "subscription" | "complimentary" | "trial",
    status: "active" | "expired" | "pending",
  },

  // ── one_off only ──
  session?: Session,     // the one session to show

  // ── multi_week and ongoing_coaching ──
  sessions?: Session[],  // flat list of all sessions
  weeks?:    WeekMeta[], // week metadata (focus labels, optional phase assignment)

  // ── multi_week only (optional) ──
  phases?: Phase[],

  // ── Outcome targets (multi_week and ongoing_coaching) ──
  outcomes?: {
    pain:     { baseline: number, target: number, unit: string },
    rom:      { baseline: string, target: string, unit: string },
    strength: { baseline: string, target: string, unit: string },
    readiness: { label: string, cleared: boolean },
  } | null,

  // ── Reassessment checkpoints (coach-recorded) ──
  assessments?: Assessment[],

  // ── multi_week and ongoing_coaching ──
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
  weekNumber?: number,         // used to group sessions in plan view
  phaseId?:   number,          // links to Phase.id (multi_week with phases only)
  exercises:  string[],        // ordered list of exercise IDs from EXERCISE_LIBRARY

  // Seed data — applied once to ProgressStore on first load (fresh device only)
  _seed?: {
    completed:     boolean,
    painRating?:   number | null,    // 0–10
    effortRating?: number | null,    // 1–5
  },
}
```

**Sessions can exist independently** — `weekNumber` and `phaseId` are optional.
For `one_off` mode, the single session has no week/phase fields.

---

### `WeekMeta`

```js
{
  weekNumber: number,
  focus:      string,    // e.g. "Early activation, swelling management"
  phaseId?:   number,    // required for multi_week with phases, omit otherwise
}
```

---

### `Phase` (multi_week with phases only)

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

### `Assessment`

Coach-recorded reassessment checkpoints. Stored in `PROGRAM.assessments[]`.

```js
{
  id:             string,          // unique slug, e.g. "assess-month-1"
  weekNumber:     number,          // week this assessment was recorded
  date:           string,          // ISO 8601: "YYYY-MM-DD"
  painRating:     number,          // NRS 0–10
  romMeasurement: string,          // e.g. "130°" or "Full"
  strengthRating: string,          // e.g. "4/5" or "4+/5"
  notes:          string,          // coach's written assessment notes
  cleared:        boolean,         // true = cleared to progress
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
  id:               string,              // unique slug — must match references in Session.exercises
  name:             string,
  category:         string,              // e.g. "Activation", "Strength", "Range of Motion"
  bodyRegion:       string,              // "knee" | "hip" | "ankle" | "shoulder" | "full-body" | ...
  movementPattern:  string,              // "isometric" | "isotonic" | "plyometric" | "stretch" | "balance"
  phase:            number | null,       // suggested phase; null if appropriate for all phases
  equipment:        string | null,       // e.g. "resistance band" | "step" | "wall" | null
  imageSrc:         string | null,       // URL to image; null = use placeholder
  videoSrc:         string | null,       // URL to video; null = no video
  imageAlt:         string,              // accessible description for image/placeholder
  description:      string,              // plain-language movement description
  sets:             number | null,
  reps:             number | string | null,   // can be a descriptive string, e.g. "10–15"
  hold:             string | null,       // e.g. "5 s" or "20–30 s"
  tempo:            string | null,
  rest:             string | null,
  cue:              string,              // coaching cue shown to client
  painNote:         string | null,       // safety guidance specific to this exercise
  contraindications: string[],           // conditions/situations where exercise should be avoided
}
```

**Note:** `movementPattern` was renamed from `movementType` in the v1 schema.

---

## Progress Layer

`ProgressStore` (in `scripts/engine/progress.js`) owns all read/write to localStorage.

### Storage keys

| Key | Contents |
|---|---|
| `ps_progress_v2` | Per-session completion state (replaces `ps_rehab_v2_progress`) |
| `ps_outcomes_v2` | Outcome checkpoint history |

### Session state shape
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

### Key methods

| Method | Description |
|---|---|
| `getSession(id)` | Returns stored state for a session (or default) |
| `saveSession(id, data)` | Persists session completion state |
| `toggleExercise(sessionId, exerciseId)` | Flips a single exercise checked state |
| `isSessionDone(id)` | Returns `true` if session is marked complete |
| `seedFromProgram(sessions)` | Applies `_seed` data once on fresh device |
| `getAllSessions()` | Returns full session state map |
| `clearSessions()` | Wipes session progress from storage |
| `getPainHistory(sessions)` | Returns ordered array of pain ratings from completed sessions |
| `getPainTrend(sessions)` | Returns `"improving"` / `"stable"` / `"worsening"` / `"insufficient"` |
| `getWeekStreak(sessions)` | Returns count of consecutive completed weeks from most recent backward |
| `saveOutcomeCheckpoint(checkpoint)` | Stores a client-recorded outcome checkpoint |
| `getOutcomeCheckpoints()` | Returns all stored outcome checkpoints |

### Pain trend algorithm
Compare the average pain rating of the first half of completed sessions vs. the last half:
- `delta ≤ −1` → `"improving"` (pain going down)
- `delta ≥ +1` → `"worsening"` (pain going up)
- Otherwise → `"stable"`
- Fewer than 3 rated sessions → `"insufficient"`

### Swapping to a backend
Replace the `_load()` and `_persist()` private functions inside `ProgressStore` with async fetch calls. The public API surface does not change.

---

## How to Create a New Client

1. Copy an existing client file from `scripts/data/clients/` to a new file.
2. Choose a `mode` matching your use case:
   - `one_off` — one session, no navigation
   - `multi_week` — 2–N weeks, week grouping, optional phases
   - `ongoing_coaching` — open-ended, streak + pain trend, rolling plan window
3. Edit `CLIENT_CONFIG` — branding, client identity, coach info, disclaimer.
4. Edit `PROGRAM` — sessions, weeks, phases (if applicable), outcomes, assessments, goals, milestones, notes.
5. Set `access.type` and `access.status` appropriately.
6. Verify all exercise IDs in `sessions[].exercises` exist in `EXERCISE_LIBRARY`.
   Add new exercises to `scripts/data/exercises.js` if needed.
7. Open `index.html` and uncomment the new `<script>` tag, comment out the others.
8. Redeploy (drag-and-drop the folder to Netlify, or push to Git).

---

## How to Update a Program Without Rebuilding App Logic

- **Add a new session**: Add a new object to `PROGRAM.sessions[]` with a unique `id`, `weekNumber`, and exercise references. The UI rebuilds automatically.
- **Add a new week**: Add the session objects with the new `weekNumber`. Add a matching entry to `PROGRAM.weeks[]` for the focus label. (For `ongoing_coaching`, this is how the coach extends the program.)
- **Change session exercises**: Update the `exercises: [...]` array in the session object. If a new exercise is needed, add it to `EXERCISE_LIBRARY` first.
- **Mark a milestone achieved**: Set `achieved: true` on the milestone in `PROGRAM.milestones[]`.
- **Add a coach note**: Prepend a new `{ date, title, body }` object to `PROGRAM.coachNotes[]`.
- **Record a reassessment**: Append a new `Assessment` object to `PROGRAM.assessments[]`.
- **Advance the current week**: Update `PROGRAM.currentWeek`. For `ongoing_coaching`, this also shifts the rolling plan window.
- **Clear a readiness flag**: Set `outcomes.readiness.cleared = true` when the client is cleared for their return-to-activity goal.
- **Program length**: `PROGRAM_WEEKS` is computed automatically from `Math.max(...sessions.map(s => s.weekNumber))`. No manual update needed when sessions are added.

---

## Example Clients

### Sarah Thompson — `multi_week` (12-week ACL rehab)
- `accentColor: "#0d9488"` (teal)
- 3 phases: Activation & ROM (wks 1–4), Strengthening (wks 5–8), Sport Prep (wks 9–12)
- `access.type: "complimentary"`
- Outcomes: pain 7→2, ROM 110°→Full, strength 3/5→5/5
- 2 assessment checkpoints (weeks 4 and 8)

### James Chen — `one_off` (post-op day 3)
- `accentColor: "#0891b2"` (cyan)
- Single session: ankle pumps, quad sets, heel slides
- `access.type: "one_off_purchase"`
- `outcomes: null`

### Maria Santos — `multi_week` (4-week shoulder, no phases)
- `accentColor: "#7c3aed"` (purple)
- 4 weeks, no phases (short block)
- `access.type: "one_off_purchase"`
- Outcomes: pain 5→1, ROM 120°→Full, strength 4/5→5/5

### David Park — `ongoing_coaching` (chronic knee pain)
- `accentColor: "#d97706"` (amber)
- No fixed end — 8 weeks defined, coach adds more
- `access.type: "subscription"`
- Outcomes: pain 6→2 (NRS); return to running 5 km goal
- 2 monthly assessment checkpoints
- Pain history shows declining trend (6→5→4→3) over weeks 1–7

---

## Gap Audit — What Is Missing

The following features are not yet implemented and represent the next build priorities:

| Gap | Priority | Notes |
|---|---|---|
| Authentication / access gating | High | `access` object is stubbed but no payment or login logic exists. Next step: wrap app init in an entitlement check. |
| Coach portal | High | Coaches cannot currently update `currentWeek`, add sessions, or record assessments via the UI — all edits are done in the JS file directly. |
| Client outcome entry | Medium | Clients cannot self-record pain ratings outside of session completion. Add a "How do you feel today?" quick-entry on the dashboard. |
| Push notifications / reminders | Medium | No reminder system. Session scheduling exists in data only. |
| Exercise video playback | Medium | `videoSrc` field exists on exercises but the modal renders a placeholder if null. Actual video hosting and player not implemented. |
| Exercise images | Medium | `imageSrc` field exists but all are null. Images use a CSS gradient placeholder. |
| Multi-client backend | Low | Each HTML file is a single-client app. No database or API layer. |
| Analytics / adherence reporting | Low | Adherence data exists in ProgressStore but no reporting UI or export. |
| Offline PWA | Low | Service worker not implemented. App works offline via browser cache but no formal PWA manifest or SW registration. |

---

## Recommended Next Build Order

1. **Exercise media** — Add real images and video URLs to exercises. The schema slots (`imageSrc`, `videoSrc`) are ready; just populate them and the UI will render them automatically.
2. **Client pain self-entry** — Add a dashboard quick-entry widget that saves to `ProgressStore.saveOutcomeCheckpoint()`. The storage method already exists.
3. **Access gating stub** — Add a `checkAccess()` function that reads `PROGRAM.access.status` and renders a paywall screen if not `"active"`. Drop-in for future Stripe/payment integration.
4. **Coach portal (admin view)** — Separate HTML page (`admin.html`) that reads the same client JS files and exposes controls: advance week, add session, record assessment, toggle milestone.
5. **PWA basics** — Add `manifest.json` and a minimal service worker so the app can be installed to home screen and cache assets for offline use.
6. **Multi-client routing** — Move client data to a JSON API (or static JSON files) and add a URL parameter (`?client=sarah-thompson`) to load the correct dataset. Removes the need to edit `index.html` to switch clients.

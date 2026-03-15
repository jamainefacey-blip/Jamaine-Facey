# Pain System — Rehab Client App

A mobile-first, white-label rehab coaching web app built as a reusable Pain System module.

---

## What this is

A self-contained single-page app (SPA) designed for PT / rehab clients. No login, no backend dependencies, no build step required. Open `index.html` in any browser to run.

**Demo client:** Sarah Thompson — Post-ACL reconstruction, Week 3 of a 12-week program.

---

## File structure

```
tools/rehab-client/
├── index.html                  App shell (loads all scripts)
├── tool.config.json            Pain System module config
├── handler.ts                  Netlify edge function entry point
│
├── styles/
│   └── app.css                 All styles (mobile-first, CSS custom properties)
│
└── scripts/
    ├── app.js                  SPA router + all view renderers + event logic
    └── data/
        ├── client.js           ← EDIT THIS to change the client
        ├── exercises.js        ← EDIT THIS to add / change exercises
        └── plan.js             ← EDIT THIS to change the rehab schedule
```

---

## Screens / sections

| Route | Section |
|-------|---------|
| `#dashboard` | Home — progress ring, next session, milestones |
| `#overview` | Client profile, goals, phase breakdown |
| `#plan` | 12-week weekly schedule, session rows |
| `#session/<id>` | Daily session — exercise cards, check-off, check-in |
| `#exercises` | Exercise library with phase filter |
| `#progress` | Progress bars, pain averages, session history table |
| `#notes` | Coach notes / messages |

---

## How to edit client details

### 1. Change the client

Open `scripts/data/client.js` and edit the `CLIENT_CONFIG` object:

```js
client: {
  firstName: "Sarah",       // ← change name
  lastName: "Thompson",
  age: 42,
  condition: "Post-surgical knee rehabilitation",
  conditionDetail: "ACL reconstruction — 8 weeks post-operative",
  startDate: "2026-01-27",
  programWeeks: 12,
  currentWeek: 3,           // ← update each week
},
coach: {
  name: "Marcus Reid",      // ← change coach name
  credentials: "DPT, CSCS",
  contactNote: "...",
},
```

### 2. Change the brand color

In `client.js`:
```js
accentColor: "#0d9488",   // ← any CSS hex color
logoText: "PS",           // ← 2-3 letter initials shown in header
appName: "Pain System Rehab",
```

### 3. Update program goals

Edit the `goals` array in `client.js`.

### 4. Add or edit exercises

Open `scripts/data/exercises.js`. Each exercise object looks like:

```js
{
  id: "quad-sets",          // unique slug — used in the plan
  phase: 1,                 // 1, 2, or 3
  category: "Activation",
  name: "Quad Sets",
  description: "...",
  sets: 3,
  reps: 15,
  hold: "5 s",              // or null
  tempo: "...",
  rest: "30 s between sets",
  cue: "...",               // coaching cue shown highlighted
  painNote: "...",          // safety note shown in amber
  imageAlt: "...",          // alt text for future image/video
}
```

### 5. Update the rehab schedule

Open `scripts/data/plan.js`. Each week has a `sessions` array. Each session has an `exercises` array of exercise IDs (matching `id` values in `exercises.js`):

```js
{
  id: "w3-s1",
  day: "Monday",
  label: "Session 1",
  duration: "30 min",
  completed: false,
  painRating: null,
  effortRating: null,
  exercises: ["quad-sets", "straight-leg-raise", "terminal-knee-ext"],
}
```

### 6. Add coach notes

Edit the `coachNotes` array in `client.js`:

```js
{
  date: "2026-03-17",
  title: "Week 4 check-in",
  body: "Your progress this week...",
}
```

---

## Session state & progress persistence

Session check-ins (pain rating, effort rating, exercise completions) are saved to `localStorage` under the key `ps_rehab_session_state`. Clearing browser data or switching devices resets progress. For multi-device sync, a backend would be needed in Phase 2.

---

## Running locally

No build step required. Open `index.html` directly in a browser, or serve with any static file server:

```bash
# Python
python3 -m http.server 8080

# Node (npx)
npx serve .
```

---

## White-labeling for a new client

1. Duplicate the `tools/rehab-client/` folder and rename it (e.g. `tools/rehab-john-doe/`).
2. Edit `scripts/data/client.js` with the new client's details, goals, and coach.
3. Edit `scripts/data/exercises.js` with their specific exercise program.
4. Edit `scripts/data/plan.js` with their weekly schedule.
5. Update `tool.config.json` with the new tool name and endpoint.
6. Register the new tool in the root `MODULE_REGISTRY.md`.

---

## Phase 2 — What to add next

| Priority | Feature |
|----------|---------|
| High | Real image / video support for each exercise card |
| High | PDF export of the session summary / weekly report |
| High | Multi-client support with a simple login or PIN |
| Medium | Backend persistence (Supabase / PlanetScale) to replace localStorage |
| Medium | Push notification reminders for session days |
| Medium | Coach dashboard — view all client progress in one place |
| Medium | Automated program progression (unlock Phase 2 after Phase 1 complete) |
| Low | Dark mode theme |
| Low | Animated exercise demonstrations (GIF / short video) |
| Low | Two-way messaging between client and coach |

---

## Safety

This app does not provide medical advice, diagnosis, or treatment. See the disclaimer rendered at the bottom of every screen. Edit `CLIENT_CONFIG.disclaimer` in `client.js` to update the text (do not remove the disclaimer entirely).

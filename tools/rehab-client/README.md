# Pain System — Rehab Client App

**Version:** 1.1 (MVP Complete)
**Status:** Client-test ready — open `index.html` in any browser to run

A mobile-first, zero-dependency rehab coaching web app built as a reusable Pain System sandbox module.

---

## Quick start — how to open the app

### Option 1 — Direct file (simplest)
```
Open tools/rehab-client/index.html in Chrome, Safari, or Firefox.
```
Works without a server. All data is local. No internet required.

### Option 2 — Local static server (recommended for testing)
```bash
# From the tools/rehab-client/ directory:
python3 -m http.server 8080
# Then open: http://localhost:8080

# Or with Node:
npx serve .
# Then open the URL shown in the terminal
```

### Option 3 — Netlify (deployment)
Deploy the `tools/rehab-client/` folder as a static site. No build step required. Point the publish directory to `tools/rehab-client`.

---

## What is MVP complete

The following is fully built and testable end-to-end:

| Feature | Status |
|---------|--------|
| Welcome / landing screen | ✅ |
| Dashboard with progress ring, stats, milestones | ✅ |
| Client overview (profile, goals, coach, phases) | ✅ |
| 12-week plan with week cards and session rows | ✅ |
| Session view with exercise cards | ✅ |
| Exercise check-off (tap circle to mark done) | ✅ |
| Session unlock when all exercises complete | ✅ |
| Session check-in: pain scale (0–10) + effort scale (1–5) | ✅ |
| Session state saved to localStorage | ✅ |
| Progress reflected after check-in (dashboard, progress page) | ✅ |
| Exercise library with phase filter | ✅ |
| Exercise detail modal (sets/reps/tempo/cue/pain note) | ✅ |
| Progress page (phase bars, history table) | ✅ |
| Coach notes | ✅ |
| Safety disclaimer on every screen | ✅ |
| Mobile-first layout with bottom navigation | ✅ |
| Tablet / desktop responsive layout | ✅ |
| Returning user skips welcome screen (localStorage flag) | ✅ |

---

## How to edit client details

### 1. Change the client — `scripts/data/client.js`

```js
client: {
  firstName: "Sarah",       // ← client first name
  lastName:  "Thompson",    // ← client last name
  age: 42,
  condition: "Post-surgical knee rehabilitation",
  conditionDetail: "ACL reconstruction — 8 weeks post-operative",
  startDate: "2026-01-27",  // ← ISO date (YYYY-MM-DD)
  programWeeks: 12,
  currentWeek: 3,           // ← update each week
},
```

### 2. Change branding — `scripts/data/client.js`

```js
appName:     "Pain System Rehab",   // ← shown in header
accentColor: "#0d9488",             // ← any CSS hex color; theme updates automatically
logoText:    "PS",                  // ← 2-3 letter initials shown in header
```

### 3. Change coach details — `scripts/data/client.js`

```js
coach: {
  name:        "Marcus Reid",
  credentials: "DPT, CSCS",
  contactNote: "Message your coach through the clinic portal...",
},
```

### 4. Update goals — `scripts/data/client.js`

```js
goals: [
  "First goal",
  "Second goal",
  // ...
],
```

### 5. Update milestones — `scripts/data/client.js`

```js
milestones: [
  { week: 2,  label: "Milestone description", achieved: true  },
  { week: 6,  label: "Another milestone",     achieved: false },
],
```

### 6. Add or edit coach notes — `scripts/data/client.js`

```js
coachNotes: [
  {
    date:  "2026-03-15",       // ISO date
    title: "Week 4 check-in",
    body:  "Note text here...",
  },
],
```

---

## How to edit exercises

Open `scripts/data/exercises.js`. Each exercise is an object:

```js
{
  id:          "quad-sets",      // unique slug — referenced in the plan
  phase:       1,                // 1, 2, or 3
  category:    "Activation",     // shown as a badge
  name:        "Quad Sets",      // display name
  description: "...",            // shown in card and library
  sets:        3,                // or null
  reps:        15,               // or null
  hold:        "5 s",            // or null
  tempo:       "Squeeze–hold–release",
  rest:        "30 s between sets",
  cue:         "...",            // coaching cue — highlighted in green
  painNote:    "...",            // safety note — highlighted in amber; or null
  imageAlt:    "...",            // alt text for future image
}
```

Add new exercises to the array and reference them by `id` in `plan.js`.

---

## How to edit the weekly plan

Open `scripts/data/plan.js`. Each week has a `sessions` array:

```js
{
  id:           "w3-s2",         // unique ID — used by session state
  day:          "Wednesday",
  label:        "Session 2",
  duration:     "30 min",
  completed:    false,           // set true for pre-populated historical data
  painRating:   null,            // pre-populated if completed: true; else null
  effortRating: null,
  exercises:    ["exercise-id-1", "exercise-id-2"],   // ← IDs from exercises.js
}
```

To add a week:
1. Add a new object to the `weeks` array in `REHAB_PLAN`
2. Reference valid exercise IDs from `exercises.js`
3. Update `CLIENT_CONFIG.client.programWeeks` if total weeks changes

---

## Session state and progress data

Session check-ins (pain rating, effort rating, exercise completions) are stored in `localStorage` under the key `ps_rehab_session_state`.

To reset progress during testing: open browser DevTools → Application → Local Storage → delete `ps_rehab_session_state`.

To pre-populate historical session data (for a demo): set `completed: true`, `painRating: <number>`, `effortRating: <number>` directly in `plan.js` sessions.

---

## White-labeling for a new client

1. Duplicate this folder: `cp -r tools/rehab-client tools/rehab-[client-slug]`
2. Edit `scripts/data/client.js` — name, condition, goals, coach, branding
3. Edit `scripts/data/exercises.js` — their specific exercises
4. Edit `scripts/data/plan.js` — their weekly schedule
5. Update `tool.config.json` — new tool name and endpoint
6. Register in root `MODULE_REGISTRY.md`

---

## File structure

```
tools/rehab-client/
├── index.html                  App shell (loads all scripts and styles)
├── tool.config.json            Pain System module metadata
├── handler.ts                  Netlify edge function entry point
├── README.md                   This file
│
├── styles/
│   └── app.css                 All styles — mobile-first, CSS custom properties
│
└── scripts/
    ├── app.js                  SPA router + all view renderers + event logic
    └── data/
        ├── client.js           ← EDIT to change client / white-label
        ├── exercises.js        ← EDIT to add/change exercises
        └── plan.js             ← EDIT to change the weekly schedule
```

---

## Sandbox preview path

When running locally at `http://localhost:8080`:

| Route | Screen |
|-------|--------|
| `http://localhost:8080/` | Welcome screen (first visit) |
| `http://localhost:8080/#dashboard` | Dashboard |
| `http://localhost:8080/#overview` | Client profile |
| `http://localhost:8080/#plan` | Weekly plan |
| `http://localhost:8080/#session/w3-s2` | A specific session (Week 3, Session 2) |
| `http://localhost:8080/#exercises` | Exercise library |
| `http://localhost:8080/#progress` | Progress tracker |
| `http://localhost:8080/#notes` | Coach notes |

---

## Phase 2 — What to add next

| Priority | Feature |
|----------|---------|
| High | Real exercise images / short video loops per exercise card |
| High | PDF export of session summary or weekly progress report |
| High | Coach-assigned PIN or simple login for multi-client use |
| Medium | Backend persistence (Supabase / PlanetScale / Firebase) |
| Medium | Push notification / reminder for session days |
| Medium | Coach dashboard — view all client progress |
| Medium | Automated program progression (auto-unlock phases on completion criteria) |
| Medium | Offline PWA support (service worker + manifest) |
| Low | Dark mode |
| Low | Animated exercise demonstration GIFs |
| Low | Two-way coach–client messaging |
| Low | Multi-language support |

---

## Safety and compliance

A safety disclaimer is embedded at the bottom of every screen. It states:

- This is **not medical advice**
- Always follow your licensed healthcare provider's guidance
- **Stop immediately** if you experience unusual pain, swelling, numbness
- This supports **coach-led rehab guidance only**
- No diagnosis or cure claims are made
- No specific recovery outcome is guaranteed

To update the disclaimer text, edit `CLIENT_CONFIG.disclaimer` in `scripts/data/client.js`.
**Do not remove the disclaimer entirely.**

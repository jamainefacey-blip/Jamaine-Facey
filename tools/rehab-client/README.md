# Pain System — Rehab Client App

**Version:** 1.2 (Deploy-ready)
**Status:** Deploy-ready — `netlify.toml` configured, no build step required

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

### Option 3 — Netlify (see full guide below)
A `netlify.toml` is included. See the **Deployment** section for exact steps.

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
├── netlify.toml                Netlify deploy config (publish, redirects, headers)
├── tool.config.json            Pain System module metadata
├── handler.ts                  Edge function stub (inactive until promoted)
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

## Deployment

### Overview

- **No build step.** Pure static HTML, CSS, and JS — Netlify serves it as-is.
- **Hash-based routing.** All navigation uses URL hashes (`#dashboard`, `#plan`, etc.). The browser handles these entirely client-side; the server never needs to resolve them.
- **`netlify.toml` is included** at `tools/rehab-client/netlify.toml` with `publish = "."`, SPA fallback redirect, security headers, and asset caching pre-configured.

---

### Option A — Drag-and-drop (fastest, no Git required)

1. Zip the `tools/rehab-client/` folder:
   ```bash
   cd tools && zip -r rehab-client.zip rehab-client/
   ```
2. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
3. Drag `rehab-client.zip` onto the page
4. Netlify assigns a live URL instantly (e.g. `https://random-name-123.netlify.app`)
5. To use a custom domain, go to **Domain settings** in the Netlify UI

---

### Option B — Connect Git repo (recommended for ongoing updates)

1. Push this branch to your remote (already done)
2. Log in to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
3. Connect to your Git provider and select this repository
4. In the build settings, set:

   | Setting | Value |
   |---------|-------|
   | **Base directory** | `tools/rehab-client` |
   | **Build command** | *(leave blank)* |
   | **Publish directory** | `.` |

5. Click **Deploy site**
6. Netlify reads `netlify.toml` automatically from the base directory

Every push to the branch will trigger a new deploy automatically.

---

### Option C — Full-repo deploy (if the whole repo is the Netlify site)

1. Copy `tools/rehab-client/netlify.toml` to the **repository root**
2. Change the publish line:
   ```toml
   [build]
     publish = "tools/rehab-client"
   ```
3. Connect the repo to Netlify with no base directory set

---

### Netlify configuration summary

```toml
[build]
  publish = "."          # tools/rehab-client/ is the site root

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200           # SPA fallback (hash routing works without this)

[[headers]]              # Security headers on all routes
  for = "/*"
  ...

[[headers]]              # 24-hour cache on /styles/* and /scripts/*
  for = "/styles/*"
  ...
```

Full config: [`netlify.toml`](./netlify.toml)

---

### How to preview the deployed URL

After deploying via Option A or B, Netlify provides:

- **Production URL:** `https://<your-site-name>.netlify.app`
- **Branch preview URL:** `https://<branch-name>--<your-site-name>.netlify.app`

All hash routes work on the live URL exactly as they do locally:

| Live URL | Screen |
|----------|--------|
| `https://<site>.netlify.app/` | Welcome screen (first visit) |
| `https://<site>.netlify.app/#dashboard` | Dashboard |
| `https://<site>.netlify.app/#plan` | Weekly plan |
| `https://<site>.netlify.app/#session/w3-s2` | Session view |
| `https://<site>.netlify.app/#exercises` | Exercise library |
| `https://<site>.netlify.app/#progress` | Progress tracker |
| `https://<site>.netlify.app/#notes` | Coach notes |

---

### handler.ts and edge functions

`handler.ts` is currently a **stub** — it does nothing in static hosting. It is not in a `netlify/edge-functions/` directory, so Netlify will not execute it. It is simply a text file in the publish directory that is never served to browsers.

To activate it as a real Netlify Edge Function in Phase 2:
1. Create `tools/rehab-client/netlify/edge-functions/rehab-api.ts`
2. Move the handler logic there
3. Add to `netlify.toml`:
   ```toml
   [[edge_functions]]
     path     = "/api/rehab"
     function = "rehab-api"
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

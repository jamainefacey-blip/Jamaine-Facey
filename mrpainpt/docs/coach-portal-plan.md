# Mr Pain PT — Coach Portal Architecture Plan

**Phase:** 3
**Status:** Design only — not implemented
**Location (when built):** `mrpainpt/apps/coach/`

---

## Purpose

The coach portal is the PT-facing interface. It gives the coach visibility into every client's rehabilitation progress, the ability to publish notes and updates, and eventually the ability to edit programs and assign exercises.

It is a separate web app from the client app. It runs alongside the client app but is never seen by the client.

---

## Access model

**Phase 3:** Access by URL only. Internal tool — shared with the coach directly. No public exposure.
**Phase 4:** Full authentication. Coach login via email/password or magic link. Each coach sees only their own clients.
**Phase 5+:** Multi-coach support. Clinic admin can see all coaches and all clients within the clinic.

---

## Technology

Same technology as the client app — vanilla HTML/CSS/JS, no framework, no build step. Static SPA with hash-based routing.

This keeps the stack consistent and allows deployment without CI/CD infrastructure. Once a build step is introduced in Phase 4 (for the API integration), the coach portal can adopt the same build process.

---

## Navigation structure

The coach portal has three primary areas:

```
Coach Portal
│
├── /coach/#clients        Client list — overview of all clients
│
├── /coach/#client/:id     Client detail — everything about one client
│   ├── Profile tab
│   ├── Plan tab
│   ├── Progress tab
│   └── Notes tab
│
└── /coach/#library        Exercise library — browse, search, and assign
```

---

## Screen designs

### 1. Client List (Dashboard)

**Purpose:** Give the coach an immediate overview of all active clients and flag anyone who needs attention.

**Layout:** Card grid (one card per client). On mobile: stacked cards. On tablet/desktop: two-column grid.

**Each client card shows:**
- Client name and condition
- Program week (current / total)
- Phase badge
- Days since last session
- Last pain rating (with colour coding: green ≤ 3, amber 4–6, red ≥ 7)
- Quick link to client detail

**Sorting options:**
- Last active (default)
- Alphabetical
- Pain score (highest first — for clinical priority)
- Program week

**Filter options:**
- Status (active, paused, completed)
- Phase (1, 2, 3)

---

### 2. Client Detail

**Purpose:** Full view of one client's program, history, and clinical notes.

#### Tab — Profile

Displays information from `client.config.js`:
- Client name, age, condition detail
- Program start date, current week, total weeks
- Program goals (checklist — editable in Phase 4)
- Milestones (achieved / pending)
- Coach info
- Branding preview (accent colour, app name)

#### Tab — Plan

Displays the full 12-week session schedule from `plan.js`:
- Week cards expanded to show all sessions
- Each session shows: day, duration, exercise list, completion status
- Completed sessions show pain rating (0–10) and effort rating (1–5)
- Visual indicators: upcoming, completed (green tick), missed (grey), overdue (amber)

**Phase 4 addition:** Coach can drag-reorder sessions, add or remove exercises, adjust week content.

#### Tab — Progress

Visual progress summary:
- Overall program completion percentage
- Phase completion bars (Phase 1: X%, Phase 2: X%, Phase 3: X%)
- Weekly activity chart (sessions completed per week, bar chart)
- Pain score trend (line chart over completed sessions)
- Effort rating trend
- Session history table: date, session ID, pain, effort, exercises completed

#### Tab — Notes

Chronological list of coach notes published to this client.

**Each note displays:**
- Date
- Title
- Full note body

**Add note form (Phase 3 — writes to `client.config.js`, Phase 4 — writes to database):**
- Date (pre-filled with today)
- Title (short)
- Body (multi-line text area)
- Publish button

Notes are displayed to the client in the client app's Coach Notes screen.

---

### 3. Exercise Library (Coach View)

**Purpose:** Browse the shared exercise library, search by muscle group or phase, and plan assignments.

**Features:**
- Search by name, muscle group, category, phase
- Filter by injury stage, equipment required
- View full exercise detail (same fields as client app but with clinical detail visible — contraindications, progression notes)
- In Phase 4: assign exercises to a client session directly from this view

---

## Data flow by phase

### Phase 3 — Static read-only

The coach portal reads directly from the `clients/` folder and `packages/exercise-library/`:

```
clients/<slug>/client.config.js  →  Profile, goals, milestones, coach notes
clients/<slug>/plan.js           →  Session schedule
packages/exercise-library/index.js → Exercise library
```

Session state (completions, pain scores) is read from `localStorage` — meaning the coach portal must be opened on the same device as the client app, or session data will be absent.

This is a known limitation of Phase 3 and is resolved by Phase 4.

Coach note writing in Phase 3:
- Note is written directly to `clients/<slug>/client.config.js` → `coachNotes[]`
- A manual redeploy of `apps/client/` is required for the note to appear in the client app
- This is acceptable for Phase 3 given the small client volume

---

### Phase 4 — API-connected

```
Coach portal  ←→  /api/client/:id         (read/write client config)
              ←→  /api/client/:id/sessions (read session history)
              ←→  /api/client/:id/notes    (read/write coach notes)
              ←→  /api/client/:id/progress (read calculated progress)
              ←→  /api/exercises           (read exercise library)
```

Coach notes published via the portal appear in the client app in real time — no redeploy needed.

---

## Component breakdown

```
apps/coach/
├── index.html                  Coach portal shell
├── netlify.toml                Deployment config
├── styles/
│   └── coach.css               Coach portal styles (imports ui-tokens)
└── scripts/
    ├── coach-app.js            SPA router + auth gate
    └── views/
        ├── client-list.js      Renders the client list dashboard
        ├── client-detail.js    Renders the 4-tab client detail view
        ├── client-profile.js   Profile tab content
        ├── client-plan.js      Plan tab content
        ├── client-progress.js  Progress tab with charts
        ├── client-notes.js     Notes tab + note composer
        └── exercise-library.js Coach-side exercise browser
```

---

## Shared packages used

| Package | Usage |
|---------|-------|
| `packages/exercise-library/` | Render the exercise library view |
| `packages/progress-engine/` | Calculate progress stats for the progress tab |
| `packages/auth/` | Auth gate — coach login (Phase 4) |
| `packages/ui-tokens/` | CSS design tokens — coach portal uses the same base theme |

---

## Clinical priority features

The following features are specifically designed for clinical safety and quality:

1. **Pain score flagging** — clients with pain ≥ 7/10 on the last session are shown with a red indicator on the client list. The coach should review and respond before the next session.

2. **Session overdue alerts** — if a client has not completed a scheduled session within 48 hours of the scheduled day, an amber indicator appears on their client card.

3. **Missed session tracking** — the plan tab distinguishes between upcoming sessions and sessions that were scheduled but not completed. Allows the coach to identify patterns.

4. **Coach note history** — all notes are stored with timestamps and never deleted. This creates a clinical record of coach-client interactions.

5. **Disclaimer propagation** — the coach portal surfaces the disclaimer text from `client.config.js` when publishing notes, reminding the coach that program guidance is not a substitute for in-person clinical assessment.

---

## Phase 3 build sequence

1. Create `apps/coach/index.html` and `styles/coach.css` — app shell with matching branding to client app
2. Build `scripts/views/client-list.js` — reads from `clients/` and renders client cards
3. Build `scripts/views/client-detail.js` — tab container with routing
4. Build `scripts/views/client-progress.js` — reads from localStorage (Phase 3), renders charts
5. Build `scripts/views/client-notes.js` — note list + note composer writing to `client.config.js`
6. Add route to `apps/coach/index.html` — separate deploy from client app
7. Verify locally before deploy

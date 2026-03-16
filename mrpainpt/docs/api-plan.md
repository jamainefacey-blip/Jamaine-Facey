# Mr Pain PT — API Layer Design Plan

**Phase:** 4
**Status:** Design only — not implemented
**Location (when built):** `mrpainpt/api/`
**Runtime:** Netlify Edge Functions (Deno-compatible TypeScript)

---

## Purpose

The API layer eliminates the manual sync between canonical data sources (`clients/`, `packages/`) and browser-facing deployment artifacts (`apps/client/scripts/data/`). It also enables real-time data persistence, multi-device access, and coach-side write operations.

The API is intentionally thin. It does not contain business logic beyond data merging and access control. All data transformation (progress calculation, milestone evaluation) lives in `packages/progress-engine/`.

---

## Technology choices

| Concern | Choice | Rationale |
|---------|--------|-----------|
| API runtime | Netlify Edge Functions | Already the platform's execution environment. No new infrastructure. |
| Language | TypeScript | Already used in edge functions. Type safety for clinical data. |
| Database | Supabase (PostgreSQL) | Low friction with static/edge stack. Hosted Postgres + REST API + auth built in. Row-level security for multi-client isolation. |
| Auth | Supabase Auth | Magic link for clients, email/password for coaches. |
| Hosting | Netlify | No change to deployment model. |

---

## Endpoint design

All endpoints are prefixed with `/api/`. All responses are JSON.

Authentication is required for all endpoints from Phase 4 onwards (JWT in Authorization header or session cookie).

---

### Authentication endpoints

#### `POST /api/auth/client`

Verify a client PIN and return a session token.

**Request:**
```json
{ "clientId": "sarah-thompson", "pin": "1234" }
```

**Response (success):**
```json
{ "token": "<jwt>", "clientId": "sarah-thompson", "expires": "ISO-8601" }
```

**Response (failure):**
```json
{ "error": "Invalid PIN", "code": 401 }
```

**Notes:**
- PIN is hashed (bcrypt) before storage. Never stored or logged in plaintext.
- Token expiry: 7 days, renewable on activity.
- Phase 3 bridge: if no PIN is configured, token is issued without PIN (URL-access model).

---

#### `POST /api/auth/coach`

Coach login. Email + password or magic link.

**Request:**
```json
{ "email": "marcus@example.com", "password": "..." }
```

**Response:** Same shape as client auth.

**Notes:**
- Coaches have elevated permissions: can read all their clients, write notes and program changes.
- A coach can only access clients assigned to them. Assignment is stored in the database.

---

### Client endpoints

#### `GET /api/client`

Returns the authenticated client's full config.

**Response:**
```json
{
  "clientId":   "sarah-thompson",
  "config":     { ...CLIENT_CONFIG fields },
  "meta":       { ...client.meta.json fields }
}
```

---

#### `GET /api/client/:id` (coach only)

Returns a specific client's config. Requires coach-level token. Coach must be assigned to this client.

---

#### `PUT /api/client/:id` (coach only)

Update a client's config (branding, goals, milestones, current week).

**Request:** Partial CLIENT_CONFIG object — only fields being changed.

**Notes:**
- Schema validation is applied before write.
- A full audit log entry is created on every write.
- Does not accept changes to the disclaimer field without an explicit `disclaimerOverride: true` flag.

---

#### `GET /api/clients` (coach only)

Returns all clients assigned to the authenticated coach, with summary data for the client list view.

**Response:**
```json
{
  "clients": [
    {
      "clientId":       "sarah-thompson",
      "displayName":    "Sarah Thompson",
      "condition":      "ACL Reconstruction",
      "currentWeek":    3,
      "totalWeeks":     12,
      "currentPhase":   1,
      "lastSessionDate": "2026-03-12",
      "lastPainRating": 2,
      "status":         "active"
    }
  ]
}
```

---

### Plan endpoints

#### `GET /api/plan`

Returns the authenticated client's full program plan.

**Response:**
```json
{
  "clientId":   "sarah-thompson",
  "programName": "12-Week ACL Rehabilitation",
  "phases":     [...],
  "weeks":      [...]
}
```

---

#### `GET /api/plan/:id` (coach only)

Returns a specific client's plan.

---

#### `PUT /api/plan/:id` (coach only)

Update a client's plan. Supports partial updates (add a week, modify a session's exercise list).

---

### Session endpoints

#### `GET /api/client/:id/sessions`

Returns all session state for the client.

**Response:**
```json
{
  "sessions": {
    "w1-s1": { "completed": true,  "painRating": 2, "effortRating": 3, "exercisesDone": ["quad-sets","heel-slides"] },
    "w1-s2": { "completed": false, "painRating": null, "effortRating": null, "exercisesDone": [] }
  }
}
```

---

#### `POST /api/client/:id/sessions/:sessionId`

Record a session check-in.

**Request:**
```json
{
  "completed":      true,
  "painRating":     3,
  "effortRating":   4,
  "exercisesDone":  ["quad-sets", "heel-slides", "ankle-pumps"],
  "completedAt":    "2026-03-14T10:32:00Z"
}
```

**Response:**
```json
{ "ok": true, "sessionId": "w3-s1", "updatedAt": "2026-03-14T10:32:00Z" }
```

**Notes:**
- A client can only write to sessions in their own plan.
- Session IDs are validated against the plan — unknown session IDs are rejected.
- Pain ratings outside 0–10 and effort ratings outside 1–5 are rejected.

---

### Progress endpoints

#### `GET /api/client/:id/progress`

Returns calculated progress metrics. Uses `packages/progress-engine/` logic.

**Response:**
```json
{
  "overallPercent":   33,
  "currentPhase":     1,
  "phaseProgress": {
    "1": { "completed": 4, "total": 12, "percent": 33 },
    "2": { "completed": 0, "total": 12, "percent": 0  },
    "3": { "completed": 0, "total": 12, "percent": 0  }
  },
  "milestones": [
    { "week": 2,  "label": "Full weight-bearing without crutches", "achieved": true  },
    { "week": 4,  "label": "0–90° active range of motion",         "achieved": true  },
    { "week": 6,  "label": "Single-leg stance 30 s",               "achieved": false }
  ],
  "sessionHistory": [
    { "sessionId": "w1-s1", "completedAt": "2026-01-29", "painRating": 3, "effortRating": 4 },
    { "sessionId": "w1-s2", "completedAt": "2026-01-31", "painRating": 2, "effortRating": 3 }
  ],
  "averagePainRating":   2.3,
  "averageEffortRating": 3.6,
  "streakDays":          5
}
```

---

### Exercise endpoints

#### `GET /api/exercises`

Returns the merged exercise list for the authenticated client.

**Merge process:**
1. Load all exercises from `packages/exercise-library/index.js` (the base library)
2. Load all entries from `clients/<clientId>/exercises.js` (client overrides)
3. Merge: `final[id] = { ...baseLibrary[id], ...clientOverrides[id] }`
4. Return the merged array

**Query parameters:**
- `?phase=1` — filter by phase
- `?category=Strengthening` — filter by category
- `?muscleGroup=quadriceps` — filter by muscle group
- `?ids=quad-sets,heel-slides` — fetch specific exercises by ID (used by the session view)

**Response:**
```json
{
  "exercises": [ ...exercise objects... ],
  "source":    { "library": 13, "overrides": 2, "merged": 13 }
}
```

---

#### `GET /api/exercises/:id`

Returns a single exercise, merged with any client-specific override.

---

### Notes endpoints

#### `GET /api/client/:id/notes`

Returns all coach notes for the client, in reverse-chronological order.

**Response:**
```json
{
  "notes": [
    { "id": "note-abc123", "date": "2026-03-10", "title": "Week 3 check-in", "body": "..." },
    { "id": "note-def456", "date": "2026-03-03", "title": "Week 2 progress",  "body": "..." }
  ]
}
```

---

#### `POST /api/client/:id/notes` (coach only)

Publish a new coach note. Immediately visible in the client app — no redeploy required.

**Request:**
```json
{ "date": "2026-03-14", "title": "Week 4 update", "body": "..." }
```

**Response:**
```json
{ "ok": true, "noteId": "note-ghi789", "publishedAt": "2026-03-14T09:15:00Z" }
```

---

#### `PUT /api/client/:id/notes/:noteId` (coach only)

Edit an existing note.

#### `DELETE /api/client/:id/notes/:noteId` (coach only)

Delete a note. Soft delete — note is flagged as deleted, not removed from the database.

---

## Exercise merge logic in detail

This is the most important data operation in the API. The goal is to allow the shared library to be the default while allowing precise client-specific overrides without duplication.

```
INPUTS:
  sharedLibrary = packages/exercise-library/index.js  (array of exercise objects)
  clientOverrides = clients/<id>/exercises.js           (array of partial exercise objects)

ALGORITHM:
  1. Build a map of sharedLibrary by id:
       baseMap = { [exercise.id]: exercise }  for each exercise in sharedLibrary

  2. For each override in clientOverrides:
       a. If override.id exists in baseMap:
            baseMap[override.id] = { ...baseMap[override.id], ...override }
            (shallow merge — override fields win)
       b. If override.id does NOT exist in baseMap:
            Validate that all required fields are present
            baseMap[override.id] = override
            (new exercise, not in shared library)

  3. Return Object.values(baseMap) sorted by phase, then by insertion order

OUTPUT:
  Merged exercise array — personalised to this client
```

---

## API file structure

```
mrpainpt/api/
├── _router.js                  Route dispatcher — maps paths to handlers
├── _middleware.js              Auth verification, rate limiting, logging
├── _utils.js                   Shared helpers (response builders, validators)
│
├── auth/
│   ├── client-pin.js           POST /api/auth/client
│   └── coach.js                POST /api/auth/coach
│
├── client/
│   ├── index.js                GET /api/client, GET /api/clients, PUT /api/client/:id
│   ├── sessions.js             GET/POST /api/client/:id/sessions/:sessionId
│   ├── progress.js             GET /api/client/:id/progress
│   └── notes.js                GET/POST/PUT/DELETE /api/client/:id/notes/:noteId
│
└── exercises/
    └── index.js                GET /api/exercises, GET /api/exercises/:id
```

---

## Database schema (Supabase / PostgreSQL)

```sql
-- clients
CREATE TABLE clients (
  id            TEXT PRIMARY KEY,  -- e.g. "sarah-thompson"
  slug          TEXT UNIQUE,
  display_name  TEXT,
  condition     TEXT,
  config        JSONB,             -- full CLIENT_CONFIG as JSON
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- sessions
CREATE TABLE sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       TEXT REFERENCES clients(id),
  session_id      TEXT,             -- e.g. "w3-s1"
  completed       BOOLEAN,
  pain_rating     SMALLINT,
  effort_rating   SMALLINT,
  exercises_done  TEXT[],
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- notes
CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   TEXT REFERENCES clients(id),
  coach_id    TEXT REFERENCES coaches(id),
  date        DATE,
  title       TEXT,
  body        TEXT,
  deleted     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- coaches
CREATE TABLE coaches (
  id          TEXT PRIMARY KEY,
  name        TEXT,
  email       TEXT UNIQUE,
  credentials TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- coach_clients (assignment table)
CREATE TABLE coach_clients (
  coach_id    TEXT REFERENCES coaches(id),
  client_id   TEXT REFERENCES clients(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (coach_id, client_id)
);
```

---

## Migration path from Phase 3 to Phase 4

1. Set up Supabase project and create schema above
2. Seed `clients` table from `clients/sarah-thompson/client.config.js`
3. Seed `sessions` table from localStorage export (or re-enter manually)
4. Seed `notes` table from `coachNotes` array in `client.config.js`
5. Build and deploy `mrpainpt/api/` edge functions
6. Update `apps/client/scripts/app.js` to call API endpoints instead of loading inline JS globals
7. Update `apps/coach/` to write notes and plan changes via API
8. Add auth gate to `apps/client/` — PIN entry screen
9. Remove dependency on `apps/client/scripts/data/*.js` static files
10. Delete static data files from `apps/client/scripts/data/` (or deprecate them)

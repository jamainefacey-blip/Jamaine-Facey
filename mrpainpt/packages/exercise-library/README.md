# Mr Pain PT — Exercise Library

The canonical source of all reusable rehabilitation exercises on the Mr Pain PT platform.

---

## Purpose

This library is condition-agnostic. Exercises belong here if they are clinically appropriate for multiple clients across different programs. Client-specific exercises or prescription modifications live in `clients/<slug>/exercises.js`.

---

## File reference

| File | Purpose |
|------|---------|
| `index.js` | All shared exercises as a JS array. The canonical runtime source from Phase 4. |
| `schema.js` | Documentation of the exercise object structure. No runtime code. |
| `drafts/` | Draft exercises not yet reviewed for clinical accuracy. Do not integrate into runtime. |
| `README.md` | This file. |

---

## How exercises are structured

Each exercise is a plain JavaScript object. Full field documentation is in `schema.js`.

### Minimum required fields

```js
{
  id:          "unique-slug",       // stable, lowercase, hyphenated
  phase:       1,                   // 1, 2, or 3
  category:    "Activation",        // display badge
  name:        "Exercise Name",
  description: "...",
  sets:        3,                   // or null
  reps:        15,                  // or null
  hold:        null,                // or "5 s"
  tempo:       "Controlled",
  rest:        "30 s between sets",
  cue:         "Primary coaching cue.",
  painNote:    null,                // or safety guidance string
}
```

### Recommended additional fields

```js
  muscleGroup:      ["quadriceps", "VMO"],
  equipment:        ["resistance band"],
  injuryStage:      ["subacute", "rehabilitation"],
  contraindications: [],
  progressionNotes:  "Progress when 3×15 is achieved without compensation.",
  imageAlt:          "Description of the demonstration image.",
```

---

## Phase classification

| Phase | Label | Focus |
|-------|-------|-------|
| 1 | Activation & Early Mobility | Low-load, post-acute, neuromuscular re-education |
| 2 | Progressive Strengthening | Building strength under controlled loading |
| 3 | Functional & Return-to-Activity | Power, balance, sport/activity-specific prep |

---

## Client overrides

When a client needs a modified version of a shared exercise, the override object in `clients/<slug>/exercises.js` only needs to specify the fields that change:

```js
// Override: client-specific rep count and coaching cue for quad-sets
{
  id:   "quad-sets",
  reps: 20,
  cue:  "Press hard — focus on the VMO teardrop shape.",
}
```

At runtime (Phase 4), the API performs a shallow merge:
```
final = { ...sharedLibrary[id], ...clientOverride[id] }
```

---

## Adding exercises

1. Check `drafts/` — the exercise may already be drafted
2. Ensure the `id` is unique across the entire library
3. Fill in all required fields (see schema.js)
4. Add optional fields where clinically relevant
5. Place in phase order within `index.js`
6. If it is a draft being promoted, move it from `drafts/` and convert from JSON to JS object format

---

## Drafts

`drafts/` contains exercise objects in JSON format, organised by body region or condition. These have not been clinically reviewed and must not be integrated into runtime code without review. They are staged here for future review and promotion.

Current draft files:
- `drafts/knee-acl.json` — knee and ACL recovery exercises
- `drafts/shoulder.json` — shoulder rehabilitation exercises
- `drafts/hip-mobility.json` — hip mobility and stability exercises
- `drafts/lower-back.json` — lumbar stability and lower back exercises

---

## Phase status

| Phase | Status | Description |
|-------|--------|-------------|
| 2 | Active | `index.js` is the canonical developer source. `apps/client/scripts/data/exercises.js` is a manually-synced deployment artifact. |
| 4 | Planned | API serves exercises from this file. Client overrides merged at request time. `apps/client/scripts/data/exercises.js` is deprecated. |

// ─────────────────────────────────────────────────────────────────────────────
// MR PAIN PT — PROGRAM PLAN TEMPLATE
//
// HOW THIS FILE WORKS
// ───────────────────
// REHAB_PLAN defines the client's full program as an array of weeks.
// Each week contains a sessions array. Each session lists the exercise IDs
// the client should complete that day.
//
// Exercise IDs must match either:
//   • An id in mrpainpt/packages/exercise-library/index.js  (shared library)
//   • An id in this client's exercises.js override file     (client-specific)
//
// SESSION STATE
// ─────────────
// The fields completed, painRating, effortRating, and exercisesDone are
// runtime state managed by apps/client/scripts/app.js via localStorage.
// In this file they represent the DEFAULT (starting) values only.
// Set completed: true and populate ratings to pre-fill historical sessions
// for demo or onboarding purposes.
//
// NAMING CONVENTION
// ─────────────────
// Session IDs follow the pattern:  w<week>-s<session>
//   Example: w1-s1, w1-s2, w3-s3
// This ID is used as the localStorage key — it must be unique across the plan.
//
// PHASES
// ──────
// Organise weeks into phases (e.g. Phase 1: Weeks 1–4, Phase 2: Weeks 5–8).
// The phase label is display-only. The progress engine uses week numbers.
// ─────────────────────────────────────────────────────────────────────────────

const REHAB_PLAN = {
  programName: "EDIT — e.g. 12-Week ACL Rehabilitation",  // ← EDIT

  phases: [
    { phase: 1, label: "Phase 1 — EDIT label",  weeks: [1, 2, 3, 4]  }, // ← EDIT
    { phase: 2, label: "Phase 2 — EDIT label",  weeks: [5, 6, 7, 8]  }, // ← EDIT
    { phase: 3, label: "Phase 3 — EDIT label",  weeks: [9, 10, 11, 12] }, // ← EDIT
  ],

  weeks: [

    // ─────────────────────────────────────────────────────────────────────
    // WEEK 1 — copy and adapt this block for each week
    // ─────────────────────────────────────────────────────────────────────
    {
      week:    1,
      phase:   1,
      label:   "Week 1 — EDIT label",       // ← EDIT: e.g. "Foundation & Activation"
      sessions: [
        {
          id:           "w1-s1",            // ← must be unique across the entire plan
          day:          "Monday",           // ← EDIT: display only
          label:        "Session 1",
          duration:     "20 min",           // ← EDIT: estimated session length
          completed:    false,
          painRating:   null,               // null = not yet completed
          effortRating: null,               // null = not yet completed
          exercises: [
            // ← EDIT: list exercise IDs from the shared library or client overrides
            // Example:
            // "quad-sets",
            // "heel-slides",
            // "ankle-pumps",
          ],
        },
        {
          id:           "w1-s2",
          day:          "Wednesday",
          label:        "Session 2",
          duration:     "20 min",
          completed:    false,
          painRating:   null,
          effortRating: null,
          exercises: [
            // ← EDIT
          ],
        },
        {
          id:           "w1-s3",
          day:          "Friday",
          label:        "Session 3",
          duration:     "20 min",
          completed:    false,
          painRating:   null,
          effortRating: null,
          exercises: [
            // ← EDIT
          ],
        },
      ],
    },

    // ─────────────────────────────────────────────────────────────────────
    // Continue with Week 2, Week 3, etc.
    // Duplicate the block above for each week up to programWeeks.
    // ─────────────────────────────────────────────────────────────────────

  ],
};

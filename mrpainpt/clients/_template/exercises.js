// ─────────────────────────────────────────────────────────────────────────────
// MR PAIN PT — CLIENT-SPECIFIC EXERCISE OVERRIDES
//
// PURPOSE
// ───────
// This file is intentionally separate from the shared exercise library at:
//   mrpainpt/packages/exercise-library/index.js
//
// Use this file ONLY for:
//   1. Exercises that are specific to this client and not reusable across others
//   2. Modifications to a shared exercise (e.g. different rep range, altered cue)
//      — in this case use the same id as the shared exercise and the API will
//        apply this object as a shallow override in Phase 4
//
// For any exercise that belongs to the general rehab population, add it to
// packages/exercise-library/index.js instead.
//
// MERGE BEHAVIOUR (Phase 4)
// ─────────────────────────
// When the API is live, it will merge exercise data as follows:
//
//   final = { ...sharedLibraryExercise, ...clientOverrideExercise }
//
// So you only need to specify the fields you want to change. Example override:
//
//   {
//     id:   "quad-sets",         // same id as the shared library
//     reps: 20,                  // override: this client does 20 reps, not 15
//     cue:  "Focus on VMO activation specifically", // override: custom cue
//   }
//
// CURRENT STATUS
// ──────────────
// Empty — this client uses the shared library only.
// Add entries here if client-specific exercises or overrides are needed.
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_EXERCISE_OVERRIDES = [

  // Add client-specific exercises or overrides here.
  // Each object must have at minimum an `id` field.
  // See mrpainpt/packages/exercise-library/schema.js for the full field list.

  // Example new exercise:
  // {
  //   id:          "single-leg-press-modified",
  //   phase:       2,
  //   category:    "Strengthening",
  //   name:        "Modified Single-Leg Press",
  //   description: "Low-load single-leg press for clients with patellofemoral sensitivity.",
  //   sets:        3,
  //   reps:        10,
  //   hold:        null,
  //   tempo:       "2-1-2",
  //   rest:        "60 s",
  //   cue:         "Keep the knee tracking over the second toe throughout.",
  //   painNote:    "Stop if pain exceeds 3/10 on the pain scale.",
  //   imageAlt:    "Client performing a single-leg press on a seated machine",
  //   muscleGroup: ["quadriceps", "glutes"],
  //   equipment:   ["leg press machine"],
  //   contraindications: ["acute patellofemoral syndrome"],
  //   progressionNotes:  "Progress load by 5 kg when 3×10 is achieved with pain < 2/10.",
  // },

];

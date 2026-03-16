// ─────────────────────────────────────────────────────────────────────────────
// MR PAIN PT — EXERCISE OBJECT SCHEMA
//
// This file is documentation only. No runtime code.
// It defines the canonical shape of every exercise object in the platform.
//
// Every exercise in packages/exercise-library/index.js and in
// clients/<slug>/exercises.js must conform to this schema.
//
// Fields marked REQUIRED must be present in the shared library.
// Fields marked OPTIONAL may be null or omitted in the shared library
//   but should be populated before clinical use.
// Fields marked OVERRIDE-ONLY exist only in client override files and
//   are merged on top of the shared library entry at runtime (Phase 4+).
// ─────────────────────────────────────────────────────────────────────────────

/*

EXERCISE SCHEMA v1.0
────────────────────────────────────────────────────────────────────────────────

{
  // ── Identity ───────────────────────────────────────────────────────────────

  id: String                  REQUIRED
    Unique slug. Lowercase, hyphenated. Must be stable — used as the session
    state key and as the plan reference ID.
    Examples: "quad-sets", "single-leg-balance", "prone-y-raise"

  name: String                REQUIRED
    Human-readable display name. Title-cased.
    Example: "Quad Sets"

  // ── Classification ─────────────────────────────────────────────────────────

  phase: Number               REQUIRED
    Which program phase this exercise belongs to: 1, 2, or 3.
    Phase 1 = early / low-load activation
    Phase 2 = strengthening / progressive loading
    Phase 3 = functional / return-to-activity

  category: String            REQUIRED
    Display badge shown on exercise cards.
    Standard values: "Activation", "Mobility", "Strengthening",
                     "Stability", "Functional", "Plyometric", "Flexibility"

  injuryStage: String[]       OPTIONAL
    Clinical stages this exercise is appropriate for.
    Standard values: "acute", "subacute", "rehabilitation", "return-to-sport"
    Example: ["subacute", "rehabilitation"]

  muscleGroup: String[]       OPTIONAL
    Primary and secondary muscles targeted.
    Example: ["quadriceps", "VMO", "hip flexors"]

  equipment: String[]         OPTIONAL
    Equipment required. Use "none" for bodyweight.
    Example: ["resistance band", "exercise mat"]

  // ── Description ────────────────────────────────────────────────────────────

  description: String         REQUIRED
    1–3 sentences. Shown on the exercise card. Describes what the exercise is
    and its rehabilitation purpose. Plain language — written for the client.

  // ── Prescription ───────────────────────────────────────────────────────────

  sets: Number | null         REQUIRED (null if not applicable)
    Number of sets. Null for time-based or continuous exercises.

  reps: Number | null         REQUIRED (null if not applicable)
    Number of repetitions per set. Null if hold-based or time-based.

  hold: String | null         REQUIRED (null if not applicable)
    Hold duration per repetition. Null if rep-based.
    Example: "5 s", "10 s"

  tempo: String               REQUIRED
    Movement tempo description. Free text.
    Examples: "Slow and controlled", "2-1-2", "Squeeze–hold–release"

  rest: String                REQUIRED
    Rest period between sets.
    Example: "30 s between sets", "60 s"

  // ── Coaching ───────────────────────────────────────────────────────────────

  cue: String                 REQUIRED
    Primary coaching cue. The single most important technique point.
    Shown highlighted in the exercise detail view.
    Written in second person, imperative.
    Example: "Keep your lower back flat against the floor throughout."

  painNote: String | null     REQUIRED (null if no specific pain guidance)
    Pain management or safety note specific to this exercise.
    Shown as an amber warning in the exercise detail view.
    Example: "Stop if pain exceeds 3/10. Mild discomfort is expected."

  // ── Safety & Progression ───────────────────────────────────────────────────

  contraindications: String[] OPTIONAL
    Conditions or situations in which this exercise should not be performed.
    Example: ["acute DVT", "open wound over operative site"]

  progressionNotes: String    OPTIONAL
    Criteria for progressing from this exercise to the next.
    Example: "Progress to Step-Up when single-leg stance >30 s is pain-free."

  // ── Media ──────────────────────────────────────────────────────────────────

  imageAlt: String            OPTIONAL
    Alt text for the exercise demonstration image.
    Written as a description of the image content, not the exercise name.
    Example: "Person lying supine on a mat tightening the quadriceps muscle"

  videoUrl: String | null     OPTIONAL (Phase 3+)
    URL of a demonstration video clip. Null until media is produced.
}

────────────────────────────────────────────────────────────────────────────────
CLIENT OVERRIDE SCHEMA (clients/<slug>/exercises.js)
────────────────────────────────────────────────────────────────────────────────

Override objects need only include the id and the fields being changed.
All other fields are inherited from the shared library at merge time.

{
  id:          String    REQUIRED — must match an id in the shared library
                                   OR be a new id for a client-exclusive exercise
  <any field>  any       OPTIONAL — only specify what differs from the library
}

If the id does not exist in the shared library, the full exercise object
is required (all REQUIRED fields must be present).

────────────────────────────────────────────────────────────────────────────────
SCHEMA VERSION HISTORY
────────────────────────────────────────────────────────────────────────────────
v1.0 — 2026-03 — Initial schema. Fields: id, name, phase, category, injuryStage,
       muscleGroup, equipment, description, sets, reps, hold, tempo, rest,
       cue, painNote, contraindications, progressionNotes, imageAlt, videoUrl.

*/

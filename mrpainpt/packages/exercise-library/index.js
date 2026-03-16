// ─────────────────────────────────────────────────────────────────────────────
// MR PAIN PT — CANONICAL EXERCISE LIBRARY
//
// This is the single source of truth for all reusable rehabilitation exercises
// on the Mr Pain PT platform.
//
// PHASE STATUS
// ────────────
// Phase 2: This file is the canonical developer-side source.
//   apps/client/scripts/data/exercises.js is a manually-synced deployment
//   artifact until Phase 4 introduces the API layer.
//
// Phase 4+: This file is loaded by the API at /api/exercises.
//   Client-specific overrides from clients/<slug>/exercises.js are merged
//   on top at request time.
//
// ADDING EXERCISES
// ────────────────
// All fields are documented in schema.js.
// Use a stable, lowercase, hyphenated id.
// Add exercises to the array in phase order (Phase 1 → 2 → 3).
// Draft exercises for specific conditions live in drafts/.
// ─────────────────────────────────────────────────────────────────────────────

const EXERCISE_LIBRARY = [

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 1 — Activation & Early Mobility
  // Low-load exercises appropriate for the acute and sub-acute stages.
  // Focus: restore neuromuscular control, reduce atrophy, maintain joint motion.
  // ────────────────────────────────────────────────────────────────────────────

  {
    id:          "quad-sets",
    phase:       1,
    category:    "Activation",
    name:        "Quad Sets",
    description: "Isometric quadriceps contraction performed lying flat. Tighten the quad muscle by pressing the back of the knee into the floor and hold. One of the first post-surgical exercises used to prevent quad atrophy and re-establish neuromuscular control.",
    sets:        3,
    reps:        15,
    hold:        "5 s",
    tempo:       "Squeeze–hold–release",
    rest:        "30 s between sets",
    cue:         "Press the back of your knee firmly into the floor and feel the thigh muscle tighten all the way up.",
    painNote:    "Mild muscle fatigue is expected. Stop if you feel sharp pain in the knee joint.",
    imageAlt:    "Person lying flat on mat with leg straight, quad muscle visibly contracted",
    muscleGroup: ["quadriceps", "VMO"],
    equipment:   ["exercise mat"],
    injuryStage: ["acute", "subacute"],
    contraindications: [],
    progressionNotes:  "Progress to Short Arc Quad or Straight Leg Raise when 3×15 is comfortable.",
  },

  {
    id:          "heel-slides",
    phase:       1,
    category:    "Mobility",
    name:        "Heel Slides",
    description: "Lying on your back, slowly slide your heel toward your buttocks to flex the knee, then return. Restores active knee flexion range of motion without loading the joint.",
    sets:        3,
    reps:        15,
    hold:        null,
    tempo:       "Slow and controlled — 3 s in, 3 s return",
    rest:        "30 s between sets",
    cue:         "Slide as far as comfortable, then go just a little further — you should feel a gentle stretch, not sharp pain.",
    painNote:    "Some tightness and ache at end-range is normal. Stop at sharp or intense pain.",
    imageAlt:    "Person lying supine sliding their heel toward their body to bend the knee",
    muscleGroup: ["hamstrings", "knee flexors"],
    equipment:   ["exercise mat", "smooth floor or slideboard"],
    injuryStage: ["acute", "subacute"],
    contraindications: [],
    progressionNotes:  "Goal is 0–90° active ROM. Progress to standing heel curls once 90° is achieved.",
  },

  {
    id:          "ankle-pumps",
    phase:       1,
    category:    "Activation",
    name:        "Ankle Pumps",
    description: "Lying with legs elevated, pump the ankles up and down rhythmically. Promotes circulation, reduces swelling, and prevents deep vein thrombosis in the early post-operative period.",
    sets:        3,
    reps:        20,
    hold:        null,
    tempo:       "Steady rhythm — about 1 rep per second",
    rest:        "30 s between sets",
    cue:         "Point your toes away, then pull them back toward you. Keep the movement coming from the ankle, not the knee.",
    painNote:    null,
    imageAlt:    "Person lying with leg elevated alternating ankle dorsiflexion and plantarflexion",
    muscleGroup: ["tibialis anterior", "gastrocnemius", "soleus"],
    equipment:   ["exercise mat"],
    injuryStage: ["acute"],
    contraindications: [],
    progressionNotes:  "Continue throughout Phase 1. Can be performed hourly in the first 72 hours post-surgery.",
  },

  {
    id:          "straight-leg-raise",
    phase:       1,
    category:    "Strengthening",
    name:        "Straight Leg Raise",
    description: "Lying flat, tighten the quad, then lift the entire leg to the height of the opposite knee and lower slowly. Strengthens the hip flexors and quadriceps without bending the knee joint.",
    sets:        3,
    reps:        12,
    hold:        "2 s at top",
    tempo:       "2 s up — hold — 3 s down",
    rest:        "45 s between sets",
    cue:         "Tighten the quad before you lift — the knee must stay straight for the full rep.",
    painNote:    "A pulling sensation in the front of the hip is normal. Stop if the knee bends involuntarily or pain is sharp.",
    imageAlt:    "Person lying on their back lifting one straight leg to 45 degrees while the other leg is bent",
    muscleGroup: ["quadriceps", "hip flexors"],
    equipment:   ["exercise mat"],
    injuryStage: ["subacute"],
    contraindications: [],
    progressionNotes:  "Progress to resisted SLR (ankle weight) when 3×12 is easy with full knee extension.",
  },

  {
    id:          "terminal-knee-extension",
    phase:       1,
    category:    "Activation",
    name:        "Terminal Knee Extension (TKE)",
    description: "Using a resistance band anchored behind you, start with the knee slightly bent and push through to full extension. Specifically targets the VMO and improves terminal knee extension, which is often lost post-surgery.",
    sets:        3,
    reps:        15,
    hold:        "2 s at full extension",
    tempo:       "Controlled push — hold — slow return",
    rest:        "30 s between sets",
    cue:         "Focus on fully straightening the knee and squeezing the VMO (the teardrop muscle on the inside of the thigh) at the end position.",
    painNote:    "Mild ache at the front of the knee is common. Avoid forcing hyperextension.",
    imageAlt:    "Person standing with resistance band behind knee, extending leg to straight",
    muscleGroup: ["quadriceps", "VMO"],
    equipment:   ["resistance band", "anchor point"],
    injuryStage: ["subacute", "rehabilitation"],
    contraindications: [],
    progressionNotes:  "Increase band resistance when 3×15 is achieved without compensation.",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 2 — Progressive Strengthening
  // Loading the tissue under controlled conditions.
  // Focus: build strength symmetry, proprioception, functional movement patterns.
  // ────────────────────────────────────────────────────────────────────────────

  {
    id:          "mini-squat",
    phase:       2,
    category:    "Strengthening",
    name:        "Mini Squat",
    description: "A partial squat to approximately 45° of knee flexion, performed with bodyweight. Builds quad and glute strength in the range of motion used for everyday activities like sitting down and standing up.",
    sets:        3,
    reps:        12,
    hold:        null,
    tempo:       "3 s down — 1 s pause — 2 s up",
    rest:        "60 s between sets",
    cue:         "Keep your knee tracking directly over your second toe. Do not let it cave inward.",
    painNote:    "Pain over 3/10 at the front of the knee — stop and contact your coach. Some muscle fatigue is expected.",
    imageAlt:    "Person performing a shallow squat with knees tracking over toes",
    muscleGroup: ["quadriceps", "glutes", "hamstrings"],
    equipment:   ["none"],
    injuryStage: ["rehabilitation"],
    contraindications: ["acute post-surgical swelling"],
    progressionNotes:  "Increase depth toward parallel once 3×12 at 45° is pain-free over two sessions.",
  },

  {
    id:          "step-up",
    phase:       2,
    category:    "Functional",
    name:        "Forward Step-Up",
    description: "Step onto a low box (10–15 cm), driving through the heel to lift the body, then step down with control. Builds single-leg quad and glute strength in a functional, weight-bearing movement.",
    sets:        3,
    reps:        10,
    hold:        null,
    tempo:       "2 s up — controlled step down",
    rest:        "60 s between sets",
    cue:         "Drive through your heel, not your toes. Keep your torso upright — do not lean forward.",
    painNote:    "Avoid if step-up causes anterior knee pain over 4/10. Reduce step height first.",
    imageAlt:    "Person stepping up onto a low platform with one leg, maintaining upright posture",
    muscleGroup: ["quadriceps", "glutes", "hamstrings"],
    equipment:   ["step or low box (10–15 cm)"],
    injuryStage: ["rehabilitation"],
    contraindications: [],
    progressionNotes:  "Increase step height to 20 cm, then 30 cm. Progress to lateral step-up once forward step-up is solid.",
  },

  {
    id:          "clamshell",
    phase:       2,
    category:    "Activation",
    name:        "Clamshell",
    description: "Lying on your side with hips and knees bent, rotate the top knee upward like a clamshell opening while keeping the feet together. Isolates and strengthens the hip abductors, particularly gluteus medius.",
    sets:        3,
    reps:        15,
    hold:        "2 s at top",
    tempo:       "Controlled rotation — hold — slow return",
    rest:        "45 s between sets",
    cue:         "Do not let your pelvis rock backward as you lift. The movement is entirely at the hip.",
    painNote:    null,
    imageAlt:    "Person lying on their side with knees bent, rotating the top knee upward",
    muscleGroup: ["gluteus medius", "hip abductors", "external hip rotators"],
    equipment:   ["exercise mat"],
    injuryStage: ["subacute", "rehabilitation"],
    contraindications: [],
    progressionNotes:  "Add a resistance band around the thighs when 3×15 is easy without compensation.",
  },

  {
    id:          "glute-bridge",
    phase:       2,
    category:    "Strengthening",
    name:        "Glute Bridge",
    description: "Lying on your back with knees bent, drive your hips toward the ceiling by squeezing your glutes, hold briefly, then lower with control. Strengthens the posterior chain — glutes, hamstrings — and is essential for knee and hip stability.",
    sets:        3,
    reps:        12,
    hold:        "3 s at top",
    tempo:       "2 s up — hold — 3 s down",
    rest:        "60 s between sets",
    cue:         "Squeeze your glutes first, then lift. Your hips should form a straight line with your shoulders and knees at the top.",
    painNote:    "Keep the movement from the hips, not the lower back. Stop if you feel lower back pain.",
    imageAlt:    "Person lying on their back with knees bent, hips raised to form a straight line from shoulders to knees",
    muscleGroup: ["glutes", "hamstrings", "core"],
    equipment:   ["exercise mat"],
    injuryStage: ["subacute", "rehabilitation"],
    contraindications: [],
    progressionNotes:  "Progress to single-leg glute bridge once 3×12 with 3 s hold is consistent.",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // PHASE 3 — Functional & Return-to-Activity
  // Progressive loading toward sport, work, or recreational demands.
  // Focus: power, balance, multi-planar movement, sport-specific prep.
  // ────────────────────────────────────────────────────────────────────────────

  {
    id:          "single-leg-balance",
    phase:       3,
    category:    "Stability",
    name:        "Single-Leg Balance",
    description: "Stand on one leg with a slight knee bend (10–15°) and maintain balance for the target duration. Develops proprioception, ankle stability, and the hip control needed for running and cutting activities.",
    sets:        3,
    reps:        null,
    hold:        "30 s",
    tempo:       "Static hold — controlled breathing",
    rest:        "30 s between legs",
    cue:         "Soft knee — do not lock it out. Focus your eyes on a fixed point. Brace your core lightly.",
    painNote:    "Some wobble is normal and beneficial. Stop if ankle or knee pain develops.",
    imageAlt:    "Person standing on one leg with slight knee bend, arms loosely at sides",
    muscleGroup: ["glutes", "hip stabilisers", "ankle stabilisers", "core"],
    equipment:   ["none"],
    injuryStage: ["rehabilitation", "return-to-sport"],
    contraindications: [],
    progressionNotes:  "Progress to single-leg balance on an unstable surface (foam pad) once 30 s is solid on the floor.",
  },

  {
    id:          "lateral-band-walk",
    phase:       3,
    category:    "Strengthening",
    name:        "Lateral Band Walk",
    description: "With a resistance band around the thighs or ankles, take side steps in a semi-squat position. Strengthens the hip abductors under load and improves dynamic knee alignment essential for return-to-sport activities.",
    sets:        3,
    reps:        12,
    hold:        null,
    tempo:       "Controlled step — pause — step",
    rest:        "60 s between sets",
    cue:         "Keep your knees pushing out against the band throughout — do not let them cave inward between steps.",
    painNote:    "Mild hip and glute burn is expected. Reduce resistance if knees collapse inward.",
    imageAlt:    "Person in squat position stepping laterally with a resistance band around thighs",
    muscleGroup: ["gluteus medius", "hip abductors", "quadriceps"],
    equipment:   ["resistance band"],
    injuryStage: ["rehabilitation", "return-to-sport"],
    contraindications: [],
    progressionNotes:  "Increase band resistance or add a forward lean for greater glute challenge.",
  },

  {
    id:          "bird-dog",
    phase:       2,
    category:    "Stability",
    name:        "Bird Dog",
    description: "On hands and knees, simultaneously extend the opposite arm and leg while keeping the spine neutral. One of the foundational exercises for lumbar stability — trains the deep core muscles without loading the spine in flexion.",
    sets:        3,
    reps:        10,
    hold:        "3 s at extension",
    tempo:       "Slow reach — hold — controlled return",
    rest:        "45 s between sets",
    cue:         "Do not let your lower back arch or rotate. Imagine balancing a glass of water on your lower back as you extend.",
    painNote:    "Stop if you feel sharp lower back pain. Mild core fatigue is expected.",
    imageAlt:    "Person on all fours extending the right arm and left leg simultaneously, spine neutral",
    muscleGroup: ["erector spinae", "multifidus", "glutes", "core"],
    equipment:   ["exercise mat"],
    injuryStage: ["subacute", "rehabilitation"],
    contraindications: [],
    progressionNotes:  "Progress to an unstable surface (foam pad under knees/hands) or add resistance band to ankle.",
  },

  {
    id:          "dead-bug",
    phase:       2,
    category:    "Stability",
    name:        "Dead Bug",
    description: "Lying on your back with arms pointing to the ceiling and hips and knees at 90°, slowly lower the opposite arm and leg toward the floor while keeping your lower back flat. Builds deep core control and anti-extension stability.",
    sets:        3,
    reps:        8,
    hold:        null,
    tempo:       "4 s lowering — pause — return",
    rest:        "60 s between sets",
    cue:         "Press your lower back firmly into the floor throughout. The moment the back arches, you have gone too far.",
    painNote:    "This is a challenging core exercise. Reduce the range of motion if you cannot maintain a flat lower back.",
    imageAlt:    "Person lying on back, lowering opposite arm and leg toward the floor while keeping spine neutral",
    muscleGroup: ["transverse abdominis", "obliques", "hip flexors", "core"],
    equipment:   ["exercise mat"],
    injuryStage: ["subacute", "rehabilitation"],
    contraindications: [],
    progressionNotes:  "Add resistance by holding a light dumbbell in the extended arm.",
  },

];

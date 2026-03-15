// ─────────────────────────────────────────────────────────────────────────────
// REHAB PLAN  —  Weekly schedule and session definitions
// Edit sessions, exercises, and phase labels here.
// ─────────────────────────────────────────────────────────────────────────────

const REHAB_PLAN = {
  phases: [
    {
      id: 1,
      label: "Phase 1 — Activation & ROM",
      weeks: "1–4",
      focus:
        "Re-establish neuromuscular control, reduce swelling, and restore basic range of motion.",
      color: "#0d9488",
    },
    {
      id: 2,
      label: "Phase 2 — Strength & Stability",
      weeks: "5–8",
      focus:
        "Progressive loading of the quad and hip complex, single-leg stability work.",
      color: "#2563eb",
    },
    {
      id: 3,
      label: "Phase 3 — Functional Loading",
      weeks: "9–12",
      focus:
        "Return to sport/activity patterns, endurance, and final clearance assessment.",
      color: "#7c3aed",
    },
  ],

  weeks: [
    // ── Week 1 ──────────────────────────────────────────────────────────────
    {
      weekNumber: 1,
      phase: 1,
      focus: "Early activation, swelling management",
      sessions: [
        {
          id: "w1-s1",
          day: "Monday",
          label: "Session 1",
          duration: "20 min",
          completed: true,
          painRating: 2,
          effortRating: 2,
          exercises: ["quad-sets", "heel-slides", "ankle-pumps"],
        },
        {
          id: "w1-s2",
          day: "Wednesday",
          label: "Session 2",
          duration: "20 min",
          completed: true,
          painRating: 3,
          effortRating: 2,
          exercises: ["quad-sets", "heel-slides", "ankle-pumps"],
        },
        {
          id: "w1-s3",
          day: "Friday",
          label: "Session 3",
          duration: "25 min",
          completed: true,
          painRating: 2,
          effortRating: 3,
          exercises: ["quad-sets", "heel-slides", "straight-leg-raise"],
        },
      ],
    },

    // ── Week 2 ──────────────────────────────────────────────────────────────
    {
      weekNumber: 2,
      phase: 1,
      focus: "Weight-bearing progression, ROM gains",
      sessions: [
        {
          id: "w2-s1",
          day: "Monday",
          label: "Session 1",
          duration: "25 min",
          completed: true,
          painRating: 2,
          effortRating: 3,
          exercises: ["quad-sets", "straight-leg-raise", "heel-slides"],
        },
        {
          id: "w2-s2",
          day: "Wednesday",
          label: "Session 2",
          duration: "25 min",
          completed: true,
          painRating: 2,
          effortRating: 3,
          exercises: ["straight-leg-raise", "heel-slides", "ankle-pumps"],
        },
        {
          id: "w2-s3",
          day: "Friday",
          label: "Session 3",
          duration: "30 min",
          completed: true,
          painRating: 1,
          effortRating: 4,
          exercises: ["quad-sets", "straight-leg-raise", "heel-slides"],
        },
      ],
    },

    // ── Week 3  (CURRENT WEEK) ───────────────────────────────────────────────
    {
      weekNumber: 3,
      phase: 1,
      focus: "Add terminal knee extension, continue ROM",
      sessions: [
        {
          id: "w3-s1",
          day: "Monday",
          label: "Session 1",
          duration: "30 min",
          completed: true,
          painRating: 2,
          effortRating: 4,
          exercises: ["quad-sets", "straight-leg-raise", "terminal-knee-ext"],
        },
        {
          id: "w3-s2",
          day: "Wednesday",
          label: "Session 2",
          duration: "30 min",
          completed: false,
          painRating: null,
          effortRating: null,
          exercises: ["straight-leg-raise", "terminal-knee-ext", "heel-slides"],
        },
        {
          id: "w3-s3",
          day: "Friday",
          label: "Session 3",
          duration: "35 min",
          completed: false,
          painRating: null,
          effortRating: null,
          exercises: ["quad-sets", "terminal-knee-ext", "straight-leg-raise"],
        },
      ],
    },

    // ── Week 4 ──────────────────────────────────────────────────────────────
    {
      weekNumber: 4,
      phase: 1,
      focus: "Consolidate Phase 1, prepare for Phase 2 transition",
      sessions: [
        {
          id: "w4-s1",
          day: "Monday",
          label: "Session 1",
          duration: "35 min",
          completed: false,
          painRating: null,
          effortRating: null,
          exercises: ["straight-leg-raise", "terminal-knee-ext", "heel-slides"],
        },
        {
          id: "w4-s2",
          day: "Wednesday",
          label: "Session 2",
          duration: "35 min",
          completed: false,
          painRating: null,
          effortRating: null,
          exercises: ["quad-sets", "straight-leg-raise", "terminal-knee-ext"],
        },
        {
          id: "w4-s3",
          day: "Friday",
          label: "Session 3",
          duration: "40 min",
          completed: false,
          painRating: null,
          effortRating: null,
          exercises: ["straight-leg-raise", "terminal-knee-ext", "heel-slides"],
        },
      ],
    },

    // ── Week 5 ──────────────────────────────────────────────────────────────
    {
      weekNumber: 5,
      phase: 2,
      focus: "Introduce weight-bearing strength work",
      sessions: [
        {
          id: "w5-s1",
          day: "Monday",
          label: "Session 1",
          duration: "40 min",
          completed: false,
          painRating: null,
          effortRating: null,
          exercises: ["mini-squat", "terminal-knee-ext", "single-leg-balance"],
        },
        {
          id: "w5-s2",
          day: "Wednesday",
          label: "Session 2",
          duration: "40 min",
          completed: false,
          painRating: null,
          effortRating: null,
          exercises: ["step-up", "mini-squat", "single-leg-balance"],
        },
        {
          id: "w5-s3",
          day: "Friday",
          label: "Session 3",
          duration: "40 min",
          completed: false,
          painRating: null,
          effortRating: null,
          exercises: ["mini-squat", "step-up", "terminal-knee-ext"],
        },
      ],
    },

    // ── Weeks 6–12: abbreviated for data size ─────────────────────────────
    ...[6, 7, 8].map((wk) => ({
      weekNumber: wk,
      phase: 2,
      focus: "Progressive strength and stability",
      sessions: ["Monday", "Wednesday", "Friday"].map((day, i) => ({
        id: `w${wk}-s${i + 1}`,
        day,
        label: `Session ${i + 1}`,
        duration: "45 min",
        completed: false,
        painRating: null,
        effortRating: null,
        exercises: ["step-up", "single-leg-balance", "lateral-band-walk"],
      })),
    })),

    ...[9, 10, 11, 12].map((wk) => ({
      weekNumber: wk,
      phase: 3,
      focus: "Functional loading and return-to-activity",
      sessions: ["Monday", "Wednesday", "Friday"].map((day, i) => ({
        id: `w${wk}-s${i + 1}`,
        day,
        label: `Session ${i + 1}`,
        duration: "50 min",
        completed: false,
        painRating: null,
        effortRating: null,
        exercises: ["wall-squat", "lateral-band-walk", "single-leg-balance"],
      })),
    })),
  ],
};

// Convenience helpers
function getCurrentWeek() {
  return REHAB_PLAN.weeks.find(
    (w) => w.weekNumber === CLIENT_CONFIG.client.currentWeek
  );
}

function getExerciseById(id) {
  return EXERCISE_LIBRARY.find((ex) => ex.id === id);
}

function getSessionById(sessionId) {
  for (const week of REHAB_PLAN.weeks) {
    const session = week.sessions.find((s) => s.id === sessionId);
    if (session) return { session, week };
  }
  return null;
}

function getAllSessions() {
  return REHAB_PLAN.weeks.flatMap((w) => w.sessions);
}

function getCompletedSessions() {
  return getAllSessions().filter((s) => s.completed);
}

function getTotalSessionsUpToCurrentWeek() {
  const currentWeek = CLIENT_CONFIG.client.currentWeek;
  return REHAB_PLAN.weeks
    .filter((w) => w.weekNumber <= currentWeek)
    .flatMap((w) => w.sessions);
}

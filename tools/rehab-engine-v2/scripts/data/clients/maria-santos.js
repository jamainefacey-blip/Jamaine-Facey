// ─────────────────────────────────────────────────────────────────────────────
// CLIENT: Maria Santos  —  mode: "multi_week"
// 4-week shoulder mobility and strengthening block (post-frozen shoulder)
//
// multi_week mode with no phases (short block). Progress tracking included.
//
// Activate in index.html: uncomment this <script> tag, comment out others.
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_CONFIG = {
  appName:     "Mr Pain PT",
  accentColor: "#7c3aed",
  logoText:    "MP",

  client: {
    firstName:       "Maria",
    lastName:        "Santos",
    age:             54,
    condition:       "Shoulder mobility rehabilitation",
    conditionDetail: "Adhesive capsulitis (frozen shoulder) — recovery phase",
    startDate:       "2026-03-02",
  },

  coach: {
    name:        "Jamie Okafor",
    credentials: "MSc PT, MCSP",
    contactNote: "Book your next appointment at the clinic or call the reception desk.",
  },

  disclaimer:
    "This exercise program has been designed by your physiotherapist to support your shoulder recovery. It does not constitute medical advice or replace your in-clinic treatment. Discontinue exercises and contact your physiotherapist if you experience a significant increase in pain, any numbness or tingling down the arm, or any new symptoms. Always warm up gently before starting.",
};

const PROGRAM = {
  id:          "maria-shoulder-block-2026",
  mode:        "multi_week",
  currentWeek: 2,

  access: {
    type:   "one_off_purchase",
    status: "active",
  },

  // No phases for a short block — omit the phases array
  weeks: [
    { weekNumber: 1, focus: "Gentle mobility and circulation" },
    { weekNumber: 2, focus: "Expand range, begin activation" },
    { weekNumber: 3, focus: "Light strengthening, maintain ROM gains" },
    { weekNumber: 4, focus: "Progressive resistance and functional carry-over" },
  ],

  outcomes: {
    pain: { baseline: 5, target: 1, unit: "NRS 0–10" },
    rom:  { baseline: "120°", target: "Full", unit: "active shoulder flexion" },
    strength: { baseline: "4/5", target: "5/5", unit: "manual muscle test — deltoid" },
    readiness: { label: "Overhead reach cleared for daily activities", cleared: false },
  },

  assessments: [],

  sessions: [
    // Week 1
    { id: "ms-w1-s1", weekNumber: 1, day: "Monday",    label: "Session 1", duration: "20 min", exercises: ["shoulder-pendulum","shoulder-wall-slides","shoulder-doorway-stretch"], _seed: { completed: true, painRating: 4, effortRating: 2 } },
    { id: "ms-w1-s2", weekNumber: 1, day: "Wednesday", label: "Session 2", duration: "20 min", exercises: ["shoulder-pendulum","shoulder-doorway-stretch","shoulder-wall-slides"], _seed: { completed: true, painRating: 3, effortRating: 2 } },
    { id: "ms-w1-s3", weekNumber: 1, day: "Friday",    label: "Session 3", duration: "25 min", exercises: ["shoulder-pendulum","shoulder-wall-slides","shoulder-doorway-stretch"], _seed: { completed: true, painRating: 3, effortRating: 3 } },
    // Week 2 — current
    { id: "ms-w2-s1", weekNumber: 2, day: "Monday",    label: "Session 1", duration: "25 min", exercises: ["shoulder-pendulum","shoulder-isometric-abduction","shoulder-wall-slides"], _seed: { completed: true, painRating: 3, effortRating: 3 } },
    { id: "ms-w2-s2", weekNumber: 2, day: "Wednesday", label: "Session 2", duration: "25 min", exercises: ["shoulder-isometric-abduction","shoulder-wall-slides","shoulder-doorway-stretch"], _seed: { completed: false } },
    { id: "ms-w2-s3", weekNumber: 2, day: "Friday",    label: "Session 3", duration: "30 min", exercises: ["shoulder-pendulum","shoulder-isometric-abduction","shoulder-wall-slides"],          _seed: { completed: false } },
    // Week 3
    { id: "ms-w3-s1", weekNumber: 3, day: "Monday",    label: "Session 1", duration: "30 min", exercises: ["shoulder-external-rotation","shoulder-isometric-abduction","shoulder-wall-slides"] },
    { id: "ms-w3-s2", weekNumber: 3, day: "Wednesday", label: "Session 2", duration: "30 min", exercises: ["shoulder-pendulum","shoulder-external-rotation","shoulder-doorway-stretch"] },
    { id: "ms-w3-s3", weekNumber: 3, day: "Friday",    label: "Session 3", duration: "35 min", exercises: ["shoulder-external-rotation","shoulder-wall-slides","shoulder-isometric-abduction"] },
    // Week 4
    { id: "ms-w4-s1", weekNumber: 4, day: "Monday",    label: "Session 1", duration: "35 min", exercises: ["shoulder-theraband-row","shoulder-external-rotation","shoulder-wall-slides"] },
    { id: "ms-w4-s2", weekNumber: 4, day: "Wednesday", label: "Session 2", duration: "35 min", exercises: ["shoulder-theraband-row","shoulder-external-rotation","shoulder-doorway-stretch"] },
    { id: "ms-w4-s3", weekNumber: 4, day: "Friday",    label: "Session 3", duration: "35 min", exercises: ["shoulder-theraband-row","shoulder-wall-slides","shoulder-external-rotation"] },
  ],

  goals: [
    "Regain full active shoulder range of motion",
    "Return to overhead activities without pain",
    "Reduce resting pain to 0–1/10 by end of week 4",
  ],

  milestones: [
    { week: 1, label: "Complete all 3 mobility sessions",            achieved: true  },
    { week: 2, label: "Active flexion reaches 120° pain-free",       achieved: false },
    { week: 3, label: "Tolerate light band resistance without pain", achieved: false },
    { week: 4, label: "Overhead reach cleared for daily activities", achieved: false },
  ],

  coachNotes: [
    { date: "2026-03-09", title: "Week 2 update",  body: "Good work last week — the pendulums are already improving your passive range. This week we are adding the isometric holds to gently wake up the rotator cuff. Go slowly with these. If you feel pain above 5/10 on any exercise, skip that exercise and let me know at your next appointment." },
    { date: "2026-03-02", title: "Program start",  body: "Welcome to your shoulder recovery program, Maria. The first two weeks are all about mobility — we are not loading the shoulder heavily yet. Focus on consistency: gentle movement twice a day is more effective than one intense session. Warmth before (warm shower or heat pack) and ice after (10 minutes) is recommended." },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT: David Park  —  mode: "ongoing_coaching"
// Chronic knee pain management — ongoing monthly coaching
//
// ongoing_coaching mode:
//   - No fixed program end. Coach adds sessions / weeks as the client progresses.
//   - No completion percentage ring — progress shown as trend + streak.
//   - Plan view shows a rolling window around the current week.
//   - "Program complete" state never fires — coach assigns next phase instead.
//   - Assessments record periodic reassessment checkpoints.
//
// Activate in index.html: uncomment this <script> tag, comment out others.
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_CONFIG = {
  appName:     "Mr Pain PT",
  accentColor: "#d97706",    // amber — distinguishes coaching mode visually
  logoText:    "MP",

  client: {
    firstName:       "David",
    lastName:        "Park",
    age:             45,
    condition:       "Chronic knee pain management",
    conditionDetail: "Patellofemoral pain syndrome — ongoing load management",
    startDate:       "2025-08-04",
  },

  coach: {
    name:        "Marcus Reid",
    credentials: "DPT, CSCS",
    contactNote: "Book your monthly check-in via the client portal. Urgent queries: use the chat.",
  },

  disclaimer:
    "This coaching program is designed to support your long-term knee health and pain management. It does not constitute medical advice or replace medical evaluation. If you experience new or worsening symptoms, significant swelling, locking of the knee, or any symptom that concerns you, stop and seek medical attention. This is a coach-led program — your coach sets and adjusts your sessions over time.",
};

const PROGRAM = {
  id:          "david-park-ongoing-2025",
  mode:        "ongoing_coaching",   // no fixed end — coach extends as needed
  currentWeek: 8,                    // updated by coach each month

  access: {
    type:   "subscription",          // monthly coaching subscription
    status: "active",
  },

  // No phases array — ongoing coaching is phase-free; coach adjusts focus week by week.
  // Weeks are plain focus labels.
  weeks: [
    { weekNumber: 1,  focus: "Baseline assessment — pain mapping and load tolerance" },
    { weekNumber: 2,  focus: "Low-load activation, pain education" },
    { weekNumber: 3,  focus: "Glute and hip activation" },
    { weekNumber: 4,  focus: "Progressive loading — introduce step-up" },
    { weekNumber: 5,  focus: "Build step-up volume, add balance work" },
    { weekNumber: 6,  focus: "Monthly reassessment — adjust program" },
    { weekNumber: 7,  focus: "Introduce terminal knee extension" },
    { weekNumber: 8,  focus: "Volume maintenance — current week" },
    // Coach will add weeks 9+ as David progresses
  ],

  outcomes: {
    pain: {
      baseline: 6,
      target:   2,
      unit:     "NRS 0–10 — worst pain in past week",
    },
    rom: {
      baseline: "Full",
      target:   "Full",
      unit:     "No ROM deficit — load tolerance is the primary outcome",
    },
    strength: {
      baseline: "4/5",
      target:   "5/5",
      unit:     "manual muscle test — VMO / quad",
    },
    readiness: {
      label:   "Return to running 5 km pain-free",
      cleared: false,
    },
  },

  // Reassessments recorded by coach at monthly check-ins
  assessments: [
    {
      id:             "assess-month-1",
      weekNumber:     4,
      date:           "2025-09-01",
      painRating:     5,
      romMeasurement: "Full",
      strengthRating: "4/5",
      notes:          "Responding well to low-load work. Stairs are easier. Cleared to progress to step-up.",
      cleared:        true,
    },
    {
      id:             "assess-month-2",
      weekNumber:     8,
      date:           "2025-10-06",
      painRating:     3,
      romMeasurement: "Full",
      strengthRating: "4+/5",
      notes:          "Good trend. Pain on stairs down from 5 to 3. Adding TKE this month. Discuss running timeline.",
      cleared:        true,
    },
  ],

  // Sessions — coach adds to this list over time. No hard end week.
  sessions: [
    // Weeks 1–2 (completed history)
    { id: "dp-w1-s1", weekNumber: 1, day: "Tuesday",   label: "Session 1", duration: "30 min", exercises: ["quad-sets","ankle-pumps","glute-bridge"],                     _seed: { completed: true, painRating: 6, effortRating: 2 } },
    { id: "dp-w1-s2", weekNumber: 1, day: "Thursday",  label: "Session 2", duration: "30 min", exercises: ["quad-sets","clamshell","glute-bridge"],                       _seed: { completed: true, painRating: 5, effortRating: 2 } },
    { id: "dp-w2-s1", weekNumber: 2, day: "Tuesday",   label: "Session 1", duration: "35 min", exercises: ["quad-sets","glute-bridge","clamshell"],                       _seed: { completed: true, painRating: 5, effortRating: 3 } },
    { id: "dp-w2-s2", weekNumber: 2, day: "Thursday",  label: "Session 2", duration: "35 min", exercises: ["straight-leg-raise","glute-bridge","hip-flexor-stretch"],     _seed: { completed: true, painRating: 5, effortRating: 3 } },
    // Weeks 3–4
    { id: "dp-w3-s1", weekNumber: 3, day: "Tuesday",   label: "Session 1", duration: "35 min", exercises: ["straight-leg-raise","clamshell","glute-bridge"],              _seed: { completed: true, painRating: 4, effortRating: 3 } },
    { id: "dp-w3-s2", weekNumber: 3, day: "Thursday",  label: "Session 2", duration: "35 min", exercises: ["glute-bridge","clamshell","hip-flexor-stretch"],              _seed: { completed: true, painRating: 4, effortRating: 3 } },
    { id: "dp-w4-s1", weekNumber: 4, day: "Tuesday",   label: "Session 1", duration: "40 min", exercises: ["step-up","glute-bridge","single-leg-balance"],               _seed: { completed: true, painRating: 5, effortRating: 3 } },
    { id: "dp-w4-s2", weekNumber: 4, day: "Thursday",  label: "Session 2", duration: "40 min", exercises: ["step-up","clamshell","glute-bridge"],                        _seed: { completed: true, painRating: 4, effortRating: 4 } },
    // Weeks 5–6
    { id: "dp-w5-s1", weekNumber: 5, day: "Tuesday",   label: "Session 1", duration: "40 min", exercises: ["step-up","single-leg-balance","glute-bridge"],               _seed: { completed: true, painRating: 4, effortRating: 4 } },
    { id: "dp-w5-s2", weekNumber: 5, day: "Thursday",  label: "Session 2", duration: "40 min", exercises: ["step-up","clamshell","hip-flexor-stretch"],                  _seed: { completed: true, painRating: 3, effortRating: 4 } },
    { id: "dp-w6-s1", weekNumber: 6, day: "Tuesday",   label: "Session 1", duration: "40 min", exercises: ["step-up","single-leg-balance","lateral-band-walk"],          _seed: { completed: true, painRating: 3, effortRating: 4 } },
    { id: "dp-w6-s2", weekNumber: 6, day: "Thursday",  label: "Session 2", duration: "40 min", exercises: ["glute-bridge","clamshell","single-leg-balance"],             _seed: { completed: true, painRating: 3, effortRating: 3 } },
    // Weeks 7–8
    { id: "dp-w7-s1", weekNumber: 7, day: "Tuesday",   label: "Session 1", duration: "45 min", exercises: ["terminal-knee-ext","step-up","single-leg-balance"],          _seed: { completed: true, painRating: 3, effortRating: 4 } },
    { id: "dp-w7-s2", weekNumber: 7, day: "Thursday",  label: "Session 2", duration: "45 min", exercises: ["terminal-knee-ext","lateral-band-walk","glute-bridge"],      _seed: { completed: true, painRating: 2, effortRating: 4 } },
    // Week 8 — current (some done, some upcoming)
    { id: "dp-w8-s1", weekNumber: 8, day: "Tuesday",   label: "Session 1", duration: "45 min", exercises: ["terminal-knee-ext","step-up","lateral-band-walk"],           _seed: { completed: true, painRating: 3, effortRating: 4 } },
    { id: "dp-w8-s2", weekNumber: 8, day: "Thursday",  label: "Session 2", duration: "45 min", exercises: ["terminal-knee-ext","single-leg-balance","glute-bridge"],     _seed: { completed: false } },
    // Week 9 — coach has planned ahead (no seed — client hasn't done these yet)
    { id: "dp-w9-s1", weekNumber: 9, day: "Tuesday",   label: "Session 1", duration: "45 min", exercises: ["terminal-knee-ext","lateral-band-walk","single-leg-balance"] },
    { id: "dp-w9-s2", weekNumber: 9, day: "Thursday",  label: "Session 2", duration: "45 min", exercises: ["terminal-knee-ext","step-up","glute-bridge"] },
  ],

  goals: [
    "Reduce knee pain on stairs to ≤2/10",
    "Tolerate 30-minute walk without pain flare-up",
    "Return to running 5 km — timeline to be set at month 3 reassessment",
    "Maintain pain-free daily activity long-term",
  ],

  milestones: [
    { week: 4,  label: "Pain on stairs ≤4/10",                      achieved: true  },
    { week: 8,  label: "Single-leg balance 30 s — involved side",    achieved: false },
    { week: 12, label: "Pain on stairs ≤2/10",                      achieved: false },
    { week: 16, label: "Return to running clearance",                achieved: false },
  ],

  coachNotes: [
    { date: "2025-10-06", title: "Month 2 reassessment",  body: "Pain trend is heading in the right direction — down from 6 to 3 on your worst days. We are adding terminal knee extension this block to continue building VMO strength. Let's reassess running prep at the end of month 3. Keep up the glute work at home." },
    { date: "2025-09-01", title: "Month 1 reassessment",  body: "Good start. Stairs were a 6 at baseline and now tracking closer to 4. Cleared you for step-up progressions. The key thing now is consistency — two sessions per week minimum. We will check on your single-leg balance progress next month." },
    { date: "2025-08-04", title: "Coaching program start", body: "Welcome, David. We are starting with low-load activation to build the hip and glute foundation — this is what takes load off the patellofemoral joint long-term. The exercises look simple but do not underestimate them. Check in after your first week." },
  ],
};

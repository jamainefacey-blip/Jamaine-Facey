// ─────────────────────────────────────────────────────────────────────────────
// CLIENT: Sarah Thompson  —  mode: "multi_week"
// 12-week ACL reconstruction rehabilitation
//
// Activate in index.html: uncomment this <script> tag, comment out others.
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_CONFIG = {
  appName:     "Mr Pain PT",
  accentColor: "#0d9488",
  logoText:    "MP",

  client: {
    firstName:       "Sarah",
    lastName:        "Thompson",
    age:             42,
    condition:       "Post-surgical knee rehabilitation",
    conditionDetail: "ACL reconstruction — 8 weeks post-operative",
    startDate:       "2026-01-27",
  },

  coach: {
    name:        "Marcus Reid",
    credentials: "DPT, CSCS",
    contactNote: "Message via the clinic portal for questions. Emergency: call your surgeon.",
  },

  disclaimer:
    "This program has been designed by your licensed physiotherapist to support your ACL rehabilitation. It does not constitute medical advice or replace your in-clinic treatment. Stop all exercise immediately and contact your surgeon if you experience excessive swelling, increasing pain, fever, redness, warmth near the incision, giving-way of the knee, or any other concern.",
};

const PROGRAM = {
  id:          "sarah-acl-rehab-2026",
  mode:        "multi_week",   // "one_off" | "multi_week" | "ongoing_coaching"
  currentWeek: 3,

  // access — structure for future entitlement / payment layer
  access: {
    type:   "complimentary",      // "one_off_purchase" | "subscription" | "complimentary" | "trial"
    status: "active",             // "active" | "expired" | "pending"
  },

  phases: [
    { id: 1, label: "Phase 1 — Activation & ROM",      weeks: "1–4",  focus: "Re-establish neuromuscular control, reduce swelling, restore basic range of motion.", color: "#0d9488" },
    { id: 2, label: "Phase 2 — Strength & Stability",   weeks: "5–8",  focus: "Progressive loading of the quad and hip complex. Single-leg stability work.",         color: "#2563eb" },
    { id: 3, label: "Phase 3 — Functional Loading",     weeks: "9–12", focus: "Return-to-activity patterns, endurance, and final clearance assessment.",              color: "#7c3aed" },
  ],

  weeks: [
    { weekNumber: 1,  phaseId: 1, focus: "Early activation, swelling management" },
    { weekNumber: 2,  phaseId: 1, focus: "Weight-bearing progression, ROM gains" },
    { weekNumber: 3,  phaseId: 1, focus: "Add terminal knee extension, continue ROM" },
    { weekNumber: 4,  phaseId: 1, focus: "Consolidate Phase 1 — prepare for Phase 2" },
    { weekNumber: 5,  phaseId: 2, focus: "Introduce weight-bearing strength work" },
    { weekNumber: 6,  phaseId: 2, focus: "Progressive strength and stability" },
    { weekNumber: 7,  phaseId: 2, focus: "Progressive strength and stability" },
    { weekNumber: 8,  phaseId: 2, focus: "Strength peak — prepare Phase 3 transition" },
    { weekNumber: 9,  phaseId: 3, focus: "Functional loading and return-to-activity" },
    { weekNumber: 10, phaseId: 3, focus: "Functional loading and return-to-activity" },
    { weekNumber: 11, phaseId: 3, focus: "Sport-specific prep and endurance" },
    { weekNumber: 12, phaseId: 3, focus: "Final clearance and maintenance planning" },
  ],

  // ── Outcome baselines and targets ─────────────────────────────────────────
  outcomes: {
    pain: {
      baseline: 6,          // pain at program start (0–10)
      target:   1,
      unit:     "NRS 0–10",
    },
    rom: {
      baseline: "90°",      // ROM at program start
      target:   "Full",
      unit:     "active knee flexion",
    },
    strength: {
      baseline: "3/5",
      target:   "5/5",
      unit:     "manual muscle test — quad",
    },
    readiness: {
      label:   "Return to recreational hiking",
      cleared: false,
    },
  },

  // ── Reassessment checkpoints ───────────────────────────────────────────────
  assessments: [
    {
      id:           "assess-week-4",
      weekNumber:   4,
      date:         "2026-02-24",
      painRating:   3,
      romMeasurement: "115°",
      strengthRating: "4/5",
      notes:        "Good Phase 1 progress. ROM ahead of schedule. Cleared for Phase 2.",
      cleared:      true,
    },
  ],

  // ── Sessions (flat list — grouped by weekNumber in the UI) ────────────────
  sessions: [
    // Week 1
    { id: "w1-s1", weekNumber: 1, phaseId: 1, day: "Monday",    label: "Session 1", duration: "20 min", exercises: ["quad-sets","heel-slides","ankle-pumps"],        _seed: { completed: true, painRating: 2, effortRating: 2 } },
    { id: "w1-s2", weekNumber: 1, phaseId: 1, day: "Wednesday", label: "Session 2", duration: "20 min", exercises: ["quad-sets","heel-slides","ankle-pumps"],        _seed: { completed: true, painRating: 3, effortRating: 2 } },
    { id: "w1-s3", weekNumber: 1, phaseId: 1, day: "Friday",    label: "Session 3", duration: "25 min", exercises: ["quad-sets","heel-slides","straight-leg-raise"], _seed: { completed: true, painRating: 2, effortRating: 3 } },
    // Week 2
    { id: "w2-s1", weekNumber: 2, phaseId: 1, day: "Monday",    label: "Session 1", duration: "25 min", exercises: ["quad-sets","straight-leg-raise","heel-slides"],   _seed: { completed: true, painRating: 2, effortRating: 3 } },
    { id: "w2-s2", weekNumber: 2, phaseId: 1, day: "Wednesday", label: "Session 2", duration: "25 min", exercises: ["straight-leg-raise","heel-slides","ankle-pumps"], _seed: { completed: true, painRating: 2, effortRating: 3 } },
    { id: "w2-s3", weekNumber: 2, phaseId: 1, day: "Friday",    label: "Session 3", duration: "30 min", exercises: ["quad-sets","straight-leg-raise","heel-slides"],   _seed: { completed: true, painRating: 1, effortRating: 4 } },
    // Week 3 — current
    { id: "w3-s1", weekNumber: 3, phaseId: 1, day: "Monday",    label: "Session 1", duration: "30 min", exercises: ["quad-sets","straight-leg-raise","terminal-knee-ext"],  _seed: { completed: true, painRating: 2, effortRating: 4 } },
    { id: "w3-s2", weekNumber: 3, phaseId: 1, day: "Wednesday", label: "Session 2", duration: "30 min", exercises: ["straight-leg-raise","terminal-knee-ext","heel-slides"], _seed: { completed: false } },
    { id: "w3-s3", weekNumber: 3, phaseId: 1, day: "Friday",    label: "Session 3", duration: "35 min", exercises: ["quad-sets","terminal-knee-ext","straight-leg-raise"],   _seed: { completed: false } },
    // Week 4
    { id: "w4-s1", weekNumber: 4, phaseId: 1, day: "Monday",    label: "Session 1", duration: "35 min", exercises: ["straight-leg-raise","terminal-knee-ext","heel-slides"] },
    { id: "w4-s2", weekNumber: 4, phaseId: 1, day: "Wednesday", label: "Session 2", duration: "35 min", exercises: ["quad-sets","straight-leg-raise","terminal-knee-ext"] },
    { id: "w4-s3", weekNumber: 4, phaseId: 1, day: "Friday",    label: "Session 3", duration: "40 min", exercises: ["straight-leg-raise","terminal-knee-ext","heel-slides"] },
    // Week 5
    { id: "w5-s1", weekNumber: 5, phaseId: 2, day: "Monday",    label: "Session 1", duration: "40 min", exercises: ["mini-squat","terminal-knee-ext","single-leg-balance"] },
    { id: "w5-s2", weekNumber: 5, phaseId: 2, day: "Wednesday", label: "Session 2", duration: "40 min", exercises: ["step-up","mini-squat","single-leg-balance"] },
    { id: "w5-s3", weekNumber: 5, phaseId: 2, day: "Friday",    label: "Session 3", duration: "40 min", exercises: ["mini-squat","step-up","terminal-knee-ext"] },
    // Weeks 6–8 (generated)
    ...([6,7,8].flatMap(wk => ["Monday","Wednesday","Friday"].map((day,i) => ({
      id: `w${wk}-s${i+1}`, weekNumber: wk, phaseId: 2, day, label: `Session ${i+1}`,
      duration: "45 min", exercises: ["step-up","single-leg-balance","lateral-band-walk"],
    })))),
    // Weeks 9–12 (generated)
    ...([9,10,11,12].flatMap(wk => ["Monday","Wednesday","Friday"].map((day,i) => ({
      id: `w${wk}-s${i+1}`, weekNumber: wk, phaseId: 3, day, label: `Session ${i+1}`,
      duration: "50 min", exercises: ["wall-squat","lateral-band-walk","single-leg-balance"],
    })))),
  ],

  goals: [
    "Restore full range of motion in the left knee",
    "Rebuild quad and hamstring strength to ≥90% of the uninjured side",
    "Return to recreational hiking pain-free by week 10",
    "Return to light jogging by week 12 pending clearance",
  ],

  milestones: [
    { week: 2,  label: "Full weight-bearing without crutches",       achieved: true  },
    { week: 4,  label: "0–90° active range of motion",               achieved: true  },
    { week: 6,  label: "Single-leg stance 30 s without support",     achieved: false },
    { week: 8,  label: "Step-up / step-down without compensation",   achieved: false },
    { week: 10, label: "Return to hiking on flat terrain",            achieved: false },
    { week: 12, label: "Light jogging clearance assessment",         achieved: false },
  ],

  coachNotes: [
    { date: "2026-03-10", title: "Week 3 check-in",      body: "Great progress on the quad sets and heel slides. Range of motion is improving steadily. Focus on keeping the knee tracking straight during step-ups — avoid letting it cave inward. Ice for 15 min after each session if there is any swelling." },
    { date: "2026-03-03", title: "Week 2 progress note", body: "You are now fully weight-bearing, which is ahead of schedule. That is a great sign. Keep the compression sleeve on during sessions and elevate after. Gait is looking good — keep those steps slow and controlled." },
    { date: "2026-01-27", title: "Program start",        body: "Welcome to your ACL rehab program, Sarah. We are starting with low-load activation work to re-establish neuromuscular control. Do not rush through the early phases — this foundation will determine long-term outcomes. Reach out anytime via the clinic portal." },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT: James Chen  —  mode: "one_off"
// Day-3 post-operative home exercise session (meniscus repair)
//
// one_off mode: A single prescribed session with no multi-week scaffolding.
// The client opens the app, sees exactly what to do, does it, and is done.
//
// This example demonstrates:
//   - Rich coach notes with safety instructions
//   - Goals and recovery milestones
//   - Proper one_off session structure (no weekNumber, no phases)
//   - Access type: one_off_purchase (paid single session)
//   - Post-operative safety precautions in every exercise
//
// Activate via URL: index.html?client=james-chen
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_CONFIG = {
  appName:     "Mr Pain PT",
  accentColor: "#0891b2",   // cyan — post-op calm / clinical feel
  logoText:    "MP",

  client: {
    firstName:       "James",
    lastName:        "Chen",
    age:             35,
    condition:       "Post-operative home care",
    conditionDetail: "Meniscus repair (medial) — Day 3 post-operative",
    startDate:       "2026-03-13",
  },

  coach: {
    name:        "Dr. Sarah Liu",
    credentials: "DPT, OCS",
    contactNote: "Any concerns: call the clinic on 0800-MRPAIN or message via the patient portal. For emergencies call 999.",
  },

  disclaimer:
    "These exercises have been prescribed specifically for your post-operative recovery by your physiotherapist. This app supports your therapist's instructions and does not replace medical advice. Stop all exercise immediately and contact your surgeon or therapist if you experience: excessive swelling, increasing pain beyond 5/10, fever, redness or warmth around the incision, wound leakage, or any other concern. Follow all post-operative precautions provided by your surgical team at all times.",
};

const PROGRAM = {
  id:   "james-day3-home",
  mode: "one_off",    // "one_off" | "multi_week" | "ongoing_coaching"

  access: {
    type:   "one_off_purchase",
    status: "active",
    // status options: "active" | "expired" | "suspended" | "pending"
  },

  // ── The single session to display ─────────────────────────────────────────
  // one_off programs have one session at the top level (no sessions array).
  // weekNumber is omitted — one_off sessions exist independently of weeks.
  session: {
    id:        "james-day3-home-session",
    label:     "Day 3 Home Exercises",
    day:       "Today",
    duration:  "15–20 min",

    // All exercise IDs must exist in EXERCISE_LIBRARY
    exercises: [
      "ankle-pumps",         // circulation — critical day 3 post-op
      "quad-sets",           // early quad activation — no joint compression
      "heel-slides",         // restore ROM — pain-free range only
      "knee-to-chest-stretch", // gentle hip and glute mobility
    ],
  },

  // outcomes not tracked in one_off mode but kept for schema consistency
  outcomes:    null,
  assessments: [],

  goals: [
    "Complete day 3 exercises once in the morning and once in the evening",
    "Keep swelling controlled — ice for 10 min after each session",
    "Maintain comfortable range of motion within pain-free limits",
    "Prepare for week 1 physiotherapy appointment",
  ],

  milestones: [
    { week: null, label: "Day 3 exercises completed both sessions",          achieved: false },
    { week: null, label: "Pain at rest ≤ 3/10 by day 5",                   achieved: false },
    { week: null, label: "Week 1 physio appointment attended",              achieved: false },
  ],

  coachNotes: [
    {
      date:  "2026-03-13",
      title: "Your day 3 instructions — read before starting",
      body:  "James, these four exercises are your priority today and tonight. Do all four twice daily — once in the morning and once in the evening. They are gentle by design: on day 3 we are focused on circulation, swelling control, and preventing the quad from switching off (which happens quickly after knee surgery). Do not push through discomfort above 3/10. If ankle pumps cause calf pain, stop immediately and call us.",
    },
    {
      date:  "2026-03-13",
      title: "Ice and elevation protocol",
      body:  "After EVERY exercise session: ice the knee for 10 minutes with a cloth between the ice pack and your skin. Keep your leg elevated above heart level when resting — prop it on pillows. This is the most effective thing you can do right now to control swelling. Swelling is normal, but significant increases in swelling or a tight, hot feeling around the knee should prompt you to call the clinic.",
    },
    {
      date:  "2026-03-13",
      title: "When to call us",
      body:  "Call immediately if: pain exceeds 6/10 and does not reduce with rest, you notice increasing redness or warmth around the incision, the wound is leaking, you develop a fever above 38°C, or you feel significant calf pain or tightness (this can indicate a DVT which requires urgent assessment). Your week 1 appointment is already booked — we will progress your exercise program at that appointment. Well done for taking the first step.",
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT: James Chen  —  mode: "single-instruction"
// Day-3 post-op home exercise session (meniscus repair)
//
// single-instruction mode: One session only. No plan view, no progress history.
// The client opens the app and sees exactly what to do today.
//
// To activate this client, ensure this file is loaded in index.html (uncomment
// the corresponding <script> tag and comment out the others).
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_CONFIG = {
  appName:     "Pain System Rehab",
  accentColor: "#0891b2",   // teal-blue
  logoText:    "PS",

  client: {
    firstName:       "James",
    lastName:        "Chen",
    age:             35,
    condition:       "Post-operative home care",
    conditionDetail: "Meniscus repair — Day 3 post-operative",
    startDate:       "2026-03-13",
  },

  coach: {
    name:        "Dr. Sarah Liu",
    credentials: "DPT, OCS",
    contactNote: "Contact your surgeon or therapist with any concerns. Emergency: call 911.",
  },

  disclaimer:
    "These exercises have been prescribed specifically for your post-operative recovery. This app supports your therapist's instructions and does not replace medical advice. Stop all exercise immediately and contact your surgeon if you experience excessive swelling, increasing pain, fever, redness, warmth around the incision, or any other concern. Follow all post-operative precautions provided by your surgical team.",
};

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM
// ─────────────────────────────────────────────────────────────────────────────

const PROGRAM = {
  id:   "james-day3-home",
  mode: "single-instruction",   // single session — no plan, no progress views

  // The one session to display
  session: {
    id:        "day3-home-session",
    label:     "Day 3 Home Exercises",
    day:       "Today",
    duration:  "15 min",
    exercises: ["ankle-pumps", "quad-sets", "heel-slides"],
  },

  // Brief notes visible on welcome / session screens
  coachNotes: [
    {
      date:  "2026-03-13",
      title: "Instructions from Dr. Liu",
      body:  "Complete these three exercises once today and once tonight before bed. Keep your leg elevated when resting. Ice for 10 minutes after each session. Do not put full weight on the leg without your crutches. If swelling increases significantly or pain is above 6/10, call the clinic.",
    },
  ],
};

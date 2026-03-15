// ─────────────────────────────────────────────────────────────────────────────
// CLIENT CONFIGURATION
// Edit this file to white-label the app for a new client.
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_CONFIG = {
  // ── Branding ───────────────────────────────────────────────────────────────
  appName: "Pain System Rehab",
  accentColor: "#0d9488",      // CSS hex — change for brand color
  logoText: "PS",              // Initials shown in header until a logo is added

  // ── Client profile ─────────────────────────────────────────────────────────
  client: {
    firstName: "Sarah",
    lastName: "Thompson",
    age: 42,
    condition: "Post-surgical knee rehabilitation",
    conditionDetail: "ACL reconstruction — 8 weeks post-operative",
    startDate: "2026-01-27",
    programWeeks: 12,
    currentWeek: 3,
  },

  // ── Coach ──────────────────────────────────────────────────────────────────
  coach: {
    name: "Marcus Reid",
    credentials: "DPT, CSCS",
    contactNote: "Message your coach through the clinic portal for questions.",
  },

  // ── Program goals ──────────────────────────────────────────────────────────
  goals: [
    "Restore full range of motion in the left knee",
    "Rebuild quad and hamstring strength to at least 90 % of the uninjured side",
    "Return to recreational hiking pain-free by week 10",
    "Return to light jogging by week 12 pending clearance",
  ],

  // ── Milestones ─────────────────────────────────────────────────────────────
  milestones: [
    { week: 2,  label: "Full weight-bearing without crutches",      achieved: true  },
    { week: 4,  label: "0–90° active range of motion",              achieved: true  },
    { week: 6,  label: "Single-leg stance 30 s without support",    achieved: false },
    { week: 8,  label: "Step-up / step-down without compensation",   achieved: false },
    { week: 10, label: "Return to hiking on flat terrain",          achieved: false },
    { week: 12, label: "Light jogging clearance assessment",        achieved: false },
  ],

  // ── Coach notes for the client ─────────────────────────────────────────────
  coachNotes: [
    {
      date: "2026-03-10",
      title: "Week 3 check-in",
      body: "Great progress on the quad sets and heel slides this week. Range of motion is improving steadily. Focus on keeping the knee tracking straight during step-ups — avoid letting it cave inward. Ice for 15 min after each session if there is any swelling.",
    },
    {
      date: "2026-03-03",
      title: "Week 2 progress note",
      body: "You are now fully weight-bearing, which is ahead of schedule. That is a great sign. Keep the compression sleeve on during sessions and elevate after. Gait is looking good — keep those steps slow and controlled.",
    },
    {
      date: "2026-01-27",
      title: "Program start",
      body: "Welcome to your ACL rehab program, Sarah. We are starting with low-load activation work to re-establish neuromuscular control. Do not rush through the early phases — this foundation will determine long-term outcomes. Reach out anytime via the clinic portal.",
    },
  ],

  // ── Safety / disclaimer text (edit with care) ──────────────────────────────
  disclaimer:
    "This app provides coach-guided exercise programming to support your rehabilitation journey. It does not constitute medical advice, diagnosis, or treatment. Always follow the guidance of your licensed healthcare provider. Stop exercising and contact your doctor or therapist immediately if you experience unusual pain, sharp discomfort, sudden swelling, numbness, or any symptom that concerns you. Individual results vary and no specific recovery outcome is guaranteed.",
};

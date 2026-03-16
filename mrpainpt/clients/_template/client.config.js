// ─────────────────────────────────────────────────────────────────────────────
// MR PAIN PT — CLIENT CONFIGURATION TEMPLATE
//
// HOW TO USE THIS TEMPLATE
// ────────────────────────
// 1. Duplicate this entire folder:
//      cp -r mrpainpt/clients/_template mrpainpt/clients/<client-slug>
//      Example: cp -r mrpainpt/clients/_template mrpainpt/clients/jane-doe
//
// 2. Edit every field marked with ← EDIT in this file.
//
// 3. Edit plan.js to build the client's session schedule.
//
// 4. Edit exercises.js if the client needs exercises beyond the shared library.
//
// 5. Update client.meta.json with the client's registry metadata.
//
// 6. In Phase 4+, this config will be loaded by the API rather than
//    copied into apps/client/scripts/data/. For now it is the canonical
//    source of truth that is manually synced to the deployment artifact.
//
// IMPORTANT — Do not remove the disclaimer field. Shorten or reword it
// only with legal/clinical review.
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_CONFIG = {

  // ── Branding ──────────────────────────────────────────────────────────────
  // These values control the visual theme of the client app.
  // accentColor accepts any valid CSS hex colour.
  // logoText is shown in the header until a logo image is added.

  appName:     "EDIT — e.g. Pain System Rehab",   // ← EDIT: shown in browser tab + header
  accentColor: "#0d9488",                          // ← EDIT: brand hex colour
  logoText:    "PS",                               // ← EDIT: 2–3 initials shown in header

  // ── Client profile ────────────────────────────────────────────────────────
  // currentWeek should be updated each week of the program.
  // startDate must be ISO format: YYYY-MM-DD.

  client: {
    firstName:       "EDIT",                                    // ← EDIT
    lastName:        "EDIT",                                    // ← EDIT
    age:             0,                                         // ← EDIT
    condition:       "EDIT — e.g. Post-surgical knee rehab",    // ← EDIT
    conditionDetail: "EDIT — e.g. ACL reconstruction, 8 weeks post-op", // ← EDIT
    startDate:       "YYYY-MM-DD",                              // ← EDIT
    programWeeks:    12,                                        // ← EDIT: total weeks in program
    currentWeek:     1,                                         // ← UPDATE weekly
  },

  // ── Coach ─────────────────────────────────────────────────────────────────
  // contactNote is shown to the client on the overview and notes screens.

  coach: {
    name:        "EDIT — Full Name",             // ← EDIT
    credentials: "EDIT — e.g. DPT, CSCS",        // ← EDIT
    contactNote: "EDIT — how should the client contact the coach?", // ← EDIT
  },

  // ── Program goals ─────────────────────────────────────────────────────────
  // 3–5 goals work well. These are displayed on the client overview screen.

  goals: [
    "EDIT — First program goal",   // ← EDIT
    "EDIT — Second program goal",  // ← EDIT
    "EDIT — Third program goal",   // ← EDIT
  ],

  // ── Milestones ────────────────────────────────────────────────────────────
  // Milestones are keyed to a program week.
  // Set achieved: true for milestones the client has already passed.
  // These are displayed on the dashboard as a progress checklist.

  milestones: [
    { week: 2,  label: "EDIT — Early milestone description",   achieved: false }, // ← EDIT
    { week: 4,  label: "EDIT — Mid-early milestone",           achieved: false }, // ← EDIT
    { week: 6,  label: "EDIT — Mid-program milestone",         achieved: false }, // ← EDIT
    { week: 8,  label: "EDIT — Late-program milestone",        achieved: false }, // ← EDIT
    { week: 12, label: "EDIT — Program completion milestone",  achieved: false }, // ← EDIT
  ],

  // ── Coach notes ───────────────────────────────────────────────────────────
  // Notes are shown in reverse-chronological order on the Coach Notes screen.
  // Add a new object at the top of the array for each new note.
  // date must be ISO format: YYYY-MM-DD.

  coachNotes: [
    // Example — copy this block for each note:
    // {
    //   date:  "YYYY-MM-DD",
    //   title: "Week N check-in",
    //   body:  "Note text here. Be specific, encouraging, and clinically clear.",
    // },
  ],

  // ── Safety disclaimer ─────────────────────────────────────────────────────
  // Displayed at the bottom of every screen.
  // Do not remove. May be reworded with clinical/legal review.

  disclaimer:
    "This app provides coach-guided exercise programming to support your rehabilitation journey. " +
    "It does not constitute medical advice, diagnosis, or treatment. " +
    "Always follow the guidance of your licensed healthcare provider. " +
    "Stop exercising and contact your doctor or therapist immediately if you experience unusual pain, " +
    "sharp discomfort, sudden swelling, numbness, or any symptom that concerns you. " +
    "Individual results vary and no specific recovery outcome is guaranteed.",
};

// AI Lab — Ava/Eva Planning Layer v1
// Converts a plain-text or structured request into queue-ready task metadata.
// Does NOT execute or queue tasks. Output is designed for POST /api/task.
//
// plan(request) → {
//   lane, title, priority, recommendedSkill,
//   approvalRequired, approvalReason, executionNotes,
//   payload, plannedAt, request
// }

"use strict";

// ── Signal tables ─────────────────────────────────────────────────────────────

const LANE_SIGNALS = {
  VST:      [/\bvst\b/i, /travel/i, /trip/i, /booking/i, /flight/i, /hotel/i, /voyage/i, /itinerary/i, /travell?er/i, /destination/i],
  FHI:      [/\bfhi\b/i, /fraud/i, /investigation/i, /refund/i, /chargeback/i, /dispute/i, /scam/i, /card.not.present/i],
  ADMIN:    [/\badmin\b/i, /config(ure)?/i, /policy/i, /maintenance/i, /\bsystem\b/i, /permission/i],
  BACKYARD: [/prototype/i, /sandbox/i, /experiment/i, /\bbackyard\b/i, /spike/i],
  AI_LAB:   [/pipeline/i, /ai.?lab/i, /\bmodel\b/i, /\bskill\b/i, /operator/i, /execution/i, /\bbuild\b/i, /\bdeploy\b/i, /orchestrat/i]
};

const PRIORITY_SIGNALS = {
  high: [/urgent/i, /critical/i, /\basap\b/i, /immediate/i, /high.?priority/i, /emergency/i, /blocking/i],
  low:  [/\blow\b/i, /backlog/i, /whenever/i, /eventually/i, /nice.?to.?have/i, /\bdefer/i]
};

const APPROVAL_SIGNALS = [
  /enterprise/i, /compliance/i, /public.?sector/i, /government/i,
  /\bdelete\b/i, /\bremove\b/i, /production/i, /\brelease\b/i,
  /\bdeploy\b/i, /procurement/i, /tender/i, /high.?value/i
];

const SKILL_SIGNALS = {
  "deep-research":   [/research/i, /analys[ei]s/i, /investigat/i, /findings/i, /report/i, /audit/i, /review/i],
  "build-execution": [/\bbuild\b/i, /execut/i, /\brun\b/i, /\bdeploy\b/i, /workflow/i, /stage/i, /pipeline/i, /process/i]
};

// ── Detection functions ───────────────────────────────────────────────────────

function detectLane(text) {
  // Ordered: more specific lanes checked before AI_LAB fallback
  for (const lane of ["VST", "FHI", "ADMIN", "BACKYARD", "AI_LAB"]) {
    if (LANE_SIGNALS[lane].some(p => p.test(text))) return lane;
  }
  return "AI_LAB";
}

function detectPriority(text) {
  if (PRIORITY_SIGNALS.high.some(p => p.test(text))) return "high";
  if (PRIORITY_SIGNALS.low.some(p => p.test(text))) return "low";
  return "medium";
}

function detectSkill(text) {
  for (const [skill, patterns] of Object.entries(SKILL_SIGNALS)) {
    if (patterns.some(p => p.test(text))) return skill;
  }
  return "task-breakdown";
}

function detectApproval(text, priority) {
  if (priority === "high") return { required: true, reason: "high priority — manual gate required" };
  const hit = APPROVAL_SIGNALS.find(p => p.test(text));
  if (hit) return { required: true, reason: "sensitive signal detected: " + hit.source };
  return { required: false, reason: "standard task — no manual gate required" };
}

// ── Title builder ─────────────────────────────────────────────────────────────

function buildTitle(text, lane) {
  const trimmed = text.replace(/\s+/g, " ").slice(0, 72);
  const suffix  = text.length > 72 ? "…" : "";
  return "[" + lane + "] " + trimmed + suffix;
}

// ── Execution notes ───────────────────────────────────────────────────────────

function buildNotes(lane, skill, priority, approval) {
  const parts = [
    "lane=" + lane,
    "skill=" + skill,
    "priority=" + priority,
    "approval=" + (approval.required ? "REQUIRED — " + approval.reason : "not required")
  ];
  return parts.join(" | ");
}

// ── Payload builder ───────────────────────────────────────────────────────────
// Produces the payload object expected by server-operator.js /api/task.

function buildPayload(text, lane, skill, priority, approval) {
  return {
    source:    "planner-v1",
    request:   text,
    lane,
    skill,
    priority,
    approvalRequired: approval.required,
    plannedAt: new Date().toISOString()
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

function plan(request) {
  const text = String(request || "").trim();
  if (!text) throw new Error("request must not be empty");

  const lane     = detectLane(text);
  const priority = detectPriority(text);
  const skill    = detectSkill(text);
  const approval = detectApproval(text, priority);
  const title    = buildTitle(text, lane);
  const notes    = buildNotes(lane, skill, priority, approval);
  const payload  = buildPayload(text, lane, skill, priority, approval);

  return {
    lane,
    title,
    priority,
    recommendedSkill:  skill,
    approvalRequired:  approval.required,
    approvalReason:    approval.reason,
    executionNotes:    notes,
    payload,
    plannedAt:         new Date().toISOString(),
    request:           text
  };
}

module.exports = { plan };

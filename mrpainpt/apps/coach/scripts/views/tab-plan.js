// ─────────────────────────────────────────────────────────────────────────────
// PLAN TAB  —  #client/:slug/plan
//
// Renders the full 12-week rehab plan from REHAB_PLAN via loadClient().
// Resolves exercise IDs to names from the merged exercise set.
// Session state: completed / upcoming / missed / overdue
// Shows painRating and effortRating where recorded.
// Shows progressionNotes if present on a session (Phase 3: field may be absent).
//
// No fetch. No localStorage writes. Reads plan data only.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── Utility ────────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Exercise map ───────────────────────────────────────────────────────────

  function buildExerciseMap(exercises) {
    var map = {};
    if (Array.isArray(exercises)) {
      exercises.forEach(function (ex) { map[ex.id] = ex; });
    }
    return map;
  }

  // ── Session status ─────────────────────────────────────────────────────────
  // completed  — session.completed === true
  // missed     — past week, not completed
  // overdue    — current week, not completed
  // upcoming   — future week, not yet due

  function sessionStatus(session, weekNumber, currentWeek) {
    if (session.completed) return "completed";
    if (weekNumber < currentWeek)  return "missed";
    if (weekNumber === currentWeek) return "overdue";
    return "upcoming";
  }

  // CSS badge class for each status
  var STATUS_BADGE = {
    completed: "c-badge c-badge--active",
    missed:    "c-badge",
    overdue:   "c-badge c-badge--paused",
    upcoming:  "c-badge c-badge--complete",
  };

  var STATUS_LABEL = {
    completed: "\u2713 Completed",
    missed:    "Missed",
    overdue:   "Overdue",
    upcoming:  "Upcoming",
  };

  // ── Pain / effort label ────────────────────────────────────────────────────

  function painBadge(score) {
    if (score === null || score === undefined) return "";
    var mod = score <= 3 ? "green" : score <= 6 ? "amber" : "red";
    return (
      '<span class="c-pain c-pain--' + mod + '" style="font-size:.75rem;">' +
        '<span class="c-pain__dot" aria-hidden="true"></span>' +
        "Pain\u00a0" + esc(score) + "/10" +
      "</span>"
    );
  }

  function effortBadge(score) {
    if (score === null || score === undefined) return "";
    return (
      '<span class="c-badge" style="font-size:.75rem;">Effort\u00a0' + esc(score) + "/10</span>"
    );
  }

  // ── Single session card ────────────────────────────────────────────────────

  function renderSession(session, exerciseMap, weekNumber, currentWeek) {
    var status = sessionStatus(session, weekNumber, currentWeek);
    var html   = [];

    html.push(
      '<div style="padding:.875rem 1rem;border:1px solid var(--color-border);border-radius:.5rem;' +
        'background:' + (status === "completed" ? "var(--color-surface)" : "var(--color-surface-raised)") + ';">'
    );

    // Row 1: day / label / duration / status badge
    html.push(
      '  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;margin-bottom:.5rem;">' +
        '<div>' +
          '<span style="font-weight:600;font-size:.9375rem;color:var(--color-text);">' + esc(session.day) + "</span>" +
          '<span style="font-size:.8125rem;color:var(--color-text-secondary);margin-left:.5rem;">' +
            esc(session.label) + " \u00b7 " + esc(session.duration) +
          "</span>" +
        "</div>" +
        '<span class="' + STATUS_BADGE[status] + '">' + STATUS_LABEL[status] + "</span>" +
      "</div>"
    );

    // Row 2: pain / effort (if recorded)
    var pb = painBadge(session.painRating);
    var eb = effortBadge(session.effortRating);
    if (pb || eb) {
      html.push(
        '  <div style="display:flex;flex-wrap:wrap;gap:.375rem;margin-bottom:.5rem;">' +
          pb + eb +
        "</div>"
      );
    }

    // Progression notes (optional field — not present in Phase 3 data but handled gracefully)
    if (session.progressionNotes) {
      html.push(
        '  <p style="font-size:.8125rem;color:var(--color-text-secondary);font-style:italic;' +
          'margin-bottom:.5rem;padding-left:.625rem;border-left:2px solid var(--color-brand);">' +
          esc(session.progressionNotes) +
        "</p>"
      );
    }

    // Exercises
    if (Array.isArray(session.exercises) && session.exercises.length > 0) {
      html.push(
        '  <ul style="display:flex;flex-wrap:wrap;gap:.375rem;padding:0;">'
      );
      session.exercises.forEach(function (exId) {
        var ex = exerciseMap[exId];
        var label = ex ? ex.name : exId + " (unresolved)";
        var isUnresolved = !ex;
        html.push(
          '    <li style="list-style:none;">' +
            '<span class="c-badge' + (isUnresolved ? '" style="color:var(--pain-red);"' : '"') + ">" +
              esc(label) +
            "</span>" +
          "</li>"
        );
      });
      html.push("  </ul>");
    }

    html.push("</div>");
    return html.join("\n");
  }

  // ── Phase colour lookup ────────────────────────────────────────────────────

  function phaseColor(phases, phaseId) {
    for (var i = 0; i < phases.length; i++) {
      if (phases[i].id === phaseId) return phases[i].color || "var(--color-brand)";
    }
    return "var(--color-brand)";
  }

  // ── Phase overview cards ───────────────────────────────────────────────────

  function renderPhaseOverview(phases) {
    var html = [];
    html.push(
      '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(15rem,1fr));' +
        'gap:1rem;margin-bottom:2rem;">'
    );
    phases.forEach(function (ph) {
      html.push(
        '<div class="c-card" style="border-top:3px solid ' + esc(ph.color || "var(--color-brand)") + ';">' +
          '<p class="c-stat__label">Weeks ' + esc(ph.weeks) + "</p>" +
          '<p style="font-weight:600;font-size:.9375rem;margin:.25rem 0;">' + esc(ph.label) + "</p>" +
          '<p style="font-size:.8125rem;color:var(--color-text-secondary);line-height:1.5;">' + esc(ph.focus) + "</p>" +
        "</div>"
      );
    });
    html.push("</div>");
    return html.join("\n");
  }

  // ── Single week section ────────────────────────────────────────────────────

  function renderWeek(week, exerciseMap, currentWeek, phases) {
    var html   = [];
    var isCurrent = week.weekNumber === currentWeek;
    var isPast    = week.weekNumber < currentWeek;
    var phColor   = phaseColor(phases, week.phase);

    // Week card header
    html.push(
      '<div class="c-card" style="margin-bottom:1rem;' +
        (isCurrent ? "border-color:var(--color-brand);box-shadow:0 0 0 2px rgba(13,148,136,.15);" : "") +
      '">'
    );

    html.push(
      '  <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem;">' +
        '<div style="display:flex;align-items:center;gap:.625rem;">' +
          '<span style="display:inline-flex;align-items:center;justify-content:center;' +
            'width:2rem;height:2rem;border-radius:50%;background:' + esc(phColor) + ';' +
            'color:#fff;font-size:.75rem;font-weight:700;flex-shrink:0;">' +
            esc(week.weekNumber) +
          "</span>" +
          '<div>' +
            '<span style="font-weight:600;font-size:.9375rem;color:var(--color-text);">Week ' + esc(week.weekNumber) + "</span>" +
            (isCurrent ? ' <span class="c-badge c-badge--active" style="margin-left:.375rem;">Current</span>' : "") +
            (isPast ? ' <span class="c-badge" style="margin-left:.375rem;">Complete</span>' : "") +
          "</div>" +
        "</div>" +
        '<span class="c-badge c-badge--phase-' + esc(week.phase) + '">Phase ' + esc(week.phase) + "</span>" +
      "</div>"
    );

    // Week focus
    if (week.focus) {
      html.push(
        '  <p style="font-size:.875rem;color:var(--color-text-secondary);' +
          'margin-bottom:.75rem;padding-bottom:.75rem;border-bottom:1px solid var(--color-border);">' +
          esc(week.focus) +
        "</p>"
      );
    }

    // Sessions
    if (Array.isArray(week.sessions)) {
      html.push('  <div style="display:flex;flex-direction:column;gap:.5rem;">');
      week.sessions.forEach(function (session) {
        html.push(renderSession(session, exerciseMap, week.weekNumber, currentWeek));
      });
      html.push("  </div>");
    }

    html.push("</div>");
    return html.join("\n");
  }

  // ── Summary stats ──────────────────────────────────────────────────────────

  function renderSummary(plan) {
    var allSessions = [];
    plan.weeks.forEach(function (w) {
      w.sessions.forEach(function (s) { allSessions.push(s); });
    });
    var completed = allSessions.filter(function (s) { return s.completed; }).length;
    var total     = allSessions.length;
    var pct       = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
      '<div class="c-stats-grid" style="margin-bottom:1.5rem;">' +
        '<div class="c-stat"><p class="c-stat__label">Total weeks</p>' +
          '<p class="c-stat__value">' + esc(plan.weeks.length) + "</p></div>" +
        '<div class="c-stat"><p class="c-stat__label">Sessions completed</p>' +
          '<p class="c-stat__value">' + esc(completed) + " / " + esc(total) + "</p></div>" +
        '<div class="c-stat"><p class="c-stat__label">Overall completion</p>' +
          '<p class="c-stat__value">' + esc(pct) + "%</p></div>" +
      "</div>"
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  function render(client) {
    var exerciseMap  = buildExerciseMap(client.exercises);
    var currentWeek  = client.config.client.currentWeek;
    var plan         = client.plan;
    var html         = [];

    html.push(renderSummary(plan));
    html.push(renderPhaseOverview(plan.phases));

    plan.weeks.forEach(function (week) {
      html.push(renderWeek(week, exerciseMap, currentWeek, plan.phases));
    });

    return html.join("\n");
  }

  // ── Self-register ──────────────────────────────────────────────────────────

  window.COACH_TAB_HANDLERS = window.COACH_TAB_HANDLERS || {};
  window.COACH_TAB_HANDLERS["plan"] = function (client) {
    return render(client);
  };

})();

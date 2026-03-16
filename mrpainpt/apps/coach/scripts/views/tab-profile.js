// ─────────────────────────────────────────────────────────────────────────────
// PROFILE TAB  —  #client/:slug/profile
//
// Renders full client profile from CLIENT_CONFIG via loadClient().
// Returns an HTML string; does NOT manipulate the DOM directly.
//
// No fetch. No localStorage writes. No coupling to apps/client/.
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

  function formatDate(iso) {
    if (!iso) return "—";
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  // ── Phase label for currentWeek ────────────────────────────────────────────

  function currentPhaseLabel(client) {
    var cw = client.config.client.currentWeek;
    for (var i = 0; i < client.plan.weeks.length; i++) {
      if (client.plan.weeks[i].weekNumber === cw) {
        var phaseId = client.plan.weeks[i].phase;
        for (var j = 0; j < client.plan.phases.length; j++) {
          if (client.plan.phases[j].id === phaseId) return client.plan.phases[j];
        }
      }
    }
    return null;
  }

  // ── Section: client info stats ─────────────────────────────────────────────

  function renderClientInfo(client) {
    var cl    = client.config.client;
    var phase = currentPhaseLabel(client);
    var html  = [];

    html.push('<div class="c-stats-grid" style="margin-bottom:1.5rem;">');

    var stats = [
      { label: "Full name",      value: esc(cl.firstName) + " " + esc(cl.lastName) },
      { label: "Age",            value: esc(cl.age) + " yrs" },
      { label: "Program start",  value: esc(formatDate(cl.startDate)) },
      { label: "Current week",   value: "Wk\u00a0" + esc(cl.currentWeek) + "\u00a0/\u00a0" + esc(cl.programWeeks) },
    ];

    stats.forEach(function (s) {
      html.push(
        '<div class="c-stat">' +
          '<p class="c-stat__label">' + s.label + "</p>" +
          '<p class="c-stat__value" style="font-size:1.125rem;">' + s.value + "</p>" +
        "</div>"
      );
    });

    html.push("</div>");

    // Condition card
    html.push('<div class="c-card" style="margin-bottom:1.5rem;">');
    html.push('  <p class="c-stat__label" style="margin-bottom:.5rem;">Condition</p>');
    html.push('  <p style="font-weight:600;color:var(--color-text);margin-bottom:.25rem;">' + esc(cl.condition) + "</p>");
    if (cl.conditionDetail) {
      html.push('  <p style="color:var(--color-text-secondary);font-size:.875rem;">' + esc(cl.conditionDetail) + "</p>");
    }
    if (phase) {
      html.push(
        '  <div style="margin-top:.75rem;">' +
          '<span class="c-badge c-badge--phase-' + esc(phase.id) + '">' + esc(phase.label) + "</span>" +
        "</div>"
      );
    }
    html.push("</div>");

    // Accent colour swatch
    if (client.config.accentColor) {
      html.push(
        '<div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.5rem;">' +
          '<div style="width:2rem;height:2rem;border-radius:.375rem;background:' +
            esc(client.config.accentColor) +
          ';border:1px solid var(--color-border);flex-shrink:0;"></div>' +
          '<p style="font-size:.875rem;color:var(--color-text-secondary);">Brand accent: ' +
            '<code style="font-family:var(--font-mono);font-size:.8125rem;">' + esc(client.config.accentColor) + "</code>" +
          "</p>" +
        "</div>"
      );
    }

    return html.join("\n");
  }

  // ── Section: goals ─────────────────────────────────────────────────────────

  function renderGoals(goals) {
    if (!Array.isArray(goals) || goals.length === 0) return "";
    var html = [];
    html.push('<div class="c-card" style="margin-bottom:1.5rem;">');
    html.push('  <h3 class="c-card__title" style="margin-bottom:1rem;">Program Goals</h3>');
    html.push('  <ol style="padding-left:1.25rem;display:flex;flex-direction:column;gap:.5rem;">');
    goals.forEach(function (g) {
      html.push('    <li style="color:var(--color-text);font-size:.9375rem;line-height:1.5;">' + esc(g) + "</li>");
    });
    html.push("  </ol>");
    html.push("</div>");
    return html.join("\n");
  }

  // ── Section: milestones ────────────────────────────────────────────────────

  function renderMilestones(milestones) {
    if (!Array.isArray(milestones) || milestones.length === 0) return "";
    var html = [];
    html.push('<div class="c-card" style="margin-bottom:1.5rem;">');
    html.push('  <h3 class="c-card__title" style="margin-bottom:1rem;">Milestones</h3>');
    html.push('  <div class="c-table-wrap">');
    html.push('    <table class="c-table">');
    html.push('      <thead><tr>');
    html.push('        <th>Week</th><th>Milestone</th><th>Status</th>');
    html.push('      </tr></thead>');
    html.push("      <tbody>");
    milestones.forEach(function (m) {
      var badge = m.achieved
        ? '<span class="c-badge c-badge--active">\u2713 Achieved</span>'
        : '<span class="c-badge">Pending</span>';
      html.push(
        "        <tr>" +
          "<td>" + esc(m.week) + "</td>" +
          "<td>" + esc(m.label) + "</td>" +
          "<td>" + badge + "</td>" +
        "</tr>"
      );
    });
    html.push("      </tbody>");
    html.push("    </table>");
    html.push("  </div>");
    html.push("</div>");
    return html.join("\n");
  }

  // ── Section: coach ─────────────────────────────────────────────────────────

  function renderCoach(coach) {
    if (!coach) return "";
    var html = [];
    html.push('<div class="c-card" style="margin-bottom:1.5rem;">');
    html.push('  <h3 class="c-card__title" style="margin-bottom:1rem;">Treating Coach</h3>');
    html.push(
      '  <p style="font-weight:600;color:var(--color-text);">' + esc(coach.name) + "</p>"
    );
    if (coach.credentials) {
      html.push(
        '  <p style="font-size:.875rem;color:var(--color-text-secondary);margin-top:.25rem;">' +
          esc(coach.credentials) +
        "</p>"
      );
    }
    if (coach.contactNote) {
      html.push(
        '  <p style="font-size:.875rem;color:var(--color-text-secondary);margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--color-border);">' +
          esc(coach.contactNote) +
        "</p>"
      );
    }
    html.push("</div>");
    return html.join("\n");
  }

  // ── Section: disclaimer ────────────────────────────────────────────────────

  function renderDisclaimer(text) {
    if (!text) return "";
    return (
      '<div class="c-alert c-alert--amber" style="margin-top:1.5rem;" role="note">' +
        '<p style="font-size:.8125rem;line-height:1.6;">' +
          '<strong>Disclaimer: </strong>' + esc(text) +
        "</p>" +
      "</div>"
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  function render(client) {
    var cfg  = client.config;
    var html = [];

    html.push(renderClientInfo(client));
    html.push(renderGoals(cfg.goals));
    html.push(renderMilestones(cfg.milestones));
    html.push(renderCoach(cfg.coach));
    html.push(renderDisclaimer(cfg.disclaimer));

    return html.join("\n");
  }

  // ── Self-register ──────────────────────────────────────────────────────────

  window.COACH_TAB_HANDLERS = window.COACH_TAB_HANDLERS || {};
  window.COACH_TAB_HANDLERS["profile"] = function (client) {
    return render(client);
  };

})();

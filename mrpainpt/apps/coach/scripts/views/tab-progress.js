// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS TAB  —  #client/:slug/progress
//
// Reads session state from the canonical plan data.
// Renders: overall completion %, phase completion bars, inline SVG pain
// trend chart, effort trend, and completed-session history table.
//
// No external chart library. No fetch. No localStorage writes.
// SVG chart rendered inline — no canvas, no D3, no Chart.js.
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

  // ── Data helpers ───────────────────────────────────────────────────────────

  // Returns all sessions flattened, each annotated with weekNumber
  function allSessions(plan) {
    var result = [];
    plan.weeks.forEach(function (w) {
      w.sessions.forEach(function (s) {
        result.push({ session: s, weekNumber: w.weekNumber, phase: w.phase });
      });
    });
    return result;
  }

  // Returns completed sessions that have a non-null painRating, in order
  function painDataPoints(plan) {
    var pts = [];
    plan.weeks.forEach(function (w) {
      w.sessions.forEach(function (s) {
        if (s.completed && s.painRating !== null && s.painRating !== undefined) {
          pts.push({ label: "Wk\u00a0" + w.weekNumber + " " + s.day, value: s.painRating });
        }
      });
    });
    return pts;
  }

  // Returns completed sessions that have a non-null effortRating, in order
  function effortDataPoints(plan) {
    var pts = [];
    plan.weeks.forEach(function (w) {
      w.sessions.forEach(function (s) {
        if (s.completed && s.effortRating !== null && s.effortRating !== undefined) {
          pts.push({ label: "Wk\u00a0" + w.weekNumber + " " + s.day, value: s.effortRating });
        }
      });
    });
    return pts;
  }

  // Per-phase completion stats
  function phaseStats(plan) {
    var map = {};
    plan.phases.forEach(function (ph) {
      map[ph.id] = { label: ph.label, color: ph.color || "var(--color-brand)", done: 0, total: 0 };
    });
    plan.weeks.forEach(function (w) {
      w.sessions.forEach(function (s) {
        if (map[w.phase]) {
          map[w.phase].total++;
          if (s.completed) map[w.phase].done++;
        }
      });
    });
    return plan.phases.map(function (ph) { return map[ph.id]; });
  }

  // ── SVG pain trend chart ───────────────────────────────────────────────────
  // Pure inline SVG — no external library.
  // Zone backgrounds: green (0–3), amber (4–6), red (7–10).
  // Data points coloured by severity. Line in brand teal.

  function renderPainChart(dataPoints) {
    if (dataPoints.length === 0) {
      return (
        '<div class="c-empty" style="min-height:8rem;border:2px dashed var(--color-border);border-radius:.5rem;">' +
          '<p class="c-empty__text">No pain scores recorded yet</p>' +
        "</div>"
      );
    }

    var W = 560, H = 180;
    var padL = 28, padR = 12, padT = 12, padB = 32;
    var cW = W - padL - padR;
    var cH = H - padT - padB;
    var n  = dataPoints.length;

    function xAt(i) {
      return padL + (n === 1 ? cW / 2 : (i / (n - 1)) * cW);
    }
    function yAt(v) {
      return padT + cH - (v / 10) * cH;
    }

    var parts = [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '"' +
        ' role="img" aria-label="Pain trend over recorded sessions"' +
        ' style="width:100%;height:auto;display:block;max-width:' + W + 'px;">'
    ];

    // Zone backgrounds
    var zones = [
      { min: 7, max: 10, fill: "#fee2e2" },
      { min: 4, max: 7,  fill: "#fef3c7" },
      { min: 0, max: 4,  fill: "#d1fae5" },
    ];
    zones.forEach(function (z) {
      var zy1 = yAt(z.max);
      var zy2 = yAt(z.min);
      parts.push(
        '<rect x="' + padL + '" y="' + zy1 + '" width="' + cW + '" height="' + (zy2 - zy1) + '" fill="' + z.fill + '"/>'
      );
    });

    // Zone labels (right margin)
    var zoneLabels = [{ score: 8.5, text: "High", color: "#dc2626" }, { score: 5, text: "Mod", color: "#d97706" }, { score: 1.5, text: "Low", color: "#059669" }];
    zoneLabels.forEach(function (zl) {
      parts.push(
        '<text x="' + (padL + cW + 4) + '" y="' + (yAt(zl.score) + 4) + '"' +
        ' font-size="9" fill="' + zl.color + '" font-weight="600">' + zl.text + "</text>"
      );
    });

    // Y-axis gridlines + labels at 0, 3, 6, 10
    [0, 3, 6, 10].forEach(function (v) {
      var yv = yAt(v);
      parts.push(
        '<line x1="' + padL + '" y1="' + yv + '" x2="' + (padL + cW) + '" y2="' + yv + '"' +
        ' stroke="rgba(0,0,0,.08)" stroke-width="1"/>'
      );
      parts.push(
        '<text x="' + (padL - 4) + '" y="' + (yv + 4) + '"' +
        ' text-anchor="end" font-size="10" fill="#94a3b8">' + v + "</text>"
      );
    });

    // X-axis labels (every session, truncated if many)
    var labelEvery = n <= 8 ? 1 : n <= 16 ? 2 : 3;
    dataPoints.forEach(function (d, i) {
      if (i % labelEvery === 0) {
        parts.push(
          '<text x="' + xAt(i) + '" y="' + (H - 4) + '"' +
          ' text-anchor="middle" font-size="9" fill="#94a3b8">' + esc(d.label) + "</text>"
        );
      }
    });

    // Connecting polyline
    if (n > 1) {
      var polyPts = dataPoints.map(function (d, i) { return xAt(i) + "," + yAt(d.value); }).join(" ");
      parts.push(
        '<polyline points="' + polyPts + '" fill="none" stroke="#0d9488" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
      );
    }

    // Data point circles, coloured by severity
    dataPoints.forEach(function (d, i) {
      var col = d.value <= 3 ? "#059669" : d.value <= 6 ? "#d97706" : "#dc2626";
      parts.push(
        '<circle cx="' + xAt(i) + '" cy="' + yAt(d.value) + '" r="4.5"' +
        ' fill="' + col + '" stroke="#fff" stroke-width="1.5"/>'
      );
      // Score label above point
      parts.push(
        '<text x="' + xAt(i) + '" y="' + (yAt(d.value) - 7) + '"' +
        ' text-anchor="middle" font-size="10" font-weight="600" fill="' + col + '">' + d.value + "</text>"
      );
    });

    parts.push("</svg>");
    return parts.join("");
  }

  // ── Effort trend — horizontal bar per session ──────────────────────────────

  function renderEffortBars(dataPoints) {
    if (dataPoints.length === 0) {
      return '<p style="font-size:.875rem;color:var(--color-text-muted);">No effort data recorded yet.</p>';
    }
    var html = [];
    html.push('<div style="display:flex;flex-direction:column;gap:.375rem;">');
    dataPoints.forEach(function (d) {
      var pct = Math.round((d.value / 10) * 100);
      var col = d.value <= 3 ? "var(--pain-green)" : d.value <= 6 ? "var(--pain-amber)" : "var(--pain-red)";
      html.push(
        '<div style="display:flex;align-items:center;gap:.625rem;">' +
          '<span style="font-size:.75rem;color:var(--color-text-muted);width:5.5rem;flex-shrink:0;text-align:right;">' +
            esc(d.label) +
          "</span>" +
          '<div style="flex:1;background:var(--color-surface-muted);border-radius:9999px;height:.5rem;overflow:hidden;">' +
            '<div style="width:' + pct + '%;height:100%;background:' + col + ';border-radius:9999px;transition:width .3s;"></div>' +
          "</div>" +
          '<span style="font-size:.75rem;font-weight:600;color:var(--color-text-secondary);width:1.5rem;flex-shrink:0;">' +
            esc(d.value) +
          "</span>" +
        "</div>"
      );
    });
    html.push("</div>");
    return html.join("\n");
  }

  // ── Phase completion bars ──────────────────────────────────────────────────

  function renderPhaseCompletion(phases) {
    var html = [];
    html.push('<div style="display:flex;flex-direction:column;gap:.875rem;">');
    phases.forEach(function (ph) {
      var pct = ph.total > 0 ? Math.round((ph.done / ph.total) * 100) : 0;
      html.push(
        '<div>' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:.25rem;">' +
            '<span style="font-size:.875rem;font-weight:500;color:var(--color-text);">' + esc(ph.label) + "</span>" +
            '<span style="font-size:.875rem;color:var(--color-text-secondary);">' + esc(ph.done) + " / " + esc(ph.total) + " sessions</span>" +
          "</div>" +
          '<div class="c-progress__track">' +
            '<div class="c-progress__fill" style="width:' + pct + '%;background:' + esc(ph.color) + ';"></div>' +
          "</div>" +
        "</div>"
      );
    });
    html.push("</div>");
    return html.join("\n");
  }

  // ── Session history table ──────────────────────────────────────────────────

  function renderHistory(plan) {
    var completed = [];
    plan.weeks.forEach(function (w) {
      w.sessions.forEach(function (s) {
        if (s.completed) completed.push({ s: s, week: w.weekNumber });
      });
    });

    if (completed.length === 0) {
      return '<p style="font-size:.875rem;color:var(--color-text-muted);">No completed sessions yet.</p>';
    }

    var html = [];
    html.push('<div class="c-table-wrap">');
    html.push('<table class="c-table">');
    html.push(
      "<thead><tr>" +
        "<th>Week</th><th>Day</th><th>Session</th><th>Duration</th>" +
        "<th>Pain</th><th>Effort</th>" +
      "</tr></thead>"
    );
    html.push("<tbody>");
    completed.forEach(function (row) {
      var s   = row.s;
      var pb  = s.painRating   !== null && s.painRating   !== undefined ? s.painRating   : "—";
      var eb  = s.effortRating !== null && s.effortRating !== undefined ? s.effortRating : "—";
      var pCol = (typeof pb === "number")
        ? (pb <= 3 ? "var(--pain-green)" : pb <= 6 ? "var(--pain-amber)" : "var(--pain-red)")
        : "inherit";
      html.push(
        "<tr>" +
          "<td>" + esc(row.week) + "</td>" +
          "<td>" + esc(s.day) + "</td>" +
          "<td>" + esc(s.label) + "</td>" +
          "<td>" + esc(s.duration) + "</td>" +
          '<td style="font-weight:600;color:' + pCol + ';">' + esc(pb) + "</td>" +
          "<td>" + esc(eb) + "</td>" +
        "</tr>"
      );
    });
    html.push("</tbody></table></div>");
    return html.join("\n");
  }

  // ── Overall stats ──────────────────────────────────────────────────────────

  function renderOverallStats(plan) {
    var all      = allSessions(plan);
    var done     = all.filter(function (r) { return r.session.completed; });
    var total    = all.length;
    var pct      = total > 0 ? Math.round((done.length / total) * 100) : 0;
    var painPts  = painDataPoints(plan);
    var avgPain  = painPts.length > 0
      ? (painPts.reduce(function (a, p) { return a + p.value; }, 0) / painPts.length).toFixed(1)
      : "—";
    var lastPain = painPts.length > 0 ? painPts[painPts.length - 1].value : null;
    var lastMod  = lastPain !== null
      ? (lastPain <= 3 ? "var(--pain-green)" : lastPain <= 6 ? "var(--pain-amber)" : "var(--pain-red)")
      : "var(--color-text)";

    return (
      '<div class="c-stats-grid" style="margin-bottom:1.5rem;">' +
        '<div class="c-stat">' +
          '<p class="c-stat__label">Overall completion</p>' +
          '<p class="c-stat__value">' + esc(pct) + "%</p>" +
          '<p class="c-stat__sub">' + esc(done.length) + " of " + esc(total) + " sessions</p>" +
        "</div>" +
        '<div class="c-stat">' +
          '<p class="c-stat__label">Average pain score</p>' +
          '<p class="c-stat__value">' + esc(avgPain) + "<span style=\"font-size:1rem;font-weight:400;color:var(--color-text-secondary);\"> / 10</span></p>" +
          '<p class="c-stat__sub">' + esc(painPts.length) + " sessions recorded</p>" +
        "</div>" +
        '<div class="c-stat">' +
          '<p class="c-stat__label">Last pain score</p>' +
          '<p class="c-stat__value" style="color:' + lastMod + ';">' +
            (lastPain !== null ? esc(lastPain) + "<span style=\"font-size:1rem;font-weight:400;color:var(--color-text-secondary);\"> / 10</span>" : "—") +
          "</p>" +
        "</div>" +
      "</div>"
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  function render(client) {
    var plan    = client.plan;
    var painPts = painDataPoints(plan);
    var effPts  = effortDataPoints(plan);
    var phases  = phaseStats(plan);
    var html    = [];

    // Overall stats
    html.push(renderOverallStats(plan));

    // Phase completion
    html.push('<div class="c-card" style="margin-bottom:1.5rem;">');
    html.push('  <h3 class="c-card__title" style="margin-bottom:1rem;">Completion by Phase</h3>');
    html.push(renderPhaseCompletion(phases));
    html.push("</div>");

    // Pain trend chart — most prominent section
    html.push('<div class="c-card" style="margin-bottom:1.5rem;">');
    html.push(
      '  <h3 class="c-card__title" style="margin-bottom:.25rem;">Pain Trend</h3>' +
      '  <p style="font-size:.8125rem;color:var(--color-text-muted);margin-bottom:1rem;">' +
        esc(painPts.length) + " data " + (painPts.length === 1 ? "point" : "points") + " from completed sessions" +
      "</p>"
    );
    html.push(renderPainChart(painPts));
    html.push("</div>");

    // Effort trend
    html.push('<div class="c-card" style="margin-bottom:1.5rem;">');
    html.push('  <h3 class="c-card__title" style="margin-bottom:1rem;">Effort Trend</h3>');
    html.push(renderEffortBars(effPts));
    html.push("</div>");

    // Session history
    html.push('<div class="c-card">');
    html.push('  <h3 class="c-card__title" style="margin-bottom:1rem;">Completed Sessions</h3>');
    html.push(renderHistory(plan));
    html.push("</div>");

    return html.join("\n");
  }

  // ── Self-register ──────────────────────────────────────────────────────────

  window.COACH_TAB_HANDLERS = window.COACH_TAB_HANDLERS || {};
  window.COACH_TAB_HANDLERS["progress"] = function (client) {
    return render(client);
  };

})();

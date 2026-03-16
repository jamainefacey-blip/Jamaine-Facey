// ─────────────────────────────────────────────────────────────────────────────
// CLIENT LIST VIEW  —  #clients route
//
// Reads CLIENT_REGISTRY, calls loadClient(slug) for each entry, and renders
// a card grid. Active clients sort first. Empty state renders gracefully.
//
// No fetch. No localStorage writes. No coupling to apps/client/.
//
// ADDING A NEW CLIENT:
//   Add the client to registry.js. Their script tags must be in index.html
//   before coach-app.js. No changes to this file are required.
//
// PHASE 4 EXTENSION:
//   When loadClient() becomes async, wrap render() in a Promise chain here.
//   Card HTML and sort logic stay identical.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── Utilities ──────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Pain helpers ───────────────────────────────────────────────────────────

  function painModifier(score) {
    if (score === null || score === undefined) return "none";
    if (score <= 3) return "green";
    if (score <= 6) return "amber";
    return "red";
  }

  function painText(score) {
    if (score === null || score === undefined) return "No pain data";
    return "Last pain: " + score + "/10";
  }

  // Walk weeks in reverse, sessions in reverse, return first completed
  // session that has a non-null painRating. Returns null if none found.
  function lastPainRating(plan) {
    var weeks = plan.weeks.slice().reverse();
    for (var i = 0; i < weeks.length; i++) {
      var sessions = weeks[i].sessions.slice().reverse();
      for (var j = 0; j < sessions.length; j++) {
        var s = sessions[j];
        if (s.completed && s.painRating !== null && s.painRating !== undefined) {
          return s.painRating;
        }
      }
    }
    return null;
  }

  // ── Phase helpers ──────────────────────────────────────────────────────────

  // Returns the phase object { id, label, … } for the client's current week,
  // or null if the current week is not in the plan (should not happen in valid data).
  function currentPhase(client) {
    var currentWeek = client.config.client.currentWeek;
    var weekEntry = null;
    for (var i = 0; i < client.plan.weeks.length; i++) {
      if (client.plan.weeks[i].weekNumber === currentWeek) {
        weekEntry = client.plan.weeks[i];
        break;
      }
    }
    if (!weekEntry) return null;
    for (var j = 0; j < client.plan.phases.length; j++) {
      if (client.plan.phases[j].id === weekEntry.phase) {
        return client.plan.phases[j];
      }
    }
    return null;
  }

  // ── Card renderer ──────────────────────────────────────────────────────────

  function renderCard(slug, client, active) {
    var cfg   = client.config.client;
    var pain  = lastPainRating(client.plan);
    var mod   = painModifier(pain);
    var phase = currentPhase(client);

    var phaseBadge = phase
      ? '<span class="c-badge c-badge--phase-' + esc(phase.id) + '">'
          + esc(phase.label)
        + "</span>"
      : "";

    var statusBadge = active
      ? '<span class="c-badge c-badge--active">Active</span>'
      : '<span class="c-badge c-badge--paused">Paused</span>';

    var weekBadge =
      '<span class="c-badge">Wk\u00a0' +
      esc(cfg.currentWeek) +
      "\u00a0/\u00a0" +
      esc(cfg.programWeeks) +
      "</span>";

    return [
      '<article class="c-client-card' + (active ? "" : " c-client-card--inactive") + '">',
      "  <div>",
      '    <h2 class="c-client-card__name">'
        + esc(cfg.firstName) + " " + esc(cfg.lastName)
        + "</h2>",
      '    <p class="c-client-card__condition">' + esc(cfg.condition) + "</p>",
      "  </div>",
      '  <div class="c-client-card__meta">',
      "    " + statusBadge,
      "    " + phaseBadge,
      "    " + weekBadge,
      "  </div>",
      '  <div>',
      '    <span class="c-pain c-pain--' + mod + '" aria-label="' + esc(painText(pain)) + '">',
      '      <span class="c-pain__dot" aria-hidden="true"></span>',
      "      " + esc(painText(pain)),
      "    </span>",
      "  </div>",
      '  <a class="c-client-card__link" href="#client/' + esc(slug) + '/profile">',
      "    View client",
      "  </a>",
      "</article>",
    ].join("\n");
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  function renderEmpty() {
    return [
      '<div class="c-empty">',
      '  <p class="c-empty__title">No clients found</p>',
      '  <p class="c-empty__text">Add an entry to registry.js to register a client.</p>',
      "</div>",
    ].join("\n");
  }

  // ── Main render ────────────────────────────────────────────────────────────

  function render() {
    // Sort: active entries before inactive, preserve original order within each group
    var sorted = CLIENT_REGISTRY.slice().sort(function (a, b) {
      if (a.active === b.active) return 0;
      return a.active ? -1 : 1;
    });

    var cards  = [];
    var failed = [];

    sorted.forEach(function (entry) {
      var client = loadClient(entry.slug);
      if (!client) {
        failed.push(entry.slug);
        return;
      }
      cards.push(renderCard(entry.slug, client, entry.active !== false));
    });

    var total = CLIENT_REGISTRY.length;
    var html  = [];

    html.push('<div class="c-section-header">');
    html.push('  <h1 class="c-section-header__title">Clients</h1>');
    html.push(
      "  <p class=\"c-section-header__subtitle\">" +
        esc(total) +
        " client" +
        (total === 1 ? "" : "s") +
        " registered</p>"
    );
    html.push("</div>");

    if (failed.length > 0) {
      html.push(
        '<div class="c-alert c-alert--amber" role="alert">' +
          "<p>Could not load data for: " +
          failed.map(esc).join(", ") +
          ". Check that all script tags are present in index.html and loader.js is up to date.</p>" +
          "</div>"
      );
    }

    if (cards.length === 0) {
      html.push(renderEmpty());
    } else {
      html.push('<div class="c-client-grid">');
      cards.forEach(function (card) { html.push(card); });
      html.push("</div>");
    }

    var el = document.getElementById("view");
    if (el) el.innerHTML = html.join("\n");
  }

  // ── Self-register ──────────────────────────────────────────────────────────

  if (typeof COACH_APP !== "undefined" && typeof COACH_APP.registerRoute === "function") {
    COACH_APP.registerRoute("clients", function (route) {
      render();
    });
  } else {
    console.error(
      "[client-list] COACH_APP not available. " +
        "Ensure coach-app.js is loaded before client-list.js."
    );
  }

})();

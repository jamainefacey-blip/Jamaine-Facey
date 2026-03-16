// ─────────────────────────────────────────────────────────────────────────────
// EXERCISE LIBRARY VIEW  —  #library route
//
// Renders all exercises from window.EXERCISE_LIBRARY as browsable cards.
// Phase filter (All / Phase 1 / Phase 2 / Phase 3) and category filter
// applied via DOM show/hide — no re-render on filter change.
//
// Reads EXERCISE_LIBRARY global directly (loaded in index.html step 1).
// Does NOT use loadClient() — this is a platform-level view, not client-scoped.
//
// No fetch. No localStorage writes. No external dependencies.
// Self-registers via COACH_APP.registerRoute("library").
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

  // ── Phase metadata ─────────────────────────────────────────────────────────
  // Colours match plan.js phase definitions — platform constants.

  var PHASE_META = {
    1: { label: "Phase 1", sublabel: "Activation & Early ROM",      color: "#0891b2" },
    2: { label: "Phase 2", sublabel: "Strength & Stability",        color: "#7c3aed" },
    3: { label: "Phase 3", sublabel: "Progressive Loading",         color: "#059669" },
  };

  // ── Extract unique, sorted categories from the library ────────────────────

  function getCategories(exercises) {
    var seen = {};
    var cats = [];
    exercises.forEach(function (ex) {
      if (ex.category && !seen[ex.category]) {
        seen[ex.category] = true;
        cats.push(ex.category);
      }
    });
    return cats.sort();
  }

  // Count exercises per phase
  function countByPhase(exercises, phase) {
    return exercises.filter(function (ex) { return ex.phase === phase; }).length;
  }

  // Count exercises per category
  function countByCategory(exercises, cat) {
    return exercises.filter(function (ex) { return ex.category === cat; }).length;
  }

  // ── Prescription row ───────────────────────────────────────────────────────
  // Formats sets / reps / hold into a compact, readable pill row.

  function renderPrescription(ex) {
    var parts = [];

    if (ex.sets != null) {
      var sets = esc(ex.sets) + "\u00a0set" + (ex.sets === 1 ? "" : "s");
      if (ex.reps != null) {
        sets += "\u00a0\u00d7\u00a0" + esc(ex.reps) + "\u00a0rep" + (ex.reps === 1 ? "" : "s");
      }
      parts.push(sets);
    }

    if (ex.hold != null) {
      parts.push("Hold\u00a0" + esc(ex.hold));
    }

    if (ex.rest) {
      parts.push("Rest\u00a0" + esc(ex.rest));
    }

    if (parts.length === 0) return "";

    return (
      '<div style="display:flex;flex-wrap:wrap;gap:.375rem;margin-bottom:.625rem;">' +
        parts.map(function (p) {
          return '<span class="c-badge" style="font-size:.75rem;">' + p + "</span>";
        }).join("") +
      "</div>"
    );
  }

  // ── Single exercise card ───────────────────────────────────────────────────

  function renderCard(ex) {
    var meta  = PHASE_META[ex.phase] || { label: "Phase " + ex.phase, sublabel: "", color: "#64748b" };
    var html  = [];

    html.push(
      '<div class="c-card c-ex-card"' +
        ' data-phase="' + esc(ex.phase) + '"' +
        ' data-category="' + esc(ex.category) + '"' +
        ' style="border-top:3px solid ' + esc(meta.color) + ';display:flex;flex-direction:column;">'
    );

    // ── Card header: name + badges ─────────────────────────────────────────
    html.push(
      '  <div style="display:flex;align-items:flex-start;justify-content:space-between;' +
        'flex-wrap:wrap;gap:.5rem;margin-bottom:.75rem;">' +
        '<h3 style="font-size:1rem;font-weight:600;color:var(--color-text);line-height:1.35;' +
          'flex:1;min-width:0;">' + esc(ex.name) + "</h3>" +
        '<div style="display:flex;gap:.375rem;flex-shrink:0;">' +
          '<span class="c-badge c-badge--phase-' + esc(ex.phase) + '" style="font-size:.7rem;">' +
            esc(meta.label) +
          "</span>" +
          '<span class="c-badge" style="font-size:.7rem;">' + esc(ex.category) + "</span>" +
        "</div>" +
      "</div>"
    );

    // ── Description ────────────────────────────────────────────────────────
    html.push(
      '  <p style="font-size:.875rem;color:var(--color-text);line-height:1.6;' +
        'margin-bottom:.75rem;">' + esc(ex.description) + "</p>"
    );

    // ── Prescription pills (sets / reps / hold / rest) ─────────────────────
    html.push("  " + renderPrescription(ex));

    // ── Tempo ──────────────────────────────────────────────────────────────
    if (ex.tempo) {
      html.push(
        '  <p style="font-size:.8125rem;color:var(--color-text-secondary);' +
          'margin-bottom:.5rem;">' +
          '<span style="font-weight:500;">Tempo:</span>\u00a0' + esc(ex.tempo) +
        "</p>"
      );
    }

    // ── Cue ────────────────────────────────────────────────────────────────
    if (ex.cue) {
      html.push(
        '  <p style="font-size:.8125rem;line-height:1.6;' +
          'background:var(--color-surface-raised);border-left:3px solid var(--color-brand);' +
          'padding:.5rem .625rem;border-radius:0 .25rem .25rem 0;' +
          'color:var(--color-text);margin-bottom:.5rem;">' +
          esc(ex.cue) +
        "</p>"
      );
    }

    // ── Pain note ──────────────────────────────────────────────────────────
    if (ex.painNote) {
      html.push(
        '  <p class="c-alert c-alert--amber" role="note"' +
          ' style="font-size:.775rem;line-height:1.55;margin-top:auto;margin-bottom:0;' +
          'padding:.375rem .625rem;">' +
          '<strong>Pain note:\u00a0</strong>' + esc(ex.painNote) +
        "</p>"
      );
    }

    html.push("</div>");
    return html.join("\n");
  }

  // ── Filter bar ─────────────────────────────────────────────────────────────

  function renderFilters(exercises) {
    var categories = getCategories(exercises);
    var total      = exercises.length;
    var html       = [];

    // Phase filters
    html.push('<div style="margin-bottom:.625rem;">');
    html.push(
      '<p style="font-size:.75rem;font-weight:600;color:var(--color-text-muted);' +
        'text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;">Phase</p>'
    );
    html.push('<div style="display:flex;flex-wrap:wrap;gap:.375rem;margin-bottom:.25rem;">');
    html.push(
      '<button type="button" class="c-btn c-btn--secondary c-filter-btn c-filter-btn--active"' +
        ' data-filter-type="phase" data-filter-value="all"' +
        ' style="font-size:.8125rem;padding:.3125rem .75rem;">' +
        "All\u00a0<span style=\"font-size:.75rem;opacity:.7;\">(" + esc(total) + ")</span>" +
      "</button>"
    );
    [1, 2, 3].forEach(function (p) {
      var cnt  = countByPhase(exercises, p);
      var meta = PHASE_META[p];
      html.push(
        '<button type="button" class="c-btn c-btn--secondary c-filter-btn"' +
          ' data-filter-type="phase" data-filter-value="' + esc(p) + '"' +
          ' style="font-size:.8125rem;padding:.3125rem .75rem;' +
            'border-left:3px solid ' + esc(meta.color) + ';">' +
          esc(meta.label) +
          '\u00a0<span style="font-size:.75rem;opacity:.7;">(' + esc(cnt) + ")</span>" +
        "</button>"
      );
    });
    html.push("</div>");
    html.push("</div>");

    // Category filters
    html.push('<div>');
    html.push(
      '<p style="font-size:.75rem;font-weight:600;color:var(--color-text-muted);' +
        'text-transform:uppercase;letter-spacing:.06em;margin-bottom:.5rem;">Category</p>'
    );
    html.push('<div style="display:flex;flex-wrap:wrap;gap:.375rem;">');
    html.push(
      '<button type="button" class="c-btn c-btn--secondary c-filter-btn c-filter-cat-btn c-filter-btn--active"' +
        ' data-filter-type="category" data-filter-value="all"' +
        ' style="font-size:.8125rem;padding:.3125rem .75rem;">' +
        "All categories" +
      "</button>"
    );
    categories.forEach(function (cat) {
      var cnt = countByCategory(exercises, cat);
      html.push(
        '<button type="button" class="c-btn c-btn--secondary c-filter-btn c-filter-cat-btn"' +
          ' data-filter-type="category" data-filter-value="' + esc(cat) + '"' +
          ' style="font-size:.8125rem;padding:.3125rem .75rem;">' +
          esc(cat) +
          '\u00a0<span style="font-size:.75rem;opacity:.7;">(' + esc(cnt) + ")</span>" +
        "</button>"
      );
    });
    html.push("</div>");
    html.push("</div>");

    return html.join("\n");
  }

  // ── Main render (returns full HTML string) ────────────────────────────────

  function render(exercises) {
    var html = [];

    // Section header
    html.push('<div class="c-section-header" style="margin-bottom:1.5rem;">');
    html.push('  <h1 class="c-section-header__title">Exercise Library</h1>');
    html.push(
      '  <p class="c-section-header__subtitle">' +
        esc(exercises.length) + "\u00a0exercises across\u00a03\u00a0rehabilitation phases" +
      "</p>"
    );
    html.push("</div>");

    // Filter bar card
    html.push('<div class="c-card" style="margin-bottom:1.5rem;">');
    html.push(renderFilters(exercises));
    html.push("</div>");

    // Live count (updated by attachFilters)
    html.push(
      '<p id="lib-count" style="font-size:.875rem;color:var(--color-text-muted);' +
        'margin-bottom:1rem;">' +
        "Showing\u00a0<strong>" + esc(exercises.length) + "</strong>\u00a0of\u00a0" +
        esc(exercises.length) + "\u00a0exercises" +
      "</p>"
    );

    // Exercise card grid
    html.push(
      '<div id="lib-grid" style="display:grid;' +
        'grid-template-columns:repeat(auto-fill,minmax(20rem,1fr));gap:1rem;">'
    );
    exercises.forEach(function (ex) {
      html.push(renderCard(ex));
    });
    html.push("</div>");

    return html.join("\n");
  }

  // ── Filter logic ───────────────────────────────────────────────────────────
  // Attached immediately after innerHTML is set (no setTimeout needed here
  // because we set innerHTML ourselves before calling attachFilters).

  function attachFilters(exercises) {
    if (typeof document === "undefined") return;

    var activePhase = "all";
    var activeCat   = "all";

    function applyFilters() {
      var cards   = document.querySelectorAll(".c-ex-card");
      var visible = 0;

      cards.forEach(function (card) {
        var matchPhase = activePhase === "all" || card.getAttribute("data-phase") === String(activePhase);
        var matchCat   = activeCat   === "all" || card.getAttribute("data-category") === activeCat;
        var show       = matchPhase && matchCat;
        card.style.display = show ? "" : "none";
        if (show) visible++;
      });

      // Update live count
      var countEl = document.getElementById("lib-count");
      if (countEl) {
        countEl.innerHTML =
          "Showing\u00a0<strong>" + visible + "</strong>\u00a0of\u00a0" +
          exercises.length + "\u00a0exercises";
      }
    }

    // Event delegation on filter buttons
    var filterBtns = document.querySelectorAll(".c-filter-btn");
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var type  = btn.getAttribute("data-filter-type");
        var value = btn.getAttribute("data-filter-value");

        if (type === "phase") {
          // Deactivate all phase buttons; activate this one
          document.querySelectorAll('[data-filter-type="phase"]').forEach(function (b) {
            b.classList.remove("c-filter-btn--active");
            b.style.fontWeight = "";
          });
          btn.classList.add("c-filter-btn--active");
          btn.style.fontWeight = "700";
          activePhase = value === "all" ? "all" : Number(value);

        } else if (type === "category") {
          // Deactivate all category buttons; activate this one
          document.querySelectorAll('[data-filter-type="category"]').forEach(function (b) {
            b.classList.remove("c-filter-btn--active");
            b.style.fontWeight = "";
          });
          btn.classList.add("c-filter-btn--active");
          btn.style.fontWeight = "700";
          activeCat = value;
        }

        applyFilters();
      });
    });
  }

  // ── Self-register ──────────────────────────────────────────────────────────

  if (typeof COACH_APP !== "undefined" && typeof COACH_APP.registerRoute === "function") {
    COACH_APP.registerRoute("library", function () {
      var exercises = (typeof EXERCISE_LIBRARY !== "undefined" && Array.isArray(EXERCISE_LIBRARY))
        ? EXERCISE_LIBRARY
        : [];

      var el = document.getElementById("view");
      if (!el) return;

      el.innerHTML = render(exercises);
      attachFilters(exercises);
    });
  } else {
    console.error(
      "[exercise-library] COACH_APP not available. " +
        "Ensure coach-app.js is loaded before exercise-library.js in index.html."
    );
  }

})();

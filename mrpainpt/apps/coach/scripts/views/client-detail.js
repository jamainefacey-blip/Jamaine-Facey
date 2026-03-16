// ─────────────────────────────────────────────────────────────────────────────
// CLIENT DETAIL VIEW  —  #client/:slug/* routes
//
// Renders the shell for a single client record: header, 4-tab bar, tab body.
//
// Tab body for Checkpoint 3: safe placeholders only.
// Tab files (tab-profile.js, tab-plan.js, tab-progress.js, tab-notes.js)
// register content in Checkpoint 4 via window.COACH_TAB_HANDLERS[tabKey].
//
// No fetch. No localStorage writes. No coupling to apps/client/.
//
// ADDING A NEW TAB:
//   1. Add an entry to TABS below.
//   2. Create the tab file in scripts/views/.
//   3. Register it via window.COACH_TAB_HANDLERS in that file.
//   4. Add a script tag for it in index.html after client-detail.js.
//   No changes to this file are required beyond step 1.
//
// NOT-FOUND HANDLING:
//   An invalid slug renders a user-facing error and does NOT throw.
//   Verified in CP3 test suite.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── Tab definitions (order governs render order) ───────────────────────────

  var TABS = [
    { key: "profile",  label: "Profile"  },
    { key: "plan",     label: "Plan"     },
    { key: "progress", label: "Progress" },
    { key: "notes",    label: "Notes"    },
  ];

  // ── Utility ────────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Not-found state ────────────────────────────────────────────────────────

  function renderNotFound(slug) {
    var el = document.getElementById("view");
    if (!el) return;
    el.innerHTML = [
      '<a class="c-back" href="#clients">All clients</a>',
      '<div class="c-empty">',
      '  <p class="c-empty__title">Client not found</p>',
      '  <p class="c-empty__text">No client with slug &#x201c;'
        + esc(slug)
        + '&#x201d; exists in the registry.</p>',
      "</div>",
    ].join("\n");
  }

  // ── Tab bar ────────────────────────────────────────────────────────────────

  function renderTabBar(slug, activeTab) {
    var tabs = TABS.map(function (tab) {
      var isActive = tab.key === activeTab;
      return (
        '<a class="c-tabs__tab' +
        (isActive ? " c-tabs__tab--active" : "") +
        '" href="#client/' +
        esc(slug) +
        "/" +
        esc(tab.key) +
        '"' +
        (isActive ? ' aria-current="page"' : "") +
        ">" +
        esc(tab.label) +
        "</a>"
      );
    });
    return (
      '<div class="c-tabs">' +
        '<div class="c-tabs__list" role="tablist">' +
          tabs.join("") +
        "</div>" +
      "</div>"
    );
  }

  // ── Tab body ───────────────────────────────────────────────────────────────
  // Tab files installed in CP4 register themselves via:
  //   window.COACH_TAB_HANDLERS = window.COACH_TAB_HANDLERS || {};
  //   window.COACH_TAB_HANDLERS['profile'] = function(client, slug) { ... };
  // Returns an HTML string.

  function renderTabBody(tab, client, slug) {
    if (
      typeof window !== "undefined" &&
      window.COACH_TAB_HANDLERS &&
      typeof window.COACH_TAB_HANDLERS[tab] === "function"
    ) {
      try {
        return window.COACH_TAB_HANDLERS[tab](client, slug);
      } catch (err) {
        console.error("[client-detail] Tab handler error for '" + tab + "':", err);
        // Fall through to placeholder
      }
    }

    // Placeholder — replaced when tab files load in CP4
    var labels = {
      profile:  "Profile view \u2014 loads in Checkpoint 4",
      plan:     "Plan view \u2014 loads in Checkpoint 4",
      progress: "Progress view \u2014 loads in Checkpoint 4",
      notes:    "Notes view \u2014 loads in Checkpoint 4",
    };
    var label = labels[tab] || "Tab not found";
    return (
      '<div class="c-placeholder">' +
        '<p class="c-placeholder__text">' + esc(label) + "</p>" +
      "</div>"
    );
  }

  // ── Main render ────────────────────────────────────────────────────────────

  function render(route) {
    var slug = route.slug;
    var tab  = route.tab || "profile";

    // Validate slug against CLIENT_REGISTRY before calling loadClient
    var inRegistry = false;
    for (var i = 0; i < CLIENT_REGISTRY.length; i++) {
      if (CLIENT_REGISTRY[i].slug === slug) {
        inRegistry = true;
        break;
      }
    }
    if (!inRegistry) {
      renderNotFound(slug);
      return;
    }

    // Show loading state while data fetches from the API
    var el = document.getElementById("view");
    if (el) {
      el.innerHTML = '<div class="c-placeholder"><p class="c-placeholder__text">Loading\u2026</p></div>';
    }

    // PHASE 4: loadClient() is async — await the result then render
    loadClient(slug).then(function (client) {
      if (!client) {
        renderNotFound(slug);
        return;
      }

      var cfg  = client.config.client;
      var html = [];

      // Back link
      html.push('<a class="c-back" href="#clients">All clients</a>');

      // Client header
      html.push('<div class="c-section-header">');
      html.push(
        '  <h1 class="c-section-header__title">' +
          esc(cfg.firstName) + "\u00a0" + esc(cfg.lastName) +
          "</h1>"
      );
      html.push(
        '  <p class="c-section-header__subtitle">' +
          esc(cfg.condition) +
          "</p>"
      );
      html.push("</div>");

      // Tab bar
      html.push(renderTabBar(slug, tab));

      // Tab body
      html.push('<div id="tab-body" class="c-view__tab-body">');
      html.push(renderTabBody(tab, client, slug));
      html.push("</div>");

      if (el) el.innerHTML = html.join("\n");
    }).catch(function (err) {
      console.error("[client-detail] Failed to load client data:", err);
      renderNotFound(slug);
    });
  }

  // ── Self-register ──────────────────────────────────────────────────────────

  if (typeof COACH_APP !== "undefined" && typeof COACH_APP.registerRoute === "function") {
    COACH_APP.registerRoute("client-detail", function (route) {
      render(route);
    });
  } else {
    console.error(
      "[client-detail] COACH_APP not available. " +
        "Ensure coach-app.js is loaded before client-detail.js."
    );
  }

})();

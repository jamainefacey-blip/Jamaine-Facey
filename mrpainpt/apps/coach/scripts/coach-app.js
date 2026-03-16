// ─────────────────────────────────────────────────────────────────────────────
// COACH PORTAL — ROOT HASH ROUTER
//
// Responsibilities:
//   - Parse location.hash into a structured route object
//   - Dispatch to the correct view render function
//   - Maintain active nav link state
//   - Provide COACH_APP.registerRoute() for view files (CP3–5) to self-register
//   - Render safe placeholder content for routes whose view files are not yet loaded
//
// This file NEVER writes to localStorage.
// This file NEVER reads from apps/client/ scripts or data files.
// This file NEVER makes fetch() calls.
//
// Supported routes:
//   #login                          → coach sign-in form (public)
//   #clients                        → client list dashboard (protected)
//   #client/:slug/profile           → client detail — profile tab (protected)
//   #client/:slug/plan              → client detail — plan tab (protected)
//   #client/:slug/progress          → client detail — progress tab (protected)
//   #client/:slug/notes             → client detail — notes tab (protected)
//   #library                        → exercise library browser (protected)
//
// Auth guard (Phase 4 CP7):
//   Unauthenticated users on any protected route → redirect to #login.
//   Authenticated users on #login → redirect to #clients.
//   Empty / bare hash → #login if unauthenticated, #clients if authenticated.
//
// COACH_AUTH (scripts/auth.js) must be loaded before this file.
// view-login.js self-registers 'login' after this file loads.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── Valid tabs for client detail view ──────────────────────────────────────
  var VALID_TABS = ["profile", "plan", "progress", "notes"];

  // ── Route handler registry ─────────────────────────────────────────────────
  // View files (Checkpoints 3–5) call COACH_APP.registerRoute(name, fn)
  // to install themselves. Until they do, the router renders a placeholder.
  var _routes = {};

  // ── Route parser ──────────────────────────────────────────────────────────
  // Returns a normalised route object from location.hash.
  //
  // Return shape:
  //   { name: string, slug: string|null, tab: string|null }
  //
  // name values:
  //   "clients"       — client list
  //   "client-detail" — single client (slug + tab always present)
  //   "library"       — exercise library
  //   "not-found"     — unrecognised path

  function parseRoute(hash) {
    var raw = (hash || "").replace(/^#\/?/, "").trim();

    // Empty or root — auth guard in dispatch() decides the actual destination
    if (!raw) {
      return { name: "clients", slug: null, tab: null };
    }

    if (raw === "login") {
      return { name: "login", slug: null, tab: null };
    }

    if (raw === "clients") {
      return { name: "clients", slug: null, tab: null };
    }

    if (raw === "library") {
      return { name: "library", slug: null, tab: null };
    }

    // #client/:slug/:tab  OR  #client/:slug  (defaults tab to profile)
    var clientPattern = /^client\/([a-z0-9][a-z0-9\-]*)(?:\/([a-z]+))?$/;
    var match = raw.match(clientPattern);
    if (match) {
      var slug = match[1];
      var tab  = match[2] && VALID_TABS.indexOf(match[2]) !== -1
                   ? match[2]
                   : "profile";
      return { name: "client-detail", slug: slug, tab: tab };
    }

    return { name: "not-found", slug: null, tab: null };
  }

  // ── Utility: safe HTML escape ──────────────────────────────────────────────
  function esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Mount: set inner HTML of #view ────────────────────────────────────────
  function mount(html) {
    var el = document.getElementById("view");
    if (el) el.innerHTML = html;
  }

  // ── Placeholder renderer ───────────────────────────────────────────────────
  // Used while view files for a route have not yet been loaded.
  function renderPlaceholder(route) {
    var label;
    switch (route.name) {
      case "login":
        label = "Sign in — login view loading";
        break;
      case "clients":
        label = "Client list — view file loads in Checkpoint 3";
        break;
      case "client-detail":
        label = "Client detail ("
          + esc(route.slug) + " / " + esc(route.tab)
          + ") — view file loads in Checkpoint 3";
        break;
      case "library":
        label = "Exercise library — view file loads in Checkpoint 5";
        break;
      case "not-found":
        label = "Page not found";
        break;
      default:
        label = "Unknown route";
    }
    mount(
      '<div class="c-placeholder">'
      + '<p class="c-placeholder__text">' + label + "</p>"
      + "</div>"
    );
  }

  // ── Auth state helpers ─────────────────────────────────────────────────────
  function isAuthenticated() {
    return typeof COACH_AUTH !== "undefined" && COACH_AUTH.isAuthenticated();
  }

  // Update #js-signout button visibility on every dispatch.
  function updateAuthUI() {
    if (typeof COACH_AUTH !== "undefined" && COACH_AUTH.updateSignoutButton) {
      COACH_AUTH.updateSignoutButton();
    }
  }

  // ── Nav active state ───────────────────────────────────────────────────────
  function syncNav(route) {
    document.querySelectorAll(".c-nav__link").forEach(function (link) {
      link.classList.remove("c-nav__link--active");
    });

    var activeHref = null;
    if (route.name === "clients" || route.name === "client-detail") {
      activeHref = "#clients";
    } else if (route.name === "library") {
      activeHref = "#library";
    }

    if (activeHref) {
      var el = document.querySelector('.c-nav__link[href="' + activeHref + '"]');
      if (el) el.classList.add("c-nav__link--active");
    }
  }

  // ── Dispatch ───────────────────────────────────────────────────────────────
  // Called on every hash change and on initial load.
  //
  // Auth guard (CP7):
  //   #login + authenticated  → redirect to #clients
  //   any other route + unauthenticated → redirect to #login

  function dispatch(hash) {
    var route = parseRoute(hash);
    var authed = isAuthenticated();

    if (route.name === "login") {
      if (authed) {
        location.replace("#clients");
        return;
      }
    } else if (route.name !== "not-found") {
      if (!authed) {
        location.replace("#login");
        return;
      }
    }

    syncNav(route);
    updateAuthUI();

    var handler = _routes[route.name];
    if (handler) {
      try {
        handler(route);
      } catch (err) {
        console.error("[coach-app] Route handler error for '" + route.name + "':", err);
        renderPlaceholder(route);
      }
      return;
    }

    // No registered handler yet — show placeholder
    renderPlaceholder(route);
  }

  // ── Boot ───────────────────────────────────────────────────────────────────

  function init() {
    // Validate that required globals from the script load order exist.
    // These checks catch index.html load-order mistakes early.
    if (typeof CLIENT_REGISTRY === "undefined") {
      console.error("[coach-app] CLIENT_REGISTRY not found. Check that registry.js is loaded before coach-app.js in index.html.");
    }
    if (typeof loadClient !== "function") {
      console.error("[coach-app] loadClient() not found. Check that loader.js is loaded before coach-app.js in index.html.");
    }
    if (typeof EXERCISE_LIBRARY === "undefined") {
      console.error("[coach-app] EXERCISE_LIBRARY not found. Check that packages/exercise-library/index.js is loaded before coach-app.js in index.html.");
    }
    if (typeof COACH_AUTH === "undefined") {
      console.error("[coach-app] COACH_AUTH not found. Check that auth.js is loaded before coach-app.js in index.html.");
    }

    // Default route: unauthenticated → #login, authenticated → #clients
    if (!location.hash || location.hash === "#" || location.hash === "") {
      location.replace(isAuthenticated() ? "#clients" : "#login");
      return; // hashchange event will fire and call dispatch
    }

    dispatch(location.hash);

    window.addEventListener("hashchange", function () {
      dispatch(location.hash);
    });
  }

  // Boot after DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  // Exposed on window so view files loaded after this script can register
  // themselves without needing a module system.
  //
  // COACH_APP.registerRoute(name, handler)
  //   name    — route name string: "clients" | "client-detail" | "library"
  //   handler — function(route) called with parsed route object on each match
  //
  // COACH_APP.parseRoute(hash) — exposed for testing
  // COACH_APP.refresh()        — re-dispatch current hash (e.g. after data change)

  window.COACH_APP = {
    registerRoute: function (name, handler) {
      if (typeof name !== "string" || typeof handler !== "function") {
        console.error("[coach-app] registerRoute requires (string, function)");
        return;
      }
      _routes[name] = handler;
    },

    parseRoute: parseRoute,

    refresh: function () {
      dispatch(location.hash);
    },
  };

})();

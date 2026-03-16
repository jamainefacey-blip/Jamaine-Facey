// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL DATA LOADER
//
// Single entry point for all coach portal views to access client data.
// Views never read global variables directly — they call loadClient(slug).
//
// PHASE 3 — STATIC / FILE-DRIVEN
//   Client data is loaded via <script> tags in index.html before this file
//   runs. Each client's canonical files expose globals:
//     CLIENT_CONFIG  — from clients/<slug>/client.config.js
//     REHAB_PLAN     — from clients/<slug>/plan.js
//   The shared exercise library exposes:
//     EXERCISE_LIBRARY — from packages/exercise-library/index.js
//
// NOTE — exercises.js naming conflict (Phase 3 known limitation):
//   clients/<slug>/exercises.js declares `const EXERCISE_LIBRARY`, which
//   collides with the canonical library's global of the same name.
//   For Phase 3, clients/<slug>/exercises.js is NOT loaded as a script tag.
//   Exercise overrides are passed as an empty array.
//   Resolution in Phase 4: the API layer performs the merge server-side,
//   or the client override file is renamed to use CLIENT_EXERCISE_OVERRIDES.
//
// PHASE 4 — API REPLACEMENT
//   Replace the body of loadClient() with:
//     const res = await fetch('/api/client/' + slug);
//     return res.json();
//   The returned object shape { config, plan, exercises } stays identical.
//   No view file needs to change.
//
// NO WRITES. NO FETCH. NO EXTERNAL DEPENDENCIES.
// ─────────────────────────────────────────────────────────────────────────────


// ── Exercise merge ────────────────────────────────────────────────────────────
// Implements the override merge spec from packages/exercise-library/schema.js:
//   - Overrides matched by id are shallow-spread on top of the library entry.
//   - Overrides with an id not in the library are appended as new exercises.
//   - Library entries with no matching override are returned unchanged.
//
// Args:
//   library   {Array}  Canonical EXERCISE_LIBRARY from packages/exercise-library/index.js
//   overrides {Array}  CLIENT_EXERCISE_OVERRIDES from clients/<slug>/exercises.js
//                      (empty array in Phase 3 — see note above)
//
// Returns {Array} — resolved exercise set for this client.

function _mergeExercises(library, overrides) {
  if (!Array.isArray(overrides) || overrides.length === 0) {
    return library.slice(); // no overrides — return library copy unchanged
  }

  const overrideMap = {};
  overrides.forEach(function (o) {
    overrideMap[o.id] = o;
  });

  // Merge: overlay override fields onto library entry where id matches
  var merged = library.map(function (ex) {
    var override = overrideMap[ex.id];
    if (override) {
      return Object.assign({}, ex, override);
    }
    return ex;
  });

  // Append client-exclusive exercises (override id not found in library)
  var libraryIds = new Set(library.map(function (ex) { return ex.id; }));
  overrides.forEach(function (o) {
    if (!libraryIds.has(o.id)) {
      merged.push(o);
    }
  });

  return merged;
}


// ── Client data map ───────────────────────────────────────────────────────────
// Maps each slug to the globals its <script> tags expose.
// Populated at startup after all canonical scripts have loaded.
//
// ADDING A CLIENT (Phase 3):
//   Add the slug entry here pointing at the globals its scripts define.
//   The client's scripts must be loaded BEFORE coach-app.js in index.html.
//   See registry.js for the full onboarding checklist.

function _buildClientDataMap() {
  return {
    "sarah-thompson": {
      config:    typeof CLIENT_CONFIG   !== "undefined" ? CLIENT_CONFIG   : null,
      plan:      typeof REHAB_PLAN      !== "undefined" ? REHAB_PLAN      : null,
      exercises: typeof EXERCISE_LIBRARY !== "undefined" ? EXERCISE_LIBRARY : [],
    },
  };
}


// ── loadClient ────────────────────────────────────────────────────────────────
// Primary public API for all coach portal views.
//
// Args:
//   slug {string} — must match a key in CLIENT_REGISTRY and CLIENT_DATA_MAP
//
// Returns:
//   {
//     config:    object   — CLIENT_CONFIG shape (branding, profile, goals, notes)
//     plan:      object   — REHAB_PLAN shape (phases[], weeks[])
//     exercises: array    — merged exercise set (library + client overrides)
//   }
//   Returns null and logs an error if slug is unknown or data is missing.

function loadClient(slug) {
  var dataMap = _buildClientDataMap();
  var entry = dataMap[slug];

  if (!entry) {
    console.error("[loader] Unknown client slug: '" + slug + "'. Add it to CLIENT_DATA_MAP in loader.js.");
    return null;
  }

  if (!entry.config) {
    console.error("[loader] CLIENT_CONFIG not found for '" + slug + "'. Check that client.config.js is loaded before coach-app.js in index.html.");
    return null;
  }

  if (!entry.plan) {
    console.error("[loader] REHAB_PLAN not found for '" + slug + "'. Check that plan.js is loaded before coach-app.js in index.html.");
    return null;
  }

  var resolvedExercises = _mergeExercises(
    Array.isArray(EXERCISE_LIBRARY) ? EXERCISE_LIBRARY : [],
    [] // Phase 3: no client exercise overrides loaded (see file header)
  );

  return {
    config:    entry.config,
    plan:      entry.plan,
    exercises: resolvedExercises,
  };
}


// ── Verification helper (development only) ────────────────────────────────────
// Call _verifyLoader() in the browser console to confirm Checkpoint 1 passes.
// Remove or ignore in production — has no side effects on app state.

function _verifyLoader() {
  var results = { passed: [], failed: [] };

  CLIENT_REGISTRY.forEach(function (entry) {
    var slug = entry.slug;
    var client = loadClient(slug);

    if (!client) {
      results.failed.push(slug + ": loadClient returned null");
      return;
    }

    // config checks
    if (!client.config)                        results.failed.push(slug + ": config missing");
    else if (!client.config.client)            results.failed.push(slug + ": config.client missing");
    else if (!client.config.client.firstName)  results.failed.push(slug + ": config.client.firstName missing");
    else                                       results.passed.push(slug + ": config OK (" + client.config.client.firstName + " " + client.config.client.lastName + ")");

    // plan checks
    if (!client.plan)                          results.failed.push(slug + ": plan missing");
    else if (!Array.isArray(client.plan.weeks)) results.failed.push(slug + ": plan.weeks not an array");
    else                                       results.passed.push(slug + ": plan OK (" + client.plan.weeks.length + " weeks)");

    // exercises checks
    if (!Array.isArray(client.exercises))      results.failed.push(slug + ": exercises not an array");
    else if (client.exercises.length === 0)    results.failed.push(slug + ": exercises array is empty");
    else {
      // verify all exercise IDs referenced in plan sessions resolve
      var exerciseIds = new Set(client.exercises.map(function (e) { return e.id; }));
      var unresolvedIds = [];
      client.plan.weeks.forEach(function (week) {
        week.sessions.forEach(function (session) {
          session.exercises.forEach(function (exId) {
            if (!exerciseIds.has(exId)) unresolvedIds.push(exId);
          });
        });
      });

      if (unresolvedIds.length > 0) {
        results.failed.push(slug + ": unresolved exercise IDs in plan: " + unresolvedIds.join(", "));
      } else {
        results.passed.push(slug + ": exercises OK (" + client.exercises.length + " exercises, all plan IDs resolve)");
      }
    }
  });

  console.group("[loader] Checkpoint 1 verification");
  results.passed.forEach(function (msg) { console.log("  PASS  " + msg); });
  results.failed.forEach(function (msg) { console.error("  FAIL  " + msg); });
  console.log("  " + results.passed.length + " passed, " + results.failed.length + " failed");
  console.groupEnd();

  return results.failed.length === 0;
}

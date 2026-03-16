// ─────────────────────────────────────────────────────────────────────────────
// GET /api/client/:slug  —  single client data
//
// Returns the complete client data set in the same shape as the Phase 3
// loadClient() synchronous function:
//   { clientId, config, plan, exercises }
//
// clientId is the stable platform identity for this client. It equals the
// URL slug in Phase 4. All future modules (session logging, video upload,
// multi-coach assignment) reference clients by clientId, not by URL slug,
// so consumers are not broken if slugs are ever renamed.
//
// DATA LOADING STRATEGY (vm.createContext isolation)
// ──────────────────────────────────────────────────
// Phase 3 known limitation: clients/<slug>/exercises.js declares
// `const EXERCISE_LIBRARY`, which collides with the canonical library's
// global of the same name. This is the Phase 4 resolution documented in
// pain-build-constitution.md Section 2.
//
// Resolution: two separate vm contexts eliminate the naming conflict.
//
//   Context A (canonical data):
//     1. packages/exercise-library/index.js  → EXERCISE_LIBRARY (const)
//     2. clients/<slug>/client.config.js     → CLIENT_CONFIG    (const)
//     3. clients/<slug>/plan.js              → plan data        (const)
//     Values extracted via vm.runInContext('NAME', ctx) — const declarations
//     are cross-script visible within a shared context but do not become
//     properties of the sandbox object, so property access (ctx.X) returns
//     undefined. Name evaluation returns the correct value.
//
//   Context B (isolated for exercises.js):
//     4. clients/<slug>/exercises.js         → per-client exercise overrides
//     Isolated to avoid the SyntaxError that would occur if EXERCISE_LIBRARY
//     were declared twice in the same vm context.
//
//   Step 5: mergeExercises(libraryFromA, overridesFromB) → resolved set
//
// PROGRAMME TYPE COMPATIBILITY
// ─────────────────────────────
// The response envelope { clientId, config, plan, exercises } is generic.
// The `plan` key's internal structure varies by programme type (rehab, PT,
// sport-specific, endurance, etc.). This route does not parse or validate
// plan content — it serves whatever the canonical plan.js exports. Future
// programme types add new plan shapes without changing this route.
//
// VIDEO MODULE GUARD RAIL
// ────────────────────────
// clientId is included at the top level of every response so future modules
// (async video upload, live session scheduling) can reference this client
// by a stable identity without string-parsing the request URL.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const vm   = require('vm');
const path = require('path');

// mrpainpt/ root — four levels up from api/routes/
//   routes/ → api/ → coach/ → apps/ → mrpainpt/
const MRPAINPT = path.resolve(__dirname, '../../../..');

const EXERCISE_LIBRARY_PATH = path.join(MRPAINPT, 'packages', 'exercise-library', 'index.js');

// Cache the canonical exercise library for the warm function lifecycle.
var _canonicalLibrary = null;

function getCanonicalLibrary() {
  if (_canonicalLibrary) return _canonicalLibrary;
  var ctx = vm.createContext({});
  vm.runInContext(fs.readFileSync(EXERCISE_LIBRARY_PATH, 'utf8'), ctx);
  _canonicalLibrary = vm.runInContext('EXERCISE_LIBRARY', ctx);
  return _canonicalLibrary;
}

// ── Exercise merge ─────────────────────────────────────────────────────────
// Mirrors the _mergeExercises() logic in loader.js (maintained in sync).
// Overrides matched by id are shallow-spread on top of the library entry.
// Overrides with unknown ids are appended as new exercises.
// ──────────────────────────────────────────────────────────────────────────
function mergeExercises(library, overrides) {
  if (!Array.isArray(overrides) || overrides.length === 0) {
    return library.slice();
  }
  var overrideMap = {};
  overrides.forEach(function (o) { overrideMap[o.id] = o; });

  var merged = library.map(function (ex) {
    return overrideMap[ex.id]
      ? Object.assign({}, ex, overrideMap[ex.id])
      : ex;
  });
  // Append overrides whose ids do not appear in the canonical library
  overrides.forEach(function (o) {
    var inLibrary = library.some(function (ex) { return ex.id === o.id; });
    if (!inLibrary) merged.push(o);
  });
  return merged;
}

// ── Client file loader ─────────────────────────────────────────────────────
// Loads all three canonical client files into isolated vm contexts.
// Returns { config, plan, overrides } or null if the client is not found.
// ──────────────────────────────────────────────────────────────────────────
function loadClientFiles(slug) {
  var clientDir     = path.join(MRPAINPT, 'clients', slug);
  var configPath    = path.join(clientDir, 'client.config.js');
  var planPath      = path.join(clientDir, 'plan.js');
  var exercisesPath = path.join(clientDir, 'exercises.js');

  if (!fs.existsSync(configPath)) return null; // unknown slug

  var library = getCanonicalLibrary();

  // ── Context A: canonical data (exercise library + config + plan) ──────────
  // Pre-seed with EXERCISE_LIBRARY so plan.js can reference it by name if needed.
  var ctxA = vm.createContext({});
  vm.runInContext(fs.readFileSync(EXERCISE_LIBRARY_PATH, 'utf8'), ctxA); // EXERCISE_LIBRARY
  vm.runInContext(fs.readFileSync(configPath, 'utf8'), ctxA);             // CLIENT_CONFIG
  vm.runInContext(fs.readFileSync(planPath, 'utf8'), ctxA);               // programme plan data

  // Extract via name evaluation — const declarations are cross-script visible
  // within a shared context but do NOT propagate to ctx.X as properties.
  var config = vm.runInContext('CLIENT_CONFIG', ctxA);
  // plan.js may use any export name depending on programme type.
  // Try the known Phase 4 names in order; fall back to null.
  var plan = null;
  var planCandidates = [
    'REHAB_PLAN', 'PROGRAMME_PLAN', 'TRAINING_PLAN', 'PLAN',
  ];
  for (var i = 0; i < planCandidates.length; i++) {
    try {
      var candidate = vm.runInContext(planCandidates[i], ctxA);
      if (candidate !== null && candidate !== undefined) { plan = candidate; break; }
    } catch (_) { /* not defined — try next */ }
  }

  // ── Context B: exercises.js (isolated — avoids const re-declaration error) ─
  var overrides = [];
  if (fs.existsSync(exercisesPath)) {
    try {
      var ctxB = vm.createContext({});
      vm.runInContext(fs.readFileSync(exercisesPath, 'utf8'), ctxB);
      // exercises.js currently declares `const EXERCISE_LIBRARY` (Phase 3 naming
      // convention). Extract it by name. In a future client file that correctly
      // declares CLIENT_EXERCISE_OVERRIDES, the fallback below handles it.
      var raw = null;
      try { raw = vm.runInContext('CLIENT_EXERCISE_OVERRIDES', ctxB); } catch (_) {}
      if (!raw) {
        try { raw = vm.runInContext('EXERCISE_LIBRARY', ctxB); } catch (_) {}
      }
      if (Array.isArray(raw)) overrides = raw;
    } catch (err) {
      console.error('[client/' + slug + '] exercises.js load error:', err.message);
      // Non-fatal: proceed with empty overrides (canonical library is used as-is)
    }
  }

  return { config: config, plan: plan, overrides: overrides };
}

// ── Slug validation ────────────────────────────────────────────────────────
// Accepts lowercase alphanumeric + hyphens only. Must start with alphanumeric.
// Prevents path traversal (e.g. ../../../etc/passwd).
var SLUG_RE = /^[a-z0-9][a-z0-9\-]{0,63}$/;

/**
 * Handler: GET /api/client/:slug
 *
 * Returns:
 *   200 { clientId, config, plan, exercises }
 *   400 { error }  — invalid slug format
 *   404 { error }  — client not found
 *   500 { error }  — internal load failure
 */
module.exports.get = async function get(req) {
  var slug = req.params.slug;

  if (!SLUG_RE.test(slug)) {
    return { status: 400, body: { error: 'Invalid client slug', slug: slug } };
  }

  var data;
  try {
    data = loadClientFiles(slug);
  } catch (err) {
    console.error('[client/' + slug + '] Load error:', err.message);
    return { status: 500, body: { error: 'Failed to load client data' } };
  }

  if (!data) {
    return { status: 404, body: { error: 'Client not found', clientId: slug } };
  }

  var exercises = mergeExercises(getCanonicalLibrary(), data.overrides);

  return {
    status: 200,
    body: {
      // clientId: stable platform identity for this client.
      // Referenced by future modules: session logging, video upload,
      // multi-coach assignment, progress review. Equals slug in Phase 4.
      clientId:  slug,
      config:    data.config,
      plan:      data.plan,
      exercises: exercises,
    },
  };
};

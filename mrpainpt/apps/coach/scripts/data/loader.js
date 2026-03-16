// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL DATA LOADER
//
// Single entry point for all coach portal views to access client data.
// Views never read global variables directly — they call loadClient(slug).
//
// PHASE 4 — API-DRIVEN
//   loadClient(slug) fetches data from the authenticated REST API.
//   Returns a Promise that resolves to { config, plan, exercises }.
//   401 responses clear the local token and redirect to #login.
//   404 responses resolve to null (unknown slug — callers handle).
//
//   Authorization header is obtained from COACH_AUTH.authHeaders().
//   COACH_AUTH (scripts/auth.js) must be loaded before this file.
//
// Return shape (unchanged from Phase 3):
//   {
//     config:    object  — client config (branding, profile, goals)
//     plan:      object  — programme plan (phases[], weeks[])
//     exercises: array   — merged exercise set (library + client overrides,
//                          merged server-side by the API)
//   }
//   Resolves to null if the slug is not found or data cannot be loaded.
// ─────────────────────────────────────────────────────────────────────────────


// ── loadClient ────────────────────────────────────────────────────────────────
// Primary public API for all coach portal views.
//
// Args:
//   slug {string} — client slug; must match a key in CLIENT_REGISTRY
//
// Returns:
//   Promise<{ config, plan, exercises } | null>
//   Resolves to null on 404 or missing auth; rejects on network / 5xx errors.

async function loadClient(slug) {
  var headers = (typeof COACH_AUTH !== 'undefined' && COACH_AUTH.authHeaders)
    ? COACH_AUTH.authHeaders()
    : null;

  if (!headers) {
    console.error('[loader] No auth headers available. User is not authenticated.');
    return null;
  }

  var res = await fetch('/api/client/' + encodeURIComponent(slug), { headers: headers });

  if (res.status === 401) {
    // Token expired mid-session — clear it and redirect to login
    if (typeof COACH_AUTH !== 'undefined') COACH_AUTH.clearToken();
    location.replace('#login');
    return null;
  }

  if (res.status === 404) {
    return null;
  }

  if (!res.ok) {
    throw new Error('[loader] API error ' + res.status + ' loading client: ' + slug);
  }

  var data = await res.json();
  return {
    config:    data.config,
    plan:      data.plan,
    exercises: data.exercises,
  };
}

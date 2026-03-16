// ─────────────────────────────────────────────────────────────────────────────
// GET /api/clients  —  coach client roster
//
// Returns the platform CLIENT_REGISTRY: a list of all registered client slugs
// and their active status. The coach portal uses this to build the client list.
//
// Reads apps/coach/scripts/data/registry.js via vm.createContext() isolation.
// The registry file uses a `var CLIENT_REGISTRY = [...]` declaration which
// propagates to the vm sandbox and is extracted by name evaluation.
//
// Generic by design: CLIENT_REGISTRY contains slugs and active flags only.
// No programme-type assumptions. Serves rehab, PT, sport, and any future type.
//
// Phase 4 extension points:
//   - Add pagination: ?page=N&limit=N query params to the handler
//   - Add programme type filter: ?type=rehab|pt|sport
//   - Add coach-scope filter when multi-coach support lands
//   Neither requires a route change — handler signature is stable.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const vm   = require('vm');
const path = require('path');

// registry.js is at:  apps/coach/scripts/data/registry.js
// This file is at:    apps/coach/api/routes/clients.js
// Relative path:      ../../scripts/data/registry.js
const REGISTRY_PATH = path.resolve(__dirname, '../../scripts/data/registry.js');

// Cache the registry for the lifetime of this warm function instance.
// Netlify cold starts re-require the module so the cache resets on deploy.
var _registry = null;

function loadRegistry() {
  if (_registry) return _registry;
  var ctx = vm.createContext({});
  vm.runInContext(fs.readFileSync(REGISTRY_PATH, 'utf8'), ctx);
  // registry.js declares `var CLIENT_REGISTRY = [...]`
  // var declarations propagate to the vm sandbox — extract by name evaluation.
  _registry = vm.runInContext('CLIENT_REGISTRY', ctx);
  return _registry;
}

/**
 * Handler: GET /api/clients
 * Returns { clients: Array<{ slug: string, active: boolean }> }
 */
module.exports.list = async function list(req) {
  var registry;
  try {
    registry = loadRegistry();
  } catch (err) {
    console.error('[clients] Failed to load registry:', err.message);
    return { status: 500, body: { error: 'Could not load client registry' } };
  }

  if (!Array.isArray(registry)) {
    return { status: 500, body: { error: 'CLIENT_REGISTRY is not an array' } };
  }

  return {
    status: 200,
    body:   { clients: registry },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// PAIN SYSTEM API — URL ROUTER
//
// Custom URL pattern router. No framework. No external dependencies.
// Registers method + path patterns; dispatches incoming requests to handlers.
//
// Pattern syntax: /api/client/:slug  (colon-prefixed segments are captured)
//
// Usage:
//   const router = require('./router');
//   router.get('/api/clients', handler);
//   router.post('/api/client/:slug/notes', handler);
//   const result = await router.dispatch('GET', '/api/clients', req);
//   // result: { status: number, body: object }
//
// Handler signature:
//   async function handler(req) → { status: number, body: object }
//   req.params is populated from the URL pattern before handler is called.
//
// Generic by design: works for any programme type (rehab, PT, sport, etc.).
// No route-level knowledge of domain concepts.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

// Compile a pattern string like '/api/client/:slug/notes' into a regex
// and a list of named param positions.
//
// Step 1: Escape real regex special characters — but NOT colon (:) or slash (/).
//   Colons are the param-prefix character; forward slashes are literal separators.
// Step 2: Replace :paramName with ([^/]+) to capture the segment.
function compilePattern(pattern) {
  var paramNames = [];
  var regexStr = pattern
    .replace(/[.+*?^${}()|[\]\\]/g, '\\$&')         // escape regex specials (not : or /)
    .replace(/:([a-zA-Z][a-zA-Z0-9_]*)/g, function (_, name) {
      paramNames.push(name);
      return '([^/]+)';
    });
  return { regex: new RegExp('^' + regexStr + '$'), paramNames: paramNames };
}

function Router() {
  this._routes = [];
}

Router.prototype._add = function (method, pattern, handler) {
  this._routes.push({
    method:   method.toUpperCase(),
    compiled: compilePattern(pattern),
    handler:  handler,
  });
};

Router.prototype.get    = function (p, h) { this._add('GET',    p, h); };
Router.prototype.post   = function (p, h) { this._add('POST',   p, h); };
Router.prototype.put    = function (p, h) { this._add('PUT',    p, h); };
Router.prototype.patch  = function (p, h) { this._add('PATCH',  p, h); };
Router.prototype.delete = function (p, h) { this._add('DELETE', p, h); };

// Dispatch a request to the matching route handler.
// Returns { status, body }. Never throws — unmatched routes return 404.
Router.prototype.dispatch = async function (method, path, req) {
  var upper = method.toUpperCase();
  for (var i = 0; i < this._routes.length; i++) {
    var route = this._routes[i];
    if (route.method !== upper) continue;
    var match = path.match(route.compiled.regex);
    if (!match) continue;

    // Populate req.params from named captures
    req.params = {};
    route.compiled.paramNames.forEach(function (name, idx) {
      req.params[name] = decodeURIComponent(match[idx + 1]);
    });

    return await route.handler(req);
  }

  return { status: 404, body: { error: 'Not found', path: path } };
};

module.exports = new Router();

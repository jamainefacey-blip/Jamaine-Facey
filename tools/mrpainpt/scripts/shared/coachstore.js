// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Coach Store  v2  (unified local + API adapter)
//  ─────────────────────────────────────────────────────────────────────────────
//
//  Single swap-point for all coach client data reads and writes.
//
//  Two modes:
//    "local"  — reads/writes localStorage  (default, no server required)
//    "api"    — reads/writes the Mr Pain PT backend API
//
//  On startup, CoachStore auto-detects whether the backend is reachable.
//  If GET /api/health responds, it switches to "api" mode automatically.
//  Falls back to "local" if the server is unreachable or returns an error.
//
//  Mode switching:
//    CoachStore.setMode("api", "http://localhost:3000")  — force API mode
//    CoachStore.setMode("local")                         — force local mode
//    CoachStore.getMode()                                — "local" | "api"
//    CoachStore.getApiBase()                             — URL or null
//
//  Public API surface — unchanged from v1 (existing callers do not break):
//    getAll()                                — local mode only; returns {} in API mode
//    getClient(slug)                         — sync, local cache
//    hasEdits(slug)                          — sync, local cache
//    cacheClient(slug, { clientConfig, program })
//    saveClient(slug, { clientConfig, program })
//    clearClient(slug)
//    applyToGlobals(slug)                    — sync merge, local cache only
//
//  New async API (works in both modes; callbacks follow (err, data) convention):
//    listClientsAsync(cb)                    — list all clients
//    getClientAsync(slug, cb)                — full record + server-resolved access
//    saveClientAsync(slug, data, cb)         — save coach edits
//    createClientAsync(slug, data, cb)       — create a new client record
//    applyToGlobalsAsync(slug, cb)           — apply overrides to window globals
//    detectApiAsync(apiBase, cb)             — probe API + auto-switch if reachable
//
//  Propagation to rehab module (loader.js):
//    loader.js calls CoachStore.applyToGlobalsAsync(slug, callback) after the
//    static client file has loaded. In API mode this fetches the server record
//    and merges coach edits + server-resolved access onto globals. In local mode
//    it merges localStorage overrides synchronously then calls the callback.
// ─────────────────────────────────────────────────────────────────────────────

const CoachStore = (function () {
  "use strict";

  // ── State ────────────────────────────────────────────────────────────────────

  const LOCAL_KEY  = "mrpainpt_coach_v1";
  const TOKEN_KEY  = "mrpainpt_coach_token";
  let _mode         = "local";
  let _apiBase      = null;
  let _authToken    = null;       // in-memory; loaded from sessionStorage at setMode
  let _onUnauth     = null;       // callback(status) invoked on 401/403 responses

  // ── localStorage helpers ─────────────────────────────────────────────────────

  function _load() {
    try { return JSON.parse(localStorage.getItem(LOCAL_KEY)) || {}; }
    catch (_) { return {}; }
  }

  function _persist(data) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); }
    catch (_) { console.warn("[CoachStore] localStorage write failed."); }
  }

  // ── Deep merge: src onto dst (1-level deep for objects; arrays replace) ─────

  function _merge(dst, src) {
    if (!src || typeof src !== "object" || Array.isArray(src)) return src ?? dst;
    const out = Object.assign({}, dst);
    Object.keys(src).forEach(k => {
      if (src[k] !== null && typeof src[k] === "object" && !Array.isArray(src[k])) {
        out[k] = _merge(dst ? dst[k] : undefined, src[k]);
      } else {
        out[k] = src[k];
      }
    });
    return out;
  }

  // ── Derive client list from local cache ──────────────────────────────────────

  function _localList() {
    const all = _load();
    return Object.keys(all).map(slug => {
      const e = all[slug] || {};
      const c = e.clientConfig?.client || {};
      return {
        slug,
        name:         [c.firstName, c.lastName].filter(Boolean).join(" ") || slug,
        accessType:   e.program?.access?.type   || null,
        accessStatus: e.program?.access?.status || null,
        _hasEdits:    !!e._hasEdits,
        updatedAt:    e._editedAt || e._cachedAt || null,
      };
    });
  }

  // ── API fetch helpers ────────────────────────────────────────────────────────
  // Public routes (GET /health, GET /clients/:slug) — no auth header needed.
  // Protected routes (list, create, update) — include Authorization: Bearer.

  function _authHeaders() {
    const h = { "Content-Type": "application/json" };
    if (!_authToken) {
      try { _authToken = sessionStorage.getItem(TOKEN_KEY) || null; } catch (_) {}
    }
    if (_authToken) h["Authorization"] = `Bearer ${_authToken}`;
    return h;
  }

  function _handleAuthError(status, cb) {
    if (status === 401 || status === 403) {
      if (_onUnauth) _onUnauth(status);
    }
    cb(new Error(`HTTP ${status}`), null);
  }

  // Public GET (no auth header — used for client data reads from rehab module)
  function _getPublic(path, cb) {
    fetch(`${_apiBase}${path}`)
      .then(r => { if (!r.ok) throw Object.assign(new Error(`${r.status}`), { status: r.status }); return r.json(); })
      .then(d  => cb(null, d))
      .catch(e => cb(e, null));
  }

  // Authenticated GET (used for admin list)
  function _get(path, cb) {
    fetch(`${_apiBase}${path}`, { headers: _authHeaders() })
      .then(r => {
        if (r.status === 401 || r.status === 403) return _handleAuthError(r.status, cb);
        if (!r.ok) throw Object.assign(new Error(`${r.status}`), { status: r.status });
        return r.json();
      })
      .then(d  => d && cb(null, d))
      .catch(e => cb(e, null));
  }

  function _put(path, body, cb) {
    fetch(`${_apiBase}${path}`, {
      method:  "PUT",
      headers: _authHeaders(),
      body:    JSON.stringify(body),
    })
      .then(r => {
        if (r.status === 401 || r.status === 403) return _handleAuthError(r.status, cb);
        if (!r.ok) throw Object.assign(new Error(`${r.status}`), { status: r.status });
        return r.json();
      })
      .then(d  => d && cb(null, d))
      .catch(e => cb(e, null));
  }

  function _post(path, body, cb) {
    fetch(`${_apiBase}${path}`, {
      method:  "POST",
      headers: _authHeaders(),
      body:    JSON.stringify(body),
    })
      .then(r => {
        if (r.status === 401 || r.status === 403) return _handleAuthError(r.status, cb);
        if (!r.ok) return r.json().then(e => { throw e; });
        return r.json();
      })
      .then(d  => d && cb(null, d))
      .catch(e => cb(e, null));
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  return {

    // ── Mode control ────────────────────────────────────────────────────────────

    setMode(mode, apiBase) {
      _mode    = mode === "api" ? "api" : "local";
      _apiBase = apiBase || null;
    },

    getMode()    { return _mode; },
    getApiBase() { return _apiBase; },

    /** Probe the API; if it responds, auto-switch to API mode. */
    detectApiAsync(apiBase, cb) {
      const base = apiBase || "http://localhost:3000";
      fetch(`${base}/api/health`, { signal: AbortSignal.timeout(2000) })
        .then(r => r.json())
        .then(d => {
          if (d.status === "ok") {
            _mode    = "api";
            _apiBase = base;
            cb(null, { mode: "api", apiBase: base });
          } else {
            cb(null, { mode: "local", apiBase: null });
          }
        })
        .catch(() => {
          cb(null, { mode: "local", apiBase: null });
        });
    },

    // ── Auth token management ────────────────────────────────────────────────────

    setAuthToken(token) {
      _authToken = token || null;
      try {
        if (token) sessionStorage.setItem(TOKEN_KEY, token);
        else        sessionStorage.removeItem(TOKEN_KEY);
      } catch (_) {}
    },

    getAuthToken() {
      if (_authToken) return _authToken;
      try {
        const t = sessionStorage.getItem(TOKEN_KEY);
        if (t) { _authToken = t; return t; }
      } catch (_) {}
      return null;
    },

    clearAuthToken() {
      _authToken = null;
      try { sessionStorage.removeItem(TOKEN_KEY); } catch (_) {}
    },

    onUnauthorized(cb) { _onUnauth = cb; },

    /** Verify a token against the API; on success auto-switches to API mode. */
    testAuth(apiBase, token, cb) {
      const base = (apiBase || "http://localhost:3000").replace(/\/$/, "");
      fetch(`${base}/api/clients`, {
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        signal:  AbortSignal.timeout(3000),
      })
        .then(r => {
          if (r.status === 401 || r.status === 403) {
            throw Object.assign(new Error("Invalid API key"), { status: r.status });
          }
          if (!r.ok) throw Object.assign(new Error(`HTTP ${r.status}`), { status: r.status });
          return r.json();
        })
        .then(() => {
          _mode      = "api";
          _apiBase   = base;
          _authToken = token;
          try { sessionStorage.setItem(TOKEN_KEY, token); } catch (_) {}
          cb(null, { mode: "api", apiBase: base });
        })
        .catch(e => cb(e, null));
    },

    // ── Sync local API (v1 surface — unchanged) ─────────────────────────────────

    getAll()        { return _load(); },
    getClient(slug) { return _load()[slug] || null; },
    hasEdits(slug)  { return !!_load()[slug]?._hasEdits; },

    cacheClient(slug, { clientConfig, program }) {
      const all = _load();
      if (all[slug]) return;   // never overwrite existing entry (may have edits)
      all[slug] = {
        clientConfig,
        program,
        _slug:      slug,
        _hasEdits:  false,
        _cachedAt:  new Date().toISOString(),
        _editedAt:  null,
      };
      _persist(all);
    },

    saveClient(slug, { clientConfig, program }) {
      const all  = _load();
      const prev = all[slug] || {};
      all[slug]  = {
        ...prev,
        clientConfig,
        program,
        _slug:     slug,
        _hasEdits: true,
        _editedAt: new Date().toISOString(),
      };
      _persist(all);
    },

    clearClient(slug) {
      const all = _load();
      delete all[slug];
      _persist(all);
    },

    /** Sync merge — applies local cache overrides to window globals. */
    applyToGlobals(slug) {
      const stored = _load()[slug];
      if (!stored || !stored._hasEdits) return false;
      if (stored.clientConfig && window.CLIENT_CONFIG) {
        window.CLIENT_CONFIG = _merge(window.CLIENT_CONFIG, stored.clientConfig);
      }
      if (stored.program && window.PROGRAM) {
        window.PROGRAM = _merge(window.PROGRAM, stored.program);
      }
      return true;
    },

    // ── Async API (works in both modes; (err, data) callbacks) ──────────────────

    /** List all clients: [ { slug, name, accessType, accessStatus, _hasEdits, updatedAt } ] */
    listClientsAsync(cb) {
      if (_mode === "api" && _apiBase) {
        _get("/api/clients", (err, data) => {
          if (err) {
            console.warn("[CoachStore] API list failed, using local cache", err.message);
            return cb(null, _localList());
          }
          // Merge local cache entries not yet on server into the list
          const slugsOnServer = new Set((data.clients || []).map(c => c.slug));
          const localOnly     = _localList().filter(c => !slugsOnServer.has(c.slug));
          cb(null, [...(data.clients || []), ...localOnly]);
        });
      } else {
        cb(null, _localList());
      }
    },

    /** Get a single client with server-resolved access block. */
    getClientAsync(slug, cb) {
      if (_mode === "api" && _apiBase) {
        _getPublic(`/api/clients/${slug}`, (err, data) => {
          if (err) {
            console.warn("[CoachStore] API get failed, using local cache", err.message);
            return cb(null, this.getClient(slug));
          }
          // Keep a local cache copy for offline fallback
          this.cacheClient(slug, { clientConfig: data.clientConfig, program: data.program });
          cb(null, data);
        });
      } else {
        cb(null, this.getClient(slug));
      }
    },

    /** Save coach edits. In API mode writes to server; always writes to local cache. */
    saveClientAsync(slug, { clientConfig, program }, cb) {
      // Always write locally first so the UI never blocks on network
      this.saveClient(slug, { clientConfig, program });

      if (_mode === "api" && _apiBase) {
        _put(`/api/clients/${slug}`, { clientConfig, program, _hasEdits: true }, (err, saved) => {
          if (err) {
            console.warn("[CoachStore] API save failed, saved locally only", err.message);
            return cb(null, { clientConfig, program });
          }
          cb(null, saved);
        });
      } else {
        cb(null, { clientConfig, program });
      }
    },

    /** Create a brand-new client. In API mode POSTs to server. */
    createClientAsync(slug, { clientConfig, program }, cb) {
      if (_mode === "api" && _apiBase) {
        _post("/api/clients", { slug, clientConfig, program }, (err, created) => {
          if (err) {
            console.warn("[CoachStore] API create failed", err);
            return cb(err, null);
          }
          // Cache locally
          this.saveClient(slug, { clientConfig: created.clientConfig, program: created.program });
          cb(null, created);
        });
      } else {
        this.saveClient(slug, { clientConfig, program });
        cb(null, { slug, clientConfig, program, _hasEdits: true });
      }
    },

    /**
     * Apply coach overrides to window globals — async version for loader.js.
     * In API mode: fetches full record from server (includes server-resolved access),
     *   merges onto globals, then calls cb().
     * In local mode: delegates to sync applyToGlobals() then calls cb().
     */
    applyToGlobalsAsync(slug, cb) {
      if (_mode === "api" && _apiBase) {
        _getPublic(`/api/clients/${slug}`, (err, data) => {
          if (err) {
            console.warn("[CoachStore] API applyToGlobals failed, using local", err.message);
            this.applyToGlobals(slug);
            return cb();
          }
          if (data.clientConfig && window.CLIENT_CONFIG) {
            window.CLIENT_CONFIG = _merge(window.CLIENT_CONFIG, data.clientConfig);
          }
          if (data.program && window.PROGRAM) {
            window.PROGRAM = _merge(window.PROGRAM, data.program);
          }
          // Overwrite access block with server-resolved version — cannot be bypassed
          if (data.access && window.PROGRAM) {
            window.PROGRAM.access = {
              type:   data.access.type   || window.PROGRAM.access?.type,
              status: data.access.status || window.PROGRAM.access?.status,
            };
          }
          cb();
        });
      } else {
        this.applyToGlobals(slug);
        cb();
      }
    },

  };

})();

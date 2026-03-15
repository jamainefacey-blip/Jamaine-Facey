// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — Coach Store  (shared adapter layer)
//  ─────────────────────────────────────────────────────────────────────────────
//
//  Single swap-point for all coach-edited client data.
//  Current backend: localStorage (key: mrpainpt_coach_v1)
//
//  To swap to a real backend:
//   1. Replace _load() with await fetch("/api/coach/clients")
//   2. Replace _save() with await fetch("/api/coach/clients", { method:"PUT", body })
//   3. All callers already handle the returned data — no other changes needed.
//
//  Data shape stored per client slug:
//  {
//    clientConfig: { ... }   — full CLIENT_CONFIG override
//    program:      { ... }   — full PROGRAM override
//    _slug:        string    — client slug
//    _hasEdits:    boolean   — true = coach has saved edits (vs plain cache)
//    _cachedAt:    ISO       — when static file was first cached
//    _editedAt:    ISO|null  — when coach last saved
//  }
//
//  Propagation to rehab module:
//    loader.js calls CoachStore.applyToGlobals(slug) after loading the static
//    client file. If the coach has edits, they are deep-merged onto top of the
//    globals so the rehab module sees the coach's version automatically.
// ─────────────────────────────────────────────────────────────────────────────

const CoachStore = (function () {
  "use strict";

  const KEY = "mrpainpt_coach_v1";

  function _load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch (_) { return {}; }
  }

  function _save(data) {
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (_) { console.warn("[CoachStore] localStorage write failed."); }
  }

  // Deep merge src into dst (one level deep for arrays — replace, not concat).
  function _merge(dst, src) {
    if (!src || typeof src !== "object") return dst;
    const out = { ...dst };
    Object.keys(src).forEach(k => {
      if (src[k] !== null && typeof src[k] === "object" && !Array.isArray(src[k])) {
        out[k] = _merge(dst[k] || {}, src[k]);
      } else {
        out[k] = src[k];
      }
    });
    return out;
  }

  return {

    // ── Read ────────────────────────────────────────────────────────────────

    getAll() {
      return _load();
    },

    getClient(slug) {
      return _load()[slug] || null;
    },

    hasEdits(slug) {
      return !!_load()[slug]?._hasEdits;
    },

    // ── Write ───────────────────────────────────────────────────────────────

    // Store static file baseline — first access only, never overwrites edits.
    cacheClient(slug, { clientConfig, program }) {
      const all = _load();
      if (all[slug]) return;  // already cached — don't overwrite coach edits
      all[slug] = {
        clientConfig,
        program,
        _slug:      slug,
        _hasEdits:  false,
        _cachedAt:  new Date().toISOString(),
        _editedAt:  null,
      };
      _save(all);
    },

    // Save coach edits — marks _hasEdits = true.
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
      _save(all);
    },

    // Revert to static file — clears coach edits (cache entry removed).
    clearClient(slug) {
      const all = _load();
      delete all[slug];
      _save(all);
    },

    // ── Rehab integration ──────────────────────────────────────────────────
    // Called by loader.js after the static client file has been loaded.
    // If the coach has saved edits, merges them onto the window globals.
    // Returns true if overrides were applied.
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

  };

})();

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS STORE  —  Isolated session-state layer (v2)
//
// This module owns all reads and writes to localStorage.
// To swap for a backend: replace the internal _load/_save/_persist functions
// with async fetch calls. The public API surface stays identical.
// ─────────────────────────────────────────────────────────────────────────────

const ProgressStore = (function () {
  const STATE_KEY   = "ps_rehab_v2_progress";
  const VISITED_KEY = "ps_rehab_v2_visited";

  // Raw object keyed by session ID
  let _state = _load();

  function _load() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function _persist() {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(_state));
    } catch (_) {}
  }

  // Ensure a session entry exists and return it
  function _ensureSession(sid) {
    if (!_state[sid]) {
      _state[sid] = {
        completed:    false,
        painRating:   null,
        effortRating: null,
        exercises:    {},
      };
    }
    return _state[sid];
  }

  return {
    // ── Read ──────────────────────────────────────────────────────────────────

    getSession(sid) {
      return { ..._ensureSession(sid) };   // return a copy so caller can't mutate directly
    },

    isSessionDone(sid) {
      return !!_state[sid]?.completed;
    },

    hasVisited() {
      try { return !!localStorage.getItem(VISITED_KEY); } catch (_) { return false; }
    },

    getAll() {
      return JSON.parse(JSON.stringify(_state));  // deep copy
    },

    // ── Write ─────────────────────────────────────────────────────────────────

    saveSession(sid, updates) {
      const s = _ensureSession(sid);
      Object.assign(s, updates);
      _persist();
    },

    toggleExercise(sid, eid) {
      const s = _ensureSession(sid);
      s.exercises[eid] = !s.exercises[eid];
      _persist();
      return s.exercises[eid];
    },

    markVisited() {
      try { localStorage.setItem(VISITED_KEY, "1"); } catch (_) {}
    },

    clear() {
      _state = {};
      try { localStorage.removeItem(STATE_KEY); } catch (_) {}
    },

    // ── Seed ──────────────────────────────────────────────────────────────────
    // Call once at init. Seeds pre-completed sessions from program data only if
    // no progress has been recorded yet (fresh device / cleared storage).

    seedFromProgram(sessions) {
      let seeded = false;
      sessions.forEach(s => {
        if (!s._seed) return;
        if (_state[s.id]) return;   // already have data for this session — skip
        if (s._seed.completed) {
          _ensureSession(s.id);
          _state[s.id].completed    = true;
          _state[s.id].painRating   = s._seed.painRating  ?? null;
          _state[s.id].effortRating = s._seed.effortRating ?? null;
          // Mark all exercises as done for seeded completed sessions
          (s.exercises || []).forEach(eid => { _state[s.id].exercises[eid] = true; });
          seeded = true;
        }
      });
      if (seeded) _persist();
    },
  };
})();

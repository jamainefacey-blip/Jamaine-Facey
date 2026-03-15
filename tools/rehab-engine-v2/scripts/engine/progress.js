// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS STORE  —  Isolated session-state + outcome layer
//
// Owns all reads / writes to localStorage.
// To swap for a backend: replace _load / _persist with async fetch.
// The public API surface stays identical.
//
// Storage keys:
//   ps_progress_v2         — session completion state
//   ps_outcomes_v2         — coach-recorded outcome checkpoints
//   ps_visited_v2          — welcome screen skip flag
// ─────────────────────────────────────────────────────────────────────────────

const ProgressStore = (function () {

  const SESSIONS_KEY  = "ps_progress_v2";
  const OUTCOMES_KEY  = "ps_outcomes_v2";
  const VISITED_KEY   = "ps_visited_v2";

  // ── Internal state ──────────────────────────────────────────────────────────
  let _sessions  = _loadKey(SESSIONS_KEY);   // { [sessionId]: SessionState }
  let _outcomes  = _loadKey(OUTCOMES_KEY);   // { painHistory, romHistory, etc. }

  function _loadKey(key) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : {}; }
    catch (_) { return {}; }
  }

  function _persistSessions() {
    try { localStorage.setItem(SESSIONS_KEY, JSON.stringify(_sessions)); } catch (_) {}
  }

  function _persistOutcomes() {
    try { localStorage.setItem(OUTCOMES_KEY, JSON.stringify(_outcomes)); } catch (_) {}
  }

  function _ensureSession(sid) {
    if (!_sessions[sid]) {
      _sessions[sid] = { completed: false, painRating: null, effortRating: null, exercises: {} };
    }
    return _sessions[sid];
  }

  // ── Session API ─────────────────────────────────────────────────────────────

  return {

    // Read
    getSession(sid)     { return { ..._ensureSession(sid) }; },
    isSessionDone(sid)  { return !!_sessions[sid]?.completed; },
    getAll()            { return JSON.parse(JSON.stringify(_sessions)); },

    hasVisited() {
      try { return !!localStorage.getItem(VISITED_KEY); } catch (_) { return false; }
    },

    // Write
    saveSession(sid, updates) {
      Object.assign(_ensureSession(sid), updates);
      _persistSessions();
    },

    toggleExercise(sid, eid) {
      const s = _ensureSession(sid);
      s.exercises[eid] = !s.exercises[eid];
      _persistSessions();
      return s.exercises[eid];
    },

    markVisited() {
      try { localStorage.setItem(VISITED_KEY, "1"); } catch (_) {}
    },

    clearSessions() {
      _sessions = {};
      try { localStorage.removeItem(SESSIONS_KEY); } catch (_) {}
    },

    // Seed pre-completed history from program _seed fields.
    // Applied once per device — skips any session that already has recorded data.
    seedFromProgram(sessions) {
      let dirty = false;
      sessions.forEach(s => {
        if (!s._seed || _sessions[s.id]) return;
        if (s._seed.completed) {
          _ensureSession(s.id);
          _sessions[s.id].completed    = true;
          _sessions[s.id].painRating   = s._seed.painRating   ?? null;
          _sessions[s.id].effortRating = s._seed.effortRating ?? null;
          (s.exercises || []).forEach(eid => { _sessions[s.id].exercises[eid] = true; });
          dirty = true;
        }
      });
      if (dirty) _persistSessions();
    },

    // ── Outcome / trend API ──────────────────────────────────────────────────
    // Used to record reassessment checkpoints and compute pain trends.

    // Return pain ratings from completed sessions in chronological order (by session index).
    getPainHistory(sessions) {
      return sessions
        .filter(s => _sessions[s.id]?.completed && _sessions[s.id]?.painRating != null)
        .map(s => ({ sessionId: s.id, weekNumber: s.weekNumber || null, pain: _sessions[s.id].painRating }));
    },

    // Trend: compare avg of first 3 recorded sessions vs last 3.
    // Returns "improving" | "stable" | "worsening" | "insufficient"
    getPainTrend(sessions) {
      const hist = this.getPainHistory(sessions);
      if (hist.length < 3) return "insufficient";
      const early = hist.slice(0, Math.ceil(hist.length / 2));
      const late  = hist.slice(-Math.ceil(hist.length / 2));
      const avgEarly = early.reduce((a, b) => a + b.pain, 0) / early.length;
      const avgLate  = late.reduce((a, b)  => a + b.pain, 0) / late.length;
      const delta    = avgLate - avgEarly;
      if (delta <= -1) return "improving";
      if (delta >= 1)  return "worsening";
      return "stable";
    },

    // Streak: consecutive weeks (by weekNumber) with at least one completed session.
    getWeekStreak(sessions) {
      const completedWeeks = new Set(
        sessions
          .filter(s => _sessions[s.id]?.completed && s.weekNumber)
          .map(s => s.weekNumber)
      );
      if (!completedWeeks.size) return 0;
      const maxWk = Math.max(...completedWeeks);
      let streak = 0;
      for (let w = maxWk; w >= 1; w--) {
        if (completedWeeks.has(w)) streak++;
        else break;
      }
      return streak;
    },

    // Save a manual outcome checkpoint (coach-entered reassessment data).
    // Merges into stored outcomes rather than replacing the whole object.
    saveOutcomeCheckpoint(checkpoint) {
      if (!_outcomes.checkpoints) _outcomes.checkpoints = [];
      _outcomes.checkpoints.push({ ...checkpoint, recordedAt: new Date().toISOString() });
      _persistOutcomes();
    },

    getOutcomeCheckpoints() {
      return (_outcomes.checkpoints || []).slice().reverse(); // newest first
    },
  };

})();

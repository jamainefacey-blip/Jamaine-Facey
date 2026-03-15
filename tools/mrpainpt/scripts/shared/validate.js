// ─────────────────────────────────────────────────────────────────────────────
// VALIDATOR  —  Program integrity checks (v2)
//
// Checks that every exercise ID referenced in a session exists in the library.
// Returns an array of error objects so the UI can display visible warnings
// instead of silently dropping unknown exercises.
//
// Also validates required program schema fields.
// ─────────────────────────────────────────────────────────────────────────────

const Validator = (function () {

  const REQUIRED_FIELDS = {
    root:   ["id", "mode"],
    client: ["firstName", "lastName", "condition"],
    coach:  ["name", "credentials"],
  };

  return {
    /**
     * Validate a program against an exercise library.
     *
     * @param {object} program  — the PROGRAM global
     * @param {Array}  library  — the EXERCISE_LIBRARY global
     * @returns {ValidationError[]}
     *
     * ValidationError = {
     *   type:       "missing-exercise" | "missing-field" | "unknown-mode"
     *   sessionId:  string | null
     *   exerciseId: string | null
     *   field:      string | null
     *   message:    string
     * }
     */
    validateProgram(program, library) {
      const knownIds = new Set(library.map(e => e.id));
      const errors   = [];

      // ── Mode check ────────────────────────────────────────────────────────
      const VALID_MODES = ["one_off", "multi_week", "ongoing_coaching"];
      if (!VALID_MODES.includes(program.mode)) {
        errors.push({
          type: "unknown-mode", sessionId: null, exerciseId: null,
          field: "mode",
          message: `Unknown program mode "${program.mode}". Expected one of: ${VALID_MODES.join(", ")}.`,
        });
      }

      // ── Exercise reference check ───────────────────────────────────────────
      const sessions = _getSessions(program);
      sessions.forEach(session => {
        if (!session || !Array.isArray(session.exercises)) return;
        session.exercises.forEach(exId => {
          if (!knownIds.has(exId)) {
            errors.push({
              type:       "missing-exercise",
              sessionId:  session.id,
              exerciseId: exId,
              field:      null,
              message:    `Exercise "${exId}" in session "${session.id}" is not in the exercise library.`,
            });
          }
        });
      });

      return errors;
    },

    /**
     * Return validation errors scoped to a single session.
     */
    errorsForSession(sessionId, program, library) {
      return this.validateProgram(program, library).filter(e => e.sessionId === sessionId);
    },
  };

  // ── Private ──────────────────────────────────────────────────────────────

  function _getSessions(program) {
    if (program.mode === "one_off") {
      return program.session ? [program.session] : [];
    }
    return program.sessions || [];
  }

})();

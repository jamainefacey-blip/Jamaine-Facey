// ─────────────────────────────────────────────────────────────────────────────
// VALIDATOR  —  Program integrity checks (v2)
//
// Checks that every exercise ID referenced in a session exists in the library.
// Returns an array of error objects so the UI can display visible warnings
// instead of silently dropping unknown exercises.
// ─────────────────────────────────────────────────────────────────────────────

const Validator = (function () {

  return {
    /**
     * Validate a program against an exercise library.
     *
     * @param {object} program  — the PROGRAM global
     * @param {Array}  library  — the EXERCISE_LIBRARY global
     * @returns {ValidationError[]}
     *
     * ValidationError = {
     *   type:       "missing-exercise"
     *   sessionId:  string
     *   exerciseId: string
     *   message:    string
     * }
     */
    validateProgram(program, library) {
      const knownIds = new Set(library.map(e => e.id));
      const errors   = [];

      const sessions = _getSessions(program);

      sessions.forEach(session => {
        if (!session || !Array.isArray(session.exercises)) return;
        session.exercises.forEach(exId => {
          if (!knownIds.has(exId)) {
            errors.push({
              type:       "missing-exercise",
              sessionId:  session.id,
              exerciseId: exId,
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

  function _getSessions(program) {
    if (program.mode === "single-instruction") {
      return program.session ? [program.session] : [];
    }
    return program.sessions || [];
  }
})();

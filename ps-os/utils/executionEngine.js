'use strict';

/**
 * PS-OS Execution Engine — Simulation Layer
 *
 * Safety contract:
 *   - No eval(), no dynamic imports, no external calls
 *   - Simulation only — logs intent without executing
 *   - All errors caught and recorded
 */

/**
 * executeActions(actions) → { success, steps, errors }
 */
export function executeActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return { success: false, steps: [], errors: ['No actions provided'] };
  }

  const steps  = [];
  const errors = [];

  for (const action of actions) {
    try {
      if (!action || typeof action.type !== 'string' || typeof action.target !== 'string') {
        throw new Error('Invalid action: type and target must be strings');
      }
      if (!['api', 'db', 'ui'].includes(action.type)) {
        throw new Error(`Unknown action type: ${action.type}`);
      }

      steps.push({
        type:    action.type,
        target:  action.target,
        payload: action.payload && typeof action.payload === 'object' ? action.payload : {},
        status:  'simulated',
        ts:      new Date().toISOString(),
      });
    } catch (err) {
      errors.push({
        target: action?.target ?? 'unknown',
        error:  String(err.message),
      });
    }
  }

  return {
    success: errors.length === 0 && steps.length > 0,
    steps,
    errors,
  };
}

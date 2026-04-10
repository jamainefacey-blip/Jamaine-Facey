'use strict';

import { getAllAssets, getAssetById } from './dbOperations';

const MAX_ACTIONS = 5;
const API_TIMEOUT = 5000;
const ALLOWED_API_PREFIX = '/api/';
const API_BASE = () => `http://localhost:${process.env.PORT || 3001}`;

// Static DB handler map — no dynamic dispatch, no eval
const DB_HANDLERS = {
  assets: {
    validate: () => { const rows = getAllAssets(); return { count: rows.length }; },
    default:  () => { const rows = getAllAssets(); return { count: rows.length }; },
  },
  notes: {
    cache: () => {
      const rows = getAllAssets({ type: 'system' });
      const hub  = rows.find(r => r.name === 'Skills Hub');
      return hub ? { hubId: hub.id, status: 'found' } : { status: 'not_found' };
    },
  },
  links: {
    traverse: () => { const rows = getAllAssets(); return { count: rows.length }; },
  },
};

async function runApiAction(target, payload) {
  if (!target.startsWith(ALLOWED_API_PREFIX)) {
    throw new Error(`Blocked: target must start with ${ALLOWED_API_PREFIX}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const res = await fetch(`${API_BASE()}${target}`, {
      method:  'GET',
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { httpStatus: res.status, data };
  } finally {
    clearTimeout(timer);
  }
}

function runDbAction(target, payload) {
  const handlers = DB_HANDLERS[target];
  if (!handlers) throw new Error(`Unknown db target: ${target}`);
  const action = payload?.action || 'default';
  const fn = handlers[action] || handlers.default;
  if (!fn) throw new Error(`No handler for ${target}:${action}`);
  return fn();
}

/**
 * executeActions(actions) → { success, steps, errors }
 * api:  internal fetch to /api/* only (GET, 5s timeout)
 * db:   direct dbOperations call via static map
 * ui:   no execution → status: pending_ui_action
 */
export async function executeActions(actions) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return { success: false, steps: [], errors: ['No actions provided'] };
  }

  const capped  = actions.slice(0, MAX_ACTIONS);
  const steps   = [];
  const errors  = [];

  for (const action of capped) {
    const { type, target, payload } = action || {};

    try {
      if (typeof type !== 'string' || typeof target !== 'string') {
        throw new Error('Invalid action: type and target must be strings');
      }

      let result;
      let status;

      if (type === 'api') {
        result = await runApiAction(target, payload);
        status = 'executed';
      } else if (type === 'db') {
        result = runDbAction(target, payload);
        status = 'executed';
      } else if (type === 'ui') {
        result = null;
        status = 'pending_ui_action';
      } else {
        throw new Error(`Unknown action type: ${type}`);
      }

      steps.push({ type, target, status, result });
    } catch (err) {
      errors.push({ target: target ?? 'unknown', error: String(err.message) });
    }
  }

  return {
    success: errors.length === 0 && steps.length > 0,
    steps,
    errors,
  };
}

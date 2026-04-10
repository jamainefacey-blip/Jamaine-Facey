'use strict';

import { getAllAssets, getAssetById, upsertAsset, addNote, createLink } from './dbOperations';

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

// Explicit write map — no dynamic dispatch, no eval
const DB_WRITE_MAP = {
  'db:upsertAsset': (p) => ({ id: upsertAsset(p || {}, 'execution-engine') }),
  'db:addNote':     (p) => addNote(p?.assetId, String(p?.text || ''), p?.source || 'execution-engine'),
  'db:linkAssets':  (p) => { createLink(p?.assetId, p?.linkedAssetId); return { linked: true }; },
};

async function runApiAction(target, payload, allowWrite) {
  if (!target.startsWith(ALLOWED_API_PREFIX)) {
    throw new Error(`Blocked: target must start with ${ALLOWED_API_PREFIX}`);
  }

  const method = allowWrite ? 'POST' : 'GET';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      signal:  controller.signal,
    };
    if (method === 'POST') opts.body = JSON.stringify(payload || {});

    const res = await fetch(`${API_BASE()}${target}`, opts);
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

function runDbWriteAction(target, payload, allowWrite) {
  if (!allowWrite) return { status: 'blocked', reason: 'write_not_allowed' };
  const fn = DB_WRITE_MAP[target];
  if (!fn) throw new Error(`Unknown write target: ${target}`);
  return fn(payload);
}

/**
 * executeActions(actions, opts) → { success, steps, errors }
 * api:  GET (read) or POST (write, requires allowWrite)
 * db:   read via DB_HANDLERS, write via DB_WRITE_MAP (requires allowWrite)
 * ui:   no execution → status: pending_ui_action
 */
export async function executeActions(actions, opts = {}) {
  const allowWrite = opts.allowWrite === true;
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
        result = await runApiAction(target, payload, allowWrite);
        status = 'executed';
      } else if (type === 'db' && target.startsWith('db:')) {
        const writeResult = runDbWriteAction(target, payload, allowWrite);
        if (writeResult?.status === 'blocked') {
          steps.push({ type, target, status: 'blocked', reason: writeResult.reason });
          continue;
        }
        result = writeResult;
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

      steps.push({ type, target, status, result: result ?? null });
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

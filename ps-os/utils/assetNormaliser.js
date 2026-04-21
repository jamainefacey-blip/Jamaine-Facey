'use strict';

// DB-valid values from schema CHECK constraints
const VALID_TYPES    = ['project', 'tool', 'workflow', 'system'];
const VALID_STATUSES = ['idea', 'defined', 'building', 'active', 'monetising', 'exit'];

// Map spec aliases → DB values
const TYPE_ALIASES   = { general: 'project', data: 'tool' };
const STATUS_ALIASES = { inactive: 'idea', archived: 'exit' };

/**
 * normaliseAssetPayload(input) → valid asset payload for DB insert
 * Throws if name is missing or empty.
 * All fields guaranteed non-undefined.
 */
export function normaliseAssetPayload(input) {
  const raw = input && typeof input === 'object' ? input : {};

  const name = String(raw.name || '').trim();
  if (!name) throw new Error('invalid_name');

  const rawType   = String(raw.type   || '').toLowerCase();
  const rawStatus = String(raw.status || '').toLowerCase();

  const resolvedType   = TYPE_ALIASES[rawType]   || rawType;
  const resolvedStatus = STATUS_ALIASES[rawStatus] || rawStatus;

  return {
    name,
    type:     VALID_TYPES.includes(resolvedType)     ? resolvedType   : 'project',
    status:   VALID_STATUSES.includes(resolvedStatus) ? resolvedStatus : 'active',
    priority: Number(raw.priority) || 3,
    purpose:  String(raw.purpose || 'Auto-created asset'),
  };
}

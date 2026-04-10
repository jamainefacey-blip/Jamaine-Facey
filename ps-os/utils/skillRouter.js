'use strict';

const MAX_ACTIONS = 5;

const SKILL_ACTION_MAP = [
  {
    keywords: ['router', 'dispatch', 'command', 'cli'],
    action: { type: 'ui', target: 'command-router', payload: { mode: 'dispatch' } },
  },
  {
    keywords: ['pipeline', 'workflow', 'stage', 'automation'],
    action: { type: 'api', target: '/api/assets', payload: { type: 'workflow' } },
  },
  {
    keywords: ['search', 'query', 'index', 'retriev'],
    action: { type: 'api', target: '/api/assets', payload: { action: 'search' } },
  },
  {
    keywords: ['schema', 'validate', 'zod', 'joi'],
    action: { type: 'db', target: 'assets', payload: { action: 'validate' } },
  },
  {
    keywords: ['cache', 'memoize', 'ttl'],
    action: { type: 'db', target: 'notes', payload: { action: 'cache' } },
  },
  {
    keywords: ['plugin', 'extend', 'hook'],
    action: { type: 'ui', target: 'plugin-panel', payload: { action: 'load' } },
  },
  {
    keywords: ['event', 'emit', 'listen'],
    action: { type: 'api', target: '/api/status', payload: { action: 'poll' } },
  },
  {
    keywords: ['middleware', 'intercept'],
    action: { type: 'api', target: '/api/ingest', payload: { action: 'intercept' } },
  },
  {
    keywords: ['graph', 'node', 'edge'],
    action: { type: 'db', target: 'links', payload: { action: 'traverse' } },
  },
  {
    keywords: ['retry', 'backoff', 'resilience'],
    action: { type: 'ui', target: 'error-panel', payload: { mode: 'retry' } },
  },
];

/**
 * routeCommand({ intent, skills }) → { actions }
 *
 * Maps skill keywords to predefined system actions.
 * Max 5 actions, no duplicates, no undefined values.
 */
export function routeCommand(input) {
  const { intent = '', skills = [] } = input || {};

  const haystack = [
    String(intent),
    ...(Array.isArray(skills) ? skills.map(s => String(s)) : []),
  ].join(' ').toLowerCase();

  const actions = [];
  const seen = new Set();

  for (const rule of SKILL_ACTION_MAP) {
    if (actions.length >= MAX_ACTIONS) break;
    if (!rule.keywords.some(k => haystack.includes(k))) continue;

    const key = rule.action.target;
    if (seen.has(key)) continue;
    seen.add(key);

    actions.push({
      type:    String(rule.action.type),
      target:  String(rule.action.target),
      payload: { ...rule.action.payload },
    });
  }

  return { actions };
}

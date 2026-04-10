'use strict';

/**
 * PS-OS Command Router — MVP
 *
 * Architecture: pure registry of command handlers.
 * Each handler receives (args: string[]) and returns a CommandResult.
 * No side effects, no fetch calls — callers execute the result.
 *
 * CommandResult shapes:
 *   { type: 'patch', data: object, message: string }
 *   { type: 'note',  text: string, message: string }
 *
 * To add a new command: add an entry to REGISTRY.
 * Future: plugin ingestion can push into REGISTRY at runtime.
 */

const VALID_STATUSES = ['idea', 'defined', 'building', 'active', 'monetising', 'exit'];

const REGISTRY = {
  activate: {
    description: 'Set status to active',
    run: () => ({ type: 'patch', data: { status: 'active' }, message: 'Status → active' }),
  },

  exit: {
    description: 'Set status to exit',
    run: () => ({ type: 'patch', data: { status: 'exit' }, message: 'Status → exit' }),
  },

  status: {
    description: '/status <value> — set status to any valid value',
    run: ([value]) => {
      if (!value) {
        throw new Error(`Usage: /status <value>  Valid: ${VALID_STATUSES.join(' | ')}`);
      }
      if (!VALID_STATUSES.includes(value)) {
        throw new Error(`Unknown status "${value}". Valid: ${VALID_STATUSES.join(' | ')}`);
      }
      return { type: 'patch', data: { status: value }, message: `Status → ${value}` };
    },
  },

  link: {
    description: '/link <assetId> — record a link reference as a note',
    run: ([targetId]) => {
      const id = parseInt(targetId);
      if (!targetId || isNaN(id) || id < 1) {
        throw new Error('Usage: /link <assetId>  (must be a positive integer)');
      }
      return {
        type: 'note',
        text: `Linked to asset [ID:${id}]`,
        message: `Link noted → asset ${id}`,
      };
    },
  },
};

/**
 * Parse "/command arg1 arg2" → { name, args } or null if not a command.
 */
export function parseCommand(input) {
  const trimmed = (input || '').trim();
  if (!trimmed.startsWith('/')) return null;
  const parts = trimmed.slice(1).split(/\s+/).filter(Boolean);
  if (!parts.length) return null;
  return { name: parts[0].toLowerCase(), args: parts.slice(1) };
}

/**
 * Execute a command string. Returns CommandResult.
 * Throws on unknown command or invalid args.
 */
export function executeCommand(input) {
  const parsed = parseCommand(input);
  if (!parsed) throw new Error('Not a command');

  const handler = REGISTRY[parsed.name];
  if (!handler) {
    const available = Object.keys(REGISTRY).map(c => `/${c}`).join('  ');
    throw new Error(`Unknown command "/${parsed.name}"\nAvailable: ${available}`);
  }

  return handler.run(parsed.args);
}

/**
 * List all registered commands (for help/autocomplete).
 */
export function listCommands() {
  return Object.entries(REGISTRY).map(([name, h]) => ({ name, description: h.description }));
}

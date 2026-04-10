'use strict';

/**
 * PS-OS Skill Extractor — Pure Transform, No I/O
 *
 * Safety contract:
 *   - No eval(), no dynamic imports, no file writes
 *   - All input treated as plain strings
 *   - No undefined values in returned objects
 */

const CATEGORY_RULES = [
  { keywords: ['command', 'cli', 'cmd', 'shell'],                  category: 'command'  },
  { keywords: ['workflow', 'pipeline', 'automation', 'orchestrat'], category: 'workflow' },
  { keywords: ['search', 'query', 'index', 'retriev'],             category: 'search'   },
  { keywords: ['ui', 'dashboard', 'interface', 'component'],       category: 'ui'       },
];

const PATTERN_MAP = [
  { keywords: ['registry', 'handler map'],              phrase: 'Uses registry pattern'         },
  { keywords: ['router', 'route', 'dispatch'],          phrase: 'Router/dispatch pattern'       },
  { keywords: ['cli', 'command-line', 'argv'],          phrase: 'Exposes CLI interface'          },
  { keywords: ['pipeline', 'stage', 'chain'],           phrase: 'Pipeline-based processing'     },
  { keywords: ['plugin', 'extend', 'hook'],             phrase: 'Plugin/extension architecture' },
  { keywords: ['event', 'emit', 'listen'],              phrase: 'Event-driven design'           },
  { keywords: ['queue', 'worker', 'job'],               phrase: 'Queue/worker processing'       },
  { keywords: ['cache', 'memoize', 'ttl'],              phrase: 'Caching layer'                 },
  { keywords: ['schema', 'validate', 'zod', 'joi'],    phrase: 'Schema validation'             },
  { keywords: ['stream', 'transform'],                  phrase: 'Stream/transform processing'   },
  { keywords: ['middleware', 'intercept'],              phrase: 'Middleware chain'               },
  { keywords: ['graph', 'node', 'edge'],                phrase: 'Graph-based structure'         },
  { keywords: ['retry', 'backoff', 'resilience'],       phrase: 'Retry/resilience pattern'      },
  { keywords: ['template', 'render', 'partial'],        phrase: 'Template rendering'            },
  { keywords: ['diff', 'patch', 'delta'],               phrase: 'Diff/patch operations'         },
];

// Single vague words that are not structural patterns
const VAGUE_WORDS = new Set([
  'tool', 'library', 'project', 'utility', 'module',
  'package', 'helper', 'useful', 'simple', 'basic',
]);

/**
 * normalise(rawRepo) → NormalisedRepo
 * Guarantees: no undefined values, all strings trimmed.
 */
export function normalise(rawRepo) {
  return {
    name:         String(rawRepo.name        ?? '').trim(),
    description:  String(rawRepo.description ?? '').trim(),
    url:          String(rawRepo.url         ?? '').trim(),
    stars:        Number(rawRepo.stars)       || 0,
    owner:        String(rawRepo.owner        ?? '').trim(),
    repoName:     String(rawRepo.repoName     ?? rawRepo.name ?? '').trim(),
    readmeSummary: rawRepo.readmeSummary != null
      ? String(rawRepo.readmeSummary).trim()
      : null,
  };
}

/**
 * extractSkill(normalisedRepo) → Skill
 *
 * Skill: { name, category, purpose, patterns[], source, stars, extractedAt }
 */
export function extractSkill(repo) {
  const haystack = `${repo.name} ${repo.description} ${repo.readmeSummary || ''}`.toLowerCase();

  // Determine category
  let category = 'general';
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(k => haystack.includes(k))) {
      category = rule.category;
      break;
    }
  }

  // Extract structural patterns
  const seen = new Set();
  const patterns = [];
  for (const rule of PATTERN_MAP) {
    if (patterns.length >= 4) break;
    if (!rule.keywords.some(k => haystack.includes(k))) continue;
    const phrase = rule.phrase;
    const key = phrase.toLowerCase();
    // Quality filter: reject single-word vague labels
    if (VAGUE_WORDS.has(key)) continue;
    // Dedup
    if (seen.has(key)) continue;
    seen.add(key);
    patterns.push(phrase);
  }

  if (patterns.length === 0) {
    patterns.push('General utility pattern');
  }

  return {
    name:        repo.name,
    category,
    purpose:     repo.description || 'No description available',
    patterns,
    source:      repo.url,
    stars:       repo.stars,
    extractedAt: new Date().toISOString(),
  };
}

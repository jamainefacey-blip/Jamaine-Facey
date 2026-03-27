/**
 * pollinator.ts
 * Pain Engine — PC-POLLINATION-01
 *
 * After a successful release, extract reusable patterns and generate
 * upgrade suggestions across relevant lanes.
 *
 * Pattern types:
 *   UI            — visual/layout patterns worth replicating
 *   logic         — code/flow patterns reusable across assets
 *   monetisation  — CTAs, pricing flows, conversion patterns
 *   compliance    — legal/safety patterns for regulated lanes
 *   accessibility — a11y patterns (lang, alt, landmarks)
 *   workflow      — build/gate/release process improvements
 *
 * Safe mode only:
 *   - creates suggestion/upgrade records
 *   - queues tasks via addTask() (guardrail applies — no auto-execution)
 *   - NEVER overwrites existing files directly
 *   - stores all patterns in engine/data/skill-library.json
 */

import * as fs from 'fs';
import * as path from 'path';
import type { ReleaseResult } from './release';
import type { GateResult, DimensionResult } from './gate';
import { addTask } from './scheduler';

// ── Types ──────────────────────────────────────────────────────────────────

export type PatternType =
  | 'UI'
  | 'logic'
  | 'monetisation'
  | 'compliance'
  | 'accessibility'
  | 'workflow';

export type SuggestionStatus = 'open' | 'queued' | 'applied' | 'rejected';

export interface ExtractedPattern {
  patternId:     string;
  type:          PatternType;
  sourceLane:    string;
  sourceTaskId:  string;
  dimension:     string;         // gate dimension this came from
  dimensionScore: number;
  title:         string;
  description:   string;
  extractedAt:   string;
}

export interface UpgradeSuggestion {
  suggestionId:  string;
  patternId:     string;
  patternType:   PatternType;
  sourceLane:    string;
  targetLane:    string;
  title:         string;
  description:   string;
  queuedTaskId:  string | null;  // set when queued via addTask()
  status:        SuggestionStatus;
  createdAt:     string;
}

export interface PollinationResult {
  pollinationId:  string;
  sourceReleaseId: string;
  sourceLane:     string;
  sourceScore:    number;
  pollinatedAt:   string;
  patternsExtracted: ExtractedPattern[];
  suggestions:    UpgradeSuggestion[];
  tasksQueued:    number;
  skillLibraryUpdated: boolean;
}

export interface SkillLibrary {
  version:   number;
  updatedAt: string;
  patterns:  ExtractedPattern[];
}

// ── Constants ──────────────────────────────────────────────────────────────

const SKILL_LIBRARY_FILE = path.join('engine', 'data', 'skill-library.json');
const POLLINATION_DIR    = path.join('engine', 'data', 'pollinations');
const LATEST_FILE        = path.join('engine', 'data', 'pollination-latest.json');

// Lanes that can receive each pattern type
const LANE_TARGETS: Record<PatternType, string[]> = {
  UI:            ['VST', 'FHI', 'AI_LAB'],
  logic:         ['VST', 'FHI', 'AI_LAB', 'ADMIN'],
  monetisation:  ['VST', 'FHI'],
  compliance:    ['VST', 'FHI', 'AI_LAB', 'ADMIN'],
  accessibility: ['VST', 'FHI', 'AI_LAB'],
  workflow:      ['VST', 'FHI', 'AI_LAB', 'ADMIN', 'BACKYARD'],
};

// Minimum dimension score to extract a pattern (only extract from strong results)
const EXTRACTION_THRESHOLD = 80;

// ── Skill library I/O ──────────────────────────────────────────────────────

export function loadSkillLibrary(): SkillLibrary {
  if (!fs.existsSync(SKILL_LIBRARY_FILE)) {
    return { version: 1, updatedAt: new Date().toISOString(), patterns: [] };
  }
  return JSON.parse(fs.readFileSync(SKILL_LIBRARY_FILE, 'utf8')) as SkillLibrary;
}

function saveSkillLibrary(lib: SkillLibrary): void {
  fs.mkdirSync(path.dirname(SKILL_LIBRARY_FILE), { recursive: true });
  lib.updatedAt = new Date().toISOString();
  fs.writeFileSync(SKILL_LIBRARY_FILE, JSON.stringify(lib, null, 2), 'utf8');
}

function addPatternsToLibrary(patterns: ExtractedPattern[]): void {
  const lib = loadSkillLibrary();
  // Deduplicate by patternId
  const existing = new Set(lib.patterns.map(p => p.patternId));
  for (const p of patterns) {
    if (!existing.has(p.patternId)) lib.patterns.push(p);
  }
  saveSkillLibrary(lib);
}

// ── Pattern extraction ─────────────────────────────────────────────────────

function makePatternId(taskId: string, dimension: string): string {
  return `pat-${taskId.slice(0, 8)}-${dimension.toLowerCase().replace(/_/g, '-')}`;
}

const DIMENSION_TO_PATTERN: Record<string, PatternType> = {
  BUILD_HEALTH:       'workflow',
  PREVIEW_PROOF:      'workflow',
  UX_VISUAL:          'UI',
  MONETISATION:       'monetisation',
  COPY_QUALITY:       'logic',
  ACCESSIBILITY:      'accessibility',
  SEO:                'logic',
  COMPLIANCE_SAFETY:  'compliance',
  RERUN_RISK:         'workflow',
};

const PATTERN_TITLES: Record<string, (score: number) => string> = {
  BUILD_HEALTH:      (s) => `Clean build pipeline (score ${s}) — zero-failure task completion`,
  PREVIEW_PROOF:     (s) => `Preview proof pattern (score ${s}) — verified render before gate`,
  UX_VISUAL:         (s) => `High UX visual score (${s}) — layout and visual hierarchy pattern`,
  MONETISATION:      (s) => `Strong monetisation signals (${s}) — CTA and conversion pattern`,
  COPY_QUALITY:      (s) => `Copy quality pattern (${s}) — clean, placeholder-free copy`,
  ACCESSIBILITY:     (s) => `Accessibility pattern (${s}) — lang, landmarks, alt text`,
  SEO:               (s) => `SEO structure pattern (${s}) — title, meta, h1 hierarchy`,
  COMPLIANCE_SAFETY: (s) => `Compliance pattern (${s}) — legal/safety signals clean`,
  RERUN_RISK:        (s) => `Low rerun risk pattern (${s}) — idempotent, stable task flow`,
};

const PATTERN_DESCRIPTIONS: Record<string, string> = {
  BUILD_HEALTH:      'Task completed with zero failures and correct status signalling. Replicable across all lanes.',
  PREVIEW_PROOF:     'Asset rendered and proof captured before gate submission. Strong validation signal.',
  UX_VISUAL:         'Asset scored highly on visual structure: clean layout, no broken elements, consistent hierarchy.',
  MONETISATION:      'Monetisation dimension scored well: CTA present, pricing signals detected, conversion path clear.',
  COPY_QUALITY:      'Copy was clean: no placeholders, no lorem ipsum, no incomplete text. Reusable copy standards.',
  ACCESSIBILITY:     'Accessibility checks passed: lang attribute, img alt text, landmark regions present.',
  SEO:               'SEO structure clean: title tag, meta description, h1, viewport meta all present.',
  COMPLIANCE_SAFETY: 'Compliance signals clean: no credential leaks, no PII exposure, disclaimer pattern correct.',
  RERUN_RISK:        'Task execution was stable and idempotent — safe to re-run without side effects.',
};

export function extractPatterns(
  gateResult: GateResult,
  release: ReleaseResult,
): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];
  const now = new Date().toISOString();

  for (const [dimName, dimResult] of Object.entries(gateResult.dimensions) as [string, DimensionResult][]) {
    if (dimResult.score < EXTRACTION_THRESHOLD) continue;

    const type = DIMENSION_TO_PATTERN[dimName];
    if (!type) continue;

    patterns.push({
      patternId:      makePatternId(release.programId, dimName),
      type,
      sourceLane:     release.lane,
      sourceTaskId:   release.programId,
      dimension:      dimName,
      dimensionScore: dimResult.score,
      title:          PATTERN_TITLES[dimName]?.(dimResult.score) ?? `${dimName} pattern (${dimResult.score})`,
      description:    PATTERN_DESCRIPTIONS[dimName] ?? `High score in ${dimName}`,
      extractedAt:    now,
    });
  }

  return patterns;
}

// ── Suggestion generation ──────────────────────────────────────────────────

function makeSuggestionId(patternId: string, targetLane: string): string {
  return `sug-${patternId.slice(4, 12)}-${targetLane.toLowerCase()}`;
}

export function generateSuggestions(
  patterns: ExtractedPattern[],
  sourceLane: string,
): UpgradeSuggestion[] {
  const suggestions: UpgradeSuggestion[] = [];
  const now = new Date().toISOString();

  for (const pattern of patterns) {
    const targets = LANE_TARGETS[pattern.type].filter(t => t !== sourceLane);

    for (const targetLane of targets) {
      // Queue a data task (safe — read-only suggestion) for each suggestion
      const taskId = `poll-${pattern.patternId.slice(4, 12)}-${targetLane.toLowerCase()}`;
      addTask(
        'data',
        {
          task:        'pollination-suggestion',
          patternId:   pattern.patternId,
          patternType: pattern.type,
          sourceLane,
          targetLane,
          title:       pattern.title,
          description: pattern.description,
          safeMode:    true,
          noOverwrite: true,
        },
        taskId,
        targetLane as Parameters<typeof addTask>[3],
      );

      suggestions.push({
        suggestionId:  makeSuggestionId(pattern.patternId, targetLane),
        patternId:     pattern.patternId,
        patternType:   pattern.type,
        sourceLane,
        targetLane,
        title:         `Apply to ${targetLane}: ${pattern.title}`,
        description:   pattern.description,
        queuedTaskId:  taskId,
        status:        'queued',
        createdAt:     now,
      });
    }
  }

  return suggestions;
}

// ── Core pollination runner ────────────────────────────────────────────────

export function pollinate(
  release: ReleaseResult,
  gateResult: GateResult,
): PollinationResult {
  const pollinationId = `poll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const pollinatedAt  = new Date().toISOString();

  // Only pollinate from successful releases
  if (release.state !== 'COMPLETE' && release.state !== 'READY_FOR_REVIEW') {
    return {
      pollinationId,
      sourceReleaseId:     release.releaseId,
      sourceLane:          release.lane,
      sourceScore:         release.gateScore ?? 0,
      pollinatedAt,
      patternsExtracted:   [],
      suggestions:         [],
      tasksQueued:         0,
      skillLibraryUpdated: false,
    };
  }

  const patterns    = extractPatterns(gateResult, release);
  const suggestions = generateSuggestions(patterns, release.lane);

  // Persist patterns to skill library
  addPatternsToLibrary(patterns);

  return {
    pollinationId,
    sourceReleaseId:     release.releaseId,
    sourceLane:          release.lane,
    sourceScore:         release.gateScore ?? 0,
    pollinatedAt,
    patternsExtracted:   patterns,
    suggestions,
    tasksQueued:         suggestions.filter(s => s.queuedTaskId !== null).length,
    skillLibraryUpdated: patterns.length > 0,
  };
}

// ── Persistence ────────────────────────────────────────────────────────────

export function persistPollination(result: PollinationResult): string {
  fs.mkdirSync(POLLINATION_DIR, { recursive: true });
  const filePath = path.join(POLLINATION_DIR, `${result.pollinationId}.json`);
  fs.writeFileSync(filePath, JSON.stringify(result, null, 2), 'utf8');
  fs.writeFileSync(LATEST_FILE, JSON.stringify(result, null, 2), 'utf8');
  return filePath;
}

export function loadLatestPollination(): PollinationResult | null {
  if (!fs.existsSync(LATEST_FILE)) return null;
  return JSON.parse(fs.readFileSync(LATEST_FILE, 'utf8')) as PollinationResult;
}

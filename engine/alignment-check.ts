/**
 * alignment-check.ts — PC-ALIGN-01
 * Checks whether system state is aligned with Pain System canon.
 * Validates working memory, auto-control state, and role model against canon.
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────

export type AlignmentStatus = 'ALIGNED' | 'DRIFT' | 'CRITICAL';

export interface AlignmentCheck {
  checkId:     string;
  description: string;
  passed:      boolean;
  detail:      string;
}

export interface AlignmentResult {
  evaluatedAt:   string;
  overallStatus: AlignmentStatus;
  score:         number;   // 0–1
  checks:        AlignmentCheck[];
  drifts:        string[];
  criticals:     string[];
}

// ── File readers ───────────────────────────────────────────────────────────

function readJson(filePath: string): Record<string, unknown> {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

// ── Checks ─────────────────────────────────────────────────────────────────

function checkAutoControlSafe(): AlignmentCheck {
  const state = readJson(path.join('engine', 'data', 'auto-control.json'));
  const mode    = state.mode as string ?? '';
  const locked  = state.fullAutoLocked as boolean ?? false;
  const kill    = state.killSwitch as boolean ?? false;
  const passed  = mode !== 'FULL_AUTO' && locked === true;
  return {
    checkId:     'auto-control-safe',
    description: 'Auto-control must not be FULL_AUTO; fullAutoLocked must be true',
    passed,
    detail: passed
      ? `mode=${mode}, fullAutoLocked=${locked}, killSwitch=${kill}`
      : `VIOLATION — mode=${mode}, fullAutoLocked=${locked}`,
  };
}

function checkRoleModelIntegrity(): AlignmentCheck {
  const model = readJson(path.join('engine', 'data', 'role-model.json'));
  const roles  = Object.keys((model.roles ?? {}) as Record<string, unknown>);
  const perms  = ((model.permissions ?? []) as unknown[]).length;
  const required = ['founder', 'system', 'external_input', 'client_workspace'];
  const missing  = required.filter(r => !roles.includes(r));
  const passed   = missing.length === 0 && perms >= 10;
  return {
    checkId:     'role-model-integrity',
    description: 'All 4 roles present; ≥10 permissions defined',
    passed,
    detail: passed
      ? `Roles: ${roles.join(', ')} — ${perms} permissions`
      : `Missing roles: ${missing.join(', ')} — ${perms} permissions`,
  };
}

function checkCanonVaultPresent(): AlignmentCheck {
  const canon = readJson(path.join('engine', 'data', 'canon-vault.json'));
  const laws  = ((canon.painSystemLaws ?? []) as unknown[]).length;
  const passed = laws >= 5;
  return {
    checkId:     'canon-vault-present',
    description: 'Canon vault must have ≥5 system laws',
    passed,
    detail: passed ? `${laws} pain system laws loaded` : `Only ${laws} laws found — canon may be incomplete`,
  };
}

function checkDefenceActive(): AlignmentCheck {
  const result = readJson(path.join('engine', 'data', 'defence-result.json'));
  const passed_count = (result.testsPassed as number ?? 0);
  const run_count    = (result.testsRun    as number ?? 0);
  const passed = passed_count >= 5 && run_count >= 5;
  return {
    checkId:     'defence-active',
    description: 'Defence layer must have ≥5 tests passing',
    passed,
    detail: passed
      ? `Defence: ${passed_count}/${run_count} tests passed`
      : `Defence tests insufficient: ${passed_count}/${run_count}`,
  };
}

function checkClientVaultPrivacy(): AlignmentCheck {
  const vault = readJson(path.join('engine', 'data', 'client-vault-index.json'));
  const rules  = ((vault.privacyRules ?? []) as unknown[]).length;
  const passed = rules >= 4;
  return {
    checkId:     'client-vault-privacy',
    description: 'Client vault must define ≥4 privacy rules',
    passed,
    detail: passed ? `${rules} privacy rules enforced` : `Only ${rules} privacy rules — vault underspecified`,
  };
}

function checkWorkingMemoryConsistency(): AlignmentCheck {
  const mem   = readJson(path.join('engine', 'data', 'working-memory.json'));
  const mode  = (mem.currentMode ?? {}) as Record<string, unknown>;
  const fullAutoLocked = mode.fullAutoLocked as boolean ?? false;
  const killSwitch     = mode.killSwitch     as boolean ?? false;
  const passed = fullAutoLocked === true && killSwitch === false;
  return {
    checkId:     'working-memory-consistency',
    description: 'Working memory: fullAutoLocked=true, killSwitch=false (default safe state)',
    passed,
    detail: passed
      ? `fullAutoLocked=${fullAutoLocked}, killSwitch=${killSwitch}`
      : `DRIFT — fullAutoLocked=${fullAutoLocked}, killSwitch=${killSwitch}`,
  };
}

function checkSkillLibraryPopulated(): AlignmentCheck {
  const lib    = readJson(path.join('engine', 'data', 'skill-library.json'));
  const count  = ((lib.patterns ?? []) as unknown[]).length;
  const passed = count >= 5;
  return {
    checkId:     'skill-library-populated',
    description: 'Skill library must have ≥5 patterns',
    passed,
    detail: passed ? `${count} patterns in skill library` : `Only ${count} patterns — library sparse`,
  };
}

// ── Core evaluator ─────────────────────────────────────────────────────────

export function runAlignmentCheck(): AlignmentResult {
  const checks: AlignmentCheck[] = [
    checkAutoControlSafe(),
    checkRoleModelIntegrity(),
    checkCanonVaultPresent(),
    checkDefenceActive(),
    checkClientVaultPrivacy(),
    checkWorkingMemoryConsistency(),
    checkSkillLibraryPopulated(),
  ];

  const passed    = checks.filter(c => c.passed).length;
  const score     = Math.round((passed / checks.length) * 100) / 100;
  const drifts    = checks.filter(c => !c.passed && !c.checkId.includes('control')).map(c => c.detail);
  const criticals = checks.filter(c => !c.passed && c.checkId.includes('control')).map(c => c.detail);

  let overallStatus: AlignmentStatus;
  if (criticals.length > 0)  overallStatus = 'CRITICAL';
  else if (score < 0.80)     overallStatus = 'DRIFT';
  else                       overallStatus = 'ALIGNED';

  return {
    evaluatedAt:   new Date().toISOString(),
    overallStatus,
    score,
    checks,
    drifts,
    criticals,
  };
}

// ── Persist ────────────────────────────────────────────────────────────────

const ALIGN_RESULT_FILE = path.join('engine', 'data', 'alignment-result.json');

export function persistAlignmentResult(result: AlignmentResult): void {
  fs.writeFileSync(ALIGN_RESULT_FILE, JSON.stringify(result, null, 2), 'utf8');
}

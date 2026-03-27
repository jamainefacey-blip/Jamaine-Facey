/**
 * builder.ts
 * Controlled multi-file build/edit execution.
 * Operates only on scoped file lists. Patch-based. Skeleton-first preference.
 * No uncontrolled broad repo rewrites.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExecutionPlan, ExecutionStep } from './execution-planner';
import { RepoContext, isFileSafeToEdit } from './repo-context';

// ── Types ──────────────────────────────────────────────────────────────────

export type BuildStatus = 'SUCCESS' | 'FAIL' | 'PARTIAL' | 'SKIPPED';

export interface Patch {
  file:       string;
  type:       'create' | 'edit' | 'append';
  content:    string;
  oldContent?: string;  // for rollback
}

export interface StepBuildResult {
  stepId:  string;
  status:  BuildStatus;
  patches: Patch[];
  errors:  string[];
}

export interface BuildResult {
  buildId:         string;
  planId:          string;
  status:          BuildStatus;
  stepResults:     StepBuildResult[];
  filesChanged:    string[];
  patchesApplied:  number;
  errors:          string[];
  startedAt:       string;
  completedAt:     string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const BUILDER_FILE = path.join('engine', 'data', 'builder-result.json');

const PROTECTED_ZONES = [
  'engine/data/canon-vault.json',
  'engine/guardrail.ts',
  'engine/gate.ts',
  'engine/pre-gate-audit.ts',
  'engine/defence.ts',
  'engine/roles.ts',
  'engine/data/role-model.json',
  'engine/data/security-log.json',
];

// ── Guards ─────────────────────────────────────────────────────────────────

function assertSafeToWrite(file: string, ctx: RepoContext): void {
  if (PROTECTED_ZONES.some(z => file.endsWith(z) || file === z)) {
    throw new Error(`F3: protected file write blocked: ${file}`);
  }
  if (!isFileSafeToEdit(file, ctx) && fs.existsSync(file)) {
    // Existing file not in context graph — warn but allow for new-scope files
    const rel = path.relative(process.cwd(), path.resolve(file));
    if (PROTECTED_ZONES.some(z => rel.includes(z))) {
      throw new Error(`F3: protected zone write blocked: ${file}`);
    }
  }
}

// ── Patch applicator ───────────────────────────────────────────────────────

function applyPatch(patch: Patch): string[] {
  const errors: string[] = [];
  try {
    const dir = path.dirname(patch.file);
    if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });

    switch (patch.type) {
      case 'create':
        fs.writeFileSync(patch.file, patch.content, 'utf8');
        break;
      case 'edit': {
        // Surgical patch: if oldContent defined, replace exactly; else overwrite
        if (patch.oldContent !== undefined) {
          const existing = fs.readFileSync(patch.file, 'utf8');
          if (!existing.includes(patch.oldContent)) {
            errors.push(`Patch target not found in ${patch.file}`);
            break;
          }
          fs.writeFileSync(patch.file, existing.replace(patch.oldContent, patch.content), 'utf8');
        } else {
          fs.writeFileSync(patch.file, patch.content, 'utf8');
        }
        break;
      }
      case 'append': {
        const existing = fs.existsSync(patch.file) ? fs.readFileSync(patch.file, 'utf8') : '';
        fs.writeFileSync(patch.file, existing + '\n' + patch.content, 'utf8');
        break;
      }
    }
  } catch (err: unknown) {
    errors.push(String(err));
  }
  return errors;
}

// ── Step executor ──────────────────────────────────────────────────────────

function executeStep(step: ExecutionStep, ctx: RepoContext, patches: Patch[]): StepBuildResult {
  const errors: string[] = [];
  const appliedPatches: Patch[] = [];

  if (step.protected) {
    return { stepId: step.stepId, status: 'SKIPPED', patches: [], errors: ['Step requires founder approval — skipped'] };
  }

  // Filter patches to only those targeting this step's file scope
  const scopedPatches = patches.filter(p =>
    step.files.length === 0 || step.files.some(f => p.file.includes(f) || p.file === f)
  );

  for (const patch of scopedPatches) {
    try {
      assertSafeToWrite(patch.file, ctx);
      const patchErrors = applyPatch(patch);
      if (patchErrors.length > 0) {
        errors.push(...patchErrors);
      } else {
        appliedPatches.push(patch);
      }
    } catch (err: unknown) {
      errors.push(String(err));
    }
  }

  const status: BuildStatus = errors.length === 0
    ? (appliedPatches.length > 0 ? 'SUCCESS' : 'SKIPPED')
    : (appliedPatches.length > 0 ? 'PARTIAL' : 'FAIL');

  return { stepId: step.stepId, status, patches: appliedPatches, errors };
}

// ── Core ───────────────────────────────────────────────────────────────────

export function runBuild(plan: ExecutionPlan, ctx: RepoContext, patches: Patch[]): BuildResult {
  const startedAt = new Date().toISOString();

  // F3 guard: reject any patch targeting a protected zone before executing anything
  for (const patch of patches) {
    if (PROTECTED_ZONES.some(z => patch.file === z || patch.file.endsWith(z))) {
      throw new Error(`F3: protected file write blocked: ${patch.file}`);
    }
  }

  const stepResults: StepBuildResult[] = [];
  const allErrors: string[] = [];

  for (const step of plan.steps) {
    if (step.type === 'test' || step.type === 'preview' || step.type === 'gate-check') continue;
    const result = executeStep(step, ctx, patches);
    stepResults.push(result);
    allErrors.push(...result.errors);
  }

  const filesChanged  = [...new Set(stepResults.flatMap(r => r.patches.map(p => p.file)))];
  const patchCount    = stepResults.reduce((acc, r) => acc + r.patches.length, 0);
  const hasFailure    = stepResults.some(r => r.status === 'FAIL');
  const hasSuccess    = stepResults.some(r => r.status === 'SUCCESS' || r.status === 'PARTIAL');

  const status: BuildStatus = hasFailure && !hasSuccess ? 'FAIL'
    : hasFailure ? 'PARTIAL'
    : hasSuccess ? 'SUCCESS'
    : 'SKIPPED';

  return {
    buildId:        `build-${Date.now()}`,
    planId:         plan.planId,
    status,
    stepResults,
    filesChanged,
    patchesApplied: patchCount,
    errors:         allErrors,
    startedAt,
    completedAt:    new Date().toISOString(),
  };
}

export function persistBuildResult(result: BuildResult): string {
  fs.writeFileSync(BUILDER_FILE, JSON.stringify(result, null, 2), 'utf8');
  return BUILDER_FILE;
}

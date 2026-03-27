/**
 * execution-planner.ts
 * Convert approved program steps into structured executable run plans.
 * Model-agnostic. Provider logic isolated to config adapters.
 */

import * as fs from 'fs';
import * as path from 'path';
import { GeneratedProgram, ProgramStep } from './program-builder';

// ── Types ──────────────────────────────────────────────────────────────────

export type StepType = 'file-edit' | 'file-create' | 'command' | 'test' | 'preview' | 'gate-check';

export interface ExecutionStep {
  stepId:        string;
  type:          StepType;
  description:   string;
  files:         string[];        // scoped file list — no broad rewrites
  commands:      string[];
  testSurface:   string[];        // test files/patterns relevant to this step
  rollbackPoint: boolean;         // snapshot before this step
  protected:     boolean;         // if true, require founder approval
  dependsOn:     string[];        // stepIds this step requires
}

export interface PreviewTarget {
  type:   'local' | 'url' | 'file';
  ref:    string;
  mobile: boolean;
  desktop: boolean;
}

export interface ExecutionPlan {
  planId:         string;
  taskId:         string;
  programId:      string;
  lane:           string;
  steps:          ExecutionStep[];
  protectedFiles: string[];
  previewTarget:  PreviewTarget;
  estimatedRisk:  'low' | 'medium' | 'high';
  createdAt:      string;
  upgradeHooks:   Record<string, string>;  // future provider/model swap points
}

// ── Constants ──────────────────────────────────────────────────────────────

const PLAN_FILE   = path.join('engine', 'data', 'execution-plan.json');
const PLAN_DIR    = path.join('engine', 'data', 'plans');

const PROTECTED_ZONES = [
  'engine/data/canon-vault.json',
  'engine/guardrail.ts',
  'engine/gate.ts',
  'engine/pre-gate-audit.ts',
  'engine/defence.ts',
  'engine/roles.ts',
];

// ── Step builder ───────────────────────────────────────────────────────────

function buildStepsFromProgram(program: GeneratedProgram): ExecutionStep[] {
  return program.steps.map((ps: ProgramStep, idx: number) => {
    const type = inferStepType(ps.action);
    const files = (ps.input ? [ps.input] : []).filter(Boolean);
    const isProtected = files.some(f => PROTECTED_ZONES.some(z => f.includes(z)));
    return {
      stepId:        `step-${String(idx + 1).padStart(3, '0')}`,
      type,
      description:   ps.action,
      files,
      commands:      inferCommands(type, ps),
      testSurface:   inferTestSurface(files),
      rollbackPoint: idx === 0 || type === 'file-edit' || type === 'file-create',
      protected:     isProtected,
      dependsOn:     idx === 0 ? [] : [`step-${String(idx).padStart(3, '0')}`],
    };
  });
}

function inferStepType(action: string): StepType {
  if (/test|lint|check/i.test(action))   return 'test';
  if (/preview|render|visual/i.test(action)) return 'preview';
  if (/gate|review|approve/i.test(action))   return 'gate-check';
  if (/create|scaffold|init/i.test(action))  return 'file-create';
  if (/edit|modify|patch|fix|update/i.test(action)) return 'file-edit';
  return 'command';
}

function inferCommands(type: StepType, ps: ProgramStep): string[] {
  switch (type) {
    case 'test':     return ['npx tsc --noEmit', 'npx tsx --version'];
    case 'preview':  return ['echo "preview:local"'];
    case 'gate-check': return ['echo "gate:check"'];
    default:         return ps.output ? [`echo "output:${ps.output}"`] : [];
  }
}

function inferTestSurface(files: string[]): string[] {
  return files
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .map(f => f.replace(/\.ts$/, '.test.ts').replace(/\.js$/, '.test.js'));
}

function inferRisk(program: GeneratedProgram): 'low' | 'medium' | 'high' {
  const r = program.risk?.level ?? 'low';
  if (r === 'critical' || r === 'high') return 'high';
  if (r === 'medium') return 'medium';
  return 'low';
}

// ── Preview target ─────────────────────────────────────────────────────────

function buildPreviewTarget(program: GeneratedProgram): PreviewTarget {
  const lane = program.lane ?? 'AI_LAB';
  // Upgrade hook: swap preview adapter per lane via config
  const portMap: Record<string, number> = { VST: 3000, FHI: 3001, AI_LAB: 3002, ADMIN: 3003 };
  const port = portMap[lane] ?? 3000;
  return {
    type:    'local',
    ref:     `http://localhost:${port}`,
    mobile:  true,
    desktop: true,
  };
}

// ── Core ───────────────────────────────────────────────────────────────────

export function buildExecutionPlan(program: GeneratedProgram): ExecutionPlan {
  const plan: ExecutionPlan = {
    planId:        `plan-${Date.now()}`,
    taskId:        program.taskId ?? 'unknown',
    programId:     program.programId ?? 'unknown',
    lane:          program.lane ?? 'AI_LAB',
    steps:         buildStepsFromProgram(program),
    protectedFiles: PROTECTED_ZONES,
    previewTarget:  buildPreviewTarget(program),
    estimatedRisk:  inferRisk(program),
    createdAt:     new Date().toISOString(),
    upgradeHooks: {
      // Swap model/provider without core rewrites — add adapter keys here
      modelAdapter:    'config/adapters/model-default.json',
      previewAdapter:  'config/adapters/preview-default.json',
      testAdapter:     'config/adapters/test-default.json',
    },
  };
  return plan;
}

export function persistExecutionPlan(plan: ExecutionPlan): string {
  fs.mkdirSync(PLAN_DIR, { recursive: true });
  const file = path.join(PLAN_DIR, `${plan.planId}.json`);
  fs.writeFileSync(file, JSON.stringify(plan, null, 2), 'utf8');
  fs.writeFileSync(PLAN_FILE, JSON.stringify(plan, null, 2), 'utf8');
  return file;
}

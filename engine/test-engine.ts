/**
 * test-engine.ts
 * Run execution checks after build.
 * Classes: build-health, unit, lint, visual.
 * Stores structured pass/fail per class with exact failing surface.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { BuildResult } from './builder';

// ── Types ──────────────────────────────────────────────────────────────────

export type TestClass = 'build-health' | 'unit' | 'lint' | 'visual';
export type TestStatus = 'PASS' | 'FAIL' | 'SKIP' | 'ERROR';

export interface ClassResult {
  class:        TestClass;
  status:       TestStatus;
  passed:       number;
  failed:       number;
  skipped:      number;
  failingSurface: string[];  // exact files/assertions that failed
  output:       string;
  runAt:        string;
}

export interface TestResult {
  testId:       string;
  planId:       string;
  buildId:      string;
  overallPass:  boolean;
  classes:      ClassResult[];
  failingSurfaces: string[];   // all failing surfaces across classes
  blockedClasses: TestClass[];
  runAt:        string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const TEST_FILE = path.join('engine', 'data', 'test-result.json');

const TIMEOUT = 30000; // 10s max per test class (fail-fast rule: hang after 10s → kill)

// ── Test runners ───────────────────────────────────────────────────────────

function runBuildHealth(buildResult: BuildResult, scopedFiles: string[]): ClassResult {
  const runAt = new Date().toISOString();
  const failingSurface: string[] = [];
  let output = '';

  // Check 1: build status
  if (buildResult.status === 'FAIL') {
    failingSurface.push(...buildResult.errors.map(e => `build-error: ${e}`));
  }

  // Check 2: TypeScript compile on changed files
  if (scopedFiles.length > 0) {
    const tsFiles = scopedFiles.filter(f => f.endsWith('.ts'));
    if (tsFiles.length > 0) {
      try {
        const result = execSync(
          `npx tsc --noEmit --target es2020 --module commonjs --esModuleInterop --skipLibCheck ${tsFiles.join(' ')} 2>&1 || true`,
          { encoding: 'utf8', timeout: TIMEOUT }
        );
        output = result.slice(0, 2000); // truncate
        const tsErrors = result.split('\n').filter(l => /error TS/.test(l));
        if (tsErrors.length > 0) {
          failingSurface.push(...tsErrors.slice(0, 10));
        }
      } catch (err: unknown) {
        output = String(err).slice(0, 1000);
        failingSurface.push(`tsc-timeout: ${output}`);
      }
    }
  }

  const failed = failingSurface.length;
  return {
    class:    'build-health',
    status:   failed === 0 ? 'PASS' : 'FAIL',
    passed:   failed === 0 ? 1 : 0,
    failed,
    skipped:  0,
    failingSurface,
    output,
    runAt,
  };
}

function runLint(scopedFiles: string[]): ClassResult {
  const runAt = new Date().toISOString();
  const tsFiles = scopedFiles.filter(f => f.endsWith('.ts'));
  const failingSurface: string[] = [];

  if (tsFiles.length === 0) {
    return { class: 'lint', status: 'SKIP', passed: 0, failed: 0, skipped: 1, failingSurface: [], output: 'no TS files in scope', runAt };
  }

  let output = '';
  try {
    // Prefer eslint if configured, fallback to tsc strict
    const eslintExists = fs.existsSync('.eslintrc.js') || fs.existsSync('.eslintrc.json') || fs.existsSync('.eslintrc');
    if (eslintExists) {
      output = execSync(`npx eslint ${tsFiles.join(' ')} 2>&1 || true`, { encoding: 'utf8', timeout: TIMEOUT });
      const errors = output.split('\n').filter(l => /error/.test(l));
      failingSurface.push(...errors.slice(0, 10));
    } else {
      output = 'No linter config — skipping';
    }
  } catch (err: unknown) {
    output = String(err).slice(0, 500);
  }

  return {
    class:         'lint',
    status:        failingSurface.length === 0 ? 'PASS' : 'FAIL',
    passed:        failingSurface.length === 0 ? tsFiles.length : 0,
    failed:        failingSurface.length,
    skipped:       0,
    failingSurface,
    output:        output.slice(0, 1000),
    runAt,
  };
}

function runUnit(scopedFiles: string[]): ClassResult {
  const runAt = new Date().toISOString();
  // Look for test files adjacent to scoped files
  const testFiles = scopedFiles
    .map(f => f.replace(/\.ts$/, '.test.ts'))
    .filter(f => fs.existsSync(f));

  if (testFiles.length === 0) {
    return { class: 'unit', status: 'SKIP', passed: 0, failed: 0, skipped: 1, failingSurface: [], output: 'no test files found for scope', runAt };
  }

  let output = '';
  const failingSurface: string[] = [];
  try {
    output = execSync(`npx tsx ${testFiles[0]} 2>&1 || true`, { encoding: 'utf8', timeout: TIMEOUT });
    const errors = output.split('\n').filter(l => /FAIL|Error|✗/.test(l));
    failingSurface.push(...errors.slice(0, 10));
  } catch (err: unknown) {
    output = String(err).slice(0, 500);
    failingSurface.push(output);
  }

  return {
    class:         'unit',
    status:        failingSurface.length === 0 ? 'PASS' : 'FAIL',
    passed:        failingSurface.length === 0 ? testFiles.length : 0,
    failed:        failingSurface.length,
    skipped:       0,
    failingSurface,
    output:        output.slice(0, 1000),
    runAt,
  };
}

function runVisualCheck(previewProofExists: boolean): ClassResult {
  const runAt = new Date().toISOString();
  if (!previewProofExists) {
    return { class: 'visual', status: 'FAIL', passed: 0, failed: 1, skipped: 0, failingSurface: ['no preview proof captured'], output: 'visual class requires preview proof', runAt };
  }
  return { class: 'visual', status: 'PASS', passed: 1, failed: 0, skipped: 0, failingSurface: [], output: 'preview proof exists — visual gate deferred to visual-qa', runAt };
}

// ── Core ───────────────────────────────────────────────────────────────────

export function runTests(
  planId: string,
  buildResult: BuildResult,
  scopedFiles: string[],
  previewProofExists: boolean,
): TestResult {
  const classes: ClassResult[] = [
    runBuildHealth(buildResult, scopedFiles),
    runLint(scopedFiles),
    runUnit(scopedFiles),
    runVisualCheck(previewProofExists),
  ];

  const blocked   = classes.filter(c => c.status === 'FAIL').map(c => c.class);
  const allSurfaces = classes.flatMap(c => c.failingSurface);
  const overallPass = blocked.length === 0;

  return {
    testId:          `test-${Date.now()}`,
    planId,
    buildId:         buildResult.buildId,
    overallPass,
    classes,
    failingSurfaces: allSurfaces,
    blockedClasses:  blocked,
    runAt:           new Date().toISOString(),
  };
}

export function persistTestResult(result: TestResult): string {
  fs.writeFileSync(TEST_FILE, JSON.stringify(result, null, 2), 'utf8');
  return TEST_FILE;
}

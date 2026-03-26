// engine/validator/index.ts — runs npm validation scripts

import { execSync } from 'child_process';
import { ROOT } from '../config';
import { log } from '../logger';

export interface ValidationResult {
  passed: boolean;
  output: string;
}

export function validate(script: string): ValidationResult {
  log('INFO', `Validator: running npm run ${script}`);
  try {
    const output = execSync(`npm run ${script} --if-present 2>&1`, {
      cwd: ROOT,
      timeout: 120_000,
      encoding: 'utf8',
    });
    log('INFO', `Validator: PASS (${script})`);
    return { passed: true, output };
  } catch (err: unknown) {
    const output =
      err instanceof Error && 'stdout' in err
        ? String((err as NodeJS.ErrnoException & { stdout?: string }).stdout ?? err.message)
        : String(err);
    log('WARN', `Validator: FAIL (${script})`, { output: output.slice(0, 200) });
    return { passed: false, output };
  }
}

export function typeCheck(): ValidationResult {
  log('INFO', 'Validator: running tsc --noEmit');
  try {
    const output = execSync('npx tsc --noEmit 2>&1', {
      cwd: ROOT,
      timeout: 60_000,
      encoding: 'utf8',
    });
    return { passed: true, output };
  } catch (err: unknown) {
    const output = err instanceof Error ? err.message : String(err);
    log('WARN', 'Validator: tsc FAIL', { output: output.slice(0, 200) });
    return { passed: false, output };
  }
}

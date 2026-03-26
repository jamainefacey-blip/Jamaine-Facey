// engine/deployer/index.ts — git commit + push (Vercel auto-deploys on push)

import { execSync } from 'child_process';
import { ENGINE_CONFIG, ROOT } from '../config';
import { log } from '../logger';

export interface DeployResult {
  deployed: boolean;
  output: string;
  commitHash?: string;
}

function exec(cmd: string): string {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', timeout: 60_000 });
}

export function commitAndPush(filesChanged: string[], message: string): DeployResult {
  if (filesChanged.length === 0) {
    log('INFO', 'Deployer: no files changed — skipping commit');
    return { deployed: false, output: 'No files to commit.' };
  }

  const outputLines: string[] = [];

  try {
    // Ensure we're on the right branch
    const currentBranch = exec('git rev-parse --abbrev-ref HEAD').trim();
    if (currentBranch !== ENGINE_CONFIG.gitBranch) {
      log('WARN', `Deployer: on branch ${currentBranch}, switching to ${ENGINE_CONFIG.gitBranch}`);
      exec(`git checkout -B ${ENGINE_CONFIG.gitBranch}`);
      outputLines.push(`Switched to ${ENGINE_CONFIG.gitBranch}`);
    }

    // Stage only the changed files
    for (const f of filesChanged) {
      exec(`git add "${f}"`);
    }

    // Check if there's anything staged
    const staged = exec('git diff --cached --name-only').trim();
    if (!staged) {
      log('INFO', 'Deployer: nothing staged — skipping commit');
      return { deployed: false, output: 'Nothing staged.' };
    }

    // Commit
    const safeMsg = message.replace(/"/g, '\\"').replace(/`/g, "'");
    exec(`git commit -m "${safeMsg}"`);
    const commitHash = exec('git rev-parse HEAD').trim();
    outputLines.push(`Committed: ${commitHash}`);

    // Push with retry (exponential backoff: 2s, 4s, 8s, 16s)
    let pushed = false;
    let lastPushError = '';
    const delays = [2000, 4000, 8000, 16000];
    for (let i = 0; i <= delays.length; i++) {
      try {
        exec(`git push -u origin ${ENGINE_CONFIG.gitBranch}`);
        pushed = true;
        outputLines.push(`Pushed to ${ENGINE_CONFIG.gitBranch}`);
        break;
      } catch (err: unknown) {
        lastPushError = err instanceof Error ? err.message : String(err);
        if (i < delays.length) {
          log('WARN', `Deployer: push attempt ${i + 1} failed, retrying in ${delays[i]}ms`);
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, delays[i]);
        }
      }
    }

    if (!pushed) {
      log('ERROR', 'Deployer: push failed after retries', { lastPushError });
      return { deployed: false, output: `Push failed: ${lastPushError}`, commitHash };
    }

    log('INFO', `Deployer: deployed ${commitHash} to ${ENGINE_CONFIG.gitBranch}`);
    return { deployed: true, output: outputLines.join('\n'), commitHash };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log('ERROR', 'Deployer: error', { msg });
    return { deployed: false, output: `Deploy error: ${msg}` };
  }
}

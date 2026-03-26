// engine/logger/index.ts — file-based run logger

import fs from 'fs';
import path from 'path';
import { ENGINE_CONFIG } from '../config';
import type { RunLog } from '../types';

function ensureLogsDir(): void {
  fs.mkdirSync(ENGINE_CONFIG.logsDir, { recursive: true });
}

export function writeRunLog(log: RunLog): void {
  ensureLogsDir();
  const file = path.join(ENGINE_CONFIG.logsDir, `${log.runId}.json`);
  fs.writeFileSync(file, JSON.stringify(log, null, 2) + '\n', 'utf8');
}

export function readRunLog(runId: string): RunLog | null {
  const file = path.join(ENGINE_CONFIG.logsDir, `${runId}.json`);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as RunLog;
  } catch {
    return null;
  }
}

export function listRunLogs(): RunLog[] {
  ensureLogsDir();
  const files = fs.readdirSync(ENGINE_CONFIG.logsDir).filter(f => f.endsWith('.json'));
  const logs: RunLog[] = [];
  for (const f of files) {
    try {
      logs.push(JSON.parse(fs.readFileSync(path.join(ENGINE_CONFIG.logsDir, f), 'utf8')) as RunLog);
    } catch {
      // skip corrupt
    }
  }
  return logs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export function log(level: 'INFO' | 'WARN' | 'ERROR', msg: string, ctx?: Record<string, unknown>): void {
  const ts = new Date().toISOString();
  const extra = ctx ? ' ' + JSON.stringify(ctx) : '';
  console.log(`[${ts}] [${level}] ${msg}${extra}`);
}

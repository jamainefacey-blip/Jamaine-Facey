// engine/queue/index.ts — file-based JSON queue

import fs from 'fs';
import path from 'path';
import { ENGINE_CONFIG } from '../config';
import type { Task, QueueEntry, TaskStatus } from '../types';

function ensureDataDir(): void {
  fs.mkdirSync(path.dirname(ENGINE_CONFIG.queueFile), { recursive: true });
}

function readQueue(): QueueEntry[] {
  try {
    const raw = fs.existsSync(ENGINE_CONFIG.queueFile)
      ? fs.readFileSync(ENGINE_CONFIG.queueFile, 'utf8').trim()
      : '';
    return raw ? (JSON.parse(raw) as QueueEntry[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(entries: QueueEntry[]): void {
  ensureDataDir();
  fs.writeFileSync(ENGINE_CONFIG.queueFile, JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

export function enqueue(task: Task): QueueEntry {
  const entries = readQueue();
  const entry: QueueEntry = {
    task,
    status: 'pending',
    attempts: 0,
    enqueuedAt: new Date().toISOString(),
  };
  entries.push(entry);
  writeQueue(entries);
  return entry;
}

export function nextPending(): QueueEntry | null {
  const entries = readQueue();
  return entries.find(e => e.status === 'pending') ?? null;
}

export function updateEntry(taskId: string, patch: Partial<QueueEntry>): void {
  const entries = readQueue();
  const idx = entries.findIndex(e => e.task.id === taskId);
  if (idx === -1) throw new Error(`Task not found in queue: ${taskId}`);
  entries[idx] = { ...entries[idx], ...patch };
  writeQueue(entries);
}

export function setStatus(taskId: string, status: TaskStatus, error?: string): void {
  const patch: Partial<QueueEntry> = { status };
  if (status === 'in_progress') patch.startedAt = new Date().toISOString();
  if (status === 'complete' || status === 'failed' || status === 'blocked') {
    patch.completedAt = new Date().toISOString();
  }
  if (error !== undefined) patch.lastError = error;
  updateEntry(taskId, patch);
}

export function incrementAttempts(taskId: string): number {
  const entries = readQueue();
  const idx = entries.findIndex(e => e.task.id === taskId);
  if (idx === -1) throw new Error(`Task not found: ${taskId}`);
  entries[idx].attempts += 1;
  writeQueue(entries);
  return entries[idx].attempts;
}

export function listQueue(): QueueEntry[] {
  return readQueue();
}

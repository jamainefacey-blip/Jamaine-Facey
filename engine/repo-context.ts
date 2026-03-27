/**
 * repo-context.ts
 * Build repo-aware execution context: file graph, dependency graph,
 * changed files, protected zones, ignore rules.
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// ── Types ──────────────────────────────────────────────────────────────────

export interface FileNode {
  file:         string;
  imports:      string[];   // files this file imports
  importedBy:   string[];   // files that import this file
  isProtected:  boolean;
  isIgnored:    boolean;
  lastModified: string;
}

export interface RepoContext {
  contextId:      string;
  rootDir:        string;
  fileGraph:      Record<string, FileNode>;
  changedFiles:   string[];     // git-tracked changes
  protectedFiles: string[];
  ignoredPatterns: string[];
  indexedAt:      string;
  stats: {
    totalFiles:     number;
    protectedCount: number;
    changedCount:   number;
  };
}

// ── Constants ──────────────────────────────────────────────────────────────

const CONTEXT_FILE = path.join('engine', 'data', 'repo-context.json');

const PROTECTED_FILES = [
  'engine/data/canon-vault.json',
  'engine/guardrail.ts',
  'engine/gate.ts',
  'engine/pre-gate-audit.ts',
  'engine/defence.ts',
  'engine/roles.ts',
  'engine/data/role-model.json',
  'engine/data/security-log.json',
];

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  '*.log',
  'engine/data/logs/',
];

// ── File scanner ───────────────────────────────────────────────────────────

function isIgnored(file: string): boolean {
  return IGNORE_PATTERNS.some(p => {
    if (p.endsWith('/')) return file.includes(p);
    if (p.startsWith('*.')) return file.endsWith(p.slice(1));
    return file.includes(p);
  });
}

function isProtected(file: string): boolean {
  return PROTECTED_FILES.some(p => file.endsWith(p) || file === p);
}

function extractImports(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.matchAll(/(?:import|require)\s*(?:\{[^}]*\}|\w+)\s*from\s*['"]([^'"]+)['"]/g);
    const imports: string[] = [];
    for (const m of matches) {
      const imp = m[1];
      if (imp.startsWith('.')) {
        // Relative import — resolve to actual path
        const resolved = path.resolve(path.dirname(filePath), imp);
        const withExt = [resolved, resolved + '.ts', resolved + '/index.ts'].find(f => {
          try { return fs.statSync(f).isFile(); } catch { return false; }
        });
        if (withExt) imports.push(path.relative(process.cwd(), withExt));
      }
    }
    return imports;
  } catch {
    return [];
  }
}

function scanDirectory(dir: string, root: string): string[] {
  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      const rel  = path.relative(root, full);
      if (isIgnored(rel)) continue;
      if (entry.isDirectory()) {
        files.push(...scanDirectory(full, root));
      } else if (entry.isFile() && /\.(ts|js|json|html|css)$/.test(entry.name)) {
        files.push(rel);
      }
    }
  } catch { /* skip unreadable dirs */ }
  return files;
}

function getChangedFiles(): string[] {
  try {
    const out = execSync('git diff --name-only HEAD 2>/dev/null || echo ""', { encoding: 'utf8', timeout: 5000 });
    return out.split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

// ── Core ───────────────────────────────────────────────────────────────────

export function buildRepoContext(rootDir = '.'): RepoContext {
  const absRoot  = path.resolve(rootDir);
  const allFiles = scanDirectory(absRoot, absRoot);

  // Build file graph
  const fileGraph: Record<string, FileNode> = {};
  for (const f of allFiles) {
    const absPath = path.join(absRoot, f);
    let mtime = '';
    try { mtime = fs.statSync(absPath).mtime.toISOString(); } catch { /* skip */ }
    const imports = /\.(ts|js)$/.test(f) ? extractImports(absPath) : [];
    fileGraph[f] = {
      file:         f,
      imports,
      importedBy:   [],
      isProtected:  isProtected(f),
      isIgnored:    false,
      lastModified: mtime,
    };
  }

  // Resolve importedBy (reverse edges)
  for (const [file, node] of Object.entries(fileGraph)) {
    for (const imp of node.imports) {
      if (fileGraph[imp]) {
        fileGraph[imp].importedBy.push(file);
      }
    }
  }

  const changedFiles  = getChangedFiles();
  const protectedList = allFiles.filter(isProtected);

  return {
    contextId:      `ctx-${Date.now()}`,
    rootDir:        absRoot,
    fileGraph,
    changedFiles,
    protectedFiles: protectedList,
    ignoredPatterns: IGNORE_PATTERNS,
    indexedAt:      new Date().toISOString(),
    stats: {
      totalFiles:     allFiles.length,
      protectedCount: protectedList.length,
      changedCount:   changedFiles.length,
    },
  };
}

export function persistRepoContext(ctx: RepoContext): string {
  // Persist summary only (full graph can be very large)
  const summary = {
    contextId:      ctx.contextId,
    rootDir:        ctx.rootDir,
    changedFiles:   ctx.changedFiles,
    protectedFiles: ctx.protectedFiles,
    ignoredPatterns: ctx.ignoredPatterns,
    indexedAt:      ctx.indexedAt,
    stats:          ctx.stats,
  };
  fs.writeFileSync(CONTEXT_FILE, JSON.stringify(summary, null, 2), 'utf8');
  return CONTEXT_FILE;
}

export function isFileSafeToEdit(file: string, ctx: RepoContext): boolean {
  const node = ctx.fileGraph[file];
  if (!node) return false;
  if (node.isProtected) return false;
  if (node.isIgnored) return false;
  return true;
}

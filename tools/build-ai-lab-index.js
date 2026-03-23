#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// AI Lab — Static Run Index Builder
//
// Reads  : ai-lab/runs/*.json  (OrchestratorRun files — those with jobs[])
// Writes : tools/rehab-client/ai-lab/runs-index.json  (metadata list, newest first)
//          tools/rehab-client/ai-lab/runs/<runId>.json (full run data, static)
//
// Called at build time by Netlify / Vercel so the panel can load saved run
// history without a server-side filesystem read.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.join(__dirname, '..');
const RUNS_SRC = path.join(ROOT, 'ai-lab', 'runs');
const RUNS_DST = path.join(__dirname, 'rehab-client', 'ai-lab', 'runs');
const INDEX    = path.join(__dirname, 'rehab-client', 'ai-lab', 'runs-index.json');

// ── Ensure output dir ────────────────────────────────────────────────────────
fs.mkdirSync(RUNS_DST, { recursive: true });

// ── Read source runs ─────────────────────────────────────────────────────────
let files = [];
try {
  files = fs.readdirSync(RUNS_SRC).filter(function (f) { return f.endsWith('.json'); });
} catch (_) {
  console.warn('[ai-lab-index] ai-lab/runs/ not found — writing empty index.');
}

var index = [];
var copied = 0;
var skipped = 0;

files.forEach(function (file) {
  var src = path.join(RUNS_SRC, file);
  var data;
  try {
    data = JSON.parse(fs.readFileSync(src, 'utf8'));
  } catch (e) {
    console.warn('[ai-lab-index] skip (parse error):', file, '-', e.message);
    skipped++;
    return;
  }

  // Only index OrchestratorRun files (have jobs[])
  if (!Array.isArray(data.jobs)) {
    skipped++;
    return;
  }

  var jobs         = data.jobs || [];
  var failedJob    = jobs.find(function (j) { return j.status !== 'complete'; });
  var totalRetries = jobs.reduce(function (s, j) { return s + ((j.retries || []).length); }, 0);

  var started   = data.startedAt;
  var completed = data.completedAt;
  var durationMs = started && completed
    ? Math.round(new Date(completed) - new Date(started))
    : null;

  var entry = {
    runId:       data.runId,
    assetIds:    data.assetIds  || [],
    status:      data.status    || 'unknown',
    mode:        data.mode      || 'analysis',
    startedAt:   started        || null,
    completedAt: completed      || null,
    durationMs:  durationMs,
    pipelines:   data.pipelines || [],
    jobCount:    jobs.length,
    failedStage: failedJob ? failedJob.pipelineId : null,
    totalRetries: totalRetries,
  };

  index.push(entry);

  // Copy full run JSON to publish dir
  var dst = path.join(RUNS_DST, data.runId + '.json');
  fs.writeFileSync(dst, JSON.stringify(data, null, 2), 'utf8');
  copied++;
});

// Newest first
index.sort(function (a, b) {
  return new Date(b.startedAt || 0) - new Date(a.startedAt || 0);
});

fs.writeFileSync(INDEX, JSON.stringify(index, null, 2), 'utf8');

console.log('[ai-lab-index] indexed:', index.length, 'runs | copied:', copied, '| skipped:', skipped);
console.log('[ai-lab-index] written:', INDEX);

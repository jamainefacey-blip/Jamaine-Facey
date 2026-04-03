'use strict';

const chokidar = require('chokidar');
const path = require('path');
const { extractText } = require('./fileProcessor');

const SUPPORTED = new Set(['.txt', '.json', '.pdf', '.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp']);

let API_BASE = 'http://localhost:3001';

async function postToIngest(rawText, source) {
  const res = await fetch(`${API_BASE}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: rawText, source }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Ingest API error ${res.status}: ${body}`);
  }
  return res.json();
}

async function processFile(filePath) {
  const filename = path.basename(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (!SUPPORTED.has(ext)) return;

  console.log(`[watcher] Processing: ${filename}`);

  try {
    const rawText = await extractText(filePath);
    if (!rawText || !rawText.trim()) {
      console.log(`[watcher] Empty content: ${filename}`);
      return;
    }

    const result = await postToIngest(rawText, filename);
    console.log(`[watcher] Done: ${filename} — ${result.assetIds?.length || 0} assets`);
  } catch (err) {
    console.error(`[watcher] Error processing ${filename}:`, err.message);
  }
}

function startWatcher(inputDir, port = 3001) {
  API_BASE = `http://localhost:${port}`;

  const watcher = chokidar.watch(inputDir, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 1200, pollInterval: 100 },
  });

  watcher
    .on('add', (filePath) => processFile(filePath))
    .on('error', (err) => console.error('[watcher] Error:', err));

  console.log(`[watcher] Watching: ${inputDir}`);
  return watcher;
}

module.exports = { startWatcher, processFile };

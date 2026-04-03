'use strict';

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const PORT = parseInt(process.env.PORT || '3001', 10);
const dev = process.env.NODE_ENV !== 'production';

// Ensure input directory exists
const inputDir = path.join(__dirname, 'input');
if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir, { recursive: true });

// Ensure database directory exists
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Initialize database
  const { getDb } = require('./database/init');
  getDb(); // triggers schema creation

  // Start file watcher
  const { startWatcher } = require('./utils/fileWatcher');
  startWatcher(inputDir);

  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`\n> Pain System OS v1 ready on http://localhost:${PORT}`);
    console.log(`> Drop files into: ${inputDir}\n`);
  });
});

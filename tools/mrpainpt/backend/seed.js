#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
//  Mr Pain PT — DB Seed Script
//  ─────────────────────────────────────────────────────────────────────────────
//
//  Imports all static client JS files from scripts/data/clients/ into the DB.
//  Once seeded, the DB becomes the source of truth and the static files are
//  only used as a fallback when the API is unreachable.
//
//  Usage:
//    node seed.js              — import new clients only (idempotent)
//    node seed.js --overwrite  — overwrite existing DB records with static data
//    node seed.js --dry-run    — preview what would be imported, don't write
//
//  After seeding:
//    • Use the Coach Portal (?module=coach) to make edits — not the static files
//    • The static files can remain as offline fallback — they are not deleted
//    • The DB is at backend/data/mrpainpt.db
//
//  Migration path:
//    1. Run: node seed.js
//    2. Verify: curl http://localhost:3000/api/clients
//    3. Edit clients via Coach Portal — changes persist to DB
//    4. Export via Coach Portal → update static files for offline fallback
// ─────────────────────────────────────────────────────────────────────────────

"use strict";

const vm   = require("vm");
const fs   = require("fs");
const path = require("path");

const clients    = require("./clients");
const CLIENT_DIR = path.resolve(__dirname, "../scripts/data/clients");

const OVERWRITE = process.argv.includes("--overwrite");
const DRY_RUN   = process.argv.includes("--dry-run");

console.log(`\n  Mr Pain PT DB Seed`);
console.log(`  ────────────────────────────────`);
console.log(`  Source: ${CLIENT_DIR}`);
console.log(`  Mode:   ${DRY_RUN ? "dry-run" : OVERWRITE ? "overwrite" : "new-only"}`);
console.log(`  DB:     ${path.resolve(__dirname, "data/mrpainpt.db")}\n`);

// ── Read + parse client JS file safely ───────────────────────────────────────
// The static files declare: const CLIENT_CONFIG = {...}; const PROGRAM = {...};
// We strip the const/let/var keywords so variables land in the vm context.

function extractFromFile(filePath) {
  const src = fs.readFileSync(filePath, "utf8");

  // Replace leading const/let/var on declaration lines → plain assignment
  const normalised = src.replace(/^(const|let|var)\s+/gm, "");

  const ctx = vm.createContext({});
  try {
    vm.runInContext(normalised, ctx);
  } catch (err) {
    return { error: err.message };
  }

  if (!ctx.CLIENT_CONFIG && !ctx.PROGRAM) {
    return { error: "No CLIENT_CONFIG or PROGRAM found in file" };
  }

  return {
    clientConfig: ctx.CLIENT_CONFIG || {},
    program:      ctx.PROGRAM       || {},
  };
}

// ── Derive slug from filename ─────────────────────────────────────────────────

function slugFromFile(filePath) {
  return path.basename(filePath, ".js");
}

// ── Main ──────────────────────────────────────────────────────────────────────

let files;
try {
  files = fs.readdirSync(CLIENT_DIR).filter(f => f.endsWith(".js"));
} catch (err) {
  console.error(`  ✗  Could not read client directory: ${CLIENT_DIR}`);
  console.error(`     ${err.message}`);
  process.exit(1);
}

if (files.length === 0) {
  console.log("  No .js files found in client directory.\n");
  process.exit(0);
}

let imported = 0;
let skipped  = 0;
let errors   = 0;

files.forEach(file => {
  const slug     = slugFromFile(file);
  const filePath = path.join(CLIENT_DIR, file);
  const data     = extractFromFile(filePath);

  if (data.error) {
    console.log(`  ✗  ${slug.padEnd(25)} — parse error: ${data.error}`);
    errors++;
    return;
  }

  const exists = clients.exists(slug);

  if (exists && !OVERWRITE) {
    console.log(`  ·  ${slug.padEnd(25)} — already in DB (skip)`);
    skipped++;
    return;
  }

  if (DRY_RUN) {
    const name = [data.clientConfig?.client?.firstName, data.clientConfig?.client?.lastName].filter(Boolean).join(" ") || slug;
    const mode = data.program?.mode || "?";
    console.log(`  ✓  ${slug.padEnd(25)} — would ${exists ? "overwrite" : "import"}: ${name} (${mode})`);
    imported++;
    return;
  }

  try {
    if (exists) {
      clients.update(slug, { clientConfig: data.clientConfig, program: data.program });
    } else {
      clients.create(slug, data.clientConfig, data.program);
    }
    const name = [data.clientConfig?.client?.firstName, data.clientConfig?.client?.lastName].filter(Boolean).join(" ") || slug;
    const mode = data.program?.mode || "?";
    const acc  = data.program?.access?.status || "?";
    console.log(`  ✓  ${slug.padEnd(25)} — ${exists ? "overwritten" : "imported"}: ${name} | ${mode} | ${acc}`);
    imported++;
  } catch (err) {
    console.log(`  ✗  ${slug.padEnd(25)} — DB error: ${err.message}`);
    errors++;
  }
});

console.log(`\n  ──────────────────────────────`);
console.log(`  ${DRY_RUN ? "Would import" : "Imported"}: ${imported}`);
console.log(`  Skipped:  ${skipped}`);
console.log(`  Errors:   ${errors}`);

if (!DRY_RUN && imported > 0) {
  console.log(`\n  DB is now the source of truth.`);
  console.log(`  Start the server: npm start`);
  console.log(`  Open coach portal: index.html?module=coach\n`);
} else if (DRY_RUN) {
  console.log(`\n  Run without --dry-run to write to DB.\n`);
}

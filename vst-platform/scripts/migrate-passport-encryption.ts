/**
 * VST Platform — Passport Re-encryption Migration
 * ─────────────────────────────────────────────────────────────────────────────
 * One-time script to encrypt any plaintext passport numbers that were stored
 * before Phase 5 introduced AES-256-GCM encryption at rest.
 *
 * SAFETY
 * ─────────────────────────────────────────────────────────────────────────────
 * - Idempotent: records already in encrypted format are detected and skipped.
 * - Null / empty values are skipped without modification.
 * - Failures are caught per-record; the script continues and reports a count.
 * - No passport numbers are written to logs at any point.
 * - Run this ONCE before deploying Phase 5 to production if existing records
 *   contain plaintext passport numbers.
 *
 * ENCRYPTED FORMAT (Phase 5)
 * ─────────────────────────────────────────────────────────────────────────────
 * "<iv_base64>:<ciphertext_base64>:<auth_tag_base64>"
 * Three colon-delimited base64 segments. Any value not matching this pattern
 * is treated as plaintext and will be encrypted.
 *
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. Export required env vars (or use a .env file loaded via dotenv):
 *      DATABASE_URL=postgresql://...
 *      PASSPORT_ENCRYPTION_KEY=<64 hex chars>  # openssl rand -hex 32
 *
 * 2. From the repo root, run with ts-node:
 *      npx ts-node --skipProject scripts/migrate-passport-encryption.ts
 *
 *    Or compile first then run:
 *      npx tsc --esModuleInterop --module commonjs --target es2020 \
 *              --outDir scripts/dist scripts/migrate-passport-encryption.ts
 *      node scripts/dist/migrate-passport-encryption.js
 *
 * 3. Verify output — expect:
 *      Encrypted : N   (legacy plaintext records now secured)
 *      Skipped   : M   (null values + already-encrypted records)
 *      Failed    : 0   (any non-zero value requires investigation)
 *
 * KEY ROTATION (future)
 * ─────────────────────────────────────────────────────────────────────────────
 * Set OLD_PASSPORT_ENCRYPTION_KEY to the previous key.
 * Adjust the script to decrypt with the old key and re-encrypt with the new.
 * Deploy the new key after the migration completes.
 */

import * as crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

// ── Encryption constants (must match PassportCryptoService) ──────────────────
const ALGORITHM = 'aes-256-gcm';
const IV_BYTES   = 12;
const TAG_BYTES  = 16;
const KEY_LENGTH = 32;

// ── Result counters ───────────────────────────────────────────────────────────
let countEncrypted = 0;
let countSkipped   = 0;
let countFailed    = 0;

// ── Key loading ───────────────────────────────────────────────────────────────
function loadKey(): Buffer {
  const hex = process.env.PASSPORT_ENCRYPTION_KEY ?? '';
  if (hex.length !== KEY_LENGTH * 2) {
    throw new Error(
      `PASSPORT_ENCRYPTION_KEY must be exactly ${KEY_LENGTH * 2} hex characters. ` +
      `Generate with: openssl rand -hex ${KEY_LENGTH}`,
    );
  }
  return Buffer.from(hex, 'hex');
}

// ── Encrypted format detection ────────────────────────────────────────────────
// Returns true if the value matches the Phase 5 stored format:
// "<base64>:<base64>:<base64>" — three colon-separated non-empty base64 segments.
// A plaintext passport number (e.g. "GB123456789") will never match this pattern.
const BASE64_RE = /^[A-Za-z0-9+/]+=*$/;

function isAlreadyEncrypted(value: string): boolean {
  const parts = value.split(':');
  if (parts.length !== 3) return false;
  return parts.every(p => p.length > 0 && BASE64_RE.test(p));
}

// ── Encryption ────────────────────────────────────────────────────────────────
function encrypt(plaintext: string, key: Buffer): string {
  const iv       = crypto.randomBytes(IV_BYTES);
  const cipher   = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    iv.toString('base64'),
    encrypted.toString('base64'),
    tag.toString('base64'),
  ].join(':');
}

// ── Sanity-check: verify we can round-trip a test value ──────────────────────
function verifyKeyRoundTrip(key: Buffer): void {
  const testPlain = 'VST-ROUNDTRIP-TEST-1234';
  const stored = encrypt(testPlain, key);

  const [ivB64, dataB64, tagB64] = stored.split(':');
  const iv        = Buffer.from(ivB64,   'base64');
  const encrypted = Buffer.from(dataB64, 'base64');
  const tag       = Buffer.from(tagB64,  'base64');

  if (tag.length !== TAG_BYTES) throw new Error('Round-trip: auth tag length mismatch');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = decipher.update(encrypted).toString('utf8') + decipher.final('utf8');

  if (decrypted !== testPlain) {
    throw new Error('Round-trip test FAILED — key may be corrupted. Aborting migration.');
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  console.log('VST — Passport Re-encryption Migration');
  console.log('═══════════════════════════════════════');

  // 1. Load and verify key
  const key = loadKey();
  verifyKeyRoundTrip(key);
  console.log('✓ Encryption key loaded and verified');

  // 2. Connect to DB
  const prisma = new PrismaClient({ log: ['warn', 'error'] });
  await prisma.$connect();
  console.log('✓ Database connected');

  // 3. Fetch all passport records
  const passports = await prisma.passport.findMany({
    select: { id: true, passportNumber: true },
  });

  console.log(`\nTotal passport records: ${passports.length}`);
  console.log('Processing...\n');

  // 4. Process each record
  for (const passport of passports) {
    const raw = passport.passportNumber;

    // Null or empty — nothing to encrypt
    if (!raw || raw.trim() === '') {
      countSkipped++;
      continue;
    }

    // Already in Phase 5 encrypted format — skip (idempotent)
    if (isAlreadyEncrypted(raw)) {
      countSkipped++;
      continue;
    }

    // Plaintext — encrypt and update
    try {
      const ciphertext = encrypt(raw, key);

      await prisma.passport.update({
        where: { id: passport.id },
        data:  { passportNumber: ciphertext },
      });

      countEncrypted++;
      // Log the record ID only — never the passport number
      process.stdout.write(`  Encrypted  passport record [${passport.id}]\n`);
    } catch (err) {
      countFailed++;
      // Log the record ID and error — never the passport number
      console.error(`  FAILED     passport record [${passport.id}]: ${(err as Error).message}`);
    }
  }

  // 5. Disconnect
  await prisma.$disconnect();

  // 6. Summary
  console.log('\n───────────────────────────────────────');
  console.log('Migration complete');
  console.log(`  Encrypted : ${countEncrypted}`);
  console.log(`  Skipped   : ${countSkipped}   (null, empty, or already encrypted)`);
  console.log(`  Failed    : ${countFailed}`);
  console.log('───────────────────────────────────────');

  if (countFailed > 0) {
    console.error(`\n⚠  ${countFailed} record(s) failed. Investigate before deploying Phase 5.`);
    process.exit(1);
  } else {
    console.log('\n✓ All records secure. Safe to deploy Phase 5 passport encryption.');
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Migration aborted:', err.message);
  process.exit(1);
});

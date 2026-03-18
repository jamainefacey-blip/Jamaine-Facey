/**
 * PassportCryptoService — AES-256-GCM encryption for passport numbers at rest.
 *
 * KEY SETUP
 * ─────────────────────────────────────────────────────────────────────────────
 * Generate a key:   openssl rand -hex 32
 * Set env var:      PASSPORT_ENCRYPTION_KEY=<64-char hex string>
 *
 * The key must be exactly 32 bytes (64 hex characters). Never reuse this key
 * for any other purpose. Rotate via a migration that re-encrypts all records.
 *
 * STORED FORMAT
 * ─────────────────────────────────────────────────────────────────────────────
 * "<iv_base64>:<ciphertext_base64>:<auth_tag_base64>"
 * A random 96-bit IV is generated per encryption call.
 * The GCM auth tag (128-bit) prevents silent tampering.
 *
 * SECURITY NOTES
 * ─────────────────────────────────────────────────────────────────────────────
 * - Never log or serialize the plaintext passport number.
 * - The passport number is only decrypted in getPassport() for the owner.
 * - Scheduled tasks (passport expiry) MUST NOT decrypt the passport number.
 * - If PASSPORT_ENCRYPTION_KEY is missing at runtime, encrypt/decrypt throw
 *   immediately with a clear error rather than storing plaintext.
 */

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

const ALGORITHM  = 'aes-256-gcm';
const IV_BYTES   = 12;   // 96-bit IV — recommended for GCM
const TAG_BYTES  = 16;   // 128-bit auth tag
const KEY_LENGTH = 32;   // 256-bit key

@Injectable()
export class PassportCryptoService {
  private readonly logger = new Logger(PassportCryptoService.name);

  private getKey(): Buffer {
    const hex = process.env.PASSPORT_ENCRYPTION_KEY ?? '';
    if (hex.length !== KEY_LENGTH * 2) {
      this.logger.error(
        'PASSPORT_ENCRYPTION_KEY is missing or not 64 hex chars. ' +
        'Generate one with: openssl rand -hex 32',
      );
      throw new InternalServerErrorException(
        'Passport encryption key not configured. Contact support.',
      );
    }
    return Buffer.from(hex, 'hex');
  }

  /**
   * Encrypts a plaintext passport number.
   * Returns a single string safe for DB storage.
   */
  encrypt(plaintext: string): string {
    const key = this.getKey();
    const iv  = crypto.randomBytes(IV_BYTES);

    const cipher    = crypto.createCipheriv(ALGORITHM, key, iv);
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

  /**
   * Decrypts a stored passport number ciphertext.
   * Throws if the auth tag is invalid (tampered data).
   */
  decrypt(stored: string): string {
    const key    = this.getKey();
    const parts  = stored.split(':');

    if (parts.length !== 3) {
      throw new InternalServerErrorException('Passport data is malformed.');
    }

    const [ivB64, dataB64, tagB64] = parts;
    const iv        = Buffer.from(ivB64,   'base64');
    const encrypted = Buffer.from(dataB64, 'base64');
    const tag       = Buffer.from(tagB64,  'base64');

    if (tag.length !== TAG_BYTES) {
      throw new InternalServerErrorException('Passport auth tag is invalid.');
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    return (
      decipher.update(encrypted).toString('utf8') +
      decipher.final('utf8')
    );
  }
}

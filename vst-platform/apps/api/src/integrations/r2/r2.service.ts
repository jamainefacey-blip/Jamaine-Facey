/**
 * R2Service — Cloudflare R2 presigned upload URL generation.
 *
 * ARCHITECTURE
 * ─────────────────────────────────────────────────────────────────────────────
 * Cloudflare R2 is S3-compatible, so we use the AWS SDK with a custom endpoint.
 * The bucket has NO public write access. All uploads go through short-lived
 * presigned PUT URLs (TTL: 900 seconds / 15 minutes).
 *
 * UPLOAD FLOW
 * ─────────────────────────────────────────────────────────────────────────────
 *   1. Client calls POST /v1/reviews/upload-url (or /v1/explorer/pins/:id/upload-url)
 *   2. Server calls presignUpload() → returns { uploadUrl, publicUrl, key, expiresIn }
 *   3. Client issues a direct PUT to uploadUrl (no server proxying, no auth header)
 *   4. Client uses publicUrl (CDN-fronted) to reference the asset going forward
 *
 * OBJECT KEY CONVENTIONS
 * ─────────────────────────────────────────────────────────────────────────────
 *   reviews/   {reviewId}/{timestamp}-{sanitizedFilename}
 *   explorer/  pins/{pinId}/{timestamp}-{sanitizedFilename}
 *
 * Filenames are sanitised: only alphanumeric, dots, hyphens, underscores kept.
 * No path traversal is possible (no slashes, no ../).
 *
 * SECURITY
 * ─────────────────────────────────────────────────────────────────────────────
 * - Bucket policy: no public write (presigned URLs are the only write path)
 * - Presigned URL is scoped to a single key and a single content-type
 * - TTL: 900 seconds (client must start upload within 15 minutes)
 * - CDN_BASE_URL / STORAGE_PUBLIC_URL is the read domain — never the upload domain
 *
 * REQUIRED ENV VARS
 * ─────────────────────────────────────────────────────────────────────────────
 *   STORAGE_ENDPOINT         e.g. https://<accountid>.r2.cloudflarestorage.com
 *   STORAGE_ACCESS_KEY_ID    R2 API token with Object Read & Write
 *   STORAGE_SECRET_ACCESS_KEY
 *   STORAGE_BUCKET           e.g. vst-uploads
 *   STORAGE_PUBLIC_URL       e.g. https://uploads.voyagesmarttravel.com
 *   CDN_BASE_URL             e.g. https://cdn.voyagesmarttravel.com  (takes precedence)
 */

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const UPLOAD_TTL_SECONDS = 900; // 15 minutes
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
]);

export interface PresignResult {
  uploadUrl: string;   // Short-lived PUT URL — client uploads directly here
  publicUrl: string;   // Permanent CDN URL — store this in DB
  key:       string;   // Object key in the bucket
  expiresIn: number;   // Seconds until uploadUrl expires
}

@Injectable()
export class R2Service {
  private readonly logger = new Logger(R2Service.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBase: string;

  constructor() {
    const endpoint  = process.env.STORAGE_ENDPOINT          ?? '';
    const accessKey = process.env.STORAGE_ACCESS_KEY_ID     ?? '';
    const secretKey = process.env.STORAGE_SECRET_ACCESS_KEY ?? '';
    this.bucket     = process.env.STORAGE_BUCKET            ?? 'vst-uploads';

    // CDN_BASE_URL takes precedence over STORAGE_PUBLIC_URL for the public read domain
    this.publicBase = (
      process.env.CDN_BASE_URL          ??
      process.env.STORAGE_PUBLIC_URL    ??
      'https://cdn.voyagesmarttravel.com'
    ).replace(/\/$/, ''); // strip trailing slash

    if (!endpoint || !accessKey || !secretKey) {
      this.logger.warn(
        'R2 storage env vars missing (STORAGE_ENDPOINT / STORAGE_ACCESS_KEY_ID / ' +
        'STORAGE_SECRET_ACCESS_KEY). Upload presign will throw at runtime.',
      );
      this.client = null;
      return;
    }

    this.client = new S3Client({
      region: 'auto',           // R2 uses "auto" as the region identifier
      endpoint,
      credentials: {
        accessKeyId:     accessKey,
        secretAccessKey: secretKey,
      },
      // R2 does not use SigV4 path-style = true isn't required, but explicit is safer
      forcePathStyle: false,
    });

    this.logger.log(`R2 storage ready — bucket: ${this.bucket}, public: ${this.publicBase}`);
  }

  /**
   * Builds the object key for a review media upload.
   * Pattern: reviews/{reviewId}/{timestamp}-{sanitizedFilename}
   */
  buildReviewMediaKey(reviewId: string, filename: string): string {
    return `reviews/${reviewId}/${Date.now()}-${this.sanitize(filename)}`;
  }

  /**
   * Builds the object key for an explorer pin media upload.
   * Pattern: explorer/pins/{pinId}/{timestamp}-{sanitizedFilename}
   */
  buildExplorerPinKey(pinId: string, filename: string): string {
    return `explorer/pins/${pinId}/${Date.now()}-${this.sanitize(filename)}`;
  }

  /**
   * Generates a presigned PUT URL for a given object key and content type.
   *
   * The caller is responsible for building the key via one of the key builder
   * methods above — never accept a raw key from untrusted client input.
   */
  async presignUpload(key: string, contentType: string): Promise<PresignResult> {
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new InternalServerErrorException(
        `Content type '${contentType}' is not permitted for upload.`,
      );
    }

    if (!this.client) {
      throw new InternalServerErrorException(
        'Storage service is not configured. Contact support.',
      );
    }

    const command = new PutObjectCommand({
      Bucket:      this.bucket,
      Key:         key,
      ContentType: contentType,
      // Enforce content-type match — client must send the exact same type
      // that was used to sign the URL or the upload will be rejected.
    });

    let uploadUrl: string;
    try {
      uploadUrl = await getSignedUrl(this.client, command, {
        expiresIn: UPLOAD_TTL_SECONDS,
      });
    } catch (err) {
      this.logger.error(`R2 presign failed for key [${key}]: ${(err as Error).message}`);
      throw new InternalServerErrorException('Failed to generate upload URL. Try again.');
    }

    const publicUrl = `${this.publicBase}/${key}`;

    return {
      uploadUrl,
      publicUrl,
      key,
      expiresIn: UPLOAD_TTL_SECONDS,
    };
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  /**
   * Removes any character that isn't safe in an object key leaf segment.
   * Prevents path traversal, shell injection, and CDN issues.
   * Preserves: a-z A-Z 0-9 . - _
   * Max length: 200 characters (safety cap before timestamps are prepended).
   */
  private sanitize(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9.\-_]/g, '_')
      .slice(0, 200);
  }
}

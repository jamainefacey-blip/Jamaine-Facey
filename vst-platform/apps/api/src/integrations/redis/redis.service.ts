/**
 * RedisService — ioredis wrapper with graceful degradation.
 *
 * DESIGN
 * ─────────────────────────────────────────────────────────────────────────────
 * If REDIS_URL is missing or Redis is unreachable at startup, the service logs
 * a warning and falls back to an in-memory store. The API continues to work
 * in degraded mode without crashing — push subscriptions are lost on restart
 * but no errors are thrown to callers.
 *
 * The fallback Map mirrors the Redis HASH interface so that all consumers
 * (NotificationsService) have identical code paths regardless of Redis
 * availability.
 *
 * PUB-SUB PREP
 * ─────────────────────────────────────────────────────────────────────────────
 * publish() is wired to Redis PUBLISH. Subscribers (e.g. notification relay
 * workers) can subscribe via a separate Redis connection. This is the
 * foundation for multi-instance push fanout and does not require consumers
 * to be active to function — publish just fires and forgets.
 *
 * REQUIRED ENV VARS
 * ─────────────────────────────────────────────────────────────────────────────
 *   REDIS_URL   redis://localhost:6379  (or rediss:// for TLS)
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import Redis from 'ioredis';

// ── Types ─────────────────────────────────────────────────────────────────────

// The fallback store mirrors a subset of the Redis HASH API:
// Outer key = Redis key; inner Map = field → value
type FallbackStore = Map<string, Map<string, string>>;

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  private client:   Redis | null = null;
  private fallback: FallbackStore = new Map();

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async onModuleInit(): Promise<void> {
    const url = process.env.REDIS_URL;

    if (!url) {
      this.logger.warn(
        'REDIS_URL not set. Push subscriptions use in-memory fallback ' +
        '(not production-safe — subscriptions are lost on restart).',
      );
      return;
    }

    try {
      this.client = new Redis(url, {
        lazyConnect:          true,
        connectTimeout:       5_000,
        maxRetriesPerRequest: 1,
        enableReadyCheck:     true,
        retryStrategy:        () => null, // do not retry at startup — fail fast
      });

      this.client.on('error', (err: Error) => {
        this.logger.warn(`Redis runtime error: ${err.message}`);
      });

      await this.client.connect();
      this.logger.log('Redis connected.');
    } catch (err) {
      this.logger.warn(
        `Redis unavailable at startup (${(err as Error).message}). ` +
        'Falling back to in-memory store.',
      );
      this.client = null;
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      try { await this.client.quit(); } catch { /* ignore on shutdown */ }
    }
  }

  // ── Status ──────────────────────────────────────────────────────────────────

  isAvailable(): boolean {
    return this.client !== null && this.client.status === 'ready';
  }

  // ── HASH operations (used for push subscription storage) ──────────────────
  //   Key structure:  vst:push:subs:{userId}
  //   Field:          base64-safe representation of subscription endpoint
  //   Value:          JSON-serialised full push subscription object

  async hset(key: string, field: string, value: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.hset(key, field, value);
        return;
      } catch (err) {
        this.logger.warn(`Redis hset failed, using fallback: ${(err as Error).message}`);
      }
    }
    const map = this.fallback.get(key) ?? new Map<string, string>();
    map.set(field, value);
    this.fallback.set(key, map);
  }

  async hdel(key: string, field: string): Promise<void> {
    if (this.client) {
      try {
        await this.client.hdel(key, field);
        return;
      } catch (err) {
        this.logger.warn(`Redis hdel failed, using fallback: ${(err as Error).message}`);
      }
    }
    this.fallback.get(key)?.delete(field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (this.client) {
      try {
        const result = await this.client.hgetall(key);
        return result ?? {};
      } catch (err) {
        this.logger.warn(`Redis hgetall failed, using fallback: ${(err as Error).message}`);
      }
    }
    const map = this.fallback.get(key);
    if (!map) return {};
    const result: Record<string, string> = {};
    for (const [k, v] of map.entries()) result[k] = v;
    return result;
  }

  // ── STRING operations (general-purpose cache / dedup keys) ─────────────────

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (err) {
        this.logger.warn(`Redis set failed: ${(err as Error).message}`);
      }
    }
    // Fallback: store in the hash-style map under a sentinel key
    const map = this.fallback.get('__str__') ?? new Map<string, string>();
    map.set(key, value);
    this.fallback.set('__str__', map);
  }

  async get(key: string): Promise<string | null> {
    if (this.client) {
      try {
        return await this.client.get(key);
      } catch (err) {
        this.logger.warn(`Redis get failed: ${(err as Error).message}`);
      }
    }
    return this.fallback.get('__str__')?.get(key) ?? null;
  }

  // ── Pub-sub (notification fanout prep) ────────────────────────────────────
  // Publishes a message to a Redis channel.
  // Subscribers on other instances pick this up via a separate SUBSCRIBE connection.
  // If Redis is unavailable, the call is a no-op (fire-and-forget by design).

  async publish(channel: string, message: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.publish(channel, message);
    } catch (err) {
      this.logger.warn(`Redis publish failed on channel '${channel}': ${(err as Error).message}`);
    }
  }
}

/**
 * Sliding window rate limiter with Redis support.
 *
 * When REDIS_URL is configured, uses Redis sorted sets + Lua for atomic,
 * cross-instance enforcement. Falls back to an in-memory Map when Redis
 * is unavailable (local dev or connection failure).
 */

import { getRedisClient } from './redis';
import { createLogger } from './logger';

const logger = createLogger('rate-limit');

interface RateLimiterOptions {
	/** Max requests allowed in the window */
	points: number;
	/** Window duration in milliseconds */
	windowMs: number;
	/** Redis key prefix (e.g. 'general', 'auth') */
	prefix?: string;
}

export interface RateLimitResult {
	allowed: boolean;
	/** Seconds until the oldest request in the window expires */
	retryAfter: number;
}

// Lua script: atomic sliding window via sorted set
// KEYS[1] = rate limit key
// ARGV[1] = window in ms, ARGV[2] = max points, ARGV[3] = now (ms), ARGV[4] = unique member
const LUA_SCRIPT = `
local key = KEYS[1]
local windowMs = tonumber(ARGV[1])
local maxPoints = tonumber(ARGV[2])
local now = tonumber(ARGV[3])
local member = ARGV[4]

-- Remove expired entries
redis.call('ZREMRANGEBYSCORE', key, '-inf', now - windowMs)

local count = redis.call('ZCARD', key)

if count >= maxPoints then
  local oldest = redis.call('ZRANGEBYSCORE', key, '-inf', '+inf', 'WITHSCORES', 'LIMIT', 0, 1)
  local oldestScore = tonumber(oldest[2])
  local retryAfterMs = oldestScore + windowMs - now
  return {0, retryAfterMs}
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, windowMs)
return {1, 0}
`;

// --- In-memory fallback ---

interface RateLimitEntry {
	timestamps: number[];
}

function createInMemoryStore(points: number, windowMs: number) {
	const store = new Map<string, RateLimitEntry>();

	const cleanupInterval = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
			if (entry.timestamps.length === 0) {
				store.delete(key);
			}
		}
	}, 60_000);

	if (cleanupInterval.unref) {
		cleanupInterval.unref();
	}

	return {
		consume(key: string): RateLimitResult {
			const now = Date.now();
			let entry = store.get(key);

			if (!entry) {
				entry = { timestamps: [] };
				store.set(key, entry);
			}

			entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

			if (entry.timestamps.length >= points) {
				const oldest = entry.timestamps[0];
				const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
				return { allowed: false, retryAfter };
			}

			entry.timestamps.push(now);
			return { allowed: true, retryAfter: 0 };
		}
	};
}

// --- Rate limiter factory ---

let redisLoggedOnce = false;

export function createRateLimiter({ points, windowMs, prefix = 'default' }: RateLimiterOptions) {
	const memoryStore = createInMemoryStore(points, windowMs);

	return {
		async consume(key: string): Promise<RateLimitResult> {
			const redis = getRedisClient();

			if (redis) {
				try {
					const redisKey = `rl:${prefix}:${key}`;
					const now = Date.now();
					const member = `${now}:${Math.random().toString(36).slice(2, 8)}`;

					// redis.eval runs a Lua script on the Redis server (not JS eval)
					const result = (await redis.eval(
						LUA_SCRIPT,
						1,
						redisKey,
						String(windowMs),
						String(points),
						String(now),
						member
					)) as [number, number];

					const allowed = result[0] === 1;
					const retryAfter = allowed ? 0 : Math.ceil(result[1] / 1000);

					return { allowed, retryAfter };
				} catch (err) {
					if (!redisLoggedOnce) {
						logger.error('Redis rate-limit failed, falling back to in-memory', err);
						redisLoggedOnce = true;
					}
					return memoryStore.consume(key);
				}
			}

			return memoryStore.consume(key);
		}
	};
}

// Pre-configured rate limiters
export const generalLimiter = createRateLimiter({
	points: 100,
	windowMs: 60_000,
	prefix: 'general'
});
export const authLimiter = createRateLimiter({
	points: 10,
	windowMs: 15 * 60_000,
	prefix: 'auth'
});
export const checkoutLimiter = createRateLimiter({
	points: 20,
	windowMs: 60_000,
	prefix: 'checkout'
});

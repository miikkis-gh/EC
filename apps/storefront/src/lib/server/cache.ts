import { getRedisClient } from './redis';
import { createLogger } from './logger';

const logger = createLogger('cache');

interface CacheEntry<T> {
	data: T;
	expiresAt: number;
	staleAt: number;
}

// In-memory fallback with LRU eviction
const memoryCache = new Map<string, CacheEntry<unknown>>();
const MAX_MEMORY_ENTRIES = 100;

function evictOldest() {
	if (memoryCache.size <= MAX_MEMORY_ENTRIES) return;
	// Map iteration is in insertion order — delete the first (oldest) entry
	const firstKey = memoryCache.keys().next().value;
	if (firstKey) memoryCache.delete(firstKey);
}

interface CacheOptions {
	/** Time-to-live in seconds */
	ttl: number;
	/** Stale-while-revalidate window in seconds (served stale while refreshing) */
	swr?: number;
}

export async function cached<T>(
	key: string,
	fetcher: () => Promise<T>,
	options: CacheOptions
): Promise<T> {
	const { ttl, swr = 0 } = options;
	const redis = getRedisClient();

	// Try Redis first
	if (redis) {
		try {
			const raw = await redis.get(`cache:${key}`);
			if (raw) {
				const entry: CacheEntry<T> = JSON.parse(raw);
				const now = Date.now();

				if (now < entry.staleAt) {
					// Fresh — return immediately
					return entry.data;
				}

				if (now < entry.expiresAt) {
					// Stale but within SWR window — return stale and revalidate in background
					revalidate(key, fetcher, options, redis).catch((err) => {
						logger.error('Background revalidation failed', err, { key });
					});
					return entry.data;
				}
			}
		} catch (err) {
			logger.error('Redis cache read failed', err, { key });
		}
	}

	// Try in-memory cache
	const memEntry = memoryCache.get(key) as CacheEntry<T> | undefined;
	if (memEntry) {
		const now = Date.now();
		if (now < memEntry.staleAt) {
			return memEntry.data;
		}
		if (now < memEntry.expiresAt) {
			revalidate(key, fetcher, options, redis).catch((err) => {
				logger.error('Background revalidation failed', err, { key });
			});
			return memEntry.data;
		}
	}

	// Cache miss — fetch fresh data
	const data = await fetcher();
	await storeEntry(key, data, options, redis);
	return data;
}

async function revalidate<T>(
	key: string,
	fetcher: () => Promise<T>,
	options: CacheOptions,
	redis: ReturnType<typeof getRedisClient>
): Promise<void> {
	const data = await fetcher();
	await storeEntry(key, data, options, redis);
}

async function storeEntry<T>(
	key: string,
	data: T,
	options: CacheOptions,
	redis: ReturnType<typeof getRedisClient>
): Promise<void> {
	const { ttl, swr = 0 } = options;
	const now = Date.now();
	const entry: CacheEntry<T> = {
		data,
		staleAt: now + ttl * 1000,
		expiresAt: now + (ttl + swr) * 1000
	};

	// Store in memory
	memoryCache.delete(key); // re-insert to update insertion order
	memoryCache.set(key, entry);
	evictOldest();

	// Store in Redis
	if (redis) {
		try {
			const totalTtl = ttl + swr;
			await redis.setex(`cache:${key}`, totalTtl, JSON.stringify(entry));
		} catch (err) {
			logger.error('Redis cache write failed', err, { key });
		}
	}
}

export async function invalidateCache(pattern: string): Promise<void> {
	// Clear memory cache
	for (const key of memoryCache.keys()) {
		if (key.includes(pattern)) {
			memoryCache.delete(key);
		}
	}

	// Clear Redis cache
	const redis = getRedisClient();
	if (redis) {
		try {
			const keys = await redis.keys(`cache:*${pattern}*`);
			if (keys.length > 0) {
				await redis.del(...keys);
			}
		} catch (err) {
			logger.error('Redis cache invalidation failed', err, { pattern });
		}
	}
}

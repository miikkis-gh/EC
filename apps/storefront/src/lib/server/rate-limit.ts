/**
 * In-memory sliding window rate limiter.
 * No external dependencies — uses a Map with automatic cleanup.
 */

interface RateLimitEntry {
	timestamps: number[];
}

interface RateLimiterOptions {
	/** Max requests allowed in the window */
	points: number;
	/** Window duration in milliseconds */
	windowMs: number;
}

interface RateLimitResult {
	allowed: boolean;
	/** Seconds until the oldest request in the window expires */
	retryAfter: number;
}

export function createRateLimiter({ points, windowMs }: RateLimiterOptions) {
	const store = new Map<string, RateLimitEntry>();

	// Auto-cleanup expired entries every 60s
	const cleanupInterval = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);
			if (entry.timestamps.length === 0) {
				store.delete(key);
			}
		}
	}, 60_000);

	// Allow garbage collection if the process is shutting down
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

			// Remove expired timestamps
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

// Pre-configured rate limiters
export const generalLimiter = createRateLimiter({ points: 100, windowMs: 60_000 });
export const authLimiter = createRateLimiter({ points: 10, windowMs: 15 * 60_000 });
export const checkoutLimiter = createRateLimiter({ points: 20, windowMs: 60_000 });

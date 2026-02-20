interface CacheEntry<T> {
	data: T;
	createdAt: number;
	ttl: number;
	staleTtl: number;
}

const store = new Map<string, CacheEntry<unknown>>();

let cleanupInterval: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
	if (cleanupInterval) return;
	cleanupInterval = setInterval(() => {
		const now = Date.now();
		for (const [key, entry] of store) {
			if (now - entry.createdAt > entry.staleTtl) {
				store.delete(key);
			}
		}
	}, 60_000);
	// Allow process to exit even if interval is running
	if (typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
		cleanupInterval.unref();
	}
}

export async function cached<T>(
	key: string,
	fetcher: () => Promise<T>,
	options: { ttl?: number; staleTtl?: number } = {}
): Promise<T> {
	const { ttl = 30_000, staleTtl = 120_000 } = options;
	const now = Date.now();
	const entry = store.get(key) as CacheEntry<T> | undefined;

	ensureCleanup();

	if (entry) {
		const age = now - entry.createdAt;
		if (age < ttl) {
			// Fresh — return immediately
			return entry.data;
		}
		if (age < staleTtl) {
			// Stale — return stale data, revalidate in background
			revalidate(key, fetcher, ttl, staleTtl);
			return entry.data;
		}
	}

	// No data or expired — fetch fresh
	const data = await fetcher();
	store.set(key, { data, createdAt: Date.now(), ttl, staleTtl });
	return data;
}

async function revalidate<T>(
	key: string,
	fetcher: () => Promise<T>,
	ttl: number,
	staleTtl: number
) {
	try {
		const data = await fetcher();
		store.set(key, { data, createdAt: Date.now(), ttl, staleTtl });
	} catch {
		// Keep stale data on revalidation failure
	}
}

export function invalidate(key: string) {
	store.delete(key);
}

export function invalidatePrefix(prefix: string) {
	for (const key of store.keys()) {
		if (key.startsWith(prefix)) {
			store.delete(key);
		}
	}
}

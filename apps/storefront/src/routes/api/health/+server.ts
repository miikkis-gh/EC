import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pool } from '$server/db';
import { getRedisClient } from '$server/redis';
import { meiliClient } from '$server/search';
import { createLogger } from '$server/logger';

const logger = createLogger('health');

interface CheckResult {
	status: 'up' | 'down';
	latency_ms: number;
	error?: string;
}

async function checkDatabase(): Promise<CheckResult> {
	const start = performance.now();
	try {
		await pool.query('SELECT 1');
		return { status: 'up', latency_ms: Math.round(performance.now() - start) };
	} catch (err) {
		return {
			status: 'down',
			latency_ms: Math.round(performance.now() - start),
			error: err instanceof Error ? err.message : 'Unknown error'
		};
	}
}

async function checkRedis(): Promise<CheckResult> {
	const start = performance.now();
	try {
		const redis = getRedisClient();
		if (!redis) {
			return { status: 'down', latency_ms: 0, error: 'Redis not configured' };
		}
		await redis.ping();
		return { status: 'up', latency_ms: Math.round(performance.now() - start) };
	} catch (err) {
		return {
			status: 'down',
			latency_ms: Math.round(performance.now() - start),
			error: err instanceof Error ? err.message : 'Unknown error'
		};
	}
}

async function checkMeiliSearch(): Promise<CheckResult> {
	const start = performance.now();
	try {
		await meiliClient.health();
		return { status: 'up', latency_ms: Math.round(performance.now() - start) };
	} catch (err) {
		return {
			status: 'down',
			latency_ms: Math.round(performance.now() - start),
			error: err instanceof Error ? err.message : 'Unknown error'
		};
	}
}

export const GET: RequestHandler = async ({ url }) => {
	const verbose = url.searchParams.get('verbose') === 'true';

	const [database, redis, meilisearch] = await Promise.all([
		checkDatabase(),
		checkRedis(),
		checkMeiliSearch()
	]);

	const checks = { database, redis, meilisearch };
	const allDown = database.status === 'down' && redis.status === 'down' && meilisearch.status === 'down';
	const anyDown = database.status === 'down' || redis.status === 'down' || meilisearch.status === 'down';

	// Database down = unhealthy (critical dependency)
	// Other services down = degraded
	const status = database.status === 'down' ? 'unhealthy' : anyDown ? 'degraded' : 'healthy';
	const httpStatus = status === 'unhealthy' ? 503 : 200;

	if (anyDown) {
		logger.warn('Health check degraded', {
			status,
			database: database.status,
			redis: redis.status,
			meilisearch: meilisearch.status
		});
	}

	const body: Record<string, unknown> = {
		status,
		timestamp: new Date().toISOString()
	};

	if (verbose) {
		body.checks = Object.fromEntries(
			Object.entries(checks).map(([name, result]) => {
				const entry: Record<string, unknown> = {
					status: result.status,
					latency_ms: result.latency_ms
				};
				if (result.error) entry.error = result.error;
				return [name, entry];
			})
		);
	}

	return json(body, { status: httpStatus });
};

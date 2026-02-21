import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { invalidateCache } from '$server/cache';
import { createLogger } from '$server/logger';

const logger = createLogger('cache-invalidate');

export const POST: RequestHandler = async ({ request }) => {
	const secret = process.env.CACHE_SECRET;
	if (!secret) {
		return json({ error: 'Cache invalidation not configured' }, { status: 503 });
	}

	const auth = request.headers.get('authorization');
	if (auth !== `Bearer ${secret}`) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	let body: { patterns?: unknown };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}

	if (!Array.isArray(body.patterns) || !body.patterns.every((p) => typeof p === 'string')) {
		return json({ error: 'patterns must be a string array' }, { status: 400 });
	}

	const patterns = body.patterns as string[];

	try {
		for (const pattern of patterns) {
			await invalidateCache(pattern);
		}
		logger.info('Cache invalidated', { patterns });
		return json({ invalidated: patterns });
	} catch (err) {
		logger.error('Cache invalidation failed', err);
		return json({ error: 'Invalidation failed' }, { status: 500 });
	}
};

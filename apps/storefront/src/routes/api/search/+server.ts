import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchProducts } from '$server/search';
import { createLogger } from '$server/logger';

const logger = createLogger('api:search');

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q') || '';
	const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 50);

	if (!query.trim()) {
		return json({ hits: [], query: '', processingTimeMs: 0, estimatedTotalHits: 0 });
	}

	try {
		const results = await searchProducts(query, { limit });
		return json(results);
	} catch (error) {
		logger.error('Search failed', error, { query, limit });
		return json({ hits: [], query, processingTimeMs: 0, estimatedTotalHits: 0 });
	}
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { searchProducts } from '$server/search';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q') || '';
	const limit = parseInt(url.searchParams.get('limit') || '10', 10);

	if (!query.trim()) {
		return json({ hits: [], query: '', processingTimeMs: 0, estimatedTotalHits: 0 });
	}

	const results = await searchProducts(query, { limit });
	return json(results);
};

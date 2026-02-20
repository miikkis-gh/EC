import { MeiliSearch } from 'meilisearch';
import { env } from '$env/dynamic/private';

export const meiliClient = new MeiliSearch({
	host: env.MEILISEARCH_HOST || 'http://localhost:7700',
	apiKey: env.MEILISEARCH_API_KEY || ''
});

const PRODUCTS_INDEX = 'products';

export interface SearchHit {
	id: string;
	title: string;
	handle: string;
	description: string;
	thumbnail: string | null;
	collection_title: string | null;
	variant_titles: string[];
}

export interface SearchResult {
	hits: SearchHit[];
	query: string;
	processingTimeMs: number;
	estimatedTotalHits: number;
}

export async function searchProducts(
	query: string,
	options?: { limit?: number }
): Promise<SearchResult> {
	try {
		const results = await meiliClient.index(PRODUCTS_INDEX).search<SearchHit>(query, {
			limit: options?.limit || 10,
			attributesToRetrieve: [
				'id',
				'title',
				'handle',
				'description',
				'thumbnail',
				'collection_title',
				'variant_titles'
			]
		});

		return {
			hits: results.hits,
			query: results.query,
			processingTimeMs: results.processingTimeMs,
			estimatedTotalHits: results.estimatedTotalHits || 0
		};
	} catch (error) {
		console.error('[search] Meilisearch query failed:', error);
		return {
			hits: [],
			query,
			processingTimeMs: 0,
			estimatedTotalHits: 0
		};
	}
}

import type { PageServerLoad } from './$types';
import { getProducts, getCollections } from '$server/medusa';

const sortMap: Record<string, string> = {
	newest: '-created_at',
	price_asc: 'variants.prices.amount',
	price_desc: '-variants.prices.amount',
	title_asc: 'title'
};

export const load: PageServerLoad = async ({ url }) => {
	const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
	const sort = url.searchParams.get('sort') || 'newest';
	const collectionIds = url.searchParams.getAll('collection_id');
	const limit = 12;
	const offset = (page - 1) * limit;

	try {
		const [productsData, collectionsData] = await Promise.all([
			getProducts({
				limit,
				offset,
				order: sortMap[sort] || '-created_at',
				...(collectionIds.length > 0 ? { collection_id: collectionIds } : {})
			}),
			getCollections({ limit: 50 })
		]);

		return {
			products: productsData.products,
			collections: collectionsData.collections,
			count: productsData.count,
			page,
			pageCount: Math.ceil(productsData.count / limit),
			loadError: false
		};
	} catch {
		return {
			products: [],
			collections: [],
			count: 0,
			page: 1,
			pageCount: 0,
			loadError: true
		};
	}
};

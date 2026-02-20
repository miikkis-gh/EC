import type { PageServerLoad } from './$types';
import { getProducts, getCollections, getProductCategories } from '$server/medusa';

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
	const categoryIds = url.searchParams.getAll('category_id');
	const q = url.searchParams.get('q') || '';
	const limit = 12;
	const offset = (page - 1) * limit;

	try {
		const [productsData, collectionsData, categoriesData] = await Promise.all([
			getProducts({
				limit,
				offset,
				order: sortMap[sort] || '-created_at',
				...(collectionIds.length > 0 ? { collection_id: collectionIds } : {}),
				...(categoryIds.length > 0 ? { category_id: categoryIds } : {}),
				...(q ? { q } : {})
			}),
			getCollections({ limit: 50 }),
			getProductCategories({ limit: 50 })
		]);

		return {
			products: productsData.products,
			collections: collectionsData.collections,
			categories: categoriesData.product_categories,
			count: productsData.count,
			page,
			pageCount: Math.ceil(productsData.count / limit),
			loadError: false
		};
	} catch {
		return {
			products: [],
			collections: [],
			categories: [],
			count: 0,
			page: 1,
			pageCount: 0,
			loadError: true
		};
	}
};

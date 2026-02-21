import type { PageServerLoad } from './$types';
import { getProducts, getCollections, getProductCategories } from '$server/medusa';
import type { Product } from '$server/medusa';

const sortMap: Record<string, string> = {
	newest: '-created_at',
	price_asc: 'variants.prices.amount',
	price_desc: '-variants.prices.amount',
	title_asc: 'title'
};

function getVariantPrice(product: Product): number | null {
	const variant = product.variants?.[0];
	if (!variant) return null;
	return variant.calculated_price?.calculated_amount ?? variant.prices?.[0]?.amount ?? null;
}

export const load: PageServerLoad = async ({ url }) => {
	const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
	const sort = url.searchParams.get('sort') || 'newest';
	const collectionIds = url.searchParams.getAll('collection_id');
	const categoryIds = url.searchParams.getAll('category_id');
	const q = url.searchParams.get('q') || '';
	const priceMin = url.searchParams.get('price_min');
	const priceMax = url.searchParams.get('price_max');
	const limit = 12;
	const offset = (page - 1) * limit;

	const hasPriceFilter = priceMin || priceMax;
	const priceMinCents = priceMin ? Math.round(Number(priceMin) * 100) : null;
	const priceMaxCents = priceMax ? Math.round(Number(priceMax) * 100) : null;

	try {
		const [productsData, collectionsData, categoriesData] = await Promise.all([
			getProducts({
				limit: hasPriceFilter ? 200 : limit,
				offset: hasPriceFilter ? 0 : offset,
				order: sortMap[sort] || '-created_at',
				...(collectionIds.length > 0 ? { collection_id: collectionIds } : {}),
				...(categoryIds.length > 0 ? { category_id: categoryIds } : {}),
				...(q ? { q } : {})
			}),
			getCollections({ limit: 50 }),
			getProductCategories({ limit: 50 })
		]);

		let products = productsData.products;
		let count = productsData.count;

		if (hasPriceFilter) {
			products = products.filter((p) => {
				const price = getVariantPrice(p);
				if (price === null) return false;
				if (priceMinCents !== null && price < priceMinCents) return false;
				if (priceMaxCents !== null && price > priceMaxCents) return false;
				return true;
			});
			count = products.length;
			products = products.slice(offset, offset + limit);
		}

		return {
			products,
			collections: collectionsData.collections,
			categories: categoriesData.product_categories,
			count,
			page,
			pageCount: Math.ceil(count / limit),
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

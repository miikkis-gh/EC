import type { PageServerLoad } from './$types';
import { getCollectionByHandle, getProducts, getProductCategories } from '$server/medusa';
import { error } from '@sveltejs/kit';
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

export const load: PageServerLoad = async ({ params, url }) => {
	try {
		const collectionData = await getCollectionByHandle(params.handle);
		const collection = collectionData.collections[0];

		if (!collection) {
			throw error(404, 'Collection not found');
		}

		const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
		const sort = url.searchParams.get('sort') || 'newest';
		const categoryIds = url.searchParams.getAll('category_id');
		const q = url.searchParams.get('q') || '';
		const priceMin = url.searchParams.get('price_min');
		const priceMax = url.searchParams.get('price_max');
		const limit = 12;
		const offset = (page - 1) * limit;

		const hasPriceFilter = priceMin || priceMax;
		const priceMinCents = priceMin ? Math.round(Number(priceMin) * 100) : null;
		const priceMaxCents = priceMax ? Math.round(Number(priceMax) * 100) : null;

		const [productsData, categoriesData] = await Promise.all([
			getProducts({
				collection_id: [collection.id],
				limit: hasPriceFilter ? 200 : limit,
				offset: hasPriceFilter ? 0 : offset,
				order: sortMap[sort] || '-created_at',
				...(categoryIds.length > 0 ? { category_id: categoryIds } : {}),
				...(q ? { q } : {})
			}),
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
			collection,
			products,
			categories: categoriesData.product_categories,
			count,
			page,
			pageCount: Math.ceil(count / limit)
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Collection not found');
	}
};

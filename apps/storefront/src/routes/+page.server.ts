import type { PageServerLoad } from './$types';
import { getProducts, getCollections } from '$server/medusa';

export const load: PageServerLoad = async () => {
	try {
		const [productsData, collectionsData] = await Promise.all([
			getProducts({ limit: 8, order: '-created_at' }),
			getCollections({ limit: 6 })
		]);

		return {
			products: productsData.products,
			collections: collectionsData.collections
		};
	} catch {
		return {
			products: [],
			collections: []
		};
	}
};

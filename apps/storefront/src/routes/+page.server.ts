import type { PageServerLoad } from './$types';
import { getProducts, getCollections } from '$server/medusa';

export const load: PageServerLoad = async () => {
	const productsData = await getProducts({ limit: 8, order: '-created_at' }).catch(() => ({
		products: []
	}));

	// Stream collections — below-fold content that doesn't block initial render
	const collections = getCollections({ limit: 6 })
		.then((d) => d.collections)
		.catch(() => []);

	return {
		products: productsData.products,
		collections
	};
};

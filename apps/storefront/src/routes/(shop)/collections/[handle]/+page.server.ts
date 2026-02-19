import type { PageServerLoad } from './$types';
import { getCollectionByHandle, getProducts } from '$server/medusa';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, url }) => {
	try {
		const collectionData = await getCollectionByHandle(params.handle);
		const collection = collectionData.collections[0];

		if (!collection) {
			throw error(404, 'Collection not found');
		}

		const page = Number(url.searchParams.get('page')) || 1;
		const limit = 12;
		const offset = (page - 1) * limit;

		const productsData = await getProducts({
			collection_id: [collection.id],
			limit,
			offset,
			order: '-created_at'
		});

		return {
			collection,
			products: productsData.products,
			count: productsData.count,
			page,
			pageCount: Math.ceil(productsData.count / limit)
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Collection not found');
	}
};

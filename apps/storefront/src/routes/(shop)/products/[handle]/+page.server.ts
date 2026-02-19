import type { PageServerLoad } from './$types';
import { getProductByHandle } from '$server/medusa';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const data = await getProductByHandle(params.handle);
		const product = data.products[0];

		if (!product) {
			throw error(404, 'Product not found');
		}

		return { product };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Product not found');
	}
};

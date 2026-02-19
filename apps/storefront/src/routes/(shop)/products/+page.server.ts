import type { PageServerLoad } from './$types';
import { getProducts } from '$server/medusa';

export const load: PageServerLoad = async ({ url }) => {
	const page = Number(url.searchParams.get('page')) || 1;
	const limit = 12;
	const offset = (page - 1) * limit;

	try {
		const data = await getProducts({ limit, offset, order: '-created_at' });
		return {
			products: data.products,
			count: data.count,
			page,
			pageCount: Math.ceil(data.count / limit)
		};
	} catch {
		return {
			products: [],
			count: 0,
			page: 1,
			pageCount: 0
		};
	}
};

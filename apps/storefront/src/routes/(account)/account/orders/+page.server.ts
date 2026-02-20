import type { PageServerLoad } from './$types';
import { getCustomerOrders } from '$server/medusa';

const PER_PAGE = 10;

export const load: PageServerLoad = async ({ url, locals }) => {
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const offset = (page - 1) * PER_PAGE;

	let orders: Awaited<ReturnType<typeof getCustomerOrders>>['orders'] = [];
	let count = 0;

	if (locals.session?.medusaToken) {
		try {
			const result = await getCustomerOrders(locals.session.medusaToken, {
				limit: PER_PAGE,
				offset
			});
			orders = result.orders;
			count = result.count;
		} catch {
			// Orders may fail if token expired
		}
	}

	return {
		orders,
		count,
		page,
		perPage: PER_PAGE
	};
};

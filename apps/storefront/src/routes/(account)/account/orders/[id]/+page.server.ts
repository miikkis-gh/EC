import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getOrder } from '$server/medusa';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.session?.medusaToken) {
		error(404, 'Order not found');
	}

	try {
		const result = await getOrder(locals.session.medusaToken, params.id);
		return { order: result.order };
	} catch {
		error(404, 'Order not found');
	}
};

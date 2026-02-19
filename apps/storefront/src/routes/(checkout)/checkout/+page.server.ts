import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getCart } from '$server/medusa';

export const load: PageServerLoad = async ({ cookies }) => {
	const cartId = cookies.get('cart_id');

	if (!cartId) {
		redirect(302, '/cart');
	}

	try {
		const { cart } = await getCart(cartId);
		if (!cart.items || cart.items.length === 0) {
			redirect(302, '/cart');
		}
		return { cart };
	} catch {
		cookies.delete('cart_id', { path: '/' });
		redirect(302, '/cart');
	}
};

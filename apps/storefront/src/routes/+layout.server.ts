import type { LayoutServerLoad } from './$types';
import { getCart } from '$server/medusa';

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
	const cartId = cookies.get('cart_id');
	let cart = null;

	if (cartId) {
		try {
			const result = await getCart(cartId);
			cart = result.cart;
		} catch {
			cookies.delete('cart_id', { path: '/' });
		}
	}

	return {
		cart,
		user: locals.user
	};
};

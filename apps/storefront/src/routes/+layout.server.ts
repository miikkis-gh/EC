import type { LayoutServerLoad } from './$types';
import { getCart } from '$server/medusa';
import { env } from '$env/dynamic/public';

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
		user: locals.user,
		siteUrl: env.PUBLIC_STORE_URL || 'http://localhost:5173'
	};
};

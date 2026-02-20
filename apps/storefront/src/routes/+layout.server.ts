import type { LayoutServerLoad } from './$types';
import { getCart, createCart } from '$server/medusa';
import { env } from '$env/dynamic/public';

export const load: LayoutServerLoad = async ({ cookies, locals }) => {
	const cartId = cookies.get('cart_id');
	let cart = null;

	if (cartId) {
		try {
			const result = await getCart(cartId);
			cart = result.cart;
		} catch {
			// Cart is invalid or expired — recreate it
			cookies.delete('cart_id', { path: '/' });
			try {
				const result = await createCart();
				cart = result.cart;
				cookies.set('cart_id', cart.id, { path: '/', maxAge: 60 * 60 * 24 * 30 });
			} catch {
				// Backend unreachable — continue without a cart
			}
		}
	}

	return {
		cart,
		user: locals.user,
		siteUrl: env.PUBLIC_STORE_URL || 'http://localhost:5173'
	};
};

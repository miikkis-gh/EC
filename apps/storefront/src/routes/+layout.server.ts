import type { LayoutServerLoad } from './$types';
import { getCart, createCart, getCollections } from '$server/medusa';
import { getUserWishlistProductIds } from '$server/wishlist';
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
				cookies.set('cart_id', cart.id, {
					path: '/',
					httpOnly: true,
					sameSite: 'lax',
					secure: import.meta.env.PROD,
					maxAge: 60 * 60 * 24 * 30
				});
			} catch {
				// Backend unreachable — continue without a cart
			}
		}
	}

	let wishlistProductIds: string[] = [];
	if (locals.user) {
		try {
			wishlistProductIds = await getUserWishlistProductIds(locals.user.id);
		} catch {
			// Non-critical
		}
	}

	let collections: { id: string; title: string; handle: string }[] = [];
	try {
		const result = await getCollections({ limit: 50 });
		collections = result.collections;
	} catch {
		// Non-critical — nav falls back to flat link
	}

	return {
		cart,
		user: locals.user,
		siteUrl: env.PUBLIC_STORE_URL || 'http://localhost:5173',
		wishlistProductIds,
		collections
	};
};

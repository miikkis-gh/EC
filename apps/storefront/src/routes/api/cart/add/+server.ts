import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCart, addToCart, getCart } from '$server/medusa';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { variantId, quantity = 1 } = await request.json();

	if (!variantId) {
		return json({ error: 'variantId is required' }, { status: 400 });
	}

	let cartId = cookies.get('cart_id');

	// Create cart if none exists
	if (!cartId) {
		const { cart } = await createCart();
		cartId = cart.id;
		cookies.set('cart_id', cartId, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: false, // TODO: set to true in production
			maxAge: 60 * 60 * 24 * 30 // 30 days
		});
	}

	const { cart } = await addToCart(cartId, variantId, quantity);
	return json({ cart });
};

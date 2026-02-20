import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCart, addToCart, getCart } from '$server/medusa';
import { addToCartSchema } from '$utils/validation';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json();
	const result = addToCartSchema.safeParse(body);

	if (!result.success) {
		return json({ error: result.error.issues[0].message }, { status: 400 });
	}

	const { variantId, quantity } = result.data;
	let cartId = cookies.get('cart_id');

	try {
		// Create cart if none exists
		if (!cartId) {
			const { cart } = await createCart();
			cartId = cart.id;
			cookies.set('cart_id', cartId, {
				path: '/',
				httpOnly: true,
				sameSite: 'lax',
				secure: !import.meta.env.DEV,
				maxAge: 60 * 60 * 24 * 30 // 30 days
			});
		}

		const { cart } = await addToCart(cartId, variantId, quantity);
		return json({ cart });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to add item to cart';
		return json({ error: message }, { status: 500 });
	}
};

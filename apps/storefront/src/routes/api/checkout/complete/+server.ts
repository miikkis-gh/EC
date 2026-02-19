import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { completeCart } from '$server/medusa';

export const POST: RequestHandler = async ({ cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	const result = await completeCart(cartId);

	// Clear the cart cookie after successful order
	if (result.type === 'order') {
		cookies.delete('cart_id', { path: '/' });
	}

	return json(result);
};

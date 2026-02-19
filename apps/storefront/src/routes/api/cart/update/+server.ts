import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateLineItem } from '$server/medusa';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { lineItemId, quantity } = await request.json();
	const cartId = cookies.get('cart_id');

	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	if (!lineItemId || quantity == null) {
		return json({ error: 'lineItemId and quantity are required' }, { status: 400 });
	}

	const { cart } = await updateLineItem(cartId, lineItemId, quantity);
	return json({ cart });
};

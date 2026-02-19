import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { removeLineItem, getCart } from '$server/medusa';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const { lineItemId } = await request.json();
	const cartId = cookies.get('cart_id');

	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	if (!lineItemId) {
		return json({ error: 'lineItemId is required' }, { status: 400 });
	}

	await removeLineItem(cartId, lineItemId);
	const { cart } = await getCart(cartId);
	return json({ cart });
};

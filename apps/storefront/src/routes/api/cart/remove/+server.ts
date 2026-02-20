import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { removeLineItem, getCart } from '$server/medusa';

export const POST: RequestHandler = async ({ request, cookies }) => {
	let body: { lineItemId?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { lineItemId } = body;
	const cartId = cookies.get('cart_id');

	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	if (!lineItemId) {
		return json({ error: 'lineItemId is required' }, { status: 400 });
	}

	try {
		await removeLineItem(cartId, lineItemId);
		const { cart } = await getCart(cartId);
		return json({ cart });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to remove cart item';
		return json({ error: message }, { status: 500 });
	}
};

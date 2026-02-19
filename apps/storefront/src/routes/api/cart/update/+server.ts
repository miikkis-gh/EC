import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateLineItem } from '$server/medusa';
import { updateCartSchema } from '$utils/validation';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const cartId = cookies.get('cart_id');

	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	const body = await request.json();
	const result = updateCartSchema.safeParse(body);

	if (!result.success) {
		return json({ error: result.error.issues[0].message }, { status: 400 });
	}

	const { lineItemId, quantity } = result.data;
	const { cart } = await updateLineItem(cartId, lineItemId, quantity);
	return json({ cart });
};

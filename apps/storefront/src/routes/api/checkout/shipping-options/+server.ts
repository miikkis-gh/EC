import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getShippingOptions, addShippingMethod } from '$server/medusa';

export const GET: RequestHandler = async ({ cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	const { shipping_options } = await getShippingOptions(cartId);
	return json({ shipping_options });
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	const { option_id } = await request.json();
	if (!option_id) {
		return json({ error: 'option_id is required' }, { status: 400 });
	}

	const { cart } = await addShippingMethod(cartId, option_id);
	return json({ cart });
};

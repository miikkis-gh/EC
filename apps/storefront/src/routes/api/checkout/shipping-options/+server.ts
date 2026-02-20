import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getShippingOptions, addShippingMethod } from '$server/medusa';

export const GET: RequestHandler = async ({ cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	try {
		const { shipping_options } = await getShippingOptions(cartId);
		return json({ shipping_options });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load shipping options';
		return json({ error: message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	let body: { option_id?: string };
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const { option_id } = body;
	if (!option_id) {
		return json({ error: 'option_id is required' }, { status: 400 });
	}

	try {
		const { cart } = await addShippingMethod(cartId, option_id);
		return json({ cart });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to set shipping method';
		return json({ error: message }, { status: 500 });
	}
};

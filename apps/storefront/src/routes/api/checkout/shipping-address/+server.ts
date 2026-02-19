import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCart } from '$server/medusa';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	const { email, address } = await request.json();

	if (!email || !address) {
		return json({ error: 'Email and address are required' }, { status: 400 });
	}

	const { cart } = await updateCart(cartId, {
		email,
		shipping_address: address,
		billing_address: address
	});

	return json({ cart });
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCart } from '$server/medusa';
import { shippingAddressSchema } from '$utils/validation';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid request body' }, { status: 400 });
	}

	const result = shippingAddressSchema.safeParse(body);

	if (!result.success) {
		return json({ error: result.error.issues[0].message }, { status: 400 });
	}

	const { email, address } = result.data;

	try {
		const { cart } = await updateCart(cartId, {
			email,
			shipping_address: address,
			billing_address: address
		});

		return json({ cart });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to save shipping address';
		return json({ error: message }, { status: 500 });
	}
};

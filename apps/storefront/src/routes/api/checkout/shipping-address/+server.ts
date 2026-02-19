import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateCart } from '$server/medusa';
import { shippingAddressSchema } from '$utils/validation';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	const body = await request.json();
	const result = shippingAddressSchema.safeParse(body);

	if (!result.success) {
		return json({ error: result.error.issues[0].message }, { status: 400 });
	}

	const { email, address } = result.data;
	const { cart } = await updateCart(cartId, {
		email,
		shipping_address: address,
		billing_address: address
	});

	return json({ cart });
};

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addPromoCode, removePromoCode } from '$server/medusa';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	const body = await request.json();
	const code = typeof body.code === 'string' ? body.code.trim() : '';

	if (!code) {
		return json({ error: 'Promo code is required' }, { status: 400 });
	}

	try {
		const { cart } = await addPromoCode(cartId, code);
		return json({ cart });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to apply promo code';
		return json({ error: message }, { status: 400 });
	}
};

export const DELETE: RequestHandler = async ({ request, cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	const body = await request.json();
	const code = typeof body.code === 'string' ? body.code.trim() : '';

	if (!code) {
		return json({ error: 'Promo code is required' }, { status: 400 });
	}

	try {
		const { cart } = await removePromoCode(cartId, code);
		return json({ cart });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to remove promo code';
		return json({ error: message }, { status: 400 });
	}
};

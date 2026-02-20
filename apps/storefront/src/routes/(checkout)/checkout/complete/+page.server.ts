import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { completeCart } from '$server/medusa';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const paymentIntent = url.searchParams.get('payment_intent');
	const redirectStatus = url.searchParams.get('redirect_status');

	// Require both a payment_intent and a valid redirect_status from Stripe
	if (!paymentIntent || !redirectStatus) {
		redirect(302, '/cart');
	}

	// Only allow known Stripe redirect statuses
	const validStatuses = ['succeeded', 'processing', 'requires_payment_method'];
	if (!validStatuses.includes(redirectStatus)) {
		redirect(302, '/cart');
	}

	const cartId = cookies.get('cart_id');

	// No cart cookie means we can't verify this payment belongs to the current session
	if (!cartId) {
		// Cart was already completed in a prior visit — show success if Stripe says so
		return {
			order: null,
			status: redirectStatus
		};
	}

	try {
		const result = await completeCart(cartId);
		if (result.type === 'order') {
			cookies.delete('cart_id', { path: '/' });
			return {
				order: result.data as Record<string, unknown>,
				status: redirectStatus
			};
		}
	} catch {
		// Cart may already be completed
	}

	return {
		order: null,
		status: redirectStatus
	};
};

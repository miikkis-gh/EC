import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { completeCart } from '$server/medusa';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const paymentIntent = url.searchParams.get('payment_intent');
	const redirectStatus = url.searchParams.get('redirect_status');

	if (!paymentIntent) {
		redirect(302, '/cart');
	}

	const cartId = cookies.get('cart_id');

	if (cartId) {
		try {
			const result = await completeCart(cartId);
			if (result.type === 'order') {
				cookies.delete('cart_id', { path: '/' });
				return {
					order: result.data as Record<string, unknown>,
					status: redirectStatus ?? 'succeeded'
				};
			}
		} catch {
			// Cart may already be completed
		}
	}

	// If no cart (already completed), just show success based on redirect status
	return {
		order: null,
		status: redirectStatus ?? 'succeeded'
	};
};

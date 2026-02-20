import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initPaymentSessions, initiatePaymentSession } from '$server/medusa';
import { createLogger } from '$server/logger';

const logger = createLogger('checkout:payment');

export const POST: RequestHandler = async ({ cookies }) => {
	const cartId = cookies.get('cart_id');
	if (!cartId) {
		return json({ error: 'No cart found' }, { status: 400 });
	}

	try {
		// Create payment collection for the cart
		const { payment_collection } = await initPaymentSessions(cartId);

		// Initiate a Stripe payment session
		const { payment_session } = await initiatePaymentSession(
			payment_collection.id,
			'pp_stripe_stripe'
		);

		const clientSecret = payment_session.data?.client_secret as string | undefined;

		if (!clientSecret) {
			return json({ error: 'Failed to get payment client secret' }, { status: 500 });
		}

		return json({
			clientSecret,
			paymentSessionId: payment_session.id,
			paymentCollectionId: payment_collection.id
		});
	} catch (error) {
		logger.error('Payment initialization failed', error);
		return json(
			{ error: 'Unable to initialize payment. Please try again.' },
			{ status: 500 }
		);
	}
};

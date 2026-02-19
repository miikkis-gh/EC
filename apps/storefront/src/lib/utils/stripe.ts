import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { env } from '$env/dynamic/public';

let stripePromise: Promise<Stripe | null>;

export function getStripe() {
	if (!stripePromise) {
		stripePromise = loadStripe(env.PUBLIC_STRIPE_PUBLISHABLE_KEY || '');
	}
	return stripePromise;
}

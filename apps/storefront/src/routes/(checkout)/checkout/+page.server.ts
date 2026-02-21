import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getCart, getCustomerWithAddresses } from '$server/medusa';
import type { Address } from '$server/medusa';

export const load: PageServerLoad = async ({ cookies, locals }) => {
	const cartId = cookies.get('cart_id');

	if (!cartId) {
		redirect(302, '/cart');
	}

	// Block checkout for logged-in users who haven't verified their email
	if (locals.user && !locals.user.emailVerified) {
		redirect(302, '/account?verify=required');
	}

	try {
		const [cartResult, addresses] = await Promise.all([
			getCart(cartId),
			(async (): Promise<Address[]> => {
				if (!locals.session?.medusaToken) return [];
				try {
					const { customer } = await getCustomerWithAddresses(locals.session.medusaToken);
					return customer.addresses ?? [];
				} catch {
					return [];
				}
			})()
		]);

		if (!cartResult.cart.items || cartResult.cart.items.length === 0) {
			redirect(302, '/cart');
		}

		return {
			cart: cartResult.cart,
			addresses,
			isLoggedIn: !!locals.session?.medusaToken
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		cookies.delete('cart_id', { path: '/' });
		redirect(302, '/cart');
	}
};

import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getCustomerWithAddresses } from '$server/medusa';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	if (locals.user.onboardedAt) {
		redirect(302, '/account');
	}

	let customer = null;
	if (locals.session?.medusaToken) {
		try {
			const result = await getCustomerWithAddresses(locals.session.medusaToken);
			customer = result.customer;
		} catch {
			// Token may have expired
		}
	}

	return {
		user: locals.user,
		customer,
		isOnboarding: true
	};
};

import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getCustomer } from '$server/medusa';
import { getUserPasskeys } from '$server/webauthn';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	let customer = null;
	if (locals.session?.medusaToken) {
		try {
			const result = await getCustomer(locals.session.medusaToken);
			customer = result.customer;
		} catch {
			// Token may have expired
		}
	}

	const passkeys = await getUserPasskeys(locals.user.id);

	return {
		customer,
		passkeys: passkeys.map((pk) => ({
			id: pk.id,
			name: pk.name,
			createdAt: pk.createdAt.toISOString()
		}))
	};
};

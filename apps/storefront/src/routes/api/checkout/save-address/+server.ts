import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addCustomerAddress } from '$server/medusa';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.session?.medusaToken) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { address } = body;

		if (!address?.first_name || !address?.last_name || !address?.address_1 || !address?.city || !address?.country_code || !address?.postal_code) {
			return json({ error: 'Missing required address fields' }, { status: 400 });
		}

		await addCustomerAddress(locals.session.medusaToken, {
			first_name: address.first_name,
			last_name: address.last_name,
			address_1: address.address_1,
			city: address.city,
			country_code: address.country_code,
			postal_code: address.postal_code,
			...(address.phone ? { phone: address.phone } : {})
		});

		return json({ success: true });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Failed to save address';
		return json({ error: message }, { status: 500 });
	}
};

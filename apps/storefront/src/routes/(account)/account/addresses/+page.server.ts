import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { addressSchema } from '$utils/validation';
import {
	addCustomerAddress,
	updateCustomerAddress,
	deleteCustomerAddress
} from '$server/medusa';

export const actions: Actions = {
	add: async ({ request, locals }) => {
		if (!locals.session?.medusaToken) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const data = Object.fromEntries(formData);
		const result = addressSchema.safeParse(data);

		if (!result.success) {
			const firstError = result.error.errors[0];
			return fail(400, { error: firstError?.message ?? 'Invalid address' });
		}

		try {
			await addCustomerAddress(locals.session.medusaToken, result.data);
			return { success: true };
		} catch (err) {
			return fail(400, {
				error: err instanceof Error ? err.message : 'Failed to add address'
			});
		}
	},

	update: async ({ request, locals }) => {
		if (!locals.session?.medusaToken) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const addressId = formData.get('address_id') as string;
		if (!addressId) {
			return fail(400, { error: 'Address ID is required' });
		}

		formData.delete('address_id');
		const data = Object.fromEntries(formData);
		const result = addressSchema.safeParse(data);

		if (!result.success) {
			const firstError = result.error.errors[0];
			return fail(400, { error: firstError?.message ?? 'Invalid address' });
		}

		try {
			await updateCustomerAddress(locals.session.medusaToken, addressId, result.data);
			return { success: true };
		} catch (err) {
			return fail(400, {
				error: err instanceof Error ? err.message : 'Failed to update address'
			});
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.session?.medusaToken) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const addressId = formData.get('address_id') as string;
		if (!addressId) {
			return fail(400, { error: 'Address ID is required' });
		}

		try {
			await deleteCustomerAddress(locals.session.medusaToken, addressId);
			return { success: true };
		} catch (err) {
			return fail(400, {
				error: err instanceof Error ? err.message : 'Failed to delete address'
			});
		}
	}
};

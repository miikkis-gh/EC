import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { profileSchema, addressSchema } from '$utils/validation';
import { updateCustomer, addCustomerAddress } from '$server/medusa';
import { markUserOnboarded } from '$server/user';

export const load: PageServerLoad = async ({ parent }) => {
	const { customer } = await parent();

	// Determine which step to resume at based on existing Medusa data
	let resumeStep = 0;
	if (customer?.first_name) {
		resumeStep = 2; // Profile done, go to address
		if (customer.addresses?.length > 0) {
			resumeStep = 3; // Address done too, go to completion
		}
	}

	return {
		customerName: customer?.first_name ?? null,
		resumeStep
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.session?.medusaToken) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const data = {
			first_name: formData.get('first_name')?.toString().trim() || undefined,
			last_name: formData.get('last_name')?.toString().trim() || undefined,
			phone: formData.get('phone')?.toString().trim() || undefined
		};

		const result = profileSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				action: 'updateProfile' as const,
				error: result.error.errors[0]?.message ?? 'Invalid profile data'
			});
		}

		try {
			await updateCustomer(locals.session.medusaToken, result.data);
			return { action: 'updateProfile' as const, success: true };
		} catch (err) {
			return fail(400, {
				action: 'updateProfile' as const,
				error: err instanceof Error ? err.message : 'Failed to update profile'
			});
		}
	},

	addAddress: async ({ request, locals }) => {
		if (!locals.session?.medusaToken) {
			return fail(401, { error: 'Not authenticated' });
		}

		const formData = await request.formData();
		const data = Object.fromEntries(formData);
		const result = addressSchema.safeParse(data);

		if (!result.success) {
			return fail(400, {
				action: 'addAddress' as const,
				error: result.error.errors[0]?.message ?? 'Invalid address'
			});
		}

		try {
			await addCustomerAddress(locals.session.medusaToken, result.data);
			return { action: 'addAddress' as const, success: true };
		} catch (err) {
			return fail(400, {
				action: 'addAddress' as const,
				error: err instanceof Error ? err.message : 'Failed to add address'
			});
		}
	},

	completeOnboarding: async ({ locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Not authenticated' });
		}

		await markUserOnboarded(locals.user.id);
		redirect(302, '/account');
	}
};

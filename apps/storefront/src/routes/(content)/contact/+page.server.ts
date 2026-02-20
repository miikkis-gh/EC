import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { contactSchema } from '$utils/validation';

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const raw = {
			name: formData.get('name'),
			email: formData.get('email'),
			message: formData.get('message')
		};

		const result = contactSchema.safeParse(raw);
		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			return fail(400, { errors, values: raw as Record<string, string> });
		}

		// In production, send email or store in database
		// For now, just return success
		return { success: true };
	}
};

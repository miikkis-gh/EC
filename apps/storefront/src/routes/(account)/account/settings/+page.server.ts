import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { profileSchema, passwordSchema } from '$utils/validation';
import { updateCustomer } from '$server/medusa';
import { verifyPasswordHash, hashPassword } from '$server/password';
import { queryOne, execute } from '$server/db';

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.session?.medusaToken) {
			return fail(401, { profileError: 'Not authenticated' });
		}

		const formData = await request.formData();
		const data = Object.fromEntries(formData);
		const result = profileSchema.safeParse(data);

		if (!result.success) {
			const firstError = result.error.errors[0];
			return fail(400, { profileError: firstError?.message ?? 'Invalid input' });
		}

		try {
			await updateCustomer(locals.session.medusaToken, result.data);
			return { profileSuccess: true };
		} catch (err) {
			return fail(400, {
				profileError: err instanceof Error ? err.message : 'Failed to update profile'
			});
		}
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { passwordError: 'Not authenticated' });
		}

		const formData = await request.formData();
		const currentPassword = formData.get('current_password') as string;
		const newPassword = formData.get('new_password') as string;
		const confirmPassword = formData.get('confirm_password') as string;

		if (!currentPassword || !newPassword || !confirmPassword) {
			return fail(400, { passwordError: 'All password fields are required' });
		}

		// Validate new password
		const passwordResult = passwordSchema.safeParse(newPassword);
		if (!passwordResult.success) {
			return fail(400, {
				passwordError: passwordResult.error.errors[0]?.message ?? 'Invalid password'
			});
		}

		if (newPassword !== confirmPassword) {
			return fail(400, { passwordError: 'Passwords do not match' });
		}

		try {
			// Get current password hash
			const user = await queryOne<{ password_hash: string }>(
				'SELECT password_hash FROM auth_user WHERE id = $1',
				[locals.user.id]
			);

			if (!user?.password_hash) {
				return fail(400, { passwordError: 'Password change not available for this account' });
			}

			const valid = await verifyPasswordHash(user.password_hash, currentPassword);
			if (!valid) {
				return fail(400, { passwordError: 'Current password is incorrect' });
			}

			const newHash = await hashPassword(newPassword);
			await execute('UPDATE auth_user SET password_hash = $1 WHERE id = $2', [
				newHash,
				locals.user.id
			]);

			return { passwordSuccess: true };
		} catch {
			return fail(500, { passwordError: 'Failed to change password' });
		}
	}
};

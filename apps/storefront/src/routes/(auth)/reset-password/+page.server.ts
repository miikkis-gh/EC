import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { resetPasswordSchema } from '$utils/validation';
import { consumePasswordResetToken } from '$server/password-reset';
import { updateUserPasswordHash } from '$server/user';
import { hashPassword } from '$server/password';
import { invalidateUserSessions } from '$server/auth';

export const load: PageServerLoad = async ({ url, locals }) => {
	if (locals.user) {
		redirect(302, '/account');
	}

	const token = url.searchParams.get('token');
	if (!token) {
		return { tokenMissing: true };
	}

	return { token };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const raw = {
			token: formData.get('token')?.toString(),
			password: formData.get('password')?.toString(),
			confirmPassword: formData.get('confirmPassword')?.toString()
		};

		const parsed = resetPasswordSchema.safeParse(raw);
		if (!parsed.success) {
			const errors = parsed.error.flatten().fieldErrors;
			return fail(400, { errors });
		}

		const { token, password } = parsed.data;

		const userId = await consumePasswordResetToken(token);
		if (!userId) {
			return fail(400, { tokenInvalid: true });
		}

		const passwordHash = await hashPassword(password);
		await updateUserPasswordHash(userId, passwordHash);

		// Invalidate all existing sessions for security
		await invalidateUserSessions(userId);

		redirect(302, '/login?reset=success');
	}
};

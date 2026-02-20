import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { forgotPasswordSchema } from '$utils/validation';
import { getUserByEmail } from '$server/user';
import { createPasswordResetToken } from '$server/password-reset';
import { sendEmail } from '$server/email';
import { env } from '$env/dynamic/public';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/account');
	}
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const raw = {
			email: formData.get('email')?.toString().trim()
		};

		const parsed = forgotPasswordSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0].message, email: raw.email });
		}

		const { email } = parsed.data;

		// Anti-enumeration: always return success regardless of whether user exists
		const user = await getUserByEmail(email);
		if (user) {
			try {
				const token = await createPasswordResetToken(user.id);
				const resetUrl = `${env.PUBLIC_STORE_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

				await sendEmail({
					to: email,
					subject: 'Reset your password — EC1',
					html: `
						<h2>Password Reset</h2>
						<p>You requested a password reset for your EC1 account.</p>
						<p><a href="${resetUrl}">Click here to reset your password</a></p>
						<p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
					`
				});
			} catch {
				// Silently fail — don't reveal whether user exists
			}
		}

		return { success: true, email };
	}
};

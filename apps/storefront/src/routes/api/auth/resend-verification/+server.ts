import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createEmailVerificationToken } from '$server/email-verification';
import { sendEmail } from '$server/email';
import { env } from '$env/dynamic/public';
import { createLogger } from '$server/logger';

const logger = createLogger('resend-verification');

export const POST: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'You must be logged in.' }, { status: 401 });
	}

	if (locals.user.emailVerified) {
		return json({ error: 'Your email is already verified.' }, { status: 400 });
	}

	try {
		const token = await createEmailVerificationToken(locals.user.id);
		const verifyUrl = `${env.PUBLIC_STORE_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

		await sendEmail({
			to: locals.user.email,
			subject: 'Verify your email — EC1',
			html: `
				<h2>Email Verification</h2>
				<p>Please verify your email address to complete your account setup.</p>
				<p><a href="${verifyUrl}">Click here to verify your email</a></p>
				<p>This link expires in 24 hours.</p>
			`
		});

		return json({ success: true });
	} catch (err) {
		logger.error('Failed to send verification email', err, { userId: locals.user.id });
		return json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 });
	}
};

import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getUserByEmail } from '$server/user';
import { verifyPasswordHash } from '$server/password';
import { loginMedusa } from '$server/medusa';
import {
	generateSessionToken,
	createSession,
	setSessionTokenCookie
} from '$server/auth';
import { loginSchema } from '$utils/validation';
import { createLogger } from '$server/logger';

const logger = createLogger('login');

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/account');
	}
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const raw = {
			email: formData.get('email')?.toString().trim(),
			password: formData.get('password')?.toString()
		};

		const parsed = loginSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { error: parsed.error.issues[0].message, email: raw.email });
		}

		const { email, password } = parsed.data;

		const user = await getUserByEmail(email);
		if (!user) {
			logger.warn('Login failed: user not found', { email });
			return fail(400, { error: 'Invalid email or password', email });
		}

		const validPassword = await verifyPasswordHash(user.passwordHash, password);
		if (!validPassword) {
			logger.warn('Login failed: password mismatch', { email, userId: user.id });
			return fail(400, { error: 'Invalid email or password', email });
		}

		// Get Medusa JWT
		let medusaToken: string | undefined;
		try {
			const result = await loginMedusa(email, password);
			medusaToken = result.token;
		} catch {
			// Non-fatal: user can still log in without Medusa token
		}

		const token = generateSessionToken();
		const session = await createSession(token, user.id, medusaToken);
		setSessionTokenCookie(event, token, session.expiresAt);

		redirect(302, '/account');
	}
};

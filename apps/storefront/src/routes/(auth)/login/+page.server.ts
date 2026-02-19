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

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		redirect(302, '/account');
	}
};

export const actions: Actions = {
	default: async (event) => {
		const formData = await event.request.formData();
		const email = formData.get('email')?.toString().trim();
		const password = formData.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const user = await getUserByEmail(email);
		if (!user) {
			return fail(400, { error: 'Invalid email or password', email });
		}

		const validPassword = await verifyPasswordHash(user.passwordHash, password);
		if (!validPassword) {
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

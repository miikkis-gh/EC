import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getUserByEmail, createUser, updateUserMedusaCustomerId } from '$server/user';
import { hashPassword } from '$server/password';
import { registerMedusaAuth, createMedusaCustomer } from '$server/medusa';
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
		const firstName = formData.get('first_name')?.toString().trim() || '';
		const lastName = formData.get('last_name')?.toString().trim() || '';

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email, firstName, lastName });
		}

		if (password.length < 8) {
			return fail(400, {
				error: 'Password must be at least 8 characters',
				email,
				firstName,
				lastName
			});
		}

		const existingUser = await getUserByEmail(email);
		if (existingUser) {
			return fail(400, {
				error: 'An account with this email already exists',
				email,
				firstName,
				lastName
			});
		}

		// Register with Medusa auth
		let medusaToken: string | undefined;
		try {
			const authResult = await registerMedusaAuth(email, password);
			medusaToken = authResult.token;
		} catch {
			// Non-fatal: continue with local-only account
		}

		// Create Medusa customer profile
		let medusaCustomerId: string | undefined;
		if (medusaToken) {
			try {
				const { customer } = await createMedusaCustomer(medusaToken, {
					email,
					first_name: firstName || undefined,
					last_name: lastName || undefined
				});
				medusaCustomerId = customer.id;
			} catch {
				// Non-fatal
			}
		}

		// Create local user
		const passwordHash = await hashPassword(password);
		const user = await createUser(email, passwordHash, medusaCustomerId);

		// Update Medusa customer ID if we got it after user creation
		if (medusaCustomerId && !user.medusaCustomerId) {
			await updateUserMedusaCustomerId(user.id, medusaCustomerId);
		}

		const token = generateSessionToken();
		const session = await createSession(token, user.id, medusaToken);
		setSessionTokenCookie(event, token, session.expiresAt);

		redirect(302, '/account');
	}
};

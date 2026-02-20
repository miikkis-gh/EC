import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { getUserByEmail, createUser, updateUserMedusaCustomerId } from '$server/user';
import { hashPassword } from '$server/password';
import { registerMedusaAuth, createMedusaCustomer, loginMedusa } from '$server/medusa';
import {
	generateSessionToken,
	createSession,
	setSessionTokenCookie
} from '$server/auth';
import { registerSchema } from '$utils/validation';

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
			password: formData.get('password')?.toString(),
			first_name: formData.get('first_name')?.toString().trim() || undefined,
			last_name: formData.get('last_name')?.toString().trim() || undefined
		};

		const parsed = registerSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, {
				error: parsed.error.issues[0].message,
				email: raw.email,
				firstName: raw.first_name || '',
				lastName: raw.last_name || ''
			});
		}

		const { email, password } = parsed.data;
		const firstName = parsed.data.first_name || '';
		const lastName = parsed.data.last_name || '';

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
		} catch (error) {
			console.error('Medusa auth registration failed:', error);
			return fail(503, {
				error: 'Registration service is temporarily unavailable. Please try again shortly.',
				email,
				firstName,
				lastName
			});
		}

		// Create Medusa customer profile
		let medusaCustomerId: string | undefined;
		try {
			const { customer } = await createMedusaCustomer(medusaToken, {
				email,
				first_name: firstName || undefined,
				last_name: lastName || undefined
			});
			medusaCustomerId = customer.id;
		} catch (error) {
			// Non-fatal: auth succeeded so account works, customer profile can be created later
			console.error('Medusa customer profile creation failed:', error);
		}

		// Log in to get a proper session token (registration token is single-use)
		let sessionMedusaToken: string | undefined;
		try {
			const loginResult = await loginMedusa(email, password);
			sessionMedusaToken = loginResult.token;
		} catch {
			// Non-fatal: account still works, Medusa token can be obtained on next login
		}

		// Create local user
		const passwordHash = await hashPassword(password);
		const user = await createUser(email, passwordHash, medusaCustomerId);

		// Update Medusa customer ID if we got it after user creation
		if (medusaCustomerId && !user.medusaCustomerId) {
			await updateUserMedusaCustomerId(user.id, medusaCustomerId);
		}

		const token = generateSessionToken();
		const session = await createSession(token, user.id, sessionMedusaToken);
		setSessionTokenCookie(event, token, session.expiresAt);

		redirect(302, '/welcome');
	}
};

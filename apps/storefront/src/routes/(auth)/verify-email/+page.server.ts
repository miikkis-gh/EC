import type { PageServerLoad } from './$types';
import { consumeEmailVerificationToken } from '$server/email-verification';
import { markUserEmailVerified } from '$server/user';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');

	if (!token) {
		return { verified: false, error: 'No verification token provided.' };
	}

	const userId = await consumeEmailVerificationToken(token);

	if (!userId) {
		return { verified: false, error: 'This link is expired or invalid.' };
	}

	await markUserEmailVerified(userId);

	return { verified: true };
};

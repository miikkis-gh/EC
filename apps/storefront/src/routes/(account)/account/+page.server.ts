import type { PageServerLoad } from './$types';
import { getUserPasskeys } from '$server/webauthn';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const passkeys = await getUserPasskeys(user.id);

	return {
		passkeys: passkeys.map((pk) => ({
			id: pk.id,
			name: pk.name,
			createdAt: pk.createdAt.toISOString()
		}))
	};
};

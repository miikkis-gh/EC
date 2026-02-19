import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import {
	generatePasskeyRegistrationOptions,
	verifyPasskeyRegistration,
	createPasskey
} from '$server/webauthn';

export const GET: RequestHandler = async (event) => {
	if (!event.locals.user) {
		error(401, 'Authentication required');
	}

	const { options, challengeKey } = await generatePasskeyRegistrationOptions(
		event.locals.user.id,
		event.locals.user.email
	);

	return json({ options, challengeKey });
};

export const POST: RequestHandler = async (event) => {
	if (!event.locals.user) {
		error(401, 'Authentication required');
	}

	const body = await event.request.json();
	const { challengeKey, credential, name } = body;

	if (!challengeKey || !credential) {
		error(400, 'Missing required fields');
	}

	const result = await verifyPasskeyRegistration(challengeKey, credential);

	if (!result.verified || !result.credentialId || !result.publicKey) {
		error(400, 'Passkey verification failed');
	}

	await createPasskey(
		result.credentialId,
		event.locals.user.id,
		result.publicKey,
		result.counter ?? 0,
		result.transports ?? [],
		name || 'Passkey'
	);

	return json({ success: true });
};

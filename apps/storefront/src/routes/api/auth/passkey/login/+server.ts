import type { RequestHandler } from './$types';
import { json, error } from '@sveltejs/kit';
import {
	generatePasskeyAuthenticationOptions,
	verifyPasskeyAuthentication,
	getPasskeyById
} from '$server/webauthn';
import {
	generateSessionToken,
	createSession,
	setSessionTokenCookie
} from '$server/auth';

export const GET: RequestHandler = async () => {
	const { options, challengeKey } = await generatePasskeyAuthenticationOptions();
	return json({ options, challengeKey });
};

export const POST: RequestHandler = async (event) => {
	const body = await event.request.json();
	const { challengeKey, credential } = body;

	if (!challengeKey || !credential) {
		error(400, 'Missing required fields');
	}

	const result = await verifyPasskeyAuthentication(challengeKey, credential);

	if (!result.verified || !result.credentialId) {
		error(400, 'Passkey authentication failed');
	}

	const passkey = await getPasskeyById(result.credentialId);
	if (!passkey) {
		error(400, 'Passkey not found');
	}

	// Create session without Medusa token (passkey login)
	const token = generateSessionToken();
	const session = await createSession(token, passkey.userId);
	setSessionTokenCookie(event, token, session.expiresAt);

	return json({ success: true });
};

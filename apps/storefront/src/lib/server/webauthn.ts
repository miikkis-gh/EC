import {
	generateRegistrationOptions,
	verifyRegistrationResponse,
	generateAuthenticationOptions,
	verifyAuthenticationResponse
} from '@simplewebauthn/server';
import type {
	RegistrationResponseJSON,
	AuthenticationResponseJSON,
	AuthenticatorTransportFuture
} from '@simplewebauthn/server';
import { env } from '$env/dynamic/private';
import { queryOne, queryMany, execute } from './db.js';

// WebAuthn RP config
function getRpId(): string {
	return env.WEBAUTHN_RP_ID || 'localhost';
}

function getRpName(): string {
	return env.WEBAUTHN_RP_NAME || 'EC1';
}

function getOrigin(): string {
	return env.WEBAUTHN_ORIGIN || 'http://localhost:5173';
}

// In-memory challenge store with 5-min TTL
const challengeStore = new Map<string, { challenge: string; expiresAt: number }>();

function setChallenge(key: string, challenge: string): void {
	challengeStore.set(key, {
		challenge,
		expiresAt: Date.now() + 5 * 60 * 1000
	});
}

function getChallenge(key: string): string | null {
	const entry = challengeStore.get(key);
	if (!entry) return null;
	challengeStore.delete(key);
	if (Date.now() > entry.expiresAt) return null;
	return entry.challenge;
}

// Periodically clean up expired challenges
setInterval(() => {
	const now = Date.now();
	for (const [key, entry] of challengeStore) {
		if (now > entry.expiresAt) challengeStore.delete(key);
	}
}, 60 * 1000);

// --- Credential CRUD ---

export interface PasskeyCredential {
	id: string;
	userId: string;
	publicKey: Uint8Array;
	counter: number;
	transports: AuthenticatorTransportFuture[];
	name: string;
	createdAt: Date;
}

interface PasskeyRow {
	id: string;
	user_id: string;
	public_key: Buffer;
	counter: number;
	transports: string[] | null;
	name: string;
	created_at: Date;
}

function mapPasskeyRow(row: PasskeyRow): PasskeyCredential {
	return {
		id: row.id,
		userId: row.user_id,
		publicKey: new Uint8Array(row.public_key),
		counter: row.counter,
		transports: (row.transports ?? []) as AuthenticatorTransportFuture[],
		name: row.name,
		createdAt: row.created_at
	};
}

export async function getUserPasskeys(userId: string): Promise<PasskeyCredential[]> {
	const rows = await queryMany<PasskeyRow>(
		'SELECT * FROM passkey_credential WHERE user_id = $1 ORDER BY created_at DESC',
		[userId]
	);
	return rows.map(mapPasskeyRow);
}

export async function getPasskeyById(id: string): Promise<PasskeyCredential | null> {
	const row = await queryOne<PasskeyRow>(
		'SELECT * FROM passkey_credential WHERE id = $1',
		[id]
	);
	return row ? mapPasskeyRow(row) : null;
}

export async function createPasskey(
	id: string,
	userId: string,
	publicKey: Uint8Array,
	counter: number,
	transports: AuthenticatorTransportFuture[],
	name: string
): Promise<void> {
	await execute(
		`INSERT INTO passkey_credential (id, user_id, public_key, counter, transports, name)
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		[id, userId, Buffer.from(publicKey), counter, transports, name]
	);
}

export async function updatePasskeyCounter(id: string, counter: number): Promise<void> {
	await execute(
		'UPDATE passkey_credential SET counter = $1 WHERE id = $2',
		[counter, id]
	);
}

// --- Registration (for logged-in users) ---

export async function generatePasskeyRegistrationOptions(
	userId: string,
	userEmail: string
): Promise<{ options: Awaited<ReturnType<typeof generateRegistrationOptions>>; challengeKey: string }> {
	const existingPasskeys = await getUserPasskeys(userId);

	const options = await generateRegistrationOptions({
		rpName: getRpName(),
		rpID: getRpId(),
		userName: userEmail,
		attestationType: 'none',
		excludeCredentials: existingPasskeys.map((pk) => ({
			id: pk.id,
			transports: pk.transports
		})),
		authenticatorSelection: {
			residentKey: 'preferred',
			userVerification: 'preferred'
		}
	});

	const challengeKey = crypto.randomUUID();
	setChallenge(challengeKey, options.challenge);

	return { options, challengeKey };
}

export async function verifyPasskeyRegistration(
	challengeKey: string,
	response: RegistrationResponseJSON
): Promise<{ verified: boolean; credentialId?: string; publicKey?: Uint8Array; counter?: number; transports?: AuthenticatorTransportFuture[] }> {
	const expectedChallenge = getChallenge(challengeKey);
	if (!expectedChallenge) {
		return { verified: false };
	}

	const verification = await verifyRegistrationResponse({
		response,
		expectedChallenge,
		expectedOrigin: getOrigin(),
		expectedRPID: getRpId()
	});

	if (!verification.verified || !verification.registrationInfo) {
		return { verified: false };
	}

	const { credential, credentialDeviceType: _cdt, credentialBackedUp: _cbu } = verification.registrationInfo;
	return {
		verified: true,
		credentialId: credential.id,
		publicKey: credential.publicKey,
		counter: credential.counter,
		transports: response.response.transports as AuthenticatorTransportFuture[] | undefined
	};
}

// --- Authentication (for login) ---

export async function generatePasskeyAuthenticationOptions(): Promise<{
	options: Awaited<ReturnType<typeof generateAuthenticationOptions>>;
	challengeKey: string;
}> {
	const options = await generateAuthenticationOptions({
		rpID: getRpId(),
		userVerification: 'preferred'
	});

	const challengeKey = crypto.randomUUID();
	setChallenge(challengeKey, options.challenge);

	return { options, challengeKey };
}

export async function verifyPasskeyAuthentication(
	challengeKey: string,
	response: AuthenticationResponseJSON
): Promise<{ verified: boolean; credentialId?: string }> {
	const expectedChallenge = getChallenge(challengeKey);
	if (!expectedChallenge) {
		return { verified: false };
	}

	const credential = await getPasskeyById(response.id);
	if (!credential) {
		return { verified: false };
	}

	const verification = await verifyAuthenticationResponse({
		response,
		expectedChallenge,
		expectedOrigin: getOrigin(),
		expectedRPID: getRpId(),
		credential: {
			id: credential.id,
			publicKey: new Uint8Array(credential.publicKey) as Uint8Array<ArrayBuffer>,
			counter: credential.counter,
			transports: credential.transports
		}
	});

	if (verification.verified) {
		await updatePasskeyCounter(credential.id, verification.authenticationInfo.newCounter);
	}

	return {
		verified: verification.verified,
		credentialId: credential.id
	};
}

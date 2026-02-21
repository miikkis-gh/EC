import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { queryOne, execute } from './db.js';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function generateToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

function hashToken(token: string): string {
	const encoded = new TextEncoder().encode(token);
	return encodeHexLowerCase(sha256(encoded));
}

export async function createEmailVerificationToken(userId: string): Promise<string> {
	// Remove any existing tokens for this user
	await execute('DELETE FROM email_verification_token WHERE user_id = $1', [userId]);

	const token = generateToken();
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

	await execute(
		'INSERT INTO email_verification_token (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
		[tokenHash, userId, expiresAt]
	);

	return token;
}

export async function consumeEmailVerificationToken(token: string): Promise<string | null> {
	const tokenHash = hashToken(token);

	const row = await queryOne<{ user_id: string; expires_at: Date }>(
		'DELETE FROM email_verification_token WHERE token_hash = $1 RETURNING user_id, expires_at',
		[tokenHash]
	);

	if (!row) return null;

	if (new Date(row.expires_at).getTime() < Date.now()) {
		return null;
	}

	return row.user_id;
}

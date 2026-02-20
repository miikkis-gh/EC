import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { queryOne, execute } from './db.js';

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generateResetToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

function hashToken(token: string): string {
	const encoded = new TextEncoder().encode(token);
	return encodeHexLowerCase(sha256(encoded));
}

export async function createPasswordResetToken(userId: string): Promise<string> {
	// Remove any existing tokens for this user
	await execute('DELETE FROM password_reset_token WHERE user_id = $1', [userId]);

	const token = generateResetToken();
	const tokenHash = hashToken(token);
	const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

	await execute(
		'INSERT INTO password_reset_token (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
		[tokenHash, userId, expiresAt]
	);

	return token;
}

export async function consumePasswordResetToken(token: string): Promise<string | null> {
	const tokenHash = hashToken(token);

	const row = await queryOne<{ user_id: string; expires_at: Date }>(
		'DELETE FROM password_reset_token WHERE token_hash = $1 RETURNING user_id, expires_at',
		[tokenHash]
	);

	if (!row) return null;

	if (new Date(row.expires_at).getTime() < Date.now()) {
		return null;
	}

	return row.user_id;
}

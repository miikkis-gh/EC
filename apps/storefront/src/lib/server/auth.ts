import { sha256 } from '@oslojs/crypto/sha2';
import { encodeBase32LowerCaseNoPadding, encodeHexLowerCase } from '@oslojs/encoding';
import { queryOne, execute } from './db.js';
import type { RequestEvent } from '@sveltejs/kit';

export interface AuthUser {
	id: string;
	email: string;
	medusaCustomerId: string | null;
	onboardedAt: Date | null;
}

export interface Session {
	id: string;
	userId: string;
	medusaToken: string | null;
	expiresAt: Date;
}

export type SessionValidationResult =
	| { session: Session; user: AuthUser }
	| { session: null; user: null };

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const REFRESH_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000; // 15 days

export function generateSessionToken(): string {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	return encodeBase32LowerCaseNoPadding(bytes);
}

function hashToken(token: string): string {
	const encoded = new TextEncoder().encode(token);
	return encodeHexLowerCase(sha256(encoded));
}

export async function createSession(
	token: string,
	userId: string,
	medusaToken?: string
): Promise<Session> {
	const id = hashToken(token);
	const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

	await execute(
		'INSERT INTO user_session (id, user_id, medusa_token, expires_at) VALUES ($1, $2, $3, $4)',
		[id, userId, medusaToken ?? null, expiresAt]
	);

	return { id, userId, medusaToken: medusaToken ?? null, expiresAt };
}

export async function validateSessionToken(token: string): Promise<SessionValidationResult> {
	const id = hashToken(token);

	const row = await queryOne<{
		id: string;
		user_id: string;
		medusa_token: string | null;
		expires_at: Date;
		email: string;
		medusa_customer_id: string | null;
		onboarded_at: Date | null;
	}>(
		`SELECT s.id, s.user_id, s.medusa_token, s.expires_at,
				u.email, u.medusa_customer_id, u.onboarded_at
		 FROM user_session s
		 JOIN auth_user u ON s.user_id = u.id
		 WHERE s.id = $1`,
		[id]
	);

	if (!row) {
		return { session: null, user: null };
	}

	const expiresAt = new Date(row.expires_at);

	if (Date.now() >= expiresAt.getTime()) {
		await execute('DELETE FROM user_session WHERE id = $1', [id]);
		return { session: null, user: null };
	}

	// Sliding window: refresh if past halfway
	if (Date.now() >= expiresAt.getTime() - REFRESH_THRESHOLD_MS) {
		const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
		await execute('UPDATE user_session SET expires_at = $1 WHERE id = $2', [newExpiresAt, id]);
		row.expires_at = newExpiresAt;
	}

	const session: Session = {
		id: row.id,
		userId: row.user_id,
		medusaToken: row.medusa_token,
		expiresAt: new Date(row.expires_at)
	};

	const user: AuthUser = {
		id: row.user_id,
		email: row.email,
		medusaCustomerId: row.medusa_customer_id,
		onboardedAt: row.onboarded_at ? new Date(row.onboarded_at) : null
	};

	return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
	await execute('DELETE FROM user_session WHERE id = $1', [sessionId]);
}

export async function invalidateUserSessions(userId: string): Promise<void> {
	await execute('DELETE FROM user_session WHERE user_id = $1', [userId]);
}

export function setSessionTokenCookie(event: RequestEvent, token: string, expiresAt: Date): void {
	event.cookies.set('session', token, {
		httpOnly: true,
		sameSite: 'lax',
		expires: expiresAt,
		path: '/',
		secure: !import.meta.env.DEV
	});
}

export function deleteSessionTokenCookie(event: RequestEvent): void {
	event.cookies.set('session', '', {
		httpOnly: true,
		sameSite: 'lax',
		maxAge: 0,
		path: '/',
		secure: !import.meta.env.DEV
	});
}

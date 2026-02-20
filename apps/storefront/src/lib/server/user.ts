import { queryOne, execute } from './db.js';

interface UserRow {
	id: string;
	email: string;
	password_hash: string;
	medusa_customer_id: string | null;
	created_at: Date;
	updated_at: Date;
}

export interface LocalUser {
	id: string;
	email: string;
	passwordHash: string;
	medusaCustomerId: string | null;
}

function mapRow(row: UserRow): LocalUser {
	return {
		id: row.id,
		email: row.email,
		passwordHash: row.password_hash,
		medusaCustomerId: row.medusa_customer_id
	};
}

export async function createUser(
	email: string,
	passwordHash: string,
	medusaCustomerId?: string
): Promise<LocalUser> {
	const id = crypto.randomUUID();
	const row = await queryOne<UserRow>(
		`INSERT INTO auth_user (id, email, password_hash, medusa_customer_id)
		 VALUES ($1, $2, $3, $4)
		 RETURNING *`,
		[id, email.toLowerCase(), passwordHash, medusaCustomerId ?? null]
	);
	return mapRow(row!);
}

export async function getUserByEmail(email: string): Promise<LocalUser | null> {
	const row = await queryOne<UserRow>(
		'SELECT * FROM auth_user WHERE email = $1',
		[email.toLowerCase()]
	);
	return row ? mapRow(row) : null;
}

export async function getUserById(id: string): Promise<LocalUser | null> {
	const row = await queryOne<UserRow>(
		'SELECT * FROM auth_user WHERE id = $1',
		[id]
	);
	return row ? mapRow(row) : null;
}

export async function updateUserPasswordHash(
	userId: string,
	passwordHash: string
): Promise<void> {
	await execute(
		'UPDATE auth_user SET password_hash = $1, updated_at = NOW() WHERE id = $2',
		[passwordHash, userId]
	);
}

export async function updateUserMedusaCustomerId(
	userId: string,
	medusaCustomerId: string
): Promise<void> {
	await execute(
		'UPDATE auth_user SET medusa_customer_id = $1, updated_at = NOW() WHERE id = $2',
		[medusaCustomerId, userId]
	);
}

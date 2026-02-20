import pg from 'pg';
import { env } from '$env/dynamic/private';

const pool = new pg.Pool({
	connectionString: env.DATABASE_URL,
	max: 10,
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 5_000
});

export async function queryOne<T>(text: string, values?: unknown[]): Promise<T | null> {
	const result = await pool.query(text, values);
	return (result.rows[0] as T) ?? null;
}

export async function queryMany<T>(text: string, values?: unknown[]): Promise<T[]> {
	const result = await pool.query(text, values);
	return result.rows as T[];
}

export async function execute(text: string, values?: unknown[]): Promise<void> {
	await pool.query(text, values);
}

export { pool };

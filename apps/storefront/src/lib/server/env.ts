import { env } from '$env/dynamic/private';
import { building } from '$app/environment';

/**
 * Validates that required environment variables are set.
 * Called once at module load time — crashes the server immediately
 * if any required variable is missing.
 */

const required = [
	'DATABASE_URL',
	'MEDUSA_BACKEND_URL',
	'MEDUSA_PUBLISHABLE_KEY'
] as const;

if (!building) {
	const missing = required.filter((name) => !env[name]);
	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(', ')}`
		);
	}
}

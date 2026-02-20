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

const optional = [
	'RESEND_API_KEY',
	'EMAIL_FROM',
	'CONTACT_EMAIL'
] as const;

if (!building) {
	const missing = required.filter((name) => !env[name]);
	if (missing.length > 0) {
		throw new Error(
			`Missing required environment variables: ${missing.join(', ')}`
		);
	}

	const missingOptional = optional.filter((name) => !env[name]);
	if (missingOptional.length > 0) {
		console.warn(
			`Optional environment variables not set: ${missingOptional.join(', ')}`
		);
	}
}

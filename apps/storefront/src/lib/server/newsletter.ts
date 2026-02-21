import { execute } from './db';
import crypto from 'node:crypto';

export async function subscribe(email: string): Promise<void> {
	const id = crypto.randomUUID();
	await execute(
		`INSERT INTO newsletter_subscriber (id, email)
		 VALUES ($1, $2)
		 ON CONFLICT (email) DO UPDATE SET unsubscribed_at = NULL`,
		[id, email.toLowerCase().trim()]
	);
}

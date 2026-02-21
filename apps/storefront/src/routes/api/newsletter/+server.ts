import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { subscribe } from '$server/newsletter';
import { newsletterSchema } from '$utils/validation';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const result = newsletterSchema.safeParse(body);

	if (!result.success) {
		return json({ error: result.error.issues[0].message }, { status: 400 });
	}

	try {
		await subscribe(result.data.email);
		return json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to subscribe';
		return json({ error: message }, { status: 500 });
	}
};

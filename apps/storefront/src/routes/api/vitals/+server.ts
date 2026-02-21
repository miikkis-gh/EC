import type { RequestHandler } from './$types';
import { createLogger } from '$server/logger';

const logger = createLogger('vitals');

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		logger.info('Web Vitals', body);
	} catch {
		// Invalid payload — ignore
	}

	return new Response(null, { status: 204 });
};

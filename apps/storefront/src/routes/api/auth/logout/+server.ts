import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { invalidateSession, deleteSessionTokenCookie } from '$server/auth';
import { createLogger } from '$server/logger';

const logger = createLogger('auth:logout');

export const POST: RequestHandler = async (event) => {
	if (event.locals.session) {
		try {
			await invalidateSession(event.locals.session.id);
		} catch (error) {
			logger.error('Failed to invalidate session', error, {
				sessionId: event.locals.session.id
			});
		}
	}
	deleteSessionTokenCookie(event);
	redirect(302, '/login');
};

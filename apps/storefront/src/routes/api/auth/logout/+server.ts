import type { RequestHandler } from './$types';
import { redirect } from '@sveltejs/kit';
import { invalidateSession, deleteSessionTokenCookie } from '$server/auth';

export const POST: RequestHandler = async (event) => {
	if (event.locals.session) {
		await invalidateSession(event.locals.session.id);
	}
	deleteSessionTokenCookie(event);
	redirect(302, '/login');
};

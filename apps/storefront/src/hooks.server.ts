import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { validateSessionToken, setSessionTokenCookie } from '$server/auth';

const authHandle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get('session');

	if (token) {
		const result = await validateSessionToken(token);
		event.locals.user = result.user;
		event.locals.session = result.session;

		// Refresh cookie on sliding window renewal
		if (result.session) {
			setSessionTokenCookie(event, token, result.session.expiresAt);
		}
	} else {
		event.locals.user = null;
		event.locals.session = null;
	}

	return resolve(event);
};

const cartHandle: Handle = async ({ event, resolve }) => {
	event.locals.cartId = event.cookies.get('cart_id');
	return resolve(event);
};

const securityHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https://res.cloudinary.com https://*.cloudinary.com",
			"font-src 'self'",
			"connect-src 'self' http://localhost:9000 http://localhost:7700",
			"frame-ancestors 'none'"
		].join('; ')
	);

	return response;
};

export const handle = sequence(authHandle, cartHandle, securityHandle);

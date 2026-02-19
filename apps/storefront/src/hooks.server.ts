import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Load cart ID into locals for convenience
	event.locals.cartId = event.cookies.get('cart_id');

	const response = await resolve(event);

	// Security headers
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

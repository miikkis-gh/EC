import type { Handle, HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { json } from '@sveltejs/kit';
import { validateSessionToken, setSessionTokenCookie } from '$server/auth';
import { generalLimiter, authLimiter, checkoutLimiter } from '$server/rate-limit';
import { createLogger } from '$server/logger';
import { dev } from '$app/environment';
import * as Sentry from '@sentry/sveltekit';
import '$server/env'; // validate required env vars at startup

const logger = createLogger('hooks');

// --- Sentry init (no-op if DSN not set) ---

if (!dev) {
	Sentry.init({
		dsn: process.env.PUBLIC_SENTRY_DSN || '',
		tracesSampleRate: 0.1
	});
}

// --- IP extraction helper ---

function getClientIp(event: Parameters<Handle>[0]['event']): string {
	return (
		event.request.headers.get('cf-connecting-ip') ||
		event.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
		event.getClientAddress()
	);
}

// --- Rate limiting handle ---

const rateLimitHandle: Handle = async ({ event, resolve }) => {
	const ip = getClientIp(event);
	const path = event.url.pathname;

	// Auth routes: stricter limit
	if (path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/api/auth')) {
		const result = authLimiter.consume(ip);
		if (!result.allowed) {
			return json(
				{ error: 'Too many requests. Please try again later.' },
				{
					status: 429,
					headers: { 'Retry-After': String(result.retryAfter) }
				}
			);
		}
	}

	// Checkout routes: moderate limit
	if (path.startsWith('/api/checkout') || path.startsWith('/checkout')) {
		const result = checkoutLimiter.consume(ip);
		if (!result.allowed) {
			return json(
				{ error: 'Too many requests. Please try again later.' },
				{
					status: 429,
					headers: { 'Retry-After': String(result.retryAfter) }
				}
			);
		}
	}

	// General limit for all routes
	const result = generalLimiter.consume(ip);
	if (!result.allowed) {
		return json(
			{ error: 'Too many requests. Please try again later.' },
			{
				status: 429,
				headers: { 'Retry-After': String(result.retryAfter) }
			}
		);
	}

	return resolve(event);
};

// --- Auth handle ---

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

// --- Cart handle ---

const cartHandle: Handle = async ({ event, resolve }) => {
	event.locals.cartId = event.cookies.get('cart_id');
	return resolve(event);
};

// --- Security headers handle ---

const securityHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	response.headers.set('X-XSS-Protection', '0');

	if (!dev) {
		response.headers.set(
			'Strict-Transport-Security',
			'max-age=31536000; includeSubDomains'
		);
	}

	const connectSrc = dev
		? "connect-src 'self' http://localhost:9000 http://localhost:7700 https://api.stripe.com"
		: "connect-src 'self' https://api.stripe.com";

	// Add Sentry DSN domain to connect-src if configured
	const sentryDsn = process.env.PUBLIC_SENTRY_DSN;
	const sentryConnect = sentryDsn ? ` https://*.ingest.sentry.io` : '';

	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' https://js.stripe.com",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: https://res.cloudinary.com https://*.cloudinary.com https://*.stripe.com",
			"font-src 'self'",
			connectSrc + sentryConnect,
			"frame-src https://js.stripe.com https://hooks.stripe.com",
			"frame-ancestors 'none'",
			"object-src 'none'",
			"base-uri 'self'",
			"form-action 'self'",
			dev ? '' : 'upgrade-insecure-requests'
		]
			.filter(Boolean)
			.join('; ')
	);

	return response;
};

export const handle = sequence(rateLimitHandle, authHandle, cartHandle, securityHandle);

export const handleError: HandleServerError = ({ error, event, status, message }) => {
	if (!dev && process.env.PUBLIC_SENTRY_DSN) {
		Sentry.captureException(error, {
			extra: {
				url: event.url.pathname,
				status,
				message
			}
		});
	}

	logger.error('Server error', error, { url: event.url.pathname, status });

	return {
		message: 'An unexpected error occurred'
	};
};

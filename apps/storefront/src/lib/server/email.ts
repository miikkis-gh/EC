import { env } from '$env/dynamic/private';
import { createLogger } from './logger';

const logger = createLogger('email');

interface SendEmailOptions {
	to: string;
	subject: string;
	html: string;
	from?: string;
	replyTo?: string;
}

let resendInstance: import('resend').Resend | null = null;

function getResend(): import('resend').Resend | null {
	if (resendInstance) return resendInstance;

	const apiKey = env.RESEND_API_KEY;
	if (!apiKey) {
		logger.warn('RESEND_API_KEY not set — emails will be logged only');
		return null;
	}

	// Lazy import to avoid loading resend when not configured
	const { Resend } = require('resend') as typeof import('resend');
	resendInstance = new Resend(apiKey);
	return resendInstance;
}

export async function sendEmail({ to, subject, html, from, replyTo }: SendEmailOptions) {
	const sender = from || env.EMAIL_FROM || 'EC1 Store <noreply@sellio.fi>';
	const resend = getResend();

	if (!resend) {
		logger.info('Email (logged only)', { to, subject, replyTo });
		logger.info('Email body', { html: html.substring(0, 500) });
		return null;
	}

	const { data, error } = await resend.emails.send({
		from: sender,
		to,
		subject,
		html,
		...(replyTo ? { reply_to: replyTo } : {})
	});

	if (error) {
		logger.error('Send failed', error, { to, subject });
		throw error;
	}

	logger.info('Email sent', { to, subject, id: data?.id });
	return data;
}

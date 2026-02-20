import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { contactSchema } from '$utils/validation';
import { sendEmail } from '$server/email';
import { generalLimiter } from '$server/rate-limit';
import { env } from '$env/dynamic/private';
import { createLogger } from '$server/logger';

const logger = createLogger('contact');

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

export const actions: Actions = {
	default: async ({ request, getClientAddress }) => {
		const ip =
			request.headers.get('cf-connecting-ip') ||
			request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
			getClientAddress();

		const rateResult = await generalLimiter.consume(`contact:${ip}`);
		if (!rateResult.allowed) {
			return fail(429, {
				errors: { _form: ['Too many requests. Please try again later.'] } as Record<string, string[]>,
				values: {} as Record<string, string>
			});
		}

		const formData = await request.formData();
		const raw = {
			name: formData.get('name'),
			email: formData.get('email'),
			message: formData.get('message')
		};

		const result = contactSchema.safeParse(raw);
		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			return fail(400, { errors, values: raw as Record<string, string> });
		}

		const { name, email, message } = result.data;
		const contactEmail = env.CONTACT_EMAIL || 'hello@sellio.fi';

		try {
			await sendEmail({
				to: contactEmail,
				subject: `Contact form: ${escapeHtml(name)}`,
				html: `
					<h2>New contact form submission</h2>
					<p><strong>Name:</strong> ${escapeHtml(name)}</p>
					<p><strong>Email:</strong> ${escapeHtml(email)}</p>
					<p><strong>Message:</strong></p>
					<p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
				`,
				replyTo: email
			});
		} catch (err) {
			logger.error('Failed to send contact form email', err);
			return fail(500, {
				errors: { _form: ['Failed to send your message. Please try again later.'] } as Record<string, string[]>,
				values: raw as Record<string, string>
			});
		}

		return { success: true };
	}
};

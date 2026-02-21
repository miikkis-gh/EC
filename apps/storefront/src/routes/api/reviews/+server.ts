import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	getProductReviews,
	getProductReviewStats,
	createOrUpdateReview,
	deleteReview
} from '$server/reviews';
import { reviewSchema, reviewDeleteSchema } from '$utils/validation';

export const GET: RequestHandler = async ({ url }) => {
	const productId = url.searchParams.get('productId');
	if (!productId) {
		return json({ error: 'productId is required' }, { status: 400 });
	}

	try {
		const [reviews, stats] = await Promise.all([
			getProductReviews(productId),
			getProductReviewStats(productId)
		]);
		return json({ reviews, stats });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load reviews';
		return json({ error: message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json();
	const result = reviewSchema.safeParse(body);

	if (!result.success) {
		return json({ error: result.error.issues[0].message }, { status: 400 });
	}

	try {
		await createOrUpdateReview(
			locals.user.id,
			result.data.productId,
			result.data.rating,
			result.data.title,
			result.data.content
		);
		return json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to submit review';
		return json({ error: message }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json();
	const result = reviewDeleteSchema.safeParse(body);

	if (!result.success) {
		return json({ error: result.error.issues[0].message }, { status: 400 });
	}

	try {
		await deleteReview(locals.user.id, result.data.reviewId);
		return json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to delete review';
		return json({ error: message }, { status: 500 });
	}
};

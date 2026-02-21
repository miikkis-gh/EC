import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserWishlistProductIds, addToWishlist, removeFromWishlist } from '$server/wishlist';
import { wishlistSchema } from '$utils/validation';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	try {
		const productIds = await getUserWishlistProductIds(locals.user.id);
		return json({ productIds });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to load wishlist';
		return json({ error: message }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json();
	const result = wishlistSchema.safeParse(body);

	if (!result.success) {
		return json({ error: result.error.issues[0].message }, { status: 400 });
	}

	try {
		await addToWishlist(locals.user.id, result.data.productId);
		return json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to add to wishlist';
		return json({ error: message }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const body = await request.json();
	const result = wishlistSchema.safeParse(body);

	if (!result.success) {
		return json({ error: result.error.issues[0].message }, { status: 400 });
	}

	try {
		await removeFromWishlist(locals.user.id, result.data.productId);
		return json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Failed to remove from wishlist';
		return json({ error: message }, { status: 500 });
	}
};

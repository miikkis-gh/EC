import { queryMany, execute } from './db';
import crypto from 'node:crypto';

export async function getUserWishlistProductIds(userId: string): Promise<string[]> {
	const rows = await queryMany<{ product_id: string }>(
		'SELECT product_id FROM wishlist_item WHERE user_id = $1 ORDER BY created_at DESC',
		[userId]
	);
	return rows.map((r) => r.product_id);
}

export async function addToWishlist(userId: string, productId: string): Promise<void> {
	const id = crypto.randomUUID();
	await execute(
		'INSERT INTO wishlist_item (id, user_id, product_id) VALUES ($1, $2, $3) ON CONFLICT (user_id, product_id) DO NOTHING',
		[id, userId, productId]
	);
}

export async function removeFromWishlist(userId: string, productId: string): Promise<void> {
	await execute(
		'DELETE FROM wishlist_item WHERE user_id = $1 AND product_id = $2',
		[userId, productId]
	);
}

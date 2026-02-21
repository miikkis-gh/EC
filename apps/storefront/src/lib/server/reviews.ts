import { queryOne, queryMany, execute } from './db';
import crypto from 'node:crypto';

export interface Review {
	id: string;
	user_id: string;
	product_id: string;
	rating: number;
	title: string;
	content: string | null;
	created_at: string;
	updated_at: string;
	user_email: string;
	user_first_name: string | null;
}

export interface ReviewStats {
	averageRating: number;
	totalCount: number;
	distribution: number[];
}

export async function getProductReviews(productId: string): Promise<Review[]> {
	return queryMany<Review>(
		`SELECT r.id, r.user_id, r.product_id, r.rating, r.title, r.content,
		        r.created_at, r.updated_at, u.email AS user_email, u.first_name AS user_first_name
		 FROM product_review r
		 JOIN auth_user u ON u.id = r.user_id
		 WHERE r.product_id = $1
		 ORDER BY r.created_at DESC`,
		[productId]
	);
}

export async function getProductReviewStats(productId: string): Promise<ReviewStats> {
	const row = await queryOne<{
		avg_rating: string | null;
		total_count: string;
		count_1: string;
		count_2: string;
		count_3: string;
		count_4: string;
		count_5: string;
	}>(
		`SELECT
		   COALESCE(AVG(rating), 0) AS avg_rating,
		   COUNT(*)::text AS total_count,
		   COUNT(*) FILTER (WHERE rating = 1)::text AS count_1,
		   COUNT(*) FILTER (WHERE rating = 2)::text AS count_2,
		   COUNT(*) FILTER (WHERE rating = 3)::text AS count_3,
		   COUNT(*) FILTER (WHERE rating = 4)::text AS count_4,
		   COUNT(*) FILTER (WHERE rating = 5)::text AS count_5
		 FROM product_review
		 WHERE product_id = $1`,
		[productId]
	);

	if (!row) {
		return { averageRating: 0, totalCount: 0, distribution: [0, 0, 0, 0, 0] };
	}

	return {
		averageRating: Math.round(parseFloat(row.avg_rating ?? '0') * 10) / 10,
		totalCount: parseInt(row.total_count, 10),
		distribution: [
			parseInt(row.count_1, 10),
			parseInt(row.count_2, 10),
			parseInt(row.count_3, 10),
			parseInt(row.count_4, 10),
			parseInt(row.count_5, 10)
		]
	};
}

export async function getUserReview(userId: string, productId: string): Promise<Review | null> {
	return queryOne<Review>(
		`SELECT r.id, r.user_id, r.product_id, r.rating, r.title, r.content,
		        r.created_at, r.updated_at, u.email AS user_email, u.first_name AS user_first_name
		 FROM product_review r
		 JOIN auth_user u ON u.id = r.user_id
		 WHERE r.user_id = $1 AND r.product_id = $2`,
		[userId, productId]
	);
}

export async function createOrUpdateReview(
	userId: string,
	productId: string,
	rating: number,
	title: string,
	content?: string
): Promise<void> {
	const id = crypto.randomUUID();
	await execute(
		`INSERT INTO product_review (id, user_id, product_id, rating, title, content)
		 VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (user_id, product_id) DO UPDATE
		 SET rating = EXCLUDED.rating,
		     title = EXCLUDED.title,
		     content = EXCLUDED.content,
		     updated_at = NOW()`,
		[id, userId, productId, rating, title, content ?? null]
	);
}

export async function deleteReview(userId: string, reviewId: string): Promise<void> {
	await execute(
		'DELETE FROM product_review WHERE id = $1 AND user_id = $2',
		[reviewId, userId]
	);
}

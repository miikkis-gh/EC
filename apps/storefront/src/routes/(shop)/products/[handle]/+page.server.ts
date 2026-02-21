import type { PageServerLoad } from './$types';
import { getProductByHandle, getProducts } from '$server/medusa';
import { error } from '@sveltejs/kit';
import type { Product } from '$server/medusa';
import { getProductReviews, getProductReviewStats, getUserReview } from '$server/reviews';
import type { Review, ReviewStats } from '$server/reviews';

async function fetchRelatedProducts(product: Product): Promise<Product[]> {
	let relatedProducts: Product[] = [];

	if (product.collection_id) {
		const related = await getProducts({
			collection_id: [product.collection_id],
			limit: 5
		});
		relatedProducts = related.products.filter((p) => p.id !== product.id).slice(0, 4);
	}

	// Backfill with latest products if not enough from same collection
	if (relatedProducts.length < 4) {
		const existingIds = new Set([product.id, ...relatedProducts.map((p) => p.id)]);
		const latest = await getProducts({
			limit: 4 - relatedProducts.length + 1,
			order: '-created_at'
		});
		const backfill = latest.products.filter((p) => !existingIds.has(p.id));
		relatedProducts = [...relatedProducts, ...backfill].slice(0, 4);
	}

	return relatedProducts;
}

async function fetchReviewData(productId: string, userId?: string) {
	const [reviews, reviewStats] = await Promise.all([
		getProductReviews(productId),
		getProductReviewStats(productId)
	]);
	const userReview = userId ? await getUserReview(userId, productId) : null;
	return { reviews, reviewStats, userReview };
}

export const load: PageServerLoad = async ({ params, locals }) => {
	try {
		const data = await getProductByHandle(params.handle);
		const product = data.products[0];

		if (!product) {
			throw error(404, 'Product not found');
		}

		// Stream non-critical data — SvelteKit sends these as promises
		const relatedProducts = fetchRelatedProducts(product).catch((): Product[] => []);

		const defaultReviewData = {
			reviews: [] as Review[],
			reviewStats: { averageRating: 0, totalCount: 0, distribution: [0, 0, 0, 0, 0] } as ReviewStats,
			userReview: null as Review | null
		};
		const reviewData = fetchReviewData(product.id, locals.user?.id).catch(() => defaultReviewData);

		return {
			product,
			relatedProducts,
			reviewData
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Product not found');
	}
};

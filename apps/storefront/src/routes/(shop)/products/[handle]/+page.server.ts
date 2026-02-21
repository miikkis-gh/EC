import type { PageServerLoad } from './$types';
import { getProductByHandle, getProducts } from '$server/medusa';
import { error } from '@sveltejs/kit';
import type { Product } from '$server/medusa';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const data = await getProductByHandle(params.handle);
		const product = data.products[0];

		if (!product) {
			throw error(404, 'Product not found');
		}

		// Fetch related products (non-critical, don't fail the page)
		let relatedProducts: Product[] = [];
		try {
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
		} catch {
			// Related products are non-critical
		}

		return { product, relatedProducts };
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Product not found');
	}
};

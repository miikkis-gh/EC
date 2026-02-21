import type { PageServerLoad } from './$types';
import { getUserWishlistProductIds } from '$server/wishlist';
import { getProductsByIds } from '$server/medusa';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();

	const productIds = await getUserWishlistProductIds(user.id);

	if (productIds.length === 0) {
		return { products: [] };
	}

	try {
		const { products } = await getProductsByIds(productIds);
		return { products };
	} catch {
		return { products: [] };
	}
};

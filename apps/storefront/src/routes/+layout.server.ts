import type { LayoutServerLoad } from './$types';
import { getCart } from '$server/medusa';

export const load: LayoutServerLoad = async ({ cookies }) => {
	const cartId = cookies.get('cart_id');

	if (cartId) {
		try {
			const { cart } = await getCart(cartId);
			return { cart };
		} catch {
			// Cart may have expired or been completed
			cookies.delete('cart_id', { path: '/' });
		}
	}

	return { cart: null };
};

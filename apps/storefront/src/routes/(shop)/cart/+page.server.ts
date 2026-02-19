import type { PageServerLoad } from './$types';
import { getCart } from '$server/medusa';

export const load: PageServerLoad = async ({ cookies }) => {
	const cartId = cookies.get('cart_id');

	if (cartId) {
		try {
			const { cart } = await getCart(cartId);
			return { cart };
		} catch {
			cookies.delete('cart_id', { path: '/' });
		}
	}

	return { cart: null };
};

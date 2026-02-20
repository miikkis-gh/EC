import { writable, derived } from 'svelte/store';
import { toast } from 'svelte-sonner';
import type { Cart } from '$server/medusa';

export const cart = writable<Cart | null>(null);

export const cartCount = derived(cart, ($cart) => {
	if (!$cart?.items) return 0;
	return $cart.items.reduce((sum, item) => sum + item.quantity, 0);
});

export const cartOpen = writable(false);

export function openCart() {
	cartOpen.set(true);
}

export function closeCart() {
	cartOpen.set(false);
}

async function parseResponseError(response: Response, fallback: string): Promise<string> {
	try {
		const data = await response.json();
		return data.error || fallback;
	} catch {
		return fallback;
	}
}

export async function addToCartOptimistic(variantId: string, quantity: number = 1) {
	try {
		const response = await fetch('/api/cart/add', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ variantId, quantity })
		});

		if (!response.ok) {
			const message = await parseResponseError(response, 'Failed to add item to cart');
			throw new Error(message);
		}

		const data = await response.json();
		cart.set(data.cart);
		openCart();
		toast.success('Added to cart');
	} catch (error) {
		console.error('Failed to add to cart:', error);
		toast.error(error instanceof Error ? error.message : 'Failed to add item to cart');
		throw error;
	}
}

export async function updateCartItem(lineItemId: string, quantity: number) {
	try {
		const response = await fetch('/api/cart/update', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ lineItemId, quantity })
		});

		if (!response.ok) {
			const message = await parseResponseError(response, 'Failed to update cart');
			throw new Error(message);
		}

		const data = await response.json();
		cart.set(data.cart);
		toast.success('Cart updated');
	} catch (error) {
		console.error('Failed to update cart:', error);
		toast.error(error instanceof Error ? error.message : 'Failed to update cart');
		throw error;
	}
}

export async function removeCartItem(lineItemId: string) {
	try {
		const response = await fetch('/api/cart/remove', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ lineItemId })
		});

		if (!response.ok) {
			const message = await parseResponseError(response, 'Failed to remove item');
			throw new Error(message);
		}

		const data = await response.json();
		cart.set(data.cart);
		toast.success('Item removed');
	} catch (error) {
		console.error('Failed to remove from cart:', error);
		toast.error(error instanceof Error ? error.message : 'Failed to remove item');
		throw error;
	}
}

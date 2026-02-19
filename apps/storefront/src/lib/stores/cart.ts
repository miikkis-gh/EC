import { writable, derived } from 'svelte/store';
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

export async function addToCartOptimistic(variantId: string, quantity: number = 1) {
	try {
		const response = await fetch('/api/cart/add', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ variantId, quantity })
		});

		if (!response.ok) {
			throw new Error('Failed to add to cart');
		}

		const data = await response.json();
		cart.set(data.cart);
		openCart();
	} catch (error) {
		console.error('Failed to add to cart:', error);
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
			throw new Error('Failed to update cart');
		}

		const data = await response.json();
		cart.set(data.cart);
	} catch (error) {
		console.error('Failed to update cart:', error);
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
			throw new Error('Failed to remove item');
		}

		const data = await response.json();
		cart.set(data.cart);
	} catch (error) {
		console.error('Failed to remove from cart:', error);
		throw error;
	}
}

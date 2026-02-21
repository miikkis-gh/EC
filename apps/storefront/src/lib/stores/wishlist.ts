import { writable, derived } from 'svelte/store';
import { toast } from 'svelte-sonner';

export const wishlistIds = writable<Set<string>>(new Set());

export const wishlistCount = derived(wishlistIds, ($ids) => $ids.size);

export function initWishlist(productIds: string[]) {
	wishlistIds.set(new Set(productIds));
}

export async function toggleWishlist(productId: string): Promise<void> {
	let wasInWishlist = false;

	// Optimistic update
	wishlistIds.update((ids) => {
		const next = new Set(ids);
		if (next.has(productId)) {
			wasInWishlist = true;
			next.delete(productId);
		} else {
			next.add(productId);
		}
		return next;
	});

	try {
		const response = await fetch('/api/wishlist', {
			method: wasInWishlist ? 'DELETE' : 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ productId })
		});

		if (!response.ok) {
			throw new Error('Request failed');
		}

		toast.success(wasInWishlist ? 'Removed from wishlist' : 'Added to wishlist');
	} catch {
		// Revert optimistic update
		wishlistIds.update((ids) => {
			const next = new Set(ids);
			if (wasInWishlist) {
				next.add(productId);
			} else {
				next.delete(productId);
			}
			return next;
		});
		toast.error('Failed to update wishlist');
	}
}

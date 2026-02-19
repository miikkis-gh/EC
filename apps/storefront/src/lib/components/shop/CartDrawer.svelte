<script lang="ts">
	import { cart, cartOpen, closeCart, cartCount } from '$stores/cart';
	import CartItem from './CartItem.svelte';
	import PriceDisplay from './PriceDisplay.svelte';
	import * as Sheet from '$ui/sheet';

	let open = $derived($cartOpen);

	function onOpenChange(value: boolean) {
		if (!value) closeCart();
	}
</script>

<Sheet.Root bind:open {onOpenChange}>
	<Sheet.Content side="right" class="flex w-full max-w-md flex-col">
		<Sheet.Header class="border-b border-neutral-200 px-4">
			<Sheet.Title class="font-heading text-lg font-semibold">
				Cart ({$cartCount})
			</Sheet.Title>
		</Sheet.Header>

		<!-- Items -->
		<div class="flex-1 overflow-y-auto px-4">
			{#if $cart?.items && $cart.items.length > 0}
				<div class="divide-y divide-neutral-100">
					{#each $cart.items as item (item.id)}
						<CartItem {item} currencyCode={$cart.currency_code} />
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center py-16">
					<svg class="h-12 w-12 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
					</svg>
					<p class="mt-4 text-sm text-neutral-500">Your cart is empty</p>
					<a
						href="/products"
						onclick={closeCart}
						class="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700"
					>
						Continue Shopping
					</a>
				</div>
			{/if}
		</div>

		<!-- Footer -->
		{#if $cart?.items && $cart.items.length > 0}
			<Sheet.Footer class="flex-col border-t border-neutral-200 p-4">
				<div class="flex w-full items-center justify-between">
					<span class="text-sm font-medium text-neutral-900">Subtotal</span>
					<PriceDisplay
						amount={$cart.subtotal ?? 0}
						currencyCode={$cart.currency_code}
						class="text-base font-semibold text-neutral-900"
					/>
				</div>
				<p class="mt-1 w-full text-xs text-neutral-500">Shipping and taxes calculated at checkout.</p>
				<a
					href="/checkout"
					onclick={closeCart}
					class="mt-4 block w-full rounded-lg bg-primary-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-700"
				>
					Checkout
				</a>
				<a
					href="/cart"
					onclick={closeCart}
					class="mt-2 block w-full text-center text-sm text-neutral-600 hover:text-neutral-900"
				>
					View Cart
				</a>
			</Sheet.Footer>
		{/if}
	</Sheet.Content>
</Sheet.Root>

<script lang="ts">
	import CartItem from '$components/shop/CartItem.svelte';
	import PriceDisplay from '$components/shop/PriceDisplay.svelte';
	import { cart } from '$stores/cart';
</script>

<svelte:head>
	<title>Cart — EC1</title>
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
	<h1 class="mb-8 font-heading text-3xl font-bold text-neutral-900">Shopping Cart</h1>

	{#if $cart?.items && $cart.items.length > 0}
		<div class="divide-y divide-neutral-200">
			{#each $cart.items as item (item.id)}
				<CartItem {item} currencyCode={$cart.currency_code} />
			{/each}
		</div>

		<!-- Summary -->
		<div class="mt-8 rounded-xl border border-neutral-200 bg-neutral-50 p-6">
			<div class="space-y-2">
				<div class="flex justify-between text-sm">
					<span class="text-neutral-600">Subtotal</span>
					<PriceDisplay amount={$cart.subtotal ?? 0} currencyCode={$cart.currency_code} class="text-neutral-900" />
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-neutral-600">Shipping</span>
					<span class="text-neutral-500">Calculated at checkout</span>
				</div>
			</div>
			<div class="mt-4 flex justify-between border-t border-neutral-200 pt-4">
				<span class="text-base font-semibold text-neutral-900">Total</span>
				<PriceDisplay amount={$cart.total ?? 0} currencyCode={$cart.currency_code} class="text-base font-semibold text-neutral-900" />
			</div>
			<a
				href="/checkout"
				class="mt-6 block w-full rounded-lg bg-primary-600 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-700"
			>
				Proceed to Checkout
			</a>
		</div>
	{:else}
		<div class="py-16 text-center">
			<svg class="mx-auto h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
			</svg>
			<p class="mt-4 text-neutral-500">Your cart is empty</p>
			<a
				href="/products"
				class="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
			>
				Continue Shopping
			</a>
		</div>
	{/if}
</div>

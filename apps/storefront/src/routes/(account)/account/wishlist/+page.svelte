<script lang="ts">
	import ProductCard from '$components/shop/ProductCard.svelte';
	import type { Product } from '$server/medusa';

	interface Props {
		data: { products: Product[] };
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>Wishlist — EC1</title>
</svelte:head>

<div>
	<h2 class="font-heading text-2xl font-bold text-neutral-900">Wishlist</h2>

	{#if data.products.length > 0}
		<div class="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
			{#each data.products as product (product.id)}
				<ProductCard {product} />
			{/each}
		</div>
	{:else}
		<div class="mt-12 flex flex-col items-center justify-center text-center">
			<svg class="h-16 w-16 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
			</svg>
			<h3 class="mt-4 text-lg font-medium text-neutral-900">Your wishlist is empty</h3>
			<p class="mt-1 text-sm text-neutral-500">Save products you love by clicking the heart icon.</p>
			<a
				href="/products"
				class="mt-6 rounded-lg bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
			>
				Browse Products
			</a>
		</div>
	{/if}
</div>

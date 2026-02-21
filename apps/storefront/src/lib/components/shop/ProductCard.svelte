<script lang="ts">
	import PriceDisplay from './PriceDisplay.svelte';
	import WishlistButton from './WishlistButton.svelte';
	import QuickView from './QuickView.svelte';
	import { imageHoverZoom } from '$utils/animations';
	import type { Product } from '$server/medusa';

	interface Props {
		product: Product;
	}

	let { product }: Props = $props();

	let containerEl: HTMLElement | undefined = $state();
	let imgEl: HTMLElement | undefined = $state();
	let imgFailed = $state(false);

	$effect(() => {
		if (!containerEl || !imgEl) return;
		return imageHoverZoom(containerEl, imgEl);
	});

	const price = $derived(
		product.variants?.[0]?.calculated_price?.calculated_amount ??
		product.variants?.[0]?.prices?.[0]?.amount ??
		0
	);

	const currencyCode = $derived(
		product.variants?.[0]?.calculated_price?.currency_code ??
		product.variants?.[0]?.prices?.[0]?.currency_code ??
		'eur'
	);

	const firstVariant = $derived(product.variants?.[0]);
	const isOutOfStock = $derived(
		firstVariant?.manage_inventory && firstVariant?.inventory_quantity === 0
	);

	let quickViewOpen = $state(false);

	function openQuickView(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		quickViewOpen = true;
	}
</script>

<a
	href="/products/{product.handle}"
	class="group relative block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg"
	data-product-card
	bind:this={containerEl}
>
	<!-- Image -->
	<div class="relative aspect-square overflow-hidden bg-neutral-100">
		{#if product.thumbnail && !imgFailed}
			<img
				bind:this={imgEl}
				src={product.thumbnail}
				alt={product.title}
				class="h-full w-full object-cover"
				loading="lazy"
				onerror={() => imgFailed = true}
			/>
		{:else}
			<div class="flex h-full items-center justify-center text-neutral-400">
				<svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
				</svg>
			</div>
		{/if}
		{#if isOutOfStock}
			<div class="absolute inset-0 flex items-center justify-center bg-white/60">
				<span class="rounded-full bg-neutral-900/80 px-3 py-1 text-xs font-semibold text-white">Out of Stock</span>
			</div>
		{/if}
		<div class="absolute right-2 top-2 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
			<WishlistButton productId={product.id} class="bg-white/80 backdrop-blur-sm shadow-sm" />
			<button
				onclick={openQuickView}
				class="rounded-full bg-white/80 p-1.5 text-neutral-400 shadow-sm backdrop-blur-sm transition-colors hover:text-neutral-700"
				aria-label="Quick view {product.title}"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
				</svg>
			</button>
		</div>
	</div>

	<!-- Info -->
	<div class="p-4">
		<h3 class="text-sm font-medium text-neutral-900 group-hover:text-primary-600">
			{product.title}
		</h3>
		<PriceDisplay
			amount={price}
			currencyCode={currencyCode}
			class="mt-1 block text-sm font-semibold text-neutral-700"
		/>
	</div>
</a>

<QuickView
	{product}
	bind:open={quickViewOpen}
	onclose={() => quickViewOpen = false}
/>

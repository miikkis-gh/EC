<script lang="ts">
	import PriceDisplay from './PriceDisplay.svelte';
	import { imageHoverZoom } from '$utils/animations';
	import type { Product } from '$server/medusa';

	interface Props {
		product: Product;
	}

	let { product }: Props = $props();

	let containerEl: HTMLElement | undefined = $state();
	let imgEl: HTMLElement | undefined = $state();

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
</script>

<a
	href="/products/{product.handle}"
	class="group block overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg"
	data-product-card
	bind:this={containerEl}
>
	<!-- Image -->
	<div class="aspect-square overflow-hidden bg-neutral-100">
		{#if product.thumbnail}
			<img
				bind:this={imgEl}
				src={product.thumbnail}
				alt={product.title}
				class="h-full w-full object-cover"
				loading="lazy"
			/>
		{:else}
			<div class="flex h-full items-center justify-center text-neutral-400">
				<svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
				</svg>
			</div>
		{/if}
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

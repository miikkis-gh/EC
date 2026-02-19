<script lang="ts">
	import PriceDisplay from '$components/shop/PriceDisplay.svelte';
	import QuantitySelector from '$components/shop/QuantitySelector.svelte';
	import { addToCartOptimistic } from '$stores/cart';
	import { fadeInUp } from '$utils/animations';
	import { buildProductJsonLd } from '$utils/seo';
	import { page } from '$app/stores';
	import type { Product } from '$server/medusa';

	interface Props {
		data: { product: Product };
	}

	let { data }: Props = $props();
	let siteUrl = $derived($page.data.siteUrl as string);
	let product = $derived(data.product);
	let selectedVariantIndex = $state(0);
	let quantity = $state(1);
	let adding = $state(false);
	let pageEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (pageEl) fadeInUp(pageEl);
	});

	const selectedVariant = $derived(product.variants[selectedVariantIndex]);
	const price = $derived(
		selectedVariant?.calculated_price?.calculated_amount ??
		selectedVariant?.prices?.[0]?.amount ??
		0
	);
	const currencyCode = $derived(
		selectedVariant?.calculated_price?.currency_code ??
		selectedVariant?.prices?.[0]?.currency_code ??
		'eur'
	);

	async function handleAddToCart() {
		if (!selectedVariant) return;
		adding = true;
		try {
			await addToCartOptimistic(selectedVariant.id, quantity);
		} finally {
			adding = false;
		}
	}
</script>

<svelte:head>
	<title>{product.title} — EC1</title>
	{#if product.description}
		<meta name="description" content={product.description} />
	{/if}
	{@html `<script type="application/ld+json">${buildProductJsonLd(product, siteUrl)}</script>`}
</svelte:head>

<div bind:this={pageEl} class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<div class="grid gap-12 lg:grid-cols-2">
		<!-- Images -->
		<div class="space-y-4">
			<div class="aspect-square overflow-hidden rounded-2xl bg-neutral-100">
				{#if product.thumbnail}
					<img
						src={product.thumbnail}
						alt={product.title}
						class="h-full w-full object-cover"
					/>
				{:else}
					<div class="flex h-full items-center justify-center text-neutral-400">
						<svg class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
						</svg>
					</div>
				{/if}
			</div>

			{#if product.images && product.images.length > 1}
				<div class="grid grid-cols-4 gap-2">
					{#each product.images as image (image.id)}
						<div class="aspect-square overflow-hidden rounded-lg bg-neutral-100">
							<img
								src={image.url}
								alt={product.title}
								class="h-full w-full object-cover"
								loading="lazy"
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Info -->
		<div>
			{#if product.collection}
				<a
					href="/collections/{product.collection.handle}"
					class="text-sm font-medium text-primary-600 hover:text-primary-700"
				>
					{product.collection.title}
				</a>
			{/if}

			<h1 class="mt-2 font-heading text-3xl font-bold text-neutral-900">{product.title}</h1>

			<PriceDisplay
				amount={price}
				{currencyCode}
				class="mt-4 block text-2xl font-semibold text-neutral-900"
			/>

			{#if product.description}
				<p class="mt-6 text-neutral-600">{product.description}</p>
			{/if}

			<!-- Variant selector -->
			{#if product.variants.length > 1}
				<div class="mt-8">
					<h3 class="text-sm font-medium text-neutral-900">Options</h3>
					<div class="mt-2 flex flex-wrap gap-2">
						{#each product.variants as variant, i (variant.id)}
							<button
								onclick={() => selectedVariantIndex = i}
								class="rounded-lg border px-4 py-2 text-sm transition-colors {i === selectedVariantIndex
									? 'border-primary-600 bg-primary-50 text-primary-700'
									: 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}"
							>
								{variant.title}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Quantity + Add to Cart -->
			<div class="mt-8 flex items-center gap-4">
				<QuantitySelector {quantity} onchange={(q) => quantity = q} />
				<button
					onclick={handleAddToCart}
					disabled={adding}
					class="flex-1 rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{adding ? 'Adding...' : 'Add to Cart'}
				</button>
			</div>
		</div>
	</div>
</div>

<script lang="ts">
	import PriceDisplay from '$components/shop/PriceDisplay.svelte';
	import QuantitySelector from '$components/shop/QuantitySelector.svelte';
	import Breadcrumbs from '$components/shop/Breadcrumbs.svelte';
	import ProductGallery from '$components/shop/ProductGallery.svelte';
	import ReviewStars from '$components/shop/ReviewStars.svelte';
	import RelatedProducts from '$components/shop/RelatedProducts.svelte';
	import RecentlyViewed from '$components/shop/RecentlyViewed.svelte';
	import WishlistButton from '$components/shop/WishlistButton.svelte';
	import StockBadge from '$components/shop/StockBadge.svelte';
	import ReviewSection from '$components/shop/ReviewSection.svelte';
	import { addToCartOptimistic } from '$stores/cart';
	import { addRecentlyViewed } from '$stores/recently-viewed';
	import { fadeInUp } from '$utils/animations';
	import { buildProductJsonLd } from '$utils/seo';
	import { page } from '$app/stores';
	import { toast } from 'svelte-sonner';
	import type { Product } from '$server/medusa';
	import type { Review, ReviewStats } from '$server/reviews';

	interface Props {
		data: {
			product: Product;
			relatedProducts: Product[];
			reviews: Review[];
			reviewStats: ReviewStats;
			userReview: Review | null;
		};
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

	$effect(() => {
		addRecentlyViewed(product);
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
	const outOfStock = $derived(
		selectedVariant?.manage_inventory && selectedVariant?.inventory_quantity === 0
	);

	const breadcrumbItems = $derived(() => {
		const items: { label: string; href?: string }[] = [
			{ label: 'Home', href: '/' },
			{ label: 'Products', href: '/products' }
		];
		if (product.collection) {
			items.push({ label: product.collection.title, href: `/collections/${product.collection.handle}` });
		}
		items.push({ label: product.title });
		return items;
	});

	async function handleAddToCart() {
		if (!selectedVariant) return;
		adding = true;
		try {
			await addToCartOptimistic(selectedVariant.id, quantity);
		} finally {
			adding = false;
		}
	}

	async function handleShare() {
		const shareData = { title: product.title, url: $page.url.href };
		try {
			if (navigator.share) {
				await navigator.share(shareData);
			} else {
				await navigator.clipboard.writeText($page.url.href);
				toast.success('Link copied to clipboard');
			}
		} catch (e) {
			if (e instanceof DOMException && e.name === 'AbortError') return;
			try {
				await navigator.clipboard.writeText($page.url.href);
				toast.success('Link copied to clipboard');
			} catch {
				toast.error('Unable to share');
			}
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
	<Breadcrumbs items={breadcrumbItems()} />

	<div class="grid gap-12 lg:grid-cols-2">
		<!-- Images -->
		<ProductGallery
			images={product.images ?? []}
			thumbnail={product.thumbnail}
			alt={product.title}
		/>

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
			<ReviewStars rating={data.reviewStats.averageRating} count={data.reviewStats.totalCount} clickable class="mt-2" />

			<PriceDisplay
				amount={price}
				{currencyCode}
				class="mt-4 block text-2xl font-semibold text-neutral-900"
			/>

			{#if selectedVariant}
				<StockBadge
					quantity={selectedVariant.inventory_quantity}
					manageInventory={selectedVariant.manage_inventory}
					class="mt-3"
				/>
			{/if}

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
					disabled={adding || outOfStock}
					class="flex-1 rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if outOfStock}
						Out of Stock
					{:else}
						{adding ? 'Adding...' : 'Add to Cart'}
					{/if}
				</button>
				<WishlistButton productId={product.id} class="border border-neutral-200 p-2.5" />
				<button
					onclick={handleShare}
					class="rounded-full border border-neutral-200 p-2.5 text-neutral-400 transition-colors hover:text-neutral-600"
					aria-label="Share product"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
					</svg>
				</button>
			</div>
		</div>
	</div>

	<ReviewSection
		productId={product.id}
		reviews={data.reviews}
		stats={data.reviewStats}
		userReview={data.userReview}
	/>
	<RelatedProducts products={data.relatedProducts} />
	<RecentlyViewed currentProductId={product.id} />
</div>

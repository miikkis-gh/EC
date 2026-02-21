<script lang="ts">
	import * as Dialog from '$ui/dialog';
	import PriceDisplay from './PriceDisplay.svelte';
	import QuantitySelector from './QuantitySelector.svelte';
	import StockBadge from './StockBadge.svelte';
	import WishlistButton from './WishlistButton.svelte';
	import BlurImage from './BlurImage.svelte';
	import { addToCartOptimistic } from '$stores/cart';
	import type { Product } from '$server/medusa';

	interface Props {
		product: Product;
		open: boolean;
		onclose: () => void;
	}

	let { product, open = $bindable(), onclose }: Props = $props();
	let selectedVariantIndex = $state(0);
	let quantity = $state(1);
	let adding = $state(false);

	// Reset state when product changes
	$effect(() => {
		if (open) {
			selectedVariantIndex = 0;
			quantity = 1;
		}
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

	async function handleAddToCart() {
		if (!selectedVariant || outOfStock) return;
		adding = true;
		try {
			await addToCartOptimistic(selectedVariant.id, quantity);
			open = false;
			onclose();
		} finally {
			adding = false;
		}
	}

	function handleClose(isOpen: boolean) {
		if (!isOpen) onclose();
	}
</script>

<Dialog.Root bind:open onOpenChange={handleClose}>
	<Dialog.Content class="max-w-2xl p-0 sm:max-w-2xl">
		<div class="grid gap-0 sm:grid-cols-2">
			<!-- Image -->
			<div class="aspect-square overflow-hidden rounded-l-lg bg-neutral-100">
				{#if product.thumbnail}
					<BlurImage
						src={product.thumbnail}
						alt={product.title}
						blurhash={(product.metadata?.image_blurhashes as Record<string, string> | undefined)?.[product.thumbnail]}
						sizes="(min-width: 640px) 50vw, 100vw"
						class="h-full w-full"
					/>
				{:else}
					<div class="flex h-full items-center justify-center text-neutral-400">
						<svg class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
						</svg>
					</div>
				{/if}
			</div>

			<!-- Info -->
			<div class="flex flex-col p-6">
				<h3 class="font-heading text-lg font-bold text-neutral-900">{product.title}</h3>

				<PriceDisplay
					amount={price}
					{currencyCode}
					class="mt-2 block text-xl font-semibold text-neutral-900"
				/>

				{#if selectedVariant}
					<div class="mt-2">
						<StockBadge
							quantity={selectedVariant.inventory_quantity}
							manageInventory={selectedVariant.manage_inventory}
						/>
					</div>
				{/if}

				{#if product.description}
					<p class="mt-3 line-clamp-3 text-sm text-neutral-600">{product.description}</p>
				{/if}

				<!-- Variant selector -->
				{#if product.variants.length > 1}
					<div class="mt-4">
						<p class="text-xs font-medium text-neutral-500">Options</p>
						<div class="mt-1.5 flex flex-wrap gap-1.5">
							{#each product.variants as variant, i (variant.id)}
								<button
									onclick={() => selectedVariantIndex = i}
									class="rounded-md border px-3 py-1 text-xs transition-colors {i === selectedVariantIndex
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
				<div class="mt-auto pt-4">
					<div class="flex items-center gap-3">
						<QuantitySelector {quantity} onchange={(q) => quantity = q} />
						<button
							onclick={handleAddToCart}
							disabled={adding || outOfStock}
							class="flex-1 rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{#if outOfStock}
								Out of Stock
							{:else}
								{adding ? 'Adding...' : 'Add to Cart'}
							{/if}
						</button>
					</div>

					<div class="mt-3 flex items-center justify-between">
						<a
							href="/products/{product.handle}"
							class="text-sm font-medium text-primary-600 hover:text-primary-700"
						>
							View Full Details
						</a>
						<WishlistButton productId={product.id} />
					</div>
				</div>
			</div>
		</div>
	</Dialog.Content>
</Dialog.Root>

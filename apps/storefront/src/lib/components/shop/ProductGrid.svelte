<script lang="ts">
	import ProductCard from './ProductCard.svelte';
	import { scrollRevealGrid } from '$utils/animations';
	import type { Product } from '$server/medusa';

	interface Props {
		products: Product[];
	}

	let { products }: Props = $props();
	let gridEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (!gridEl) return;
		let cleanup: (() => void) | undefined;

		scrollRevealGrid(gridEl).then((fn) => {
			cleanup = fn;
		});

		return () => cleanup?.();
	});
</script>

{#if products.length > 0}
	<div
		bind:this={gridEl}
		class="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4"
	>
		{#each products as product (product.id)}
			<ProductCard {product} />
		{/each}
	</div>
{:else}
	<div class="py-16 text-center">
		<p class="text-neutral-500">No products found.</p>
	</div>
{/if}

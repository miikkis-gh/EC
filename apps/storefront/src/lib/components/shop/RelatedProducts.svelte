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
		scrollRevealGrid(gridEl).then((fn) => (cleanup = fn));
		return () => cleanup?.();
	});
</script>

{#if products.length > 0}
	<section class="mt-16">
		<h2 class="font-heading text-2xl font-bold text-neutral-900">You might also like</h2>
		<div
			bind:this={gridEl}
			class="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
		>
			{#each products as product (product.id)}
				<ProductCard {product} />
			{/each}
		</div>
	</section>
{/if}

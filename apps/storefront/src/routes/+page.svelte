<script lang="ts">
	import ProductGrid from '$components/shop/ProductGrid.svelte';
	import { scrollRevealGrid } from '$utils/animations';

	interface Props {
		data: {
			products: import('$server/medusa').Product[];
			collections: import('$server/medusa').Collection[];
		};
	}

	let { data }: Props = $props();
	let productGridEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (!productGridEl) return;
		let cleanup: (() => void) | undefined;

		scrollRevealGrid(productGridEl).then((fn) => {
			cleanup = fn;
		});

		return () => cleanup?.();
	});
</script>

<svelte:head>
	<title>EC1 — Home</title>
	<meta name="description" content="Quality products, curated for you." />
</svelte:head>

<!-- Hero -->
<section class="bg-neutral-50">
	<div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
		<div class="text-center">
			<h1 class="font-heading text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl">
				Quality products,<br />curated for you.
			</h1>
			<p class="mx-auto mt-6 max-w-xl text-lg text-neutral-600">
				Discover our carefully selected collection of premium products designed for everyday excellence.
			</p>
			<div class="mt-8 flex items-center justify-center gap-4">
				<a
					href="/products"
					class="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
				>
					Shop All
				</a>
				<a
					href="/collections"
					class="rounded-lg border border-neutral-300 px-6 py-3 text-sm font-semibold text-neutral-700 transition-colors hover:bg-neutral-100"
				>
					Browse Collections
				</a>
			</div>
		</div>
	</div>
</section>

<!-- Featured Products -->
{#if data.products.length > 0}
	<section class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
		<div class="mb-8 flex items-center justify-between">
			<h2 class="font-heading text-2xl font-bold text-neutral-900">Featured Products</h2>
			<a href="/products" class="text-sm font-medium text-primary-600 hover:text-primary-700">
				View all &rarr;
			</a>
		</div>
		<div bind:this={productGridEl}>
			<ProductGrid products={data.products} />
		</div>
	</section>
{/if}

<!-- Collections -->
{#if data.collections.length > 0}
	<section class="bg-neutral-50">
		<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
			<h2 class="mb-8 font-heading text-2xl font-bold text-neutral-900">Collections</h2>
			<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.collections as collection (collection.id)}
					<a
						href="/collections/{collection.handle}"
						class="group rounded-xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-lg"
					>
						<h3 class="font-heading text-lg font-semibold text-neutral-900 group-hover:text-primary-600">
							{collection.title}
						</h3>
						<p class="mt-2 text-sm text-neutral-500">Browse collection &rarr;</p>
					</a>
				{/each}
			</div>
		</div>
	</section>
{/if}

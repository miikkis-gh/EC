<script lang="ts">
	import ProductGrid from '$components/shop/ProductGrid.svelte';
	import { fadeInUp } from '$utils/animations';

	interface Props {
		data: {
			products: import('$server/medusa').Product[];
			count: number;
			page: number;
			pageCount: number;
		};
	}

	let { data }: Props = $props();
	let headingEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (headingEl) fadeInUp(headingEl);
	});
</script>

<svelte:head>
	<title>Products — EC1</title>
	<meta name="description" content="Browse our full product catalog." />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<h1 bind:this={headingEl} class="mb-8 font-heading text-3xl font-bold text-neutral-900">Products</h1>

	<ProductGrid products={data.products} />

	<!-- Pagination -->
	{#if data.pageCount > 1}
		<nav class="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
			{#if data.page > 1}
				<a
					href="/products?page={data.page - 1}"
					class="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
				>
					Previous
				</a>
			{/if}

			{#each Array.from({ length: data.pageCount }, (_, i) => i + 1) as pageNum}
				<a
					href="/products?page={pageNum}"
					class="rounded-lg px-4 py-2 text-sm {pageNum === data.page
						? 'bg-primary-600 text-white'
						: 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'}"
				>
					{pageNum}
				</a>
			{/each}

			{#if data.page < data.pageCount}
				<a
					href="/products?page={data.page + 1}"
					class="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
				>
					Next
				</a>
			{/if}
		</nav>
	{/if}
</div>

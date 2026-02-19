<script lang="ts">
	import ProductGrid from '$components/shop/ProductGrid.svelte';

	interface Props {
		data: {
			collection: import('$server/medusa').Collection;
			products: import('$server/medusa').Product[];
			count: number;
			page: number;
			pageCount: number;
		};
	}

	let { data }: Props = $props();
</script>

<svelte:head>
	<title>{data.collection.title} — EC1</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<h1 class="mb-8 font-heading text-3xl font-bold text-neutral-900">{data.collection.title}</h1>

	<ProductGrid products={data.products} />

	{#if data.pageCount > 1}
		<nav class="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
			{#if data.page > 1}
				<a
					href="/collections/{data.collection.handle}?page={data.page - 1}"
					class="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
				>
					Previous
				</a>
			{/if}

			{#each Array.from({ length: data.pageCount }, (_, i) => i + 1) as pageNum}
				<a
					href="/collections/{data.collection.handle}?page={pageNum}"
					class="rounded-lg px-4 py-2 text-sm {pageNum === data.page
						? 'bg-primary-600 text-white'
						: 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'}"
				>
					{pageNum}
				</a>
			{/each}

			{#if data.page < data.pageCount}
				<a
					href="/collections/{data.collection.handle}?page={data.page + 1}"
					class="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
				>
					Next
				</a>
			{/if}
		</nav>
	{/if}
</div>

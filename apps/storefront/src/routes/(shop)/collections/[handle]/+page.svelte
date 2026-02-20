<script lang="ts">
	import ProductGrid from '$components/shop/ProductGrid.svelte';
	import Breadcrumbs from '$components/shop/Breadcrumbs.svelte';
	import { fadeInUp } from '$utils/animations';

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
	let headingEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (headingEl) fadeInUp(headingEl);
	});
</script>

<svelte:head>
	<title>{data.collection.title} — EC1</title>
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<Breadcrumbs items={[
		{ label: 'Home', href: '/' },
		{ label: 'Collections', href: '/collections' },
		{ label: data.collection.title }
	]} />

	<h1 bind:this={headingEl} class="mb-8 font-heading text-3xl font-bold text-neutral-900">{data.collection.title}</h1>

	{#if data.products.length === 0}
		<div class="py-16 text-center">
			<p class="text-sm text-neutral-500">No products in this collection yet.</p>
			<a href="/products" class="mt-4 inline-block text-sm font-medium text-primary-600 hover:text-primary-700">
				Browse all products
			</a>
		</div>
	{:else}
		<ProductGrid products={data.products} />
	{/if}

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

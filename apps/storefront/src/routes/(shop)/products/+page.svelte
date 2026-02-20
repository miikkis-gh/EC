<script lang="ts">
	import ProductGrid from '$components/shop/ProductGrid.svelte';
	import Breadcrumbs from '$components/shop/Breadcrumbs.svelte';
	import FilterSidebar from '$components/shop/FilterSidebar.svelte';
	import { page } from '$app/stores';
	import { fadeInUp } from '$utils/animations';
	import type { ProductCategory } from '$server/medusa';

	interface Props {
		data: {
			products: import('$server/medusa').Product[];
			collections: import('$server/medusa').Collection[];
			categories: ProductCategory[];
			count: number;
			page: number;
			pageCount: number;
			loadError: boolean;
		};
	}

	let { data }: Props = $props();
	let headingEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (headingEl) fadeInUp(headingEl);
	});

	function paginationUrl(pageNum: number): string {
		const params = new URLSearchParams($page.url.searchParams);
		if (pageNum <= 1) {
			params.delete('page');
		} else {
			params.set('page', String(pageNum));
		}
		const qs = params.toString();
		return `/products${qs ? `?${qs}` : ''}`;
	}
</script>

<svelte:head>
	<title>Products — EC1</title>
	<meta name="description" content="Browse our full product catalog." />
	<link rel="canonical" href="/products{data.page > 1 ? `?page=${data.page}` : ''}" />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Products' }]} />

	<h1 bind:this={headingEl} class="mb-8 font-heading text-3xl font-bold text-neutral-900">Products</h1>

	{#if data.loadError}
		<div class="mb-8 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
			Products could not be loaded right now. Please try refreshing the page.
		</div>
	{/if}

	<div class="flex gap-8">
		<FilterSidebar collections={data.collections} categories={data.categories} />

		<div class="min-w-0 flex-1">
			<ProductGrid products={data.products} />

			<!-- Pagination -->
			{#if data.pageCount > 1}
				<nav class="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
					{#if data.page > 1}
						<a
							href={paginationUrl(data.page - 1)}
							class="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
						>
							Previous
						</a>
					{/if}

					{#each Array.from({ length: data.pageCount }, (_, i) => i + 1) as pageNum}
						<a
							href={paginationUrl(pageNum)}
							class="rounded-lg px-4 py-2 text-sm {pageNum === data.page
								? 'bg-primary-600 text-white'
								: 'border border-neutral-200 text-neutral-700 hover:bg-neutral-50'}"
						>
							{pageNum}
						</a>
					{/each}

					{#if data.page < data.pageCount}
						<a
							href={paginationUrl(data.page + 1)}
							class="rounded-lg border border-neutral-200 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
						>
							Next
						</a>
					{/if}
				</nav>
			{/if}
		</div>
	</div>
</div>

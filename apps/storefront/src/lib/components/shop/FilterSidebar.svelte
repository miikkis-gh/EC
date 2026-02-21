<script lang="ts">
	import { cn } from '$utils';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import * as Sheet from '$ui/sheet';
	import { Button } from '$ui/button';

	interface Props {
		collections: { id: string; title: string }[];
		categories?: { id: string; name: string }[];
		class?: string;
	}

	let { collections, categories = [], class: className }: Props = $props();
	let mobileOpen = $state(false);

	const currentSort = $derived($page.url.searchParams.get('sort') || 'newest');
	const selectedCollections = $derived(
		$page.url.searchParams.getAll('collection_id')
	);
	const selectedCategories = $derived(
		$page.url.searchParams.getAll('category_id')
	);
	const currentQuery = $derived($page.url.searchParams.get('q') || '');
	const currentPriceMin = $derived($page.url.searchParams.get('price_min') || '');
	const currentPriceMax = $derived($page.url.searchParams.get('price_max') || '');

	let searchInput = $state('');
	let priceMinInput = $state('');
	let priceMaxInput = $state('');
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let priceDebounceTimer: ReturnType<typeof setTimeout> | undefined;

	// Sync inputs with URL on navigation
	$effect(() => {
		searchInput = currentQuery;
	});

	$effect(() => {
		priceMinInput = currentPriceMin;
	});

	$effect(() => {
		priceMaxInput = currentPriceMax;
	});

	function updateParams(updates: Record<string, string | string[] | null>) {
		const params = new URLSearchParams($page.url.searchParams);
		// Reset page when filtering
		params.delete('page');

		for (const [key, value] of Object.entries(updates)) {
			params.delete(key);
			if (value === null) continue;
			if (Array.isArray(value)) {
				value.forEach((v) => params.append(key, v));
			} else {
				params.set(key, value);
			}
		}

		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}

	function handleSortChange(e: Event) {
		const value = (e.target as HTMLSelectElement).value;
		updateParams({ sort: value === 'newest' ? null : value });
	}

	function toggleCollection(id: string) {
		const current = [...selectedCollections];
		const index = current.indexOf(id);
		if (index >= 0) {
			current.splice(index, 1);
		} else {
			current.push(id);
		}
		updateParams({ collection_id: current.length > 0 ? current : null });
	}

	function toggleCategory(id: string) {
		const current = [...selectedCategories];
		const index = current.indexOf(id);
		if (index >= 0) {
			current.splice(index, 1);
		} else {
			current.push(id);
		}
		updateParams({ category_id: current.length > 0 ? current : null });
	}

	function handleSearchInput(e: Event) {
		const value = (e.target as HTMLInputElement).value;
		searchInput = value;

		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			updateParams({ q: value.trim() || null });
		}, 300);
	}

	function handlePriceInput(field: 'price_min' | 'price_max', e: Event) {
		const value = (e.target as HTMLInputElement).value;
		if (field === 'price_min') priceMinInput = value;
		else priceMaxInput = value;

		clearTimeout(priceDebounceTimer);
		priceDebounceTimer = setTimeout(() => {
			updateParams({ [field]: value.trim() || null });
		}, 500);
	}

	function clearSearch() {
		searchInput = '';
		clearTimeout(debounceTimer);
		updateParams({ q: null });
	}

	function clearAll() {
		searchInput = '';
		priceMinInput = '';
		priceMaxInput = '';
		clearTimeout(debounceTimer);
		clearTimeout(priceDebounceTimer);
		updateParams({ sort: null, collection_id: null, category_id: null, q: null, price_min: null, price_max: null });
	}

	const hasFilters = $derived(
		currentSort !== 'newest' ||
		selectedCollections.length > 0 ||
		selectedCategories.length > 0 ||
		currentQuery.length > 0 ||
		currentPriceMin.length > 0 ||
		currentPriceMax.length > 0
	);
</script>

{#snippet filterContent()}
	<div class="space-y-6">
		<!-- Search -->
		<div>
			<label for="search-input" class="mb-2 block text-sm font-semibold text-neutral-900">Search</label>
			<div class="relative">
				<input
					id="search-input"
					type="text"
					value={searchInput}
					oninput={handleSearchInput}
					placeholder="Search products..."
					class="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-8 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
				/>
				<svg class="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
				{#if searchInput}
					<button
						onclick={clearSearch}
						class="absolute right-2 top-2.5 text-neutral-400 hover:text-neutral-600"
						aria-label="Clear search"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
		</div>

		<!-- Sort -->
		<div>
			<label for="sort-select" class="mb-2 block text-sm font-semibold text-neutral-900">Sort by</label>
			<select
				id="sort-select"
				value={currentSort}
				onchange={handleSortChange}
				class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
			>
				<option value="newest">Newest</option>
				<option value="price_asc">Price: Low to High</option>
				<option value="price_desc">Price: High to Low</option>
				<option value="title_asc">Name: A–Z</option>
			</select>
		</div>

		<!-- Price Range -->
		<div>
			<h3 class="mb-2 text-sm font-semibold text-neutral-900">Price Range</h3>
			<div class="flex items-center gap-2">
				<input
					type="number"
					value={priceMinInput}
					oninput={(e) => handlePriceInput('price_min', e)}
					placeholder="Min"
					min="0"
					step="1"
					class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
				/>
				<span class="text-neutral-400">–</span>
				<input
					type="number"
					value={priceMaxInput}
					oninput={(e) => handlePriceInput('price_max', e)}
					placeholder="Max"
					min="0"
					step="1"
					class="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
				/>
			</div>
		</div>

		<!-- Collections -->
		{#if collections.length > 0}
			<div>
				<h3 class="mb-2 text-sm font-semibold text-neutral-900">Collections</h3>
				<div class="space-y-2">
					{#each collections as collection (collection.id)}
						<label class="flex items-center gap-2 text-sm text-neutral-700">
							<input
								type="checkbox"
								checked={selectedCollections.includes(collection.id)}
								onchange={() => toggleCollection(collection.id)}
								class="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
							/>
							{collection.title}
						</label>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Categories -->
		{#if categories.length > 0}
			<div>
				<h3 class="mb-2 text-sm font-semibold text-neutral-900">Categories</h3>
				<div class="space-y-2">
					{#each categories as category (category.id)}
						<label class="flex items-center gap-2 text-sm text-neutral-700">
							<input
								type="checkbox"
								checked={selectedCategories.includes(category.id)}
								onchange={() => toggleCategory(category.id)}
								class="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
							/>
							{category.name}
						</label>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Clear -->
		{#if hasFilters}
			<Button variant="ghost" size="sm" onclick={clearAll} class="w-full">
				Clear all filters
			</Button>
		{/if}
	</div>
{/snippet}

<!-- Desktop sidebar -->
<aside class={cn('hidden lg:block lg:w-64 lg:flex-shrink-0', className)}>
	<div class="sticky top-24">
		{@render filterContent()}
	</div>
</aside>

<!-- Mobile trigger + Sheet -->
<div class="lg:hidden">
	<Button variant="outline" size="sm" onclick={() => mobileOpen = true}>
		<svg class="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
		</svg>
		Filters
	</Button>
</div>

<Sheet.Root bind:open={mobileOpen}>
	<Sheet.Content side="left" class="w-72 lg:hidden">
		<Sheet.Header class="border-b border-neutral-200 px-4">
			<Sheet.Title class="font-heading text-lg font-bold">Filters</Sheet.Title>
		</Sheet.Header>
		<div class="p-4">
			{@render filterContent()}
		</div>
	</Sheet.Content>
</Sheet.Root>

<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	interface SearchHit {
		id: string;
		title: string;
		handle: string;
		description: string;
		thumbnail: string | null;
		collection_title: string | null;
	}

	let { open, onclose }: Props = $props();
	let query = $state('');
	let hits = $state<SearchHit[]>([]);
	let loading = $state(false);
	let searched = $state(false);
	let debounceTimer: ReturnType<typeof setTimeout> | undefined;
	let inputEl = $state<HTMLInputElement | undefined>();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function handleInput() {
		clearTimeout(debounceTimer);
		const q = query.trim();

		if (!q) {
			hits = [];
			searched = false;
			loading = false;
			return;
		}

		loading = true;
		debounceTimer = setTimeout(async () => {
			try {
				const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=8`);
				if (res.ok) {
					const data = await res.json();
					hits = data.hits;
				} else {
					hits = [];
				}
			} catch {
				hits = [];
			} finally {
				loading = false;
				searched = true;
			}
		}, 300);
	}

	function handleResultClick() {
		query = '';
		hits = [];
		searched = false;
		onclose();
	}

	$effect(() => {
		if (open && inputEl) {
			inputEl.focus();
		}
		if (!open) {
			query = '';
			hits = [];
			searched = false;
			loading = false;
			clearTimeout(debounceTimer);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
		<button class="absolute inset-0 w-full h-full" onclick={onclose} aria-label="Close search"></button>

		<!-- Search Panel -->
		<div class="mx-auto mt-20 max-w-xl px-4 relative">
			<div class="overflow-hidden rounded-2xl bg-white shadow-2xl">
				<div class="flex items-center border-b border-neutral-200 px-4">
					<svg class="h-5 w-5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
					</svg>
					<input
						bind:this={inputEl}
						type="text"
						bind:value={query}
						oninput={handleInput}
						placeholder="Search products..."
						class="w-full border-0 px-4 py-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0"
					/>
					{#if loading}
						<div class="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600"></div>
					{:else}
						<button
							onclick={onclose}
							class="text-xs text-neutral-400 hover:text-neutral-600 shrink-0"
						>
							ESC
						</button>
					{/if}
				</div>

				<!-- Results area -->
				<div class="max-h-96 overflow-y-auto">
					{#if hits.length > 0}
						<ul class="divide-y divide-neutral-100">
							{#each hits as hit}
								<li>
									<a
										href="/products/{hit.handle}"
										onclick={handleResultClick}
										class="flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 transition-colors"
									>
										{#if hit.thumbnail}
											<img
												src={hit.thumbnail}
												alt={hit.title}
												class="h-12 w-12 rounded-lg object-cover bg-neutral-100"
											/>
										{:else}
											<div class="h-12 w-12 rounded-lg bg-neutral-100 flex items-center justify-center">
												<svg class="h-5 w-5 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
												</svg>
											</div>
										{/if}
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium text-neutral-900 truncate">{hit.title}</p>
											{#if hit.collection_title}
												<p class="text-xs text-neutral-500 truncate">{hit.collection_title}</p>
											{/if}
										</div>
										<svg class="h-4 w-4 text-neutral-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
										</svg>
									</a>
								</li>
							{/each}
						</ul>
					{:else if searched && query.trim().length > 0}
						<div class="px-4 py-8">
							<p class="text-center text-sm text-neutral-500">
								No results for "<span class="font-medium">{query}</span>"
							</p>
							<p class="mt-1 text-center text-xs text-neutral-400">
								Try browsing our <a href="/products" onclick={handleResultClick} class="text-primary-600 hover:text-primary-700">products</a>.
							</p>
						</div>
					{:else if !query.trim()}
						<div class="px-4 py-6">
							<p class="text-center text-sm text-neutral-400">Start typing to search...</p>
						</div>
					{/if}
				</div>
			</div>

			<!-- Keyboard hint -->
			<div class="mt-2 flex justify-center">
				<span class="text-xs text-white/60">
					<kbd class="rounded border border-white/20 px-1.5 py-0.5 text-[10px]">↵</kbd> to select
					<kbd class="ml-2 rounded border border-white/20 px-1.5 py-0.5 text-[10px]">ESC</kbd> to close
				</span>
			</div>
		</div>
	</div>
{/if}

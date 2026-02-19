<script lang="ts">
	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open, onclose }: Props = $props();
	let query = $state('');

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm">
		<button class="absolute inset-0" onclick={onclose} aria-label="Close search"></button>

		<!-- Search Panel -->
		<div class="mx-auto mt-20 max-w-xl px-4">
			<div class="overflow-hidden rounded-2xl bg-white shadow-2xl">
				<div class="flex items-center border-b border-neutral-200 px-4">
					<svg class="h-5 w-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
					</svg>
					<input
						type="text"
						bind:value={query}
						placeholder="Search products..."
						class="w-full border-0 px-4 py-4 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-0"
					/>
					<button
						onclick={onclose}
						class="text-xs text-neutral-400 hover:text-neutral-600"
					>
						ESC
					</button>
				</div>

				<!-- Results area — TODO: integrate Meilisearch in Phase 8 -->
				<div class="p-4">
					{#if query.length > 0}
						<p class="text-center text-sm text-neutral-500">
							Search will be available soon. Try browsing our
							<a href="/products" onclick={onclose} class="text-primary-600 hover:text-primary-700">products</a>.
						</p>
					{:else}
						<p class="text-center text-sm text-neutral-400">Start typing to search...</p>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}

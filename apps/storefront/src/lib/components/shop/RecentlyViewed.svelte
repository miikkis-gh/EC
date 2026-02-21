<script lang="ts">
	import { recentlyViewed } from '$stores/recently-viewed';
	import { formatPrice } from '$utils/format';

	interface Props {
		currentProductId?: string;
	}

	let { currentProductId }: Props = $props();

	const items = $derived(
		currentProductId
			? $recentlyViewed.filter((item) => item.id !== currentProductId)
			: $recentlyViewed
	);
</script>

{#if items.length > 0}
	<section class="mt-16">
		<h2 class="font-heading text-2xl font-bold text-neutral-900">Recently Viewed</h2>
		<div class="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
			{#each items as item (item.id)}
				<a
					href="/products/{item.handle}"
					class="group flex w-40 shrink-0 flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white transition-shadow hover:shadow-md"
				>
					<div class="aspect-square overflow-hidden bg-neutral-100">
						{#if item.thumbnail}
							<img
								src={item.thumbnail}
								alt={item.title}
								class="h-full w-full object-cover transition-transform group-hover:scale-105"
								loading="lazy"
							/>
						{:else}
							<div class="flex h-full items-center justify-center text-neutral-400">
								<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
								</svg>
							</div>
						{/if}
					</div>
					<div class="p-3">
						<h3 class="truncate text-xs font-medium text-neutral-900 group-hover:text-primary-600">
							{item.title}
						</h3>
						<span class="mt-1 block text-xs font-semibold text-neutral-700">
							{formatPrice(item.price, item.currencyCode)}
						</span>
					</div>
				</a>
			{/each}
		</div>
	</section>
{/if}

<style>
	.scrollbar-thin {
		scrollbar-width: thin;
		scrollbar-color: theme('colors.neutral.300') transparent;
	}
</style>

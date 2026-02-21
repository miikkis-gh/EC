<script lang="ts">
	import { cn } from '$utils';

	interface Props {
		rating: number;
		count?: number;
		size?: 'sm' | 'md';
		clickable?: boolean;
		class?: string;
	}

	let { rating, count, size = 'md', clickable = false, class: className }: Props = $props();

	const sizeClass = $derived(size === 'sm' ? 'h-4 w-4' : 'h-5 w-5');
	const stars = $derived(
		Array.from({ length: 5 }, (_, i) => {
			const fill = Math.min(1, Math.max(0, rating - i));
			return fill;
		})
	);

	function scrollToReviews() {
		document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

{#snippet starContent()}
	{#each stars as fill, i (i)}
		{#if fill >= 1}
			<svg class={cn(sizeClass, 'text-amber-400')} viewBox="0 0 20 20" fill="currentColor">
				<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
			</svg>
		{:else if fill > 0}
			<div class={cn(sizeClass, 'relative')}>
				<svg class="absolute inset-0 h-full w-full text-neutral-300" viewBox="0 0 20 20" fill="currentColor">
					<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
				</svg>
				<div class="absolute inset-0 overflow-hidden" style="width: {fill * 100}%">
					<svg class="h-full w-full text-amber-400" style="width: {size === 'sm' ? '1rem' : '1.25rem'}" viewBox="0 0 20 20" fill="currentColor">
						<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
					</svg>
				</div>
			</div>
		{:else}
			<svg class={cn(sizeClass, 'text-neutral-300')} viewBox="0 0 20 20" fill="currentColor">
				<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
			</svg>
		{/if}
	{/each}
	{#if count != null}
		{#if count === 0}
			<span class="ml-1 text-sm text-neutral-500">No reviews yet</span>
		{:else}
			<span class="ml-1 text-sm text-neutral-500">({count})</span>
		{/if}
	{/if}
{/snippet}

{#if clickable}
	<button
		type="button"
		onclick={scrollToReviews}
		class={cn('flex items-center gap-0.5 cursor-pointer', className)}
	>
		{@render starContent()}
	</button>
{:else}
	<div class={cn('flex items-center gap-0.5', className)}>
		{@render starContent()}
	</div>
{/if}

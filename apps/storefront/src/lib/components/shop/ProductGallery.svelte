<script lang="ts">
	import { cn } from '$utils';

	interface Props {
		images: { id: string; url: string }[];
		thumbnail: string | null;
		alt: string;
	}

	let { images, thumbnail, alt }: Props = $props();
	let selectedIndex = $state(0);

	const allImages = $derived(() => {
		if (images.length > 0) return images;
		if (thumbnail) return [{ id: 'thumb', url: thumbnail }];
		return [];
	});

	const currentImage = $derived(allImages()[selectedIndex] ?? null);

	function handleKeydown(e: KeyboardEvent) {
		const imgs = allImages();
		if (e.key === 'ArrowLeft' && selectedIndex > 0) {
			selectedIndex--;
		} else if (e.key === 'ArrowRight' && selectedIndex < imgs.length - 1) {
			selectedIndex++;
		}
	}
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions a11y_no_noninteractive_tabindex -->
<div class="space-y-4" onkeydown={handleKeydown} tabindex="0" role="region" aria-label="Product images">
	<!-- Main image -->
	<div class="aspect-square overflow-hidden rounded-2xl bg-neutral-100">
		{#if currentImage}
			<img
				src={currentImage.url}
				{alt}
				class="h-full w-full object-cover"
			/>
		{:else}
			<div class="flex h-full items-center justify-center text-neutral-400">
				<svg class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
				</svg>
			</div>
		{/if}
	</div>

	<!-- Thumbnail grid -->
	{#if allImages().length > 1}
		<div class="grid grid-cols-4 gap-2">
			{#each allImages() as image, i (image.id)}
				<button
					onclick={() => selectedIndex = i}
					class={cn(
						'aspect-square overflow-hidden rounded-lg bg-neutral-100 transition-all',
						i === selectedIndex ? 'ring-2 ring-primary-600 ring-offset-2' : 'hover:opacity-80'
					)}
					aria-label="View image {i + 1}"
				>
					<img
						src={image.url}
						{alt}
						class="h-full w-full object-cover"
						loading="lazy"
					/>
				</button>
			{/each}
		</div>
	{/if}
</div>

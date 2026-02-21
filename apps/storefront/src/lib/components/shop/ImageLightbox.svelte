<script lang="ts">
	import * as Dialog from '$ui/dialog';

	interface Props {
		images: { id: string; url: string }[];
		alt: string;
		open: boolean;
		startIndex?: number;
		onclose: () => void;
	}

	let { images, alt, open = $bindable(), startIndex = 0, onclose }: Props = $props();
	let currentIndex = $state(startIndex);
	let touchStartX = $state(0);

	$effect(() => {
		if (open) currentIndex = startIndex;
	});

	function prev() {
		currentIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
	}

	function next() {
		currentIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
		else if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
	}

	function handleTouchEnd(e: TouchEvent) {
		const delta = e.changedTouches[0].clientX - touchStartX;
		if (Math.abs(delta) > 50) {
			if (delta > 0) prev();
			else next();
		}
	}

	function handleClose(isOpen: boolean) {
		if (!isOpen) onclose();
	}
</script>

<Dialog.Root bind:open onOpenChange={handleClose}>
	<Dialog.Content
		showCloseButton={false}
		class="max-w-[95vw] max-h-[95vh] w-auto border-0 bg-black/95 p-0 sm:max-w-[95vw]"
	>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="relative flex h-[90vh] items-center justify-center"
			onkeydown={handleKeydown}
			ontouchstart={handleTouchStart}
			ontouchend={handleTouchEnd}
			tabindex="-1"
			role="dialog"
			aria-label="Image lightbox"
		>
			<!-- Close button -->
			<button
				onclick={() => { open = false; onclose(); }}
				class="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
				aria-label="Close lightbox"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>

			<!-- Counter -->
			{#if images.length > 1}
				<div class="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm text-white/80">
					{currentIndex + 1} / {images.length}
				</div>
			{/if}

			<!-- Previous button -->
			{#if images.length > 1}
				<button
					onclick={prev}
					class="absolute left-3 z-10 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
					aria-label="Previous image"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
					</svg>
				</button>
			{/if}

			<!-- Image -->
			{#if images[currentIndex]}
				<img
					src={images[currentIndex].url}
					alt="{alt} — image {currentIndex + 1}"
					class="max-h-[85vh] max-w-[90vw] object-contain"
				/>
			{/if}

			<!-- Next button -->
			{#if images.length > 1}
				<button
					onclick={next}
					class="absolute right-3 z-10 rounded-full bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
					aria-label="Next image"
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
					</svg>
				</button>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

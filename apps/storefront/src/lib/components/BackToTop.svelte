<script lang="ts">
	import { fade } from 'svelte/transition';

	let visible = $state(false);

	function handleScroll() {
		visible = window.scrollY > 400;
	}

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<svelte:window onscroll={handleScroll} />

{#if visible}
	<button
		onclick={scrollToTop}
		class="fixed bottom-6 right-6 z-40 rounded-full border border-neutral-200 bg-white p-3 text-neutral-600 shadow-lg transition-all hover:bg-neutral-50 hover:text-neutral-900"
		aria-label="Back to top"
		transition:fade={{ duration: 200 }}
	>
		<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
		</svg>
	</button>
{/if}

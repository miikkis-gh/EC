<script lang="ts">
	import { decode } from 'blurhash';
	import { cloudinarySrcset } from '$utils/cloudinary';

	interface Props {
		src: string;
		alt: string;
		blurhash?: string;
		width: number;
		height: number;
		class?: string;
		sizes?: string;
		loading?: 'lazy' | 'eager';
	}

	let {
		src,
		alt,
		blurhash,
		width,
		height,
		class: className = '',
		sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw',
		loading = 'lazy'
	}: Props = $props();

	let loaded = $state(false);
	let canvas: HTMLCanvasElement | undefined = $state();

	const srcset = $derived(cloudinarySrcset(src));

	$effect(() => {
		if (canvas && blurhash) {
			try {
				const pixels = decode(blurhash, 32, 32);
				const ctx = canvas.getContext('2d');
				if (ctx) {
					const imageData = ctx.createImageData(32, 32);
					imageData.data.set(pixels);
					ctx.putImageData(imageData, 0, 0);
				}
			} catch {
				// Invalid blurhash, silently ignore
			}
		}
	});

	function onload() {
		loaded = true;
	}
</script>

<div class="relative overflow-hidden {className}" style="aspect-ratio: {width}/{height};">
	{#if blurhash}
		<canvas
			bind:this={canvas}
			width="32"
			height="32"
			class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
			class:opacity-0={loaded}
			aria-hidden="true"
		></canvas>
	{:else}
		<div
			class="absolute inset-0 bg-neutral-100 transition-opacity duration-500"
			class:opacity-0={loaded}
		></div>
	{/if}
	<img
		{src}
		srcset={srcset || undefined}
		{sizes}
		{alt}
		{width}
		{height}
		{loading}
		{onload}
		class="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
		class:opacity-0={!loaded}
	/>
</div>

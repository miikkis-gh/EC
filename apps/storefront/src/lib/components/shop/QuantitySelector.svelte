<script lang="ts">
	interface Props {
		quantity: number;
		onchange: (quantity: number) => void;
		min?: number;
		max?: number;
	}

	let { quantity, onchange, min = 1, max = 99 }: Props = $props();

	function decrement() {
		if (quantity > min) {
			onchange(quantity - 1);
		}
	}

	function increment() {
		if (quantity < max) {
			onchange(quantity + 1);
		}
	}
</script>

<div class="flex items-center rounded-lg border border-neutral-200">
	<button
		onclick={decrement}
		disabled={quantity <= min}
		class="flex h-8 w-8 items-center justify-center text-neutral-600 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300"
		aria-label="Decrease quantity"
	>
		<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M5 12h14" />
		</svg>
	</button>
	<span class="flex h-8 w-8 items-center justify-center text-sm font-medium">{quantity}</span>
	<button
		onclick={increment}
		disabled={quantity >= max}
		class="flex h-8 w-8 items-center justify-center text-neutral-600 transition-colors hover:text-neutral-900 disabled:cursor-not-allowed disabled:text-neutral-300"
		aria-label="Increase quantity"
	>
		<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
		</svg>
	</button>
</div>

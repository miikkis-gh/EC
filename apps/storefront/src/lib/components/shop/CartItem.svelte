<script lang="ts">
	import QuantitySelector from './QuantitySelector.svelte';
	import PriceDisplay from './PriceDisplay.svelte';
	import { updateCartItem, removeCartItem } from '$stores/cart';
	import { cartFlyIn } from '$utils/animations';
	import type { LineItem } from '$server/medusa';

	interface Props {
		item: LineItem;
		currencyCode: string;
	}

	let { item, currencyCode }: Props = $props();
	let updating = $state(false);
	let rowEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (rowEl) cartFlyIn(rowEl);
	});

	async function handleQuantityChange(quantity: number) {
		updating = true;
		try {
			await updateCartItem(item.id, quantity);
		} finally {
			updating = false;
		}
	}

	async function handleRemove() {
		updating = true;
		try {
			await removeCartItem(item.id);
		} finally {
			updating = false;
		}
	}
</script>

<div bind:this={rowEl} class="flex gap-4 py-4" class:opacity-50={updating}>
	<!-- Thumbnail -->
	<div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
		{#if item.thumbnail}
			<img src={item.thumbnail} alt={item.title} class="h-full w-full object-cover" />
		{:else}
			<div class="flex h-full items-center justify-center text-neutral-400">
				<svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
				</svg>
			</div>
		{/if}
	</div>

	<!-- Details -->
	<div class="flex flex-1 flex-col">
		<div class="flex justify-between">
			<div>
				<h4 class="text-sm font-medium text-neutral-900">{item.title}</h4>
				{#if item.description}
					<p class="mt-0.5 text-xs text-neutral-500">{item.description}</p>
				{/if}
			</div>
			<PriceDisplay
				amount={item.total ?? item.unit_price * item.quantity}
				{currencyCode}
				class="text-sm font-medium text-neutral-900"
			/>
		</div>

		<div class="mt-auto flex items-center justify-between pt-2">
			<QuantitySelector quantity={item.quantity} onchange={handleQuantityChange} />
			<button
				onclick={handleRemove}
				disabled={updating}
				class="text-xs text-neutral-500 transition-colors hover:text-red-600"
			>
				Remove
			</button>
		</div>
	</div>
</div>

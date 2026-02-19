<script lang="ts">
	import QuantitySelector from './QuantitySelector.svelte';
	import PriceDisplay from './PriceDisplay.svelte';
	import { updateCartItem, removeCartItem } from '$stores/cart';
	import type { LineItem } from '$server/medusa';

	interface Props {
		item: LineItem;
		currencyCode: string;
	}

	let { item, currencyCode }: Props = $props();
	let updating = $state(false);

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

<div class="flex gap-4 py-4" class:opacity-50={updating}>
	<!-- Thumbnail -->
	<div class="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
		{#if item.thumbnail}
			<img src={item.thumbnail} alt={item.title} class="h-full w-full object-cover" />
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
				amount={item.total}
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

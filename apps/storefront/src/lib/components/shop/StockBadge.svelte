<script lang="ts">
	interface Props {
		quantity: number;
		manageInventory: boolean;
		class?: string;
	}

	let { quantity, manageInventory, class: className = '' }: Props = $props();
</script>

{#if manageInventory}
	{#if quantity === 0}
		<span class="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 {className}">
			<span class="h-1.5 w-1.5 rounded-full bg-red-500"></span>
			Out of Stock
		</span>
	{:else if quantity <= 5}
		<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 {className}">
			<span class="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
			Only {quantity} left
		</span>
	{:else}
		<span class="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 {className}">
			<span class="h-1.5 w-1.5 rounded-full bg-green-500"></span>
			In Stock
		</span>
	{/if}
{/if}

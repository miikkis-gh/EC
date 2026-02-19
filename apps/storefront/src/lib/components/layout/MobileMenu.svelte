<script lang="ts">
	import * as Sheet from '$ui/sheet';

	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open = $bindable(), onclose }: Props = $props();

	function onOpenChange(value: boolean) {
		if (!value) onclose();
	}
</script>

<Sheet.Root bind:open {onOpenChange}>
	<Sheet.Content side="left" class="w-72 md:hidden">
		<Sheet.Header class="border-b border-neutral-200 px-4">
			<Sheet.Title class="font-heading text-lg font-bold">Menu</Sheet.Title>
		</Sheet.Header>

		<nav class="p-4">
			<ul class="space-y-1">
				<li>
					<a
						href="/products"
						onclick={onclose}
						class="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
					>
						Products
					</a>
				</li>
				<li>
					<a
						href="/collections"
						onclick={onclose}
						class="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
					>
						Collections
					</a>
				</li>
				<li class="border-t border-neutral-100 pt-2">
					<a
						href="/account"
						onclick={onclose}
						class="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
					>
						My Account
					</a>
				</li>
				<li>
					<a
						href="/cart"
						onclick={onclose}
						class="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
					>
						Cart
					</a>
				</li>
			</ul>
		</nav>
	</Sheet.Content>
</Sheet.Root>

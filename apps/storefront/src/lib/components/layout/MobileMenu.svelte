<script lang="ts">
	interface Props {
		open: boolean;
		onclose: () => void;
	}

	let { open, onclose }: Props = $props();
</script>

{#if open}
	<!-- Backdrop -->
	<div class="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm md:hidden">
		<button class="absolute inset-0" onclick={onclose} aria-label="Close menu"></button>

		<!-- Panel -->
		<div class="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
			<div class="flex h-16 items-center justify-between border-b border-neutral-200 px-4">
				<span class="font-heading text-lg font-bold">Menu</span>
				<button
					onclick={onclose}
					class="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100"
					aria-label="Close menu"
				>
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

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
		</div>
	</div>
{/if}

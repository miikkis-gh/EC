<script lang="ts">
	import * as Sheet from '$ui/sheet';
	import type { AuthUser } from '$server/auth';

	interface Props {
		user: AuthUser | null;
		collections: { id: string; title: string; handle: string }[];
		open: boolean;
		onclose: () => void;
	}

	let { user, collections, open = $bindable(), onclose }: Props = $props();
	let collectionsExpanded = $state(false);

	function onOpenChange(value: boolean) {
		if (!value) {
			onclose();
			collectionsExpanded = false;
		}
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
					{#if collections.length > 0}
						<button
							onclick={() => collectionsExpanded = !collectionsExpanded}
							class="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
							aria-expanded={collectionsExpanded}
						>
							Collections
							<svg
								class="h-4 w-4 transition-transform {collectionsExpanded ? 'rotate-180' : ''}"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="2"
								stroke="currentColor"
							>
								<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
							</svg>
						</button>
						{#if collectionsExpanded}
							<ul class="ml-3 space-y-1 border-l border-neutral-100 pl-3 pt-1">
								{#each collections as collection (collection.id)}
									<li>
										<a
											href="/collections/{collection.handle}"
											onclick={onclose}
											class="block rounded-lg px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
										>
											{collection.title}
										</a>
									</li>
								{/each}
								<li>
									<a
										href="/collections"
										onclick={onclose}
										class="block rounded-lg px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50"
									>
										View all
									</a>
								</li>
							</ul>
						{/if}
					{:else}
						<a
							href="/collections"
							onclick={onclose}
							class="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
						>
							Collections
						</a>
					{/if}
				</li>
				<li>
					<a
						href="/about"
						onclick={onclose}
						class="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
					>
						About
					</a>
				</li>
				<li>
					<a
						href="/blog"
						onclick={onclose}
						class="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
					>
						Blog
					</a>
				</li>
				<li>
					<a
						href="/contact"
						onclick={onclose}
						class="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
					>
						Contact
					</a>
				</li>
				<li class="border-t border-neutral-100 pt-2">
					{#if user}
						<a
							href="/account"
							onclick={onclose}
							class="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
						>
							My Account
						</a>
					{:else}
						<a
							href="/login"
							onclick={onclose}
							class="block rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
						>
							Sign in
						</a>
					{/if}
				</li>
				{#if user}
					<li>
						<form method="POST" action="/api/auth/logout">
							<button
								type="submit"
								class="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-neutral-700 hover:bg-neutral-100"
							>
								Sign out
							</button>
						</form>
					</li>
				{/if}
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

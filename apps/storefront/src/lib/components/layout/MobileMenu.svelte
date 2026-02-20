<script lang="ts">
	import * as Sheet from '$ui/sheet';
	import type { AuthUser } from '$server/auth';

	interface Props {
		user: AuthUser | null;
		open: boolean;
		onclose: () => void;
	}

	let { user, open = $bindable(), onclose }: Props = $props();

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

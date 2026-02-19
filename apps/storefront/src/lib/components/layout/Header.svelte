<script lang="ts">
	import { cartCount, openCart } from '$stores/cart';

	interface Props {
		onToggleMobileMenu: () => void;
		onToggleSearch: () => void;
	}

	let { onToggleMobileMenu, onToggleSearch }: Props = $props();
</script>

<header class="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-lg">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Logo -->
		<a href="/" class="font-heading text-xl font-bold tracking-tight text-neutral-900">
			EC1
		</a>

		<!-- Desktop Nav -->
		<nav class="hidden items-center gap-8 md:flex">
			<a
				href="/products"
				class="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
			>
				Products
			</a>
			<a
				href="/collections"
				class="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
			>
				Collections
			</a>
		</nav>

		<!-- Actions -->
		<div class="flex items-center gap-2">
			<!-- Search -->
			<button
				onclick={onToggleSearch}
				class="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
				aria-label="Search"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
				</svg>
			</button>

			<!-- Cart -->
			<button
				onclick={() => openCart()}
				class="relative rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
				aria-label="Open cart"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
				</svg>
				{#if $cartCount > 0}
					<span class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
						{$cartCount}
					</span>
				{/if}
			</button>

			<!-- Mobile menu toggle -->
			<button
				onclick={onToggleMobileMenu}
				class="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:hidden"
				aria-label="Toggle menu"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
				</svg>
			</button>
		</div>
	</div>
</header>

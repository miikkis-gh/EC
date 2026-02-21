<script lang="ts">
	import { cartCount, openCart } from '$stores/cart';
	import { wishlistCount } from '$stores/wishlist';
	import Navigation from '$components/layout/Navigation.svelte';
	import type { AuthUser } from '$server/auth';

	interface Props {
		user: AuthUser | null;
		collections: { id: string; title: string; handle: string }[];
		onToggleMobileMenu: () => void;
		onToggleSearch: () => void;
	}

	let { user, collections, onToggleMobileMenu, onToggleSearch }: Props = $props();
</script>

<header class="sticky top-0 z-40 border-b border-neutral-200 bg-white/80 backdrop-blur-lg">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Logo -->
		<a href="/" class="font-heading text-xl font-bold tracking-tight text-neutral-900">
			EC1
		</a>

		<!-- Desktop Nav -->
		<Navigation {collections} />

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

			<!-- User -->
			<a
				href={user ? '/account' : '/login'}
				class="rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
				aria-label={user ? 'My account' : 'Sign in'}
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
				</svg>
			</a>

			<!-- Wishlist -->
			<a
				href={user ? '/account/wishlist' : '/login'}
				class="relative rounded-lg p-2 text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
				aria-label="Wishlist"
			>
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
				</svg>
				{#if $wishlistCount > 0}
					<span class="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
						{$wishlistCount}
					</span>
				{/if}
			</a>

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

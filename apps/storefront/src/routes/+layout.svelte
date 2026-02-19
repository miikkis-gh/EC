<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/plus-jakarta-sans';
	import Header from '$components/layout/Header.svelte';
	import Footer from '$components/layout/Footer.svelte';
	import MobileMenu from '$components/layout/MobileMenu.svelte';
	import CartDrawer from '$components/shop/CartDrawer.svelte';
	import SearchOverlay from '$components/shop/SearchOverlay.svelte';
	import { Toaster } from '$ui/sonner';
	import { cart } from '$stores/cart';
	import { navigating } from '$app/stores';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Snippet } from 'svelte';
	import type { AuthUser } from '$server/auth';

	interface Props {
		data: { cart: import('$server/medusa').Cart | null; user: AuthUser | null };
		children: Snippet;
	}

	let { data, children }: Props = $props();
	let mobileMenuOpen = $state(false);
	let searchOpen = $state(false);

	// Initialize cart store from server data
	$effect(() => {
		if (data.cart) {
			cart.set(data.cart);
		}
	});

	// Initialize web vitals reporting
	onMount(() => {
		if (browser) {
			import('$utils/web-vitals').then(({ reportWebVitals }) => reportWebVitals());
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			searchOpen = !searchOpen;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<!-- Navigation loading bar -->
{#if $navigating}
	<div class="fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden bg-primary-100">
		<div class="h-full w-full animate-loading-bar bg-primary-600"></div>
	</div>
{/if}

<div class="flex min-h-screen flex-col">
	<Header
		user={data.user}
		onToggleMobileMenu={() => mobileMenuOpen = !mobileMenuOpen}
		onToggleSearch={() => searchOpen = !searchOpen}
	/>
	<MobileMenu
		user={data.user}
		open={mobileMenuOpen}
		onclose={() => mobileMenuOpen = false}
	/>
	<main class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>

<CartDrawer />
<SearchOverlay
	open={searchOpen}
	onclose={() => searchOpen = false}
/>
<Toaster richColors position="bottom-right" />

<style>
	@keyframes loading-bar {
		0% { transform: translateX(-100%); }
		50% { transform: translateX(0%); }
		100% { transform: translateX(100%); }
	}
	:global(.animate-loading-bar) {
		animation: loading-bar 1.2s ease-in-out infinite;
	}
</style>

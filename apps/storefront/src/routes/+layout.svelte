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
	import type { Snippet } from 'svelte';

	interface Props {
		data: { cart: import('$server/medusa').Cart | null };
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

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
			e.preventDefault();
			searchOpen = !searchOpen;
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="flex min-h-screen flex-col">
	<Header
		onToggleMobileMenu={() => mobileMenuOpen = !mobileMenuOpen}
		onToggleSearch={() => searchOpen = !searchOpen}
	/>
	<MobileMenu
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

<script lang="ts">
	import '../app.css';
	import '@fontsource-variable/inter';
	import '@fontsource-variable/plus-jakarta-sans';
	import Header from '$components/layout/Header.svelte';
	import Footer from '$components/layout/Footer.svelte';
	import MobileMenu from '$components/layout/MobileMenu.svelte';
	import CartDrawer from '$components/shop/CartDrawer.svelte';
	import SearchOverlay from '$components/shop/SearchOverlay.svelte';
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
</script>

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

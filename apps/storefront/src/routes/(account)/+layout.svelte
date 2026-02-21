<script lang="ts">
	import { page } from '$app/stores';
	import { Button } from '$ui/button';
	import { LayoutDashboard, Package, MapPin, Heart, Settings } from '@lucide/svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		data: {
			user: { id: string; email: string; medusaCustomerId: string | null };
			customer: import('$server/medusa').CustomerWithAddresses | null;
		};
		children: Snippet;
	}

	let { data, children }: Props = $props();

	const navItems = [
		{ href: '/account', label: 'Overview', icon: LayoutDashboard },
		{ href: '/account/orders', label: 'Orders', icon: Package },
		{ href: '/account/addresses', label: 'Addresses', icon: MapPin },
		{ href: '/account/wishlist', label: 'Wishlist', icon: Heart },
		{ href: '/account/settings', label: 'Settings', icon: Settings }
	];

	function isActive(href: string): boolean {
		const path = $page.url.pathname;
		if (href === '/account') return path === '/account';
		return path.startsWith(href);
	}
</script>

<svelte:head>
	<title>My Account — EC1</title>
</svelte:head>

<div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="font-heading text-3xl font-bold text-neutral-900">My Account</h1>
		<form method="POST" action="/api/auth/logout">
			<Button variant="outline" type="submit">Sign out</Button>
		</form>
	</div>

	<div class="flex flex-col gap-8 lg:flex-row">
		<!-- Sidebar nav -->
		<nav class="shrink-0 lg:w-52">
			<ul class="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-x-visible">
				{#each navItems as item (item.href)}
					{@const active = isActive(item.href)}
					<li>
						<a
							href={item.href}
							class="flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors {active
								? 'bg-neutral-900 text-white'
								: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'}"
						>
							<item.icon class="h-4 w-4" />
							{item.label}
						</a>
					</li>
				{/each}
			</ul>
		</nav>

		<!-- Content -->
		<div class="min-w-0 flex-1">
			{@render children()}
		</div>
	</div>
</div>

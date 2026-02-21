<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$utils';

	interface Props {
		collections: { id: string; title: string; handle: string }[];
	}

	let { collections }: Props = $props();

	let collectionsOpen = $state(false);
	let hoverTimeout: ReturnType<typeof setTimeout> | undefined;
	let closeTimeout: ReturnType<typeof setTimeout> | undefined;
	let triggerEl: HTMLAnchorElement | undefined = $state();

	function openDropdown() {
		clearTimeout(closeTimeout);
		hoverTimeout = setTimeout(() => {
			collectionsOpen = true;
		}, 100);
	}

	function closeDropdown() {
		clearTimeout(hoverTimeout);
		closeTimeout = setTimeout(() => {
			collectionsOpen = false;
		}, 150);
	}

	function toggleDropdown(e: MouseEvent) {
		e.preventDefault();
		collectionsOpen = !collectionsOpen;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			collectionsOpen = false;
			triggerEl?.focus();
		}
	}

	function closeOnFocusOut(e: FocusEvent) {
		const container = (e.currentTarget as HTMLElement);
		const relatedTarget = e.relatedTarget as Node | null;
		if (relatedTarget && container.contains(relatedTarget)) return;
		clearTimeout(hoverTimeout);
		collectionsOpen = false;
	}

	const navLinkClass = (href: string) =>
		cn(
			'text-sm font-medium transition-colors hover:text-neutral-900',
			$page.url.pathname === href || $page.url.pathname.startsWith(href + '/')
				? 'text-neutral-900'
				: 'text-neutral-600'
		);
</script>

<nav class="hidden items-center gap-8 md:flex" aria-label="Main">
	<a href="/products" class={navLinkClass('/products')}>Products</a>

	<!-- Collections dropdown -->
	{#if collections.length > 0}
		<div
			class="relative"
			onmouseenter={openDropdown}
			onmouseleave={closeDropdown}
			onkeydown={handleKeydown}
			onfocusout={closeOnFocusOut}
		>
			<a
				bind:this={triggerEl}
				href="/collections"
				class="{navLinkClass('/collections')} inline-flex items-center gap-1"
				aria-expanded={collectionsOpen}
				aria-haspopup="true"
				onclick={toggleDropdown}
			>
				Collections
				<svg
					class="h-3.5 w-3.5 transition-transform {collectionsOpen ? 'rotate-180' : ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
				</svg>
			</a>

			{#if collectionsOpen}
				<div
					class="absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 rounded-lg border border-neutral-200 bg-white p-4 shadow-lg"
				>
					<div class="grid w-max gap-1 {collections.length > 6 ? 'grid-cols-3' : collections.length > 3 ? 'grid-cols-2' : 'grid-cols-1'}" style="min-width: 12rem;">
						{#each collections as collection (collection.id)}
							<a
								href="/collections/{collection.handle}"
								class="rounded-md px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 whitespace-nowrap"
								onclick={() => collectionsOpen = false}
							>
								{collection.title}
							</a>
						{/each}
					</div>
					<div class="mt-2 border-t border-neutral-100 pt-2">
						<a
							href="/collections"
							class="block rounded-md px-3 py-2 text-sm font-medium text-primary-600 transition-colors hover:bg-primary-50 hover:text-primary-700"
							onclick={() => collectionsOpen = false}
						>
							View all collections
						</a>
					</div>
				</div>
			{/if}
		</div>
	{:else}
		<a href="/collections" class={navLinkClass('/collections')}>Collections</a>
	{/if}

	<a href="/about" class={navLinkClass('/about')}>About</a>
	<a href="/blog" class={navLinkClass('/blog')}>Blog</a>
	<a href="/contact" class={navLinkClass('/contact')}>Contact</a>
</nav>

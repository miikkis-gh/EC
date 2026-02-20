<script lang="ts">
	import { cn } from '$utils';

	interface Props {
		items: { label: string; href?: string }[];
		class?: string;
	}

	let { items, class: className }: Props = $props();

	const jsonLd = $derived(
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: items.map((item, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: item.label,
				...(item.href ? { item: item.href } : {})
			}))
		})
	);
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${jsonLd}</script>`}
</svelte:head>

<nav aria-label="Breadcrumb" class={cn('mb-6', className)}>
	<ol class="flex items-center gap-1.5 text-sm">
		{#each items as item, i (i)}
			{#if i > 0}
				<li aria-hidden="true">
					<svg class="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
					</svg>
				</li>
			{/if}
			<li>
				{#if item.href && i < items.length - 1}
					<a href={item.href} class="text-neutral-500 transition-colors hover:text-neutral-900">
						{item.label}
					</a>
				{:else}
					<span class="font-medium text-neutral-900">{item.label}</span>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

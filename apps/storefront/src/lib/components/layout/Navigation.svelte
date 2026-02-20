<script lang="ts">
	import { page } from '$app/stores';
	import { cn } from '$utils';

	interface Props {
		items: { label: string; href: string }[];
	}

	let { items }: Props = $props();
</script>

<nav class="hidden items-center gap-8 md:flex">
	{#each items as item (item.href)}
		<a
			href={item.href}
			class={cn(
				'text-sm font-medium transition-colors hover:text-neutral-900',
				$page.url.pathname.startsWith(item.href) ? 'text-neutral-900' : 'text-neutral-600'
			)}
		>
			{item.label}
		</a>
	{/each}
</nav>

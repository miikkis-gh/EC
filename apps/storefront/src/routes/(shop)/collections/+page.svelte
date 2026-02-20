<script lang="ts">
	import Breadcrumbs from '$components/shop/Breadcrumbs.svelte';
	import { fadeInUp } from '$utils/animations';

	interface Props {
		data: {
			collections: import('$server/medusa').Collection[];
		};
	}

	let { data }: Props = $props();
	let headingEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (headingEl) fadeInUp(headingEl);
	});
</script>

<svelte:head>
	<title>Collections — EC1</title>
	<meta name="description" content="Browse our curated collections." />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
	<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Collections' }]} />

	<h1 bind:this={headingEl} class="mb-8 font-heading text-3xl font-bold text-neutral-900">Collections</h1>

	{#if data.collections.length > 0}
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each data.collections as collection (collection.id)}
				<a
					href="/collections/{collection.handle}"
					class="group overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg"
				>
					<div class="aspect-[16/9] bg-neutral-100">
						<div class="flex h-full items-center justify-center">
							<span class="font-heading text-2xl font-bold text-neutral-300 transition-colors group-hover:text-primary-400">
								{collection.title}
							</span>
						</div>
					</div>
					<div class="p-6">
						<h2 class="font-heading text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
							{collection.title}
						</h2>
						<span class="mt-2 inline-block text-sm font-medium text-primary-600">
							Browse collection &rarr;
						</span>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="py-16 text-center">
			<p class="text-neutral-500">No collections available yet.</p>
			<a
				href="/products"
				class="mt-4 inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
			>
				Browse All Products
			</a>
		</div>
	{/if}
</div>

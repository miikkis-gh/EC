<script lang="ts">
	import Breadcrumbs from '$components/shop/Breadcrumbs.svelte';
	import { buildArticleJsonLd } from '$utils/seo';
	import { page } from '$app/stores';
	import type { SvelteComponent } from 'svelte';

	interface Props {
		data: {
			post: { title: string; date: string; excerpt: string };
			slug: string;
		};
	}

	let { data }: Props = $props();
	let siteUrl = $derived($page.data.siteUrl as string);
	let ContentComponent = $state<typeof SvelteComponent | null>(null);

	$effect(() => {
		const slug = data.slug;
		const modules = import.meta.glob('/src/content/blog/*.md');
		const loader = modules[`/src/content/blog/${slug}.md`];
		if (loader) {
			loader().then((mod) => {
				ContentComponent = (mod as { default: typeof SvelteComponent }).default;
			});
		}
	});

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	<title>{data.post.title} — EC1 Blog</title>
	{#if data.post.excerpt}
		<meta name="description" content={data.post.excerpt} />
	{/if}
	{@html `<script type="application/ld+json">${buildArticleJsonLd({ title: data.post.title, excerpt: data.post.excerpt, date: data.post.date, slug: data.slug }, siteUrl)}</script>`}
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
	<Breadcrumbs items={[
		{ label: 'Home', href: '/' },
		{ label: 'Blog', href: '/blog' },
		{ label: data.post.title }
	]} />

	<article>
		<time class="text-sm text-neutral-400">{formatDate(data.post.date)}</time>
		<h1 class="mt-2 font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
			{data.post.title}
		</h1>
		<div class="prose prose-neutral mt-8 max-w-none">
			{#if ContentComponent}
				<ContentComponent />
			{/if}
		</div>
	</article>

	<div class="mt-12 border-t border-neutral-200 pt-8">
		<a href="/blog" class="text-sm font-medium text-primary-600 hover:text-primary-700">
			&larr; Back to Blog
		</a>
	</div>
</div>

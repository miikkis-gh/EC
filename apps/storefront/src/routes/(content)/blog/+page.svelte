<script lang="ts">
	import { fadeInUp } from '$utils/animations';
	import type { BlogPost } from './+page.server';

	interface Props {
		data: {
			posts: BlogPost[];
		};
	}

	let { data }: Props = $props();
	let headingEl: HTMLElement | undefined = $state();

	$effect(() => {
		if (headingEl) fadeInUp(headingEl);
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
	<title>Blog — EC1</title>
	<meta name="description" content="Insights, stories, and tips from the EC1 team." />
</svelte:head>

<div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
	<div bind:this={headingEl} class="text-center">
		<h1 class="font-heading text-4xl font-bold tracking-tight text-neutral-900">Blog</h1>
		<p class="mx-auto mt-4 max-w-xl text-neutral-600">
			Insights, stories, and tips from our team.
		</p>
	</div>

	<div class="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
		{#each data.posts as post (post.slug)}
			<a href="/blog/{post.slug}" class="group">
				<article class="overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-shadow hover:shadow-lg">
					<!-- Placeholder image -->
					<div class="aspect-[16/9] bg-neutral-100">
						<div class="flex h-full items-center justify-center text-neutral-300">
							<svg class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke-width="1" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
							</svg>
						</div>
					</div>
					<div class="p-6">
						<time class="text-xs text-neutral-400">{formatDate(post.date)}</time>
						<h2 class="mt-2 font-heading text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
							{post.title}
						</h2>
						<p class="mt-2 text-sm text-neutral-600 line-clamp-2">{post.excerpt}</p>
						<span class="mt-4 inline-block text-sm font-medium text-primary-600">Read more &rarr;</span>
					</div>
				</article>
			</a>
		{/each}
	</div>
</div>

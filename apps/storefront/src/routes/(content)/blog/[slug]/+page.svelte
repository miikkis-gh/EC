<script lang="ts">
	import Breadcrumbs from '$components/shop/Breadcrumbs.svelte';
	import { page } from '$app/stores';

	const slug = $derived($page.params.slug);

	const posts: Record<string, { title: string; date: string; content: string }> = {
		'building-a-sustainable-wardrobe': {
			title: 'Building a Sustainable Wardrobe',
			date: '2026-02-10',
			content: `
				<p>In a world of fast fashion and disposable goods, building a sustainable wardrobe is one of the most impactful choices you can make. It's not about having fewer clothes — it's about having the right ones.</p>
				<h2>Start With the Basics</h2>
				<p>A sustainable wardrobe begins with versatile, high-quality staples. Think neutral colors that mix and match, durable fabrics that withstand regular wear, and timeless cuts that don't follow fleeting trends.</p>
				<h2>Quality Over Quantity</h2>
				<p>Instead of buying five cheap t-shirts that fall apart after a few washes, invest in two or three that are well-made. The cost per wear drops significantly, and you'll reduce your environmental impact along the way.</p>
				<h2>Care for What You Own</h2>
				<p>Extend the life of your clothes with proper care. Wash on cold, air dry when possible, and learn basic mending skills. A small repair can add years to a garment's life.</p>
			`
		},
		'the-art-of-minimalist-design': {
			title: 'The Art of Minimalist Design',
			date: '2026-01-28',
			content: `
				<p>Minimalist design isn't about making things plain or boring — it's about finding the essence of what makes a product beautiful and functional, then removing everything else.</p>
				<h2>Form Follows Function</h2>
				<p>The best minimalist products are those where every element serves a purpose. There's no decoration for decoration's sake. Each curve, edge, and material choice is intentional.</p>
				<h2>The Power of White Space</h2>
				<p>In design, what you leave out is just as important as what you include. Negative space gives the eye room to rest and draws attention to the elements that matter most.</p>
				<h2>Everyday Beauty</h2>
				<p>When products are thoughtfully designed, even everyday objects become sources of joy. A well-crafted mug, a perfectly balanced chair, a clean interface — these are the quiet pleasures of minimalist design.</p>
			`
		},
		'behind-the-scenes-product-curation': {
			title: 'Behind the Scenes: Product Curation',
			date: '2026-01-15',
			content: `
				<p>Ever wondered how products end up on EC1? Our curation process is a blend of research, instinct, and rigorous testing. Here's a peek behind the curtain.</p>
				<h2>Discovery</h2>
				<p>We're always on the lookout for emerging brands and independent makers. Trade shows, social media, word of mouth — our team casts a wide net to find products that stand out.</p>
				<h2>Evaluation</h2>
				<p>Every product goes through a hands-on review. We test for quality, durability, and design. We ask: Does this solve a real problem? Would we use it ourselves? Does it meet our standards?</p>
				<h2>The Final Selection</h2>
				<p>Only a fraction of the products we evaluate make it to the store. Our goal is a collection that feels intentional and cohesive — not an overwhelming marketplace of everything.</p>
			`
		}
	};

	const post = $derived(slug ? posts[slug] : undefined);

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}
</script>

<svelte:head>
	{#if post}
		<title>{post.title} — EC1 Blog</title>
	{:else}
		<title>Post Not Found — EC1 Blog</title>
	{/if}
</svelte:head>

<div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
	{#if post}
		<Breadcrumbs items={[
			{ label: 'Home', href: '/' },
			{ label: 'Blog', href: '/blog' },
			{ label: post.title }
		]} />

		<article>
			<time class="text-sm text-neutral-400">{formatDate(post.date)}</time>
			<h1 class="mt-2 font-heading text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
				{post.title}
			</h1>
			<div class="prose prose-neutral mt-8 max-w-none">
				{@html post.content}
			</div>
		</article>

		<div class="mt-12 border-t border-neutral-200 pt-8">
			<a href="/blog" class="text-sm font-medium text-primary-600 hover:text-primary-700">
				&larr; Back to Blog
			</a>
		</div>
	{:else}
		<div class="py-16 text-center">
			<h1 class="font-heading text-2xl font-bold text-neutral-900">Post not found</h1>
			<p class="mt-4 text-neutral-500">The blog post you're looking for doesn't exist.</p>
			<a
				href="/blog"
				class="mt-6 inline-block rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
			>
				Back to Blog
			</a>
		</div>
	{/if}
</div>

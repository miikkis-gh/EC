import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import type { SvelteComponent } from 'svelte';

export const load: PageServerLoad = async ({ params }) => {
	const modules = import.meta.glob('/src/content/blog/*.md', { eager: true });
	const filepath = `/src/content/blog/${params.slug}.md`;
	const mod = modules[filepath] as
		| { default: typeof SvelteComponent; metadata: Record<string, string> }
		| undefined;

	if (!mod) {
		throw error(404, 'Blog post not found');
	}

	return {
		post: {
			title: mod.metadata.title,
			date: mod.metadata.date,
			excerpt: mod.metadata.excerpt ?? ''
		},
		slug: params.slug
	};
};

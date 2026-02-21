import type { PageServerLoad } from './$types';

export interface BlogPost {
	slug: string;
	title: string;
	date: string;
	excerpt: string;
}

export const load: PageServerLoad = async () => {
	const modules = import.meta.glob('/src/content/blog/*.md', { eager: true });

	const posts: BlogPost[] = Object.entries(modules)
		.map(([filepath, mod]) => {
			const slug = filepath.split('/').pop()?.replace('.md', '') ?? '';
			const metadata = (mod as { metadata: Record<string, string> }).metadata;
			return {
				slug,
				title: metadata.title,
				date: metadata.date,
				excerpt: metadata.excerpt ?? ''
			};
		})
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return { posts };
};

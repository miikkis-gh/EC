export interface MetaTags {
	title: string;
	description?: string;
	image?: string;
	url?: string;
	type?: 'website' | 'product';
}

export function buildMetaTags(meta: MetaTags): Array<{ name?: string; property?: string; content: string }> {
	const tags: Array<{ name?: string; property?: string; content: string }> = [];

	if (meta.description) {
		tags.push({ name: 'description', content: meta.description });
	}

	// Open Graph
	tags.push({ property: 'og:title', content: meta.title });
	if (meta.description) {
		tags.push({ property: 'og:description', content: meta.description });
	}
	if (meta.image) {
		tags.push({ property: 'og:image', content: meta.image });
	}
	if (meta.url) {
		tags.push({ property: 'og:url', content: meta.url });
	}
	tags.push({ property: 'og:type', content: meta.type || 'website' });

	// Twitter Card
	tags.push({ name: 'twitter:card', content: meta.image ? 'summary_large_image' : 'summary' });
	tags.push({ name: 'twitter:title', content: meta.title });
	if (meta.description) {
		tags.push({ name: 'twitter:description', content: meta.description });
	}
	if (meta.image) {
		tags.push({ name: 'twitter:image', content: meta.image });
	}

	return tags;
}

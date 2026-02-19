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

// --- JSON-LD Structured Data ---

export function buildOrganizationJsonLd(siteUrl: string): string {
	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'EC1',
		url: siteUrl
	});
}

export function buildWebsiteJsonLd(siteUrl: string): string {
	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'EC1',
		url: siteUrl,
		potentialAction: {
			'@type': 'SearchAction',
			target: `${siteUrl}/products?q={search_term_string}`,
			'query-input': 'required name=search_term_string'
		}
	});
}

export function buildProductJsonLd(product: {
	title: string;
	description: string | null;
	handle: string;
	thumbnail: string | null;
	variants: Array<{
		calculated_price?: { calculated_amount: number; currency_code: string };
		prices: Array<{ amount: number; currency_code: string }>;
		inventory_quantity: number;
	}>;
}, siteUrl: string): string {
	const variant = product.variants[0];
	const price = variant?.calculated_price?.calculated_amount ?? variant?.prices?.[0]?.amount;
	const currency = variant?.calculated_price?.currency_code ?? variant?.prices?.[0]?.currency_code ?? 'EUR';
	const inStock = variant ? variant.inventory_quantity > 0 || !('manage_inventory' in variant) : true;

	return JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: product.title,
		description: product.description ?? undefined,
		image: product.thumbnail ?? undefined,
		url: `${siteUrl}/products/${product.handle}`,
		...(price != null
			? {
					offers: {
						'@type': 'Offer',
						price: (price / 100).toFixed(2),
						priceCurrency: currency.toUpperCase(),
						availability: inStock
							? 'https://schema.org/InStock'
							: 'https://schema.org/OutOfStock',
						url: `${siteUrl}/products/${product.handle}`
					}
				}
			: {})
	});
}

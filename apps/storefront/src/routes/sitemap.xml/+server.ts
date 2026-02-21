import type { RequestHandler } from './$types';
import { getProducts, getCollections } from '$server/medusa';
import type { Product, Collection } from '$server/medusa';
import { env } from '$env/dynamic/public';

const BASE_URL = env.PUBLIC_STORE_URL || 'http://localhost:5173';
const PAGE_SIZE = 100;

function escapeXml(str: string): string {
	return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function urlEntry(loc: string, lastmod?: string, priority?: string): string {
	let entry = `  <url>\n    <loc>${escapeXml(loc)}</loc>`;
	if (lastmod) entry += `\n    <lastmod>${lastmod.split('T')[0]}</lastmod>`;
	if (priority) entry += `\n    <priority>${priority}</priority>`;
	entry += '\n  </url>';
	return entry;
}

async function fetchAllProducts(): Promise<Product[]> {
	const all: Product[] = [];
	let offset = 0;

	while (true) {
		const data = await getProducts({ limit: PAGE_SIZE, offset });
		all.push(...data.products);
		if (all.length >= data.count || data.products.length < PAGE_SIZE) break;
		offset += PAGE_SIZE;
	}

	return all;
}

async function fetchAllCollections(): Promise<Collection[]> {
	const all: Collection[] = [];
	let offset = 0;

	while (true) {
		const data = await getCollections({ limit: PAGE_SIZE, offset });
		all.push(...data.collections);
		if (all.length >= data.count || data.collections.length < PAGE_SIZE) break;
		offset += PAGE_SIZE;
	}

	return all;
}

function loadBlogPosts(): Array<{ slug: string; date: string }> {
	const modules = import.meta.glob('/src/content/blog/*.md', { eager: true });
	return Object.entries(modules).map(([filepath, mod]) => {
		const slug = filepath.split('/').pop()?.replace('.md', '') ?? '';
		const metadata = (mod as { metadata: Record<string, string> }).metadata;
		return { slug, date: metadata.date };
	});
}

export const GET: RequestHandler = async () => {
	const [products, collections] = await Promise.all([
		fetchAllProducts(),
		fetchAllCollections()
	]);

	const blogPosts = loadBlogPosts();

	const staticPages = [
		urlEntry(BASE_URL, undefined, '1.0'),
		urlEntry(`${BASE_URL}/products`, undefined, '0.9'),
		urlEntry(`${BASE_URL}/collections`, undefined, '0.8'),
		urlEntry(`${BASE_URL}/about`, undefined, '0.5'),
		urlEntry(`${BASE_URL}/contact`, undefined, '0.5'),
		urlEntry(`${BASE_URL}/blog`, undefined, '0.6')
	];

	const collectionUrls = collections.map((c) =>
		urlEntry(`${BASE_URL}/collections/${c.handle}`, undefined, '0.7')
	);

	const productUrls = products.map((p) =>
		urlEntry(`${BASE_URL}/products/${p.handle}`, p.updated_at, '0.8')
	);

	const blogUrls = blogPosts.map((post) =>
		urlEntry(`${BASE_URL}/blog/${post.slug}`, post.date, '0.5')
	);

	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...staticPages,
		...collectionUrls,
		...productUrls,
		...blogUrls,
		'</urlset>'
	].join('\n');

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};

import type { RequestHandler } from './$types';
import { getProducts, getCollections } from '$server/medusa';
import { env } from '$env/dynamic/public';

const BASE_URL = env.PUBLIC_STORE_URL || 'http://localhost:5173';

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

export const GET: RequestHandler = async () => {
	const [productsData, collectionsData] = await Promise.all([
		getProducts({ limit: 1000 }),
		getCollections({ limit: 1000 })
	]);

	const staticPages = [
		urlEntry(BASE_URL, undefined, '1.0'),
		urlEntry(`${BASE_URL}/products`, undefined, '0.9'),
		urlEntry(`${BASE_URL}/collections`, undefined, '0.8')
	];

	const collectionUrls = collectionsData.collections.map((c) =>
		urlEntry(`${BASE_URL}/collections/${c.handle}`, undefined, '0.7')
	);

	const productUrls = productsData.products.map((p) =>
		urlEntry(`${BASE_URL}/products/${p.handle}`, p.updated_at, '0.8')
	);

	const xml = [
		'<?xml version="1.0" encoding="UTF-8"?>',
		'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
		...staticPages,
		...collectionUrls,
		...productUrls,
		'</urlset>'
	].join('\n');

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};

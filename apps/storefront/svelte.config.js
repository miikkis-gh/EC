import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { mdsvex } from 'mdsvex';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md']
		})
	],
	kit: {
		adapter: adapter(),
		alias: {
			$components: 'src/lib/components',
			$ui: 'src/lib/components/ui',
			$server: 'src/lib/server',
			$utils: 'src/lib/utils',
			$stores: 'src/lib/stores',
			$content: 'src/content'
		}
	}
};

export default config;

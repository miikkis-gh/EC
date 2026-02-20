import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		include: ['src/**/*.test.ts']
	},
	resolve: {
		alias: {
			$server: path.resolve('./src/lib/server'),
			$utils: path.resolve('./src/lib/utils'),
			$components: path.resolve('./src/lib/components'),
			$stores: path.resolve('./src/lib/stores')
		}
	}
});

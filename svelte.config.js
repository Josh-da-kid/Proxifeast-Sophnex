import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		version: {
			name: process.env.npm_package_version || Date.now().toString()
		},
		files: {
			serviceWorker: 'src/service-worker.ts'
		}
	}
};

export default config;

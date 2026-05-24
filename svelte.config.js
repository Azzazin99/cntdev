import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// https://svelte.dev/docs/kit/adapter-vercel
		adapter: adapter(),
		
		// Output configuration for static site
		paths: {
			// Use relative paths for assets
		},
		
		// Aliases for easier imports
		alias: {
			'$lib': 'src/lib',
			'$components': 'src/components',
			'$assets': 'static/assets'
		}
	}
};

export default config;
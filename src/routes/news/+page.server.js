import { loadNews } from '$lib/server/pageData';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	return { news: await loadNews() };
}

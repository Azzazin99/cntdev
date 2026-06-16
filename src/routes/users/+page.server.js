import { loadSiteItems } from '$lib/server/pageData';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	return { personnel: await loadSiteItems('personnel') };
}

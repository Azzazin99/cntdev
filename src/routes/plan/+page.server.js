import { loadSiteItems } from '$lib/server/pageData';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	return { plans: await loadSiteItems('plans') };
}

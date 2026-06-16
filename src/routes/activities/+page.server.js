import { loadActivities } from '$lib/server/pageData';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	return { activities: await loadActivities() };
}

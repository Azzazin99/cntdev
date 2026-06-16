import { loadActivities, loadNews } from '$lib/server/pageData';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const [newsAll, activitiesAll] = await Promise.all([loadNews(), loadActivities()]);
	return {
		news: newsAll.slice(0, 3),
		activities: activitiesAll.slice(0, 4)
	};
}

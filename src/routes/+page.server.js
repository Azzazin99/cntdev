import { loadActivities, loadNews, loadSiteItems } from '$lib/server/pageData';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	const [newsAll, activitiesAll, formsAll] = await Promise.all([
		loadNews(),
		loadActivities(),
		loadSiteItems('forms')
	]);
	return {
		news: newsAll.slice(0, 3),
		activities: activitiesAll.slice(0, 4),
		forms: formsAll
	};
}

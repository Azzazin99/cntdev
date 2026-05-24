import { sortByDate } from '$lib/utils';

/** @param {string} path */
async function fetchItems(path) {
	try {
		const res = await fetch(path);
		if (!res.ok) return [];
		const data = await res.json();
		const items = data.items ?? data;
		return sortByDate(Array.isArray(items) ? items : []);
	} catch (e) {
		console.error(`Error loading ${path}:`, e);
		return [];
	}
}

export function fetchNews() {
	return fetchItems('/api/news');
}

export function fetchActivities() {
	return fetchItems('/api/activities');
}

/** @param {string} key */
export async function fetchSiteList(key) {
	try {
		const res = await fetch(`/api/site-data/${key}`);
		if (!res.ok) return [];
		const data = await res.json();
		const items = data.items ?? data;
		return Array.isArray(items) ? items : [];
	} catch (e) {
		console.error(`Error loading site-data/${key}:`, e);
		return [];
	}
}

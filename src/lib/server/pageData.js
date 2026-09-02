import { listItems, getSiteList } from '$lib/server/contentStore';
import { sanitizeText } from '$lib/sanitizeText';
import { sortSiteItemsByOrder } from '$lib/sortSiteOrder';
import { sortByDate } from '$lib/utils';

/** @param {string} key @param {unknown[]} items */
function sanitizeItems(key, items) {
	return items.map((item) => {
		if (!item || typeof item !== 'object') return item;
		const row = /** @type {Record<string, unknown>} */ ({ ...item });
		if (key === 'personnel' && typeof row.name === 'string') {
			row.name = sanitizeText(row.name);
		} else if (typeof row.title === 'string') {
			row.title = sanitizeText(row.title);
		}
		return row;
	});
}

export async function loadNews() {
	const items = await listItems('news');
	return sortByDate(items);
}

export async function loadActivities() {
	const items = await listItems('activities');
	return sortByDate(items);
}

/** @param {'manuals' | 'knowledge' | 'plans' | 'forms' | 'personnel'} key */
export async function loadSiteItems(key) {
	let items = await listItems(key);
	if (!items || items.length === 0) {
		items = await getSiteList(key);
	}
	return sanitizeItems(key, sortSiteItemsByOrder(key, items));
}

export async function loadAuthority() {
	return getSiteList('authority');
}

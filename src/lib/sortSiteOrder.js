/** Higher sortOrder displays first (newest / manually dragged to top). */
export const SITE_REORDER_KEYS = new Set([
	'manuals',
	'knowledge',
	'plans',
	'forms',
	'personnel'
]);

/** @deprecated use SITE_REORDER_KEYS */
export const DOC_ORDER_KEYS = SITE_REORDER_KEYS;

/**
 * @param {string} key
 * @param {unknown[]} items
 */
export function sortSiteItemsByOrder(key, items) {
	const descending = SITE_REORDER_KEYS.has(key);
	return [...items].sort((a, b) => {
		const ao = Number(/** @type {{ sortOrder?: unknown }} */ (a)?.sortOrder) || 0;
		const bo = Number(/** @type {{ sortOrder?: unknown }} */ (b)?.sortOrder) || 0;
		return descending ? bo - ao : ao - bo;
	});
}

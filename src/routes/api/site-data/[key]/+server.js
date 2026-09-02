import { json, error } from '@sveltejs/kit';
import { requireEditor } from '$lib/server/authGuard';
import { validateDocumentLink } from '$lib/documentLink';
import {
	createItem,
	deleteItem,
	getSiteList,
	isFirestoreEnabled,
	listItems,
	saveImageFile,
	saveSiteList,
	updateItem
} from '$lib/server/contentStore';
import { sanitizeText } from '$lib/sanitizeText';
import { sortSiteItemsByOrder } from '$lib/sortSiteOrder';

const ITEM_COLLECTIONS = new Set(['manuals', 'knowledge', 'plans', 'forms', 'personnel']);
const BULK_KEYS = new Set(['authority']);

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

/** @param {unknown} e */
function toStorageMessage(e) {
	return e instanceof Error ? e.message : String(e);
}

/**
 * @param {string} key
 * @param {FormData} form
 * @param {Record<string, unknown> | undefined} existing
 */
async function buildItem(key, form, existing) {
	if (key === 'personnel') {
		const name = sanitizeText(form.get('name'));
		if (!name) throw error(400, 'กรุณาระบุชื่อ');

		let image = String(form.get('image') || existing?.image || '').trim();
		const imageFile = form.get('imageFile');
		if (imageFile instanceof File && imageFile.size > 0) {
			try {
				image = await saveImageFile('personnel', imageFile);
			} catch (e) {
				throw error(400, toStorageMessage(e));
			}
		}

		return {
			name,
			position: String(form.get('position') || '').trim(),
			phone: String(form.get('phone') || '').trim(),
			image,
			sortOrder: Number(existing?.sortOrder) || Date.now()
		};
	}

	const title = sanitizeText(form.get('title'));
	if (!title) throw error(400, 'กรุณาระบุหัวข้อ');

	const linkInput = String(form.get('link') || '').trim();
	const hasExistingLink =
		existing?.link && String(existing.link).trim() && String(existing.link).trim() !== '#';
	const linkCheck = validateDocumentLink(linkInput, { allowEmpty: Boolean(hasExistingLink) });
	if (!linkCheck.ok) {
		throw error(400, linkCheck.message);
	}
	const link =
		linkCheck.value ||
		String(existing?.link || '').trim() ||
		'#';

	return {
		title,
		link,
		sortOrder: Number(existing?.sortOrder) || Date.now()
	};
}

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	const key = params.key;
	if (ITEM_COLLECTIONS.has(key)) {
		let items = await listItems(/** @type {any} */ (key));
		if (!items || items.length === 0) {
			// Pre-migration fallback: read legacy site_data/{key} document
			items = await getSiteList(key);
		}
		return json({
			items: sanitizeItems(key, sortSiteItemsByOrder(key, items)),
			source: isFirestoreEnabled() ? 'firestore' : 'json'
		});
	}
	if (BULK_KEYS.has(key)) {
		const items = await getSiteList(key);
		return json({ items, source: isFirestoreEnabled() ? 'firestore' : 'json' });
	}
	throw error(400, 'รายการไม่รองรับ');
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request, locals }) {
	requireEditor(locals);
	const key = params.key;

	if (BULK_KEYS.has(key)) {
		const body = await request.json();
		if (!body || !Array.isArray(body.data)) throw error(400, 'ข้อมูลไม่ถูกต้อง');
		await saveSiteList(key, body.data);
		return json({ status: 'success', message: `บันทึก ${key} สำเร็จ` });
	}

	if (!ITEM_COLLECTIONS.has(key)) throw error(400, 'รายการไม่รองรับ');

	const form = await request.formData();
	const fields = await buildItem(key, form, undefined);
	const id = String(Date.now());
	await createItem(/** @type {any} */ (key), { ...fields, id });
	return json({ status: 'success', message: 'บันทึกข้อมูลเรียบร้อยแล้ว!', item: { ...fields, id } });
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ params, request, locals }) {
	requireEditor(locals);
	const key = params.key;
	if (!ITEM_COLLECTIONS.has(key)) throw error(400, 'รายการไม่รองรับ');

	const form = await request.formData();
	const id = String(form.get('id') || '').trim();
	if (!id) throw error(400, 'ต้องระบุ id');

	let all = await listItems(/** @type {any} */ (key));
	if (!all || all.length === 0) all = await getSiteList(key);
	const existing = all.find((i) => String(i.id) === id);
	if (!existing) throw error(404, `ไม่พบรายการ id ${id}`);

	const fields = await buildItem(key, form, existing);
	await updateItem(/** @type {any} */ (key), id, { ...existing, ...fields, id });
	return json({ status: 'success', message: 'อัปเดตข้อมูลเรียบร้อยแล้ว!' });
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ params, url, locals }) {
	requireEditor(locals);
	const key = params.key;
	if (!ITEM_COLLECTIONS.has(key)) throw error(400, 'รายการไม่รองรับ');

	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'ต้องระบุ id');
	await deleteItem(/** @type {any} */ (key), id);
	return json({ status: 'success', message: `ลบข้อมูล ID ${id} เรียบร้อยแล้ว` });
}

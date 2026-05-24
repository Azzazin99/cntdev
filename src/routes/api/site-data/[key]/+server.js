import { json, error } from '@sveltejs/kit';
import { requireEditor } from '$lib/server/authGuard';
import { getSiteList, isFirestoreEnabled, saveSiteList } from '$lib/server/contentStore';

const ALLOWED_KEYS = new Set([
	'manuals',
	'knowledge',
	'plans',
	'forms',
	'authority',
	'personnel'
]);

/** @type {import('./$types').RequestHandler} */
export async function GET({ params }) {
	if (!ALLOWED_KEYS.has(params.key)) throw error(400, 'รายการไม่รองรับ');
	const items = await getSiteList(params.key);
	return json({ items, source: isFirestoreEnabled() ? 'firestore' : 'json' });
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request, locals }) {
	if (!ALLOWED_KEYS.has(params.key)) throw error(400, 'รายการไม่รองรับ');
	requireEditor(locals);
	const body = await request.json();
	if (!body || !Array.isArray(body.data)) {
		throw error(400, 'ข้อมูลไม่ถูกต้อง');
	}
	await saveSiteList(params.key, body.data);
	return json({ status: 'success', message: `บันทึก ${params.key} สำเร็จ` });
}

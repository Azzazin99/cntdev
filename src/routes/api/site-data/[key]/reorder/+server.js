import { json, error } from '@sveltejs/kit';
import { requireEditor } from '$lib/server/authGuard';
import { reorderItems } from '$lib/server/contentStore';
import { SITE_REORDER_KEYS } from '$lib/sortSiteOrder';

/** @type {import('./$types').RequestHandler} */
export async function POST({ params, request, locals }) {
	requireEditor(locals);
	const key = params.key;
	if (!SITE_REORDER_KEYS.has(key)) {
		throw error(400, 'รองรับเฉพาะคู่มือ / ความรู้ / แผน / แบบฟอร์ม / บุคลากร');
	}

	let body;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'ข้อมูลไม่ถูกต้อง');
	}
	const orderedIds = body?.orderedIds;
	if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
		throw error(400, 'ต้องระบุ orderedIds');
	}
	const ids = orderedIds.map((id) => String(id).trim()).filter(Boolean);
	if (ids.length !== orderedIds.length) {
		throw error(400, 'orderedIds ไม่ถูกต้อง');
	}

	try {
		await reorderItems(/** @type {any} */ (key), ids);
	} catch (e) {
		throw error(400, e instanceof Error ? e.message : String(e));
	}

	return json({ status: 'success', message: 'บันทึกลำดับเรียบร้อยแล้ว' });
}

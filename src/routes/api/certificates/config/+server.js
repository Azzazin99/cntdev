import { json, error } from '@sveltejs/kit';
import { requireEditor } from '$lib/server/authGuard';
import {
	getCertificatesConfig,
	isFirestoreEnabled,
	saveCertificatesConfig
} from '$lib/server/certificatesConfig';

/** @param {string} url */
function isValidHttpUrl(url) {
	try {
		const u = new URL(url);
		return u.protocol === 'http:' || u.protocol === 'https:';
	} catch {
		return false;
	}
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const config = await getCertificatesConfig();
	return json({
		sheetUrl: config.sheetUrl,
		source: isFirestoreEnabled() ? 'firestore' : 'json'
	});
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	requireEditor(locals);
	const body = await request.json();
	const sheetUrl = String(body?.sheetUrl || '').trim();
	if (!sheetUrl) throw error(400, 'กรุณาระบุ URL');
	if (!isValidHttpUrl(sheetUrl)) throw error(400, 'URL ไม่ถูกต้อง (ต้องขึ้นต้นด้วย http:// หรือ https://)');

	const saved = await saveCertificatesConfig({ sheetUrl });
	return json({ status: 'success', message: 'บันทึกการตั้งค่าคลังเกียรติบัตรแล้ว', sheetUrl: saved.sheetUrl });
}

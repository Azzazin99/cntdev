import fs from 'node:fs/promises';
import path from 'node:path';
import { getFirestore, isFirestoreEnabled } from '$lib/server/firebaseAdmin';

export const DEFAULT_SHEET_URL =
	'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRZKKSC38bKraDDdDE5hjVGQtbr1e0inwEK63m73tJAnYaNNo_AbxbGX_IF__eEwRC7_JGB0-dQiDP/pub?output=csv';

const CONFIG_DOC_ID = 'certificates_config';
const JSON_PATH = path.join(process.cwd(), 'static', 'assets', 'data', 'certificates_config.json');

/** @returns {Promise<{ sheetUrl: string }>} */
export async function getCertificatesConfig() {
	const db = getFirestore();
	if (db) {
		const doc = await db.collection('site_data').doc(CONFIG_DOC_ID).get();
		if (doc.exists) {
			const data = doc.data();
			const sheetUrl = String(data?.sheetUrl || '').trim();
			if (sheetUrl) return { sheetUrl };
		}
		return { sheetUrl: DEFAULT_SHEET_URL };
	}

	try {
		const raw = await fs.readFile(JSON_PATH, 'utf8');
		const data = JSON.parse(raw);
		const sheetUrl = String(data?.sheetUrl || '').trim();
		return { sheetUrl: sheetUrl || DEFAULT_SHEET_URL };
	} catch {
		return { sheetUrl: DEFAULT_SHEET_URL };
	}
}

/** @param {{ sheetUrl: string }} config */
export async function saveCertificatesConfig(config) {
	const sheetUrl = String(config.sheetUrl || '').trim();
	if (!sheetUrl) {
		throw new Error('กรุณาระบุ URL ของ Google Sheet');
	}

	const db = getFirestore();
	if (db) {
		await db.collection('site_data').doc(CONFIG_DOC_ID).set({ sheetUrl });
		return { sheetUrl };
	}

	await fs.mkdir(path.dirname(JSON_PATH), { recursive: true });
	try {
		await fs.writeFile(JSON_PATH, JSON.stringify({ sheetUrl }, null, 4), 'utf8');
	} catch (e) {
		const err = /** @type {NodeJS.ErrnoException} */ (e);
		if (err.code === 'EROFS' || err.code === 'EPERM') {
			throw new Error(
				'ไม่สามารถบันทึกบน production ได้ — ตั้งค่า FIREBASE_SERVICE_ACCOUNT_JSON ใน Vercel'
			);
		}
		throw e;
	}
	return { sheetUrl };
}

export { isFirestoreEnabled };

import fs from 'node:fs/promises';
import path from 'node:path';
import { getFirestore, isFirestoreEnabled } from '$lib/server/firebaseAdmin';

export const DEFAULT_SHEET_URL =
	'https://script.google.com/macros/s/AKfycbzvsawMlvwvkr1-gyVIXVMht9i79aV3mljlUuIYhVajALuMBKpFROEsW5izrU7NvBle7w/exec';

const CONFIG_DOC_ID = 'certificates_config';
const JSON_PATH = path.join(process.cwd(), 'static', 'assets', 'data', 'certificates_config.json');

export async function getCertificatesConfig() {
	const db = getFirestore();
	if (db) {
		const doc = await db.collection('site_data').doc(CONFIG_DOC_ID).get();
		if (doc.exists) {
			const data = doc.data();
			let sheetUrl = String(data?.sheetUrl || '').trim();
			// Auto-migrate: If the saved URL is the old CSV format, force it to the new GAS URL
			// so the user can add certificates without errors.
			if (sheetUrl && !sheetUrl.includes('script.google.com')) {
				sheetUrl = DEFAULT_SHEET_URL;
			}
			if (sheetUrl) return { sheetUrl };
		}
		return { sheetUrl: DEFAULT_SHEET_URL };
	}

	try {
		const raw = await fs.readFile(JSON_PATH, 'utf8');
		const data = JSON.parse(raw);
		let sheetUrl = String(data?.sheetUrl || '').trim();
		if (sheetUrl && !sheetUrl.includes('script.google.com')) {
			sheetUrl = DEFAULT_SHEET_URL;
		}
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

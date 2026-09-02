import fs from 'node:fs/promises';
import path from 'node:path';
import { getFirestore, isFirestoreEnabled } from '$lib/server/firebaseAdmin';
import {
	DEFAULT_BANNER_ALT,
	DEFAULT_BANNER_IMAGE,
	DEFAULT_BANNER_LINK
} from '$lib/bannerDefaults';

export { DEFAULT_BANNER_ALT, DEFAULT_BANNER_IMAGE, DEFAULT_BANNER_LINK };

const CONFIG_DOC_ID = 'banner_config';
const JSON_PATH = path.join(process.cwd(), 'static', 'assets', 'data', 'banner_config.json');

/** @typedef {{ imageUrl: string; linkUrl: string; altText: string }} BannerConfig */

/** @returns {BannerConfig} */
export function defaultBannerConfig() {
	return {
		imageUrl: DEFAULT_BANNER_IMAGE,
		linkUrl: DEFAULT_BANNER_LINK,
		altText: DEFAULT_BANNER_ALT
	};
}

/** @param {unknown} data */
function normalizeBannerConfig(data) {
	const base = defaultBannerConfig();
	if (!data || typeof data !== 'object') return base;
	const row = /** @type {Record<string, unknown>} */ (data);
	const imageUrl = String(row.imageUrl || '').trim();
	const linkUrl = String(row.linkUrl || '').trim();
	const altText = String(row.altText || '').trim();
	return {
		imageUrl: imageUrl || base.imageUrl,
		linkUrl: linkUrl || base.linkUrl,
		altText: altText || base.altText
	};
}

/** @returns {Promise<BannerConfig>} */
export async function getBannerConfig() {
	const db = getFirestore();
	if (db) {
		const doc = await db.collection('site_data').doc(CONFIG_DOC_ID).get();
		if (doc.exists) {
			return normalizeBannerConfig(doc.data());
		}
		return defaultBannerConfig();
	}

	try {
		const raw = await fs.readFile(JSON_PATH, 'utf8');
		return normalizeBannerConfig(JSON.parse(raw));
	} catch {
		return defaultBannerConfig();
	}
}

/** @param {BannerConfig} config */
export async function saveBannerConfig(config) {
	const imageUrl = String(config.imageUrl || '').trim();
	const linkUrl = String(config.linkUrl || '').trim();
	const altText = String(config.altText || '').trim();

	if (!imageUrl) {
		throw new Error('กรุณาระบุรูปแบนเนอร์');
	}
	if (!altText) {
		throw new Error('กรุณาระบุข้อความ alt');
	}

	const payload = {
		imageUrl,
		linkUrl: linkUrl || DEFAULT_BANNER_LINK,
		altText
	};

	const db = getFirestore();
	if (db) {
		await db.collection('site_data').doc(CONFIG_DOC_ID).set(payload);
		return payload;
	}

	await fs.mkdir(path.dirname(JSON_PATH), { recursive: true });
	try {
		await fs.writeFile(JSON_PATH, JSON.stringify(payload, null, 4), 'utf8');
	} catch (e) {
		const err = /** @type {NodeJS.ErrnoException} */ (e);
		if (err.code === 'EROFS' || err.code === 'EPERM') {
			throw new Error(
				'ไม่สามารถบันทึกบน production ได้ — ตั้งค่า FIREBASE_SERVICE_ACCOUNT_JSON ใน Vercel'
			);
		}
		throw e;
	}
	return payload;
}

export { isFirestoreEnabled };

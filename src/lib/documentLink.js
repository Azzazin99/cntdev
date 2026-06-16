/**
 * @param {string} url
 * @param {{ allowEmpty?: boolean }} [opts]
 */
export function validateDocumentLink(url, opts = {}) {
	const trimmed = String(url || '').trim();
	if (!trimmed || trimmed === '#') {
		if (opts.allowEmpty) return { ok: true, message: '', value: trimmed };
		return { ok: false, message: 'กรุณาวางลิงก์เอกสาร (เช่น Google Drive)', value: '' };
	}
	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
			return { ok: false, message: 'ลิงก์ต้องขึ้นต้นด้วย http:// หรือ https://', value: trimmed };
		}
	} catch {
		return { ok: false, message: 'รูปแบบลิงก์ไม่ถูกต้อง', value: trimmed };
	}
	return { ok: true, message: '', value: trimmed };
}

/** @param {string} url */
export function normalizeDocumentLink(url) {
	return String(url || '').trim();
}

/**
 * @param {string} url
 * @returns {string | null}
 */
export function extractGoogleDriveFileId(url) {
	const trimmed = String(url || '').trim();
	if (!trimmed) return null;

	const filePath = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
	if (filePath?.[1]) return filePath[1];

	const openId = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
	if (openId?.[1]) return openId[1];

	const legacyPath = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
	if (legacyPath?.[1]) return legacyPath[1];

	return null;
}

/** @param {string} url */
export function isGoogleDriveUrl(url) {
	return Boolean(extractGoogleDriveFileId(url));
}

/**
 * URL for viewing in popup (Drive → preview; Blob/static → as-is).
 * @param {string} url
 */
export function resolveDocumentViewUrl(url) {
	const trimmed = normalizeDocumentLink(url);
	if (!trimmed || trimmed === '#') return '#';

	const fileId = extractGoogleDriveFileId(trimmed);
	if (fileId) {
		return `https://drive.google.com/file/d/${fileId}/preview`;
	}

	return resolveDocumentOpenUrl(trimmed);
}

/**
 * Absolute URL for opening a document (popup / new tab).
 * Relative paths like assets/documents/... must start with / or they 404 from /news.
 * @param {string} url
 */
export function resolveDocumentOpenUrl(url) {
	const trimmed = normalizeDocumentLink(url);
	if (!trimmed || trimmed === '#') return '#';
	if (/^https?:\/\//i.test(trimmed)) return trimmed;
	return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

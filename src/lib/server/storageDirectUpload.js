import { error } from '@sveltejs/kit';

export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_MB = 20;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_MB = 5;

/** @typedef {'news' | 'manuals' | 'knowledge' | 'plans' | 'forms'} PdfCollectionName */
/** @typedef {'news' | 'activities' | 'personnel' | 'banner'} ImageCollectionName */
/** @typedef {'pdf' | 'image'} UploadKind */

export const PDF_COLLECTIONS = new Set(['news', 'manuals', 'knowledge', 'plans', 'forms']);
export const IMAGE_COLLECTIONS = new Set(['news', 'activities', 'personnel', 'banner']);

/** @param {string} collection @param {UploadKind} kind */
export function assertUploadCollection(collection, kind) {
	const allowed = kind === 'image' ? IMAGE_COLLECTIONS : PDF_COLLECTIONS;
	if (!allowed.has(collection)) {
		throw error(400, kind === 'image' ? 'ประเภทรูปภาพไม่รองรับ' : 'ประเภทเอกสารไม่รองรับ');
	}
}

/**
 * @param {number} size
 * @param {string} contentType
 * @param {UploadKind} kind
 */
export function assertUploadMeta(size, contentType, kind) {
	if (!size || size <= 0) {
		throw error(400, 'กรุณาระบุขนาดไฟล์');
	}
	const max = kind === 'image' ? MAX_IMAGE_BYTES : MAX_PDF_BYTES;
	const maxMb = kind === 'image' ? MAX_IMAGE_MB : MAX_PDF_MB;
	if (size > max) {
		throw error(400, `ไฟล์ต้องไม่เกิน ${maxMb} MB`);
	}
	const type = (contentType || '').toLowerCase();
	if (kind === 'pdf') {
		if (type && type !== 'application/pdf') {
			throw error(400, 'รองรับเฉพาะไฟล์ PDF เท่านั้น');
		}
		return;
	}
	const okImage =
		!type ||
		type.startsWith('image/') ||
		['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(type);
	if (!okImage) {
		throw error(400, 'รองรับเฉพาะไฟล์รูปภาพ (JPEG, PNG, WebP, GIF)');
	}
}

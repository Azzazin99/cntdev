export const MAX_PDF_BYTES = 20 * 1024 * 1024;
export const MAX_PDF_MB = 20;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_MB = 5;

const PDF_EXT = ['.pdf'];

/** @param {File | null | undefined} file */
export function validatePdfForUpload(file) {
	if (!file || !file.size) {
		return { ok: false, message: 'กรุณาเลือกไฟล์ PDF' };
	}
	if (file.size > MAX_PDF_BYTES) {
		return { ok: false, message: `ไฟล์ PDF ต้องไม่เกิน ${MAX_PDF_MB} MB` };
	}
	const name = (file.name || '').toLowerCase();
	const type = (file.type || '').toLowerCase();
	const okExt = PDF_EXT.some((ext) => name.endsWith(ext));
	const okType = !type || type === 'application/pdf';
	if (!okExt && !okType) {
		return { ok: false, message: 'รองรับเฉพาะไฟล์ PDF' };
	}
	return { ok: true, message: '' };
}

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

/** @param {File | null | undefined} file */
export function validateImageForUpload(file) {
	if (!file || !file.size) {
		return { ok: false, message: 'กรุณาเลือกไฟล์รูปภาพ' };
	}
	if (file.size > MAX_IMAGE_BYTES) {
		return { ok: false, message: `ไฟล์รูปต้องไม่เกิน ${MAX_IMAGE_MB} MB` };
	}
	const name = (file.name || '').toLowerCase();
	const type = (file.type || '').toLowerCase();
	const okExt = IMAGE_EXT.some((ext) => name.endsWith(ext));
	const okType = !type || IMAGE_TYPES.includes(type) || type.startsWith('image/');
	if (!okExt && !okType) {
		return { ok: false, message: 'รองรับเฉพาะไฟล์รูป JPEG, PNG, WebP หรือ GIF' };
	}
	return { ok: true, message: '' };
}

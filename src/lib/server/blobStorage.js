import { put } from '@vercel/blob';
import { env } from '$env/dynamic/private';

export const BLOB_SETUP_MESSAGE =
	'ยังไม่ได้ตั้ง Vercel Blob — Vercel Dashboard → Storage → สร้าง Blob (Public) แล้วเชื่อมโปรเจกต์ cntdev → Redeploy (ดู docs/vercel-blob-setup.html)';

/** True only on deployed Vercel (not local `npm run dev` with production env pulled). */
function isVercelRuntime() {
	return process.env.VERCEL === '1' && process.env.NODE_ENV === 'production';
}

/** Blob via read-write token, or OIDC store on a real Vercel deployment. */
export function isBlobStorageEnabled() {
	if (env.BLOB_READ_WRITE_TOKEN?.trim()) return true;

	const storeId = env.BLOB_STORE_ID?.trim();
	if (!storeId) return false;

	if (isVercelRuntime()) return true;

	return false;
}

/** Browser client uploads (`handleUpload`) require a static read-write token — OIDC alone is not enough. */
export function isClientBlobUploadEnabled() {
	return Boolean(env.BLOB_READ_WRITE_TOKEN?.trim());
}

export function getBlobReadWriteToken() {
	return env.BLOB_READ_WRITE_TOKEN?.trim() || '';
}

export const CLIENT_BLOB_SETUP_MESSAGE =
	'อัปโหลดจากเบราว์เซอร์ต้องมี BLOB_READ_WRITE_TOKEN — Vercel Dashboard → Storage → Blob store → Projects → cntdev → สร้าง Read-Write Token (Production + Preview) แล้ว Redeploy (ดู docs/vercel-blob-setup.html)';

/**
 * @param {string} collection
 * @param {string} ext e.g. `.pdf`, `.jpg`
 */
export function buildBlobPath(collection, ext) {
	const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
	return `${collection}/${filename}`;
}

/**
 * @param {string} pathname
 * @param {Buffer} buffer
 * @param {string} contentType
 */
export async function putFileBuffer(pathname, buffer, contentType) {
	const blob = await put(pathname, buffer, {
		access: 'public',
		contentType,
		addRandomSuffix: false
	});
	return blob.url;
}

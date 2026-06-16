import { uploadFileToStorage } from '$lib/uploadDirect';
import { validatePdfForUpload } from '$lib/uploadLimits';

/**
 * Upload PDF to Vercel Blob via client upload (up to 20 MB).
 * Returns public URL, or null for multipart fallback (local dev without Blob).
 *
 * @param {'news'} collection
 * @param {File} file
 * @returns {Promise<string | null>}
 */
export async function uploadPdfToStorage(collection, file) {
	const check = validatePdfForUpload(file);
	if (!check.ok) {
		throw new Error(check.message);
	}
	return uploadFileToStorage('pdf', collection, file);
}

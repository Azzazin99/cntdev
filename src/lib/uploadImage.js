import { uploadFileToStorage } from '$lib/uploadDirect';
import { validateImageForUpload } from '$lib/uploadLimits';

/**
 * Upload image to Vercel Blob via client upload (up to 5 MB).
 * Returns public URL, or null for multipart fallback (local dev without Blob).
 *
 * @param {'news' | 'activities' | 'personnel'} collection
 * @param {File} file
 * @returns {Promise<string | null>}
 */
export async function uploadImageToStorage(collection, file) {
	const check = validateImageForUpload(file);
	if (!check.ok) {
		throw new Error(check.message);
	}
	return uploadFileToStorage('image', collection, file);
}

/** @typedef {'pdf' | 'image'} UploadKind */

/**
 * Server-side upload only — files go in FormData to /api/* and `savePdfFile` / `saveImageFile`
 * calls Vercel Blob `put()` with OIDC (no browser client token).
 *
 * @param {UploadKind} _kind
 * @param {string} _collection
 * @param {File} _file
 * @returns {Promise<null>}
 */
export async function uploadFileToStorage(_kind, _collection, _file) {
	return null;
}

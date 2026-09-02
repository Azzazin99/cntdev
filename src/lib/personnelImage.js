import { extractGoogleDriveFileId } from '$lib/documentLink';

export const PERSONNEL_IMAGE_FALLBACK = '/assets/images/logos/moe.png';

/**
 * Resolve personnel portrait URL for <img src> (local, blob, storage, or Drive thumbnail).
 * @param {string | null | undefined} path
 */
export function resolvePersonnelImageSrc(path) {
	const trimmed = String(path || '').trim();
	if (!trimmed || trimmed === '#') return PERSONNEL_IMAGE_FALLBACK;

	const fileId = extractGoogleDriveFileId(trimmed);
	if (fileId) {
		return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1200`;
	}

	if (/^https?:\/\//i.test(trimmed)) return trimmed;

	return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

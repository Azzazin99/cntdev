import { json } from '@sveltejs/kit';
import { requireEditor } from '$lib/server/authGuard';
import {
	BLOB_SETUP_MESSAGE,
	CLIENT_BLOB_SETUP_MESSAGE,
	isBlobStorageEnabled,
	isClientBlobUploadEnabled
} from '$lib/server/blobStorage';

/** Vercel serverless request body limit (~4.5 MB) — larger files need client upload + read-write token. */
const SERVER_MULTIPART_MAX_BYTES = 4.5 * 1024 * 1024;

/** @type {import('./$types').RequestHandler} */
export async function GET({ locals }) {
	requireEditor(locals);
	const blob = isBlobStorageEnabled();
	const clientUpload = isClientBlobUploadEnabled();
	return json({
		status: 'success',
		blob,
		clientUpload,
		serverMultipartMaxBytes: SERVER_MULTIPART_MAX_BYTES,
		message: blob
			? clientUpload
				? ''
				: CLIENT_BLOB_SETUP_MESSAGE
			: BLOB_SETUP_MESSAGE
	});
}

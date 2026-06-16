import { handleUpload } from '@vercel/blob/client';
import { json } from '@sveltejs/kit';
import { requireEditor } from '$lib/server/authGuard';
import {
	CLIENT_BLOB_SETUP_MESSAGE,
	getBlobReadWriteToken,
	isClientBlobUploadEnabled
} from '$lib/server/blobStorage';
import {
	assertUploadCollection,
	assertUploadMeta,
	MAX_IMAGE_BYTES,
	MAX_PDF_BYTES
} from '$lib/server/storageDirectUpload';

const PDF_CONTENT_TYPES = ['application/pdf'];
const IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** @type {import('./$types').RequestHandler} */
export async function POST(event) {
	const { request, locals } = event;

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
	}

	try {
		const token = getBlobReadWriteToken();
		if (!isClientBlobUploadEnabled()) {
			return json({ error: CLIENT_BLOB_SETUP_MESSAGE }, { status: 503 });
		}

		const jsonResponse = await handleUpload({
			body,
			request,
			token,
			onBeforeGenerateToken: async (pathname, clientPayload) => {
				requireEditor(locals);

				/** @type {{ collection?: string; kind?: string; size?: number; contentType?: string }} */
				let payload = {};
				try {
					payload = clientPayload ? JSON.parse(clientPayload) : {};
				} catch {
					throw new Error('ข้อมูลอัปโหลดไม่ถูกต้อง');
				}

				const collection = String(payload.collection || '');
				const kind = payload.kind === 'image' ? 'image' : 'pdf';
				const size = Number(payload.size || 0);
				const contentType = String(
					payload.contentType || (kind === 'pdf' ? 'application/pdf' : 'image/jpeg')
				);

				assertUploadCollection(collection, kind);
				if (size > 0) {
					assertUploadMeta(size, contentType, kind);
				}

				const normalized = String(pathname || '').replace(/^\/+/, '');
				if (!normalized.startsWith(`${collection}/`) || normalized.includes('..')) {
					throw new Error('พาธไฟล์ไม่ถูกต้อง');
				}

				return {
					maximumSizeInBytes: kind === 'pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES,
					allowedContentTypes: kind === 'pdf' ? PDF_CONTENT_TYPES : IMAGE_CONTENT_TYPES,
					addRandomSuffix: true,
					tokenPayload: clientPayload
				};
			}
		});

		return json(jsonResponse);
	} catch (e) {
		const message = e instanceof Error ? e.message : 'อัปโหลดไม่สำเร็จ';
		const status =
			e && typeof e === 'object' && 'status' in e ? Number(/** @type {{ status: number }} */ (e).status) : 400;
		return json({ error: message }, { status: status || 400 });
	}
}

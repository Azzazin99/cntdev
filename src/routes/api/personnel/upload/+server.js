import { json, error } from '@sveltejs/kit';
import { requireEditor } from '$lib/server/authGuard';
import { saveImageFile } from '$lib/server/contentStore';

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	requireEditor(locals);

	const form = await request.formData();
	const imageFile = form.get('image');
	if (!(imageFile instanceof File) || imageFile.size === 0) {
		throw error(400, 'กรุณาเลือกไฟล์รูปภาพ');
	}

	const url = await saveImageFile('personnel', imageFile);
	return json({ status: 'success', url });
}

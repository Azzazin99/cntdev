import { json, error } from '@sveltejs/kit';
import { requireEditor } from '$lib/server/authGuard';
import {
	createItem,
	deleteItem,
	formatThaiDate,
	isFirestoreEnabled,
	listItems,
	saveImageFile,
	updateItem
} from '$lib/server/contentStore';
import { sortByDate } from '$lib/utils';

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const items = await listItems('activities');
	return json({ items: sortByDate(items), source: isFirestoreEnabled() ? 'firestore' : 'json' });
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	requireEditor(locals);

	const form = await request.formData();
	const title = String(form.get('title') || '').trim();
	if (!title) throw error(400, 'กรุณาระบุหัวข้อ');

	const summary = String(form.get('summary') || title);
	const dateInput = String(form.get('date') || '');
	const link = String(form.get('link') || '#');
	const imageUrl = String(form.get('imageUrl') || '');
	const imageFile = form.get('image');

	let image = imageUrl || 'assets/images/logos/moe.png';
	if (imageFile instanceof File && imageFile.size > 0) {
		image = await saveImageFile('activities', imageFile);
	} else if (imageUrl.startsWith('http')) {
		image = imageUrl;
	}

	const id = String(Date.now());
	const item = {
		id,
		date: formatThaiDate(dateInput),
		title,
		category: String(form.get('category') || 'ข่าวกิจกรรม'),
		summary,
		image,
		link,
		facebookLink: '',
		content: '',
		gallery: []
	};

	await createItem('activities', item);
	return json({ status: 'success', message: 'บันทึกข้อมูลเรียบร้อยแล้ว!', item });
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
	requireEditor(locals);

	const form = await request.formData();
	const id = String(form.get('id') || '').trim();
	if (!id) throw error(400, 'ต้องระบุ id');

	const all = await listItems('activities');
	const existing = all.find((i) => String(i.id) === id);
	if (!existing) throw error(404, `ไม่พบรายการ id ${id}`);

	const title = String(form.get('title') || '').trim();
	if (!title) throw error(400, 'กรุณาระบุหัวข้อ');

	const summary = String(form.get('summary') || title);
	const dateInput = String(form.get('date') || '');
	const link = String(form.get('link') || existing.link || '#');
	const imageUrl = String(form.get('imageUrl') || '');
	const imageFile = form.get('image');

	let image = existing.image || 'assets/images/logos/moe.png';
	if (imageFile instanceof File && imageFile.size > 0) {
		image = await saveImageFile('activities', imageFile);
	} else if (imageUrl) {
		image = imageUrl.startsWith('http') ? imageUrl : imageUrl || image;
	}

	const item = {
		...existing,
		id,
		date: dateInput ? formatThaiDate(dateInput) : existing.date,
		title,
		category: String(form.get('category') || existing.category || 'ข่าวกิจกรรม'),
		summary,
		image,
		link
	};

	await updateItem('activities', id, item);
	return json({ status: 'success', message: 'อัปเดตข้อมูลเรียบร้อยแล้ว!', item });
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url, locals }) {
	requireEditor(locals);
	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'ต้องระบุ id');
	await deleteItem('activities', id);
	return json({ status: 'success', message: `ลบข้อมูล ID ${id} เรียบร้อยแล้ว` });
}

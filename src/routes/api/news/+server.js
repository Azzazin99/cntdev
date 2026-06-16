import { json, error } from '@sveltejs/kit';
import { requireEditor } from '$lib/server/authGuard';
import { validateDocumentLink } from '$lib/documentLink';
import {
	createItem,
	deleteItem,
	formatThaiDate,
	isFirestoreEnabled,
	listItems,
	savePdfFile,
	updateItem
} from '$lib/server/contentStore';
import { sortByDate } from '$lib/utils';

const DEFAULT_IMAGE = 'assets/images/logos/moe.png';
const NEWS_CATEGORY = 'ข่าวประชาสัมพันธ์';

/** @param {FormData} form @param {Record<string, unknown> | undefined} existing */
async function resolveNewsFields(form, existing) {
	const title = String(form.get('title') || '').trim();
	if (!title) throw error(400, 'กรุณาระบุหัวข้อ');

	const summary = String(form.get('summary') || title);
	const dateInput = String(form.get('date') || '');
	const linkInput = String(form.get('link') || '').trim();
	const linkUrl = String(form.get('linkUrl') || '').trim();
	const pdfFile = form.get('pdfFile');

	const hasExistingLink =
		existing?.link && String(existing.link).trim() && String(existing.link).trim() !== '#';
	const isNew = !existing;

	let link = '';

	if (linkUrl && linkUrl.startsWith('http')) {
		link = linkUrl;
	} else if (pdfFile instanceof File && pdfFile.size > 0) {
		link = await savePdfFile('news', pdfFile);
	} else if (linkInput) {
		const linkCheck = validateDocumentLink(linkInput, {
			allowEmpty: !isNew && Boolean(hasExistingLink)
		});
		if (!linkCheck.ok) {
			throw error(400, linkCheck.message);
		}
		link = linkCheck.value;
	} else if (hasExistingLink) {
		link = String(existing.link).trim();
	} else if (isNew) {
		throw error(400, 'กรุณาอัปโหลด PDF หรือวางลิงก์เอกสาร');
	}

	if (isNew && (!link || link === '#')) {
		throw error(400, 'กรุณาอัปโหลด PDF หรือวางลิงก์เอกสาร');
	}

	const image = String(existing?.image || DEFAULT_IMAGE) || DEFAULT_IMAGE;

	return {
		title,
		category: NEWS_CATEGORY,
		summary,
		date: dateInput ? formatThaiDate(dateInput) : String(existing?.date || ''),
		link: link || '#',
		image
	};
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const items = await listItems('news');
	return json({ items: sortByDate(items), source: isFirestoreEnabled() ? 'firestore' : 'json' });
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	requireEditor(locals);

	const form = await request.formData();
	const fields = await resolveNewsFields(form);

	const id = String(Date.now());
	const item = {
		id,
		date: fields.date,
		title: fields.title,
		category: fields.category,
		summary: fields.summary,
		image: fields.image,
		link: fields.link,
		facebookLink: '',
		content: '',
		gallery: []
	};

	await createItem('news', item);
	return json({ status: 'success', message: 'บันทึกข้อมูลเรียบร้อยแล้ว!', item });
}

/** @type {import('./$types').RequestHandler} */
export async function PUT({ request, locals }) {
	requireEditor(locals);

	const form = await request.formData();
	const id = String(form.get('id') || '').trim();
	if (!id) throw error(400, 'ต้องระบุ id');

	const all = await listItems('news');
	const existing = all.find((i) => String(i.id) === id);
	if (!existing) throw error(404, `ไม่พบรายการ id ${id}`);

	const fields = await resolveNewsFields(form, existing);

	const item = {
		...existing,
		id,
		date: fields.date || existing.date,
		title: fields.title,
		category: fields.category,
		summary: fields.summary,
		image: fields.image,
		link: fields.link
	};

	await updateItem('news', id, item);
	return json({ status: 'success', message: 'อัปเดตข้อมูลเรียบร้อยแล้ว!', item });
}

/** @type {import('./$types').RequestHandler} */
export async function DELETE({ url, locals }) {
	requireEditor(locals);
	const id = url.searchParams.get('id');
	if (!id) throw error(400, 'ต้องระบุ id');
	await deleteItem('news', id);
	return json({ status: 'success', message: `ลบข้อมูล ID ${id} เรียบร้อยแล้ว` });
}

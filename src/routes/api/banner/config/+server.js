import { json, error } from '@sveltejs/kit';
import { requireEditor } from '$lib/server/authGuard';
import { validateImageForUpload } from '$lib/uploadLimits';
import {
	DEFAULT_BANNER_ALT,
	DEFAULT_BANNER_IMAGE,
	DEFAULT_BANNER_LINK,
	getBannerConfig,
	isFirestoreEnabled,
	saveBannerConfig
} from '$lib/server/bannerConfig';
import { saveImageFile } from '$lib/server/contentStore';

/** @param {string} url */
function isValidBannerLink(url) {
	const trimmed = String(url || '').trim();
	if (!trimmed || trimmed === '/') return true;
	if (trimmed.startsWith('/')) return true;
	try {
		const u = new URL(trimmed);
		return u.protocol === 'http:' || u.protocol === 'https:';
	} catch {
		return false;
	}
}

/** @param {string} url */
function normalizeBannerLink(url) {
	const trimmed = String(url || '').trim();
	if (!trimmed) return DEFAULT_BANNER_LINK;
	return trimmed;
}

/** @type {import('./$types').RequestHandler} */
export async function GET() {
	const config = await getBannerConfig();
	return json({
		...config,
		source: isFirestoreEnabled() ? 'firestore' : 'json'
	});
}

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, locals }) {
	requireEditor(locals);

	const form = await request.formData();
	const linkUrl = normalizeBannerLink(String(form.get('linkUrl') || ''));
	const altText = String(form.get('altText') || '').trim();
	const imageFile = form.get('imageFile');

	if (!altText) {
		throw error(400, 'กรุณาระบุข้อความ alt');
	}
	if (!isValidBannerLink(linkUrl)) {
		throw error(400, 'ลิงก์ไม่ถูกต้อง (ใช้ /path ภายในเว็บ หรือ http:// / https://)');
	}

	const existing = await getBannerConfig();
	let imageUrl = existing.imageUrl || DEFAULT_BANNER_IMAGE;

	if (imageFile instanceof File && imageFile.size > 0) {
		const check = validateImageForUpload(imageFile);
		if (!check.ok) {
			throw error(400, check.message);
		}
		try {
			imageUrl = await saveImageFile('banner', imageFile);
		} catch (e) {
			const message = e instanceof Error ? e.message : 'อัปโหลดรูปไม่สำเร็จ';
			throw error(400, message);
		}
	}

	try {
		const saved = await saveBannerConfig({ imageUrl, linkUrl, altText });
		return json({
			status: 'success',
			message: 'บันทึกแบนเนอร์เรียบร้อยแล้ว',
			...saved
		});
	} catch (e) {
		const message = e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ';
		throw error(400, message);
	}
}

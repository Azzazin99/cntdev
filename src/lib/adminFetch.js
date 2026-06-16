/**
 * Parse admin API responses safely (handles HTML/plain-text error pages from proxies).
 * @param {Response} res
 */
export async function parseAdminResponse(res) {
	const text = await res.text();
	const contentType = res.headers.get('content-type') || '';

	if (
		res.status === 413 ||
		text.includes('Request Entity Too Large') ||
		text.includes('FUNCTION_PAYLOAD_TOO_LARGE')
	) {
		return {
			ok: false,
			status: res.status,
			message:
				'ไฟล์ใหญ่เกินที่ระบบรับได้ในขั้นตอนนี้ — ลองอัปโหลดใหม่ หรือใส่ลิงก์ Google Drive ในช่องลิงก์เอกสาร'
		};
	}

	if (res.status === 401) {
		return { ok: false, status: 401, message: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' };
	}

	if (res.status === 403) {
		return { ok: false, status: 403, message: 'ไม่มีสิทธิ์แก้ไขข้อมูล' };
	}

	let data = null;
	if (contentType.includes('application/json') && text) {
		try {
			data = JSON.parse(text);
		} catch {
			/* plain text or malformed JSON */
		}
	}

	if (data && typeof data === 'object') {
		const isSuccessResponse =
			res.ok &&
			(data.status === 'success' ||
				data.status === 'fallback' ||
				data.directUpload === false ||
				Boolean(data.uploadUrl) ||
				Array.isArray(data.items) ||
				typeof data.source === 'string' ||
				typeof data.sheetUrl === 'string');

		const message =
			typeof data.message === 'string'
				? data.message
				: typeof data.error === 'string'
					? data.error
					: !res.ok
						? `คำขอไม่สำเร็จ (HTTP ${res.status})`
						: '';

		return {
			ok: isSuccessResponse,
			status: res.status,
			data,
			message
		};
	}

	if (res.ok) {
		return { ok: true, status: res.status, data: null, message: '' };
	}

	return {
		ok: false,
		status: res.status,
		message: text.trim().slice(0, 200) || `คำขอไม่สำเร็จ (HTTP ${res.status})`
	};
}

/**
 * @param {string} url
 * @param {RequestInit} init
 */
export async function fetchAdminJson(url, init = {}) {
	try {
		const res = await fetch(url, init);
		return parseAdminResponse(res);
	} catch {
		return {
			ok: false,
			status: 0,
			message: 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ — ตรวจว่า dev server รันอยู่หรือลองรีเฟรชหน้า'
		};
	}
}

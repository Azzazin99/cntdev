import { error } from '@sveltejs/kit';

export function requireEditor(locals) {
	if (!locals.user) {
		throw error(401, 'กรุณาเข้าสู่ระบบ');
	}
	const role = locals.user.role;
	if (role !== 'admin' && role !== 'editor') {
		throw error(403, 'ไม่มีสิทธิ์แก้ไขข้อมูล');
	}
}

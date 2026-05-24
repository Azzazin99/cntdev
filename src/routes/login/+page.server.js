import { fail, redirect } from '@sveltejs/kit';
import {
	authenticateAdminPassword,
	createSessionToken,
	getAuthConfigStatus
} from '$lib/server/localAuth';

export function load({ locals, url }) {
	const redirectTo = url.searchParams.get('redirect') || '/admin';
	if (locals.user) {
		throw redirect(302, redirectTo);
	}

	return { redirectTo };
}

export const actions = {
	default: async ({ locals, request, cookies, url }) => {
		const form = await request.formData();
		const password = String(form.get('password') || '');

		const config = getAuthConfigStatus();
		if (!config.hasPassword) {
			return fail(400, {
				error:
					'ยังไม่ได้ตั้ง ADMIN_PASSWORD ใน Environment Variables (Vercel: Settings → Environment Variables แล้ว Redeploy)'
			});
		}

		if (!config.hasSecret) {
			return fail(400, {
				error:
					'ยังไม่ได้ตั้ง AUTH_SESSION_SECRET ใน Environment Variables (สุ่มสตริงยาว 32+ ตัว แล้ว Redeploy)'
			});
		}

		const user = authenticateAdminPassword(password);
		if (!user) {
			return fail(400, { error: 'รหัสผ่านไม่ถูกต้อง' });
		}

		let token;
		try {
			token = createSessionToken(user);
		} catch {
			return fail(500, {
				error:
					'ไม่สามารถสร้าง session ได้ — ตรวจสอบ AUTH_SESSION_SECRET ใน Environment Variables'
			});
		}

		cookies.set('cntdev_session', token, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:',
			maxAge: 60 * 60 * 12
		});

		const redirectTo = url.searchParams.get('redirect') || '/admin';
		throw redirect(303, redirectTo);
	}
};

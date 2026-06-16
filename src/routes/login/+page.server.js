import { fail, redirect } from '@sveltejs/kit';
import {
	authenticateAdmin,
	createSessionToken,
	getAuthConfigStatus
} from '$lib/server/localAuth';
import { getClientIp } from '$lib/server/rateLimit';
import {
	getTurnstileSiteKey,
	isTurnstileEnabled,
	verifyTurnstileToken
} from '$lib/server/turnstile';

export function load({ locals, url }) {
	const redirectTo = url.searchParams.get('redirect') || '/admin';
	if (locals.user) {
		throw redirect(302, redirectTo);
	}

	const turnstileSiteKey = getTurnstileSiteKey();
	const turnstileEnabled = isTurnstileEnabled();

	return {
		redirectTo,
		turnstileSiteKey,
		turnstileEnabled,
		turnstileMisconfigured: Boolean(turnstileSiteKey && !turnstileEnabled)
	};
}

export const actions = {
	default: async (event) => {
		const { request, cookies, url } = event;
		const form = await request.formData();
		const username = String(form.get('username') || '');
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

		if (isTurnstileEnabled()) {
			const turnstileToken = String(form.get('cf-turnstile-response') || '');
			const ip = getClientIp(event);
			const turnstile = await verifyTurnstileToken(turnstileToken, ip);
			if (!turnstile.success) {
				return fail(400, {
					error: 'การยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง'
				});
			}
		}

		const user = authenticateAdmin(username, password);
		if (!user) {
			return fail(400, { error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
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

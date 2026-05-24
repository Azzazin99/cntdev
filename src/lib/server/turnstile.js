import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

export function getTurnstileSiteKey() {
	return publicEnv.PUBLIC_TURNSTILE_SITE_KEY || '';
}

function getTurnstileSecret() {
	return env.TURNSTILE_SECRET_KEY || '';
}

export function isTurnstileEnabled() {
	return Boolean(getTurnstileSiteKey() && getTurnstileSecret());
}

/** @param {string} token @param {string} [remoteIp] */
export async function verifyTurnstileToken(token, remoteIp = '') {
	if (!isTurnstileEnabled()) {
		return { success: true, skipped: true };
	}

	const response = String(token || '').trim();
	if (!response) {
		return { success: false, error: 'missing-token' };
	}

	const body = new URLSearchParams({
		secret: getTurnstileSecret(),
		response,
		remoteip: remoteIp
	});

	const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body
	});

	if (!res.ok) {
		return { success: false, error: 'siteverify-unavailable' };
	}

	const data = await res.json();
	return {
		success: Boolean(data.success),
		error: Array.isArray(data['error-codes']) ? data['error-codes'].join(', ') : undefined
	};
}

import { error } from '@sveltejs/kit';
import { verifySessionToken } from '$lib/server/localAuth';
import { checkRateLimit, getClientIp } from '$lib/server/rateLimit';

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const API_MUTATION_LIMIT = 30;
const API_MUTATION_WINDOW_MS = 60 * 1000;

const STATIC_CACHE = 'public, max-age=86400, stale-while-revalidate=604800';
const NO_STORE = 'no-store';

/** @param {string} pathname */
function isStaticAsset(pathname) {
	return (
		pathname.startsWith('/assets/') ||
		/\.(jpg|jpeg|png|webp|gif|svg|ico|woff2?)$/i.test(pathname)
	);
}

/** @param {string} pathname */
function isSensitivePath(pathname) {
	return pathname.startsWith('/admin') || pathname.startsWith('/login') || pathname.startsWith('/api');
}

/** @param {import('@sveltejs/kit').RequestEvent} event */
function enforceRateLimit(event) {
	const { request, url } = event;
	const method = request.method.toUpperCase();
	if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
		return;
	}

	const ip = getClientIp(event);
	const pathname = url.pathname;

	if (method === 'POST' && pathname === '/login') {
		const result = checkRateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
		if (!result.allowed) {
			throw error(
				429,
				`ลองเข้าสู่ระบบบ่อยเกินไป กรุณารอ ${result.retryAfterSec} วินาที`
			);
		}
		return;
	}

	if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
		const result = checkRateLimit(`api:${ip}`, API_MUTATION_LIMIT, API_MUTATION_WINDOW_MS);
		if (!result.allowed) {
			throw error(429, `คำขอมากเกินไป กรุณารอ ${result.retryAfterSec} วินาที`);
		}
	}
}

/** @param {Response} response @param {string} pathname */
function applyCacheHeaders(response, pathname) {
	if (isSensitivePath(pathname)) {
		response.headers.set('Cache-Control', NO_STORE);
		return;
	}

	if (isStaticAsset(pathname)) {
		response.headers.set('Cache-Control', STATIC_CACHE);
	}
}

export async function handle({ event, resolve }) {
	let user = null;
	try {
		const token = event.cookies.get('cntdev_session') || '';
		user = verifySessionToken(token);
	} catch {
		user = null;
	}

	event.locals.user = user;

	enforceRateLimit(event);

	const response = await resolve(event);
	applyCacheHeaders(response, event.url.pathname);
	return response;
}

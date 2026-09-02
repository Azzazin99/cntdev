import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE_NAME, sessionCookieOptions } from '$lib/server/sessionCookie';

export function load({ cookies, url }) {
	// Must match login set options or the browser may keep the cookie.
	cookies.delete(SESSION_COOKIE_NAME, sessionCookieOptions(url));
	throw redirect(303, '/');
}


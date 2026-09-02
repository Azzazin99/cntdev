/** Cookie options for `cntdev_session` — set and delete must match. */
export const SESSION_COOKIE_NAME = 'cntdev_session';

/**
 * @param {URL | { protocol: string }} url
 * @returns {{ path: string; httpOnly: boolean; sameSite: 'lax'; secure: boolean; maxAge?: number }}
 */
export function sessionCookieOptions(url) {
	return {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:'
	};
}

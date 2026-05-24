import { verifySessionToken } from '$lib/server/localAuth';

export async function handle({ event, resolve }) {
	let user = null;
	try {
		const token = event.cookies.get('cntdev_session') || '';
		user = verifySessionToken(token);
	} catch {
		user = null;
	}

	event.locals.user = user;

	return resolve(event);
}

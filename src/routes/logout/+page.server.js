import { redirect } from '@sveltejs/kit';

export function load({ cookies }) {
	cookies.delete('cntdev_session', { path: '/' });
	throw redirect(303, '/');
}


import { loadAuthority } from '$lib/server/pageData';

/** @type {import('./$types').PageServerLoad} */
export async function load() {
	return { authority: await loadAuthority() };
}

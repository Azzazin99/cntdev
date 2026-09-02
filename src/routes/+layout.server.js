import { getBannerConfig } from '$lib/server/bannerConfig';

export async function load({ locals }) {
	const banner = await getBannerConfig();
	return {
		user: locals.user || null,
		banner
	};
}

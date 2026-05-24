/** @type {Map<string, { start: number; count: number }>} */
const buckets = new Map();

/** @param {import('@sveltejs/kit').RequestEvent} event */
export function getClientIp(event) {
	const forwarded = event.request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}

	const realIp = event.request.headers.get('x-real-ip');
	if (realIp) {
		return realIp.trim();
	}

	try {
		return event.getClientAddress();
	} catch {
		return 'unknown';
	}
}

/**
 * @param {string} key
 * @param {number} limit
 * @param {number} windowMs
 */
export function checkRateLimit(key, limit, windowMs) {
	const now = Date.now();
	let entry = buckets.get(key);

	if (!entry || now - entry.start >= windowMs) {
		entry = { start: now, count: 0 };
		buckets.set(key, entry);
	}

	entry.count += 1;

	if (entry.count > limit) {
		return {
			allowed: false,
			retryAfterSec: Math.max(1, Math.ceil((windowMs - (now - entry.start)) / 1000))
		};
	}

	return { allowed: true, retryAfterSec: 0 };
}

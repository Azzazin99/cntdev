/** Unicode invisible / formatting characters often pasted from Word or web. */
const INVISIBLE_CHARS = /[\u200B-\u200D\uFEFF\u00AD]/g;

/** Literal HTML entity strings (not decoded) found in legacy JSON. */
const ENTITY_PATTERNS = [
	/&#8203;/gi,
	/&#x200b;/gi,
	/&amp;#8203;/gi,
	/&amp;#x200b;/gi
];

/**
 * Remove zero-width spaces and literal `&#8203;`-style entities from display text.
 * @param {unknown} value
 * @returns {string}
 */
export function sanitizeText(value) {
	if (value == null) return '';
	let s = String(value);
	for (const pattern of ENTITY_PATTERNS) {
		s = s.replace(pattern, '');
	}
	s = s.replace(INVISIBLE_CHARS, '');
	return s.trim();
}

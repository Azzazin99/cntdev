/**
 * Focus management for modal dialogs (keyboard trap + restore).
 */

/** @param {ParentNode} container */
export function getFocusableElements(container) {
	return /** @type {HTMLElement[]} */ (
		Array.from(
			container.querySelectorAll(
				'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		)
	);
}

/**
 * @param {KeyboardEvent} e
 * @param {HTMLElement} container
 */
export function trapFocusKeydown(e, container) {
	if (e.key !== 'Tab') return;
	const focusable = getFocusableElements(container);
	if (!focusable.length) return;
	const first = focusable[0];
	const last = focusable[focusable.length - 1];
	if (e.shiftKey && document.activeElement === first) {
		e.preventDefault();
		last.focus();
	} else if (!e.shiftKey && document.activeElement === last) {
		e.preventDefault();
		first.focus();
	}
}

/** @param {HTMLElement | null | undefined} container @param {HTMLElement | null | undefined} previousFocus */
export function restoreFocus(container, previousFocus) {
	if (previousFocus && document.contains(previousFocus)) {
		previousFocus.focus();
		return;
	}
	container?.querySelector('button, [href], input')?.focus();
}

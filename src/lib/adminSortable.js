import Sortable from 'sortablejs';

/**
 * Svelte action: drag-reorder children via `.drag-handle`.
 * Each sortable child should have `data-id`.
 *
 * @param {HTMLElement} node
 * @param {{ onReorder?: (ids: string[], detail: { oldIndex: number, newIndex: number }) => void | Promise<void> }} params
 */
export function bindSortable(node, params = {}) {
	/** @type {((ids: string[], detail: { oldIndex: number, newIndex: number }) => void | Promise<void>) | undefined} */
	let onReorder = params.onReorder;

	const sortable = Sortable.create(node, {
		handle: '.drag-handle',
		animation: 150,
		draggable: '.admin-item, .list-edit-row',
		onEnd: async (evt) => {
			const { oldIndex, newIndex } = evt;
			if (oldIndex == null || newIndex == null || oldIndex === newIndex) return;

			// Only top-level sortable rows (Sortable already moved them — read final order)
			const ids = [...node.children]
				.filter((el) => el instanceof HTMLElement && el.matches('.admin-item, .list-edit-row'))
				.map((el) => el.getAttribute('data-id'))
				.filter(Boolean)
				.map(String);

			if (typeof onReorder === 'function') {
				await onReorder(ids, { oldIndex, newIndex });
			}
		}
	});

	return {
		/** @param {{ onReorder?: (ids: string[], detail: { oldIndex: number, newIndex: number }) => void | Promise<void> }} next */
		update(next) {
			onReorder = next?.onReorder;
		},
		destroy() {
			sortable.destroy();
		}
	};
}

import { parseThaiDate } from '$lib/utils';

const THAI_MONTHS = [
	'',
	'มกราคม',
	'กุมภาพันธ์',
	'มีนาคม',
	'เมษายน',
	'พฤษภาคม',
	'มิถุนายน',
	'กรกฎาคม',
	'สิงหาคม',
	'กันยายน',
	'ตุลาคม',
	'พฤศจิกายน',
	'ธันวาคม'
];

/** @param {string} dateStr YYYY-MM-DD */
export function formatThaiDate(dateStr) {
	if (!dateStr) return '';
	const [year, month, day] = dateStr.split('-');
	if (!year || !month || !day) return dateStr;
	const thaiYear = parseInt(year, 10) + 543;
	const monthName = THAI_MONTHS[parseInt(month, 10)] || month;
	return `${parseInt(day, 10)} ${monthName} ${thaiYear}`;
}

/** @param {Record<string, unknown>} item */
export function withSortOrder(item) {
	const date = String(item.date || '');
	const sortOrder = item.sortOrder || parseThaiDate(date) || Date.now();
	return { ...item, sortOrder };
}

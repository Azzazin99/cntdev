//#region src/lib/utils.js
/**
* Converts a standard Google Drive View URL to a Direct Download URL
*/
function convertDriveLink(url) {
	if (!url) return "#";
	try {
		const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
		if (match && match[1]) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
	} catch (e) {
		console.warn("Could not convert Drive Link:", url);
	}
	return url;
}
/**
* Parse Thai date string to Date object
*/
function parseThaiDate(dateStr) {
	if (!dateStr) return 0;
	const thMonths = [
		"มกราคม",
		"กุมภาพันธ์",
		"มีนาคม",
		"เมษายน",
		"พฤษภาคม",
		"มิถุนายน",
		"กรกฎาคม",
		"สิงหาคม",
		"กันยายน",
		"ตุลาคม",
		"พฤศจิกายน",
		"ธันวาคม"
	];
	const p = dateStr.split(" ");
	if (p.length < 3) return 0;
	return new Date(parseInt(p[2]) - 543, thMonths.indexOf(p[1]), parseInt(p[0])).getTime();
}
/**
* Sort items by date (newest first)
*/
function sortByDate(items, dateField = "date") {
	return [...items].sort((a, b) => {
		const dateA = a.sortOrder || parseThaiDate(a[dateField]);
		return (b.sortOrder || parseThaiDate(b[dateField])) - dateA;
	});
}
//#endregion
export { sortByDate as n, convertDriveLink as t };

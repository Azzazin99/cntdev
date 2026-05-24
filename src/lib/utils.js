/**
 * Converts a standard Google Drive View URL to a Direct Download URL
 */
export function convertDriveLink(url) {
  if (!url) return '#';
  try {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  } catch (e) {
    console.warn("Could not convert Drive Link:", url);
  }
  return url;
}

/**
 * Opens a centered popup window for document viewing
 */
export function openPopup(url) {
  const width = 1000;
  const height = 800;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;
  window.open(url, 'DocumentView', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
}

/**
 * Parse Thai date string to Date object
 */
export function parseThaiDate(dateStr) {
  if (!dateStr) return 0;
  const thMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const p = dateStr.split(' ');
  if (p.length < 3) return 0;
  return new Date(parseInt(p[2]) - 543, thMonths.indexOf(p[1]), parseInt(p[0])).getTime();
}

/** Thai date string → YYYY-MM-DD for input type="date" */
export function thaiDateToInput(thaiStr) {
  const t = parseThaiDate(thaiStr);
  if (!t) return '';
  const d = new Date(t);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Sort items by date (newest first)
 */
export function sortByDate(items, dateField = 'date') {
  return [...items].sort((a, b) => {
    const dateA = a.sortOrder || parseThaiDate(a[dateField]);
    const dateB = b.sortOrder || parseThaiDate(b[dateField]);
    return dateB - dateA;
  });
}
/**
 * One-time remap: preserve current ascending visual order after switching
 * collections to descending sortOrder (larger = first).
 *
 * Keys: manuals, knowledge, plans, forms, personnel
 *
 * Reads each collection sorted ascending, then writes
 * sortOrder = n - i so the same top-to-bottom order remains after desc sort.
 *
 * Usage: node scripts/remap-doc-sort-order.mjs
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON in env or .env.local
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const KEYS = ['manuals', 'knowledge', 'plans', 'forms', 'personnel'];
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'static', 'assets', 'data');

function loadServiceAccount() {
	let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
	if (!raw) {
		try {
			const env = readFileSync(path.join(ROOT, '.env.local'), 'utf8');
			const line = env.split('\n').find((l) => l.startsWith('FIREBASE_SERVICE_ACCOUNT_JSON='));
			if (line) raw = line.slice('FIREBASE_SERVICE_ACCOUNT_JSON='.length).trim();
		} catch {
			/* ignore */
		}
	}
	raw = raw.trim();
	if (
		(raw.startsWith("'") && raw.endsWith("'")) ||
		(raw.startsWith('"') && raw.endsWith('"'))
	) {
		raw = raw.slice(1, -1);
	}
	if (!raw) return null;
	return JSON.parse(raw);
}

/** @param {{ sortOrder?: unknown }[]} items */
function sortAsc(items) {
	return [...items].sort(
		(a, b) => (Number(a?.sortOrder) || 0) - (Number(b?.sortOrder) || 0)
	);
}

/**
 * Assign dense descending-friendly scores that preserve ascending display order.
 * @param {{ id?: unknown, sortOrder?: unknown }[]} items
 */
function remapSortOrders(items) {
	const sorted = sortAsc(items);
	const n = sorted.length;
	return sorted.map((item, i) => ({
		...item,
		id: String(item.id ?? ''),
		sortOrder: n - i
	}));
}

async function remapFirestore(db) {
	for (const key of KEYS) {
		const snap = await db.collection(key).get();
		const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
		if (items.length === 0) {
			console.log(`${key}: empty, skip`);
			continue;
		}
		const remapped = remapSortOrders(items);
		let batch = db.batch();
		let pending = 0;
		for (const item of remapped) {
			batch.update(db.collection(key).doc(String(item.id)), { sortOrder: item.sortOrder });
			pending++;
			if (pending >= 400) {
				await batch.commit();
				batch = db.batch();
				pending = 0;
			}
		}
		if (pending > 0) await batch.commit();
		console.log(`${key}: remapped ${remapped.length} docs (Firestore)`);

		const legacyRef = db.collection('site_data').doc(key);
		const legacy = await legacyRef.get();
		if (legacy.exists && Array.isArray(legacy.data()?.items)) {
			const legacyItems = remapSortOrders(
				legacy.data().items.map((row, i) => ({
					...row,
					id: String(row?.id ?? i),
					sortOrder: row?.sortOrder
				}))
			);
			await legacyRef.set({ items: legacyItems }, { merge: true });
			console.log(`${key}: remapped site_data/${key} legacy items`);
		}
	}
}

function remapLocalJson() {
	for (const key of KEYS) {
		const filePath = path.join(DATA_DIR, `${key}.json`);
		if (!existsSync(filePath)) {
			console.log(`${key}: no local JSON, skip`);
			continue;
		}
		const raw = JSON.parse(readFileSync(filePath, 'utf8'));
		if (!Array.isArray(raw) || raw.length === 0) {
			console.log(`${key}: empty JSON, skip`);
			continue;
		}
		const withIds = raw.map((row, i) => ({
			...row,
			id: String(row?.id ?? i),
			sortOrder: row?.sortOrder ?? i
		}));
		const remapped = remapSortOrders(withIds);
		writeFileSync(filePath, JSON.stringify(remapped, null, 4) + '\n', 'utf8');
		console.log(`${key}: remapped ${remapped.length} items (local JSON)`);
	}
}

async function main() {
	const sa = loadServiceAccount();
	if (sa) {
		admin.initializeApp({ credential: admin.credential.cert(sa) });
		await remapFirestore(admin.firestore());
		await admin.app().delete();
	} else {
		console.warn('No FIREBASE_SERVICE_ACCOUNT_JSON — remapping local JSON only');
	}
	remapLocalJson();
	console.log('Done.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

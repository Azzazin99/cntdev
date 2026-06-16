/**
 * One-time migration: move legacy `site_data/{key}` (single document with an
 * `items` array) into per-item documents in a top-level collection `{key}`,
 * matching the news/activities model.
 *
 * Default (idempotent): skips any collection that already has documents.
 *
 * --force: treats `site_data/{key}` as the source of truth and REPLACES the
 *   collection contents with it (clears existing docs first). Use this when a
 *   collection holds stale/legacy documents that no longer match the live
 *   `site_data` list. The `site_data` document is left intact as a backup.
 *
 * Usage:
 *   node scripts/migrate-lists-to-collections.mjs
 *   node scripts/migrate-lists-to-collections.mjs --force
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON in .env.local (same value as Vercel).
 */
import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const KEYS = ['manuals', 'knowledge', 'plans', 'forms', 'personnel'];
const FORCE = process.argv.includes('--force');

function loadServiceAccount() {
	// Prefer process env, fall back to .env.local
	let raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
	if (!raw) {
		try {
			const env = readFileSync('.env.local', 'utf8');
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
	if (!raw) {
		console.error('FIREBASE_SERVICE_ACCOUNT_JSON not found in env or .env.local');
		process.exit(1);
	}
	return JSON.parse(raw);
}

async function clearCollection(collRef) {
	const snap = await collRef.get();
	let batch = db.batch();
	let count = 0;
	for (const doc of snap.docs) {
		batch.delete(doc.ref);
		count++;
		if (count % 400 === 0) {
			await batch.commit();
			batch = db.batch();
		}
	}
	await batch.commit();
	return snap.size;
}

let db;

async function migrateKey(key) {
	const collRef = db.collection(key);
	const existing = await collRef.limit(1).get();

	if (!existing.empty && !FORCE) {
		console.log(`- ${key}: collection already has documents, skipped (use --force to resync)`);
		return;
	}

	const legacy = await db.collection('site_data').doc(key).get();
	const items = legacy.exists && Array.isArray(legacy.data()?.items) ? legacy.data().items : [];
	if (items.length === 0) {
		console.log(`- ${key}: no site_data items to migrate (left collection untouched)`);
		return;
	}

	if (!existing.empty && FORCE) {
		const removed = await clearCollection(collRef);
		console.log(`- ${key}: cleared ${removed} stale doc(s)`);
	}

	let n = 0;
	for (let i = 0; i < items.length; i++) {
		const raw = items[i];
		const base = typeof raw === 'string' ? { title: raw } : { ...raw };
		const id = String(base.id ?? `${Date.now()}${i}`);
		const doc = { ...base, id, sortOrder: i + 1 };
		await collRef.doc(id).set(doc);
		n++;
	}
	console.log(`- ${key}: wrote ${n} item(s) from site_data`);
}

async function main() {
	const creds = loadServiceAccount();
	admin.initializeApp({ credential: admin.credential.cert(creds) });
	db = admin.firestore();

	console.log(
		`Migrating legacy site_data lists into per-item collections${FORCE ? ' (--force resync)' : ''}...`
	);
	for (const key of KEYS) {
		await migrateKey(key);
	}
	console.log('Done.');
	await admin.app().delete();
}

main().catch((e) => {
	console.error('Migration failed:', e);
	process.exit(1);
});

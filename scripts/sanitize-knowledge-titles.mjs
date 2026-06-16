/**
 * One-time cleanup: strip &#8203; and invisible chars from titles in Firestore
 * `knowledge` collection and legacy `site_data/knowledge` document.
 *
 * Usage: node scripts/sanitize-knowledge-titles.mjs
 */
import { readFileSync } from 'fs';
import admin from 'firebase-admin';
import { sanitizeText } from '../src/lib/sanitizeText.js';

const COLLECTIONS = ['manuals', 'knowledge', 'plans', 'forms', 'personnel'];

function loadServiceAccount() {
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

/** @param {Record<string, unknown>} data @param {'personnel' | string} key */
function sanitizeDocFields(key, data) {
	const next = { ...data };
	if (key === 'personnel' && typeof next.name === 'string') {
		next.name = sanitizeText(next.name);
	} else if (typeof next.title === 'string') {
		next.title = sanitizeText(next.title);
	}
	return next;
}

async function main() {
	const sa = loadServiceAccount();
	admin.initializeApp({ credential: admin.credential.cert(sa) });
	const db = admin.firestore();

	for (const key of COLLECTIONS) {
		const snap = await db.collection(key).get();
		let updated = 0;
		for (const doc of snap.docs) {
			const data = doc.data();
			const cleaned = sanitizeDocFields(key, data);
			const field = key === 'personnel' ? 'name' : 'title';
			if (data[field] !== cleaned[field]) {
				await doc.ref.update({ [field]: cleaned[field] });
				updated++;
				console.log(`  ${key}/${doc.id}: cleaned ${field}`);
			}
		}
		console.log(`${key}: ${updated} doc(s) updated`);
	}

	const legacyRef = db.collection('site_data').doc('knowledge');
	const legacy = await legacyRef.get();
	if (legacy.exists && Array.isArray(legacy.data()?.items)) {
		const items = legacy.data().items.map((item) => {
			if (!item || typeof item !== 'object') return item;
			const row = { ...item };
			if (typeof row.title === 'string') row.title = sanitizeText(row.title);
			return row;
		});
		await legacyRef.update({ items });
		console.log('site_data/knowledge: legacy items array updated');
	}

	await admin.app().delete();
	console.log('Done.');
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

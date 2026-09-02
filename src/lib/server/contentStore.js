import fs from 'node:fs/promises';
import path from 'node:path';
import {
	canWriteLocalStaticFiles,
	getFirestore,
	isFirestoreEnabled,
	resolveStorageBucket,
	FIREBASE_STORAGE_SETUP_MESSAGE
} from '$lib/server/firebaseAdmin';
import {
	buildBlobPath,
	isBlobStorageEnabled,
	putFileBuffer
} from '$lib/server/blobStorage';
import { formatThaiDate, withSortOrder } from '$lib/server/dates';

const DATA_DIR = path.join(process.cwd(), 'static', 'assets', 'data');
const IMAGE_DIRS = {
	news: path.join(process.cwd(), 'static', 'assets', 'images', 'news'),
	activities: path.join(process.cwd(), 'static', 'assets', 'images', 'activity'),
	personnel: path.join(process.cwd(), 'static', 'assets', 'images', 'personnel'),
	banner: path.join(process.cwd(), 'static', 'assets', 'images')
};

const DOCUMENT_DIRS = {
	news: path.join(process.cwd(), 'static', 'assets', 'documents', 'news')
};

const LOCAL_IMAGE_SUBDIRS = {
	news: 'news',
	activities: 'activity',
	personnel: 'personnel',
	banner: ''
};

const LOCAL_DOCUMENT_SUBDIRS = {
	news: 'news'
};

/** @typedef {'news'} PdfCollectionName */
/** @typedef {'news' | 'activities' | 'personnel' | 'banner'} ImageCollectionName */
/** @typedef {'news' | 'activities' | 'manuals' | 'knowledge' | 'plans' | 'forms' | 'personnel'} CollectionName */

/** @param {CollectionName} name */
function jsonPath(name) {
	return path.join(DATA_DIR, `${name}.json`);
}

/** @param {CollectionName} name */
async function readJsonFile(name) {
	try {
		const raw = await fs.readFile(jsonPath(name), 'utf8');
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

/** @param {CollectionName} name @param {unknown[]} data */
async function writeJsonFile(name, data) {
	await fs.mkdir(DATA_DIR, { recursive: true });
	try {
		await fs.writeFile(jsonPath(name), JSON.stringify(data, null, 4), 'utf8');
	} catch (e) {
		const err = /** @type {NodeJS.ErrnoException} */ (e);
		if (err.code === 'EROFS' || err.code === 'EPERM') {
			throw new Error(
				'ไม่สามารถบันทึกบน production ได้ — ตั้งค่า FIREBASE_SERVICE_ACCOUNT_JSON ใน Vercel Environment Variables'
			);
		}
		throw e;
	}
}

/** @param {CollectionName} collection */
export async function listItems(collection) {
	const db = getFirestore();
	if (db) {
		const snap = await db.collection(collection).get();
		return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
	}
	return readJsonFile(collection);
}

/** @param {CollectionName} collection @param {string} id */
export async function deleteItem(collection, id) {
	const db = getFirestore();
	if (db) {
		await db.collection(collection).doc(String(id)).delete();
		return;
	}
	const data = await readJsonFile(collection);
	const next = data.filter((item) => String(item.id) !== String(id));
	if (next.length === data.length) {
		throw new Error(`ไม่พบรายการ id ${id}`);
	}
	await writeJsonFile(collection, next);
}

/** @param {CollectionName} collection @param {Record<string, unknown>} item */
export async function createItem(collection, item) {
	const payload = withSortOrder(item);
	const db = getFirestore();
	if (db) {
		const id = String(payload.id);
		await db.collection(collection).doc(id).set(payload);
		return payload;
	}
	const data = await readJsonFile(collection);
	data.unshift(payload);
	await writeJsonFile(collection, data);
	return payload;
}

/** @param {CollectionName} collection @param {string} id @param {Record<string, unknown>} patch */
export async function updateItem(collection, id, patch) {
	const payload = withSortOrder({ ...patch, id: String(id) });
	const db = getFirestore();
	if (db) {
		await db.collection(collection).doc(String(id)).set(payload, { merge: true });
		return payload;
	}
	const data = await readJsonFile(collection);
	const idx = data.findIndex((item) => String(item.id) === String(id));
	if (idx === -1) {
		throw new Error(`ไม่พบรายการ id ${id}`);
	}
	data[idx] = { ...data[idx], ...payload };
	await writeJsonFile(collection, data);
	return data[idx];
}

/**
 * Reassign sortOrder so orderedIds[0] displays first (highest value).
 * @param {CollectionName} collection
 * @param {string[]} orderedIds
 */
export async function reorderItems(collection, orderedIds) {
	if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
		throw new Error('ต้องระบุลำดับ id');
	}
	const unique = new Set(orderedIds.map(String));
	if (unique.size !== orderedIds.length) {
		throw new Error('รายการ id ซ้ำกัน');
	}

	const existing = await listItems(collection);
	const byId = new Map(existing.map((item) => [String(item.id), item]));
	if (byId.size !== orderedIds.length) {
		throw new Error('จำนวนรายการไม่ตรงกับข้อมูลในระบบ');
	}
	for (const id of orderedIds) {
		if (!byId.has(String(id))) {
			throw new Error(`ไม่พบรายการ id ${id}`);
		}
	}

	const n = orderedIds.length;
	const db = getFirestore();
	if (db) {
		let batch = db.batch();
		let pending = 0;
		for (let i = 0; i < n; i++) {
			const id = String(orderedIds[i]);
			const sortOrder = n - i;
			batch.update(db.collection(collection).doc(id), { sortOrder });
			pending++;
			if (pending >= 400) {
				await batch.commit();
				batch = db.batch();
				pending = 0;
			}
		}
		if (pending > 0) await batch.commit();
		return orderedIds.map((id, i) => ({ id: String(id), sortOrder: n - i }));
	}

	const next = orderedIds.map((id, i) => ({
		...byId.get(String(id)),
		id: String(id),
		sortOrder: n - i
	}));
	await writeJsonFile(collection, next);
	return next;
}

/** @param {CollectionName} collection @param {string} listKey */
export async function getSiteList(listKey) {
	const db = getFirestore();
	if (db) {
		const doc = await db.collection('site_data').doc(listKey).get();
		if (doc.exists) {
			const data = doc.data();
			if (data?.items && Array.isArray(data.items)) return data.items;
		}
		return [];
	}
	try {
		const raw = await fs.readFile(path.join(DATA_DIR, `${listKey}.json`), 'utf8');
		return JSON.parse(raw);
	} catch {
		return [];
	}
}

/** @param {string} listKey @param {unknown[]} items */
export async function saveSiteList(listKey, items) {
	const allowed = ['manuals', 'knowledge', 'plans', 'forms', 'authority', 'personnel'];
	if (!allowed.includes(listKey)) {
		throw new Error('รายการนี้ไม่รองรับ');
	}
	const db = getFirestore();
	if (db) {
		await db.collection('site_data').doc(listKey).set({ items });
		return;
	}
	const filePath = path.join(DATA_DIR, `${listKey}.json`);
	await fs.mkdir(DATA_DIR, { recursive: true });
	try {
		await fs.writeFile(filePath, JSON.stringify(items, null, 4), 'utf8');
	} catch (e) {
		const err = /** @type {NodeJS.ErrnoException} */ (e);
		if (err.code === 'EROFS' || err.code === 'EPERM') {
			throw new Error(
				'ไม่สามารถบันทึกบน production ได้ — ตั้งค่า FIREBASE_SERVICE_ACCOUNT_JSON ใน Vercel'
			);
		}
		throw e;
	}
}

/** @param {Buffer} buffer @param {string} dir @param {string} filename @param {string} returnPath */
async function writeLocalFileOrStorageError(buffer, dir, filename, returnPath) {
	try {
		await fs.mkdir(dir, { recursive: true });
		await fs.writeFile(path.join(dir, filename), buffer);
		return returnPath;
	} catch (e) {
		const err = /** @type {NodeJS.ErrnoException} */ (e);
		if (err.code === 'EROFS' || err.code === 'EPERM' || err.code === 'ENOENT') {
			throw new Error(FIREBASE_STORAGE_SETUP_MESSAGE);
		}
		throw e;
	}
}

function requireStorageOrLocalDisk() {
	if (!canWriteLocalStaticFiles()) {
		throw new Error(FIREBASE_STORAGE_SETUP_MESSAGE);
	}
}

/** @param {ImageCollectionName} collection @param {File | null} file */
export async function saveImageFile(collection, file) {
	if (!file || !file.size) {
		return 'assets/images/logos/moe.png';
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const ext = path.extname(file.name || '') || '.jpg';
	const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;

	if (isBlobStorageEnabled()) {
		const pathname = buildBlobPath(collection, ext);
		return putFileBuffer(pathname, buffer, file.type || 'image/jpeg');
	}

	const bucket = await resolveStorageBucket();
	if (bucket) {
		const storagePath = `${collection}/${filename}`;
		const ref = bucket.file(storagePath);
		try {
			await ref.save(buffer, {
				metadata: { contentType: file.type || 'image/jpeg' }
			});
			await ref.makePublic().catch(() => {});
			return `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			if (msg.includes('bucket does not exist') || msg.includes('notFound')) {
				throw new Error(FIREBASE_STORAGE_SETUP_MESSAGE);
			}
			throw e;
		}
	}

	requireStorageOrLocalDisk();

	const dir = IMAGE_DIRS[collection];
	const subdir = LOCAL_IMAGE_SUBDIRS[collection] ?? collection;
	if (collection === 'banner') {
		const bannerFilename = `banner${ext}`;
		return writeLocalFileOrStorageError(
			buffer,
			dir,
			bannerFilename,
			`/assets/images/${bannerFilename}`
		);
	}
	return writeLocalFileOrStorageError(
		buffer,
		dir,
		filename,
		`/assets/images/${subdir}/${filename}`
	);
}

/** @param {PdfCollectionName} collection @param {File | null} file */
export async function savePdfFile(collection, file) {
	if (!file || !file.size) {
		throw new Error('กรุณาเลือกไฟล์ PDF');
	}

	const buffer = Buffer.from(await file.arrayBuffer());
	const ext = path.extname(file.name || '') || '.pdf';
	const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;

	if (isBlobStorageEnabled()) {
		const pathname = buildBlobPath(collection, ext);
		return putFileBuffer(pathname, buffer, file.type || 'application/pdf');
	}

	requireStorageOrLocalDisk();

	const dir = DOCUMENT_DIRS[collection];
	const subdir = LOCAL_DOCUMENT_SUBDIRS[collection] || collection;
	return writeLocalFileOrStorageError(
		buffer,
		dir,
		filename,
		`/assets/documents/${subdir}/${filename}`
	);
}

export { isFirestoreEnabled, formatThaiDate };

import admin from 'firebase-admin';
import { env } from '$env/dynamic/private';

/** @type {admin.app.App | null} */
let app = null;

function parseServiceAccount() {
	const raw = env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
	if (!raw.trim()) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function isFirestoreEnabled() {
	return !!parseServiceAccount();
}

export function getAdminApp() {
	if (app) return app;
	const creds = parseServiceAccount();
	if (!creds) return null;
	if (!admin.apps.length) {
		app = admin.initializeApp({
			credential: admin.credential.cert(creds),
			storageBucket: creds.storage_bucket || 'cntdev-e49f5.firebasestorage.app'
		});
	} else {
		app = admin.app();
	}
	return app;
}

export function getFirestore() {
	const a = getAdminApp();
	return a ? a.firestore() : null;
}

export function getStorageBucket() {
	const a = getAdminApp();
	return a ? a.storage().bucket() : null;
}

/** Firebase Storage bucket only if it exists in GCS (Firestore may work without Storage). */
export async function resolveStorageBucket() {
	const a = getAdminApp();
	if (!a) return null;

	const bucket = a.storage().bucket();

	try {
		const [exists] = await bucket.exists();
		return exists ? bucket : null;
	} catch {
		return null;
	}
}

export const FIREBASE_STORAGE_SETUP_MESSAGE =
	'ยังไม่ได้เปิด Cloud Storage — Firebase Console → Databases & Storage → Storage → Get started (โปรเจกต์ cntdev-e49f5, ต้องเป็นแผน Blaze) หรือใส่ลิงก์ Google Drive ในช่องลิงก์เอกสารแทนการอัปโหลดไฟล์';

/** Local `static/` writes only work in dev; Vercel serverless cannot mkdir `/var/task/static`. */
export function canWriteLocalStaticFiles() {
	if (process.env.VERCEL === '1' || process.env.VERCEL_ENV) return false;
	if (process.env.AWS_LAMBDA_FUNCTION_NAME) return false;
	return !process.cwd().includes('/var/task');
}

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

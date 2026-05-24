import { writable } from 'svelte/store';
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '$lib/firebase';

export const authUser = writable(null);
export const authLoading = writable(true);
export const authReady = writable(false);
export const authError = writable('');

let unsub = null;

export function initAuth() {
	if (unsub) return;
	unsub = onAuthStateChanged(auth, (user) => {
		authUser.set(user);
		authLoading.set(false);
		authReady.set(true);
	});
}

export async function loginWithEmail(email, password) {
	authError.set('');
	const cred = await signInWithEmailAndPassword(auth, email, password);
	return cred.user;
}

export async function logout() {
	authError.set('');
	await signOut(auth);
}

export async function requestPasswordReset(email, continueUrl) {
	authError.set('');
	if (continueUrl) {
		await sendPasswordResetEmail(auth, email, { url: continueUrl, handleCodeInApp: false });
		return;
	}
	await sendPasswordResetEmail(auth, email);
}

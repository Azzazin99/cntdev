import crypto from 'node:crypto';
import { env } from '$env/dynamic/private';

export function isLocalHost(hostname) {
	return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

function b64urlEncode(input) {
	const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input));
	return buf
		.toString('base64')
		.replaceAll('+', '-')
		.replaceAll('/', '_')
		.replaceAll('=', '');
}

function b64urlDecodeToBuffer(str) {
	const padLen = (4 - (str.length % 4)) % 4;
	const padded = (str + '='.repeat(padLen)).replaceAll('-', '+').replaceAll('_', '/');
	return Buffer.from(padded, 'base64');
}

function timingSafeEqualStr(a, b) {
	const ab = Buffer.from(String(a));
	const bb = Buffer.from(String(b));
	if (ab.length !== bb.length) return false;
	return crypto.timingSafeEqual(ab, bb);
}

export function getAdminPassword() {
	return env.ADMIN_PASSWORD || env.LOCAL_AUTH_PASSWORD || '';
}

export function getSessionSecretValue() {
	return env.AUTH_SESSION_SECRET || env.LOCAL_AUTH_SESSION_SECRET || '';
}

export function getAuthConfigStatus() {
	const password = getAdminPassword();
	const secret = getSessionSecretValue();
	return {
		hasPassword: Boolean(password),
		hasSecret: Boolean(secret)
	};
}

function getSessionSecret() {
	const secret = getSessionSecretValue();
	if (!secret) {
		throw new Error('AUTH_SESSION_SECRET is not set');
	}
	return secret;
}

/** @param {string} password */
export function authenticateAdminPassword(password) {
	const p = String(password || '');
	const adminPassword = getAdminPassword();

	if (!p || !adminPassword) return null;
	if (!timingSafeEqualStr(p, adminPassword)) return null;

	return { email: 'admin', role: 'admin' };
}

export function createSessionToken(payload, ttlSeconds = 60 * 60 * 12) {
	const now = Math.floor(Date.now() / 1000);
	const body = { ...payload, iat: now, exp: now + ttlSeconds };
	const bodyB64 = b64urlEncode(JSON.stringify(body));
	const sig = crypto.createHmac('sha256', getSessionSecret()).update(bodyB64).digest();
	const sigB64 = b64urlEncode(sig);
	return `${bodyB64}.${sigB64}`;
}

export function verifySessionToken(token) {
	if (!token || typeof token !== 'string') return null;
	const parts = token.split('.');
	if (parts.length !== 2) return null;
	const [bodyB64, sigB64] = parts;

	const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(bodyB64).digest();
	const actualSig = b64urlDecodeToBuffer(sigB64);
	if (expectedSig.length !== actualSig.length) return null;
	if (!crypto.timingSafeEqual(expectedSig, actualSig)) return null;

	let payload;
	try {
		payload = JSON.parse(b64urlDecodeToBuffer(bodyB64).toString('utf8'));
	} catch {
		return null;
	}

	const now = Math.floor(Date.now() / 1000);
	if (!payload?.exp || now >= payload.exp) return null;
	if (!payload?.email || !payload?.role) return null;
	return { email: payload.email, role: payload.role };
}

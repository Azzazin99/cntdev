import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const currentTheme = writable('light');

export function initTheme() {
	if (!browser) return;
	const stored = localStorage.getItem('site_theme') || 'light';
	currentTheme.set(stored);
	document.body.classList.toggle('dark-mode', stored === 'dark');
}

export function toggleTheme() {
	if (!browser) return;
	document.body.classList.toggle('dark-mode');
	const next = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
	currentTheme.set(next);
	localStorage.setItem('site_theme', next);
}

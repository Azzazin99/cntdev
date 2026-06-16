<script>
	import { tick } from 'svelte';
	import { page } from '$app/stores';
	import { trapFocusKeydown, restoreFocus, getFocusableElements } from '$lib/modalFocus';

	/** @type {{ text: string; link: string }[]} */
	export let navItems = [];
	export let toggleTheme = () => {};
	export let currentTheme = 'light';

	let mobileMenuOpen = false;
	/** @type {HTMLButtonElement | null} */
	let hamburgerBtn = null;
	/** @type {HTMLElement | null} */
	let drawerEl = null;
	/** @type {HTMLElement | null} */
	let menuPreviousFocus = null;

	$: menuAriaLabel = mobileMenuOpen ? 'ปิดเมนู' : 'เปิดเมนู';
	$: themeAriaLabel = currentTheme === 'dark' ? 'สลับเป็นโหมดสว่าง' : 'สลับเป็นโหมดมืด';
	$: pathname = $page.url.pathname;

	$: if (typeof document !== 'undefined') {
		for (const el of [
			document.getElementById('main-content'),
			document.querySelector('.main-footer')
		]) {
			if (!el) continue;
			if (mobileMenuOpen) el.setAttribute('inert', '');
			else el.removeAttribute('inert');
		}
	}

	/** @param {string} link */
	function isActive(link) {
		if (link === '/') return pathname === '/';
		return pathname === link || pathname.startsWith(`${link}/`);
	}

	async function openMobileMenu() {
		menuPreviousFocus = /** @type {HTMLElement | null} */ (document.activeElement);
		mobileMenuOpen = true;
		await tick();
		const focusable = drawerEl ? getFocusableElements(drawerEl) : [];
		(focusable[0] ?? drawerEl)?.focus();
	}

	function closeMobileMenu() {
		mobileMenuOpen = false;
		restoreFocus(drawerEl, menuPreviousFocus ?? hamburgerBtn);
		menuPreviousFocus = null;
	}

	async function toggleMobileMenu() {
		if (mobileMenuOpen) closeMobileMenu();
		else await openMobileMenu();
	}

	/** @param {KeyboardEvent} e */
	function onDrawerKeydown(e) {
		if (e.key === 'Escape') {
			closeMobileMenu();
			return;
		}
		if (drawerEl && mobileMenuOpen) trapFocusKeydown(e, drawerEl);
	}

	/** @param {KeyboardEvent} e */
	function onOverlayKeydown(e) {
		if (e.key === 'Escape') closeMobileMenu();
	}
</script>

<header class="main-header">
	<a href="/">
		<img
			src="/assets/images/banner.png"
			alt="กลุ่มพัฒนาครูและบุคลากรทางการศึกษา"
			class="responsive-banner"
			width="6063"
			height="1250"
			fetchpriority="high"
			decoding="async"
		>
	</a>
</header>

<nav class="sticky-nav" aria-label="เมนูหลัก">
	<div class="nav-container">
		<button
			bind:this={hamburgerBtn}
			class="hamburger {mobileMenuOpen ? 'active' : ''}"
			on:click={toggleMobileMenu}
			aria-label={menuAriaLabel}
			aria-expanded={mobileMenuOpen}
			aria-controls="mobile-nav-drawer"
		>
			<span></span>
			<span></span>
			<span></span>
		</button>

		<ul class="nav-menu desktop-menu">
			{#each navItems as item}
				<li>
					<a href={item.link} class="nav-link {isActive(item.link) ? 'active' : ''}">
						{item.text}
					</a>
				</li>
			{/each}
		</ul>
		<button class="theme-toggle desktop-theme-toggle" on:click={toggleTheme} aria-label={themeAriaLabel}>
			{#if currentTheme === 'dark'}
				<span aria-hidden="true">☀️</span>
			{:else}
				<span aria-hidden="true">🌙</span>
			{/if}
		</button>
	</div>
</nav>

{#if mobileMenuOpen}
	<div
		class="mobile-overlay"
		on:click={closeMobileMenu}
		on:keydown={onOverlayKeydown}
		role="presentation"
	></div>
{/if}

<div
	id="mobile-nav-drawer"
	bind:this={drawerEl}
	class="mobile-menu {mobileMenuOpen ? 'open' : ''}"
	role="dialog"
	aria-modal={mobileMenuOpen ? 'true' : undefined}
	aria-hidden={mobileMenuOpen ? undefined : 'true'}
	aria-label="เมนูนำทาง"
	tabindex={mobileMenuOpen ? -1 : undefined}
	on:keydown={onDrawerKeydown}
>
	<div class="mobile-menu-header">
		<span class="mobile-menu-title" aria-hidden="true">📋 เมนู</span>
		<button class="mobile-close-btn" on:click={closeMobileMenu} aria-label="ปิดเมนู">✕</button>
	</div>
	<ul class="mobile-nav-list">
		{#each navItems as item}
			<li>
				<a
					href={item.link}
					class="mobile-nav-link {isActive(item.link) ? 'active' : ''}"
					on:click={closeMobileMenu}
				>
					{item.text}
				</a>
			</li>
		{/each}
	</ul>
	<div class="mobile-menu-footer">
		<button
			class="theme-toggle-mobile"
			aria-label={themeAriaLabel}
			on:click={() => {
				toggleTheme();
				closeMobileMenu();
			}}
		>
			{#if currentTheme === 'dark'}
				<span aria-hidden="true">☀️</span> สว่าง
			{:else}
				<span aria-hidden="true">🌙</span> มืด
			{/if}
		</button>
	</div>
</div>

<style>
	.hamburger {
		display: none;
		flex-direction: column;
		justify-content: center;
		gap: 5px;
		width: 44px;
		height: 44px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 10px;
		z-index: calc(var(--z-sticky) + 1);
	}

	.hamburger span {
		display: block;
		width: 100%;
		height: 3px;
		background: var(--text-dark);
		border-radius: 2px;
		transition: transform 0.3s ease, opacity 0.3s ease;
	}

	.hamburger.active span:nth-child(1) {
		transform: translateY(8px) rotate(45deg);
	}

	.hamburger.active span:nth-child(2) {
		opacity: 0;
	}

	.hamburger.active span:nth-child(3) {
		transform: translateY(-8px) rotate(-45deg);
	}

	.theme-toggle {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.2rem;
		margin-left: 10px;
		padding: 0.5rem;
		min-height: 44px;
		min-width: 44px;
		flex: 0 0 auto;
	}

	.theme-toggle:hover {
		opacity: 0.7;
	}

	.desktop-theme-toggle {
		flex-shrink: 0;
	}

	.mobile-overlay {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: calc(var(--z-sticky) + 2);
	}

	.mobile-menu {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		width: 280px;
		max-width: min(280px, 85vw);
		height: 100%;
		background: var(--white);
		z-index: calc(var(--z-sticky) + 3);
		box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
		transform: translateX(-100%);
		transition: transform 0.3s var(--ease-out);
		overflow: hidden;
		pointer-events: none;
		visibility: hidden;
		flex-direction: column;
	}

	.mobile-menu.open {
		transform: translateX(0);
		pointer-events: auto;
		visibility: visible;
	}

	.mobile-menu-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--border-neutral);
		flex-shrink: 0;
	}

	.mobile-menu-title {
		font-weight: 700;
		font-size: 1.2rem;
		color: var(--primary-purple);
	}

	.mobile-close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 0.5rem;
		color: var(--text-dark);
		min-height: 44px;
		min-width: 44px;
	}

	.mobile-nav-list {
		list-style: none;
		padding: 0;
		margin: 0;
		flex: 1;
		overflow-y: auto;
		min-height: 0;
	}

	.mobile-nav-link {
		display: flex;
		align-items: center;
		padding: 0.85rem 1rem;
		color: var(--text-dark);
		border-bottom: 1px solid var(--border-neutral);
		transition: background-color 0.2s, color 0.2s;
		min-height: 44px;
	}

	.mobile-nav-link:hover,
	.mobile-nav-link.active {
		background: var(--primary-purple-light);
		color: var(--primary-purple);
	}

	.mobile-menu-footer {
		padding: 1rem;
		border-top: 1px solid var(--border-neutral);
		flex-shrink: 0;
	}

	.theme-toggle-mobile {
		width: 100%;
		padding: 0.8rem;
		background: var(--primary-purple);
		color: var(--text-on-primary);
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		min-height: 44px;
	}

	@media (max-width: 768px) {
		.hamburger {
			display: flex;
		}

		.desktop-menu,
		.desktop-theme-toggle {
			display: none;
		}

		.mobile-overlay {
			display: block;
		}

		.mobile-menu {
			display: flex;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hamburger span,
		.mobile-menu {
			transition: none;
		}
	}
</style>

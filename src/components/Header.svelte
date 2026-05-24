<script>
	import { page } from '$app/stores';
	
	export let navItems = [];
	export let toggleTheme = () => {};
	export let currentTheme = 'light';
	
	let mobileMenuOpen = false;
	
	function toggleMobileMenu() {
		mobileMenuOpen = !mobileMenuOpen;
	}
	
	function closeMobileMenu() {
		mobileMenuOpen = false;
	}
</script>

<header class="main-header">
	<a href="/">
		<img src="/assets/images/banner.png" alt="กลุ่มพัฒนาครูและบุคลากรทางการศึกษา" class="responsive-banner">
	</a>
</header>

<nav class="sticky-nav">
	<div class="nav-container">
		<!-- Hamburger Button -->
		<button 
			class="hamburger {mobileMenuOpen ? 'active' : ''}" 
			on:click={toggleMobileMenu}
			aria-label="Toggle menu"
			aria-expanded={mobileMenuOpen}
		>
			<span></span>
			<span></span>
			<span></span>
		</button>
		
		<!-- Desktop Menu -->
		<ul class="nav-menu desktop-menu">
			{#each navItems as item}
				<li>
					<a 
						href={item.link} 
						class="nav-link {$page.url.pathname === item.link ? 'active' : ''}"
					>
						{item.text}
					</a>
				</li>
			{/each}
		</ul>
		<button class="theme-toggle desktop-theme-toggle" on:click={toggleTheme} aria-label="Toggle theme">
			{#if currentTheme === 'dark'}
				☀️
			{:else}
				🌙
			{/if}
		</button>
	</div>
</nav>

<!-- Mobile Menu Overlay -->
{#if mobileMenuOpen}
	<div class="mobile-overlay" on:click={closeMobileMenu} on:keydown={(e) => e.key === 'Escape' && closeMobileMenu()} role="presentation"></div>
{/if}

<!-- Mobile Menu Drawer -->
<div class="mobile-menu {mobileMenuOpen ? 'open' : ''}">
	<div class="mobile-menu-header">
		<span class="mobile-menu-title">📋 เมนู</span>
		<button class="mobile-close-btn" on:click={closeMobileMenu} aria-label="Close menu">✕</button>
	</div>
	<ul class="mobile-nav-list">
		{#each navItems as item}
			<li>
				<a 
					href={item.link} 
					class="mobile-nav-link {$page.url.pathname === item.link ? 'active' : ''}"
					on:click={closeMobileMenu}
				>
					{item.text}
				</a>
			</li>
		{/each}
	</ul>
	<div class="mobile-menu-footer">
		<button class="theme-toggle-mobile" on:click={() => { toggleTheme(); closeMobileMenu(); }}>
			{#if currentTheme === 'dark'}
				☀️ สว่าง
			{:else}
				🌙 มืด
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
		z-index: 1001;
	}

	.hamburger span {
		display: block;
		width: 100%;
		height: 3px;
		background: var(--text-dark);
		border-radius: 2px;
		transition: all 0.3s ease;
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

	/* Mobile Overlay */
	.mobile-overlay {
		display: none;
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1002;
	}

	/* Mobile Menu Drawer */
	.mobile-menu {
		display: none;
		position: fixed;
		top: 0;
		left: -280px;
		right: auto;
		width: 280px;
		height: 100%;
		background: var(--white);
		z-index: 1003;
		box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
		transition: left 0.3s ease;
		overflow-y: auto;
	}

	.mobile-menu.open {
		left: 0;
	}

	.mobile-menu-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		border-bottom: 1px solid var(--border);
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
	}

	.mobile-nav-link {
		display: block;
		padding: 1rem;
		color: var(--text-dark);
		border-bottom: 1px solid var(--border);
		transition: all 0.2s;
		min-height: 44px;
		display: flex;
		align-items: center;
	}

	.mobile-nav-link:hover,
	.mobile-nav-link.active {
		background: var(--primary-purple-light);
		color: var(--primary-purple);
	}

	.mobile-menu-footer {
		padding: 1rem;
		border-top: 1px solid var(--border);
	}

	.theme-toggle-mobile {
		width: 100%;
		padding: 0.8rem;
		background: var(--primary-purple);
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		min-height: 44px;
	}

	/* Responsive - Show Hamburger on Mobile */
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
			display: block;
		}
	}
</style>

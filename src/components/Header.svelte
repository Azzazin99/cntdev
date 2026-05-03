<script>
	import { page } from '$app/stores';
	
	export let navItems = [];
	export let toggleTheme = () => {};
	export let currentTheme = 'light';
</script>

<header class="main-header">
	<a href="/">
		<img src="/assets/images/banner.png" alt="กลุ่มพัฒนาครูและบุคลากรทางการศึกษา" class="responsive-banner">
	</a>
</header>

<nav class="sticky-nav">
	<div class="nav-container">
		<ul class="nav-menu">
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
			<li>
				<button class="theme-toggle" on:click={toggleTheme} aria-label="Toggle theme">
					{#if currentTheme === 'dark'}
						☀️
					{:else}
						🌙
					{/if}
				</button>
			</li>
		</ul>
	</div>
</nav>

<style>
	.main-header {
		width: 100%;
		padding: 0;
		margin: 0;
		display: block;
		line-height: 0;
		background: none;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.responsive-banner {
		width: 100%;
		height: auto;
		display: block;
	}

	.sticky-nav {
		background: var(--white);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
		position: sticky;
		top: 0;
		z-index: 1000;
	}

	.nav-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 20px;
		height: 50px;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.nav-menu {
		display: flex;
		gap: 2rem;
		margin: 0;
		padding: 0;
		list-style: none;
		align-items: center;
	}

	.nav-link {
		font-weight: 500;
		color: var(--text-dark);
		padding: 0.8rem 0;
		font-size: 1rem;
		position: relative;
		transition: all 0.3s;
	}

	.nav-link:hover,
	.nav-link.active {
		color: var(--primary-purple);
	}

	.nav-link::after {
		content: "";
		position: absolute;
		bottom: 0;
		left: 0;
		width: 0;
		height: 2px;
		background: var(--primary-purple);
		transition: width 0.3s;
	}

	.nav-link:hover::after,
	.nav-link.active::after {
		width: 100%;
	}

	.theme-toggle {
		background: none;
		border: none;
		cursor: pointer;
		font-size: 1.2rem;
		margin-left: 10px;
		padding: 0.5rem;
	}

	.theme-toggle:hover {
		opacity: 0.7;
	}

	@media (max-width: 768px) {
		.nav-menu {
			gap: 1rem;
			padding: 0 1rem;
			white-space: nowrap;
			overflow-x: auto;
		}

		.nav-link {
			font-size: 0.9rem;
		}
	}
</style>
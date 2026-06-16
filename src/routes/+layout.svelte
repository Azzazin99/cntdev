<script>
	import '../app.css';
	import Header from '$components/Header.svelte';
	import Footer from '$components/Footer.svelte';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { currentTheme, initTheme, toggleTheme } from '$lib/theme';

	export let data;

	const baseNavItems = [
		{ text: 'หน้าหลัก', link: '/' },
		{ text: 'บุคลากร', link: '/users' },
		{ text: 'อำนาจหน้าที่', link: '/authority' },
		{ text: 'คู่มือการปฏิบัติงาน', link: '/manual' },
		{ text: 'แผนพัฒนาครู', link: '/plan' },
		{ text: 'ข่าวประชาสัมพันธ์', link: '/news' },
		{ text: 'ภาพกิจกรรม', link: '/activities' },
		{ text: 'แบบฟอร์ม', link: '/forms' },
		{ text: 'คลังเกียรติบัตร', link: '/certificates' }
	];

	$: userEmail = data?.user?.email || '';
	$: userRole = data?.user?.role || null;
	$: canAccessAdmin = userRole === 'admin' || userRole === 'editor';
	$: onAdminPage = $page.url.pathname.startsWith('/admin');
	$: navItems = [
		...baseNavItems,
		...(canAccessAdmin ? [{ text: 'จัดการระบบ', link: '/admin' }] : []),
		...(!userRole
			? [{ text: 'เข้าสู่ระบบ', link: '/login' }]
			: onAdminPage
				? []
				: [{ text: 'ออกจากระบบ', link: '/logout' }])
	];
	
	onMount(initTheme);
</script>

<div class="site-wrapper">
	<a href="#main-content" class="skip-link">ข้ามไปเนื้อหาหลัก</a>
	<Header {navItems} {toggleTheme} currentTheme={$currentTheme} />
	
	<main id="main-content">
		<slot />
	</main>
	
	<Footer />
</div>

<style>
	:global(body) {
		font-family: var(--font-main);
		margin: 0;
		padding: 0;
	}
	
	.site-wrapper {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		position: relative;
	}
	
	main {
		flex: 1;
	}
</style>

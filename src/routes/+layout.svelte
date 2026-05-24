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

<svelte:head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="icon" href="/favicon.ico">
	<!-- Font -->
	<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="site-wrapper">
	<Header {navItems} {toggleTheme} currentTheme={$currentTheme} />
	
	<main>
		<slot />
	</main>
	
	<Footer />
</div>

<style>
	:global(body) {
		font-family: 'Sarabun', sans-serif;
		margin: 0;
		padding: 0;
	}
	
	.site-wrapper {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	main {
		flex: 1;
	}
</style>

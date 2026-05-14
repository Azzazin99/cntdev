<script>
	import '../app.css';
	import Header from '$components/Header.svelte';
	import Footer from '$components/Footer.svelte';
	import { onMount } from 'svelte';
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
	$: isLocal = !!data?.isLocal;
	$: canAccessAdmin = isLocal && (userRole === 'admin' || userRole === 'editor');
	$: navItems = [
		...baseNavItems,
		...(canAccessAdmin ? [{ text: 'จัดการระบบ', link: '/admin' }] : []),
		...(isLocal ? (!userRole ? [{ text: 'เข้าสู่ระบบ', link: '/login' }] : [{ text: 'ออกจากระบบ', link: '/logout' }]) : [])
	];
	
	// Theme management
	let currentTheme = 'light';
	
	onMount(() => {
		currentTheme = localStorage.getItem('site_theme') || 'light';
		if (currentTheme === 'dark') {
			document.body.classList.add('dark-mode');
		}
	});
	
	function toggleTheme() {
		document.body.classList.toggle('dark-mode');
		currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
		localStorage.setItem('site_theme', currentTheme);
	}
</script>

<svelte:head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<link rel="icon" href="/favicon.ico">
	<!-- Font -->
	<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</svelte:head>

<div class="site-wrapper">
	<Header {navItems} {toggleTheme} {currentTheme} />
	
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

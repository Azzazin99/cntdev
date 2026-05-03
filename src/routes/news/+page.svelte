<script>
	import { onMount } from 'svelte';
	import { sortByDate, openPopup } from '$lib/utils';
	
	let news = [];
	let loading = true;
	
	onMount(async () => {
		try {
			const res = await fetch('/assets/data/news.json');
			if (res.ok) {
				const data = await res.json();
				news = sortByDate(data);
			}
		} catch (e) {
			console.error('Error loading news:', e);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>ข่าวประชาสัมพันธ์ - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container">
	<h2 class="section-title">📰 ข่าวประชาสัมพันธ์</h2>
	
	{#if loading}
		<p>กำลังโหลด...</p>
	{:else if news.length > 0}
		<div class="timeline-container">
			{#each news as item}
				<div class="timeline-item">
					<div class="timeline-dot"></div>
					<div class="timeline-content">
						<div class="timeline-date">📅 {item.date}</div>
						<h3>{item.title}</h3>
						<a href="#" on:click|preventDefault={() => openPopup(item.link)} class="btn-view" style="display: inline-block; margin-top: 0.5rem;">👁️ เปิดอ่าน</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p>ไม่มีข่าวประชาสัมพันธ์</p>
	{/if}
</div>

<style>
	.timeline-container {
		position: relative;
		padding-left: 2rem;
		border-left: 2px solid var(--primary-purple-light);
		margin: 1rem 0 3rem 1rem;
	}
	
	.timeline-item {
		position: relative;
		margin-bottom: 2rem;
	}
	
	.timeline-dot {
		position: absolute;
		left: -2.45rem;
		top: 5px;
		width: 14px;
		height: 14px;
		background: var(--primary-purple);
		border-radius: 50%;
		border: 3px solid white;
		box-shadow: 0 0 0 2px var(--primary-purple-light);
	}
	
	.timeline-content {
		background: var(--white);
		padding: 1.2rem 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 8px var(--shadow);
		border-left: 4px solid var(--primary-purple);
	}
	
	.timeline-date {
		font-size: 0.9rem;
		color: var(--primary-purple);
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
</style>
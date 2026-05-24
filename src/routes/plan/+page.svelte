<script>
	import { onMount } from 'svelte';
	import { fetchSiteList } from '$lib/fetchNews';
	import { convertDriveLink, openPopup } from '$lib/utils';
	
	let plans = [];
	let loading = true;
	
	onMount(async () => {
		plans = await fetchSiteList('plans');
		loading = false;
	});
</script>

<svelte:head>
	<title>แผนพัฒนาครู - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container">
	<h2 class="section-title">📈 แผนพัฒนาครู</h2>
	
	{#if loading}
		<p>กำลังโหลด...</p>
	{:else if plans.length > 0}
		<div class="doc-list">
			{#each plans as item}
				<div class="doc-item" style="border-left-color: #e91e63;">
					<div class="doc-icon">📈</div>
					<div class="doc-info">
						<div class="doc-title">{item.title}</div>
					</div>
					<div class="doc-actions">
						<a href={item.link || '/plan'} on:click|preventDefault={() => openPopup(item.link)} class="btn-view">👁️ เปิดอ่าน</a>
						<a href={convertDriveLink(item.link)} target="_blank" class="btn-download">⬇️ ดาวน์โหลด</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p>ไม่มีแผนพัฒนาครู</p>
	{/if}
</div>

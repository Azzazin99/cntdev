<script>
	import { onMount } from 'svelte';
	import { convertDriveLink, openPopup } from '$lib/utils';
	
	let manuals = [];
	let loading = true;
	
	onMount(async () => {
		try {
			const res = await fetch('/assets/data/manuals.json');
			if (res.ok) {
				manuals = await res.json();
			}
		} catch (e) {
			console.error('Error loading manuals:', e);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>คู่มือการปฏิบัติงาน - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container">
	<h2 class="section-title">📘 คู่มือการปฏิบัติงาน</h2>
	
	{#if loading}
		<p>กำลังโหลด...</p>
	{:else if manuals.length > 0}
		<div class="doc-list">
			{#each manuals as item, index}
				<div class="doc-item">
					<div class="doc-icon">📘</div>
					<div class="doc-info">
						<div class="doc-title">{index + 1}. {item.title}</div>
					</div>
					<div class="doc-actions">
						<a href="#" on:click|preventDefault={() => openPopup(item.link)} class="btn-view">👁️ เปิดอ่าน</a>
						<a href={convertDriveLink(item.link)} target="_blank" class="btn-download">⬇️ ดาวน์โหลด</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p>ไม่มีคู่มือการปฏิบัติงาน</p>
	{/if}
</div>
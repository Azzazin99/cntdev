<script>
	import { onMount } from 'svelte';
	import { convertDriveLink, openPopup } from '$lib/utils';
	
	let knowledge = [];
	let loading = true;
	
	onMount(async () => {
		try {
			const res = await fetch('/assets/data/knowledge.json');
			if (res.ok) {
				knowledge = await res.json();
			}
		} catch (e) {
			console.error('Error loading knowledge:', e);
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>คลังความรู้ - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container">
	<h2 class="section-title">📚 คลังความรู้</h2>
	
	{#if loading}
		<p>กำลังโหลด...</p>
	{:else if knowledge.length > 0}
		<div class="doc-list">
			{#each knowledge as item, index}
				<div class="doc-item" style="border-left-color: #9c27b0;">
					<div class="doc-icon">📚</div>
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
		<p>ไม่มีคลังความรู้</p>
	{/if}
</div>
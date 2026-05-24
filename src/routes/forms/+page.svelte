<script>
	import { onMount } from 'svelte';
	import { fetchSiteList } from '$lib/fetchNews';
	import { convertDriveLink, openPopup } from '$lib/utils';
	
	let forms = [];
	let loading = true;
	
	onMount(async () => {
		forms = await fetchSiteList('forms');
		loading = false;
	});
</script>

<svelte:head>
	<title>แบบฟอร์ม - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container">
	<h2 class="section-title">📝 แบบฟอร์ม</h2>
	
	{#if loading}
		<p>กำลังโหลด...</p>
	{:else if forms.length > 0}
		<div class="doc-list">
			{#each forms as form, index}
				<div class="doc-item" style="border-left-color: #ff9800;">
					<div class="doc-icon">📝</div>
					<div class="doc-info">
						<div class="doc-title">{index + 1}. {form.title || form.name}</div>
					</div>
					<div class="doc-actions">
						<a href={form.link || '/forms'} on:click|preventDefault={() => openPopup(form.link)} class="btn-view">👁️ เปิดอ่าน</a>
						<a href={convertDriveLink(form.link)} target="_blank" class="btn-download">⬇️ ดาวน์โหลด</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p>ไม่มีแบบฟอร์ม</p>
	{/if}
</div>

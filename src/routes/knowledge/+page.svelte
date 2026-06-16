<script>
	import { navigating } from '$app/stores';
	import { convertDriveLink, openPopup } from '$lib/utils';

	/** @type {import('./$types').PageData} */
	export let data;

	$: knowledge = data.knowledge;
	$: busy = !!$navigating;
</script>

<svelte:head>
	<title>คลังความรู้ - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container" aria-busy={busy ? 'true' : undefined}>
	<h1 class="page-title page-title--with-icon">📚 คลังความรู้</h1>
	
	{#if busy}
		<p aria-live="polite">กำลังโหลด...</p>
	{:else if knowledge.length > 0}
		<div class="doc-list">
			{#each knowledge as item, index}
				<div class="doc-item">
					<div class="doc-icon">📚</div>
					<div class="doc-info">
						<div class="doc-title">{index + 1}. {item.title}</div>
					</div>
					<div class="doc-actions">
						<a href={item.link || '/knowledge'} on:click|preventDefault={() => openPopup(item.link)} class="btn-view">👁️ เปิดอ่าน</a>
						<a href={convertDriveLink(item.link)} target="_blank" class="btn-download">⬇️ ดาวน์โหลด</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p aria-live="polite">ไม่มีคลังความรู้</p>
	{/if}
</div>

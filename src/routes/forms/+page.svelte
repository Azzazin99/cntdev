<script>
	import { navigating } from '$app/stores';
	import { convertDriveLink, openPopup } from '$lib/utils';

	/** @type {import('./$types').PageData} */
	export let data;

	$: forms = data.forms;
	$: busy = !!$navigating;
</script>

<svelte:head>
	<title>แบบฟอร์ม - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container" aria-busy={busy ? 'true' : undefined}>
	<h1 class="page-title page-title--with-icon">📝 แบบฟอร์ม</h1>
	
	{#if busy}
		<p aria-live="polite">กำลังโหลด...</p>
	{:else if forms.length > 0}
		<div class="doc-list">
			{#each forms as form, index}
				<div class="doc-item">
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
		<p aria-live="polite">ไม่มีแบบฟอร์ม</p>
	{/if}
</div>

<script>
	import { navigating } from '$app/stores';
	import { openPopup } from '$lib/utils';
	import { resolveDocumentViewUrl } from '$lib/documentLink';

	/** @type {import('./$types').PageData} */
	export let data;

	$: news = data.news;
	$: busy = !!$navigating;
</script>

<svelte:head>
	<title>ข่าวประชาสัมพันธ์ - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container" aria-busy={busy ? 'true' : undefined}>
	<h1 class="page-title page-title--with-icon">📰 ข่าวประชาสัมพันธ์</h1>
	
	{#if busy}
		<p aria-live="polite">กำลังโหลด...</p>
	{:else if news.length > 0}
		<div class="timeline-container">
			{#each news as item}
				<div class="timeline-item">
					<div class="timeline-dot"></div>
					<div class="timeline-content">
						<div class="timeline-date">📅 {item.date}</div>
						<h3>{item.title}</h3>
						<a
							href={resolveDocumentViewUrl(item.link)}
							on:click|preventDefault={() => openPopup(resolveDocumentViewUrl(item.link))}
							class="btn-view"
						>👁️ เปิดอ่าน</a>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p aria-live="polite">ไม่มีข่าวประชาสัมพันธ์</p>
	{/if}
</div>

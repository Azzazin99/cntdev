<script>
	import { navigating } from '$app/stores';
	import { openPopup } from '$lib/utils';

	/** @type {import('./$types').PageData} */
	export let data;

	$: activities = data.activities;
	$: busy = !!$navigating;
</script>

<svelte:head>
	<title>ภาพกิจกรรม - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container" aria-busy={busy ? 'true' : undefined}>
	<h1 class="page-title page-title--with-icon">📸 ภาพกิจกรรม</h1>
	
	{#if busy}
		<p aria-live="polite">กำลังโหลด...</p>
	{:else if activities.length > 0}
		<div class="activities-grid">
			{#each activities as item}
				<button class="activity-card" on:click={() => openPopup(item.link)} aria-label="ดูรายละเอียด {item.title}">
					<img src={item.image} alt={item.title} class="activity-img" loading="lazy" decoding="async">
					<div class="activity-content">
						<div class="activity-date">📅 {item.date}</div>
						<h3>{item.title}</h3>
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<p aria-live="polite">ไม่มีภาพกิจกรรม</p>
	{/if}
</div>

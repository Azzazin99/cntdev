<script>
	import { onMount } from 'svelte';
	import { openPopup } from '$lib/utils';
	import { fetchActivities } from '$lib/fetchNews';
	
	let activities = [];
	let loading = true;
	
	onMount(async () => {
		activities = await fetchActivities();
		loading = false;
	});
</script>

<svelte:head>
	<title>ภาพกิจกรรม - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container">
	<h2 class="section-title">📸 ภาพกิจกรรม</h2>
	
	{#if loading}
		<p>กำลังโหลด...</p>
	{:else if activities.length > 0}
		<div class="activities-grid">
			{#each activities as item}
				<button class="activity-card" on:click={() => openPopup(item.link)} aria-label="ดูรายละเอียด {item.title}">
					<img src={item.image} alt={item.title} class="activity-img">
					<div class="activity-content">
						<div class="activity-date">📅 {item.date}</div>
						<h3>{item.title}</h3>
					</div>
				</button>
			{/each}
		</div>
	{:else}
		<p>ไม่มีภาพกิจกรรม</p>
	{/if}
</div>
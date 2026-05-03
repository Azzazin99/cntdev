<script>
	import { onMount } from 'svelte';
	import { sortByDate, openPopup } from '$lib/utils';
	
	let activities = [];
	let loading = true;
	
	onMount(async () => {
		try {
			const res = await fetch('/assets/data/activities.json');
			if (res.ok) {
				const data = await res.json();
				activities = sortByDate(data);
			}
		} catch (e) {
			console.error('Error loading activities:', e);
		} finally {
			loading = false;
		}
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
				<div class="activity-card">
					<img src={item.image} alt={item.title} class="activity-img">
					<div class="activity-content">
						<div class="activity-date">📅 {item.date}</div>
						<h3>{item.title}</h3>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p>ไม่มีภาพกิจกรรม</p>
	{/if}
</div>

<style>
	.activities-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}
	
	.activity-card {
		background: var(--white);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px var(--shadow);
	}
	
	.activity-img {
		width: 100%;
		height: 200px;
		object-fit: cover;
		object-position: top center;
	}
	
	.activity-content {
		padding: 1rem 1.5rem;
	}
	
	.activity-date {
		font-size: 0.85rem;
		color: var(--text-gray);
		margin-bottom: 0.5rem;
	}
</style>
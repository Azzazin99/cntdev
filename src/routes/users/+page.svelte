<script>
	import { onMount } from 'svelte';
	
	let personnel = [];
	let loading = true;
	
	onMount(async () => {
		try {
			const res = await fetch('/assets/data/personnel.json');
			if (res.ok) {
				personnel = await res.json();
			}
		} catch (e) {
			console.error('Error loading personnel:', e);
		} finally {
			loading = false;
		}
	});
	
	function convertDriveLink(url) {
		if (!url) return '#';
		const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
		if (match && match[1]) {
			return `https://drive.google.com/uc?export=download&id=${match[1]}`;
		}
		return url;
	}
</script>

<svelte:head>
	<title>บุคลากร - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container">
	<h2 class="section-title">👥 บุคลากร</h2>
	
	{#if loading}
		<p>กำลังโหลด...</p>
	{:else if personnel.length > 0}
		<div class="org-chart-container">
			{#each personnel as person}
				<div class="org-connector">
					<div class="org-card">
						<div class="org-img-wrapper">
							<img src={convertDriveLink(person.image)} alt={person.name} class="org-img">
						</div>
						<div class="org-info">
							<h3 class="org-name">{person.name}</h3>
							<div class="org-position">{person.position}</div>
							<div class="org-phone">📞 {person.phone}</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<p>ไม่มีข้อมูลบุคลากร</p>
	{/if}
</div>

<style>
	.org-chart-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}
	
	.org-connector {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	
	.org-card {
		background: var(--white);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 12px var(--shadow);
		text-align: center;
		transition: transform 0.3s;
		width: 100%;
		max-width: 320px;
		border-top: none !important;
	}
	
	.org-card:hover {
		transform: translateY(-5px);
	}
	
	.org-img-wrapper {
		width: 100%;
		height: 400px;
		margin: 0;
		border-radius: 0;
		overflow: hidden;
		border: none;
	}
	
	.org-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.org-info {
		padding: 1.2rem 1rem 1.5rem;
	}
	
	.org-name {
		font-size: clamp(1rem, 4vw, 1.25rem);
		font-weight: 700;
		color: var(--primary-purple);
		margin-bottom: 0.25rem;
	}
	
	.org-position {
		font-size: clamp(0.85rem, 3.5vw, 1rem);
		color: var(--text-gray);
		margin-bottom: 1rem;
		font-weight: 500;
		line-height: 1.4;
	}
	
	.org-phone {
		font-size: 0.9rem;
		background: var(--bg-gray);
		padding: 0.6rem 1rem;
		border-radius: 6px;
		display: inline-block;
		color: var(--text-dark);
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}
</style>
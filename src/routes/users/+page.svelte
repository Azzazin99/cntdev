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
		border-top: 4px solid var(--primary-purple);
		width: 100%;
		max-width: 350px;
	}
	
	.org-card:hover {
		transform: translateY(-5px);
	}
	
	.org-img-wrapper {
		width: 180px;
		height: 180px;
		margin: 2.5rem auto 1.2rem;
		border-radius: 50%;
		overflow: hidden;
		border: 3px solid var(--primary-purple-light);
	}
	
	.org-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}
	
	.org-info {
		padding: 0 1.5rem 2rem;
	}
	
	.org-name {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--primary-purple);
		margin-bottom: 0.25rem;
	}
	
	.org-position {
		font-size: 0.95rem;
		color: var(--text-gray);
		margin-bottom: 1rem;
		font-weight: 500;
	}
	
	.org-phone {
		font-size: 0.9rem;
		background: var(--bg-gray);
		padding: 0.5rem;
		border-radius: 6px;
		display: inline-block;
		color: var(--text-dark);
	}
</style>
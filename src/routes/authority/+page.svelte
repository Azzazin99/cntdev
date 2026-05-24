<script>
	import { onMount } from 'svelte';
	import { fetchSiteList } from '$lib/fetchNews';
	
	let authority = [];
	let loading = true;
	
	onMount(async () => {
		authority = await fetchSiteList('authority');
		loading = false;
	});
</script>

<svelte:head>
	<title>อำนาจหน้าที่ - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container">
	<h2 class="section-title">⚖️ อำนาจหน้าที่</h2>
	
	{#if loading}
		<p>กำลังโหลด...</p>
	{:else if authority.length > 0}
		<ul class="auth-list">
			{#each authority as item}
				<li class="auth-item">
					<span class="auth-icon">✅</span>
					<span>{item}</span>
				</li>
			{/each}
		</ul>
	{:else}
		<p>ไม่มีข้อมูลอำนาจหน้าที่</p>
	{/if}
</div>

<style>
	.auth-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1rem;
	}
	
	.auth-item {
		background: var(--white);
		padding: 1.5rem;
		border-radius: 8px;
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		box-shadow: 0 2px 4px var(--shadow);
		transition: transform 0.2s;
	}
	
	.auth-item:hover {
		transform: translateX(5px);
	}
	
	.auth-icon {
		font-size: 1.2rem;
		color: var(--primary-purple);
		flex-shrink: 0;
	}
</style>
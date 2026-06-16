<script>
	import { navigating } from '$app/stores';

	/** @type {import('./$types').PageData} */
	export let data;

	$: authority = data.authority;
	$: busy = !!$navigating;
</script>

<svelte:head>
	<title>อำนาจหน้าที่ - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container" aria-busy={busy ? 'true' : undefined}>
	<h1 class="page-title page-title--with-icon">⚖️ อำนาจหน้าที่</h1>
	
	{#if busy}
		<p aria-live="polite">กำลังโหลด...</p>
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
		<p aria-live="polite">ไม่มีข้อมูลอำนาจหน้าที่</p>
	{/if}
</div>

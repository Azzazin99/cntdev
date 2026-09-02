<script>
	import { navigating } from '$app/stores';
	import {
		PERSONNEL_IMAGE_FALLBACK,
		resolvePersonnelImageSrc
	} from '$lib/personnelImage';

	/** @type {import('./$types').PageData} */
	export let data;

	$: personnel = data.personnel;
	$: busy = !!$navigating;

	/** @param {Event} e */
	function handleImgError(e) {
		const img = /** @type {HTMLImageElement | null} */ (e.currentTarget);
		if (img && img.src !== PERSONNEL_IMAGE_FALLBACK) {
			img.src = PERSONNEL_IMAGE_FALLBACK;
		}
	}
</script>

<svelte:head>
	<title>บุคลากร - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container" aria-busy={busy ? 'true' : undefined}>
	<h1 class="page-title page-title--with-icon">👥 บุคลากร</h1>

	{#if busy}
		<p aria-live="polite">กำลังโหลด...</p>
	{:else if personnel.length > 0}
		<div class="personnel-list">
			{#each personnel as person}
				<article class="personnel-card">
					<div class="personnel-photo">
						<img
							src={resolvePersonnelImageSrc(person.image)}
							alt={person.name || 'รูปบุคลากร'}
							class="personnel-photo__img"
							loading="lazy"
							decoding="async"
							on:error={handleImgError}
						/>
					</div>
					<div class="personnel-info">
						<h2 class="personnel-name">{person.name}</h2>
						<p class="personnel-position">{person.position}</p>
						<p class="personnel-phone">📞 {person.phone}</p>
					</div>
				</article>
			{/each}
		</div>
	{:else}
		<p aria-live="polite">ไม่มีข้อมูลบุคลากร</p>
	{/if}
</div>

<style>
	.personnel-list {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}

	.personnel-card {
		width: 100%;
		max-width: 400px;
		background: var(--white);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 1px 3px var(--shadow);
		border: 1px solid var(--border-subtle);
		text-align: center;
		transition:
			box-shadow 0.2s var(--ease-out),
			border-color 0.2s var(--ease-out);
	}

	.personnel-card:hover {
		box-shadow: 0 3px 10px var(--shadow);
		border-color: var(--border-hover);
	}

	.personnel-photo {
		width: 100%;
		background: var(--bg-gray);
	}

	.personnel-photo__img {
		width: 100%;
		height: auto;
		display: block;
		vertical-align: top;
	}

	.personnel-info {
		padding: 1.2rem 1rem 1.5rem;
	}

	.personnel-name {
		font-size: clamp(1rem, 4vw, 1.25rem);
		font-weight: 700;
		color: var(--primary-purple);
		margin-bottom: 0.25rem;
		text-wrap: balance;
	}

	.personnel-position {
		font-size: clamp(0.85rem, 3.5vw, 1rem);
		color: var(--text-gray);
		margin-bottom: 1rem;
		font-weight: 500;
		line-height: 1.4;
		text-wrap: pretty;
	}

	.personnel-phone {
		font-size: 0.9rem;
		background: var(--bg-gray);
		padding: 0.6rem 1rem;
		border-radius: 6px;
		color: var(--text-dark);
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin: 0;
	}
</style>

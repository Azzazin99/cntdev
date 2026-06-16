<script>
	import { onMount } from 'svelte';

	export let data;
	export let form;

	let username = 'admin';
	let password = '';
	let turnstileLoadError = false;

	onMount(() => {
		if (!data.turnstileEnabled || !data.turnstileSiteKey) return;

		const sitekey = data.turnstileSiteKey;
		const container = document.querySelector('.cf-turnstile');
		if (!container) return;

		const render = () => {
			// @ts-ignore — loaded from Cloudflare script
			if (!window.turnstile) {
				turnstileLoadError = true;
				return;
			}
			container.innerHTML = '';
			// @ts-ignore
			window.turnstile.render(container, { sitekey });
		};

		// @ts-ignore
		if (window.turnstile) {
			render();
			return;
		}

		const existing = document.querySelector('script[data-turnstile]');
		if (existing) {
			existing.addEventListener('load', render, { once: true });
			return;
		}

		const script = document.createElement('script');
		script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
		script.async = true;
		script.defer = true;
		script.dataset.turnstile = '1';
		script.onload = render;
		script.onerror = () => {
			turnstileLoadError = true;
		};
		document.head.appendChild(script);
	});
</script>

<svelte:head>
	<title>เข้าสู่ระบบ - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container">
	<div class="login-card">
		<h1 class="title">🔐 เข้าสู่ระบบแอดมิน</h1>
		<p class="subtitle">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าหน้าจัดการข่าวและเนื้อหาเว็บ</p>

		{#if form?.error}
			<div class="alert error">❌ {form.error}</div>
		{/if}

		{#if data.turnstileMisconfigured}
			<div class="alert warn">
				ตั้งค่า Turnstile ไม่ครบ: มี Site Key แต่ไม่มี Secret — ลบ `PUBLIC_TURNSTILE_SITE_KEY` ออกจาก `.env.local`
				หรือใส่ `TURNSTILE_SECRET_KEY` คู่กัน แล้วรีสตาร์ท `npm run dev`
			</div>
		{/if}

		{#if turnstileLoadError}
			<div class="alert warn">
				โหลด Cloudflare Turnstile ไม่ได้ — ตรวจสอบ hostname ใน Dashboard (ต้องมี `localhost` และ `127.0.0.1`)
				หรือปิด Turnstile ชั่วคราวโดยลบ env ทั้งสองตัวแล้วรีสตาร์ท dev server
			</div>
		{/if}

		<form method="POST" action={`?redirect=${encodeURIComponent(data.redirectTo)}`}>
			<label class="label" for="username">ชื่อผู้ใช้</label>
			<input
				id="username"
				name="username"
				type="text"
				class="input"
				bind:value={username}
				autocomplete="username"
				autocapitalize="off"
				spellcheck="false"
				required
			>

			<label class="label" for="password">รหัสผ่าน</label>
			<input
				id="password"
				name="password"
				type="password"
				class="input"
				bind:value={password}
				autocomplete="current-password"
				required
			>

			{#if data.turnstileEnabled}
				<div class="turnstile-wrap">
					<div class="cf-turnstile"></div>
				</div>
			{/if}

			<div class="actions">
				<button class="btn primary" type="submit">เข้าสู่ระบบ</button>
			</div>
		</form>
	</div>
</div>

<style>
	.login-card {
		max-width: 520px;
		margin: 2rem auto;
		background: var(--white);
		border-radius: 14px;
		box-shadow: 0 1px 3px var(--shadow);
		border: 1px solid var(--border-subtle);
		padding: 2rem;
	}

	.title {
		margin: 0 0 0.25rem 0;
		font-size: var(--text-2xl);
		font-weight: 700;
		line-height: var(--leading-tight);
		text-wrap: balance;
		color: var(--text-dark);
	}

	.subtitle {
		margin: 0 0 1.5rem 0;
		font-size: var(--text-sm);
		line-height: var(--leading-normal);
		color: var(--text-gray);
	}

	.label {
		display: block;
		margin: 0.75rem 0 0.4rem 0;
		font-weight: 600;
		color: var(--text-dark);
	}

	.input {
		width: 100%;
		padding: 0.85rem 1rem;
		border-radius: 10px;
		border: 1px solid var(--border-subtle);
		background: var(--white);
		color: var(--text-dark);
		min-height: 44px;
		font-family: inherit;
	}

	.input:focus-visible {
		border-color: var(--primary-purple);
		box-shadow: 0 0 0 3px var(--color-info-bg);
	}

	.turnstile-wrap {
		margin-top: 1rem;
		min-height: 65px;
	}

	.actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 1.25rem;
		flex-wrap: wrap;
	}

	.btn {
		min-height: 44px;
		padding: 0.75rem 1rem;
		border-radius: 10px;
		border: 1px solid transparent;
		cursor: pointer;
		font-weight: 700;
		font-family: inherit;
	}

	.btn.primary {
		background: var(--btn-primary-bg);
		color: var(--btn-primary-text);
	}

	.btn.primary:hover:not(:disabled) {
		background: var(--btn-primary-hover);
	}

	.btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.alert {
		border-radius: 10px;
		padding: 0.85rem 1rem;
		margin: 0 0 1rem 0;
		font-weight: 600;
	}

	.alert.error {
		background: var(--color-error-bg);
		color: var(--color-error);
	}

	.alert.warn {
		background: var(--color-warning-bg);
		color: var(--color-warning);
		font-weight: 600;
		font-size: 0.9rem;
		line-height: 1.45;
	}

	:global(body.dark-mode) .login-card {
		background: var(--white);
	}

	:global(body.dark-mode) .title,
	:global(body.dark-mode) .label {
		color: var(--text-dark);
	}

	:global(body.dark-mode) .subtitle {
		color: var(--text-gray);
	}

	:global(body.dark-mode) .input {
		background: var(--white);
		border-color: var(--border-subtle);
		color: var(--text-dark);
	}
</style>

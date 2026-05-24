<script>
	export let data;
	export let form;

	let username = 'admin';
	let password = '';
</script>

<svelte:head>
	<title>เข้าสู่ระบบ - กลุ่มพัฒนาครูฯ</title>
	{#if data.turnstileSiteKey}
		<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
	{/if}
</svelte:head>

<div class="container">
	<div class="login-card">
		<h2 class="title">🔐 เข้าสู่ระบบแอดมิน</h2>
		<p class="subtitle">กรอกชื่อผู้ใช้และรหัสผ่านเพื่อเข้าหน้าจัดการข่าวและเนื้อหาเว็บ</p>

		{#if form?.error}
			<div class="alert error">❌ {form.error}</div>
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

			{#if data.turnstileSiteKey}
				<div class="turnstile-wrap">
					<div class="cf-turnstile" data-sitekey={data.turnstileSiteKey}></div>
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
		box-shadow: 0 6px 18px var(--shadow);
		padding: 2rem;
	}

	.title {
		margin: 0 0 0.25rem 0;
		color: var(--text-dark);
	}

	.subtitle {
		margin: 0 0 1.5rem 0;
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
		border: 1px solid #ddd;
		background: var(--white);
		color: var(--text-dark);
		min-height: 44px;
		font-family: inherit;
	}

	.input:focus {
		outline: none;
		border-color: var(--primary-purple);
		box-shadow: 0 4px 12px rgba(123, 31, 162, 0.2);
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
		background: var(--primary-purple);
		color: white;
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
		background: rgba(198, 40, 40, 0.12);
		color: #c62828;
	}

	:global(body.dark-mode) .login-card {
		background: #2d2d2d;
	}

	:global(body.dark-mode) .title {
		color: #f1f1f1;
	}

	:global(body.dark-mode) .label {
		color: #f1f1f1;
	}

	:global(body.dark-mode) .subtitle {
		color: #cfcfcf;
	}

	:global(body.dark-mode) .input {
		background: #1f1f1f;
		border-color: #444;
		color: #f1f1f1;
	}
</style>

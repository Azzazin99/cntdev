<script>
	import { navigating } from '$app/stores';
	import { openPopup } from '$lib/utils';
	import { resolveDocumentViewUrl } from '$lib/documentLink';

	/** @type {import('./$types').PageData} */
	export let data;

	$: news = data.news;
	$: activities = data.activities;
	$: busy = !!$navigating;
</script>

<div class="container grid-layout" aria-busy={busy ? 'true' : undefined}>
	<!-- Left Content -->
	<main>
		<h1 class="sr-only">กลุ่มพัฒนาครูและบุคลากรทางการศึกษา สพป.ชัยนาท</h1>
		<!-- Activities Section FIRST (Below Navbar) -->
		<section aria-labelledby="home-activities-heading">
			<h2 id="home-activities-heading" class="section-title">📸 ภาพกิจกรรม</h2>
			
			{#if busy}
				<p aria-live="polite">กำลังโหลด...</p>
			{:else if activities.length > 0}
				<div class="activities-home-grid">
					{#each activities as item}
						<button class="activity-home-card" on:click={() => openPopup(item.link)} aria-label="ดูรายละเอียด {item.title}">
							<div class="activity-home-img">
								<img src={item.image} alt={item.title} loading="lazy" decoding="async">
							</div>
							<div class="activity-home-content">
								<div class="activity-home-date">📅 {item.date}</div>
								<h3 class="activity-home-title">{item.title}</h3>
							</div>
						</button>
					{/each}
				</div>
				<div class="section-actions">
					<a href="/activities" class="btn-download">ดูภาพกิจกรรมทั้งหมด</a>
				</div>
			{:else}
				<p aria-live="polite">ไม่มีภาพกิจกรรม</p>
			{/if}
		</section>

		<!-- News Section -->
		<section aria-labelledby="home-news-heading">
			<h2 id="home-news-heading" class="section-title">📰 ข่าวประชาสัมพันธ์ล่าสุด</h2>
			
			{#if busy}
				<p aria-live="polite">กำลังโหลด...</p>
			{:else if news.length > 0}
				<div class="news-list">
					{#each news as item}
						<a 
							href={resolveDocumentViewUrl(item.link)} 
							on:click|preventDefault={() => openPopup(resolveDocumentViewUrl(item.link))} 
							class="news-link-item"
						>
							<div class="news-link-date">📅 {item.date}</div>
							<div class="news-link-title">{item.title}</div>
						</a>
					{/each}
				</div>
				<div class="section-actions">
					<a href="/news" class="btn-download">ดูข่าวทั้งหมด</a>
				</div>
			{:else}
				<p aria-live="polite">ไม่มีข่าวประชาสัมพันธ์</p>
			{/if}
		</section>

		<!-- Banner Section -->
		<section class="banner-section">
			<a href="https://sites.google.com/view/cntpa" target="_blank" rel="noopener noreferrer">
				<img src="https://cnt.go.th/imh/uploads/77cac636e8e96afe0c855785181b56de.png" alt="ลิงก์ไปยัง Google Sites กลุ่มพัฒนาครู" loading="lazy" decoding="async">
			</a>
		</section>

		<!-- OBEC Documents -->
		<section>
			<h2 class="section-title">📚 คู่มือ OBEC AWARD</h2>
			<div class="doc-list">
				<div class="doc-item">
					<div class="doc-icon">🏆</div>
					<div class="doc-info">
						<div class="doc-title">คู่มือ OBEC Award เล่มที่ 1</div>
					</div>
					<div class="doc-actions">
						<a href="https://drive.google.com/file/d/1L21HQFth5CfpfzZYLMdgntgddaOarQvq/view?usp=drive_link" target="_blank" class="btn-download">
							⬇️ ดาวน์โหลด
						</a>
					</div>
				</div>

				<div class="doc-item">
					<div class="doc-icon">🏆</div>
					<div class="doc-info">
						<div class="doc-title">คู่มือ OBEC Award เล่มที่ 2</div>
					</div>
					<div class="doc-actions">
						<a href="https://drive.google.com/file/d/1ZYOOJPX65eMsZDfZFJJYCsEGaNjdnyDV/view?usp=drive_link" target="_blank" class="btn-download">
							⬇️ ดาวน์โหลด
						</a>
					</div>
				</div>

				<div class="doc-item">
					<div class="doc-icon">🏆</div>
					<div class="doc-info">
						<div class="doc-title">คู่มือ OBEC Award เล่มที่ 3</div>
					</div>
					<div class="doc-actions">
						<a href="https://drive.google.com/file/d/1usTS3JgY97Eo9AyNDejH1dPslWGD8xYM/view?usp=drive_link" target="_blank" class="btn-download">
							⬇️ ดาวน์โหลด
						</a>
					</div>
				</div>
			</div>

			<div class="section-actions section-actions--spaced">
				<a href="/forms" class="btn-primary">แบบฟอร์ม</a>
			</div>
		</section>
	</main>

	<!-- Right Sidebar -->
	<aside class="sidebar">
		<!-- Registry System -->
		<a href="https://script.google.com/macros/s/AKfycbypYPZ8CqMIct0hO9OVE-tpZHbevWYGGKh_UvgB1I9ci5a9JQ0vWDNh3TA7K-_fFUQ/exec" target="_blank" rel="noopener noreferrer" class="sidebar-card">
			<img src="/assets/images/registry-system.png" alt="ระบบทะเบียนประวัติ" loading="lazy" decoding="async">
		</a>

		<!-- Certificate Bank -->
		<a href="/certificates" class="sidebar-card">
			<div class="sidebar-content">
				<div class="sidebar-icon">🏆</div>
				<div class="sidebar-title">คลังเกียรติบัตร</div>
			</div>
		</a>

		<!-- Knowledge Bank -->
		<a href="/knowledge" class="sidebar-card">
			<div class="sidebar-content">
				<div class="sidebar-icon">📚</div>
				<div class="sidebar-title">คลังความรู้</div>
				<div class="sidebar-subtitle">คำสั่ง/ประกาศ/ระเบียบ</div>
			</div>
		</a>
	</aside>
</div>

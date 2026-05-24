<script>
	import { onMount } from 'svelte';
	import { fetchActivities, fetchNews } from '$lib/fetchNews';
	
	let news = [];
	let activities = [];
	let loading = true;
	
	onMount(async () => {
		const [newsData, actData] = await Promise.all([fetchNews(), fetchActivities()]);
		news = newsData.slice(0, 3);
		activities = actData.slice(0, 4);
		loading = false;
	});
	
	function openPopup(url) {
		if (!url || url === '#') return;
		const width = 1000;
		const height = 800;
		const left = (screen.width - width) / 2;
		const top = (screen.height - height) / 2;
		window.open(url, 'DocumentView', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
	}
</script>

<div class="container grid-layout">
	<!-- Left Content -->
	<main>
		<!-- Activities Section FIRST (Below Navbar) -->
		<section>
			<h2 class="section-title">📸 ภาพกิจกรรม</h2>
			
			{#if loading}
				<p>กำลังโหลด...</p>
			{:else if activities.length > 0}
				<div class="activities-home-grid">
					{#each activities as item}
						<button class="activity-home-card" on:click={() => openPopup(item.link)} aria-label="ดูรายละเอียด {item.title}">
							<div class="activity-home-img">
								<img src={item.image} alt={item.title}>
							</div>
							<div class="activity-home-content">
								<div class="activity-home-date">📅 {item.date}</div>
								<h3 class="activity-home-title">{item.title}</h3>
							</div>
						</button>
					{/each}
				</div>
				<div style="text-align: center; margin-top: 2rem;">
					<a href="/activities" class="btn-download" style="padding: 10px 20px; border: 1px solid var(--primary-purple); border-radius: 5px;">ดูภาพกิจกรรมทั้งหมด</a>
				</div>
			{:else}
				<p>ไม่มีภาพกิจกรรม</p>
			{/if}
		</section>

		<!-- News Section -->
		<section>
			<h2 class="section-title">📰 ข่าวประชาสัมพันธ์ล่าสุด</h2>
			
			{#if loading}
				<p>กำลังโหลด...</p>
			{:else if news.length > 0}
				<div class="news-list" style="display: flex; flex-direction: column;">
					{#each news as item}
						<a 
							href={item.link || '/news'} 
							on:click|preventDefault={() => openPopup(item.link)} 
							class="news-link-item"
						>
							<div class="news-link-date">📅 {item.date}</div>
							<div class="news-link-title">{item.title}</div>
						</a>
					{/each}
				</div>
				<div style="text-align: center; margin-top: 1rem;">
					<a href="/news" class="btn-download" style="padding: 10px 20px; border: 1px solid var(--primary-purple); border-radius: 5px;">ดูข่าวทั้งหมด</a>
				</div>
			{:else}
				<p>ไม่มีข่าวประชาสัมพันธ์</p>
			{/if}
		</section>

		<!-- Banner Section -->
		<section class="banner-section" style="height: auto; min-height: auto;">
			<a href="https://sites.google.com/view/cntpa" target="_blank" style="display: block;">
				<img src="https://cnt.go.th/imh/uploads/77cac636e8e96afe0c855785181b56de.png" alt="Banner" style="width: 100%; height: auto; object-fit: contain;">
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

			<div style="margin-top: 2rem; text-align: center;">
				<a href="/forms" class="btn-download" style="background:var(--primary-purple); color:white; padding: 12px 30px; border-radius: 8px;">แบบฟอร์ม</a>
			</div>
		</section>
	</main>

	<!-- Right Sidebar -->
	<aside class="sidebar">
		<!-- Registry System -->
		<a href="https://script.google.com/macros/s/AKfycbypYPZ8CqMIct0hO9OVE-tpZHbevWYGGKh_UvgB1I9ci5a9JQ0vWDNh3TA7K-_fFUQ/exec" target="_blank" rel="noopener noreferrer" class="sidebar-card">
			<img src="/assets/images/registry-system.png" alt="ระบบทะเบียนประวัติ">
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

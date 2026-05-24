<script>
	import { onMount } from 'svelte';
	
	let certificates = [];
	let filteredCertificates = [];
	let loading = true;
	let error = null;
	
	let searchName = '';
	let filterYear = '';
	let filterCourse = '';
	let filterType = '';
	
	let years = [];
	let courses = [];
	let types = [];
	
	const itemsPerPage = 10;
	let currentPage = 1;

	const FALLBACK_SHEET_URL =
		'https://docs.google.com/spreadsheets/d/e/2PACX-1vTRZKKSC38bKraDDdDE5hjVGQtbr1e0inwEK63m73tJAnYaNNo_AbxbGX_IF__eEwRC7_JGB0-dQiDP/pub?output=csv';

	let sheetUrl = FALLBACK_SHEET_URL;
	
	onMount(async () => {
		try {
			const configRes = await fetch('/api/certificates/config');
			if (configRes.ok) {
				const config = await configRes.json();
				if (config.sheetUrl) sheetUrl = config.sheetUrl;
			}
		} catch (e) {
			console.warn('Could not load certificates config, using fallback URL', e);
		}
		await loadData();
	});
	
	async function loadData() {
		loading = true;
		error = null;
		
		try {
			const res = await fetch(sheetUrl);
			if (res.ok) {
				const text = await res.text();
				certificates = parseCSV(text);
				
				// Extract filter options
				years = [...new Set(certificates.map(c => c.year).filter(y => y))].sort().reverse();
				courses = [...new Set(certificates.map(c => c.course).filter(c => c && c.trim() !== '-'))].sort();
				types = [...new Set(certificates.map(c => c.type).filter(t => t && t.trim() !== '' && t.trim() !== '-'))].sort();
				
				filteredCertificates = certificates;
			} else {
				error = 'ไม่สามารถโหลดข้อมูลได้';
			}
		} catch (e) {
			error = 'เกิดข้อผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}
	
	function parseCSV(text) {
		const rows = text.split('\n').filter(r => r.trim() !== '');
		const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
		
		return rows.slice(1).map(row => {
			const values = [];
			let inQuote = false;
			let currentVal = '';
			
			for (let i = 0; i < row.length; i++) {
				const char = row[i];
				if (char === '"') {
					inQuote = !inQuote;
				} else if (char === ',' && !inQuote) {
					values.push(currentVal.trim().replace(/^"|"$/g, ''));
					currentVal = '';
				} else {
					currentVal += char;
				}
			}
			values.push(currentVal.trim().replace(/^"|"$/g, ''));
			
			const obj = {};
			headers.forEach((h, index) => {
				obj[h] = values[index] || '';
			});
			return obj;
		});
	}
	
	$: {
		filteredCertificates = certificates.filter(cert => {
			const matchName = !searchName || 
				(cert.name && cert.name.toLowerCase().includes(searchName.toLowerCase()));
			const matchYear = !filterYear || cert.year === filterYear;
			const matchCourse = !filterCourse || cert.course === filterCourse;
			const matchType = !filterType || cert.type === filterType;
			
			return matchName && matchYear && matchCourse && matchType;
		});
		currentPage = 1;
	}
	
	$: paginatedCertificates = filteredCertificates.slice(
		(currentPage - 1) * itemsPerPage,
		currentPage * itemsPerPage
	);
	
	$: totalPages = Math.ceil(filteredCertificates.length / itemsPerPage) || 1;
	
	function goToPage(page) {
		if (page < 1) page = 1;
		if (page > totalPages) page = totalPages;
		currentPage = page;
	}
	
	function getDriveUrls(link) {
		if (!link) return { view: null, download: null };
		const match = link.match(/\/d\/([a-zA-Z0-9_-]+)/) || link.match(/id=([a-zA-Z0-9_-]+)/);
		if (match) {
			const id = match[1];
			return {
				view: `https://drive.google.com/file/d/${id}/view?usp=sharing`,
				download: `https://drive.google.com/uc?export=download&id=${id}`
			};
		}
		return { view: link, download: link };
	}
	
	function openPopup(url) {
		if (!url) return;
		const width = 1000;
		const height = 800;
		const left = (screen.width - width) / 2;
		const top = (screen.height - height) / 2;
		window.open(url, 'DocumentView', `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`);
	}

	function toggleFrameCourse(course) {
		filterCourse = filterCourse === course ? '' : course;
	}
</script>

<svelte:head>
	<title>คลังเกียรติบัตร - กลุ่มพัฒนาครูฯ</title>
</svelte:head>

<div class="container">
	<h2 class="section-title">🏆 คลังเกียรติบัตร (Certificate Bank)</h2>
	
	{#if loading}
		<div class="loading-state">
			<p>กำลังโหลดข้อมูล...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<p>❌ {error}</p>
		</div>
	{:else}
		<div class="cert-page-layout">
			<aside class="cert-sidebar" aria-label="กรอบเกียรติบัตร">
				<div class="cert-sidebar-title">🏅 กรอบเกียรติบัตร</div>
				<button
					type="button"
					class="cert-frame-link"
					class:active={filterCourse === 'ครูดีในดวงใจ'}
					on:click={() => toggleFrameCourse('ครูดีในดวงใจ')}
				>
					<span class="frame-icon">💖</span>
					<span class="frame-text">รางวัลครูดีในดวงใจ</span>
				</button>
				<button
					type="button"
					class="cert-frame-link"
					class:active={filterCourse === 'ครูและบุคลากรทางการศึกษาดีเด่น'}
					on:click={() => toggleFrameCourse('ครูและบุคลากรทางการศึกษาดีเด่น')}
				>
					<span class="frame-icon">🎖️</span>
					<span class="frame-text">รางวัลครูและบุคลากรทางการศึกษาดีเด่น</span>
				</button>
				<button
					type="button"
					class="cert-frame-link"
					class:active={filterCourse === 'อบรมพัฒนาครูผู้ช่วยสู่การเป็นครูมืออาชีพ'}
					on:click={() => toggleFrameCourse('อบรมพัฒนาครูผู้ช่วยสู่การเป็นครูมืออาชีพ')}
				>
					<span class="frame-icon">🎓</span>
					<span class="frame-text">อบรมพัฒนาครูผู้ช่วยสู่การเป็นครูมืออาชีพ</span>
				</button>
			</aside>

			<div class="cert-main-content">
				<div class="hero-section">
					<div class="hero-icon">🎓</div>
					<h3>ค้นหาเกียรติบัตรของคุณ</h3>
					<p>พิมพ์ชื่อ-นามสกุล เพื่อตรวจสอบและดาวน์โหลดเอกสาร</p>
				</div>
				
				<div class="search-container">
					<div class="search-row">
						<div class="search-field flex-2">
							<span class="search-icon">🔍</span>
							<input 
								type="text" 
								class="search-input" 
								placeholder="พิมพ์ชื่อ-สกุล..." 
								bind:value={searchName}
							>
						</div>
						
						<div class="search-field flex-1">
							<select class="search-input" bind:value={filterYear}>
								<option value="">📅 ปีทั้งหมด</option>
								{#each years as year}
									<option value={year}>{year}</option>
								{/each}
							</select>
						</div>
						
						<div class="search-field flex-1">
							<select class="search-input" bind:value={filterCourse}>
								<option value="">📘 อบรมพัฒนา/รางวัล</option>
								{#each courses as course}
									<option value={course}>{course}</option>
								{/each}
							</select>
						</div>
						
						<div class="search-field flex-1">
							<select class="search-input" bind:value={filterType}>
								<option value="">🎓 ประเภททั้งหมด</option>
								{#each types as type}
									<option value={type}>{type}</option>
								{/each}
							</select>
						</div>
					</div>
				</div>
				
				{#if filteredCertificates.length === 0}
					<div class="empty-state">
						<div class="empty-icon">❌</div>
						<p>ไม่พบข้อมูลที่ค้นหา</p>
					</div>
				{:else}
					<div class="cert-table-container">
						<table class="cert-table">
							<thead>
								<tr>
									<th width="30%">ชื่อ-สกุล</th>
									<th width="25%">หลักสูตร</th>
									<th width="15%">ปี</th>
									<th width="15%">ประเภท</th>
									<th width="15%">เอกสาร</th>
								</tr>
							</thead>
							<tbody>
								{#each paginatedCertificates as cert}
									{@const urls = getDriveUrls(cert.link)}
									<tr>
										<td data-label="ชื่อ-สกุล">
											<strong>{cert.name || '-'}</strong>
										</td>
										<td data-label="หลักสูตร">{cert.course || '-'}</td>
										<td data-label="ปี">{cert.year || '-'}</td>
										<td data-label="ประเภท">
											<span class="type-badge">{cert.type || '-'}</span>
										</td>
										<td data-label="เอกสาร">
											{#if cert.link && cert.link.length > 2}
												<div class="cert-actions">
													<button
														type="button"
														class="cert-view-btn"
														on:click={() => openPopup(urls.view)}
													>
														👁️ เปิดดู
													</button>
													<button
														type="button"
														class="cert-link-btn"
														on:click={() => openPopup(urls.download)}
													>
														⬇️ ดาวน์โหลด
													</button>
												</div>
											{:else}
												<span class="no-link">-</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					
					{#if filteredCertificates.length > itemsPerPage}
						<div class="pagination">
							<div class="pagination-info">
								แสดง {(currentPage - 1) * itemsPerPage + 1} ถึง {Math.min(currentPage * itemsPerPage, filteredCertificates.length)} จาก {filteredCertificates.length} รายการ
							</div>
							<div class="pagination-controls">
								<button 
									class="page-btn nav-btn" 
									on:click={() => goToPage(currentPage - 1)}
									disabled={currentPage === 1}
								>
									&lt;
								</button>
								
								{#each Array(Math.min(5, totalPages)) as _, i}
									{@const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i}
									{#if page <= totalPages}
										<button 
											class="page-btn {currentPage === page ? 'active' : ''}"
											on:click={() => goToPage(page)}
										>
											{page}
										</button>
									{/if}
								{/each}
								
								<button 
									class="page-btn nav-btn" 
									on:click={() => goToPage(currentPage + 1)}
									disabled={currentPage === totalPages}
								>
									&gt;
								</button>
							</div>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.loading-state, .error-state, .empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--text-gray);
	}
	
	.empty-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	}
	
	.hero-section {
		text-align: center;
		margin-bottom: 2rem;
		padding: 2rem;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		border-radius: 16px;
	}
	
	.hero-icon {
		font-size: 4rem;
		margin-bottom: 1rem;
	}
	
	.hero-section h3 {
		color: var(--primary-purple);
		margin-bottom: 0.5rem;
	}
	
	.hero-section p {
		color: var(--text-gray);
	}

	.cert-page-layout {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.cert-sidebar {
		width: 280px;
		min-width: 280px;
		position: sticky;
		top: 100px;
	}

	.cert-sidebar-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--primary-purple);
		margin-bottom: 1rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--primary-purple);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.cert-frame-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 1rem 1.2rem;
		margin-bottom: 0.75rem;
		background: var(--white);
		border-radius: 12px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		border: none;
		border-left: 4px solid var(--primary-purple);
		text-decoration: none;
		color: var(--text-dark);
		font-weight: 600;
		font-size: 0.95rem;
		transition: all 0.3s ease;
		cursor: pointer;
		text-align: left;
		width: 100%;
	}

	.cert-frame-link:hover {
		transform: translateX(6px);
		box-shadow: 0 4px 16px rgba(123, 31, 162, 0.2);
		border-left-color: #e91e63;
		background: linear-gradient(135deg, #faf5ff 0%, #fff 100%);
	}

	.cert-frame-link .frame-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
	}

	.cert-frame-link .frame-text {
		line-height: 1.4;
	}

	.cert-frame-link.active {
		background: linear-gradient(135deg, #7b1fa2 0%, #9c27b0 100%);
		color: white;
		border-left-color: #e91e63;
		box-shadow: 0 4px 16px rgba(123, 31, 162, 0.3);
	}

	.cert-main-content {
		flex: 1;
		min-width: 0;
	}
	
	.search-container {
		margin-bottom: 2rem;
	}
	
	.search-row {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}
	
	.search-field {
		position: relative;
		min-width: 150px;
	}
	
	.flex-1 { flex: 1; }
	.flex-2 { flex: 2; }
	
	.search-icon {
		position: absolute;
		left: 1rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-gray);
	}
	
	.search-input {
		width: 100%;
		padding: 0.8rem 1rem;
		padding-left: 3rem;
		font-size: 1rem;
		border: 2px solid #ddd;
		border-radius: 50px;
		font-family: inherit;
		transition: all 0.3s;
		background: var(--white);
		color: var(--text-dark);
	}
	
	.search-input:focus {
		outline: none;
		border-color: var(--primary-purple);
		box-shadow: 0 4px 12px rgba(123, 31, 162, 0.2);
	}
	
	.cert-table-container {
		background: var(--white);
		border-radius: 12px;
		box-shadow: 0 4px 12px var(--shadow);
		overflow: hidden;
	}
	
	.cert-table {
		width: 100%;
		border-collapse: collapse;
	}
	
	.cert-table th,
	.cert-table td {
		padding: 1rem 1.5rem;
		text-align: left;
		border-bottom: 1px solid #eee;
	}
	
	.cert-table th {
		background: var(--primary-purple);
		color: white;
		font-weight: 600;
	}
	
	.cert-table tr:hover {
		background: var(--bg-gray);
	}
	
	.type-badge {
		color: var(--primary-purple);
		font-weight: 600;
	}

	.cert-actions {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.cert-view-btn,
	.cert-link-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		padding: 10px 16px;
		border-radius: 20px;
		font-weight: 600;
		font-size: 0.9rem;
		border: none;
		cursor: pointer;
		transition: all 0.2s;
		min-height: 44px;
		white-space: nowrap;
	}

	.cert-view-btn {
		background: #2563eb;
		color: white;
	}

	.cert-view-btn:hover {
		background: #1d4ed8;
	}
	
	.cert-link-btn {
		background: var(--primary-purple-light);
		color: var(--primary-purple);
	}
	
	.cert-link-btn:hover {
		background: var(--primary-purple);
		color: white;
	}
	
	.no-link {
		color: #ccc;
	}
	
	.pagination {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 1.5rem;
		padding: 1rem 0;
		border-top: 1px solid #eaeaea;
	}
	
	.pagination-info {
		color: var(--text-gray);
		font-size: 0.9rem;
	}
	
	.pagination-controls {
		display: flex;
		gap: 0.25rem;
	}
	
	.page-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 36px;
		height: 36px;
		padding: 0 8px;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 500;
		color: #666;
		background: transparent;
		border: 1px solid transparent;
		cursor: pointer;
		transition: all 0.2s;
		font-family: inherit;
	}
	
	.page-btn:hover:not(:disabled) {
		background-color: #f5f5f5;
		color: #111;
	}
	
	.page-btn.active {
		background-color: var(--primary-purple);
		color: white;
		border-color: var(--primary-purple);
	}
	
	.page-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.page-btn.nav-btn {
		border: 1px solid #eaeaea;
		background: white;
	}
	
	.page-btn.nav-btn:hover:not(:disabled) {
		border-color: #ccc;
	}
	
	@media (max-width: 768px) {
		.cert-page-layout {
			flex-direction: column;
		}

		.cert-sidebar {
			width: 100%;
			min-width: unset;
			position: static;
			display: flex;
			flex-wrap: wrap;
			gap: 0.5rem;
		}

		.cert-sidebar-title {
			width: 100%;
		}

		.cert-frame-link {
			flex: 1 1 calc(50% - 0.5rem);
			min-width: 140px;
			margin-bottom: 0;
			font-size: 0.85rem;
			padding: 0.75rem 1rem;
		}

		.search-row {
			flex-direction: column;
		}
		
		.search-field {
			width: 100%;
		}
		
		.cert-table thead {
			display: none;
		}
		
		.cert-table,
		.cert-table tbody,
		.cert-table tr,
		.cert-table td {
			display: block;
			width: 100%;
		}
		
		.cert-table tr {
			margin-bottom: 1rem;
			background: var(--white);
			border-radius: 8px;
			box-shadow: 0 2px 4px var(--shadow);
			padding: 1rem;
		}
		
		.cert-table td {
			padding: 0.5rem 0;
			text-align: right;
			position: relative;
			padding-left: 40%;
			border-bottom: 1px solid #f0f0f0;
		}
		
		.cert-table td:last-child {
			border-bottom: none;
			text-align: center;
			padding-left: 0;
		}
		
		.cert-table td::before {
			content: attr(data-label);
			position: absolute;
			left: 0;
			width: 40%;
			text-align: left;
			font-weight: 600;
			color: var(--text-gray);
		}
		
		.pagination {
			flex-direction: column;
			gap: 1rem;
		}
	}
</style>

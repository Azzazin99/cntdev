<script>
	import { onMount, onDestroy } from 'svelte';
	import { thaiDateToInput } from '$lib/utils';
	export let data;

	let activeTab = 'news';
	let loading = false;
	let statusMessage = '';
	let listDirty = false;
	let certificatesDirty = false;
	let savedCertificatesSheetUrl = '';
	let dataHint = '';
	let newsDataSource = '';
	let activityDataSource = '';

	function emptyDataHint(source, count) {
		if (count > 0) return '';
		if (source === 'firestore') {
			return 'Firestore ว่าง — รันคำสั่ง python migrate_to_firebase.py -y บนเครื่อง dev แล้วรีเฟรชหน้านี้';
		}
		return 'ไม่พบข้อมูล — บน Production ต้องตั้ง FIREBASE_SERVICE_ACCOUNT_JSON ใน Vercel Environment Variables แล้ว Redeploy (JSON fallback บน serverless อ่านไฟล์ static ไม่ได้)';
	}

	function markListDirty() {
		listDirty = true;
	}

	function hasUnsavedChanges() {
		if (isListTab(activeTab) && listDirty) return true;
		if (activeTab === 'certificates' && certificatesDirty) return true;
		return false;
	}

	function handleBeforeUnload(e) {
		if (hasUnsavedChanges()) {
			e.preventDefault();
			e.returnValue = '';
		}
	}

	function personnelImageSrc(path) {
		if (!path) return '/assets/images/logos/moe.png';
		if (path.startsWith('http')) return path;
		return path.startsWith('/') ? path : `/${path}`;
	}
	let authChecking = false;
	let role = data?.user?.role || null;
	let userEmail = data?.user?.email || '';
	let userDisplay =
		userEmail === 'admin' ? 'ผู้ดูแลระบบ' : userEmail;

	// Data States
	let news = [];
	let activities = [];

	let listItems = [];
	const listTypes = [
		{ id: 'manuals', name: '📘 คู่มือปฏิบัติงาน' },
		{ id: 'knowledge', name: '📚 คลังความรู้' },
		{ id: 'plans', name: '📈 แผนพัฒนาครู' },
		{ id: 'forms', name: '📝 แบบฟอร์ม' },
		{ id: 'authority', name: '⚖️ อำนาจหน้าที่' },
		{ id: 'personnel', name: '👥 บุคลากร' }
	];

	function isListTab(tab) {
		return listTypes.some((t) => t.id === tab);
	}

	let certificatesSheetUrl = '';
	let certificatesTestCount = null;
	let certificatesTestError = '';

	async function selectTab(tab) {
		if (tab !== activeTab && hasUnsavedChanges()) {
			if (
				!confirm(
					'มีการแก้ไขที่ยังไม่ได้บันทึก ต้องการออกจากแท็บนี้หรือไม่? การเปลี่ยนแปลงจะหายไป'
				)
			) {
				return;
			}
			listDirty = false;
			certificatesDirty = false;
		}
		activeTab = tab;
		dataHint = '';
		if (tab === 'certificates') {
			await loadCertificatesConfig();
		} else if (isListTab(tab)) {
			await loadList(tab);
		} else if (tab === 'news') {
			dataHint = emptyDataHint(newsDataSource, news.length);
		} else if (tab === 'activity') {
			dataHint = emptyDataHint(activityDataSource, activities.length);
		}
	}

	async function loadCertificatesConfig() {
		loading = true;
		certificatesTestCount = null;
		certificatesTestError = '';
		try {
			const res = await fetch('/api/certificates/config');
			if (res.ok) {
				const data = await res.json();
				certificatesSheetUrl = data.sheetUrl || '';
				savedCertificatesSheetUrl = certificatesSheetUrl;
				certificatesDirty = false;
			}
		} catch (e) {
			statusMessage = '❌ โหลดการตั้งค่าไม่สำเร็จ';
		} finally {
			loading = false;
		}
	}

	async function saveCertificatesConfig() {
		const sheetUrl = certificatesSheetUrl.trim();
		if (!sheetUrl) {
			statusMessage = '❌ กรุณาระบุ URL';
			return;
		}
		loading = true;
		statusMessage = '⏳ กำลังบันทึก...';
		try {
			const res = await fetch('/api/certificates/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sheetUrl })
			});
			const result = await res.json();
			if (res.ok && result.status === 'success') {
				statusMessage = '✅ ' + result.message;
				certificatesSheetUrl = result.sheetUrl || sheetUrl;
				savedCertificatesSheetUrl = certificatesSheetUrl;
				certificatesDirty = false;
				setTimeout(() => (statusMessage = ''), 3000);
			} else {
				statusMessage = '❌ ' + (result.message || result.error || 'บันทึกไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	function parseCertificateCSV(text) {
		const rows = text.split('\n').filter((r) => r.trim() !== '');
		if (rows.length < 2) return [];
		return rows.slice(1);
	}

	async function testCertificatesSheet() {
		const sheetUrl = certificatesSheetUrl.trim();
		if (!sheetUrl) {
			certificatesTestError = 'กรุณาระบุ URL ก่อนทดสอบ';
			certificatesTestCount = null;
			return;
		}
		loading = true;
		certificatesTestCount = null;
		certificatesTestError = '';
		try {
			const res = await fetch(sheetUrl);
			if (!res.ok) throw new Error('HTTP ' + res.status);
			const text = await res.text();
			const rows = parseCertificateCSV(text);
			certificatesTestCount = rows.length;
		} catch (e) {
			certificatesTestError = 'โหลดไม่สำเร็จ: ' + e.message;
		} finally {
			loading = false;
		}
	}

	// News/Activity Form State
	let showModal = false;
	let editingItem = null;
	let formType = 'news'; // 'news' or 'activity'
	
	let title = '';
	let category = 'ข่าวประชาสัมพันธ์';
	let summary = '';
	let date = '';
	let image = null;
	let imageUrl = '';
	let link = '';

	const newsCategories = ['ข่าวประชาสัมพันธ์', 'ข่าวกิจกรรม', 'ข่าวสำคัญ', 'ข่าวรับสมัคร', 'ข่าวอื่นๆ'];

	onMount(async () => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		if (news.length === 0 && activities.length === 0) {
			await loadData();
		}
	});

	onDestroy(() => {
		if (typeof window !== 'undefined') {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		}
	});

	$: certificatesDirty =
		activeTab === 'certificates' && certificatesSheetUrl !== savedCertificatesSheetUrl;

	async function loadData() {
		loading = true;
		dataHint = '';
		try {
			const [newsRes, actRes] = await Promise.all([
				fetch('/api/news'),
				fetch('/api/activities')
			]);
			if (newsRes.ok) {
				const data = await newsRes.json();
				news = data.items || [];
				newsDataSource = data.source || '';
				if (activeTab === 'news') {
					dataHint = emptyDataHint(newsDataSource, news.length);
				}
			} else if (activeTab === 'news') {
				dataHint = `โหลดข่าวไม่สำเร็จ (HTTP ${newsRes.status})`;
			}
			if (actRes.ok) {
				const data = await actRes.json();
				activities = data.items || [];
				activityDataSource = data.source || '';
				if (activeTab === 'activity') {
					dataHint = emptyDataHint(activityDataSource, activities.length);
				}
			} else if (activeTab === 'activity') {
				dataHint = `โหลดกิจกรรมไม่สำเร็จ (HTTP ${actRes.status})`;
			}
		} catch (e) {
			console.error('Error loading data:', e);
			dataHint = 'โหลดข้อมูลไม่สำเร็จ — ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function loadList(type) {
		loading = true;
		dataHint = '';
		try {
			const res = await fetch(`/api/site-data/${type}`);
			if (res.ok) {
				const data = await res.json();
				const items = data.items || [];
				if (type === 'personnel') {
					listItems = items.map((p, i) => ({
						id: p.id ?? i + 1,
						name: p.name ?? '',
						position: p.position ?? '',
						phone: p.phone ?? '',
						image: p.image ?? ''
					}));
				} else {
					listItems = items;
				}
				dataHint = emptyDataHint(data.source, items.length);
			} else {
				listItems = [];
				dataHint = `โหลด ${type} ไม่สำเร็จ (HTTP ${res.status})`;
			}
		} catch (e) {
			listItems = [];
			dataHint = 'โหลดข้อมูลไม่สำเร็จ — ' + e.message;
		} finally {
			loading = false;
			listDirty = false;
		}
	}

	function addListItem() {
		if (activeTab === 'authority') {
			listItems = [...listItems, ""];
		} else if (activeTab === 'personnel') {
			const maxId = listItems.reduce((m, p) => Math.max(m, Number(p?.id) || 0), 0);
			listItems = [
				...listItems,
				{ id: maxId + 1, name: '', position: '', phone: '', image: '' }
			];
		} else {
			listItems = [...listItems, { title: '', link: '' }];
		}
		markListDirty();
	}

	function removeListItem(index) {
		listItems = listItems.filter((_, i) => i !== index);
		markListDirty();
	}

	function moveListItem(index, direction) {
		const newIndex = index + direction;
		if (newIndex < 0 || newIndex >= listItems.length) return;
		const next = [...listItems];
		[next[index], next[newIndex]] = [next[newIndex], next[index]];
		listItems = next;
		markListDirty();
	}

	async function uploadPersonnelImage(index, e) {
		const file = e.target.files?.[0];
		if (!file) return;
		loading = true;
		statusMessage = '⏳ กำลังอัปโหลดรูป...';
		try {
			const formData = new FormData();
			formData.append('image', file);
			const res = await fetch('/api/personnel/upload', { method: 'POST', body: formData });
			const result = await res.json();
			if (res.ok && result.url) {
				listItems[index].image = result.url;
				listItems = listItems;
				markListDirty();
				statusMessage = '✅ อัปโหลดรูปแล้ว — กด「บันทึกทั้งหมด」เพื่อเก็บถาวร';
				setTimeout(() => (statusMessage = ''), 4000);
			} else {
				statusMessage = '❌ ' + (result.message || result.error || 'อัปโหลดไม่สำเร็จ');
			}
		} catch (err) {
			statusMessage = '❌ ผิดพลาด: ' + err.message;
		} finally {
			loading = false;
			e.target.value = '';
		}
	}

	async function saveList() {
		loading = true;
		statusMessage = `⏳ กำลังบันทึก ${activeTab}...`;
		let payload = listItems;
		if (activeTab === 'personnel') {
			payload = listItems.map((p, i) => ({
				id: p.id ?? i + 1,
				name: String(p.name || '').trim(),
				position: String(p.position || '').trim(),
				phone: String(p.phone || '').trim(),
				image: String(p.image || '').trim()
			}));
		}
		try {
			const res = await fetch(`/api/site-data/${activeTab}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data: payload })
			});

			const result = await res.json();
			if (res.ok && result.status === 'success') {
				statusMessage = '✅ บันทึกสำเร็จ';
				listDirty = false;
				setTimeout(() => statusMessage = '', 3000);
			} else {
				statusMessage = '❌ ' + (result.message || result.error || 'บันทึกไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	function openModal(type, item = null) {
		formType = type;
		editingItem = item;
		showModal = true;
		
		image = null;
		if (item) {
			title = item.title || '';
			category = item.category || (type === 'news' ? 'ข่าวประชาสัมพันธ์' : 'ข่าวกิจกรรม');
			summary = item.summary || '';
			date = thaiDateToInput(item.date) || '';
			imageUrl = item.image || '';
			link = item.link || '';
		} else {
			title = '';
			category = type === 'news' ? 'ข่าวประชาสัมพันธ์' : 'ข่าวกิจกรรม';
			summary = '';
			date = '';
			image = null;
			imageUrl = '';
			link = '';
		}
	}

	async function saveItem() {
		if (!title) {
			statusMessage = '❌ กรุณาระบุหัวข้อ';
			return;
		}

		loading = true;
		statusMessage = '⏳ กำลังบันทึก...';

		try {
			const formData = new FormData();
			formData.append('title', title);
			formData.append('category', category);
			formData.append('summary', summary);
			formData.append('date', date);
			formData.append('link', link);
			if (image) {
				formData.append('image', image);
			} else if (imageUrl) {
				formData.append('imageUrl', imageUrl);
			}

			const isEdit = Boolean(editingItem?.id);
			if (isEdit) {
				formData.append('id', String(editingItem.id));
			}

			const endpoint = formType === 'news' ? '/api/news' : '/api/activities';
			const res = await fetch(endpoint, {
				method: isEdit ? 'PUT' : 'POST',
				body: formData
			});

			const result = await res.json();
			if (res.ok && result.status === 'success') {
				statusMessage = '✅ ' + result.message;
				showModal = false;
				await loadData();
			} else {
				statusMessage = '❌ ' + (result.message || result.error || 'บันทึกไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function deleteItem(id, type) {
		if (!confirm('ยืนยันการลบข้อมูลนี้?')) return;

		loading = true;
		try {
			const endpoint = type === 'news' ? '/api/news' : '/api/activities';
			const res = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: 'DELETE' });

			const result = await res.json();
			if (res.ok && result.status === 'success') {
				await loadData();
				alert('ลบข้อมูลเรียบร้อยแล้ว');
			} else {
				alert('ลบไม่สำเร็จ: ' + (result.message || result.error || 'ไม่ทราบสาเหตุ'));
			}
		} catch (e) {
			alert('เกิดข้อผิดพลาดในการลบ');
		} finally {
			loading = false;
		}
	}

	function handleFileChange(e) {
		image = e.target.files[0];
	}

	function handleImgError(e) {
		e.target.src = '/assets/images/logos/moe.png';
	}

	async function downloadFromUrl() {
		if (!imageUrl) return;
		statusMessage = '✅ ใช้ URL รูปนี้ตอนบันทึก (ไม่ต้องดาวน์โหลดลงเครื่อง)';
		setTimeout(() => (statusMessage = ''), 3000);
	}
</script>

<svelte:head>
	<title>Admin - ระบบจัดการหลังบ้าน</title>
</svelte:head>

{#if authChecking}
	<div class="container" style="padding: 2rem 0; text-align: center;">
		<p>กำลังตรวจสอบสิทธิ์...</p>
	</div>
{:else}
<div class="admin-layout">
	<header class="admin-header">
		<div class="container admin-header-inner">
			<div class="admin-header-text">
				<h1>🛠️ CNT Admin Panel</h1>
				<p>ระบบจัดการข้อมูลเว็บไซต์ (Svelte Edition)</p>
				{#if userDisplay}
					<p class="admin-user">👤 {userDisplay}{role ? ` (${role})` : ''}</p>
				{/if}
			</div>
			<a href="/logout" class="admin-logout-btn">ออกจากระบบ</a>
		</div>
	</header>

	<nav class="admin-nav">
		<div class="container">
			<button class:active={activeTab === 'news'} on:click={() => selectTab('news')}>📰 ข่าวประชาสัมพันธ์</button>
			<button class:active={activeTab === 'activity'} on:click={() => selectTab('activity')}>📸 ภาพกิจกรรม</button>
			{#each listTypes as type}
				<button class:active={activeTab === type.id} on:click={() => selectTab(type.id)}>{type.name}</button>
			{/each}
			<button class:active={activeTab === 'certificates'} on:click={() => selectTab('certificates')}>🏆 คลังเกียรติบัตร</button>
		</div>
	</nav>

	<main class="container">
		{#if dataHint}
			<div class="admin-data-hint" role="status">{dataHint}</div>
		{/if}

		{#if activeTab === 'news'}
			<div class="tab-header">
				<h2>📰 ข่าวประชาสัมพันธ์ ({news.length})</h2>
				<div class="tab-header-actions">
					<button class="btn-add" on:click={() => openModal('news')}>+ เพิ่มข่าวใหม่</button>
				</div>
			</div>

			<div class="items-list">
				{#each news as item}
					<div class="admin-item">
						<div class="item-img">
							<img src={item.image} alt="news" on:error={handleImgError}>
						</div>
						<div class="item-info">
							<h3>{item.title}</h3>
							<div class="item-meta">📅 {item.date} | 📂 {item.category}</div>
							{#if item.link && item.link !== '#'}
								<a class="item-external-link" href={item.link} target="_blank" rel="noopener noreferrer">
									เปิดลิงก์ข่าว ↗
								</a>
							{/if}
						</div>
						<div class="item-actions">
							<button class="btn-edit" on:click={() => openModal('news', item)}>แก้ไข</button>
							<button class="btn-delete" on:click={() => deleteItem(item.id, 'news')}>ลบ</button>
						</div>
					</div>
				{/each}
			</div>

		{:else if activeTab === 'activity'}
			<div class="tab-header">
				<h2>📸 ภาพกิจกรรม ({activities.length})</h2>
				<button class="btn-add" on:click={() => openModal('activity')}>+ เพิ่มภาพกิจกรรม</button>
			</div>

			<div class="items-list">
				{#each activities as item}
					<div class="admin-item">
						<div class="item-img">
							<img src={item.image} alt="activity" on:error={handleImgError}>
						</div>
						<div class="item-info">
							<h3>{item.title}</h3>
							<div class="item-meta">📅 {item.date}</div>
							{#if item.link && item.link !== '#'}
								<a class="item-external-link" href={item.link} target="_blank" rel="noopener noreferrer">
									เปิดลิงก์ ↗
								</a>
							{/if}
						</div>
						<div class="item-actions">
							<button class="btn-edit" on:click={() => openModal('activity', item)}>แก้ไข</button>
							<button class="btn-delete" on:click={() => deleteItem(item.id, 'activity')}>ลบ</button>
						</div>
					</div>
				{/each}
			</div>
		{:else if activeTab === 'certificates'}
			<div class="list-editor certificates-config">
				<div class="tab-header">
					<h2>
						🏆 ตั้งค่าคลังเกียรติบัตร (Google Sheet)
						{#if certificatesDirty}<span class="dirty-badge">ยังไม่บันทึก</span>{/if}
					</h2>
				</div>

				<p class="cert-help">
					แก้ไขรายชื่อเกียรติบัตรใน Google Sheet โดยตรง จากนั้นวางลิงก์ CSV ที่เผยแพร่แล้ว (Publish to web → ลิงก์ลงท้ายด้วย <code>output=csv</code>)
				</p>

				<div class="form-group">
					<label for="cert-sheet-url">URL ของ Google Sheets (CSV)</label>
					<input
						type="url"
						id="cert-sheet-url"
						class="cert-url-input"
						bind:value={certificatesSheetUrl}
						placeholder="https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
					>
				</div>

				<div class="cert-actions-row">
					<button class="btn-save" on:click={saveCertificatesConfig} disabled={loading}>
						{loading ? 'กำลังบันทึก...' : '💾 บันทึกการตั้งค่า'}
					</button>
					<button class="btn-test" type="button" on:click={testCertificatesSheet} disabled={loading}>
						🔍 ทดสอบโหลด
					</button>
				</div>

				{#if statusMessage}
					<div class="status-box" class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
						{statusMessage}
					</div>
				{/if}

				{#if certificatesTestCount !== null}
					<p class="cert-test-result success-text">โหลดได้ {certificatesTestCount} รายการ (ไม่รวมหัวตาราง)</p>
				{/if}
				{#if certificatesTestError}
					<p class="cert-test-result error-text">{certificatesTestError}</p>
				{/if}
			</div>
		{:else if isListTab(activeTab)}
			<div class="list-editor">
				<div class="tab-header">
					<h2>
						✏️ แก้ไข {listTypes.find((t) => t.id === activeTab)?.name}
						{#if listDirty}<span class="dirty-badge">ยังไม่บันทึก</span>{/if}
					</h2>
					<div class="actions">
						<button class="btn-add" on:click={addListItem}>+ เพิ่มรายการ</button>
						<button class="btn-save" on:click={saveList} disabled={loading}>
							{loading ? 'กำลังบันทึก...' : '💾 บันทึกทั้งหมด'}
						</button>
					</div>
				</div>

				{#if statusMessage}
					<div class="status-box" class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
						{statusMessage}
					</div>
				{/if}

				<div class="items-list-editor">
					{#each listItems as item, i}
						<div class="list-edit-row">
							<span class="index">{i + 1}</span>
							<div class="row-order-btns">
								<button
									type="button"
									class="btn-order"
									disabled={i === 0}
									on:click={() => moveListItem(i, -1)}
									aria-label="เลื่อนขึ้น"
								>↑</button>
								<button
									type="button"
									class="btn-order"
									disabled={i === listItems.length - 1}
									on:click={() => moveListItem(i, 1)}
									aria-label="เลื่อนลง"
								>↓</button>
							</div>
							{#if activeTab === 'authority'}
								<input type="text" id="auth-{i}" bind:value={listItems[i]} on:input={markListDirty} placeholder="รายละเอียดอำนาจหน้าที่...">
							{:else if activeTab === 'personnel'}
								<div class="personnel-row">
									<img
										class="personnel-thumb"
										src={personnelImageSrc(item.image)}
										alt=""
										on:error={handleImgError}
									>
									<div class="personnel-inputs">
										<input type="text" id="person-name-{i}" bind:value={item.name} on:input={markListDirty} placeholder="ชื่อ-นามสกุล" aria-label="ชื่อ">
										<input type="text" id="person-position-{i}" bind:value={item.position} on:input={markListDirty} placeholder="ตำแหน่ง" aria-label="ตำแหน่ง">
										<input type="text" id="person-phone-{i}" bind:value={item.phone} on:input={markListDirty} placeholder="เบอร์โทร" aria-label="เบอร์โทร">
										<div class="personnel-image-row">
											<input type="text" id="person-image-{i}" bind:value={item.image} on:input={markListDirty} placeholder="รูป (path หรือ URL)" aria-label="รูปภาพ">
											<label class="btn-upload-photo">
												เลือกรูป
												<input type="file" accept="image/*" class="sr-only" on:change={(e) => uploadPersonnelImage(i, e)}>
											</label>
										</div>
									</div>
								</div>
							{:else}
								<div class="inputs">
									<input type="text" id="title-{i}" bind:value={item.title} on:input={markListDirty} placeholder="หัวข้อ/ชื่อไฟล์" aria-label="Title">
									<input type="text" id="link-{i}" bind:value={item.link} on:input={markListDirty} placeholder="ลิงก์ (Google Drive/URL)" aria-label="Link">
								</div>
							{/if}
							<button class="btn-remove" type="button" on:click={() => removeListItem(i)}>&times;</button>
						</div>
					{/each}

					{#if listItems.length === 0}
						<p class="empty">ไม่มีข้อมูลในรายการนี้</p>
					{/if}
				</div>
			</div>
		{/if}
	</main>
</div>
{/if}

{#if showModal}
	<div class="modal-backdrop" on:click={() => showModal = false} on:keydown={(e) => e.key === 'Escape' && (showModal = false)} role="presentation">
		<div class="modal-content" on:click|stopPropagation on:keydown|stopPropagation tabindex="0" role="dialog" aria-modal="true">
			<div class="modal-header">
				<h3>
					{editingItem ? '📝 แก้ไข' : '➕ เพิ่มใหม่'}
					({formType === 'news' ? 'ข่าวประชาสัมพันธ์' : 'ภาพกิจกรรม'})
					{#if editingItem?.id}<span class="edit-id">ID: {editingItem.id}</span>{/if}
				</h3>
				<button class="close-btn" on:click={() => showModal = false} aria-label="Close modal">&times;</button>
			</div>
			
			<div class="modal-body">
				<div class="form-group">
					<label for="modal-title">หัวข้อ / ชื่อรายการ</label>
					<input type="text" id="modal-title" bind:value={title} placeholder="กรอกหัวข้อ...">
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="modal-date">วันที่</label>
						<input type="date" id="modal-date" bind:value={date}>
					</div>
					{#if formType === 'news'}
						<div class="form-group">
							<label for="modal-category">หมวดหมู่</label>
							<select id="modal-category" bind:value={category}>
								{#each newsCategories as cat}
									<option value={cat}>{cat}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>

				<div class="form-group">
					<label for="modal-summary">รายละเอียด / สรุปเนื้อหา</label>
					<textarea id="modal-summary" bind:value={summary} rows="3" placeholder="สรุปเนื้อหาเบื้องต้น..."></textarea>
				</div>

				<div class="form-group">
					<label for="modal-link">ลิงก์เพิ่มเติม (ถ้ามี)</label>
					<input type="text" id="modal-link" bind:value={link} placeholder="เช่น ลิงก์ Facebook หรือ Google Drive">
				</div>

				<div class="form-group">
					<label for="modal-file">รูปภาพ (อัปโหลดจากเครื่อง)</label>
					<input type="file" id="modal-file" accept="image/*" on:change={handleFileChange}>
				</div>

				{#if formType === 'activity'}
					<div class="form-group">
						<label for="modal-image-url">หรือ วาง URL รูปภาพ (เช่น จาก Facebook)</label>
						<div class="url-input-group">
							<input type="text" id="modal-image-url" bind:value={imageUrl} placeholder="https://...">
							<button class="btn-download" on:click={downloadFromUrl} disabled={loading || !imageUrl}>
								{loading ? '...' : '📥 ดึงรูป'}
							</button>
						</div>
					</div>
				{/if}

				{#if statusMessage}
					<div class="status-box" class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
						{statusMessage}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="btn-cancel" on:click={() => showModal = false}>ยกเลิก</button>
				<button class="btn-save" on:click={saveItem} disabled={loading}>
					{loading ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	:root {
		--primary: #7b1fa2;
		--primary-dark: #4a0072;
		--bg-admin: #f4f7f6;
		--white: #ffffff;
		--border: #e0e0e0;
		--text-main: #333333;
		--text-muted: #666666;
		--bg-card: #ffffff;
		--bg-input: #ffffff;
	}

	:global(body.dark-mode) {
		--bg-admin: #121212;
		--white: #1e1e1e;
		--border: #333333;
		--text-main: #e0e0e0;
		--text-muted: #a0a0a0;
		--bg-card: #1e1e1e;
		--bg-input: #2d2d2d;
		--primary: #ce93d8;
	}

	.admin-layout {
		min-height: 100vh;
		background: var(--bg-admin);
		font-family: 'Sarabun', sans-serif;
		color: var(--text-main);
		transition: background 0.3s, color 0.3s;
	}

	.admin-header {
		background: var(--bg-card);
		padding: 2rem 0;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
	}

	.admin-header h1 {
		color: var(--primary);
		margin: 0;
	}

	.admin-header p {
		color: var(--text-muted);
	}

	.admin-header-inner {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.admin-header-text {
		flex: 1;
		min-width: 200px;
	}

	.admin-logout-btn {
		padding: 0.65rem 1rem;
		border-radius: 8px;
		font-weight: 600;
		font-family: inherit;
		font-size: 0.95rem;
		min-height: 44px;
		white-space: nowrap;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: transparent;
		color: #c62828;
		border: 1px solid #c62828;
		text-decoration: none;
	}

	.admin-logout-btn:hover {
		background: #c62828;
		color: #fff;
	}

	.admin-data-hint {
		margin: 1rem 0;
		padding: 0.85rem 1rem;
		border-radius: 8px;
		background: #fff3e0;
		color: #e65100;
		border: 1px solid #ffcc80;
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.dirty-badge {
		font-size: 0.75rem;
		font-weight: 600;
		color: #e65100;
		background: #fff3e0;
		padding: 0.15rem 0.5rem;
		border-radius: 4px;
		margin-left: 0.5rem;
		vertical-align: middle;
	}

	.edit-id {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--text-muted);
		margin-left: 0.5rem;
	}

	.item-external-link {
		display: inline-block;
		margin-top: 0.35rem;
		font-size: 0.85rem;
		color: var(--primary);
		text-decoration: none;
	}

	.item-external-link:hover {
		text-decoration: underline;
	}

	.row-order-btns {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex-shrink: 0;
	}

	.btn-order {
		width: 32px;
		height: 28px;
		padding: 0;
		border: 1px solid var(--border);
		background: var(--bg-input);
		color: var(--text-main);
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.85rem;
		line-height: 1;
	}

	.btn-order:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.personnel-row {
		display: flex;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
		align-items: flex-start;
	}

	.personnel-thumb {
		width: 56px;
		height: 56px;
		object-fit: cover;
		border-radius: 8px;
		border: 1px solid var(--border);
		flex-shrink: 0;
	}

	.personnel-image-row {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		flex-wrap: wrap;
	}

	.personnel-image-row input {
		flex: 1;
		min-width: 120px;
	}

	.btn-upload-photo {
		padding: 0.4rem 0.75rem;
		background: var(--primary);
		color: #fff;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		white-space: nowrap;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	.certificates-config .cert-help {
		color: var(--text-muted);
		margin: 0 0 1.25rem;
		line-height: 1.6;
	}

	.certificates-config .cert-help code {
		background: var(--bg-input);
		padding: 0.15rem 0.4rem;
		border-radius: 4px;
		font-size: 0.9em;
	}

	.cert-url-input {
		width: 100%;
		padding: 0.8rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		font-family: inherit;
		background: var(--bg-input);
		color: var(--text-main);
		min-height: 44px;
	}

	.cert-actions-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin-top: 1rem;
	}

	.btn-test {
		background: transparent;
		border: 1px solid var(--primary);
		color: var(--primary);
		padding: 0.7rem 1.25rem;
		border-radius: 6px;
		font-weight: 700;
		cursor: pointer;
		min-height: 44px;
		font-family: inherit;
	}

	.btn-test:hover {
		background: var(--primary);
		color: #fff;
	}

	.cert-test-result {
		margin-top: 1rem;
		font-weight: 600;
	}

	.success-text {
		color: #2e7d32;
	}

	.error-text {
		color: #c62828;
	}

	.admin-nav {
		background: var(--primary);
		padding: 0.5rem 0;
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.admin-nav .container {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		justify-content: center;
	}

	.admin-nav button {
		background: transparent;
		border: none;
		color: rgba(255,255,255,0.7);
		padding: 0.6rem 1rem;
		font-weight: 600;
		cursor: pointer;
		border-radius: 6px;
		transition: all 0.3s;
		font-size: 0.9rem;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.admin-nav button:hover, .admin-nav button.active {
		color: white;
		background: rgba(255,255,255,0.2);
	}

	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 20px;
	}

	.tab-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 2rem 0 1.5rem;
	}

	.tab-header h2 {
		color: var(--text-main);
	}

	.btn-add {
		background: var(--primary);
		color: #fff;
		border: none;
		padding: 0.8rem 1.5rem;
		border-radius: 8px;
		font-weight: 700;
		cursor: pointer;
		min-height: 44px;
	}

	.items-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.admin-item {
		background: var(--bg-card);
		padding: 1rem;
		border-radius: 10px;
		display: flex;
		align-items: center;
		gap: 1.5rem;
		box-shadow: 0 2px 5px rgba(0,0,0,0.1);
		border: 1px solid var(--border);
	}

	.item-img img {
		width: 100px;
		height: 70px;
		object-fit: cover;
		border-radius: 6px;
		background: var(--bg-input);
	}

	.item-info {
		flex: 1;
	}

	.item-info h3 {
		margin: 0 0 0.4rem;
		font-size: 1.1rem;
		color: var(--text-main);
	}

	.item-meta {
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.item-actions {
		display: flex;
		gap: 0.5rem;
	}

	.btn-edit {
		background: transparent;
		border: 1px solid var(--primary);
		color: var(--primary);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		min-height: 44px;
		min-width: 80px;
	}

	.btn-edit:hover {
		background: var(--primary);
		color: white;
	}

	.btn-delete {
		background: transparent;
		border: 1px solid #f44336;
		color: #f44336;
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		min-height: 44px;
		min-width: 80px;
	}

	.btn-delete:hover {
		background: #f44336;
		color: white;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0,0,0,0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: var(--bg-card);
		width: 95%;
		max-width: 600px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 10px 30px rgba(0,0,0,0.5);
		color: var(--text-main);
		max-height: 90vh;
		display: flex;
		flex-direction: column;
	}

	.modal-header {
		padding: 1.2rem 1.5rem;
		background: var(--bg-admin);
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-shrink: 0;
	}

	.modal-header h3 {
		margin: 0;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.8rem;
		cursor: pointer;
		color: var(--text-muted);
	}

	.modal-body {
		padding: 1.5rem;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
		-webkit-overflow-scrolling: touch;
	}

	.form-group {
		margin-bottom: 1.2rem;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}

	label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text-main);
	}

	input, select, textarea {
		width: 100%;
		padding: 0.8rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		font-family: inherit;
		background: var(--bg-input);
		color: var(--text-main);
		min-height: 44px;
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		background: var(--bg-admin);
		border-top: 1px solid var(--border);
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
		flex-shrink: 0;
	}

	.btn-save {
		background: var(--primary);
		color: white;
		border: none;
		padding: 0.7rem 1.5rem;
		border-radius: 6px;
		font-weight: 700;
		cursor: pointer;
	}

	.url-input-group {
		display: flex;
		gap: 0.5rem;
	}

	.url-input-group input {
		flex: 1;
	}

	.url-input-group .btn-download {
		background: #4caf50;
		color: white;
		border: none;
		padding: 0 1rem;
		border-radius: 6px;
		cursor: pointer;
		font-weight: bold;
		white-space: nowrap;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
	}

	.btn-cancel {
		background: var(--bg-input);
		border: 1px solid var(--border);
		color: var(--text-main);
		padding: 0.7rem 1.5rem;
		border-radius: 6px;
		cursor: pointer;
	}

	.status-box {
		margin-top: 1rem;
		padding: 0.8rem;
		border-radius: 6px;
		text-align: center;
		font-weight: 600;
	}

	.status-box.success { background: rgba(46, 125, 50, 0.2); color: #4caf50; }
	.status-box.error { background: rgba(198, 40, 40, 0.2); color: #f44336; }

	.list-editor {
		background: var(--bg-card);
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
		border: 1px solid var(--border);
	}

	.list-edit-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.8rem;
		border-bottom: 1px solid var(--border);
	}

	.list-edit-row .index {
		font-weight: bold;
		color: var(--text-muted);
		width: 25px;
	}

	.list-edit-row .inputs,
	.personnel-inputs {
		flex: 1;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	.list-edit-row .personnel-row {
		flex: 1;
		min-width: 0;
	}

	.personnel-inputs input {
		min-width: 0;
	}

	.list-edit-row input {
		padding: 0.5rem;
		font-size: 0.9rem;
	}

	.btn-remove {
		background: #ff5252;
		color: white;
		border: none;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 1.5rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.empty {
		text-align: center;
		padding: 2rem;
		color: var(--text-muted);
	}

	@media (max-width: 768px) {
		.form-row {
			grid-template-columns: 1fr;
		}

		.admin-item {
			flex-direction: column;
			text-align: center;
			padding: 1.5rem;
		}

		.item-actions {
			width: 100%;
			justify-content: center;
			margin-top: 1rem;
		}

		.list-edit-row {
			flex-direction: column;
			align-items: stretch;
			position: relative;
			padding: 1.5rem 0.5rem 0.5rem;
		}

		.list-edit-row .index {
			position: absolute;
			top: 0;
			left: 0;
			width: auto;
		}

		.list-edit-row .inputs,
		.personnel-inputs {
			grid-template-columns: 1fr;
		}

		.btn-remove {
			position: absolute;
			top: 0;
			right: 0;
		}

		.tab-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}

		.btn-add {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.admin-header h1 {
			font-size: 1.5rem;
		}

		.admin-nav button {
			flex: 1 1 40%;
			font-size: 0.8rem;
			padding: 0.5rem;
		}

		.modal-content {
			width: 100%;
			height: 100%;
			max-height: 100vh;
			border-radius: 0;
			display: flex;
			flex-direction: column;
		}

		.modal-body {
			flex: 1;
			overflow-y: auto;
		}
	}
</style>

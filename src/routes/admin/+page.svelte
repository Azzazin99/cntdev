<script>
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { thaiDateToInput } from '$lib/utils';
	import { fetchAdminJson } from '$lib/adminFetch';
	import { trapFocusKeydown, restoreFocus } from '$lib/modalFocus';
	import { validateDocumentLink, resolveDocumentOpenUrl } from '$lib/documentLink';
	import { resolvePersonnelImageSrc } from '$lib/personnelImage';
	import {
		DEFAULT_BANNER_ALT,
		DEFAULT_BANNER_IMAGE,
		DEFAULT_BANNER_LINK
	} from '$lib/bannerDefaults';
	import {
		validateImageForUpload,
		validatePdfForUpload,
		MAX_IMAGE_MB,
		MAX_PDF_MB
	} from '$lib/uploadLimits';
	import { bindSortable } from '$lib/adminSortable';
	export let data;

	/** Plain-text label for status (screen readers); emoji kept for sighted users. */
	function statusAriaLabel(msg) {
		if (!msg) return undefined;
		return msg.replace(/^[^\p{L}\p{N}]+/u, '').trim() || undefined;
	}

	let activeTab = 'personnel';
	let loading = false;
	let statusMessage = '';
	let listDirty = false;
	let certificatesDirty = false;
	let bannerDirty = false;
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
		if (activeTab === 'banner' && bannerDirty) return true;
		return false;
	}

	function handleBeforeUnload(e) {
		if (hasUnsavedChanges()) {
			e.preventDefault();
			e.returnValue = '';
		}
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
	/** Item/list ContentStores — names used in headings; order follows adminNavTabs. */
	const listTypes = [
		{ id: 'personnel', name: '👥 บุคลากร' },
		{ id: 'authority', name: '⚖️ อำนาจหน้าที่' },
		{ id: 'manuals', name: '📘 คู่มือปฏิบัติงาน' },
		{ id: 'plans', name: '📈 แผนพัฒนาครู' },
		{ id: 'forms', name: '📝 แบบฟอร์ม' },
		{ id: 'knowledge', name: '📚 คลังความรู้' }
	];

	/** Admin tab bar order: public navbar order, then knowledge, then banner. */
	const adminNavTabs = [
		{ id: 'personnel', label: '👥 บุคลากร' },
		{ id: 'authority', label: '⚖️ อำนาจหน้าที่' },
		{ id: 'manuals', label: '📘 คู่มือปฏิบัติงาน' },
		{ id: 'plans', label: '📈 แผนพัฒนาครู' },
		{ id: 'news', label: '📰 ข่าวประชาสัมพันธ์' },
		{ id: 'activity', label: '📸 ภาพกิจกรรม' },
		{ id: 'forms', label: '📝 แบบฟอร์ม' },
		{ id: 'certificates', label: '🏆 คลังเกียรติบัตร' },
		{ id: 'knowledge', label: '📚 คลังความรู้' },
		{ id: 'banner', label: '🖼️ แบนเนอร์เว็บไซต์' }
	];

	function isListTab(tab) {
		return listTypes.some((t) => t.id === tab);
	}

	const ITEM_COLLECTION_TABS = ['personnel', 'manuals', 'plans', 'forms', 'knowledge'];
	function isItemCollectionTab(tab) {
		return ITEM_COLLECTION_TABS.includes(tab);
	}

	// Per-item collection state (manuals/knowledge/plans/forms/personnel)
	let collectionItems = [];
	let collectionModalOpen = false;
	let collectionEditing = null;
	let cTitle = '';
	let cLink = '';
	let cName = '';
	let cPosition = '';
	let cPhone = '';
	let cImage = '';
	let cImageFile = null;

	const ADMIN_PAGE_SIZE = 25;
	let newsPage = 1;
	let activityPage = 1;
	let collectionPage = 1;

	function adminTotalPages(count) {
		return Math.max(1, Math.ceil(count / ADMIN_PAGE_SIZE));
	}

	function adminPageSlice(items, page) {
		const start = (page - 1) * ADMIN_PAGE_SIZE;
		return items.slice(start, start + ADMIN_PAGE_SIZE);
	}

	function adminPageStart(page) {
		return (page - 1) * ADMIN_PAGE_SIZE + 1;
	}

	function adminPageEnd(page, total) {
		return Math.min(page * ADMIN_PAGE_SIZE, total);
	}

	/** @param {'news' | 'activity' | 'collection'} kind @param {number} page */
	function goToAdminPage(kind, page) {
		if (kind === 'news') {
			newsPage = Math.min(Math.max(1, page), adminTotalPages(news.length));
		} else if (kind === 'activity') {
			activityPage = Math.min(Math.max(1, page), adminTotalPages(activities.length));
		} else {
			collectionPage = Math.min(Math.max(1, page), adminTotalPages(collectionItems.length));
		}
	}

	/** @param {number} current @param {number} total */
	function adminVisiblePages(current, total) {
		const start = Math.max(1, Math.min(total - 4, current - 2));
		return Array.from({ length: Math.min(5, total) }, (_, i) => start + i).filter((p) => p <= total);
	}

	$: paginatedNews = adminPageSlice(news, newsPage);
	$: paginatedActivities = adminPageSlice(activities, activityPage);
	$: paginatedCollection = adminPageSlice(collectionItems, collectionPage);
	$: if (newsPage > adminTotalPages(news.length)) newsPage = adminTotalPages(news.length);
	$: if (activityPage > adminTotalPages(activities.length)) activityPage = adminTotalPages(activities.length);
	$: if (collectionPage > adminTotalPages(collectionItems.length)) {
		collectionPage = adminTotalPages(collectionItems.length);
	}
	let editModalEl;
	let collectionModalEl;
	/** @type {HTMLElement | null} */
	let modalPreviousFocus = null;

	function handleAuthFailure(parsed) {
		if (parsed.status === 401) {
			statusMessage = '❌ ' + (parsed.message || 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่');
			goto('/login?redirect=/admin');
			return true;
		}
		return false;
	}

	function closeEditModal() {
		showModal = false;
		pdfFile = null;
		restoreFocus(editModalEl, modalPreviousFocus);
		modalPreviousFocus = null;
	}

	function closeCollectionModal() {
		collectionModalOpen = false;
		restoreFocus(collectionModalEl, modalPreviousFocus);
		modalPreviousFocus = null;
	}

	/** @param {KeyboardEvent} e */
	function onEditModalKeydown(e) {
		if (e.key === 'Escape') {
			closeEditModal();
			return;
		}
		if (editModalEl) trapFocusKeydown(e, editModalEl);
	}

	/** @param {KeyboardEvent} e */
	function onCollectionModalKeydown(e) {
		if (e.key === 'Escape') {
			closeCollectionModal();
			return;
		}
		if (collectionModalEl) trapFocusKeydown(e, collectionModalEl);
	}

	async function loadCollection(key) {
		loading = true;
		dataHint = '';
		try {
			const parsed = await fetchAdminJson(`/api/site-data/${key}`);
			if (handleAuthFailure(parsed)) return;
			if (parsed.ok && parsed.data) {
				collectionItems = parsed.data.items || [];
				dataHint = emptyDataHint(parsed.data.source, collectionItems.length);
			} else {
				collectionItems = [];
				dataHint = parsed.message || `โหลด ${key} ไม่สำเร็จ`;
			}
		} catch (e) {
			collectionItems = [];
			dataHint = 'โหลดข้อมูลไม่สำเร็จ — ' + e.message;
		} finally {
			loading = false;
		}
	}

	/**
	 * Apply Sortable page order (data-id list) onto the full array.
	 * Prefer DOM id order over index splice — avoids double-move / wrong pairing after drag.
	 * @template {{ id?: unknown }} T
	 * @param {T[]} items
	 * @param {string[]} pageOrderedIds
	 * @param {number} page
	 */
	function applyPageOrderedIds(items, pageOrderedIds, page) {
		const offset = (page - 1) * ADMIN_PAGE_SIZE;
		const pageLen = Math.min(ADMIN_PAGE_SIZE, Math.max(0, items.length - offset));
		if (pageLen === 0) return items;
		const byId = new Map(items.map((item) => [String(item.id), item]));
		const reorderedPage = pageOrderedIds
			.map((id) => byId.get(String(id)))
			.filter(Boolean);
		if (reorderedPage.length !== pageLen) return null;
		return [...items.slice(0, offset), ...reorderedPage, ...items.slice(offset + pageLen)];
	}

	/**
	 * Fallback: move within a paged list using page-local Sortable indices.
	 * @template {{ id?: unknown }} T
	 * @param {T[]} items
	 * @param {number} page
	 * @param {number} oldIndex
	 * @param {number} newIndex
	 */
	function moveInPagedList(items, page, oldIndex, newIndex) {
		if (oldIndex === newIndex) return items;
		const offset = (page - 1) * ADMIN_PAGE_SIZE;
		const next = [...items];
		const [moved] = next.splice(offset + oldIndex, 1);
		next.splice(offset + newIndex, 0, moved);
		return next;
	}

	/** @param {string} url @param {string[]} orderedIds */
	async function persistOrderedIds(url, orderedIds) {
		const parsed = await fetchAdminJson(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ orderedIds })
		});
		if (handleAuthFailure(parsed)) return false;
		if (parsed.ok && parsed.data?.status === 'success') {
			statusMessage = '✅ ' + (parsed.data.message || 'บันทึกลำดับเรียบร้อยแล้ว');
			setTimeout(() => (statusMessage = ''), 2500);
			return true;
		}
		statusMessage = '❌ ' + (parsed.message || 'บันทึกลำดับไม่สำเร็จ');
		return false;
	}

	/** @param {string[]} pageIds @param {{ oldIndex: number, newIndex: number }} detail */
	async function onNewsReorder(pageIds, detail) {
		if (loading) return;
		const previous = news;
		const next =
			applyPageOrderedIds(news, pageIds, newsPage) ||
			moveInPagedList(news, newsPage, detail.oldIndex, detail.newIndex);
		news = next;
		loading = true;
		try {
			const ok = await persistOrderedIds(
				'/api/news/reorder',
				news.map((item) => String(item.id))
			);
			if (!ok) news = previous;
		} catch (e) {
			news = previous;
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	/** @param {string[]} pageIds @param {{ oldIndex: number, newIndex: number }} detail */
	async function onActivityReorder(pageIds, detail) {
		if (loading) return;
		const previous = activities;
		const next =
			applyPageOrderedIds(activities, pageIds, activityPage) ||
			moveInPagedList(activities, activityPage, detail.oldIndex, detail.newIndex);
		activities = next;
		loading = true;
		try {
			const ok = await persistOrderedIds(
				'/api/activities/reorder',
				activities.map((item) => String(item.id))
			);
			if (!ok) activities = previous;
		} catch (e) {
			activities = previous;
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	/** @param {string[]} pageIds @param {{ oldIndex: number, newIndex: number }} detail */
	async function onCollectionReorder(pageIds, detail) {
		if (loading || !isItemCollectionTab(activeTab)) return;
		const previous = collectionItems;
		const next =
			applyPageOrderedIds(collectionItems, pageIds, collectionPage) ||
			moveInPagedList(
				collectionItems,
				collectionPage,
				detail.oldIndex,
				detail.newIndex
			);
		collectionItems = next;
		loading = true;
		try {
			const ok = await persistOrderedIds(
				`/api/site-data/${activeTab}/reorder`,
				collectionItems.map((item) => String(item.id))
			);
			if (!ok) {
				collectionItems = previous;
				await loadCollection(activeTab);
				return;
			}
			// Soft-sync local sortOrder so refresh/restyle matches persisted desc order
			const n = collectionItems.length;
			collectionItems = collectionItems.map((item, i) => ({
				...item,
				sortOrder: n - i
			}));
		} catch (e) {
			collectionItems = previous;
			statusMessage = '❌ ผิดพลาด: ' + e.message;
			await loadCollection(activeTab);
		} finally {
			loading = false;
		}
	}

	/** @param {string[]} _ids @param {{ oldIndex: number, newIndex: number }} detail */
	async function onAuthorityReorder(_ids, detail) {
		if (loading) return;
		const { oldIndex, newIndex } = detail;
		if (oldIndex === newIndex) return;
		const previous = listItems;
		const next = [...listItems];
		const [moved] = next.splice(oldIndex, 1);
		next.splice(newIndex, 0, moved);
		listItems = next;
		loading = true;
		statusMessage = '⏳ กำลังบันทึกลำดับ...';
		try {
			const parsed = await fetchAdminJson('/api/site-data/authority', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data: listItems })
			});
			if (handleAuthFailure(parsed)) {
				listItems = previous;
				return;
			}
			if (parsed.ok && parsed.data?.status === 'success') {
				statusMessage = '✅ บันทึกลำดับเรียบร้อยแล้ว';
				listDirty = false;
				setTimeout(() => (statusMessage = ''), 2500);
			} else {
				listItems = previous;
				statusMessage = '❌ ' + (parsed.message || 'บันทึกลำดับไม่สำเร็จ');
			}
		} catch (e) {
			listItems = previous;
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function focusModalField(id) {
		await tick();
		document.getElementById(id)?.focus();
	}

	function openCollectionModal(item = null) {
		modalPreviousFocus = /** @type {HTMLElement | null} */ (document.activeElement);
		collectionEditing = item;
		cImageFile = null;
		cTitle = item?.title || '';
		cLink = item?.link || '';
		cName = item?.name || '';
		cPosition = item?.position || '';
		cPhone = item?.phone || '';
		cImage = item?.image || '';
		statusMessage = '';
		collectionModalOpen = true;
		focusModalField(activeTab === 'personnel' ? 'c-name' : 'c-title');
	}

	function handleCImage(e) {
		cImageFile = e.target.files?.[0] || null;
		if (cImageFile) {
			const check = validateImageForUpload(cImageFile);
			if (!check.ok) {
				statusMessage = '❌ ' + check.message;
				cImageFile = null;
				e.target.value = '';
			}
		}
	}

	async function saveCollectionItem() {
		if (loading) return;
		const isPersonnel = activeTab === 'personnel';
		if (isPersonnel ? !cName.trim() : !cTitle.trim()) {
			statusMessage = '❌ ' + (isPersonnel ? 'กรุณาระบุชื่อ' : 'กรุณาระบุหัวข้อ');
			return;
		}
		loading = true;
		statusMessage = '⏳ กำลังบันทึก...';
		try {
			const fd = new FormData();
			if (isPersonnel) {
				fd.append('name', cName);
				fd.append('position', cPosition);
				fd.append('phone', cPhone);
				let imageValue = cImage;
				if (cImageFile) {
					fd.append('imageFile', cImageFile);
				}
				fd.append('image', imageValue);
			} else {
				fd.append('title', cTitle);
				const hasExistingLink =
					collectionEditing?.link &&
					String(collectionEditing.link).trim() &&
					String(collectionEditing.link).trim() !== '#';
				const linkCheck = validateDocumentLink(cLink, { allowEmpty: Boolean(hasExistingLink) });
				if (!linkCheck.ok) {
					statusMessage = '❌ ' + linkCheck.message;
					loading = false;
					return;
				}
				fd.append('link', linkCheck.value || cLink.trim());
			}
			const isEdit = Boolean(collectionEditing?.id);
			if (isEdit) fd.append('id', String(collectionEditing.id));

			statusMessage = '⏳ กำลังบันทึก...';
			const parsed = await fetchAdminJson(`/api/site-data/${activeTab}`, {
				method: isEdit ? 'PUT' : 'POST',
				body: fd
			});
			if (handleAuthFailure(parsed)) return;
			if (parsed.ok && parsed.data?.status === 'success') {
				statusMessage = '✅ ' + parsed.data.message;
				closeCollectionModal();
				await loadCollection(activeTab);
				setTimeout(() => (statusMessage = ''), 3000);
			} else {
				statusMessage = '❌ ' + (parsed.message || 'บันทึกไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function deleteCollectionItem(id) {
		if (!confirm('ยืนยันการลบรายการนี้?')) return;
		if (loading) return;
		loading = true;
		statusMessage = '⏳ กำลังลบ...';
		try {
			const parsed = await fetchAdminJson(
				`/api/site-data/${activeTab}?id=${encodeURIComponent(id)}`,
				{ method: 'DELETE' }
			);
			if (handleAuthFailure(parsed)) return;
			if (parsed.ok && parsed.data?.status === 'success') {
				statusMessage = '✅ ลบรายการแล้ว';
				await loadCollection(activeTab);
				setTimeout(() => (statusMessage = ''), 3000);
			} else {
				statusMessage = '❌ ' + (parsed.message || 'ลบไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ ลบไม่สำเร็จ — ' + e.message;
		} finally {
			loading = false;
		}
	}

	let certificatesSheetUrl = '';
	let certificatesTestCount = null;
	let certificatesTestError = '';

	let bannerImageUrl = DEFAULT_BANNER_IMAGE;
	let bannerLinkUrl = DEFAULT_BANNER_LINK;
	let bannerAltText = DEFAULT_BANNER_ALT;
	let bannerImageFile = null;
	let bannerPreviewObjectUrl = '';
	let savedBannerImageUrl = DEFAULT_BANNER_IMAGE;
	let savedBannerLinkUrl = DEFAULT_BANNER_LINK;
	let savedBannerAltText = DEFAULT_BANNER_ALT;

	function revokeBannerPreviewUrl() {
		if (bannerPreviewObjectUrl) {
			URL.revokeObjectURL(bannerPreviewObjectUrl);
			bannerPreviewObjectUrl = '';
		}
	}

	function bannerPreviewSrc() {
		if (bannerPreviewObjectUrl) return bannerPreviewObjectUrl;
		return resolveDocumentOpenUrl(bannerImageUrl);
	}

	/** @param {Event} e */
	function onBannerFileChange(e) {
		const file = /** @type {HTMLInputElement} */ (e.currentTarget).files?.[0] || null;
		revokeBannerPreviewUrl();
		bannerImageFile = null;
		if (!file) return;
		const check = validateImageForUpload(file);
		if (!check.ok) {
			statusMessage = '❌ ' + check.message;
			e.currentTarget.value = '';
			return;
		}
		bannerImageFile = file;
		bannerPreviewObjectUrl = URL.createObjectURL(file);
	}

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
			bannerDirty = false;
			revokeBannerPreviewUrl();
			bannerImageFile = null;
		}
		activeTab = tab;
		newsPage = 1;
		activityPage = 1;
		collectionPage = 1;
		dataHint = '';
		if (tab === 'certificates') {
			await loadCertificatesConfig();
		} else if (tab === 'banner') {
			await loadBannerConfig();
		} else if (isItemCollectionTab(tab)) {
			await loadCollection(tab);
		} else if (isListTab(tab)) {
			await loadList(tab);
		} else if (tab === 'news' || tab === 'activity') {
			if (news.length === 0 && activities.length === 0) {
				await loadData();
			} else if (tab === 'news') {
				dataHint = emptyDataHint(newsDataSource, news.length);
			} else {
				dataHint = emptyDataHint(activityDataSource, activities.length);
			}
		}
	}

	async function loadCertificatesConfig() {
		loading = true;
		certificatesTestCount = null;
		certificatesTestError = '';
		try {
			const parsed = await fetchAdminJson('/api/certificates/config');
			if (handleAuthFailure(parsed)) return;
			if (parsed.ok && parsed.data) {
				certificatesSheetUrl = parsed.data.sheetUrl || '';
				savedCertificatesSheetUrl = certificatesSheetUrl;
				certificatesDirty = false;
				if (certificatesSheetUrl) {
					await loadCertificatesList();
				}
			} else {
				statusMessage = '❌ ' + (parsed.message || 'โหลดการตั้งค่าไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ โหลดการตั้งค่าไม่สำเร็จ';
		} finally {
			loading = false;
		}
	}

	async function saveCertificatesConfig() {
		if (loading) return;
		const sheetUrl = certificatesSheetUrl.trim();
		if (!sheetUrl) {
			statusMessage = '❌ กรุณาระบุ URL';
			return;
		}
		loading = true;
		statusMessage = '⏳ กำลังบันทึก...';
		try {
			const parsed = await fetchAdminJson('/api/certificates/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sheetUrl })
			});
			if (handleAuthFailure(parsed)) return;
			if (parsed.ok && parsed.data?.status === 'success') {
				statusMessage = '✅ ' + parsed.data.message;
				certificatesSheetUrl = parsed.data.sheetUrl || sheetUrl;
				savedCertificatesSheetUrl = certificatesSheetUrl;
				certificatesDirty = false;
				setTimeout(() => (statusMessage = ''), 3000);
			} else {
				statusMessage = '❌ ' + (parsed.message || 'บันทึกไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function loadBannerConfig() {
		loading = true;
		revokeBannerPreviewUrl();
		bannerImageFile = null;
		try {
			const parsed = await fetchAdminJson('/api/banner/config');
			if (handleAuthFailure(parsed)) return;
			if (parsed.ok && parsed.data) {
				bannerImageUrl = parsed.data.imageUrl || DEFAULT_BANNER_IMAGE;
				bannerLinkUrl = parsed.data.linkUrl || DEFAULT_BANNER_LINK;
				bannerAltText = parsed.data.altText || DEFAULT_BANNER_ALT;
				savedBannerImageUrl = bannerImageUrl;
				savedBannerLinkUrl = bannerLinkUrl;
				savedBannerAltText = bannerAltText;
				bannerDirty = false;
			} else {
				statusMessage = '❌ ' + (parsed.message || 'โหลดแบนเนอร์ไม่สำเร็จ');
			}
		} catch {
			statusMessage = '❌ โหลดแบนเนอร์ไม่สำเร็จ';
		} finally {
			loading = false;
		}
	}

	async function saveBannerConfig() {
		if (loading) return;
		const altText = bannerAltText.trim();
		if (!altText) {
			statusMessage = '❌ กรุณาระบุข้อความ alt';
			return;
		}
		loading = true;
		statusMessage = '⏳ กำลังบันทึก...';
		try {
			const fd = new FormData();
			fd.append('linkUrl', bannerLinkUrl.trim());
			fd.append('altText', altText);
			if (bannerImageFile) {
				fd.append('imageFile', bannerImageFile);
			}
			const parsed = await fetchAdminJson('/api/banner/config', {
				method: 'POST',
				body: fd
			});
			if (handleAuthFailure(parsed)) return;
			if (parsed.ok && parsed.data?.status === 'success') {
				statusMessage = '✅ ' + parsed.data.message;
				bannerImageUrl = parsed.data.imageUrl || bannerImageUrl;
				bannerLinkUrl = parsed.data.linkUrl || bannerLinkUrl;
				bannerAltText = parsed.data.altText || altText;
				savedBannerImageUrl = bannerImageUrl;
				savedBannerLinkUrl = bannerLinkUrl;
				savedBannerAltText = bannerAltText;
				bannerDirty = false;
				revokeBannerPreviewUrl();
				bannerImageFile = null;
				await invalidateAll();
				setTimeout(() => (statusMessage = ''), 3000);
			} else {
				statusMessage = '❌ ' + (parsed.message || 'บันทึกไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	// Certificate Full Management State
	let certList = [];
	let certSearchTerm = '';
	let certFilterYear = '';
	let certFilterCourse = '';
	let certYears = [];
	let certCourses = [];
	let certTypes = [];
	let showCertModal = false;
	let certModalTitle = '📜 เพิ่มเกียรติบัตร';
	let certFormRow = null;
	let certFormName = '';
	let certFormCourse = '';
	let certFormYear = '';
	let certFormType = '';
	let certFormLink = '';
	let certActionLoading = false;
	let isCustomCourse = false;
	let isCustomYear = false;
	let isCustomType = false;

	function parseCertRows(text) {
		const rows = text.split('\n').filter((r) => r.trim() !== '');
		if (rows.length < 2) return [];
		const headers = rows[0].split(',').map((h) => h.trim().replace(/^"|"$/g, '').toLowerCase());

		return rows.slice(1).map((row, idx) => {
			const values = [];
			let inQuote = false;
			let currentVal = '';
			for (let i = 0; i < row.length; i++) {
				const char = row[i];
				if (char === '"') inQuote = !inQuote;
				else if (char === ',' && !inQuote) {
					values.push(currentVal.trim().replace(/^"|"$/g, ''));
					currentVal = '';
				} else {
					currentVal += char;
				}
			}
			values.push(currentVal.trim().replace(/^"|"$/g, ''));

			const obj = { _row: idx + 2 };
			headers.forEach((h, index) => {
				obj[h] = values[index] || '';
			});

			return {
				_row: obj._row,
				name: obj.name || obj['ชื่อ-สกุล'] || obj['ชื่อ'] || '',
				course: obj.course || obj['หลักสูตร'] || '-',
				year: obj.year || obj['ปี'] || obj['ปีการศึกษา'] || '',
				type: obj.type || obj['ประเภท'] || '-',
				link: obj.link || obj['ลิงก์'] || obj['เอกสาร'] || ''
			};
		});
	}

	async function loadCertificatesList(forceRefresh = false) {
		const url = certificatesSheetUrl.trim();
		if (!url) return;
		loading = true;
		certificatesTestError = '';
		try {
			const isGas = url.includes('script.google.com');
			if (isGas) {
				const fetchUrl = url + (url.includes('?') ? '&' : '?') + 't=' + Date.now();
				const res = await fetch(fetchUrl);
				const json = await res.json();
				if (json && json.status === 'success' && Array.isArray(json.data)) {
					certList = json.data;
				} else {
					throw new Error(json.message || 'รูปแบบ JSON จาก Google Apps Script ไม่ถูกต้อง');
				}
			} else {
				const res = await fetch(url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now());
				if (!res.ok) throw new Error('HTTP ' + res.status);
				const text = await res.text();
				certList = parseCertRows(text);
			}

			certYears = [...new Set(certList.map((c) => c.year).filter(Boolean))].sort().reverse();
			certCourses = [...new Set(certList.map((c) => c.course).filter((c) => c && c !== '-'))].sort();
			certTypes = [...new Set(certList.map((c) => c.type).filter((c) => c && c !== '-'))].sort();
			certificatesTestCount = certList.length;
		} catch (e) {
			certificatesTestError = 'โหลดข้อมูลไม่สำเร็จ: ' + e.message;
			certList = [];
		} finally {
			loading = false;
		}
	}

	$: filteredCertList = certList.filter((c) => {
		if (certFilterYear && c.year !== certFilterYear) return false;
		if (certFilterCourse && c.course !== certFilterCourse) return false;
		if (certSearchTerm) {
			const term = certSearchTerm.toLowerCase().trim();
			const matchName = (c.name || '').toLowerCase().includes(term);
			const matchCourse = (c.course || '').toLowerCase().includes(term);
			return matchName || matchCourse;
		}
		return true;
	});

	function openAddCertModal() {
		certFormRow = null;
		certModalTitle = '📜 เพิ่มเกียรติบัตร';
		certFormName = '';
		certFormCourse = '';
		certFormYear = '';
		certFormType = '';
		certFormLink = '';
		isCustomCourse = false;
		isCustomYear = false;
		isCustomType = false;
		showCertModal = true;
	}

	function openEditCertModal(item) {
		certFormRow = item._row;
		certModalTitle = '✏️ แก้ไขข้อมูลเกียรติบัตร';
		certFormName = item.name || '';
		certFormCourse = item.course || '';
		certFormYear = item.year || '';
		certFormType = item.type || '';
		certFormLink = item.link || '';
		isCustomCourse = Boolean(certFormCourse && !certCourses.includes(certFormCourse));
		isCustomYear = Boolean(certFormYear && !certYears.includes(certFormYear));
		isCustomType = Boolean(certFormType && !certTypes.includes(certFormType));
		showCertModal = true;
	}

	function closeCertModal() {
		showCertModal = false;
	}

	async function submitCertForm() {
		const url = certificatesSheetUrl.trim();
		if (!url || !url.includes('script.google.com')) {
			alert('⚠️ กรุณาระบุ Google Apps Script Web App URL ที่ช่องด้านบนและกดบันทึกก่อน เพื่อให้สามารถเขียนลง Google Sheets ได้แบบ Realtime!');
			return;
		}
		if (!certFormName.trim()) {
			alert('กรุณากรอกชื่อ-สกุล');
			return;
		}

		certActionLoading = true;
		const payload = {
			action: certFormRow ? 'update' : 'add',
			row: certFormRow,
			item: {
				name: certFormName.trim(),
				course: certFormCourse.trim(),
				year: certFormYear.trim(),
				type: certFormType.trim(),
				link: certFormLink.trim()
			}
		};

		try {
			const res = await fetch(url, {
				method: 'POST',
				body: JSON.stringify(payload)
			});
			const result = await res.json();
			if (result.status === 'success') {
				alert(certFormRow ? '✅ อัปเดตข้อมูลสำเร็จ!' : '✅ เพิ่มเกียรติบัตรสำเร็จ!');
				closeCertModal();
				await loadCertificatesList(true);
			} else {
				alert('❌ ไม่สามารถบันทึกได้: ' + (result.message || ''));
			}
		} catch (e) {
			alert('❌ เกิดข้อผิดพลาดในการเชื่อมต่อ Google Apps Script: ' + e.message);
		} finally {
			certActionLoading = false;
		}
	}

	async function deleteCertRow(rowNum, name) {
		const url = certificatesSheetUrl.trim();
		if (!url || !url.includes('script.google.com')) {
			alert('⚠️ กรุณาระบุ Google Apps Script Web App URL เพื่อลบข้อมูลออกจาก Sheet');
			return;
		}
		if (!confirm(`ยืนยันการลบเกียรติบัตรของ "${name}" ออกจาก Google Sheets?`)) return;

		loading = true;
		try {
			const res = await fetch(url, {
				method: 'POST',
				body: JSON.stringify({ action: 'delete', row: rowNum })
			});
			const result = await res.json();
			if (result.status === 'success') {
				alert('✅ ลบรายการเรียบร้อยแล้ว!');
				await loadCertificatesList(true);
			} else {
				alert('❌ ลบไม่สำเร็จ: ' + (result.message || ''));
			}
		} catch (e) {
			alert('❌ ผิดพลาด: ' + e.message);
		} finally {
			loading = false;
		}
	}

	// News/Activity Form State
	let showModal = false;
	let editingItem = null;
	let formType = 'news'; // 'news' or 'activity'
	
	let title = '';
	let category = 'ข่าวกิจกรรม';
	let summary = '';
	let date = '';
	let image = null;
	let imageUrl = '';
	let pdfFile = null;
	let link = '';

	onMount(async () => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		await loadCollection('personnel');
	});

	onDestroy(() => {
		revokeBannerPreviewUrl();
		if (typeof window !== 'undefined') {
			window.removeEventListener('beforeunload', handleBeforeUnload);
		}
	});

	$: certificatesDirty =
		activeTab === 'certificates' && certificatesSheetUrl !== savedCertificatesSheetUrl;

	$: bannerDirty =
		activeTab === 'banner' &&
		(bannerLinkUrl !== savedBannerLinkUrl ||
			bannerAltText !== savedBannerAltText ||
			Boolean(bannerImageFile));

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
			dataHint = 'โหลดข้อมูลไม่สำเร็จ — ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function loadList(type) {
		loading = true;
		dataHint = '';
		try {
			const parsed = await fetchAdminJson(`/api/site-data/${type}`);
			if (handleAuthFailure(parsed)) return;
			if (parsed.ok && parsed.data) {
				const items = parsed.data.items || [];
				listItems = items;
				dataHint = emptyDataHint(parsed.data.source, items.length);
			} else {
				listItems = [];
				dataHint = parsed.message || `โหลด ${type} ไม่สำเร็จ`;
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
		// Only the authority list still uses the bulk editor
		listItems = [...listItems, ''];
		markListDirty();
	}

	function removeListItem(index) {
		listItems = listItems.filter((_, i) => i !== index);
		markListDirty();
	}

	async function saveList() {
		if (loading) return;
		loading = true;
		statusMessage = `⏳ กำลังบันทึก ${activeTab}...`;
		try {
			const parsed = await fetchAdminJson(`/api/site-data/${activeTab}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ data: listItems })
			});
			if (handleAuthFailure(parsed)) return;
			if (parsed.ok && parsed.data?.status === 'success') {
				statusMessage = '✅ บันทึกสำเร็จ';
				listDirty = false;
				setTimeout(() => (statusMessage = ''), 3000);
			} else {
				statusMessage = '❌ ' + (parsed.message || 'บันทึกไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	function openModal(type, item = null) {
		modalPreviousFocus = /** @type {HTMLElement | null} */ (document.activeElement);
		formType = type;
		editingItem = item;
		showModal = true;
		
		image = null;
		pdfFile = null;
		if (item) {
			title = item.title || '';
			if (type === 'activity') {
				category = item.category || 'ข่าวกิจกรรม';
			}
			summary = item.summary || '';
			date = thaiDateToInput(item.date) || '';
			imageUrl = type === 'activity' ? (item.image || '') : '';
			link = item.link || '';
		} else {
			title = '';
			if (type === 'activity') {
				category = 'ข่าวกิจกรรม';
			}
			summary = '';
			date = '';
			image = null;
			imageUrl = '';
			link = '';
		}
		focusModalField('modal-title');
	}

	async function saveItem() {
		if (loading) return;
		if (!title.trim()) {
			statusMessage = '❌ กรุณาระบุหัวข้อ';
			return;
		}
		if (formType === 'news') {
			const hasExistingLink =
				editingItem?.link &&
				String(editingItem.link).trim() &&
				String(editingItem.link).trim() !== '#';
			const hasPdf = pdfFile && pdfFile.size > 0;
			const hasLink = link.trim().length > 0;
			if (!hasPdf && !hasLink && !hasExistingLink) {
				statusMessage = '❌ กรุณาอัปโหลด PDF หรือวางลิงก์เอกสาร';
				return;
			}
			if (hasPdf) {
				const pdfCheck = validatePdfForUpload(pdfFile);
				if (!pdfCheck.ok) {
					statusMessage = '❌ ' + pdfCheck.message;
					return;
				}
			}
			if (hasLink && !hasPdf) {
				const linkCheck = validateDocumentLink(link, { allowEmpty: false });
				if (!linkCheck.ok) {
					statusMessage = '❌ ' + linkCheck.message;
					return;
				}
			}
		}

		loading = true;
		statusMessage = '⏳ กำลังบันทึก...';

		try {
			const formData = new FormData();
			formData.append('title', title);
			if (formType === 'activity') {
				formData.append('category', category);
			}
			formData.append('summary', summary);
			formData.append('date', date);
			if (formType === 'news') {
				if (pdfFile) {
					formData.append('pdfFile', pdfFile);
				} else if (link.trim()) {
					const linkCheck = validateDocumentLink(link, { allowEmpty: false });
					formData.append('link', linkCheck.ok ? linkCheck.value || link.trim() : link.trim());
				}
			} else {
				formData.append('link', link);
			}
			if (formType === 'activity') {
				if (image) {
					formData.append('image', image);
				} else if (imageUrl) {
					formData.append('imageUrl', imageUrl);
				}
			}

			const isEdit = Boolean(editingItem?.id);
			if (isEdit) {
				formData.append('id', String(editingItem.id));
			}

			const endpoint = formType === 'news' ? '/api/news' : '/api/activities';

			statusMessage = '⏳ กำลังบันทึก...';
			const parsed = await fetchAdminJson(endpoint, {
				method: isEdit ? 'PUT' : 'POST',
				body: formData
			});
			if (handleAuthFailure(parsed)) return;

			if (parsed.ok && parsed.data?.status === 'success') {
				statusMessage = '✅ ' + parsed.data.message;
				closeEditModal();
				await loadData();
			} else {
				statusMessage = '❌ ' + (parsed.message || 'บันทึกไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ ผิดพลาด: ' + e.message;
		} finally {
			loading = false;
		}
	}

	async function deleteItem(id, type) {
		if (!confirm('ยืนยันการลบข้อมูลนี้?')) return;
		if (loading) return;

		loading = true;
		statusMessage = '⏳ กำลังลบ...';
		try {
			const endpoint = type === 'news' ? '/api/news' : '/api/activities';
			const parsed = await fetchAdminJson(`${endpoint}?id=${encodeURIComponent(id)}`, {
				method: 'DELETE'
			});
			if (handleAuthFailure(parsed)) return;
			if (parsed.ok && parsed.data?.status === 'success') {
				statusMessage = '✅ ลบข้อมูลแล้ว';
				await loadData();
				setTimeout(() => (statusMessage = ''), 3000);
			} else {
				statusMessage = '❌ ' + (parsed.message || 'ลบไม่สำเร็จ');
			}
		} catch (e) {
			statusMessage = '❌ ลบไม่สำเร็จ — ' + e.message;
		} finally {
			loading = false;
		}
	}

	function handleFileChange(e) {
		image = e.target.files?.[0] || null;
		if (image) {
			const check = validateImageForUpload(image);
			if (!check.ok) {
				statusMessage = '❌ ' + check.message;
				image = null;
				e.target.value = '';
			}
		}
	}

	function handlePdf(e) {
		pdfFile = e.target.files?.[0] || null;
		if (pdfFile) {
			const check = validatePdfForUpload(pdfFile);
			if (!check.ok) {
				statusMessage = '❌ ' + check.message;
				pdfFile = null;
				e.target.value = '';
			}
		}
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
			<a href="/logout" class="admin-logout-btn" data-sveltekit-reload>ออกจากระบบ</a>
		</div>
	</header>

	<nav class="admin-nav">
		<div class="container">
			{#each adminNavTabs as tab}
				<button class:active={activeTab === tab.id} on:click={() => selectTab(tab.id)}>{tab.label}</button>
			{/each}
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

			{#if statusMessage}
				<div class="status-box" role="status" aria-live="polite" aria-label={statusAriaLabel(statusMessage)} class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
					{statusMessage}
				</div>
			{/if}

			<div class="items-list" use:bindSortable={{ onReorder: onNewsReorder }}>
				{#each paginatedNews as item (item.id)}
					<div class="admin-item" data-id={item.id}>
						<button type="button" class="drag-handle" aria-label="ลากเพื่อจัดลำดับ">☰</button>
						<div class="item-doc">
							<span class="doc-icon" aria-hidden="true">📄</span>
							<span class="doc-label">PDF</span>
						</div>
						<div class="item-info">
							<h3>{item.title}</h3>
							<div class="item-meta">📅 {item.date}</div>
							{#if item.link && item.link !== '#'}
								<a class="item-external-link" href={item.link} target="_blank" rel="noopener noreferrer">
									เปิดเอกสาร ↗
								</a>
							{:else}
								<span class="item-no-doc">ยังไม่มีเอกสาร</span>
							{/if}
						</div>
						<div class="item-actions">
							<button class="btn-edit" on:click={() => openModal('news', item)}>แก้ไข</button>
							<button class="btn-delete" on:click={() => deleteItem(item.id, 'news')}>ลบ</button>
						</div>
					</div>
				{/each}
			</div>

			{#if news.length > ADMIN_PAGE_SIZE}
				<nav class="pagination" aria-label="เลื่อนหน้ารายการข่าว">
					<div class="pagination-info">
						แสดง {adminPageStart(newsPage)} ถึง {adminPageEnd(newsPage, news.length)} จาก {news.length} รายการ
					</div>
					<div class="pagination-controls">
						<button type="button" class="page-btn nav-btn" disabled={newsPage === 1} on:click={() => goToAdminPage('news', newsPage - 1)} aria-label="หน้าก่อน">&lt;</button>
						{#each adminVisiblePages(newsPage, adminTotalPages(news.length)) as pageNum}
							<button type="button" class="page-btn {newsPage === pageNum ? 'active' : ''}" on:click={() => goToAdminPage('news', pageNum)} aria-current={newsPage === pageNum ? 'page' : undefined}>{pageNum}</button>
						{/each}
						<button type="button" class="page-btn nav-btn" disabled={newsPage === adminTotalPages(news.length)} on:click={() => goToAdminPage('news', newsPage + 1)} aria-label="หน้าถัดไป">&gt;</button>
					</div>
				</nav>
			{/if}

		{:else if activeTab === 'activity'}
			<div class="tab-header">
				<h2>📸 ภาพกิจกรรม ({activities.length})</h2>
				<button class="btn-add" on:click={() => openModal('activity')}>+ เพิ่มภาพกิจกรรม</button>
			</div>

			{#if statusMessage}
				<div class="status-box" role="status" aria-live="polite" aria-label={statusAriaLabel(statusMessage)} class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
					{statusMessage}
				</div>
			{/if}

			<div class="items-list" use:bindSortable={{ onReorder: onActivityReorder }}>
				{#each paginatedActivities as item (item.id)}
					<div class="admin-item" data-id={item.id}>
						<button type="button" class="drag-handle" aria-label="ลากเพื่อจัดลำดับ">☰</button>
						<div class="item-img">
							<img src={item.image} alt={item.title || 'ภาพกิจกรรม'} loading="lazy" decoding="async" on:error={handleImgError}>
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

			{#if activities.length > ADMIN_PAGE_SIZE}
				<nav class="pagination" aria-label="เลื่อนหน้ารายการกิจกรรม">
					<div class="pagination-info">
						แสดง {adminPageStart(activityPage)} ถึง {adminPageEnd(activityPage, activities.length)} จาก {activities.length} รายการ
					</div>
					<div class="pagination-controls">
						<button type="button" class="page-btn nav-btn" disabled={activityPage === 1} on:click={() => goToAdminPage('activity', activityPage - 1)} aria-label="หน้าก่อน">&lt;</button>
						{#each adminVisiblePages(activityPage, adminTotalPages(activities.length)) as pageNum}
							<button type="button" class="page-btn {activityPage === pageNum ? 'active' : ''}" on:click={() => goToAdminPage('activity', pageNum)} aria-current={activityPage === pageNum ? 'page' : undefined}>{pageNum}</button>
						{/each}
						<button type="button" class="page-btn nav-btn" disabled={activityPage === adminTotalPages(activities.length)} on:click={() => goToAdminPage('activity', activityPage + 1)} aria-label="หน้าถัดไป">&gt;</button>
					</div>
				</nav>
			{/if}
		{:else if activeTab === 'certificates'}
			<div class="list-editor certificates-config">
				<div class="tab-header">
					<h2>
						🏆 คลังเกียรติบัตร (Google Sheets Realtime 2-Way Sync)
						{#if certificatesDirty}<span class="dirty-badge">ยังไม่บันทึก URL</span>{/if}
					</h2>
					<div class="tab-header-actions">
						<button class="btn-add" type="button" on:click={openAddCertModal}>+ เพิ่มเกียรติบัตร</button>
						<button class="btn-test" type="button" on:click={() => loadCertificatesList(true)} disabled={loading}>🔄 รีเฟรชข้อมูลสด</button>
					</div>
				</div>

				<div class="form-group" style="margin-bottom: 1.5rem; background: var(--bg-card, #1e1e1e); padding: 1rem; border-radius: 8px; border: 1px dashed var(--border-color, #444);">
					<label for="cert-sheet-url" style="font-weight: 600; margin-bottom: 0.5rem; display: block;">
						🔗 URL ของ Google Apps Script Web App หรือ Google Sheets (CSV)
					</label>
					<div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
						<input
							type="url"
							id="cert-sheet-url"
							class="cert-url-input"
							style="flex: 1; min-width: 260px;"
							bind:value={certificatesSheetUrl}
							placeholder="https://script.google.com/macros/s/.../exec หรือ https://docs.google.com/spreadsheets/d/e/.../pub?output=csv"
						>
						<button class="btn-save" style="margin: 0; white-space: nowrap;" on:click={saveCertificatesConfig} disabled={loading}>
							{loading ? 'กำลังบันทึก...' : '💾 บันทึก URL'}
						</button>
					</div>
					<small style="color: var(--text-muted, #aaa); margin-top: 0.5rem; display: block;">
						💡 หากใส่ URL ของ <strong>Google Apps Script Web App</strong> จะสามารถ <strong>เพิ่ม / แก้ไข / ลบ</strong> ข้อมูลลงใน Google Sheets ได้แบบ Realtime ทันที!
					</small>
				</div>

				{#if statusMessage}
					<div class="status-box" role="status" aria-live="polite" aria-label={statusAriaLabel(statusMessage)} class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
						{statusMessage}
					</div>
				{/if}

				{#if certificatesTestError}
					<div class="status-box error" role="alert">{certificatesTestError}</div>
				{/if}

				<!-- Search & Filter Row -->
				<div style="display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;">
					<input
						type="text"
						placeholder="🔍 ค้นหาชื่อ หรือ หลักสูตร..."
						bind:value={certSearchTerm}
						style="flex: 1; min-width: 200px; padding: 0.6rem 1rem; border-radius: 6px; border: 1px solid var(--border-color, #444); background: var(--bg-input, #2a2a2a); color: var(--text-main, #fff);"
					>
					<select
						bind:value={certFilterYear}
						style="padding: 0.6rem 1rem; border-radius: 6px; border: 1px solid var(--border-color, #444); background: var(--bg-input, #2a2a2a); color: var(--text-main, #fff);"
					>
						<option value="">ปีทั้งหมด</option>
						{#each certYears as yr}
							<option value={yr}>{yr}</option>
						{/each}
					</select>
					<select
						bind:value={certFilterCourse}
						style="padding: 0.6rem 1rem; border-radius: 6px; border: 1px solid var(--border-color, #444); background: var(--bg-input, #2a2a2a); color: var(--text-main, #fff);"
					>
						<option value="">หลักสูตรทั้งหมด</option>
						{#each certCourses as cr}
							<option value={cr}>{cr}</option>
						{/each}
					</select>
				</div>

				<!-- Table of Certificates -->
				<div style="overflow-x: auto; background: var(--bg-card, #1e1e1e); border-radius: 8px; border: 1px solid var(--border-color, #333);">
					<table style="width: 100%; border-collapse: collapse; text-align: left;">
						<thead>
							<tr style="background: rgba(156, 39, 176, 0.15); border-bottom: 2px solid var(--border-color, #333);">
								<th style="padding: 0.75rem 1rem;">#</th>
								<th style="padding: 0.75rem 1rem;">ชื่อ-สกุล</th>
								<th style="padding: 0.75rem 1rem;">หลักสูตร</th>
								<th style="padding: 0.75rem 1rem;">ปี พ.ศ.</th>
								<th style="padding: 0.75rem 1rem;">ประเภท</th>
								<th style="padding: 0.75rem 1rem;">เอกสาร</th>
								<th style="padding: 0.75rem 1rem; text-align: center;">จัดการ</th>
							</tr>
						</thead>
						<tbody>
							{#if loading}
								<tr>
									<td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted, #888);">
										⏳ กำลังโหลดข้อมูลเกียรติบัตร...
									</td>
								</tr>
							{:else if filteredCertList.length === 0}
								<tr>
									<td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted, #888);">
										ไม่พบรายการเกียรติบัตร
									</td>
								</tr>
							{:else}
								{#each filteredCertList as item, i (item._row || i)}
									<tr style="border-bottom: 1px solid var(--border-color, #333);">
										<td style="padding: 0.75rem 1rem; color: var(--text-muted, #888);">{i + 1}</td>
										<td style="padding: 0.75rem 1rem; font-weight: 600;">{item.name || '-'}</td>
										<td style="padding: 0.75rem 1rem;">{item.course || '-'}</td>
										<td style="padding: 0.75rem 1rem;">{item.year || '-'}</td>
										<td style="padding: 0.75rem 1rem;">
											<span style="background: rgba(156, 39, 176, 0.2); color: #ce93d8; padding: 2px 8px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">
												{item.type || '-'}
											</span>
										</td>
										<td style="padding: 0.75rem 1rem;">
											{#if item.link}
												<a href={item.link} target="_blank" rel="noreferrer" style="color: #ba68c8; text-decoration: underline;">
													🔗 เปิดดู
												</a>
											{:else}
												<span style="color: var(--text-muted, #666);">-</span>
											{/if}
										</td>
										<td style="padding: 0.75rem 1rem; text-align: center; white-space: nowrap;">
											<button
												type="button"
												class="btn-edit"
												style="padding: 4px 8px; font-size: 0.85rem; margin-right: 4px;"
												on:click={() => openEditCertModal(item)}
											>
												✏️ แก้ไข
											</button>
											<button
												type="button"
												class="btn-delete"
												style="padding: 4px 8px; font-size: 0.85rem; background: #ffebee; color: #c62828; border: 1px solid #ef9a9a; border-radius: 4px; cursor: pointer;"
												on:click={() => deleteCertRow(item._row, item.name)}
											>
												🗑️ ลบ
											</button>
										</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
				<div style="margin-top: 0.75rem; text-align: right; color: var(--text-muted, #888); font-size: 0.9rem;">
					แสดง {filteredCertList.length} จากทั้งหมด {certList.length} รายการ
				</div>
			</div>
		{:else if activeTab === 'banner'}
			<div class="list-editor banner-config">
				<div class="tab-header">
					<h2>
						🖼️ แบนเนอร์ด้านบนเว็บไซต์
						{#if bannerDirty}<span class="dirty-badge">ยังไม่บันทึก</span>{/if}
					</h2>
				</div>

				<p class="banner-help">
					รูปแบนเนอร์ static แสดงด้านบนทุกหน้า (header) — อัตราส่วนแนะนำ <strong>6063×1250 px</strong> (~4.85:1) มีบุคลากร 3 ท่านพร้อมชื่อ/ตำแหน่งบน nameplate ลำดับ: รอง ผอ.เขต → ผอ.กลุ่ม → นักทรัพยากรบุคคล ไฟล์ JPEG/PNG/WebP สูงสุด {MAX_IMAGE_MB} MB สร้างใน Canva/Figma/Photoshop หรือรัน <code>node scripts/composite-banner.mjs</code> จากรูpใน repo
				</p>

				<div class="banner-preview-wrap">
					<img
						src={bannerPreviewSrc()}
						alt={bannerAltText || 'ตัวอย่างแบนเนอร์'}
						class="banner-preview-img"
						loading="lazy"
						decoding="async"
					>
				</div>

				<div class="form-group">
					<label for="banner-link-url">ลิงก์เมื่อคลิกแบนเนอร์</label>
					<input
						type="text"
						id="banner-link-url"
						class="banner-url-input"
						bind:value={bannerLinkUrl}
						placeholder="/ หรือ https://..."
					>
				</div>

				<div class="form-group">
					<label for="banner-alt-text">ข้อความ alt (สำหรับผู้ใช้ screen reader)</label>
					<input
						type="text"
						id="banner-alt-text"
						class="banner-url-input"
						bind:value={bannerAltText}
						placeholder={DEFAULT_BANNER_ALT}
					>
				</div>

				<div class="form-group">
					<label for="banner-image-file">อัปโหลดรูปใหม่ (ไม่เลือก = ใช้รูปเดิม)</label>
					<input
						type="file"
						id="banner-image-file"
						accept="image/jpeg,image/png,image/webp,image/gif"
						on:change={onBannerFileChange}
					>
				</div>

				<div class="cert-actions-row">
					<button class="btn-save" on:click={saveBannerConfig} disabled={loading}>
						{loading ? 'กำลังบันทึก...' : '💾 บันทึกแบนเนอร์'}
					</button>
				</div>

				{#if statusMessage}
					<div class="status-box" role="status" aria-live="polite" aria-label={statusAriaLabel(statusMessage)} class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
						{statusMessage}
					</div>
				{/if}
			</div>
		{:else if isItemCollectionTab(activeTab)}
			<div class="tab-header">
				<h2>{listTypes.find((t) => t.id === activeTab)?.name} ({collectionItems.length})</h2>
				<div class="actions">
					<button class="btn-add" on:click={() => openCollectionModal()}>+ เพิ่มรายการ</button>
				</div>
			</div>

			{#if statusMessage}
				<div class="status-box" role="status" aria-live="polite" aria-label={statusAriaLabel(statusMessage)} class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
					{statusMessage}
				</div>
			{/if}

			<div class="items-list" use:bindSortable={{ onReorder: onCollectionReorder }}>
				{#each paginatedCollection as item (item.id)}
					<div class="admin-item" data-id={item.id}>
						<button type="button" class="drag-handle" aria-label="ลากเพื่อจัดลำดับ">☰</button>
						{#if activeTab === 'personnel'}
							<div class="item-img item-img--portrait">
								<img src={resolvePersonnelImageSrc(item.image)} alt={item.name || 'รูปบุคลากร'} loading="lazy" decoding="async" on:error={handleImgError}>
							</div>
							<div class="item-info">
								<h3>{item.name}</h3>
								<div class="item-meta">{item.position}{item.phone ? ` | 📞 ${item.phone}` : ''}</div>
							</div>
						{:else}
							<div class="item-doc">
								<span class="doc-icon" aria-hidden="true">📄</span>
								<span class="doc-label">PDF</span>
							</div>
							<div class="item-info">
								<h3>{item.title}</h3>
								{#if item.link && item.link !== '#'}
									<a class="item-external-link" href={item.link} target="_blank" rel="noopener noreferrer">
										เปิดเอกสาร ↗
									</a>
								{:else}
									<span class="item-no-doc">ยังไม่มีเอกสาร</span>
								{/if}
							</div>
						{/if}
						<div class="item-actions">
							<button class="btn-edit" on:click={() => openCollectionModal(item)}>แก้ไข</button>
							<button class="btn-delete" on:click={() => deleteCollectionItem(item.id)}>ลบ</button>
						</div>
					</div>
				{/each}

				{#if collectionItems.length === 0}
					<p class="empty">ไม่มีข้อมูลในรายการนี้</p>
				{/if}
			</div>

			{#if collectionItems.length > ADMIN_PAGE_SIZE}
				<nav class="pagination" aria-label="เลื่อนหน้ารายการ">
					<div class="pagination-info">
						แสดง {adminPageStart(collectionPage)} ถึง {adminPageEnd(collectionPage, collectionItems.length)} จาก {collectionItems.length} รายการ
					</div>
					<div class="pagination-controls">
						<button type="button" class="page-btn nav-btn" disabled={collectionPage === 1} on:click={() => goToAdminPage('collection', collectionPage - 1)} aria-label="หน้าก่อน">&lt;</button>
						{#each adminVisiblePages(collectionPage, adminTotalPages(collectionItems.length)) as pageNum}
							<button type="button" class="page-btn {collectionPage === pageNum ? 'active' : ''}" on:click={() => goToAdminPage('collection', pageNum)} aria-current={collectionPage === pageNum ? 'page' : undefined}>{pageNum}</button>
						{/each}
						<button type="button" class="page-btn nav-btn" disabled={collectionPage === adminTotalPages(collectionItems.length)} on:click={() => goToAdminPage('collection', collectionPage + 1)} aria-label="หน้าถัดไป">&gt;</button>
					</div>
				</nav>
			{/if}
		{:else if activeTab === 'authority'}
			<div class="list-editor">
				<div class="tab-header">
					<h2>
						✏️ แก้ไข {listTypes.find((t) => t.id === 'authority')?.name}
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
					<div class="status-box" role="status" aria-live="polite" aria-label={statusAriaLabel(statusMessage)} class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
						{statusMessage}
					</div>
				{/if}

				<div class="items-list-editor" use:bindSortable={{ onReorder: onAuthorityReorder }}>
					{#each listItems as item, i (i + ':' + item)}
						<div class="list-edit-row" data-id={String(i)}>
							<button type="button" class="drag-handle" aria-label="ลากเพื่อจัดลำดับ">☰</button>
							<span class="index">{i + 1}</span>
							<input type="text" id="auth-{i}" bind:value={listItems[i]} on:input={markListDirty} placeholder="รายละเอียดอำนาจหน้าที่...">
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
	<div class="modal-backdrop" on:click={closeEditModal} role="presentation">
		<div
			class="modal-content"
			bind:this={editModalEl}
			on:click|stopPropagation
			on:keydown={onEditModalKeydown}
			tabindex="-1"
			role="dialog"
			aria-modal="true"
			aria-labelledby="edit-modal-title"
		>
			<div class="modal-header">
				<h3 id="edit-modal-title">
					{editingItem ? '📝 แก้ไข' : '➕ เพิ่มใหม่'}
					({formType === 'news' ? 'ข่าวประชาสัมพันธ์' : 'ภาพกิจกรรม'})
					{#if editingItem?.id}<span class="edit-id">ID: {editingItem.id}</span>{/if}
				</h3>
				<button class="close-btn" on:click={closeEditModal} aria-label="ปิดหน้าต่าง">&times;</button>
			</div>
			
			<div class="modal-body">
				<div class="form-group">
					<label for="modal-title">หัวข้อ / ชื่อรายการ</label>
					<input type="text" id="modal-title" bind:value={title} maxlength="200" placeholder="กรอกหัวข้อ...">
				</div>

				<div class="form-group">
					<label for="modal-date">วันที่</label>
					<input type="date" id="modal-date" bind:value={date}>
				</div>

				<div class="form-group">
					<label for="modal-summary">รายละเอียด / สรุปเนื้อหา</label>
					<textarea id="modal-summary" bind:value={summary} rows="3" maxlength="2000" placeholder="สรุปเนื้อหาเบื้องต้น..."></textarea>
				</div>

				{#if formType === 'news'}
					{#if editingItem?.link && editingItem.link !== '#'}
						<p class="current-doc">
							เอกสารปัจจุบัน:
							<a href={editingItem.link} target="_blank" rel="noopener noreferrer">เปิดดู ↗</a>
						</p>
					{/if}

					<div class="form-group">
						<label for="modal-pdf-file">ไฟล์ PDF (อัปโหลดจากเครื่อง)</label>
						<input type="file" id="modal-pdf-file" accept=".pdf,application/pdf" on:change={handlePdf}>
						<p class="field-hint">PDF สูงสุด {MAX_PDF_MB} MB — ส่งไป Vercel Blob หรือบันทึกลง static ใน dev</p>
					</div>

					<div class="form-group">
						<label for="modal-link-doc">หรือ ลิงก์เอกสาร (Google Drive)</label>
						<input type="url" id="modal-link-doc" bind:value={link} placeholder="https://drive.google.com/file/d/.../view">
						<p class="field-hint">อัป PDF ขึ้น Google Drive แล้ววางลิงก์แชร์ที่นี่ — ใช้ลิงก์เดียวกันกับ cnt.go.th ได้</p>
					</div>
				{:else}
					<div class="form-group">
						<label for="modal-link-extra">ลิงก์เพิ่มเติม (ถ้ามี)</label>
						<input type="text" id="modal-link-extra" bind:value={link} placeholder="เช่น ลิงก์ Facebook หรือ Google Drive">
					</div>

					<div class="form-group">
						<label for="modal-file">รูปภาพ (อัปโหลดจากเครื่อง)</label>
						<input type="file" id="modal-file" accept="image/*" on:change={handleFileChange}>
						<p class="field-hint">รูปสูงสุด {MAX_IMAGE_MB} MB — ส่งไป Vercel Blob หรือใช้ URL ด้านล่าง</p>
					</div>
				{/if}

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
					<div class="status-box" role="status" aria-live="polite" aria-label={statusAriaLabel(statusMessage)} class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
						{statusMessage}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="btn-cancel" on:click={closeEditModal}>ยกเลิก</button>
				<button class="btn-save" on:click={saveItem} disabled={loading}>
					{loading ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if collectionModalOpen}
	<div class="modal-backdrop" on:click={closeCollectionModal} role="presentation">
		<div
			class="modal-content"
			bind:this={collectionModalEl}
			on:click|stopPropagation
			on:keydown={onCollectionModalKeydown}
			tabindex="-1"
			role="dialog"
			aria-modal="true"
			aria-labelledby="collection-modal-title"
		>
			<div class="modal-header">
				<h3 id="collection-modal-title">
					{collectionEditing ? '📝 แก้ไข' : '➕ เพิ่มใหม่'}
					({listTypes.find((t) => t.id === activeTab)?.name})
				</h3>
				<button class="close-btn" on:click={closeCollectionModal} aria-label="ปิดหน้าต่าง">&times;</button>
			</div>

			<div class="modal-body">
				{#if activeTab === 'personnel'}
					<div class="form-group">
						<label for="c-name">ชื่อ-นามสกุล</label>
						<input type="text" id="c-name" bind:value={cName} maxlength="120" placeholder="กรอกชื่อ-นามสกุล...">
					</div>
					<div class="form-group">
						<label for="c-position">ตำแหน่ง</label>
						<input type="text" id="c-position" bind:value={cPosition} placeholder="ตำแหน่ง">
					</div>
					<div class="form-group">
						<label for="c-phone">เบอร์โทร</label>
						<input type="text" id="c-phone" bind:value={cPhone} placeholder="เบอร์โทร">
					</div>
					<div class="form-group">
						<label for="c-image-file">รูปภาพ (อัปโหลดจากเครื่อง)</label>
						<input type="file" id="c-image-file" accept="image/*" on:change={handleCImage}>
						<p class="field-hint">รูปสูงสุด {MAX_IMAGE_MB} MB — ส่งไป Vercel Blob</p>
					</div>
					<div class="form-group">
						<label for="c-image">หรือใส่ลิงก์/พาธรูป (ถ้าไม่อัปโหลด)</label>
						<input type="text" id="c-image" bind:value={cImage} placeholder="URL หรือ path ของรูป">
					</div>
				{:else}
					<div class="form-group">
						<label for="c-title">หัวข้อ / ชื่อเอกสาร</label>
						<input type="text" id="c-title" bind:value={cTitle} maxlength="200" placeholder="กรอกหัวข้อ...">
					</div>
					{#if collectionEditing?.link && collectionEditing.link !== '#'}
						<p class="current-doc">
							เอกสารปัจจุบัน:
							<a href={collectionEditing.link} target="_blank" rel="noopener noreferrer">เปิดดู ↗</a>
						</p>
					{/if}
					<div class="form-group">
						<label for="c-link">ลิงก์เอกสาร (Google Drive)</label>
						<input type="url" id="c-link" bind:value={cLink} placeholder="https://drive.google.com/file/d/.../view">
						<p class="field-hint">อัป PDF ขึ้น Google Drive แล้ววางลิงก์แชร์ที่นี่ — ใช้ลิงก์เดียวกันกับ cnt.go.th ได้</p>
					</div>
				{/if}

				{#if statusMessage}
					<div class="status-box" role="status" aria-live="polite" aria-label={statusAriaLabel(statusMessage)} class:error={statusMessage.includes('❌')} class:success={statusMessage.includes('✅')}>
						{statusMessage}
					</div>
				{/if}
			</div>

			<div class="modal-footer">
				<button class="btn-cancel" on:click={closeCollectionModal}>ยกเลิก</button>
				<button class="btn-save" on:click={saveCollectionItem} disabled={loading}>
					{loading ? 'กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showCertModal}
	<div class="modal-backdrop" on:click={closeCertModal} role="presentation">
		<div
			class="modal-content"
			style="max-width: 520px;"
			on:click|stopPropagation
			role="dialog"
			aria-modal="true"
		>
			<div class="modal-header">
				<h3>{certModalTitle}</h3>
				<button class="close-btn" type="button" on:click={closeCertModal} aria-label="ปิดหน้าต่าง">&times;</button>
			</div>
			<form on:submit|preventDefault={submitCertForm}>
				<div class="modal-body">
					<div class="form-group">
						<label for="modal-cert-name">ชื่อ-สกุล <span style="color:red;">*</span></label>
						<input type="text" id="modal-cert-name" bind:value={certFormName} required placeholder="เช่น นายสมชาย ใจดี">
					</div>
					<div class="form-group">
						<div class="field-label-row">
							<label for="modal-cert-course">หลักสูตร / โครงการ <span style="color:red;">*</span></label>
							<button type="button" class="btn-toggle-custom" on:click={() => { isCustomCourse = !isCustomCourse; if (isCustomCourse) certFormCourse = ''; }}>
								{isCustomCourse ? '📋 เลือกจากรายการ' : '➕ อื่นๆ (พิมพ์เอง)'}
							</button>
						</div>
						{#if !isCustomCourse}
							<select
								id="modal-cert-course"
								bind:value={certFormCourse}
								on:change={(e) => {
									if (e.currentTarget.value === '__custom__') {
										isCustomCourse = true;
										certFormCourse = '';
									}
								}}
								required
							>
								<option value="">-- เลือกหลักสูตร --</option>
								{#each certCourses as course}
									<option value={course}>{course}</option>
								{/each}
								<option value="__custom__">➕ อื่นๆ (พิมพ์ระบุเอง)...</option>
							</select>
						{:else}
							<input
								type="text"
								id="modal-cert-course"
								bind:value={certFormCourse}
								required
								placeholder="พิมพ์ชื่อหลักสูตรใหม่..."
							/>
						{/if}
					</div>
					<div class="form-row" style="gap: 1rem;">
						<div class="form-group">
							<div class="field-label-row">
								<label for="modal-cert-year">ปี พ.ศ.</label>
								<button type="button" class="btn-toggle-custom" on:click={() => { isCustomYear = !isCustomYear; if (isCustomYear) certFormYear = ''; }}>
									{isCustomYear ? '📋 เลือก' : '➕ อื่นๆ'}
								</button>
							</div>
							{#if !isCustomYear}
								<select
									id="modal-cert-year"
									bind:value={certFormYear}
									on:change={(e) => {
										if (e.currentTarget.value === '__custom__') {
											isCustomYear = true;
											certFormYear = '';
										}
									}}
								>
									<option value="">-- เลือกปี พ.ศ. --</option>
									{#each certYears as year}
										<option value={year}>{year}</option>
									{/each}
									<option value="__custom__">➕ อื่นๆ (พิมพ์เอง)...</option>
								</select>
							{:else}
								<input
									type="text"
									id="modal-cert-year"
									bind:value={certFormYear}
									placeholder="เช่น 2569"
								/>
							{/if}
						</div>
						<div class="form-group">
							<div class="field-label-row">
								<label for="modal-cert-type">ประเภท</label>
								<button type="button" class="btn-toggle-custom" on:click={() => { isCustomType = !isCustomType; if (isCustomType) certFormType = ''; }}>
									{isCustomType ? '📋 เลือก' : '➕ อื่นๆ'}
								</button>
							</div>
							{#if !isCustomType}
								<select
									id="modal-cert-type"
									bind:value={certFormType}
									on:change={(e) => {
										if (e.currentTarget.value === '__custom__') {
											isCustomType = true;
											certFormType = '';
										}
									}}
								>
									<option value="">-- เลือกประเภท --</option>
									{#each certTypes as type}
										<option value={type}>{type}</option>
									{/each}
									<option value="__custom__">➕ อื่นๆ (พิมพ์เอง)...</option>
								</select>
							{:else}
								<input
									type="text"
									id="modal-cert-type"
									bind:value={certFormType}
									placeholder="เช่น ผู้ผ่านการอบรม, วิทยากร"
								/>
							{/if}
						</div>
					</div>
					<div class="form-group">
						<label for="modal-cert-link">ลิงก์ Google Drive / PDF</label>
						<input type="url" id="modal-cert-link" bind:value={certFormLink} placeholder="https://drive.google.com/file/d/.../view?usp=sharing">
						<p class="field-hint">วางลิงก์ View หรือ Share จาก Google Drive ได้โดยตรง</p>
					</div>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn-cancel" on:click={closeCertModal}>ยกเลิก</button>
					<button type="submit" class="btn-save" disabled={certActionLoading}>
						{certActionLoading ? '⏳ กำลังบันทึกลง Sheet...' : '💾 บันทึกข้อมูล'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.admin-layout,
	.modal-backdrop {
		--primary: var(--primary-purple);
		--primary-dark: var(--primary-purple-dark);
		--bg-admin: #f4f7f6;
		--border: var(--border-neutral);
		--text-main: var(--text-dark);
		--text-muted: var(--text-gray);
		--bg-card: var(--white);
		--bg-input: var(--white);
		--ink-on-primary: var(--text-on-primary);
		--state-error: var(--color-error);
		--state-error-bg: var(--color-error-bg);
		--state-success: var(--color-success);
		--state-success-bg: var(--color-success-bg);
		--state-warning: var(--color-warning);
		--state-warning-bg: var(--color-warning-bg);
		--shadow-admin: var(--shadow);
	}

	:global(body.dark-mode) .admin-layout,
	:global(body.dark-mode) .modal-backdrop {
		--bg-admin: #121212;
		--bg-card: #1e1e1e;
		--bg-input: #2d2d2d;
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
		box-shadow: 0 2px 10px var(--shadow-admin);
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
		color: var(--state-error);
		border: 1px solid var(--state-error);
		text-decoration: none;
	}

	.admin-logout-btn:hover {
		background: var(--state-error);
		color: var(--ink-on-primary);
	}

	.admin-data-hint {
		margin: 1rem 0;
		padding: 0.85rem 1rem;
		border-radius: 8px;
		background: var(--state-warning-bg);
		color: var(--state-warning);
		border: 1px solid color-mix(in srgb, var(--state-warning) 35%, transparent);
		font-size: 0.95rem;
		line-height: 1.5;
	}

	.dirty-badge {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--state-warning);
		background: var(--state-warning-bg);
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
		width: var(--tap-size);
		height: var(--tap-size);
		min-width: var(--tap-size);
		min-height: var(--tap-size);
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
		color: var(--ink-on-primary);
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

	.banner-config .banner-help {
		color: var(--text-muted);
		margin: 0 0 1.25rem;
		line-height: 1.6;
	}

	.banner-preview-wrap {
		margin: 0 0 1.5rem;
		padding: 0.75rem;
		background: var(--bg-input);
		border: 1px solid var(--border);
		border-radius: 8px;
		max-height: 220px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.banner-preview-img {
		display: block;
		max-width: 100%;
		max-height: 200px;
		width: auto;
		height: auto;
		object-fit: contain;
	}

	.banner-url-input {
		width: 100%;
		padding: 0.8rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		font-family: inherit;
		background: var(--bg-input);
		color: var(--text-main);
		min-height: 44px;
		box-sizing: border-box;
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
		color: var(--ink-on-primary);
	}

	.cert-test-result {
		margin-top: 1rem;
		font-weight: 600;
	}

	.success-text {
		color: var(--state-success);
	}

	.error-text {
		color: var(--state-error);
	}

	.admin-nav {
		background: var(--primary);
		padding: 0.5rem 0;
		position: sticky;
		top: 0;
		z-index: var(--z-sticky);
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
		color: var(--on-primary-muted);
		padding: 0.6rem 1rem;
		font-weight: 600;
		cursor: pointer;
		border-radius: 6px;
		transition: color 0.2s var(--ease-out), background 0.2s var(--ease-out);
		font-size: 0.9rem;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.admin-nav button:hover, .admin-nav button.active {
		color: var(--ink-on-primary);
		background: var(--on-primary-hover-bg);
	}

	@media (prefers-reduced-motion: reduce) {
		.admin-nav button {
			transition: none;
		}

		.admin-layout {
			transition: none;
		}
	}

	@media (min-width: 1100px) {
		.admin-nav .container {
			flex-wrap: nowrap;
			overflow-x: auto;
			justify-content: flex-start;
			max-width: 100%;
		}

		.admin-nav button {
			flex: 0 0 auto;
			white-space: nowrap;
		}
	}

	@media (min-width: 1300px) {
		.admin-nav .container {
			overflow-x: visible;
			justify-content: center;
			max-width: 1400px;
		}
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
		color: var(--ink-on-primary);
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
		box-shadow: 0 2px 5px var(--shadow-admin);
		border: 1px solid var(--border);
		content-visibility: auto;
		contain-intrinsic-size: auto 120px;
	}

	.drag-handle {
		flex-shrink: 0;
		cursor: grab;
		user-select: none;
		border: none;
		background: transparent;
		color: var(--text-muted);
		font-size: 1.25rem;
		line-height: 1;
		padding: 0.35rem 0.25rem;
		min-width: 28px;
		min-height: 44px;
	}

	.drag-handle:active {
		cursor: grabbing;
	}

	.list-edit-row .drag-handle {
		margin-right: 0.25rem;
	}

	.item-img img {
		width: 100px;
		height: 70px;
		object-fit: cover;
		border-radius: 6px;
		background: var(--bg-input);
	}

	.item-img--portrait {
		flex-shrink: 0;
	}

	.item-img--portrait img {
		width: 72px;
		height: 96px;
		object-fit: cover;
		object-position: top center;
	}

	.item-doc {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		width: 100px;
		height: 70px;
		border-radius: 6px;
		background: var(--bg-input);
		border: 1px solid var(--border);
		flex-shrink: 0;
	}

	.doc-icon {
		font-size: 1.75rem;
		line-height: 1;
	}

	.doc-label {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--primary);
		margin-top: 0.25rem;
	}

	.item-no-doc {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.current-doc {
		font-size: 0.9rem;
		margin: 0 0 0.75rem;
		color: var(--text-muted);
	}

	.current-doc a {
		color: var(--primary);
		font-weight: 600;
	}

	.field-hint {
		margin: 0.35rem 0 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.item-info {
		flex: 1;
		min-width: 0;
	}

	.item-info h3 {
		margin: 0 0 0.4rem;
		font-size: 1.1rem;
		color: var(--text-main);
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		word-break: break-word;
	}

	.item-meta {
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.item-actions {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-shrink: 0;
	}

	.tab-header .actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
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
		color: var(--ink-on-primary);
	}

	.btn-delete {
		background: transparent;
		border: 1px solid var(--state-error);
		color: var(--state-error);
		padding: 0.5rem 1rem;
		border-radius: 6px;
		cursor: pointer;
		min-height: 44px;
		min-width: 80px;
	}

	.btn-delete:hover {
		background: var(--state-error);
		color: var(--ink-on-primary);
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: var(--overlay-backdrop);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: var(--z-modal-backdrop, 300);
	}

	.modal-content {
		background: var(--bg-card);
		width: 95%;
		max-width: 600px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: var(--shadow-elevated);
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

	.field-label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}

	.field-label-row label {
		margin-bottom: 0;
	}

	.btn-toggle-custom {
		background: none;
		border: 1px solid var(--border);
		color: var(--primary);
		font-size: 0.8rem;
		cursor: pointer;
		padding: 2px 8px;
		border-radius: 4px;
		font-weight: 600;
		font-family: inherit;
		min-height: unset;
		width: auto;
		transition: all 0.2s ease;
	}

	.btn-toggle-custom:hover {
		background: rgba(156, 39, 176, 0.08);
		border-color: var(--primary);
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
		color: var(--ink-on-primary);
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
		background: var(--state-success);
		color: var(--ink-on-primary);
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

	.status-box.success {
		background: var(--state-success-bg);
		color: var(--state-success);
	}

	.status-box.error {
		background: var(--state-error-bg);
		color: var(--state-error);
	}

	.list-editor {
		background: var(--bg-card);
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 10px var(--shadow-admin);
		border: 1px solid var(--border);
	}

	.list-edit-row {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.8rem;
		border-bottom: 1px solid var(--border);
		content-visibility: auto;
		contain-intrinsic-size: auto 72px;
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
		background: var(--state-error);
		color: var(--ink-on-primary);
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

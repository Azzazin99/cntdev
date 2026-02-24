/**
 * main.js - สคริปต์หลักสำหรับทำงานทุกหน้า
 * ทำหน้าที่:
 * 1. สร้างเมนูนำทาง (Navigation) อัตโนมัติ
 * 2. โหลดข้อมูลจาก data.js ไปแสดงในแต่ละหน้า
 */

// =========================================================
// Initialization
// =========================================================

// --- Dictionary for Translation ---
const I18N = {
  th: {
    header_th: "กลุ่มพัฒนาครูและบุคลากรทางการศึกษา",
    header_en: "Teacher and Educational Personnel Development Group",
    nav_home: "หน้าหลัก",
    nav_auth: "อำนาจหน้าที่",
    nav_manual: "คู่มือการปฏิบัติงาน",
    nav_knowledge: "คลังความรู้",
    nav_plan: "แผนพัฒนาครู",
    nav_news: "ข่าวประชาสัมพันธ์",
    nav_activities: "ภาพกิจกรรม",
    nav_personnel: "บุคลากร",
    nav_forms: "แบบฟอร์ม",

    // Sections
    sec_news: "📰 ข่าวประชาสัมพันธ์ล่าสุด",
    sec_banner: "เว็บไซต์กลุ่มบริหารงานบุคคล",


    // Buttons
    btn_view_all_news: "ดูข่าวทั้งหมด",
    btn_view: "👁️ เปิดอ่าน",
    btn_download: "⬇️ ดาวน์โหลด",

    // Footer & Sidebar
    footer_dept: "กลุ่มพัฒนาครูและบุคลากรทางการศึกษา",
    footer_addr: "ถนนวิเชียรปราการ ตำบลในเมือง อำเภอเมือง จังหวัดชัยนาท 17000",
    footer_tel: "โทรศัพท์ : 056-411639 ต่อ 11",
    footer_copyright: "© 2025 กลุ่มพัฒนาครูและบุคลากรทางการศึกษา สพป.ชัยนาท",

    sidebar_registry: "ระบบทะเบียนประวัติ",
    sidebar_cert: "คลังเกียรติบัตร",
    sidebar_cert_sub: "รวบรวมรางวัลและผลงาน",
    sidebar_knowledge: "คลังความรู้",
    sidebar_knowledge_sub: "สื่อการสอนและเอกสาร"
  },
  en: {
    header_th: "Teacher Development Group",
    header_en: "Chainat Primary Educational Service Area Office",
    nav_home: "Home",
    nav_auth: "Authority",
    nav_manual: "Manuals",
    nav_knowledge: "Knowledge Base",
    nav_plan: "Dev Plans",
    nav_news: "News",
    nav_activities: "Activities",
    nav_personnel: "Personnel",
    nav_forms: "Forms",

    // Sections
    sec_news: "📰 Latest News",
    sec_banner: "Personnel Administration Group",


    // Buttons
    btn_view_all_news: "View All News",
    btn_view: "👁️ View",
    btn_download: "⬇️ Download",

    // Footer & Sidebar
    footer_dept: "Teacher and Educational Personnel Development Group",
    footer_addr: "Wichian Prakan Rd, Nai Mueang, Mueang Chainat, Chainat 17000",
    footer_tel: "Tel: 056-411639 ext 11",
    footer_copyright: "© 2025 Teacher Development Group, Chainat PEC",

    sidebar_registry: "Registry System",
    sidebar_cert: "Certificate Bank",
    sidebar_cert_sub: "Awards & Achievements",
    sidebar_knowledge: "Knowledge Bank",
    sidebar_knowledge_sub: "Teaching Media & Documents"
  }
};

let currentLang = 'th'; // Default to Thai fixed
let currentTheme = localStorage.getItem('site_theme') || 'light';

// Apply saved settings immediately
if (currentTheme === 'dark') document.body.classList.add('dark-mode');

// 1. Load Common Components (Header/Footer)
document.addEventListener('DOMContentLoaded', async () => {
  await loadComponents();

  try {
    // 2. Load Data (Manuals, Plans, Forms, Personnel)
    // NEWS is now fetched from Firestore (async) if available

    // Helper to fetch News (Cloud -> Fallback JSON)
    async function fetchNewsData() {
      let items = [];
      // Try Cloud First
      if (typeof db !== 'undefined') {
        try {
          const snap = await db.collection('news').get();
          snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
          // console.log("News loaded from Firestore via main.js");
          return items;
        } catch (e) {
          console.error("Firestore News Fetch Error:", e);
          // Fallback below
        }
      }

      // Fallback or if SDK missing
      try {
        const res = await fetch('assets/data/news.json').catch(e => null);
        if (res && res.ok) items = await res.json();
      } catch (e) { console.error("JSON Fallback Error:", e); }

      return items;
    }

    // Helper to fetch Generic Lists from Firestore 'site_data' collection
    async function fetchSiteList(key) {
      let items = [];
      // Try Cloud First
      if (typeof db !== 'undefined') {
        try {
          const doc = await db.collection('site_data').doc(key).get();
          if (doc.exists) {
            const data = doc.data();
            if (data.items && Array.isArray(data.items)) {
              // console.log(`Loaded ${key} from Firestore`);
              return data.items;
            }
          }
        } catch (e) {
          console.warn(`Firestore ${key} Error (using fallback):`, e);
        }
      }

      // Fallback to JSON
      try {
        const res = await fetch(`assets/data/${key}.json`).catch(e => null);
        if (res && res.ok) items = await res.json();
      } catch (e) { console.error(`JSON ${key} Fallback Error:`, e); }

      return items;
    }

    // For Manuals/Others (Now Hybrid: Cloud -> JSON)


    const [newsData, manualsData, knowledgeData, plansData, formsData, personnelData] = await Promise.all([
      fetchNewsData(),
      fetchSiteList('manuals'),
      fetchSiteList('knowledge'),
      fetchSiteList('plans'),
      fetchSiteList('forms'),
      fetchSiteList('personnel')
    ]);

    // Static Navigation Data
    const navItems = [
      { text: "หน้าหลัก", link: "index.html" },
      { text: "อำนาจหน้าที่", link: "authority.html" },
      { text: "คู่มือการปฏิบัติงาน", link: "manual.html" },
      { text: "คลังความรู้", link: "knowledge.html" },
      { text: "แผนพัฒนาครู", link: "plan.html" },
      { text: "ข่าวประชาสัมพันธ์", link: "news.html" },
      { text: "ภาพกิจกรรม", link: "activities.html" },
      { text: "บุคลากร", link: "users.html" },
      { text: "แบบฟอร์ม", link: "forms.html" }
    ];

    // Parse JSON
    const SITE_DATA = {
      nav: navItems,
      news: newsData,
      manuals: manualsData,
      knowledge: knowledgeData,
      plans: plansData,
      forms: formsData,
      personnel: personnelData,
    };

    // Make global
    window.SITE_DATA = SITE_DATA;

    // Sort News (if loaded)
    if (SITE_DATA.news && SITE_DATA.news.length > 0) {
      SITE_DATA.news.sort((a, b) => {
        // Simple Sort helper
        function parseDate(str) {
          if (!str) return 0;
          const p = str.split(' ');
          if (p.length < 3) return 0;
          const thMonths = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
          return new Date(parseInt(p[2]) - 543, thMonths.indexOf(p[1]), parseInt(p[0])).getTime();
        }
        const dateA = a.sortOrder || parseDate(a.date);
        const dateB = b.sortOrder || parseDate(b.date);
        return dateB - dateA;
      });
    }

    // 4. Dispatch Event "DataLoaded"
    const event = new Event('site-data-loaded');
    document.dispatchEvent(event);

    // 5. Render Widgets (if on Homepage)
    if (document.getElementById('latest-news-list')) {
      renderLatestNewsWidget();
    }

  } catch (error) {
    console.warn("Data loading error (using fallbacks):", error);
  }

  // 3. Render Dynamic Content (AFTER components are loaded)
  renderNavigation();
  renderContent();
  renderLogos();
});

// =========================================================



// Function to load Header/Footer components
async function loadComponents() {
  try {
    // Load Header
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (headerPlaceholder) {
      const headerRes = await fetch('assets/components/header.html');
      if (headerRes.ok) {
        headerPlaceholder.innerHTML = await headerRes.text();

        // 4.1 Inject Toggle Switch if not present
        // (REMOVED: Reverting to native header.html structure)


      }
    }

    // Load Footer
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
      const footerRes = await fetch('assets/components/footer.html');
      if (footerRes.ok) {
        footerPlaceholder.innerHTML = await footerRes.text();
      }
    }
  } catch (e) {
    console.error("Error loading components:", e);
  }
}

// =========================================================
// 8. แสดงโลโก้หน่วยงานภายนอก (Simple Style)
// =========================================================
function renderLogos() {
  const logoContainers = document.querySelectorAll('.logo-grid');
  if (logoContainers.length > 0 && SITE_DATA.logos) {
    const logoHTML = SITE_DATA.logos.map(logo => `
            <a href="${logo.link}" target="_blank" class="logo-link" title="${logo.title}">
                <img src="${logo.image}" alt="${logo.title}">
            </a>
        `).join('');

    logoContainers.forEach(container => {
      container.innerHTML = logoHTML;
    });
  }
}

// ฟังก์ชันสร้างเมนูนำทาง
function renderNavigation() {
  const navContainer = document.querySelector('.nav-menu');

  if (navContainer && SITE_DATA.nav) {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    navContainer.innerHTML = SITE_DATA.nav.map(item => {
      const isActive = currentPage === item.link ? 'active' : '';

      // Determine key for translation (simple mapping based on link or text)
      let label = item.text;
      if (currentLang === 'en') {
        if (item.link === 'index.html') label = I18N.en.nav_home;
        else if (item.link === 'authority.html') label = I18N.en.nav_auth;
        else if (item.link === 'manual.html') label = I18N.en.nav_manual;
        else if (item.link === 'knowledge.html') label = I18N.en.nav_knowledge;
        else if (item.link === 'plan.html') label = I18N.en.nav_plan;
        else if (item.link === 'news.html') label = I18N.en.nav_news;
        else if (item.link === 'activities.html') label = I18N.en.nav_activities;
        else if (item.link === 'users.html') label = I18N.en.nav_personnel;
        else if (item.link === 'forms.html') label = I18N.en.nav_forms;
      }

      return `<li><a href="${item.link}" class="nav-link ${isActive}">${label}</a></li>`;
    }).join('');

    // Add Theme Toggle Button
    const toggleBtn = document.createElement('li');
    toggleBtn.innerHTML = `<button onclick="toggleTheme()" style="background:none; border:none; cursor:pointer; font-size:1.2rem; margin-left:10px;">${currentTheme === 'dark' ? '☀️' : '🌙'}</button>`;
    navContainer.appendChild(toggleBtn);
  }
}

// Function to Toggle Theme
window.toggleTheme = function () { // Expose to window for onclick
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  currentTheme = isDark ? 'dark' : 'light';
  localStorage.setItem('site_theme', currentTheme);

  // Update Button Icon
  renderNavigation(); // Re-render to update icon
}

// ฟังก์ชันโหลดเนื้อหาตามหน้า
function renderContent() {
  // 1. หน้า News (Home) - แสดงแค่ 3 ข่าวล่าสุด (Top 3 Newest)
  const homeNewsContainer = document.getElementById('news-container');
  if (homeNewsContainer && SITE_DATA.news) {
    // Slice top 3 (already sorted newest first)
    homeNewsContainer.innerHTML = SITE_DATA.news.slice(0, 3).map(news => `
            <a href="#" onclick="openPopup('${news.link}'); return false;" class="news-link-item">
                <div class="news-link-date">📅 ${news.date}</div>
                <div class="news-link-title">${news.title}</div>
            </a>
        `).join('');
  }

  // 1.5 หน้า News (All) - แสดงทั้งหมด (Newest First)
  // 1.5 หน้า News (All) - Logic removal:
  // Render handled individually by news.html and activities.html inline scripts to allow custom layouts.


  // 2. หน้า Personnel (Org Chart Layout)
  const userContainer = document.getElementById('personnel-container');
  if (userContainer && SITE_DATA.personnel) {
    // Override container class for Org Chart
    userContainer.className = 'org-chart-container';

    // Sort by ID to ensure order (1=Director, 2=Deputy) or preserve JSON order
    // Assuming JSON is ordered Top -> Bottom

    userContainer.innerHTML = SITE_DATA.personnel.map(person => `
            <div class="org-connector">
                <div class="org-card">
                    <div class="org-img-wrapper">
                        <img src="${person.image}" alt="${person.name}" class="org-img">
                    </div>
                    <div class="org-info">
                        <h3 class="org-name">${person.name}</h3>
                        <div class="org-position">${person.position}</div>
                        <div class="org-phone">📞 ${person.phone}</div>
                    </div>
                </div>
            </div>
        `).join('');
  }

  // 3. หน้า Forms
  const formContainer = document.getElementById('forms-container');
  if (formContainer && SITE_DATA.forms) {
    formContainer.innerHTML = SITE_DATA.forms.map((form, index) => `
            <div class="doc-item" style="border-left-color: #ff9800;"> <!-- Orange accent for forms -->
              <div class="doc-icon">📝</div>
              <div class="doc-info">
                <div class="doc-title">${index + 1}. ${form.title || form.name}</div> 
                <!-- Support both title (new) and name (legacy) just in case -->
              </div>
              <div class="doc-actions">
                  <a href="#" onclick="openPopup('${form.link}'); return false;" class="btn-view">
                      ${I18N[currentLang].btn_view}
                  </a>
                  <a href="${convertDriveLink(form.link)}" target="_blank" class="btn-download">
                      ${I18N[currentLang].btn_download}
                  </a>
              </div>
            </div>
        `).join('');
  }



  // 4. หน้า Authority (อำนาจหน้าที่)
  const authContainer = document.getElementById('authority-list');
  if (authContainer && SITE_DATA.authority) {
    authContainer.innerHTML = SITE_DATA.authority.map(item => `
            <li class="auth-item">
                <span class="auth-icon">✅</span>
                <span>${item}</span>
            </li>
        `).join('');
  }

  // 4.5. หน้า Knowledge (คลังความรู้)
  const knowledgeContainer = document.getElementById('knowledge-container');
  if (knowledgeContainer && SITE_DATA.knowledge) {
    knowledgeContainer.innerHTML = SITE_DATA.knowledge.map((item, index) => `
            <div class="doc-item" style="border-left-color: #9c27b0;"> <!-- Purple accent for knowledge -->
              <div class="doc-icon">📚</div>
              <div class="doc-info">
                <div class="doc-title">${index + 1}. ${item.title}</div>
              </div>
              <div class="doc-actions">
                  <a href="#" onclick="openPopup('${item.link}'); return false;" class="btn-view">
                       ${I18N[currentLang].btn_view}
                  </a>
                  <a href="${convertDriveLink(item.link)}" target="_blank" class="btn-download">
                       ${I18N[currentLang].btn_download}
                  </a>
              </div>
            </div>
        `).join('');
  }

  // 5. หน้า Manual (คู่มือการปฏิบัติงาน)
  const manualContainer = document.getElementById('manual-container');
  if (manualContainer && SITE_DATA.manuals) {
    manualContainer.innerHTML = SITE_DATA.manuals.map((item, index) => `
            <div class="doc-item">
              <div class="doc-icon">📘</div>
              <div class="doc-info">
                <div class="doc-title">${index + 1}. ${item.title}</div>
              </div>
              <div class="doc-actions">
                  <a href="#" onclick="openPopup('${item.link}'); return false;" class="btn-view">
                       ${I18N[currentLang].btn_view}
                  </a>
                  <a href="${convertDriveLink(item.link)}" target="_blank" class="btn-download">
                       ${I18N[currentLang].btn_download}
                  </a>
              </div>
            </div>
        `).join('');
  }

  // 6. หน้า Plan (แผนพัฒนาครู)
  const planContainer = document.getElementById('plan-container');
  if (planContainer && SITE_DATA.plans) {
    planContainer.innerHTML = SITE_DATA.plans.map((item, index) => `
            <div class="doc-item" style="border-left-color: #e91e63;"> <!-- Pink accent for plans -->
              <div class="doc-icon">📈</div>
              <div class="doc-info">
                <div class="doc-title">${item.title}</div>
              </div>
              <div class="doc-actions">
                  <a href="#" onclick="openPopup('${item.link}'); return false;" class="btn-view">
                       ${I18N[currentLang].btn_view}
                  </a>
                  <a href="${convertDriveLink(item.link)}" target="_blank" class="btn-download">
                       ${I18N[currentLang].btn_download}
                  </a>
              </div>
            </div>
        `).join('');
  }

  // 7. หน้า News Detail
  const newsDetailContainer = document.getElementById('news-detail-content');
  if (newsDetailContainer && SITE_DATA.news) {
    const urlParams = new URLSearchParams(window.location.search);
    const newsId = parseInt(urlParams.get('id'));

    const newsItem = SITE_DATA.news.find(item => item.id === newsId);

    if (newsItem) {
      // 1. Set current gallery context globally for navigation
      currentGalleryImages = [newsItem.image]; // Start with main image
      if (newsItem.gallery && newsItem.gallery.length > 0) {
        currentGalleryImages = currentGalleryImages.concat(newsItem.gallery);
      }

      // Initialize Lightbox
      initLightbox();

      // Prepare Gallery HTML
      let galleryHTML = '';
      if (newsItem.gallery && newsItem.gallery.length > 0) {
        galleryHTML = `
                <div class="news-gallery-section" style="margin-top: 3rem; border-top: 1px solid #eee; padding-top: 2rem;">
                    <div class="gallery-header">
                        <h3 style="margin-bottom: 0px; font-size: 1.5rem; color: var(--primary-purple);">📸 ภาพกิจกรรม</h3>
                        <button id="btn-download-all" class="btn-download-all" onclick="downloadGalleryAsZip(${newsId})">
                            📦 ดาวน์โหลดรูปทั้งหมด (.zip)
                        </button>
                    </div>
                    <div class="news-gallery-grid">
                        ${newsItem.gallery.map((img, idx) => `
                            <!-- Index is idx + 1 because 0 is main image -->
                            <div class="news-gallery-item" onclick="openLightbox(${idx + 1})">
                                <img src="${img}" alt="ภาพกิจกรรม">
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
      }

      newsDetailContainer.innerHTML = `
            <article class="news-article">
                ${!newsItem.facebookLink ? `
                <header class="article-header" style="margin-bottom: 2rem;">
                    <h1 class="article-title" style="font-size: 2rem; color: var(--primary-purple); margin-bottom: 0.5rem;">${newsItem.title}</h1>
                    <div class="article-meta" style="color: var(--text-gray); font-size: 1rem;">
                        <span>📅 ${newsItem.date}</span>
                    </div>
                </header>
                
                <figure class="article-image" style="margin-bottom: 2rem; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px var(--shadow);">
                    <img src="${newsItem.image}" alt="${newsItem.title}" style="width: 100%; height: auto; display: block; cursor: pointer;" onclick="openLightbox(0)">
                </figure>
                ` : ''}
                
                <!-- Content Section: Show only if NO Facebook Link, or if specifically populated -->
                ${!newsItem.facebookLink ? `
                    <div class="article-content" style="font-size: 1.1rem; line-height: 1.8; color: var(--text-dark);">
                        ${newsItem.content || '<p>ไม่มีเนื้อหาข่าวละเอียด</p>'}
                    </div>
                ` : ''}

                ${newsItem.facebookLink ? `
                    <!-- Facebook Embed -->
                    <div class="facebook-embed-container" style="margin-top: 1rem; text-align: center;">
                         <div class="fb-post" data-href="${newsItem.facebookLink}" data-width="750" data-show-text="true"></div>
                         <div style="margin-top:1rem; color:#888; font-size:0.9rem;">
                            <a href="${newsItem.facebookLink}" target="_blank">ดูโพสต์ต้นฉบับบน Facebook ↗</a>
                         </div>
                    </div>
                ` : galleryHTML}
            </article>
      `;

      // Update Page Title
      document.title = `${newsItem.title} - กลุ่มพัฒนาครูฯ`;

      // Load Facebook SDK if needed
      if (newsItem.facebookLink) {
        if (!document.getElementById('fb-root')) {
          const fbRoot = document.createElement('div');
          fbRoot.id = 'fb-root';
          document.body.prepend(fbRoot);

          const script = document.createElement('script');
          script.async = true;
          script.defer = true;
          script.crossOrigin = "anonymous";
          script.src = "https://connect.facebook.net/th_TH/sdk.js#xfbml=1&version=v18.0";
          script.nonce = "xyz123"; // optional
          document.body.appendChild(script);
        } else if (window.FB) {
          window.FB.XFBML.parse(); // Re-parse if already loaded
        }
      }
    } else {
      newsDetailContainer.innerHTML = `
            <div style="text-align: center; padding: 4rem 1rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">❌</div>
                <h2>ไม่พบข่าวที่คุณต้องการ</h2>
                <p>ข่าวอาจถูกลบหรือย้ายไปแล้ว</p>
                <a href="news.html" class="btn-download" style="margin-top: 1rem; display: inline-block;">กลับไปหน้าข่าวสาร</a>
            </div>
      `;
    }
  }
}

// ===================================
// Lightbox & Gallery Utils
// ===================================

let currentGalleryImages = [];
let currentImageIndex = 0;

// 1. Initialize Lightbox in DOM
function initLightbox() {
  if (!document.getElementById('lightbox-modal')) {
    const lightboxHTML = `
            <div id="lightbox-modal" class="lightbox-modal">
                <div class="lightbox-close" onclick="closeLightbox()">&times;</div>
                <button class="lightbox-prev" onclick="changeSlide(-1)">&#10094;</button>
                <button class="lightbox-next" onclick="changeSlide(1)">&#10095;</button>
                <div class="lightbox-content-wrapper">
                    <img id="lightbox-img" class="lightbox-img" src="" alt="Fullscreen Image">
                </div>
                <div class="lightbox-actions">
                    <a id="lightbox-download-btn" href="#" download class="btn-lightbox">${I18N[currentLang].btn_download}รูปนี้</a>
                    <button onclick="closeLightbox()" class="btn-lightbox">❌ ปิด</button>
                    <span id="lightbox-counter" style="color:white; margin-left:15px; font-size:0.9rem;"></span>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML('beforeend', lightboxHTML);
  }
}

// 2. Open Lightbox
function openLightbox(index) {
  initLightbox(); // Ensure HTML exists

  if (index >= 0 && index < currentGalleryImages.length) {
    currentImageIndex = index;
    updateLightboxImage();

    const modal = document.getElementById('lightbox-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scrolling
  }
}

// 3. Update Image Display
function updateLightboxImage() {
  const img = document.getElementById('lightbox-img');
  const downloadBtn = document.getElementById('lightbox-download-btn');
  const counter = document.getElementById('lightbox-counter');
  const imgSrc = currentGalleryImages[currentImageIndex];

  // Slight fade effect
  img.style.opacity = 0;
  setTimeout(() => {
    img.src = imgSrc;
    img.style.opacity = 1;
  }, 100);

  // Download Logic
  downloadBtn.href = imgSrc;
  const filename = imgSrc.split('/').pop();
  downloadBtn.setAttribute('download', filename);
  downloadBtn.setAttribute('target', '_blank'); // Fallback for some browsers

  if (counter) counter.innerText = `${currentImageIndex + 1} / ${currentGalleryImages.length}`;
}

// 4. Change Slide (Next/Prev)
function changeSlide(n) {
  let newIndex = currentImageIndex + n;

  // Loop around
  if (newIndex >= currentGalleryImages.length) newIndex = 0;
  if (newIndex < 0) newIndex = currentGalleryImages.length - 1;

  currentImageIndex = newIndex;
  updateLightboxImage();
}

// 5. Close Lightbox
function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// 6. Download All Images as ZIP
async function downloadGalleryAsZip(newsId) {
  const newsItem = SITE_DATA.news.find(item => item.id === newsId);
  if (!newsItem || !newsItem.gallery || newsItem.gallery.length === 0) return;

  const btn = document.getElementById('btn-download-all');

  // UI Feedback
  const originalText = btn.innerHTML;
  btn.innerHTML = '⏳ กำลังเตรียมไฟล์...';
  btn.style.pointerEvents = 'none';

  try {
    const zip = new JSZip();
    const folder = zip.folder(`gallery-${newsId}`);

    const promises = newsItem.gallery.map(async (url, index) => {
      // Create a new image to load content if fetch fails? No, need blobs.
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        const blob = await response.blob();
        const ext = url.split('.').pop() || 'jpg';
        const filename = `image-${index + 1}.${ext}`;
        folder.file(filename, blob);
      } catch (fetchErr) {
        console.warn(`Failed to fetch ${url}:`, fetchErr);
        // If fetch fails on file protocol, we can't easily zip it client side without canvas hacks.
        throw new Error("Local file access restriction");
      }
    });

    await Promise.all(promises);

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `activity-${newsId}-images.zip`);

  } catch (err) {
    console.error("Download failed", err);
    if (err.message.includes("Local file")) {
      alert("⚠️ ขออภัย: ฟังก์ชัน 'ดาวน์โหลด ZIP' ไม่สามารถทำงานได้เมื่อเปิดไฟล์โดยตรง (file://)\n\nกรุณาใช้การดาวน์โหลดทีละรูป หรือเปิดผ่าน Local Server (เช่น VS Code Live Server)");
    } else {
      alert("เกิดข้อผิดพลาดในการดาวน์โหลด: " + err.message);
    }
  } finally {
    btn.innerHTML = originalText;
    btn.style.pointerEvents = 'auto';
  }
}

// Event Listeners
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('lightbox-modal');
  // Only trigger if lightbox is open
  if (modal && modal.classList.contains('active')) {
    if (e.key === 'ArrowLeft') changeSlide(-1);
    if (e.key === 'ArrowRight') changeSlide(1);
    if (e.key === 'Escape') closeLightbox();
  }
});

document.addEventListener('click', (e) => {
  if (e.target.id === 'lightbox-modal') {
    closeLightbox();
  }
});

// =========================================================
// Helper Functions
// =========================================================

/**
 * Converts a standard Google Drive View URL to a Direct Download URL
 * Input: https://drive.google.com/file/d/123456.../view
 * Output: https://drive.google.com/uc?export=download&id=123456...
 */
function convertDriveLink(url) {
  if (!url) return '#';
  try {
    // Extract File ID
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  } catch (e) {
    console.warn("Could not convert Drive Link:", url);
  }
  return url; // Fallback to original
}

/**
 * Opens a centered popup window for document viewing
 */
function openPopup(url) {
  const width = 1000;
  const height = 800;
  const left = (screen.width - width) / 2;
  const top = (screen.height - height) / 2;

  window.open(
    url,
    'DocumentView',
    `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes`
  );
}

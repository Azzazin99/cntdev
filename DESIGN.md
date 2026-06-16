---
title: cntdev — กลุ่มพัฒนาครู สพป.ชัยนาท
description: พอร์ทัลข่าวและเอกสารครูไทย — ม่วงองค์กร อ่านง่าย น่าเชื่อถือ
---

## Overview

**Scene:** *พอร์ทัลการศึกษาไทยที่อบอุ่นและเป็นทางการ — เส้นทางสีม่วงชี้ครูไปยังข่าว เอกสาร และเกียรติบัตร โดยไม่รู้สึกเหมือนเทมเพลต SaaS ทั่วไป*

ระบบภาพรวมมาจาก `src/app.css` (หน้าสาธารณะ) และ scoped styles ใน `src/routes/admin/+page.svelte` (แผง admin). โทน: พื้นหลังเทาอ่อน, การ์ดขาว, accent ม่วง `#7b1fa2`, ฟอนต์ **Sarabun** จาก Google Fonts (`src/app.html`). Layout หลัก: sticky nav + `container` (max 1200px) + `grid-layout` (main + sidebar 320px) บนหน้าแรก; แตกคอลัมนเดียวที่ ≤768px.

**Color strategy (identity preservation):** ใช้กลยุทธ์ **Committed** บม่วงองค์กรที่มีอยู่ — ไม่รัน `palette.mjs` เพื่อแทนที่แบรนด์. ขยายความ contrast และ dark-mode tokens รอบ `#7b1fa2` / `#6a1b9a` / `#f3e5f5` แทนการเปลี่ยน hue. Admin ใช้ชุดเดียวกัน (`--primary: #7b1fa2`) บนพื้น `#f4f7f6`.

**Dev:** `npm run dev` → `http://localhost:6395` (see `vite.config.js`).

### Known audit backlog (from codebase scan)

| Issue | Where | Notes |
|-------|-------|-------|
| **Side-tab borders** | ~~`.news-link-item`, `.doc-item`, timeline~~ | **Resolved (quieter pass):** 1px `--border-subtle` แทน `border-left: 4px` |
| **Missing public `<h1>`** | ~~Public routes use `h2.section-title` only~~ | **Resolved (typeset pass):** `h1.page-title` ต่อหน้า; หน้าแรกใช้ `h1.sr-only` |
| **Timeline dark mode** | ~~`.timeline-dot`, `.timeline-content`~~ | **Resolved (quieter pass):** ใช้ `var(--white)` แล้ว |
| **Hardcoded neutrals** | ~~`.btn-download`, certificates blue buttons~~ | **Resolved (colorize pass):** semantic tokens `--btn-*`, `--color-*`, purple-tinted `--bg-gray` |
| **Image lazy loading** | ~~No `loading="lazy"` on images~~ | **Resolved (polish pass):** below-fold images lazy-loaded |
| **Focus indicators** | ~~Missing on many controls~~ | **Resolved (polish pass):** global `:focus-visible` ring |
| **Admin modal a11y** | ~~Missing aria-labelledby, focus on open~~ | **Resolved (polish pass):** labels, Thai close label, auto-focus |
| **Admin error handling** | ~~Raw fetch + alert~~ | **Resolved (harden pass):** `fetchAdminJson` ทุก mutation, 401 → login, focus trap |
| **Nav layout animation** | ~~`transition: width` on underline~~ | **Resolved (optimize pass):** `transform: scaleX` |
| **Admin scoped colors** | ~~Hardcoded `#f44336`, `#4caf50`~~ | **Resolved (P2 pass):** `--state-*` aliases จาก global tokens |
| **Long list perf** | ~~No virtualization~~ | **Resolved (P2 pass):** `content-visibility: auto` บน admin items + cert rows |
| **Pagination touch targets** | ~~36px page buttons in certificates~~ | **Resolved (P3 pass):** shared `.pagination` / `.page-btn` ใน `app.css` — `--tap-size` 44px |
| **Admin long lists** | ~~Render all rows~~ | **Resolved (P3 pass):** pagination 25 รายการ/หน้า (ข่าว, กิจกรรม, เอกสาร) |
| **LCP banner** | ~~No fetch priority~~ | **Resolved (P3 pass):** `fetchpriority="high"` บน header banner |
| **Lightbox hardcoded white** | ~~`color: white`~~ | **Resolved (P3 pass):** `var(--text-on-primary)` |
| **Admin dark cards** | ~~White cards in dark mode~~ | **Resolved (P3 pass):** scope `--bg-card` บน `.admin-layout` + `.modal-backdrop` |
| **Reduced motion (admin)** | ~~Nav transitions always on~~ | **Resolved (P3 pass):** `prefers-reduced-motion` บน admin nav |

**Deferred (manual / future):** Lighthouse บน production URL, ทดบนมือถือจริง, virtual scroll ถ้ารายการ >500 แถวและยังช้า

## Colors

| Role | Light | Dark (`body.dark-mode`) |
|------|-------|-------------------------|
| Primary | `#7b1fa2` | `#ce93d8` |
| Primary deep | `#6a1b9a` | `#ab47bc` |
| Primary tint | `#f3e5f5` | `rgba(206,147,216,0.14)` |
| Text | `#333333` / `#5f6368` | `#e8eaed` / `#b8bcc2` |
| Background | `#f6f4f8` | `#1a1620` |
| Surface (cards) | `#ffffff` | `#2d2e31` |
| Shadow | `rgba(51,33,68,0.08)` | `rgba(0,0,0,0.35)` |

**Character:** *Royal Thai education purple* — ไม่ neon ไม่ pastel ทั้งหน้า; ม่วงใช้กับหัวข้อ section, nav active, เส้น timeline, และปุ่ม `btn-view`.

**Admin-only:** `--bg-admin: #f4f7f6`, borders `#e0e0e0`, success `#2e7d32`, error `#c62828`. Dark mode: tokens scoped บน `.admin-layout` (ไม่ inherit จาก `:root` `--white` โดยตรง)

## Typography

- **Family:** Sarabun 300–700 (loaded in `app.html`); single-family hierarchy via weight + scale
- **Scale (CSS tokens):** `--text-xs` (0.8125rem) → `--text-2xl` (clamp 1.375–1.75rem); ratio ~1.25 between steps
- **Page title:** `.page-title` / `h1` — fluid `--text-2xl`, weight 700, `text-wrap: balance`
- **Section title:** `.section-title` / `h2` — `--text-xl`, weight 600 (home page sections)
- **Body:** `--text-base` / `--leading-normal` (1.6); dark mode `--leading-relaxed` (1.7)
- **Metadata:** `--text-sm` for dates; `--text-lg` + weight 600 for list titles (`news-link-title`, `doc-title`)
- **Prose:** `.prose` caps measure at `65ch`, `text-wrap: pretty`
- **Nav:** `clamp(0.85rem, 1.1vw, 0.95rem)` with underline grow on hover
- **ไทย:** หลีกเลี่ยงการย่อข้อความสำคัญ; ใช้ `.ui-ellipsis` เฉพาะ metadata

## Elevation

Flat-to-lifted: การ์ดใช้ `box-shadow: 0 2px 4px var(--shadow)` หรือ `0 2px 8px`; hover มัก `translateY(-5px)` หรือ `translateX(5px)` + shadow เพิ่ม. ไม่มี elevation scale เป็นขั้น — ควรค่อยๆ ทำให้สม่ำเสมอเมื่อ refactor side-tabs.

## Components

| Component | Pattern |
|-----------|---------|
| **Sticky nav** | `.sticky-nav` white surface, shadow, active link purple + 2px bottom bar |
| **Section title** | Purple, flex + emoji prefix บางหน้า |
| **News/doc list item** | White card, 1px `--border-subtle` border, hover shadow (no side-tab) |
| **Timeline** | Vertical line `primary-purple-light`, dot + content card on `var(--white)` |
| **Activity card** | 12px radius, purple-tint border, image top |
| **Sidebar cards** | Icon + title stack, hover lift |
| **Buttons** | `btn-view` (purple tint), `btn-download` (white/gray outline), `btn-download-all` (#6c5ce7 — secondary accent, consider aligning to primary) |
| **Admin** | Purple sticky tab bar, white header card, forms with `--bg-input`, modals, collection tables |
| **Theme toggle** | `.theme-toggle` in header — toggles `body.dark-mode` |

**Touch:** `--tap-size: 44px`, `.ui-tap` helper.

## Do's and Don'ts

**Do**

- ใช้ CSS variables จาก `:root` / `body.dark-mode` สำหรับทุก surface และ border
- รักษา `#7b1fa2` เป็น primary; ปรับ contrast และ focus ก่อนเปลี่ยนสี
- ใส่ `<h1>` หนึ่งต่อหน้าสาธารณะ (อาจ visually integrated กับ banner)
- ทดสอบ dark mode บน timeline, การ์ดข่าว, และ admin forms
- ใช้ Sarabun และภาษาไทยเต็มประโยคในป้ายปุ่ม

**Don't**

- รัน `palette.mjs` เพื่อแทนที่แบรนด์ม่วงโดยไม่ได้รับอนุมัติชัด
- เพิ่ม `border-left` หนาเป็น accent หลัก (side-tab anti-pattern)
- Hardcode `white` / `#ffffff` ใน component ที่ต้องรองรับ dark mode
- นำ aesthetic landing SaaS (hero gradient, Inter, bento เกินจำเป็น) มาที่พอร์ทัลราชการ
- ลืมแยก register: หน้าสาธารณะ = brand, `/admin` = product (density และ error states สำคัญกว่า wow-factor)

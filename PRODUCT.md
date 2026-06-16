# Product

## Register

brand

> **Per-task override:** Public pages (`/`, `/news`, `/activities`, document libraries, certificates) use **brand** register. `/admin`, `/login`, and CRUD workflows use **product** register — design serves the task, not the impression.

## Users

- **Primary:** ครูและบุคลากรทางการศึกษาในเขตพื้นที่การศึกษาประถมศึกษาชัยนาท (สพป.ชัยนาท) และผู้สนใจข่าว/เอกสารของกลุ่มพัฒนาครูและบุคลากรทางการศึกษา
- **Context:** เข้าเว็บจากโรงเรียน/สำนักงานเขต มักใช้มือถือหรือเดสก์ท็อประหว่างงาน ต้องการข่าว ภาพกิจกรรม คู่มือ แผน แบบฟอร์ม คลังความรู้ หรือค้นหาเกียรติบัตรอย่างรวดเร็ว
- **Secondary:** ผู้ดูแลระบบ (admin/editor) ที่อัปเดตเนื้อหาผ่าน `/admin` หลัง login + Turnstile

## Product Purpose

เว็บไซต์กลางของกลุ่มพัฒนาครูและบุคลากรทางการศึกษา สพป.ชัยนาท — รวมข่าวประชาสัมพันธ์ ภาพกิจกรรม เอกสาร PDF (คู่มือ แผน แบบฟอร์ม คลังความรู้) อำนาจหน้าที่ บุคลากร และคลังเกียรติบัตร (เชื่อม Google Sheets) ในที่เดียว

**ความสำเร็จ:** ผู้ใช้พบข้อมูลล่าสุดได้ภายในไม่กี่คลิก เอกสารเปิดได้ชัดเจน ภาษาไทยอ่านง่าย ความน่าเชื่อถือระดับหน่วยงานราชการ และ admin อัปโหลด/แก้ไขได้โดยไม่พึ่ง developer

**สแต็ก:** SvelteKit บน Vercel · ข้อมูล production ที่ Firebase Firestore + Storage · dev ที่ `http://localhost:6395` · fallback JSON ใน `static/assets/data/` เมื่อไม่มี Firebase

## Brand Personality

- **สามคำ:** เป็นทางการ · อบอุ่น · ชัดเจน
- **โทน:** ภาษาไทยตรงไปตรงมา ไม่โฆษณาเกินจริง ไม่ startup-casual — เหมาะกับหน่วยงานการศึกษาไทย
- **อารมณ์ที่ต้องการ:** ความไว้วางใจ ความเป็นระเบียบ การเข้าถึงข้อมูลราชการที่ไม่น่ากลัวหรือล้าสมัย
- **อ้างอิงจิตใจ (ไม่ใช่คัดลอก UI):** พอร์ทัลหน่วยงาน สพฐ./เขตพื้นที่ที่อ่านง่าย + สีม่วงองค์กรที่จำได้ ไม่ใช่ landing SaaS หรือ dashboard fintech

## Anti-references

- Landing page สไตล์ AI (gradient hero, Inter, glassmorphism, generic "modern" cards)
- แอป admin แบบ enterprise เย็นชา (dense tables, gray-only chrome) บนหน้าสาธารณะ
- ข้อความภาษาอังกฤษหรือ jargon โดยไม่จำเป็น
- ทำลายอัตลักษณ์ม่วง `#7b1fa2` ที่ผู้ใช้คุ้นเคย — ไม่เปลี่ยนแบรนด์เพื่อ "สดใหม่" โดยไม่มีเหตุผล

## Design Principles

1. **ข้อมูลก่อนตกแต่ง** — ข่าว เอกสาร และลิงก์ภายนอกต้องเด่นกว่า motion หรือเอฟเฟกต์
2. **ความน่าเชื่อถือของหน่วยงาน** — layout สะอาด อ่านได้บนมือถือ ไม่เล่น visual risk ที่ทำให้ดูไม่เป็นทางการ
3. **ภาษาไทยเป็นหลัก** — `lang="th"`, ฟอนต์ Sarabun, หัวข้อและปุ่มชัด ไม่ย่อหรือซ่อนข้อมูลสำคัญ
4. **รักษาอัตลักษณ์ม่วง** — สีและโทนเดิมคือ anchor; ปรับปรุง hierarchy และ a11y ไม่ใช่ rebrand
5. **แยก register ตามพื้นที่** — หน้าสาธารณะสื่อสารและชวนอ่าน; admin เน้น workflow CRUD ความชัดของสถานะและข้อผิดพลาด

## Accessibility & Inclusion

- เป้าหมาย **WCAG 2.1 Level AA** สำหรับหน้าสาธารณะ (คอนทราสต์ข้อความ/ปุ่ม, focus ที่มองเห็น, ป้ายกำกับฟอร์ม admin/login)
- รองรับ **dark mode** ที่มีอยู่ (`body.dark-mode`) — ทุก component ต้องใช้ CSS variables ไม่ hardcode `#ffffff` / `white`
- **Reduced motion:** เคารพ `prefers-reduced-motion` เมื่อเพิ่ม animation ใหม่
- เป้าหมายแตะ **44px** สำหรับ interactive targets (`--tap-size` ใน `src/app.css`)
- เอกสาร PDF/รูป: มี alt text และ aria-label ที่มีความหมาย (โดยเฉพาะการ์ดกิจกรรมและปุ่มเปิดเอกสาร)

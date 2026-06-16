# cntdev

เว็บไซต์กลุ่มพัฒนาครูและบุคลากรทางการศึกษา สพป.ชัยนาท — เนื้อหาสาธารณะอ่านจาก API; ผู้ดูแลแก้ผ่านหน้า admin

## Language

### เนื้อหาและที่เก็บข้อมูล

**ContentStore**:
ชุดเนื้อหาที่ admin แก้ได้แยกตามแท็บ (ข่าว, กิจกรรม, คู่มือ, บุคลากร ฯลฯ) — แต่ละชุดมี API และรูปแบบรายการของตัวเอง
_Avoid_: database, collection (เมื่อพูดกับผู้ใช้งานทั่วไป)

**Metadata hub**:
ที่เก็บหัวข้อ วันที่ ลำดับ และลิงก์อ้างอิงของแต่ละรายการ — บน production อยู่ที่ Firebase Firestore; ใน dev ที่ไม่มี credentials ใช้ JSON แทน
_Avoid_: database เดียว, single store (ระบบยังมีที่เก็บไฟล์แยก)

**Dev fallback**:
ไฟล์ JSON ใน `static/assets/data/` ที่ใช้แทน Firestore เมื่อไม่ได้ตั้งค่า Firebase ในเครื่องพัฒนา
_Avoid_: production database, backup ถาวร

**Item collection**:
รายการเนื้อหาแบบทีละรายการ — เพิ่ม แก้ ลบผ่าน modal ใน admin (ข่าว, คู่มือ, บุคลากร ฯลฯ)
_Avoid_: list, bulk save

**Bulk list**:
รายการเนื้อหาแบบบันทึกทั้งก้อนในครั้งเดียว (เช่น อำนาจหน้าที่) — ไม่มี modal ต่อรายการ
_Avoid_: item collection, CRUD ทีละรายการ

### ไฟล์และลิงก์ภายนอก

**Document link**:
URL ของเอกสาร PDF ที่เก็บใน field `link` — สำหรับข่าวอาจเป็น URL จาก Vercel Blob หรือลิงก์แชร์ Google Drive; คู่มือ/ความรู้/แผน/แบบฟอร์มยังใช้ Drive เป็นหลัก
_Avoid_: database, file storage (เมื่อพูดถึง metadata)

**News PDF upload**:
การอัปโหลด PDF ข่าวจาก admin — client upload ไป Vercel Blob (สูงสุด 20 MB) หรือ multipart fallback ลง `static/assets/documents/news/` ใน dev
_Avoid_: document link (เมื่อหมายถึงกระบวนการอัปโหลด)

**Image asset**:
ไฟล์รูปที่อัปผ่าน admin สำหรับกิจกรรมหรือบุคลากร — เก็บบน Vercel Blob บน production
_Avoid_: document, PDF, Drive link

**Certificate sheet**:
Google Sheets ที่หน้าคลังเกียรติบัตรอ่านเป็น CSV — admin เก็บเฉพาะ `sheetUrl` ใน metadata; ข้อมูลเกียรติบัตรจริงอยู่ใน Sheet
_Avoid_: Firestore records, certificate database

### คำที่มักสับสน

**Firestore**:
ที่เก็บ metadata หลักบน production — ไม่ใช่ที่เก็บไฟล์ PDF หรือรูปโดยตรง (ยกเว้น legacy)
_Avoid_: ที่เก็บไฟล์ทั้งหมด, database เดียวของเว็บ

**External file source**:
ที่เก็บไฟล์หรือข้อมูลจริงนอก metadata hub — Vercel Blob (PDF ข่าว + รูป), Google Drive (PDF อื่นๆ), Google Sheets (เกียรติบัตร)
_Avoid_: database, ContentStore

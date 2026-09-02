# ADR-0001: Full page reload on logout

## Status

Accepted

## Context

เมนู "ออกจากระบบ" บน navbar อ่านจาก `data.user` ของ root layout (`+layout.server.js`). หลัง logout แบบ client navigation (ลิงก์ `/logout` → redirect ไป `/`) SvelteKit ไม่รัน layout load ใหม่ — cookie ถูกลบแล้วแต่ UI ยังคิดว่า login อยู่ จึงค้างเมนู "ออกจากระบบ" จนกว่าจะ hard refresh

## Decision

ลิงก์ออกจากระบบใส่ `data-sveltekit-reload` เพื่อบังคับโหลดหน้าเต็ม หลัง redirect layout อ่าน session ใหม่แล้วแสดง "เข้าสู่ระบบ"

ตัวเลือก cookie ตอน set (login) กับ delete (logout) ใช้ helper เดียวกัน (`sessionCookie.js`)

## Consequences

- Logout ไม่ใช่ SPA navigation ล้วน ๆ (ยอมรับได้ — เกิดน้อยครั้ง)
- ไม่ต้องพึ่ง `invalidateAll` จาก client หลัง GET redirect

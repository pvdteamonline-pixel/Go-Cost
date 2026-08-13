#Go-Cost

### 📄 File: `.gitignore`
```text
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local
.env
.env.*
!.env.example

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

.vercel

```

---

### 📄 File: `.oxlintrc.json`
```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}

```

---

### 📄 File: `index.html`
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>GoCost (คุมค่าใช้จ่าย)</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>

```

---

### 📄 File: `package.json`
```json
{
  "name": "gocost-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.110.1",
    "date-fns": "^4.4.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "jspdf-autotable": "^5.0.8",
    "papaparse": "^5.5.4",
    "react": "^19.2.7",
    "react-dom": "^19.2.7",
    "react-router-dom": "^7.18.1",
    "recharts": "^3.9.2",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.3.2",
    "@types/react": "^19.2.17",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.3",
    "oxlint": "^1.71.0",
    "tailwindcss": "^4.3.2",
    "vite": "^8.1.1"
  }
}

```

---

### 📄 File: `README.md`
```md
# GoCost (คุมค่าใช้จ่าย) — React + Supabase

พอร์ตจากระบบเดิมที่รันบน Google Apps Script (`Code.js` + `index.html`) มาเป็น
Vite + React + Tailwind v4 + Supabase ตามที่ตั้งใจไว้ว่าจะ deploy บน Vercel

## สถานะปัจจุบัน — เฟส 1-4 (+3b, 3c) เสร็จเต็ม, เฟส 5 เริ่มแล้วบางส่วน (5a), เฟส 6 ยังไม่เริ่ม

**ทำงานได้จริงและทดสอบ build ผ่านแล้ว:**
- ระบบ Login (bcrypt ผ่าน RPC `login_user` — ไม่มี password หลุดมาถึง client)
- **บันทึกค่าใช้จ่าย** — validation ครบตาม `saveExpenseData()` เดิม, ออกเลขที่เอกสารอัตโนมัติ
- **แดชบอร์ด** — filter (เดือนภาษาไทย) + กราฟวงกลม/แท่ง + รายได้ + dropdown เลือกโหมด (ทั้งหมด/เฉพาะค่าใช้จ่าย/เฉพาะ Workshop)
- **ประวัติรายการ** — ดู/ขอแก้ไข/ขอลบ (workflow ต้องรอผู้มีสิทธิ์อนุมัติ)
- **คำขออนุมัติแก้ไข/ลบ**
- **การแจ้งเตือน** (กระดิ่งมุมขวาบน) — poll ทุก 30 วิ
- **จัดการผู้ใช้งาน** — พร้อมแผงสิทธิ์การเข้าถึงหน้า/ฟีเจอร์แบบ group + role "ADMIN" แยกเดี่ยว
- **บันทึกกิจกรรม (Audit log)** — filter เดือน/ปี + โชว์ชื่อเล่น + ADMIN แก้ไข/ลบ log ได้
- **ระบบวางแผน Workshop** — สร้างคำขอ (หน้าแยก) → อนุมัติ → เซลล์กรอกข้อมูลหลังงาน (ไม่บังคับ, พร้อม preview + แนบไฟล์) → เสร็จสิ้นทันที (ไม่มีขั้นตอนบัญชีแล้ว) — แก้ไข/ลบได้ไม่จำกัดสถานะ พร้อม double-confirm, เลขเอกสาร `IV2026xxxxxx`
- **จัดการร้านค้า** — CRUD เต็มรูปแบบ
- **จัดการรหัสบัญชี** (เฟส 5a ใหม่ล่าสุด) — CRUD เต็มรูปแบบ + นำเข้า/ตรวจจับรหัสใหม่จากไฟล์ CSV
- Theme: minimal glassmorphism โทนสว่างแบบ Apple Store

**ยังไม่ทำ:**
- **เฟส 5 ส่วนที่เหลือ** — ผูก parser เฉพาะของไฟล์ Express/Bluenote เข้ากับกลไกตรวจจับรหัสใหม่ที่มีอยู่แล้ว + ตั้งงบ (BG) + Dashboard ฝ่ายบริหารตามรหัสบัญชี — **ยังรอไฟล์ตัวอย่าง Express/Bluenote จริง** (มีแค่ผังบัญชีแล้ว)
- **เฟส 6** — Reset password OTP, Export PDF/Excel

## เฟส 3b: ระบบสิทธิ์การเข้าถึงหน้า/ฟีเจอร์ (ใหม่ล่าสุด)

**หลักการ:**
- เพิ่มคอลัมน์ `page_permissions` (jsonb array) ในตาราง `users` — เก็บรายชื่อ "หน้า/ฟีเจอร์" ที่ user คนนั้นเข้าถึงได้
- ผู้ใช้ที่มี **role = "ผู้บริหาร"** (แมปกับคำว่า "ADMIN" ที่คุณใช้ในบทสนทนา — **ถ้าหมายถึง role อื่น บอกได้เลย จะแก้ mapping ให้**) เข้าถึงได้ทุกหน้าเสมอโดยอัตโนมัติ ไม่ขึ้นกับ `page_permissions` เพื่อกันการล็อกตัวเองออกจากระบบโดยไม่ตั้งใจ
- เฉพาะ role "ผู้บริหาร" เท่านั้นที่แก้ไขสิทธิ์ของคนอื่นได้ (เช็คฝั่ง server ใน `update_user_permissions`)
- หลังบันทึก ผู้ใช้ที่ถูกแก้ไขจะได้รับแจ้งเตือนทางกระดิ่งทันที สรุปว่า "ได้รับสิทธิ์เข้าถึง: ..." / "ถูกปิดสิทธิ์: ..."
- หน้า "จัดการผู้ใช้งาน" ตอนนี้บังคับกรอก **ชื่อเล่น** และ **ชื่อ-นามสกุลจริง** ทั้งคู่ (เดิมมีคอลัมน์นี้อยู่แล้วในฐานข้อมูล แค่ยังไม่ได้บังคับกรอก) เพื่อใช้เป็นหลักฐานว่าใครบันทึกอะไรตอนดึงข้อมูลออกไปใช้งานจริง

**Security hardening ที่แถมมาด้วย (พบระหว่างทำเฟสนี้):** `save_user`, `delete_user`, `get_audit_logs`, `get_pending_requests`, และฟังก์ชันอนุมัติทั้งหมด **ไม่เคยเช็คสิทธิ์ผู้เรียกฝั่ง server เลยตั้งแต่เฟส 2-3** (พึ่งพาแค่การซ่อนปุ่มฝั่ง frontend) — ปิดช่องโหว่นี้ให้แล้วในไฟล์ `phase3b_permissions.sql` ทุกฟังก์ชันตอนนี้เช็คสิทธิ์จริงก่อนทำงานเสมอ

## รัน SQL (ทำตามลำดับ ครั้งเดียวตอน setup — ห้ามสลับลำดับ)

1. `supabase/schema.sql`
2. `supabase/phase2_workflow.sql`
3. `supabase/phase3_notifications_users.sql`
4. `supabase/phase3b_permissions.sql`
5. `supabase/phase3c_admin_role.sql` (สร้างบัญชี ADMIN/ADMIN1234 ให้อัตโนมัติในตัว — เปลี่ยนรหัสผ่านทันทีหลัง login ครั้งแรก)
6. `supabase/phase4a_stores.sql`
7. `supabase/phase4a_stores_seed.sql` (นำเข้าร้านค้า 482 ร้านจากไฟล์ที่คุณส่งมา)
8. `supabase/phase4b_workshop.sql` (สร้าง Storage bucket `workshop-attachments` ให้อัตโนมัติในตัวด้วย)
9. `supabase/phase4c_dashboard_income_fix.sql`
10. `supabase/phase4d_defaults_and_migration.sql`
11. `supabase/phase4e_stores_crud.sql` (⚠️ ลบข้อมูลร้านค้าเดิมทั้งหมดแบบ CASCADE — ดูคำเตือนในไฟล์ก่อนรัน)
12. `supabase/phase4e_stores_seed_v2.sql` (นำเข้าร้านค้า 490 ร้านจากไฟล์ใหม่ล่าสุด พร้อมชื่อเซลล์ที่สังกัด)
13. `supabase/phase4f_fix_admin_permissions.sql` (แก้บั๊กบัญชี ADMIN ไม่เห็นเมนู Workshop)
14. `supabase/phase4g_workshop_edit_delete.sql` (เพิ่มสิทธิ์แก้ไข/ลบคำขอ Workshop ของตัวเอง)
15. `supabase/phase4h_workshop_restructure.sql` (⚠️ ปรับโครงสร้างใหญ่ — ดูรายละเอียดด้านล่าง)
16. `supabase/phase4i_audit_log_admin.sql` (filter เดือน/ปี + ชื่อเล่น + ADMIN แก้ไข/ลบ log ได้)
17. `supabase/phase4j_migrate_legacy_status.sql` (ย้าย Workshop เก่าที่ค้างสถานะออกจากระบบเดิม)
18. `supabase/phase5a_accounts.sql`
19. `supabase/phase5a_accounts_seed.sql` (นำเข้าผังบัญชีจริง 86 รหัสจากไฟล์ที่คุณส่งมา)
20. `supabase/phase5b_budgets.sql`
21. `supabase/phase5c_import_log.sql`
22. `supabase/phase5d_executive_dashboard.sql`
23. `supabase/phase5e_account_groups.sql`
24. `supabase/phase5f_account_groups_defaults.sql`
25. `supabase/phase5g_account_id_tagging.sql` (⚠️ เปลี่ยนฟอร์มบันทึกค่าใช้จ่ายให้บังคับเลือกรหัสบัญชี — ดูรายละเอียดด้านล่าง)
26. `supabase/phase5h_reports.sql`
27. `supabase/phase5i_report_refinements.sql`
28. `supabase/phase5j_account_file_import.sql`
29. `supabase/phase5k_reconciliation.sql`
30. `supabase/phase5l_group_splits.sql`
31. `supabase/phase5m_group_seed_from_pl.sql`
32. `supabase/phase5n_revert_auto_groups.sql` (⚠️ ลบกลุ่มที่สร้างอัตโนมัติในไฟล์ก่อนหน้า)
33. `supabase/phase5o_pl_file_import.sql`

## เฟส 5n: ลบกลุ่มที่สร้างอัตโนมัติ — คุณสร้างกลุ่มเอง

ตามที่ขอ — ลบกลุ่ม `GRP-01` ถึง `GRP-16` และการจัดสรรทั้งหมดที่มาพร้อมกันออกจากระบบแล้ว หน้า **"กลุ่มรหัสบัญชี"** ยังใช้งานได้ปกติทุกอย่าง (สร้างกลุ่ม, ตั้งรหัส/ชื่อเอง, เพิ่มรหัสบัญชีเข้ากลุ่ม, แบ่งสัดส่วน %) — แค่ไม่มีข้อมูลตั้งต้นแล้ว ให้สร้างเองทั้งหมดตามที่ต้องการ

## เฟส 5o: แนบไฟล์เหลือแบบเดียว "ประมาณการกำไรขาดทุน"

**เปลี่ยนจาก 2 ไฟล์แยก (งบทดลอง/รายจ่าย) เหลือ 1 ไฟล์** — หน้า "แนบไฟล์บัญชี" ตอนนี้รับไฟล์ `.xlsx` จริง (ไม่ใช่ CSV แล้ว) รูปแบบเดียวกับไฟล์ P&L ที่คุณส่งมา:
- อัปโหลดไฟล์ → เลือกชีตที่มีข้อมูล (ระบบเดาให้อัตโนมัติถ้าชื่อชีตมีคำว่า "กำไร") → กด "อ่านข้อมูลจากชีตนี้"
- ระบบหาหัวตาราง "รหัสบัญชี"/"ชื่อบัญชี" และคอลัมน์เดือน (ม.ค.-ธ.ค.) ให้อัตโนมัติ อ่านได้ทุกเดือนในไฟล์เดียวพร้อมกัน
- รองรับเครื่องหมาย `"` (ดิตโต้ — รหัสเดียวกับแถวบน) ตามรูปแบบบัญชีไทยที่พบในไฟล์จริง
- ถ้าเจอรหัสใหม่ที่ยังไม่มีในระบบ **บังคับกรอกชื่อบัญชี/หมวดหมู่/รายละเอียดให้ครบก่อนนำเข้าได้** ตามที่เคยขอไว้

**สิ่งที่ไฟล์นี้ทำ:** นำเข้า "ยอด" ต่อรหัสบัญชีต่อเดือน ใช้เทียบกับยอดที่พนักงานกรอกเองในหน้า "เทียบยอด (Reconciliation)" **ไม่เกี่ยวกับการจัดกลุ่ม** — การจัดกลุ่ม/สัดส่วนยังคงทำแยกต่างหากที่หน้า "กลุ่มรหัสบัญชี" ตามที่คุณต้องการควบคุมเอง

**ทดสอบแล้วกับไฟล์จริงที่คุณส่งมา:** จำลอง logic การอ่านไฟล์แล้วรันกับไฟล์จริง ได้ผลถูกต้อง (450 จุดข้อมูล จาก 77 รหัสที่มียอดจริงในช่วง ม.ค.-มิ.ย.)

## เฟส 5l-5m: รองรับแบ่งสัดส่วนหลายกลุ่ม + นำเข้าโครงสร้างกลุ่มจริงจากไฟล์ P&L

**เปลี่ยนสถาปัตยกรรม:** จาก "1 รหัสบัญชี = 1 กลุ่มเท่านั้น" เป็น **"1 รหัสบัญชี แบ่งสัดส่วน % อยู่ได้หลายกลุ่ม"** (ตารางใหม่ `account_group_splits`) — ทุก RPC ที่เกี่ยวข้องอัปเดตให้คูณยอดจริงด้วยสัดส่วนก่อนรวมเป็นยอดกลุ่มแล้ว รวมถึง**แยกโชว์ "ยังไม่ได้จัดสรรบางส่วน"** สำหรับรหัสที่สัดส่วนรวมไม่ถึง 100% เพื่อไม่ให้ยอดรวมขาดหายไปจากปัดเศษ/แบ่งไม่ครบ

**นำเข้าโครงสร้างจริงจากไฟล์ P&L ที่คุณส่งมาแล้ว:**
- สร้าง **16 กลุ่ม** (รหัส `GRP-01` ถึง `GRP-16` — ตั้งสั้นๆ ให้เพราะไฟล์ต้นฉบับไม่ได้มีรหัสกลุ่มเป็นตัวเลขไว้ชัดเจน **เข้าไปเปลี่ยนรหัส/ชื่อกลุ่มให้ตรงกับที่ใช้จริงได้ทุกเมื่อผ่านหน้า "กลุ่มรหัสบัญชี"**)
- จัดสรร **85 รหัสบัญชี** เข้ากลุ่มถูกต้องครบ ตรวจสอบไขว้กับข้อมูลที่นำเข้าไว้แล้วทุกตัว
- รหัส **6120-14** แบ่งสัดส่วนตามที่เลือก: **33.33% กลุ่ม "ค่าใช้จ่ายในการขาย/ฝ่ายขาย/PC"**, **66.67% กลุ่ม "ค่าใช้จ่ายในการบริหาร"**
- เหลือ **`6120-19`** ที่ไม่มีในโครงสร้าง P&L นี้ — ยังไม่มีกลุ่ม ต้องกำหนดเองถ้าต้องการ

## เฟส 5k: เทียบยอด (Reconciliation) — ตามที่เลือกไว้

หน้าใหม่ "เทียบยอด (Reconciliation)" (permission `reconciliation`) — โชว์ **ยอดที่พนักงานกรอกเอง** กับ **ยอดจากไฟล์รายจ่ายที่แนบ** เทียบข้างกันต่อรหัสบัญชี พร้อมคอลัมน์ "ผลต่าง" (สีเขียว = ตรงกัน, สีแดง + ⚠️ = ไม่ตรง) — **ข้อมูล 2 แหล่งนี้ยังคงแยกจากกันเหมือนเดิม ไม่ได้เอามารวม/แทนที่กัน** แค่เอามาวางเทียบให้เห็นง่ายขึ้นตามที่เลือกไว้

## เฟส 5i-5j: ปรับปรุงรายงานตามที่แก้ไข + แนบไฟล์บัญชี 2 ประเภท

**1. หน้า "กลุ่มรหัสบัญชี"** — เพิ่ม filter ปี/เดือน เมื่อเลือกดูกลุ่มไหน จะโชว์รูปแบบ "หมวด[ชื่อกลุ่ม] [รหัสกลุ่ม]" แล้วขึ้นบรรทัดใหม่แสดงยอดแต่ละรหัสลูกในกลุ่มนั้นตามช่วงเวลาที่เลือก (ดึงจาก `expense_records` ที่ผูก `account_id` ไว้แล้วจากเฟส 5g)

**2. "รายงานผู้บริหาร" เปลี่ยนชื่อเป็น "(สรุปตามกลุ่ม)"** — ตัดรายการย่อยระดับใบเสร็จออกตามที่ขอ เหลือแค่ยอดรวมรายกลุ่ม/รายรหัสบัญชี พร้อม filter เดือน+ปี

**3. "รายงานสำหรับกรมสรรพากร" แจกแจงละเอียดขึ้น** — เพิ่มรายการย่อยระดับใบเสร็จ (เอกสาร/วันที่/ร้าน/ยอด) ใต้แต่ละรหัสบัญชี ตามที่ขอให้ตรงข้ามกับรายงานผู้บริหาร

**4. หน้าใหม่ "แนบไฟล์บัญชี"** (permission `account-import`, ADMIN เท่านั้น default) — แยก 2 ส่วนชัดเจนตามที่ขอ:
   - **ไฟล์งบทดลอง** — สำหรับหัวหน้าฝ่ายบัญชีอัปโหลด
   - **ไฟล์รายจ่ายจริง** — ไฟล์รายจ่ายตามรหัสบัญชีจากระบบอื่น

ทั้งสองไฟล์ต้องมีคอลัมน์ "รหัสบัญชี" และ "ยอด" — ระบบนำเข้าแบบ **all-or-nothing**: ถ้าเจอรหัสที่ยังไม่มีในผังบัญชีแม้แต่ตัวเดียว จะปฏิเสธทั้งไฟล์ทันที (ไม่นำเข้าบางส่วน) ต้องไปเพิ่มรหัสที่ขาดในหน้า "จัดการรหัสบัญชี" ก่อน แล้วอัปโหลดซ้ำ — ออกแบบเข้มงวดแบบนี้เพราะย้ำไว้ว่ายอดนี้สำคัญมาก ห้ามผิดพลาด

**⚠️ จุดที่ยังไม่ได้ทำ — รอคำตอบจากคุณก่อน:** ยอดที่นำเข้าจากหน้านี้ (`account_import_lines`) ตอนนี้เก็บเป็น **ข้อมูลอ้างอิงแยกต่างหาก** ยังไม่ถูกผสมเข้ากับยอดในหน้ารายงานผู้บริหาร/กรมสรรพากร (ที่ดึงจาก `expense_records` ที่พนักงานกรอกเองประจำวัน) เพราะยังไม่รู้ว่าคุณต้องการให้ 2 แหล่งข้อมูลนี้ทำงานร่วมกันแบบไหน เช่น:
   - ใช้ไฟล์ที่นำเข้าเป็น "ยอดหลัก" แทนที่ข้อมูลพนักงานกรอกไปเลย?
   - ใช้เป็น "ยอดเทียบ" (reconciliation) โชว์ผลต่างระหว่าง 2 แหล่งให้เห็น?
   - อย่างอื่น?
   
   บอกมาได้เลยจะต่อให้ครบในเฟสถัดไป

## เฟส 5g-5h: เชื่อมรายจ่ายจริงเข้ากับรหัสบัญชี + รายงาน 2 หน้าตามที่ขอ

**ตามที่เลือกไว้ (ทางที่ 2 — เร็วกว่ารอไฟล์ Express/Bluenote):**

**1. ฟอร์ม "บันทึกค่าใช้จ่าย" และ "ขอแก้ไข" ตอนนี้บังคับเลือก "รหัสบัญชี" ทุกรายการ** (ช่องใหม่ ถัดจาก "รายละเอียด") — ทุกรายการที่บันทึกตั้งแต่รันเฟสนี้ไปจะมีรหัสบัญชีผูกอยู่แล้วโดยอัตโนมัติ ทำให้รายงาน 2 หน้าใหม่มีข้อมูลจริงให้แสดงทันที ไม่ต้องรอไฟล์ไหนอีก

**⚠️ ผลกระทบที่ต้องรู้:** พนักงานทุกคนที่บันทึก/แก้ไขค่าใช้จ่ายต้องเลือกรหัสบัญชีทุกครั้งจากนี้ไป (ตามที่คุณยืนยันไว้เอง "พนักงานต้องเลือกเองทุกครั้ง") — **ข้อมูลเก่าก่อนรันเฟสนี้ทั้งหมดจะไม่มีรหัสบัญชี** (`account_id = null`) ไม่ได้ไปแก้ข้อมูลเก่าย้อนหลังให้ เพราะไม่รู้ว่าควรผูกกับรหัสไหน — ทั้ง 2 หน้ารายงานใหม่จึงมีส่วน **"รายการที่ยังไม่ได้ระบุรหัสบัญชี"** แยกไว้ให้เห็นชัดเจน ไม่ได้ปัดตกให้หายไปเงียบๆ

**2. หน้า "รายงานผู้บริหาร (แยกรายการ)"** (permission `exec-report`) — แจกแจงทุกรายการค่าใช้จ่ายจริง แยกตาม กลุ่มแม่ → รหัสบัญชีลูก → รายการย่อยแต่ละใบ (เอกสาร/วันที่/ร้าน/ยอด) กดขยาย-ย่อดูได้ทีละรหัส พร้อมยอดรวมทุกระดับ

**3. หน้า "รายงานสำหรับกรมสรรพากร"** (permission `tax-report`, ADMIN เท่านั้น default) — งบกำไรขาดทุนแบบทางการ: รายได้รวม, รายจ่ายแยกตามหมวดหมู่บัญชี (รายได้/ค่าใช้จ่าย/อื่นๆ) พร้อมรหัสย่อยในแต่ละหมวด, กำไร/ขาดทุนสุทธิ — มีปุ่ม "พิมพ์ / บันทึกเป็น PDF" ในตัว

## เฟส 5e-5f: กลุ่มรหัสบัญชี (แม่/ลูก)

**หน้าใหม่ "กลุ่มรหัสบัญชี"** (permission `account-groups` แยกต่างหากจาก `accounts` — ตั้งใจแยกเพื่อให้มอบสิทธิ์ได้อิสระจากกัน) — สร้างกลุ่มแม่ (ตั้งรหัส+ชื่อเอง) แล้วเพิ่มรหัสบัญชีที่มีอยู่แล้วเข้าไปเป็นลูกกลุ่มได้ (1 รหัสอยู่ได้แค่ 1 กลุ่ม — ถ้าเพิ่มเข้ากลุ่มใหม่ = ย้ายออกจากกลุ่มเดิมอัตโนมัติ) หน้า "จัดการรหัสบัญชี" อัปเดตให้โชว์คอลัมน์กลุ่มด้วยแล้ว

## เฟส 5b-5d: ตั้งงบประมาณ + แดชบอร์ดฝ่ายบริหาร + ประวัติการนำเข้า

**1. หน้า "ตั้งงบประมาณ"** (permission `budgets`, ADMIN เท่านั้น default) — ตั้ง budget cap รายปีแยกตาม **7 หมวดหมู่ค่าใช้จ่าย** (MAIN_CATEGORIES ที่ใช้ในฟอร์มบันทึกค่าใช้จ่ายจริง เช่น "ค่าใช้จ่าย Partner", "ค่าใช้จ่าย Workshop")

**⚠️ จุดที่ต้องตัดสินใจแทนคุณ — ขอเล่าเหตุผล:** คุณเขียนหัวข้อว่า "ตั้งงบตามรหัสบัญชี" แต่ผังบัญชี (accounts) มีแค่ 3 หมวดกว้างๆ (รายได้/ค่าใช้จ่าย/อื่นๆ) ตั้งงบคุมระดับนั้นแทบไม่มีความหมาย จึงเลือกตั้งงบตาม **หมวดหมู่ค่าใช้จ่าย 7 หมวดที่ใช้บันทึกจริงทุกวัน** แทน (ตรงกับตัวอย่างที่เคยคุยกันไว้ตอนแรก "Content เท่าไร / Partner เท่าไร") — ถ้าจริงๆ อยากให้ตั้งงบละเอียดถึงระดับ 87 รหัสบัญชีเลย บอกได้ครับ จะปรับให้

**2. หน้า "แดชบอร์ดฝ่ายบริหาร"** (permission `exec-dashboard`, default ADMIN + ผู้บริหาร) — สรุป P&L เต็มรูปแบบ:
- การ์ดสรุป: รายได้รวม, รายจ่ายรวม, กำไร/ขาดทุนสุทธิ (เขียว = กำไร, แดง = ขาดทุน)
- กราฟแท่งเทียบ "งบ" กับ "ใช้จริง" รายหมวดหมู่
- ตารางแจกแจง: งบ, ใช้จริง, คงเหลือ, % การใช้งบ (สีเขียว <80%, เหลือง/ทอง 80-100%, แดง + ⚠️ ถ้าเกินงบ)

**⚠️ ที่มาของตัวเลข "รายได้" — สำคัญมาก:** เพราะเฟส 4h ตัดขั้นตอนบัญชีของ Workshop ออกไปแล้ว Workshop เลย**ไม่เขียนแถวลง `expense_records` อีกต่อไป** แดชบอร์ดนี้จึงดึง**รายได้จริง**จาก `workshop_plans.sales_push_amount` (ยอดขายดันเข้าร้านค้าที่เซลล์กรอก) โดยตรง ไม่ใช่จาก `expense_records` เหมือนที่เคยพยายามทำในเฟส 4c-4h — เป็นจุดที่ถูกต้องกว่าของเดิมเพราะตรงกับที่ข้อมูลจริงอยู่จริงๆ

**3. ประวัติการนำเข้า** — เพิ่มตารางในหน้า "จัดการรหัสบัญชี" (ใต้ปุ่มนำเข้าไฟล์) แสดงว่าใครนำเข้าไฟล์ชื่ออะไร เมื่อไหร่ ได้รหัสใหม่กี่รายการ ข้ามไปกี่รายการ (บันทึกทุกครั้งที่นำเข้า แม้จะไม่มีรหัสใหม่เลยก็ตาม เพื่อให้เห็นประวัติครบ)

## เฟส 5a: จัดการรหัสบัญชี (รากฐานของเฟส 5 — เริ่มแล้วบางส่วน)

**หน้าใหม่ "จัดการรหัสบัญชี"** (permission key `accounts`, default เฉพาะ ADMIN) — เพิ่ม/แก้ไข/ลบรหัสบัญชีได้เต็มรูปแบบ ค้นหาได้

**นำเข้าข้อมูลจริงแล้ว:** 86 รหัสจากไฟล์ผังบัญชีที่คุณส่งมา — **ข้าม 1 แถวที่ข้อมูลเสีย** (แถวแรกของไฟล์ รหัสบัญชีเป็นแค่เครื่องหมาย `"` ค้างอยู่ ไม่ใช่รหัสจริง) เพิ่มเองทีหลังผ่านหน้าจัดการได้ถ้าจำเป็น

**กลไก "ตรวจจับรหัสใหม่จากไฟล์แนบ" — ทำแบบทั่วไป (generic) ไว้ให้แล้ว:**
- หน้า "จัดการรหัสบัญชี" มีปุ่ม "นำเข้าจากไฟล์" — อัปโหลดไฟล์ CSV ที่มีหัวตาราง รหัสบัญชี/ชื่อบัญชี/หมวดหมู่บัญชี/รายละเอียด
- ระบบเช็คอัตโนมัติว่ารหัสไหน "ใหม่" (ยังไม่มีในระบบ) แล้วแยกเป็น 2 กลุ่ม: ข้อมูลครบ (พร้อมนำเข้าเลย) กับข้อมูลไม่ครบ
- ถ้าข้อมูลไม่ครบ **ระบบบังคับให้กรอกให้ครบทั้ง 4 ช่องก่อนถึงจะกดบันทึกได้** ตรงตามที่ขอ

**⚠️ ส่วนที่ยังทำไม่ได้ — ยังไม่มีไฟล์ตัวอย่างให้ดู:** กลไกตรวจจับรหัสใหม่ที่สร้างไว้เป็นแบบทั่วไป (รับข้อมูลรูปแบบ code/name/category/description) — **ยังไม่ได้ผูกกับไฟล์ Express หรือ Bluenote จริง** เพราะยังไม่เคยเห็นโครงสร้างคอลัมน์ของ 2 ไฟล์นั้นเลย เมื่อได้ไฟล์ตัวอย่างแล้วจะเขียน parser เฉพาะให้ดึงรหัสออกมาป้อนเข้ากลไกนี้ได้ทันที (ไม่ต้องสร้างระบบใหม่ ใช้ตัวที่มีอยู่แล้วนี้ได้เลย) — ยังต้องขอไฟล์ Express/Bluenote (หรืออย่างน้อย screenshot คอลัมน์) อยู่เหมือนเดิม

## เฟส 4h: ปรับโครงสร้าง Workshop ครั้งใหญ่

**1. แยกสิทธิ์หน้า "ขอ Workshop" เป็น 2 หน้า/2 สิทธิ์**
- **"สร้างคำขอ Workshop ใหม่"** (`workshop-plan-create`) — แค่ฟอร์มสร้างคำขอ
- **"ประวัติเสนอ Workshop"** (`workshop-plan-view`, เดิมชื่อ "ประวัติของฉัน") — ดูสถานะ + กรอกข้อมูลหลังงาน + แก้ไข/ลบ

**2. ตัดขั้นตอนบัญชีออกทั้งหมด — ลบหน้า "บัญชี Workshop รอลงข้อมูล" ทิ้งแล้ว**
Flow ใหม่: เซลล์เสนอ → ผู้บริหารอนุมัติ → สถานะ "รอเซลล์อัพเดตข้อมูล" → เซลล์กรอกข้อมูลหลังงาน (จำนวนคนเข้างาน/ยอดขายดันเข้าร้านค้า/ยอดขาย Workshop/ไฟล์แนบ — **ไม่บังคับกรอกช่องไหนเลย**) → กดยืนยัน → สถานะเป็น **"เสร็จสิ้น" ทันที** จบกระบวนการ ไม่มีขั้นตอนบัญชีมาลงข้อมูลต่ออีกแล้ว

**ผลที่ตามมาที่ต้องรู้:** เพราะไม่มีขั้นตอนบัญชีแล้ว **Workshop จะไม่สร้างรายการใน `expense_records` อีกต่อไป** (เดิมตอนบัญชียืนยันจะเติมแถว "รายได้"/"ยอดขายดันสินค้าเข้า" ให้อัตโนมัติ — ส่วนนี้ถูกตัดออกไปด้วย) ยอดขาย Workshop และยอดขายดันเข้าร้านค้าตอนนี้**อยู่ในแดชบอร์ด Workshop โดยเฉพาะเท่านั้น** ไม่ปนกับยอดใช้จ่าย/รายได้ฝั่งบัญชีอีกเลย — ตรงกับเจตนาของฟีเจอร์ dashboard แบบเลือกโหมดที่เพิ่มมาพอดี

**3. แก้ไข/ลบคำขอได้โดยไม่สนสถานะ (ตามที่ขอ)**
ตัดเงื่อนไข "ห้ามแก้ไข/ลบเมื่อเสร็จสิ้นแล้ว" ที่เคยกันไว้ในเฟส 4g ออกทั้งหมด — **ความเสี่ยง:** ตอนนี้แก้ไข/ลบ Workshop ที่ "เสร็จสิ้น" แล้วได้เลย ถ้าข้อมูลถูกแก้ย้อนหลังจะไม่มีระบบใดเตือน ให้พึ่งพา "บันทึกกิจกรรม" ในการตรวจสอบย้อนหลังแทน (ทุกการแก้ไข/ลบจะถูกบันทึก log ไว้เสมอ)

**4. เพิ่ม double-confirmation ก่อนบันทึกจริง** ทั้งตอนลบ (inline confirm bar) และตอนแก้ไข (ขั้นตอน preview → ยืนยัน) ในหน้า "ประวัติเสนอ Workshop"

**5. เลขที่เอกสารเปลี่ยนรูปแบบ**
จาก `WS`+timestamp เป็น **`IV`+ปี ค.ศ.+เลขรัน 6 หลัก** (เช่น `IV2026000001`) เรียงต่อเนื่องอัตโนมัติ รูปแบบเดียวกับ `PV` ฝั่งค่าใช้จ่าย แต่แยก sequence กันคนละชุด

## เฟส 4i: บันทึกกิจกรรม — filter เดือน/ปี, ชื่อเล่น, Admin แก้ไข/ลบได้

เพิ่ม filter ปี + เดือน (ชื่อเดือนภาษาไทย มกราคม-ธันวาคม), เพิ่มคอลัมน์ "ชื่อเล่น" ถัดจาก "ผู้ใช้" ให้รู้ตัวตนจริงง่ายขึ้น, และเฉพาะ **role ADMIN เท่านั้น** (เช็ค role ตรงๆ ไม่ผ่านระบบสิทธิ์ทั่วไป เพราะเป็นเรื่องละเอียดอ่อน) ที่แก้ไข/ลบบันทึกกิจกรรมได้ — การแก้ไข/ลบเองก็ถูกบันทึกเป็น log ใหม่ทุกครั้งเพื่อไม่ให้ประวัติการแก้ไขหายไปเงียบๆ

## แดชบอร์ด: เพิ่มโหมดเลือกมุมมอง + filter เดือนเปลี่ยนเป็นชื่อเดือนไทย

Dropdown เลือกโหมด: **"ทั้งหมด"** (โชว์ทั้งค่าใช้จ่ายและ Workshop), **"เฉพาะค่าใช้จ่าย"**, **"เฉพาะ Workshop"** (ขยายเป็นแดชบอร์ด Workshop เต็มรูปแบบ มีทั้งยอดขายรวม + จำนวนคำขอแยกตามสถานะ) — filter เดือนเปลี่ยนจาก "เดือน 1, เดือน 2..." เป็นชื่อเดือนไทยเต็ม (มกราคม-ธันวาคม)

## เฟส 4f: แก้บั๊กบัญชี ADMIN มองไม่เห็นเมนู Workshop

พบว่าตอนแยก role ADMIN ในเฟส 3c แก้ `has_page_permission` ฝั่ง server ถูกต้อง แต่**ลืมแก้ไฟล์ `src/lib/permissions.js` ฝั่ง client** ที่ใช้กรองเมนู sidebar (ยังเช็ค `role === 'ผู้บริหาร'` ค้างอยู่) — แก้ทั้ง 2 ฝั่งแล้ว พร้อม backfill สิทธิ์ครบทุก key ให้บัญชี ADMIN ทุกบัญชี **สำคัญ: หลังรัน SQL แล้วต้อง logout/login ใหม่เสมอ เพราะ `currentUser` ถูกจำไว้ใน browser ตั้งแต่ตอน login ครั้งล่าสุด ไม่รีเฟรชสิทธิ์ให้อัตโนมัติ**

## เฟส 4g: แก้ไข/ลบคำขอ Workshop (ของตัวเอง)

เพิ่ม permission key ใหม่ 2 ตัวในกลุ่ม Workshop (เห็นเฉพาะในแผงสิทธิ์ ไม่ใช่เมนู sidebar เพราะไม่ใช่ "หน้า" แต่เป็น "ความสามารถย่อย" ในหน้าเดิม):
- **`workshop-plan-edit`** — แก้ไขคำขอ Workshop ของตัวเอง (ร้าน/วันที่ ตอนยังรออนุมัติ, หรือข้อมูลหลังงานก่อนบัญชีลงบัญชีเสร็จ)
- **`workshop-plan-delete`** — ลบคำขอ Workshop ของตัวเอง (เฉพาะช่วงก่อนเข้าสู่ขั้นตอนบัญชี)

**กติกาความปลอดภัย:** แก้ไข/ลบได้เฉพาะคำขอ**ของตัวเอง**เท่านั้น แม้จะมี permission ก็ตาม (role ADMIN ยกเว้น แก้/ลบของใครก็ได้) — และห้ามแก้ไข/ลบเมื่อสถานะเป็น `completed` เด็ดขาด เพราะมีเอกสารบัญชีจริงผูกอยู่แล้ว — default: role `เซลล์` ได้ทั้ง 2 สิทธิ์นี้อัตโนมัติเหมือน `workshop-plan` เดิม role อื่นต้องให้ ADMIN มอบเอง

## เฟส 4e: แทนที่ข้อมูลร้านค้า + หน้า "จัดการร้านค้า" (CRUD เต็มรูปแบบ)

ไฟล์ที่ส่งมาล่าสุดมีคอลัมน์ **"เซลล์"** ที่ไฟล์แรกไม่มี (แก้ช่องโหว่ที่เคยแจ้งไว้ในเฟส 4) แต่ค่าที่ได้เป็น**ชื่อ label อิสระ** (เช่น `เซลล์กนก`) ไม่ใช่ user id จริง — เก็บไว้ในคอลัมน์ `assigned_sales_name` (ข้อความล้วน แก้ไขได้อิสระในหน้า "จัดการร้านค้า") แยกจาก `assigned_sales_id` (FK ไป `users.id` จริง ยังว่างอยู่ ผูกทีหลังได้ถ้าต้องการ)

**หน้า "จัดการร้านค้า" ใหม่** (permission key `stores`, default เฉพาะ ADMIN) — เพิ่ม/แก้ไข/ลบร้านค้าได้เต็มรูปแบบ, ค้นหาได้, ป้องกันการลบร้านที่มีคำขอ Workshop ผูกอยู่แล้ว

**ข้อมูลคุณภาพที่พบในไฟล์ (แจ้งไว้ตรงๆ ไม่ได้แอบแก้เอง):** มีบาง label ในคอลัมน์เซลล์ที่ดูเพี้ยน (เช่น `"เลขที่ 661/49 ถนนสุขสวัสดิ์"` แทนที่จะเป็นชื่อคน) เกิดแถวละ 1 ครั้งเท่านั้น — นำเข้ามาตามไฟล์จริงโดยไม่ได้กรองออก แก้ไขให้ถูกต้องได้เองผ่านหน้า "จัดการร้านค้า"

## หลังรัน SQL ครบ

เฟส 3c แยก role **"ADMIN"** ออกมาเป็น superuser เดี่ยวๆ ที่เข้าถึงได้ทุกอย่างเสมอ — ส่วน **"ผู้บริหาร" ไม่ใช่ auto-admin อีกต่อไป** ต้องรอ ADMIN ตั้งค่าสิทธิ์ให้ก่อนถึงจะเข้าหน้าไหนได้ (รวมถึงหน้า "จัดการผู้ใช้งาน" เองด้วย)

ไฟล์ `phase3c_admin_role.sql` **สร้างบัญชี ADMIN ตัวแรกให้อัตโนมัติแล้ว** ในตัว (`id: ADMIN`, `password: ADMIN1234`) ไม่ต้องรันคำสั่งแยกอีก — **แค่ต้อง login แล้วเปลี่ยนรหัสผ่านทันทีผ่านหน้า "จัดการผู้ใช้งาน" ก่อนใช้งานจริง** เพราะ id/password ตั้งต้นเดาง่ายมาก

## เฟส 4: ระบบวางแผน Workshop (โมเดลใหม่ทั้งหมด ไม่ได้พอร์ตจาก Apps Script เดิม)

ตามที่ออกแบบร่วมกันใหม่ทั้งหมด เพราะ flow เดิมใน Code.js ใช้งานยากและมี 2 flow ซ้อนกันจนไม่ชัดเจน — flow ใหม่มี 5 สถานะ:

```
เซลล์สร้างคำขอ → pending_approval
                    │
        ผู้มีสิทธิ์อนุมัติ (permission "workshop-approve")
           ├── ปฏิเสธ → rejected (จบ)
           └── อนุมัติ → awaiting_sales_data
                            │
                  เซลล์กรอกข้อมูลหลังงาน (จำนวนคนเข้างาน, ยอดขาย 2 ช่อง, ไฟล์แนบ)
                  มีหน้า Preview ให้ตรวจก่อนยืนยัน
                            │
                     → pending_accounting
                            │
              ผู้มีสิทธิ์ "workshop-accounting" ลงรายจ่ายจริง
              (ระบบเติมแถวรายได้ "ยอดขายดันเข้าร้านค้า" ให้อัตโนมัติ)
                            │
                       → completed (จบ กลายเป็นเอกสารใน "ประวัติรายการ")
```

**จุดสำคัญเรื่องยอดขาย 2 ช่อง (ตามที่ยืนยันแล้ว):**
- **ยอดขายดันเข้าร้านค้า** → นับเป็นรายได้บริษัทจริง เข้า `expense_records` เป็นแถว `main_category='รายได้'` อัตโนมัติตอนบัญชียืนยัน → โชว์ในแดชบอร์ดเป็น "รายได้" แยกจากยอดใช้จ่าย
- **ยอดขาย Workshop** → ยอดขายของร้านเอง ไม่นับเป็นรายได้บริษัท ไม่ถูกเก็บใน `expense_records` เลย เก็บแค่ใน `workshop_plans.workshop_sales_amount` และโชว์เป็น tile แยกต่างหากในแดชบอร์ด ไม่ปนกับยอดไหนทั้งสิ้น

**เรื่องนี้แก้บั๊กที่เคยแจ้งไว้ในเฟส 2 ไปในตัว:** ตอนนั้นพบว่า `getDashboardStats` ต้นฉบับมี logic แยกหมวด "รายได้" แต่ไม่เคยทำงานจริงเพราะไม่มีใครกรอกหมวดนี้ได้ (ไม่อยู่ใน dropdown) จึงไม่ได้พอร์ตส่วนนั้นมา — ตอนนี้ Workshop flow ทำให้หมวดนี้ถูกใช้งานจริงแล้ว จึงกลับไปแก้ `get_dashboard_stats` ให้แยกยอดรายได้ออกจากยอดใช้จ่ายอย่างถูกต้อง (ไฟล์ `phase4c_dashboard_income_fix.sql`)

## ไฟล์แนบ Workshop — เก็บที่ Supabase Storage (ไม่ใช่ Google Drive เดิม)

ตามที่เลือกไว้ (ง่ายกว่า อยู่ระบบเดียวกัน) เก็บใน bucket `workshop-attachments` (จำกัด 10MB/ไฟล์ตามที่กำหนด) — bucket นี้เปิดให้ anon key เขียน/อ่านได้ (เหตุผลเดียวกับที่ RPC ทุกตัวเปิดให้ anon เรียกได้: ระบบนี้ไม่ได้ใช้ Supabase Auth จริง จึงพึ่ง RLS แบบปกติไม่ได้ ต้องเช็คสิทธิ์เองในทุกจุดแทน) path ไฟล์มี `plan_id` แบบสุ่มปนอยู่ เดายาก แต่ไม่ได้ปิดสนิทแบบ private จริงๆ — เหมาะกับข้อมูลภายในองค์กร ไม่ใช่ข้อมูลสาธารณะอ่อนไหวระดับสูงสุด

## ข้อมูลร้านค้า — นำเข้าจากไฟล์จริงแล้ว (482 ร้าน)

**ช่องโหว่ข้อมูลที่ต้องรู้:** ไฟล์ต้นฉบับไม่มีคอลัมน์ "เซลล์ที่สังกัด" เลย ทุกร้านตอนนี้ `assigned_sales_id = null` — เวลาเซลล์เลือกร้านตอนสร้างคำขอ Workshop จะเห็นว่า "เซลล์ที่สังกัด: ยังไม่ได้กำหนด" ไปก่อน ต้องกำหนดเองทีละร้านผ่าน SQL ก่อน (ยังไม่มีหน้า UI ให้จัดการเรื่องนี้ในรอบนี้):
```sql
update stores set assigned_sales_id = 'รหัสเซลล์' where id = 123; -- หา id จาก select * from stores where name ilike '%ชื่อร้าน%'
```
บอกได้ถ้าอยากให้สร้างหน้า "จัดการร้านค้า" สำหรับกำหนดเซลล์ประจำร้านแบบมี UI ให้คลิกแทนการรัน SQL เอง

## โมเดลสิทธิ์หลังเฟส 3c

- **ADMIN**: เข้าถึงทุกหน้า/ฟีเจอร์เสมอ, เป็นคนเดียวที่แก้ไขสิทธิ์คนอื่นได้, เป็นคนเดียวที่ตั้ง/แก้ไข role ADMIN ให้ใครได้ (กันการยกระดับสิทธิ์โดยไม่ได้รับอนุญาต แม้จะได้รับสิทธิ์หน้า "users" จาก ADMIN ไปแล้วก็ตาม)
- **ผู้บริหาร / เซลล์ / บัญชี**: เป็น role ธรรมดา ต้องมี `page_permissions` ที่ ADMIN ตั้งให้เท่านั้นถึงจะเข้าหน้านั้นได้ — ตอนสร้างใหม่จะได้ default ตามนี้ (แก้ไขทีหลังผ่านแผงสิทธิ์ได้เสมอ):
  - ผู้บริหาร: แดชบอร์ด, บันทึกค่าใช้จ่าย, ประวัติรายการ, คำขออนุมัติแก้ไข/ลบ
  - เซลล์ / บัญชี: แดชบอร์ด, บันทึกค่าใช้จ่าย, ประวัติรายการ

## ความแตกต่างจากต้นฉบับที่ตั้งใจปรับ (ไม่ใช่พอร์ตแบบ 1:1 เป๊ะ — แจ้งไว้ตรงนี้ทั้งหมด)

1. **รหัสผ่านผู้ใช้**: ต้นฉบับ (`saveUser`) เก็บเป็น **plaintext ตรงๆ** — เวอร์ชันนี้ hash ด้วย bcrypt เสมอ ทั้งตอนสร้างและแก้ไข ไม่มีทางเก็บ plaintext ได้เลย
2. **สิทธิ์อนุมัติ**: ต้นฉบับ (`approveEdit`/`approveDelete`/`rejectPending`) ไม่มีการเช็ค role ฝั่ง backend เลย (พึ่งพาแค่ frontend ซ่อนปุ่ม) — เวอร์ชันนี้เช็ค `role = 'ผู้บริหาร'` ในฐานข้อมูลก่อนอนุมัติทุกครั้ง
3. **`get_users`** ไม่คืนค่ารหัสผ่าน/hash กลับมาที่ client เลย (ต้นฉบับคืน column password ตรงๆ)
4. **Audit log viewer** เป็นฟีเจอร์ใหม่ที่ต้นฉบับไม่มี

## บั๊กที่พบในต้นฉบับ แต่ตั้งใจ "พอร์ตตามเดิม" (ไม่ได้แอบแก้เอง)

1. **`get_dashboard_stats`**: โค้ดเดิมเช็คหมวดหมู่ `"รายได้"` และรายละเอียด `"ยอดขายดันสินค้าเข้า"` เพื่อแยกยอดรายได้ออกจากยอดใช้จ่าย — แต่ `"รายได้"` ไม่ใช่ตัวเลือกใน dropdown หมวดหมู่เลย และ dropdown รายละเอียดมีคำว่า `"ยอดขายดันเข้าสินค้า"` (คนละคำกับที่เช็ค) แปลว่า **การแยกยอดรายได้ไม่เคยทำงานจริงแม้แต่ในเวอร์ชัน Apps Script เดิม** — เวอร์ชันนี้จึงไม่ได้ implement ส่วน `totalIncome`/`workshopIncome`/`netDiff` เลย (เพราะเป็น dead code ในต้นฉบับ) **แจ้งกลับมาได้ถ้าต้องการให้ทำ field รายได้ให้ใช้งานได้จริง** จะได้ไปคุยกันว่าอยากให้จับคู่กับหมวดหมู่/รายละเอียดไหนกันแน่
2. **`get_notifications`**: เงื่อนไขการกรองแจ้งเตือนแบบ broadcast (target_user ว่าง) ในต้นฉบับหลวมเกินไป ทำให้ทุกคนเห็นแจ้งเตือนที่ตั้งใจส่งเฉพาะ role หนึ่งได้ — พอร์ตพฤติกรรมเดิมไว้ตามนี้ก่อน แจ้งได้ถ้าต้องการแก้ให้ตรง role จริงๆ

## วิธี Setup

### 1. สร้างโปรเจกต์ Supabase + รัน SQL ทั้ง 3 ไฟล์ตามลำดับด้านบน

### 2. เพิ่ม user เดิมจากชีต "User" (ต้อง hash รหัสผ่านเสมอ)
```sql
insert into users (id, password_hash, role, name, full_name, email)
values ('Kanok500', crypt('S500', gen_salt('bf')), 'เซลล์', 'กนก', 'กนก เรืองลั่น', null);
```

### 3. ตั้งค่า environment variables
คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่าจาก Supabase Project Settings > API:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxx
```
**ห้ามใช้ `service_role` key** — ต้องใช้ `anon public` key เท่านั้น (service_role bypass RLS ทั้งหมด)

### 4. ติดตั้งและรัน
```bash
npm install
npm run dev       # ทดสอบในเครื่อง — restart ทุกครั้งที่แก้ .env
npm run build     # build สำหรับ deploy
```

### 5. Deploy ขึ้น Vercel
เชื่อม repo กับ Vercel แล้วใส่ environment variables 2 ตัวข้างต้นในหน้า Vercel Project Settings ด้วย

## โครงสร้างโฟลเดอร์
```
src/
  lib/           supabaseClient.js, constants.js (dropdown/role options พอร์ตจากของเดิม)
  context/       AuthContext.jsx
  components/    ExpenseEditModal.jsx, NotificationsBell.jsx
  pages/         LoginPage, DashboardPage, ExpenseEntryPage, ExpenseHistoryPage,
                 PendingEditsPage, UsersManagementPage, AuditLogPage
  App.jsx        Shell + sidebar navigation + header
supabase/
  schema.sql                       เฟส 1: ตารางหลัก + login + save/get expense
  phase2_workflow.sql              เฟส 2: dashboard, filter, edit/delete workflow
  phase3_notifications_users.sql   เฟส 3: notifications, users, audit log
```


```

---

### 📄 File: `vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}

```

---

### 📄 File: `vite.config.js`
```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})

```

---

### 📄 File: `src\App.jsx`
```jsx
import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ExpenseEntryPage from './pages/ExpenseEntryPage'
import ExpenseHistoryPage from './pages/ExpenseHistoryPage'
import PendingEditsPage from './pages/PendingEditsPage'
import UsersManagementPage from './pages/UsersManagementPage'
import StoresManagementPage from './pages/StoresManagementPage'
import AccountsManagementPage from './pages/AccountsManagementPage'
import AccountGroupsPage from './pages/AccountGroupsPage'
import AccountFileImportPage from './pages/AccountFileImportPage'
import ReconciliationPage from './pages/ReconciliationPage'
import BudgetManagementPage from './pages/BudgetManagementPage'
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage'
import ExecutiveReportPage from './pages/ExecutiveReportPage'
import TaxReportPage from './pages/TaxReportPage'
import AuditLogPage from './pages/AuditLogPage'
import WorkshopCreatePage from './pages/WorkshopCreatePage'
import WorkshopHistoryPage from './pages/WorkshopHistoryPage'
import WorkshopApprovalPage from './pages/WorkshopApprovalPage'
import TrialBalancePage from './pages/TrialBalancePage'
import ExternalExpensePage from './pages/ExternalExpensePage'
import PLReportPage from './pages/PLReportPage'
import ReportsHubPage from './pages/ReportsHubPage'
import AccountsHubPage from './pages/AccountsHubPage'
import ReconTrialHubPage from './pages/ReconTrialHubPage'
import BudgetsOtherHubPage from './pages/BudgetsOtherHubPage'
import NotificationsBell from './components/NotificationsBell'
import { NAV_GROUPS } from './lib/constants'
import { hasPagePermission } from './lib/permissions'
import { supabase } from './lib/supabaseClient'
import { THAI_MONTHS } from './lib/constants'

const IMPLEMENTED_PAGES = {
  dashboard: DashboardPage,
  'expense-entry': ExpenseEntryPage,
  'expense-history': ExpenseHistoryPage,
  'pending-edits': PendingEditsPage,
  users: UsersManagementPage,
  stores: StoresManagementPage,
  accounts: (props) => <AccountsHubPage initialTab="accounts" {...props} />,
  'account-groups': (props) => <AccountsHubPage initialTab="account-groups" {...props} />,
  'account-import': (props) => <AccountsHubPage initialTab="account-import" {...props} />,
  'accounts-hub': (props) => <AccountsHubPage initialTab="accounts" {...props} />,
  reconciliation: (props) => <ReconTrialHubPage initialTab="reconciliation" {...props} />,
  'trial-balance': (props) => <ReconTrialHubPage initialTab="trial-balance" {...props} />,
  'recon-hub': (props) => <ReconTrialHubPage initialTab="reconciliation" {...props} />,
  budgets: (props) => <BudgetsOtherHubPage initialTab="budgets" {...props} />,
  'external-expenses': (props) => <BudgetsOtherHubPage initialTab="external-expenses" {...props} />,
  'budgets-hub': (props) => <BudgetsOtherHubPage initialTab="budgets" {...props} />,
  'exec-dashboard': ExecutiveDashboardPage,
  'exec-report': (props) => <ReportsHubPage initialTab="exec-report" {...props} />,
  'pl-report': (props) => <ReportsHubPage initialTab="pl-report" {...props} />,
  'tax-report': (props) => <ReportsHubPage initialTab="tax-report" {...props} />,
  'reports-hub': (props) => <ReportsHubPage initialTab="exec-report" {...props} />,
  'audit-log': AuditLogPage,
  'workshop-plan-create': WorkshopCreatePage,
  'workshop-plan-view': WorkshopHistoryPage,
  'workshop-approve': WorkshopApprovalPage,
}

function ComingSoon({ label }) {
  return (
    <div className="max-w-2xl mx-auto glass p-10 text-center">
      <p className="doc-badge mb-4">กำลังพัฒนา</p>
      <h2 className="font-display italic text-2xl text-ink-900 mb-2">{label}</h2>
      <p className="text-ink-600 text-sm">
        หน้านี้อยู่ในแผนเฟสถัดไป — ตอนนี้เปิดใช้งานได้เฉพาะ "บันทึกค่าใช้จ่าย" ซึ่งเป็นฟีเจอร์หลักของระบบก่อน
      </p>
    </div>
  )
}

// ─── Status Box: แสดงวันที่แนบไฟล์ล่าสุด + เดือน/ปีล่าสุด ───────────────────────
function DataStatusBox() {
  const { currentUser } = useAuth()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!currentUser?.id) return setLoading(false)
      setLoading(true)
      try {
        const { data: batches } = await supabase
          .rpc('get_import_batches', { p_actor_id: currentUser.id, p_batch_type: 'pl_estimate' })
        if (batches && batches.length > 0) {
          const sorted = [...batches].sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
          const latest = sorted[0]
          setStatus({
            latestImportAt: latest.uploaded_at,
            latestYear: Math.max(...batches.map(b => Number(b.year) || 0)) || latest.year,
            latestMonthRange: latest.month_range || null,
          })
        }
      } catch (e) {
        // silent fail
      }
      setLoading(false)
    }
    load()
  }, [currentUser])

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-black/10">
        <p className="text-ink-400 text-[10px]">กำลังโหลดสถานะ...</p>
      </div>
    )
  }

  const importDate = status?.latestImportAt
    ? new Date(status.latestImportAt)
    : null

  const monthName = status?.latestMonthRange || null

  // คำนวณเดือนถัดไปจาก year ล่าสุด (บางทีเดือน range = "ม.ค.-ธ.ค." แสดงว่ามีข้อมูลครบทั้งปี)
  const nextYear = status?.latestYear ? Number(status.latestYear) + 1 : null
  const nextPeriod = nextYear ? `ปี ${nextYear}` : null

  return (
    <div className="mt-3 pt-3 border-t border-black/10 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-ink-400">สถานะข้อมูล</p>
      {importDate ? (
        <div className="bg-white/50 border border-black/[0.07] rounded-xl p-2.5 space-y-1.5">
          <div className="flex items-start gap-1.5">
            <span className="text-xs mt-0.5">📂</span>
            <div>
              <p className="text-[10px] text-ink-500">แนบไฟล์ล่าสุด</p>
              <p className="text-[11px] font-medium text-ink-800">
                {importDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-ink-400">เวลา {importDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
            </div>
          </div>
          {monthName && (
            <div className="flex items-start gap-1.5">
              <span className="text-xs mt-0.5">📅</span>
              <div>
                <p className="text-[10px] text-ink-500">ยอดล่าสุดคือ</p>
                <p className="text-[11px] font-medium text-ocean">{monthName} ปี {status?.latestYear}</p>
              </div>
            </div>
          )}
          {nextPeriod && (
            <div className="bg-sage-pale/60 rounded-lg px-2 py-1.5 border border-sage/20">
              <p className="text-[9px] text-sage font-medium">→ ลงยอดถัดไป: {nextPeriod}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5">
          <p className="text-[10px] text-amber-700">⚠️ ยังไม่มีข้อมูลในระบบ</p>
          <p className="text-[9px] text-amber-500 mt-0.5">กรุณาแนบไฟล์บัญชีก่อน</p>
        </div>
      )}
    </div>
  )
}

function Sidebar({ active, onNavigate }) {
  const { currentUser, logout } = useAuth()
  const visibleGroups = NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((item) => hasPagePermission(currentUser, item.key)) }))
    .filter((group) => group.items.length > 0)

  return (
    <aside className="w-64 shrink-0 glass-solid m-4 mr-0 p-5 flex flex-col">
      <div className="mb-8">
        <h1 className="font-display italic text-2xl text-ink-900">GoCost</h1>
        <p className="text-ink-500 text-xs mt-0.5">คุมค่าใช้จ่าย</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] uppercase tracking-wider text-ink-400 mb-2 px-2">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    active === item.key
                      ? 'bg-gold-pale text-gold-dark border border-gold/30'
                      : 'text-ink-700 hover:bg-ink-100 border border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="pt-4 border-t border-black/10">
        <p className="text-ink-900 text-sm">{currentUser?.full_name || currentUser?.name}</p>
        <p className="text-ink-500 text-xs mb-3">{currentUser?.role}</p>
        <button onClick={logout} className="btn-ghost w-full text-sm">ออกจากระบบ</button>
        <DataStatusBox />
      </div>
    </aside>
  )
}

function Shell() {
  const { currentUser } = useAuth()
  const firstPermitted = NAV_GROUPS.flatMap((g) => g.items).find((i) => hasPagePermission(currentUser, i.key))?.key ?? 'dashboard'
  const [active, setActive] = useState(firstPermitted)
  const ActivePage = IMPLEMENTED_PAGES[active]
  const activeLabel = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === active)?.label ?? ''
  const allowed = hasPagePermission(currentUser, active)

  return (
    <div className="min-h-screen flex">
      <Sidebar active={active} onNavigate={setActive} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-8 py-4">
          <h2 className="text-ink-600 text-sm">{activeLabel}</h2>
          <NotificationsBell />
        </header>
        <main className="flex-1 px-8 pb-8 overflow-y-auto">
          {!allowed && (
            <div className="max-w-2xl mx-auto glass p-10 text-center">
              <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
              <p className="text-ink-600 text-sm">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ — ติดต่อ Admin หากคิดว่าควรมีสิทธิ์</p>
            </div>
          )}
          {allowed && (ActivePage ? <ActivePage onNavigate={setActive} /> : <ComingSoon label={activeLabel} />)}
        </main>
      </div>
    </div>
  )
}

function Gate() {
  const { currentUser, loading } = useAuth()
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink-500">กำลังโหลด...</div>
  }
  return currentUser ? <Shell /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

```

---

### 📄 File: `src\index.css`
```css
@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Sarabun", sans-serif;
  --font-display: "DM Serif Display", serif;

  /* Apple-esque neutral scale — page bg #f5f5f7, near-black text #1d1d1f */
  --color-ink-50: #ffffff;
  --color-ink-100: #f5f5f7;
  --color-ink-200: #e8e8ed;
  --color-ink-300: #d2d2d7;
  --color-ink-400: #a1a1a6;
  --color-ink-500: #86868b;
  --color-ink-600: #6e6e73;
  --color-ink-700: #424245;
  --color-ink-800: #2c2c2e;
  --color-ink-900: #1d1d1f;
  --color-ink: #1d1d1f;

  --color-gold: #b8923f;
  --color-gold-light: #d4b164;
  --color-gold-dark: #8a6a26;
  --color-gold-pale: #fbf3e0;

  --color-sage: #2d7a46;
  --color-sage-light: #3f9a5c;
  --color-sage-dark: #1e5730;
  --color-sage-pale: #eaf7ef;

  --color-rose: #d0342c;
  --color-rose-pale: #fdecea;

  --color-ocean: #0071e3;
  --color-ocean-pale: #e8f2fd;
}

@layer base {
  body {
    @apply bg-ink-100 text-ink-900 font-sans antialiased;
    background-image:
      radial-gradient(circle at 12% 8%, rgba(0, 113, 227, 0.07), transparent 42%),
      radial-gradient(circle at 88% 92%, rgba(184, 146, 63, 0.08), transparent 45%);
    background-attachment: fixed;
  }
}

@layer components {
  /* Signature surface — frosted white glass, Apple-store style */
  .glass {
    @apply bg-white/70 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-2xl;
  }
  .glass-solid {
    @apply bg-white/90 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_30px_rgba(0,0,0,0.06)] rounded-2xl;
  }
  .glass-input {
    @apply bg-white border border-black/10 rounded-xl px-4 py-2.5 text-ink-900 placeholder-ink-400
           focus:outline-none focus:border-ocean/50 focus:ring-2 focus:ring-ocean/10 transition-colors;
  }
  .glass-card-hover {
    @apply hover:bg-white/90 hover:border-black/10 transition-all duration-200;
  }
  .btn-primary {
    @apply bg-ocean text-white font-medium rounded-xl px-5 py-2.5
           shadow-[0_2px_10px_rgba(0,113,227,0.25)] hover:bg-[#0077ed] active:bg-[#006edb] transition-colors;
  }
  .btn-gold {
    @apply bg-gradient-to-b from-gold-light to-gold text-white font-medium rounded-xl px-5 py-2.5
           shadow-[0_2px_10px_rgba(184,146,63,0.3)] hover:brightness-95 active:brightness-90 transition-all;
  }
  .btn-ghost {
    @apply bg-white border border-black/10 text-ink-900 rounded-xl px-5 py-2.5
           hover:bg-ink-100 transition-colors;
  }
  .doc-badge {
    /* signature element — echoes the PV/Req document numbers this app lives on */
    @apply inline-flex items-center gap-2 font-display italic text-gold-dark text-sm tracking-wide
           border border-gold/30 bg-gold-pale rounded-full px-3 py-1;
  }
}

```

---

### 📄 File: `src\main.jsx`
```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

```

---

### 📄 File: `supabase\MISSING_FUNCTIONS_RUN_IN_SUPABASE.sql`
```sql
-- ============================================================
-- GoCost: SQL รวมสำหรับ run เข้า Supabase (copy-paste ทีเดียว)
-- ครอบคลุม: phase5i + phase5l + phase5o + phase5p + phase5q + phase5s
-- วิธีใช้: เปิด Supabase Dashboard > SQL Editor > วางทั้งหมด > Run
-- ============================================================

-- ลบฟังก์ชันเดิมก่อนเพื่อป้องกันข้อผิดพลาด 42P13 (cannot change return type)
drop function if exists get_group_report(text, bigint, int, int);
drop function if exists get_executive_itemized_report(text, int);
drop function if exists get_executive_itemized_report(text, int, int);
drop function if exists get_tax_filing_report(text, int);
drop function if exists get_tax_filing_report(text, int, int);
drop function if exists set_account_group_split(text, bigint, bigint, numeric);
drop function if exists remove_account_group_split(text, bigint, bigint);
drop function if exists get_group_members(text, bigint);
drop function if exists get_accounts(text, text);
drop function if exists get_accounts(text);
drop function if exists get_dashboard_stats(text, int, int);
drop function if exists auto_create_and_group_account(text, text, text);
drop function if exists get_executive_dashboard(text, int);
drop function if exists get_executive_monthly_report(text, int);
drop function if exists fix_corrupted_audit_logs();


-- ─────────────────────────────────────────────────────────────────
-- 1. get_group_report — ดูยอดของกลุ่ม (แม่) พร้อมยอดแยกตามรหัสบัญชี (ลูก)
-- ─────────────────────────────────────────────────────────────────
create or replace function get_group_report(
  p_actor_id text,
  p_group_id bigint,
  p_year     int,
  p_month    int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group         record;
  v_members       jsonb   := '[]'::jsonb;
  v_group_total   numeric := 0;
  v_account_total numeric;
  v_fraction      numeric;
  a record;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานกลุ่มรหัสบัญชี');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มบัญชีนี้');
  end if;

  for a in
    select ac.id, ac.code, ac.name, coalesce(s.fraction, 1.0) as fraction
    from accounts ac
    left join account_group_splits s on s.account_id = ac.id and s.group_id = p_group_id
    where ac.group_id = p_group_id or s.group_id = p_group_id
    order by ac.code
  loop
    select coalesce(sum(l.amount), 0) into v_account_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id
      and b.batch_type = 'pl_estimate'
      and b.year       = p_year
      and (p_month is null or l.month = p_month);

    v_account_total := round(v_account_total * a.fraction, 2);

    v_members := v_members || jsonb_build_array(jsonb_build_object(
      'code', a.code,
      'name', a.name,
      'fraction', a.fraction,
      'total', v_account_total
    ));
    v_group_total := v_group_total + v_account_total;
  end loop;

  return jsonb_build_object(
    'success', true,
    'groupCode', v_group.code,
    'groupName', v_group.name,
    'year', p_year,
    'month', p_month,
    'members', v_members,
    'groupTotal', v_group_total
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 2. get_executive_itemized_report — สรุปยอดตามกลุ่ม และรหัสบัญชี
-- ─────────────────────────────────────────────────────────────────
create or replace function get_executive_itemized_report(
  p_actor_id text,
  p_year     int,
  p_month    int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups           jsonb   := '[]'::jsonb;
  v_ungrouped        jsonb   := '[]'::jsonb;
  v_unassigned_total numeric := 0;
  v_grand_total      numeric := 0;
  v_year             int     := p_year;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total    numeric;
  v_account_total  numeric;
begin
  if not (has_page_permission(p_actor_id, 'exec-report') or has_page_permission(p_actor_id, 'exec-dashboard')) then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  if v_year is not null and v_year > 2400 then
    v_year := v_year - 543;
  end if;

  for g in select id, code, name from account_groups order by code, id loop
    v_group_accounts := '[]'::jsonb;
    v_group_total    := 0;

    for a in
      select distinct ac.id, ac.code, ac.name
      from accounts ac
      left join account_group_splits s on s.account_id = ac.id
      where ac.group_id = g.id or s.group_id = g.id
      order by ac.code
    loop
      select coalesce(sum(l.amount), 0) into v_account_total
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id
        and b.batch_type = 'pl_estimate'
        and b.year       = v_year
        and (p_month is null or l.month = p_month);

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code,
        'name', a.name,
        'total', v_account_total
      ));
      v_group_total := v_group_total + v_account_total;
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id,
      'code', g.code,
      'name', g.name,
      'total', v_group_total,
      'accounts', v_group_accounts
    ));
    v_grand_total := v_grand_total + v_group_total;
  end loop;

  for a in
    select ac.id, ac.code, ac.name
    from accounts ac
    where ac.group_id is null
      and not exists (select 1 from account_group_splits s where s.account_id = ac.id)
    order by ac.code
  loop
    select coalesce(sum(l.amount), 0) into v_account_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id
      and b.batch_type = 'pl_estimate'
      and b.year       = v_year
      and (p_month is null or l.month = p_month);

    if v_account_total <> 0 then
      v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
        'code', a.code,
        'name', a.name,
        'total', v_account_total
      ));
      v_grand_total := v_grand_total + v_account_total;
    end if;
  end loop;

  return jsonb_build_object(
    'success',           true,
    'year',              v_year,
    'month',             p_month,
    'groups',            v_groups,
    'ungroupedAccounts', v_ungrouped,
    'unassignedTotal',   0,
    'grandTotal',        v_grand_total
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 3. get_tax_filing_report — รายงานภาษี / รายงานสำหรับส่งสรรพากร
-- ─────────────────────────────────────────────────────────────────
create or replace function get_tax_filing_report(
  p_actor_id text,
  p_year     int,
  p_month    int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_lines       jsonb   := '[]'::jsonb;
  v_grand_total numeric := 0;
  v_year        int     := p_year;
  a record;
  v_total numeric;
begin
  if not has_page_permission(p_actor_id, 'tax-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานสรรพากร');
  end if;

  if v_year is not null and v_year > 2400 then
    v_year := v_year - 543;
  end if;

  for a in select id, code, name, category from accounts order by code loop
    select coalesce(sum(l.amount), 0) into v_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id
      and b.batch_type = 'pl_estimate'
      and b.year       = v_year
      and (p_month is null or l.month = p_month);

    if v_total <> 0 then
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'code', a.code,
        'name', a.name,
        'category', a.category,
        'total', v_total
      ));
      v_grand_total := v_grand_total + v_total;
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'year', v_year,
    'month', p_month,
    'lines', v_lines,
    'grandTotal', v_grand_total
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 4. set_account_group_split — กำหนดสัดส่วนกลุ่มรหัสบัญชี
-- ─────────────────────────────────────────────────────────────────
create or replace function set_account_group_split(
  p_actor_id   text,
  p_account_id bigint,
  p_group_id   bigint,
  p_fraction   numeric
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_other_sum numeric := 0;
  v_new_sum   numeric := 0;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการกลุ่มรหัสบัญชี');
  end if;

  if p_fraction <= 0 or p_fraction > 1.0 then
    return jsonb_build_object('success', false, 'message', 'สัดส่วนต้องมากกว่า 0% และไม่เกิน 100%');
  end if;

  select coalesce(sum(fraction), 0) into v_other_sum
  from account_group_splits
  where account_id = p_account_id and group_id <> p_group_id;

  v_new_sum := v_other_sum + p_fraction;
  if v_new_sum > 1.0001 then
    return jsonb_build_object('success', false, 'message', format('สัดส่วนรวมเกิน 100%% — รหัสนี้จัดสรรไปแล้ว %s%% เหลือใส่ได้ไม่เกิน %s%%', round(v_other_sum * 100, 1), round((1.0 - v_other_sum) * 100, 1)));
  end if;

  insert into account_group_splits (account_id, group_id, fraction)
  values (p_account_id, p_group_id, round(p_fraction, 4))
  on conflict (account_id, group_id)
  do update set fraction = round(excluded.fraction, 4);

  perform write_audit_log(p_actor_id, 'SET_ACCOUNT_GROUP_SPLIT', 'AccountGroups', format('ผูกรหัสบัญชี id %s กับกลุ่ม id %s สัดส่วน %s%%', p_account_id, p_group_id, round(p_fraction * 100, 1)));

  return jsonb_build_object('success', true, 'message', 'บันทึกสัดส่วนสำเร็จ');
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 5. remove_account_group_split — ลบสัดส่วนกลุ่มรหัสบัญชี
-- ─────────────────────────────────────────────────────────────────
create or replace function remove_account_group_split(
  p_actor_id   text,
  p_account_id bigint,
  p_group_id   bigint
)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการกลุ่มรหัสบัญชี');
  end if;

  delete from account_group_splits
  where account_id = p_account_id and group_id = p_group_id;

  perform write_audit_log(p_actor_id, 'REMOVE_ACCOUNT_GROUP_SPLIT', 'AccountGroups', format('ลบผูกรหัสบัญชี id %s จากกลุ่ม id %s', p_account_id, p_group_id));

  return jsonb_build_object('success', true, 'message', 'เอารหัสออกจากกลุ่มสำเร็จ');
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 6. get_group_members — ดึงสมาชิกในกลุ่มบัญชี
-- ─────────────────────────────────────────────────────────────────
create or replace function get_group_members(
  p_actor_id text,
  p_group_id bigint
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group record;
  v_members jsonb := '[]'::jsonb;
  v_available jsonb := '[]'::jsonb;
  r record;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูกลุ่มรหัสบัญชี');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มบัญชีนี้');
  end if;

  -- สมาชิกในกลุ่ม
  for r in
    select ac.id, ac.code, ac.name, ac.category, s.fraction,
      (select coalesce(sum(s2.fraction), 0) from account_group_splits s2 where s2.account_id = ac.id) as total_assigned
    from account_group_splits s
    join accounts ac on ac.id = s.account_id
    where s.group_id = p_group_id
    order by ac.code
  loop
    v_members := v_members || jsonb_build_array(jsonb_build_object(
      'id', r.id, 'code', r.code, 'name', r.name, 'category', r.category,
      'fraction', r.fraction, 'totalAssigned', r.total_assigned
    ));
  end loop;

  -- รหัสบัญชีที่สามารถเพิ่มเข้ากลุ่มได้
  for r in
    select ac.id, ac.code, ac.name, ac.category,
      coalesce((select sum(s2.fraction) from account_group_splits s2 where s2.account_id = ac.id), 0) as total_assigned
    from accounts ac
    where not exists (select 1 from account_group_splits s3 where s3.account_id = ac.id and s3.group_id = p_group_id)
    order by ac.code
  loop
    if r.total_assigned < 0.9999 then
      v_available := v_available || jsonb_build_array(jsonb_build_object(
        'id', r.id, 'code', r.code, 'name', r.name, 'category', r.category,
        'totalAssigned', r.total_assigned,
        'remainingFraction', round(1.0 - r.total_assigned, 4)
      ));
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'group', jsonb_build_object('id', v_group.id, 'code', v_group.code, 'name', v_group.name),
    'members', v_members,
    'availableAccounts', v_available
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 7. get_accounts — ดึงรหัสบัญชีทั้งหมด พร้อมสัดส่วนกลุ่ม
-- ─────────────────────────────────────────────────────────────────
create or replace function get_accounts(p_actor_id text, p_query text default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb := '[]'::jsonb;
  r record;
  v_groups jsonb;
begin
  if not (has_page_permission(p_actor_id, 'accounts') or has_page_permission(p_actor_id, 'account-groups')) then
    raise exception 'คุณไม่มีสิทธิ์ดูรหัสบัญชี';
  end if;

  for r in
    select a.id, a.code, a.name, a.category, a.description
    from accounts a
    where p_query is null
       or a.code ilike '%' || p_query || '%'
       or a.name ilike '%' || p_query || '%'
       or a.category ilike '%' || p_query || '%'
    order by a.code
  loop
    select coalesce(jsonb_agg(jsonb_build_object(
      'groupId', g.id,
      'code', g.code,
      'name', g.name,
      'fraction', s.fraction
    )), '[]'::jsonb) into v_groups
    from account_group_splits s
    join account_groups g on g.id = s.group_id
    where s.account_id = r.id;

    v_result := v_result || jsonb_build_array(jsonb_build_object(
      'id', r.id,
      'code', r.code,
      'name', r.name,
      'category', r.category,
      'description', r.description,
      'groups', v_groups
    ));
  end loop;

  return v_result;
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 8. get_dashboard_stats — แดชบอร์ดหลักระบบ GoCost
-- ─────────────────────────────────────────────────────────────────
create or replace function get_dashboard_stats(
  p_actor_id text,
  p_year     int default null,
  p_month    int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year             int     := coalesce(p_year, extract(year from current_date)::int);
  v_total_expenses   numeric := 0;
  v_total_income     numeric := 0;
  v_doc_count        int     := 0;
  v_top_category     text    := '-';
  v_top_amount       numeric := 0;
  v_by_category      jsonb   := '[]'::jsonb;
  v_by_month         jsonb   := '[]'::jsonb;
  r record;
begin
  if not has_page_permission(p_actor_id, 'dashboard') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูแดชบอร์ด');
  end if;

  if v_year > 2400 then
    v_year := v_year - 543;
  end if;

  -- 1. รายได้รวม
  select coalesce(sum(l.amount), 0) into v_total_income
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a on a.id = l.account_id
  where b.batch_type = 'pl_estimate'
    and b.year = v_year
    and (p_month is null or l.month = p_month)
    and a.category = 'รายได้ (Revenue)';

  -- 2. รายจ่ายรวม
  select coalesce(sum(l.amount), 0) into v_total_expenses
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a on a.id = l.account_id
  where b.batch_type = 'pl_estimate'
    and b.year = v_year
    and (p_month is null or l.month = p_month)
    and a.category <> 'รายได้ (Revenue)';

  -- 3. สรุปตามหมวดหมู่
  for r in
    select a.category as cat, sum(l.amount) as amt
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a on a.id = l.account_id
    where b.batch_type = 'pl_estimate'
      and b.year = v_year
      and (p_month is null or l.month = p_month)
    group by a.category
    order by amt desc
  loop
    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', r.cat,
      'amount', r.amt
    ));
  end loop;

  -- 4. สรุปรายเดือน
  for r in
    select l.month as m, sum(l.amount) as amt
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where b.batch_type = 'pl_estimate'
      and b.year = v_year
    group by l.month
    order by l.month
  loop
    v_by_month := v_by_month || jsonb_build_array(jsonb_build_object(
      'month', r.m,
      'amount', r.amt
    ));
  end loop;

  return jsonb_build_object(
    'success',           true,
    'totalExpenses',     v_total_expenses,
    'totalIncome',       v_total_income,
    'docCount',          v_doc_count,
    'avgPerDoc',         0,
    'topCategory',       v_top_category,
    'topCategoryAmount', v_top_amount,
    'byCategory',        v_by_category,
    'byMonth',           v_by_month
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 9. auto_create_and_group_account — สร้างรหัสบัญชีและจัดกลุ่มอัตโนมัติ
-- ─────────────────────────────────────────────────────────────────
create or replace function auto_create_and_group_account(
  p_actor_id text,
  p_code     text,
  p_name     text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_code         text := trim(p_code);
  v_name         text := trim(coalesce(p_name, ''));
  v_first_digit  char(1);
  v_category     text;
  v_group_code   text;
  v_account_id   bigint;
  v_group_id     bigint;
begin
  if v_code is null or v_code = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณาระบุรหัสบัญชี');
  end if;

  v_first_digit := substring(v_code from 1 for 1);

  case v_first_digit
    when '1' then
      v_category   := 'สินทรัพย์ (Assets)';
      v_group_code := '1000-00';
    when '2' then
      v_category   := 'หนี้สิน (Liabilities)';
      v_group_code := '2000-00';
    when '3' then
      v_category   := 'ส่วนของผู้ถือหุ้น / ทุน (Equity)';
      v_group_code := '3000-00';
    when '4' then
      v_category   := 'รายได้ (Revenue)';
      v_group_code := '4000-00';
    when '5' then
      v_category   := 'ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)';
      v_group_code := '5000-00';
    when '6' then
      v_category   := 'ค่าใช้จ่ายในการขายและบริหาร (Expenses)';
      v_group_code := '6000-00';
    else
      v_category   := 'ค่าใช้จ่ายในการขายและบริหาร (Expenses)';
      v_group_code := '6000-00';
  end case;

  if v_name = '' then
    v_name := format('บัญชี %s', v_code);
  end if;

  select id into v_account_id from accounts where code = v_code;

  if v_account_id is null then
    insert into accounts (code, name, category, description)
    values (v_code, v_name, v_category, format('สร้างและจัดกลุ่มอัตโนมัติสำหรับรหัส %s', v_code))
    returning id into v_account_id;
  else
    update accounts
    set name = case when (name like 'บัญชี %' or name is null or name = '') then v_name else name end,
        category = coalesce(category, v_category)
    where id = v_account_id;
  end if;

  select id into v_group_id from account_groups where code = v_group_code limit 1;

  if v_group_id is null then
    select id into v_group_id from account_groups order by code limit 1;
  end if;

  if v_group_id is not null then
    insert into account_group_splits (account_id, group_id, fraction)
    values (v_account_id, v_group_id, 1.0)
    on conflict (account_id, group_id)
    do update set fraction = 1.0;

    update accounts set group_id = v_group_id where id = v_account_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'accountId', v_account_id,
    'code', v_code,
    'name', v_name,
    'category', v_category,
    'groupId', v_group_id,
    'groupCode', v_group_code
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 10. get_executive_dashboard — แดชบอร์ดฝ่ายบริหาร
-- ─────────────────────────────────────────────────────────────────
create or replace function get_executive_dashboard(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_revenue  numeric := 0;
  v_total_cogs     numeric := 0;
  v_total_expenses numeric := 0;
  v_by_category    jsonb   := '[]'::jsonb;
  v_year           int     := p_year;
  v_pos_rev        numeric := 0;
  v_neg_rev        numeric := 0;
  r record;
begin
  if not (has_page_permission(p_actor_id, 'exec-dashboard') or has_page_permission(p_actor_id, 'exec-report')) then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูแดชบอร์ดฝ่ายบริหาร');
  end if;

  if v_year is not null and v_year > 2400 then
    v_year := v_year - 543;
  end if;

  -- 1. รายได้รวมสุทธิ (Net Revenue)
  select coalesce(sum(l.amount), 0) into v_pos_rev
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a               on a.id = l.account_id
  where b.batch_type = 'pl_estimate' and b.year = v_year
    and (a.category = 'รายได้ (Revenue)' or l.code in ('4100-01', '4100-05', '4200-08', '5130-02'))
    and l.code not in ('4100-03', '4100-04');

  select coalesce(sum(abs(l.amount)), 0) into v_neg_rev
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  where b.batch_type = 'pl_estimate' and b.year = v_year
    and l.code in ('4100-03', '4100-04');

  v_total_revenue := v_pos_rev - v_neg_rev;
  if v_total_revenue = 0 then
    select coalesce(sum(l.amount), 0) into v_total_revenue
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a               on a.id = l.account_id
    where b.batch_type = 'pl_estimate' and b.year = v_year
      and a.category = 'รายได้ (Revenue)';
  end if;

  -- 2. ต้นทุนสินค้า (COGS)
  select coalesce(sum(l.amount), 0) into v_total_cogs
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a               on a.id = l.account_id
  where b.batch_type = 'pl_estimate' and b.year = v_year
    and (a.category like '%ต้นทุน%' or l.code like '5130-%');

  -- 3. รวมค่าใช้จ่ายทั้งหมด (Total Expenses)
  select coalesce(sum(l.amount), 0) into v_total_expenses
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a               on a.id = l.account_id
  where b.batch_type = 'pl_estimate' and b.year = v_year
    and a.category not like '%รายได้%'
    and l.code not in ('4100-01', '4100-03', '4100-04', '4100-05', '4200-08', '5130-02');

  -- 4. สรุปรายหมวดหมู่
  for r in
    select
      a.category as category,
      coalesce(sum(l.amount), 0) as actual,
      coalesce(bg.amount, 0) as budget
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a               on a.id = l.account_id
    left join budgets bg          on bg.category = a.category and bg.year = v_year
    where b.batch_type = 'pl_estimate'
      and b.year = v_year
      and a.category not like '%รายได้%'
      and l.code not in ('4100-01', '4100-03', '4100-04', '4100-05', '4200-08', '5130-02')
    group by a.category, bg.amount
  loop
    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', r.category,
      'actual', r.actual,
      'budget', r.budget,
      'remaining', r.budget - r.actual,
      'pctUsed', case when r.budget > 0 then round((r.actual / r.budget) * 100, 1) else null end,
      'attributionRate', case when v_total_revenue > 0 then round((r.actual / v_total_revenue) * 100, 2) else null end
    ));
  end loop;

  return jsonb_build_object(
    'success', true,
    'year', v_year,
    'totalRevenue', v_total_revenue,
    'totalCogs', v_total_cogs,
    'grossProfit', v_total_revenue - v_total_cogs,
    'totalExpenses', v_total_expenses,
    'netProfit', (v_total_revenue - v_total_cogs) - v_total_expenses,
    'cogsPct', case when v_total_revenue > 0 then round((v_total_cogs / v_total_revenue) * 100, 2) else null end,
    'grossProfitPct', case when v_total_revenue > 0 then round(((v_total_revenue - v_total_cogs) / v_total_revenue) * 100, 2) else null end,
    'expensePct', case when v_total_revenue > 0 then round((v_total_expenses / v_total_revenue) * 100, 2) else null end,
    'netProfitPct', case when v_total_revenue > 0 then round((((v_total_revenue - v_total_cogs) - v_total_expenses) / v_total_revenue) * 100, 2) else null end,
    'byCategory', v_by_category
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 11. get_executive_monthly_report — รายงานผู้บริหาร P&L รายเดือน
-- ─────────────────────────────────────────────────────────────────
create or replace function get_executive_monthly_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_revenue_monthly numeric[] := array_fill(0::numeric, array[12]);
  v_revenue_total numeric := 0;
  v_year int := p_year;
  g record;
  a record;
  m int;
  v_group_accounts jsonb;
  v_group_monthly numeric[];
  v_group_total numeric;
  v_acct_monthly numeric[];
  v_acct_total numeric;
  v_amt numeric;
  v_pct_monthly jsonb;
  v_pos_rev numeric;
  v_neg_rev numeric;
begin
  if not (has_page_permission(p_actor_id, 'exec-report') or has_page_permission(p_actor_id, 'pl-report')) then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  if v_year is not null and v_year > 2400 then
    v_year := v_year - 543;
  end if;

  -- 1. คำนวณรายได้สุทธิรวมในแต่ละเดือน (ม.ค.-ธ.ค.)
  for m in 1..12 loop
    select coalesce(sum(l.amount), 0) into v_pos_rev
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a2 on a2.id = l.account_id
    where b.batch_type = 'pl_estimate' and b.year = v_year and l.month = m
      and (a2.category = 'รายได้ (Revenue)' or l.code in ('4100-01', '4100-05', '4200-08', '5130-02'))
      and l.code not in ('4100-03', '4100-04');

    select coalesce(sum(abs(l.amount)), 0) into v_neg_rev
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where b.batch_type = 'pl_estimate' and b.year = v_year and l.month = m
      and l.code in ('4100-03', '4100-04');

    v_amt := v_pos_rev - v_neg_rev;
    if v_amt = 0 then
      select coalesce(sum(l.amount), 0) into v_amt
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      join accounts a2 on a2.id = l.account_id
      where b.batch_type = 'pl_estimate' and b.year = v_year and l.month = m
        and a2.category = 'รายได้ (Revenue)';
    end if;

    v_revenue_monthly[m] := v_amt;
    v_revenue_total := v_revenue_total + v_amt;
  end loop;

  -- 2. วนคำนวณแต่ละกลุ่มรหัสบัญชี
  for g in select id, code, name from account_groups order by code, id loop
    v_group_accounts := '[]'::jsonb;
    v_group_monthly := array_fill(0::numeric, array[12]);
    v_group_total := 0;

    for a in
      select distinct ac.id, ac.code, ac.name
      from accounts ac
      left join account_group_splits s on s.account_id = ac.id
      where ac.group_id = g.id or s.group_id = g.id
      order by ac.code
    loop
      v_acct_monthly := array_fill(0::numeric, array[12]);
      v_acct_total := 0;
      for m in 1..12 loop
        select coalesce(sum(l.amount), 0) into v_amt
        from account_import_lines l
        join account_import_batches b on b.id = l.batch_id
        where l.account_id = a.id and b.batch_type = 'pl_estimate' and b.year = v_year and l.month = m;
        v_acct_monthly[m] := v_amt;
        v_acct_total := v_acct_total + v_amt;
        v_group_monthly[m] := v_group_monthly[m] + v_amt;
      end loop;

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code,
        'name', a.name,
        'monthly', to_jsonb(v_acct_monthly),
        'total', v_acct_total
      ));
      v_group_total := v_group_total + v_acct_total;
    end loop;

    v_pct_monthly := '[]'::jsonb;
    for m in 1..12 loop
      v_pct_monthly := v_pct_monthly || jsonb_build_array(
        case when v_revenue_monthly[m] > 0 then round((v_group_monthly[m] / v_revenue_monthly[m]) * 100, 2) else null end
      );
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id,
      'code', g.code,
      'name', g.name,
      'accounts', v_group_accounts,
      'monthly', to_jsonb(v_group_monthly),
      'total', v_group_total,
      'pctOfRevenueMonthly', v_pct_monthly,
      'pctOfRevenueTotal', case when v_revenue_total > 0 then round((v_group_total / v_revenue_total) * 100, 2) else null end
    ));
  end loop;

  -- 3. รหัสที่ยังไม่มีกลุ่ม
  for a in
    select ac.id, ac.code, ac.name
    from accounts ac
    where ac.group_id is null
      and not exists (select 1 from account_group_splits s where s.account_id = ac.id)
    order by ac.code
  loop
    v_acct_monthly := array_fill(0::numeric, array[12]);
    v_acct_total := 0;
    for m in 1..12 loop
      select coalesce(sum(l.amount), 0) into v_amt
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id and b.batch_type = 'pl_estimate' and b.year = v_year and l.month = m;
      v_acct_monthly[m] := v_amt;
      v_acct_total := v_acct_total + v_amt;
    end loop;
    if v_acct_total <> 0 then
      v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
        'code', a.code,
        'name', a.name,
        'monthly', to_jsonb(v_acct_monthly),
        'total', v_acct_total
      ));
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'year', v_year,
    'revenueMonthly', to_jsonb(v_revenue_monthly),
    'revenueTotal', v_revenue_total,
    'groups', v_groups,
    'ungroupedAccounts', v_ungrouped
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 12. fix_corrupted_audit_logs — ซ่อมแซมตัวอักษรภาษาไทยที่เพี้ยนใน audit_logs
-- ─────────────────────────────────────────────────────────────────
create or replace function fix_corrupted_audit_logs()
returns jsonb
language plpgsql
security definer
as $$
declare
  r record;
  v_fixed text;
  v_count int := 0;
begin
  for r in select log_id, details from audit_logs where details like '%เธ%' or details like '%เน%' loop
    begin
      v_fixed := convert_from(convert_to(r.details, 'WIN874'), 'UTF8');
      update audit_logs set details = v_fixed where log_id = r.log_id;
      v_count := v_count + 1;
    exception when others then
      null;
    end;
  end loop;
  return jsonb_build_object('success', true, 'message', format('ซ่อมแซมตัวอักษรภาษาไทยในบันทึกกิจกรรมเรียบร้อย %s รายการ', v_count));
end;
$$;

```

---

### 📄 File: `supabase\phase2_workflow.sql`
```sql
-- ============================================================
-- GoCost — Phase 2 SQL (รันต่อจาก schema.sql)
-- พอร์ตจาก Code.js: getDashboardStats, getFilterOptions, updateRecord,
-- deleteRecord, requestEdit, requestDelete, approveEdit, approveDelete,
-- rejectPending, getPendingRequests — พฤติกรรมเดิมทุกจุดรวมถึงบั๊กที่มีอยู่แล้ว
-- (ดูหมายเหตุเรื่อง notification filter ท้ายไฟล์)
-- ============================================================

-- ─────────────────────────────────────────────
-- helper: audit log (พอร์ตจาก writeAuditLog เดิม)
-- ─────────────────────────────────────────────
create or replace function write_audit_log(p_user_id text, p_action text, p_module text, p_details text)
returns void
language sql
security definer
as $$
  insert into audit_logs (log_id, user_id, action, module, details)
  values ('LOG' || (extract(epoch from clock_timestamp()) * 1000)::bigint, p_user_id, p_action, p_module, p_details);
$$;

-- ─────────────────────────────────────────────
-- helper: add notification (พอร์ตจาก addNotification เดิม ตรงตัว)
-- หมายเหตุ: คงพฤติกรรมเดิมไว้ทั้งหมด รวมถึงการที่ target_user ว่าง
-- จะไปตรงเงื่อนไข matchUser ในฝั่งอ่าน (ดูใน get_notifications ที่จะเพิ่มเฟส 3)
-- ─────────────────────────────────────────────
create or replace function add_notification(p_target_role text, p_target_user text, p_message text, p_link_id text)
returns void
language sql
security definer
as $$
  insert into notifications (notif_id, target_role, target_user, message, link_id, status)
  values ('NTF' || (extract(epoch from clock_timestamp()) * 1000)::bigint,
          coalesce(p_target_role, ''), coalesce(p_target_user, ''), coalesce(p_message, ''), coalesce(p_link_id, ''), 0);
$$;

-- ─────────────────────────────────────────────
-- get_dashboard_stats — พอร์ตจาก getDashboardStats(filters) เดิม
-- filters: { year, month, category, detail, store } (ปี เป็น ค.ศ. หรือ พ.ศ. ก็ได้ เหมือนเดิม)
-- ─────────────────────────────────────────────
create or replace function get_dashboard_stats(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year int := (p_filters->>'year')::int;
  v_month int := (p_filters->>'month')::int;
  v_category text := nullif(trim(p_filters->>'category'), '');
  v_detail text := nullif(trim(p_filters->>'detail'), '');
  v_store text := nullif(trim(p_filters->>'store'), '');
  v_total_expenses numeric := 0;
  v_by_category jsonb := '{}'::jsonb;
  v_by_month jsonb := '{}'::jsonb;
  v_doc_count int := 0;
  v_top_category text := '-';
  v_top_amount numeric := 0;
  r record;
  v_cat_amount numeric;
begin
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  for r in
    select doc_number, main_category, event_date,
           sum(total) as row_total
    from expense_records
    where (v_year is null or extract(year from event_date) = v_year)
      and (v_month is null or extract(month from event_date) = v_month)
      and (v_category is null or main_category = v_category)
      and (v_detail is null or detail = v_detail)
      and (v_store is null or store_name = v_store)
    group by doc_number, main_category, event_date
  loop
    v_total_expenses := v_total_expenses + coalesce(r.row_total, 0);
    v_cat_amount := coalesce((v_by_category->>r.main_category)::numeric, 0) + coalesce(r.row_total, 0);
    v_by_category := v_by_category || jsonb_build_object(r.main_category, v_cat_amount);
    if r.event_date is not null then
      v_by_month := v_by_month || jsonb_build_object(
        to_char(r.event_date, 'YYYY-MM'),
        coalesce((v_by_month->>to_char(r.event_date, 'YYYY-MM'))::numeric, 0) + coalesce(r.row_total, 0)
      );
    end if;
  end loop;

  select count(distinct doc_number) into v_doc_count
  from expense_records
  where (v_year is null or extract(year from event_date) = v_year)
    and (v_month is null or extract(month from event_date) = v_month)
    and (v_category is null or main_category = v_category)
    and (v_detail is null or detail = v_detail)
    and (v_store is null or store_name = v_store);

  select key, value::numeric into v_top_category, v_top_amount
  from jsonb_each_text(v_by_category)
  order by value::numeric desc
  limit 1;

  return jsonb_build_object(
    'success', true,
    'totalExpenses', v_total_expenses,
    'totalSpend', v_total_expenses,
    'docCount', v_doc_count,
    'avgPerDoc', case when v_doc_count > 0 then v_total_expenses / v_doc_count else 0 end,
    'topCategory', coalesce(v_top_category, '-'),
    'topCategoryAmount', coalesce(v_top_amount, 0),
    'byCategory', v_by_category,
    'byMonth', v_by_month
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_filter_options — พอร์ตจาก getFilterOptions() เดิม
-- ─────────────────────────────────────────────
create or replace function get_filter_options()
returns jsonb
language sql
security definer
as $$
  select jsonb_build_object(
    'success', true,
    'years', coalesce((select jsonb_agg(distinct extract(year from event_date)::int + 543 order by extract(year from event_date)::int + 543 desc) from expense_records), '[]'::jsonb),
    'categories', coalesce((select jsonb_agg(distinct main_category order by main_category) from expense_records), '[]'::jsonb),
    'details', coalesce((select jsonb_agg(distinct detail order by detail) from expense_records), '[]'::jsonb),
    'storeNames', coalesce((select jsonb_agg(distinct store_name order by store_name) from expense_records), '[]'::jsonb)
  );
$$;

-- ─────────────────────────────────────────────
-- delete_expense_record — พอร์ตจาก deleteRecord(docNo) เดิม
-- ─────────────────────────────────────────────
create or replace function delete_expense_record(p_doc_number text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_count int;
begin
  delete from expense_records where doc_number = p_doc_number;
  get diagnostics v_count = row_count;
  return jsonb_build_object('success', true, 'message', format('ลบเอกสาร %s สำเร็จ (%s รายการ)', p_doc_number, v_count), 'deleted', v_count);
end;
$$;

-- ─────────────────────────────────────────────
-- update_expense_record — พอร์ตจาก updateRecord(oldDocNo, payload) เดิม
-- (ลบของเก่าทิ้งแล้วเขียนใหม่ทับเลขที่เอกสารเดิม เหมือนต้นฉบับ)
-- ─────────────────────────────────────────────
create or replace function update_expense_record(
  p_old_doc_number text,
  p_store_name text,
  p_event_date date,
  p_attendees int,
  p_work_days int,
  p_internal_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_item jsonb;
  v_seq int := 0;
begin
  delete from expense_records where doc_number = p_old_doc_number;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note
    ) values (
      p_old_doc_number, v_seq, trim(p_store_name), p_event_date, coalesce(p_attendees, 0), coalesce(p_work_days, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(p_internal_note, ''))
    );
  end loop;

  return jsonb_build_object('success', true, 'docNo', p_old_doc_number, 'rowsSaved', v_seq);
end;
$$;

-- ─────────────────────────────────────────────
-- request_delete_record — พอร์ตจาก requestDelete(docNo, requestedBy) เดิม
-- ─────────────────────────────────────────────
create or replace function request_delete_record(p_doc_number text, p_requested_by text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_edit_id text := 'EDT' || (extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  insert into pending_edits (edit_id, original_sheet_name, original_row_id, requested_by, status)
  values (v_edit_id, 'บันทึกค่าใช้จ่าย', p_doc_number, p_requested_by, 'pending_delete');

  perform add_notification('Admin', '', format('%s ขอลบเอกสาร %s', p_requested_by, p_doc_number), p_doc_number);
  perform write_audit_log(p_requested_by, 'REQUEST_DELETE', 'Pending_Edits', 'ขอลบเอกสาร: ' || p_doc_number);

  return jsonb_build_object('success', true, 'editId', v_edit_id, 'message', 'ส่งคำขอลบเรียบร้อย รอ Admin อนุมัติ');
end;
$$;

-- ─────────────────────────────────────────────
-- request_edit_record — พอร์ตจาก requestEdit(oldDocNo, newPayload, requestedBy) เดิม
-- ─────────────────────────────────────────────
create or replace function request_edit_record(p_old_doc_number text, p_new_payload jsonb, p_requested_by text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_edit_id text := 'EDT' || (extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  insert into pending_edits (edit_id, original_sheet_name, original_row_id, requested_by, new_data_json, status)
  values (v_edit_id, 'บันทึกค่าใช้จ่าย', p_old_doc_number, p_requested_by, p_new_payload, 'pending_edit');

  perform add_notification('Admin', '', format('%s ขอแก้ไขเอกสาร %s', p_requested_by, p_old_doc_number), p_old_doc_number);
  perform write_audit_log(p_requested_by, 'REQUEST_EDIT', 'Pending_Edits', 'ขอแก้ไขเอกสาร: ' || p_old_doc_number);

  return jsonb_build_object('success', true, 'editId', v_edit_id, 'message', 'ส่งคำขอแก้ไขเรียบร้อย รอ Admin อนุมัติ');
end;
$$;

-- ─────────────────────────────────────────────
-- approve_edit_record — พอร์ตจาก approveEdit(editId) เดิม
-- ใช้ advisory lock แทน LockService (กัน 2 admin กดพร้อมกัน)
-- เพิ่ม p_actor_id + เช็ค role ผู้บริหาร ก่อนอนุมัติ (ของเดิมพึ่งพาแค่ frontend ซ่อนปุ่ม
-- ซึ่งไม่ปลอดภัยพอสำหรับ RPC ที่เรียกตรงได้ — จึงเพิ่มการเช็คสิทธิ์ฝั่ง DB ให้)
-- ─────────────────────────────────────────────
create or replace function approve_edit_record(p_edit_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_role text;
  v_row pending_edits%rowtype;
  v_payload jsonb;
  v_item jsonb;
  v_seq int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_approve_' || p_edit_id));

  select role into v_role from users where id = p_actor_id;
  if v_role is distinct from 'ผู้บริหาร' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะผู้บริหารเท่านั้นที่อนุมัติได้');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status is distinct from 'pending_edit' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  v_payload := coalesce(v_row.new_data_json, '{}'::jsonb);
  delete from expense_records where doc_number = v_row.original_row_id;
  for v_item in select * from jsonb_array_elements(coalesce(v_payload->'items', '[]'::jsonb)) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note
    ) values (
      v_row.original_row_id, v_seq, trim(v_payload->>'storeName'), (v_payload->>'eventDate')::date,
      coalesce((v_payload->>'attendees')::int, 0), coalesce((v_payload->>'workDays')::int, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(v_payload->>'internalNote', ''))
    );
  end loop;

  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอแก้ไขเอกสาร %s ถูกอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_EDIT', 'Pending_Edits', 'อนุมัติแก้ไข: ' || p_edit_id);

  return jsonb_build_object('success', true, 'message', 'อนุมัติการแก้ไขสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- approve_delete_record — พอร์ตจาก approveDelete(editId) เดิม (+ เช็คสิทธิ์เช่นเดียวกัน)
-- ─────────────────────────────────────────────
create or replace function approve_delete_record(p_edit_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_role text;
  v_row pending_edits%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_approve_' || p_edit_id));

  select role into v_role from users where id = p_actor_id;
  if v_role is distinct from 'ผู้บริหาร' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะผู้บริหารเท่านั้นที่อนุมัติได้');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status is distinct from 'pending_delete' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  delete from expense_records where doc_number = v_row.original_row_id;
  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอลบเอกสาร %s ได้รับการอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_DELETE', 'Pending_Edits', format('อนุมัติลบ: %s, docNo: %s', p_edit_id, v_row.original_row_id));

  return jsonb_build_object('success', true, 'message', 'อนุมัติการลบสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- reject_pending_record — พอร์ตจาก rejectPending(editId, adminNote) เดิม
-- ─────────────────────────────────────────────
create or replace function reject_pending_record(p_edit_id text, p_admin_note text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_role text;
  v_row pending_edits%rowtype;
begin
  select role into v_role from users where id = p_actor_id;
  if v_role is distinct from 'ผู้บริหาร' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะผู้บริหารเท่านั้นที่ปฏิเสธคำขอได้');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  update pending_edits set status = 'rejected', admin_note = coalesce(p_admin_note, ''), processed_at = now()
  where edit_id = p_edit_id;

  perform add_notification('', v_row.requested_by, format('คำขอสำหรับเอกสาร %s ถูกปฏิเสธ: %s', v_row.original_row_id, coalesce(p_admin_note, '-')), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'REJECT_PENDING', 'Pending_Edits', 'ปฏิเสธคำขอ: ' || p_edit_id);

  return jsonb_build_object('success', true, 'message', 'ปฏิเสธคำขอสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_pending_requests — พอร์ตจาก getPendingRequests() เดิม
-- ─────────────────────────────────────────────
create or replace function get_pending_requests()
returns setof pending_edits
language sql
security definer
as $$
  select * from pending_edits order by request_timestamp desc;
$$;

-- ============================================================
-- หมายเหตุที่ตั้งใจคงพฤติกรรมเดิมไว้ (ไม่ได้แก้เอง เพราะไม่ได้ถูกขอ):
-- ฟังก์ชัน get_notifications (เฟส 3) จะสืบทอด "บั๊ก" จาก getNotifications เดิม
-- ที่ target_user ว่าง (Admin broadcast) จะโชว์ให้ "ทุกคน" เห็นไม่ใช่แค่ role
-- ผู้บริหาร เพราะเงื่อนไข matchUser เดิมเป็น OR ที่หลวมเกินไป — ถ้าต้องการแก้จริง
-- ให้แจ้งเป็นงานแยกต่างหาก จะได้ไม่ปนกับการพอร์ตแบบ 1:1 รอบนี้
-- ============================================================

```

---

### 📄 File: `supabase\phase3b_permissions.sql`
```sql
-- ============================================================
-- GoCost — Phase 3b SQL: ระบบสิทธิ์เข้าถึงหน้า/ฟีเจอร์ (รันต่อจาก phase3_notifications_users.sql)
-- ฟีเจอร์ใหม่ตามที่ตกลง — ไม่มีอยู่ในต้นฉบับ Code.js เลย (ของเดิมมีแค่คอลัมน์
-- page_permissions เปล่าๆ ที่ไม่เคยมี UI ให้แก้ไขจริง)
--
-- หลักการ:
-- - "role" (เซลล์/ผู้บริหาร/บัญชี) ยังอยู่เหมือนเดิม ใช้เป็นค่า default
-- - "page_permissions" (ใหม่) คือรายการหน้า/ฟีเจอร์ที่ user คนนั้นเข้าถึงได้จริง
--   ผู้ที่มี role = 'ผู้บริหาร' (แมปกับคำว่า "ADMIN" ที่คุณใช้ในบทสนทนา — ถ้าหมายถึง
--   role อื่น แจ้งกลับมาได้ จะแก้ mapping ให้) จะเข้าถึงได้ "ทุกหน้าเสมอ" โดยอัตโนมัติ
--   ไม่ขึ้นกับ page_permissions เพื่อกันการล็อกตัวเองออกจากระบบโดยไม่ตั้งใจ
-- - เฉพาะ role = 'ผู้บริหาร' เท่านั้นที่แก้ไข page_permissions ของคนอื่นได้
-- ============================================================

alter table users add column if not exists page_permissions jsonb not null default '[]'::jsonb;

-- ─────────────────────────────────────────────
-- has_page_permission — helper กลาง เรียกใช้ในทุก RPC ที่ต้องเช็คสิทธิ์
-- ─────────────────────────────────────────────
create or replace function has_page_permission(p_user_id text, p_page_key text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_role text;
  v_perms jsonb;
begin
  select role, page_permissions into v_role, v_perms from users where id = p_user_id;
  if v_role is null then return false; end if;
  if v_role = 'ผู้บริหาร' then return true; end if;
  return coalesce(v_perms, '[]'::jsonb) ? p_page_key;
end;
$$;

-- ─────────────────────────────────────────────
-- update_user_permissions — เปิด/ปิดสิทธิ์เข้าถึงหน้า/ฟีเจอร์ของ user คนหนึ่ง
-- เฉพาะ role 'ผู้บริหาร' เท่านั้นที่เรียกได้ (เช็ค role ตรงๆ ไม่ผ่าน has_page_permission
-- เพื่อกัน edge case ที่ role ผู้บริหาร ถูกลบสิทธิ์ตัวเองจนล็อกระบบ)
-- แจ้งเตือนไปหา user เป้าหมายพร้อมสรุปว่าได้/เสียสิทธิ์อะไรไปบ้าง
-- ─────────────────────────────────────────────
create or replace function update_user_permissions(
  p_target_user_id text,
  p_new_page_keys jsonb,
  p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor_role text;
  v_old_perms jsonb;
  v_added text[];
  v_removed text[];
  v_message text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  if v_actor_role is distinct from 'ผู้บริหาร' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ Admin (role ผู้บริหาร) เท่านั้นที่แก้ไขสิทธิ์ผู้อื่นได้');
  end if;

  select page_permissions into v_old_perms from users where id = p_target_user_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบผู้ใช้นี้');
  end if;
  v_old_perms := coalesce(v_old_perms, '[]'::jsonb);

  select array_agg(v) into v_added
  from jsonb_array_elements_text(p_new_page_keys) v
  where not (v_old_perms ? v);

  select array_agg(v) into v_removed
  from jsonb_array_elements_text(v_old_perms) v
  where not (p_new_page_keys ? v);

  update users set page_permissions = p_new_page_keys where id = p_target_user_id;

  v_message := '';
  if v_added is not null and array_length(v_added, 1) > 0 then
    v_message := v_message || 'ได้รับสิทธิ์เข้าถึง: ' || array_to_string(v_added, ', ');
  end if;
  if v_removed is not null and array_length(v_removed, 1) > 0 then
    if v_message <> '' then v_message := v_message || ' | '; end if;
    v_message := v_message || 'ถูกปิดสิทธิ์: ' || array_to_string(v_removed, ', ');
  end if;
  if v_message = '' then
    v_message := 'สิทธิ์การเข้าถึงของคุณไม่มีการเปลี่ยนแปลง';
  end if;

  perform add_notification('', p_target_user_id, v_message, p_target_user_id);
  perform write_audit_log(p_actor_id, 'UPDATE_PERMISSIONS', 'User',
    format('แก้ไขสิทธิ์ของ %s — %s', p_target_user_id, v_message));

  return jsonb_build_object('success', true, 'message', 'บันทึกสิทธิ์การเข้าถึงสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_users — เพิ่ม page_permissions ในผลลัพธ์ (ยังไม่คืน password/hash เหมือนเดิม)
-- ต้อง drop ก่อนเพราะเปลี่ยน return signature จากเฟส 3 เดิม
-- ─────────────────────────────────────────────
drop function if exists get_users();
create or replace function get_users()
returns table (id text, role text, name text, full_name text, email text, page_permissions jsonb, created_at timestamptz)
language sql
security definer
as $$
  select id, role, name, full_name, email, page_permissions, created_at from users order by created_at desc;
$$;

-- ─────────────────────────────────────────────
-- save_user — เพิ่มการเช็คสิทธิ์ผู้เรียกฝั่ง server (ของเดิม/เฟส 3 เดิมไม่เคยเช็คเลย
-- เป็นช่องโหว่จริงที่พบระหว่างทำเฟสนี้ ถือโอกาสปิดไปด้วย) + กำหนด default
-- page_permissions ให้ user ใหม่ตาม role (แก้ไขทีหลังผ่านแผงสิทธิ์ได้เสมอ)
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select exists(select 1 from users where id = p_id) into v_exists;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ผู้บริหาร' then '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- ─────────────────────────────────────────────
-- delete_user — เพิ่มการเช็คสิทธิ์ผู้เรียกเช่นเดียวกับ save_user
-- ─────────────────────────────────────────────
create or replace function delete_user(p_user_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if p_user_id = p_actor_id then
    return jsonb_build_object('success', false, 'message', 'ไม่สามารถลบบัญชีของตัวเองได้');
  end if;

  delete from users where id = p_user_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบ User นี้');
  end if;
  perform write_audit_log(coalesce(p_actor_id, 'SYSTEM'), 'DELETE_USER', 'User', 'ลบ user: ' || p_user_id);
  return jsonb_build_object('success', true, 'message', format('ลบ User %s สำเร็จ', p_user_id));
end;
$$;

-- ─────────────────────────────────────────────
-- get_audit_logs / get_pending_requests — เดิม (เฟส 2-3) ไม่เช็คสิทธิ์ผู้เรียกเลย
-- เพิ่ม p_actor_id + has_page_permission เข้าไปตอนนี้ (breaking change ของ signature
-- เดิม จึงต้อง drop ก่อน create ใหม่)
-- ─────────────────────────────────────────────
drop function if exists get_audit_logs(int);
create or replace function get_audit_logs(p_actor_id text, p_limit int default 200)
returns setof audit_logs
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'audit-log') then
    raise exception 'คุณไม่มีสิทธิ์ดูบันทึกกิจกรรม';
  end if;
  return query select * from audit_logs order by "timestamp" desc limit p_limit;
end;
$$;

drop function if exists get_pending_requests();
create or replace function get_pending_requests(p_actor_id text)
returns setof pending_edits
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'pending-edits') then
    raise exception 'คุณไม่มีสิทธิ์ดูคำขออนุมัติ';
  end if;
  return query select * from pending_edits order by request_timestamp desc;
end;
$$;

-- ─────────────────────────────────────────────
-- approve_edit_record / approve_delete_record / reject_pending_record
-- เปลี่ยนจากเช็ค role = 'ผู้บริหาร' ตรงๆ เป็น has_page_permission(actor,'pending-edits')
-- ผลลัพธ์เหมือนเดิมทุกประการสำหรับ role ผู้บริหาร (เพราะ has_page_permission คืน true
-- ให้เสมอ) แต่ตอนนี้ Admin สามารถมอบสิทธิ์อนุมัติให้ role อื่นได้ผ่านแผงสิทธิ์ใหม่ด้วย
-- ─────────────────────────────────────────────
create or replace function approve_edit_record(p_edit_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row pending_edits%rowtype;
  v_payload jsonb;
  v_item jsonb;
  v_seq int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_approve_' || p_edit_id));

  if not has_page_permission(p_actor_id, 'pending-edits') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์อนุมัติคำขอ');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status is distinct from 'pending_edit' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  v_payload := coalesce(v_row.new_data_json, '{}'::jsonb);
  delete from expense_records where doc_number = v_row.original_row_id;
  for v_item in select * from jsonb_array_elements(coalesce(v_payload->'items', '[]'::jsonb)) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note
    ) values (
      v_row.original_row_id, v_seq, trim(v_payload->>'storeName'), (v_payload->>'eventDate')::date,
      coalesce((v_payload->>'attendees')::int, 0), coalesce((v_payload->>'workDays')::int, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(v_payload->>'internalNote', ''))
    );
  end loop;

  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอแก้ไขเอกสาร %s ถูกอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_EDIT', 'Pending_Edits', 'อนุมัติแก้ไข: ' || p_edit_id);

  return jsonb_build_object('success', true, 'message', 'อนุมัติการแก้ไขสำเร็จ');
end;
$$;

create or replace function approve_delete_record(p_edit_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row pending_edits%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_approve_' || p_edit_id));

  if not has_page_permission(p_actor_id, 'pending-edits') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์อนุมัติคำขอ');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status is distinct from 'pending_delete' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  delete from expense_records where doc_number = v_row.original_row_id;
  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอลบเอกสาร %s ได้รับการอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_DELETE', 'Pending_Edits', format('อนุมัติลบ: %s, docNo: %s', p_edit_id, v_row.original_row_id));

  return jsonb_build_object('success', true, 'message', 'อนุมัติการลบสำเร็จ');
end;
$$;

create or replace function reject_pending_record(p_edit_id text, p_admin_note text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row pending_edits%rowtype;
begin
  if not has_page_permission(p_actor_id, 'pending-edits') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ปฏิเสธคำขอ');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  update pending_edits set status = 'rejected', admin_note = coalesce(p_admin_note, ''), processed_at = now()
  where edit_id = p_edit_id;

  perform add_notification('', v_row.requested_by, format('คำขอสำหรับเอกสาร %s ถูกปฏิเสธ: %s', v_row.original_row_id, coalesce(p_admin_note, '-')), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'REJECT_PENDING', 'Pending_Edits', 'ปฏิเสธคำขอ: ' || p_edit_id);

  return jsonb_build_object('success', true, 'message', 'ปฏิเสธคำขอสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- login_user — ขยายจากเฟส 1 เดิมให้คืน page_permissions มาด้วย เพื่อให้ frontend
-- กรองเมนูได้ทันทีหลัง login โดยไม่ต้องเรียก get_users เพิ่มอีกครั้ง
-- ─────────────────────────────────────────────
drop function if exists login_user(text, text);
create or replace function login_user(p_id text, p_password text)
returns table (id text, role text, name text, full_name text, email text, page_permissions jsonb)
language plpgsql
security definer
as $$
begin
  return query
  select u.id, u.role, u.name, u.full_name, u.email, u.page_permissions
  from users u
  where u.id = p_id
    and u.password_hash = crypt(p_password, u.password_hash);
end;
$$;

-- ─────────────────────────────────────────────
-- ให้ user ที่มีอยู่แล้วก่อนหน้านี้ (สร้างตอนเฟส 1-3 ก่อนมีระบบสิทธิ์) ได้ page_permissions
-- ที่สมเหตุสมผลตาม role เดิมของแต่ละคน แทนที่จะเป็น [] ว่างเปล่า (ซึ่งจะทำให้ล็อกไม่เห็น
-- เมนูอะไรเลยหลังรัน migration นี้) — รันครั้งเดียวตอน migrate
-- ─────────────────────────────────────────────
update users set page_permissions = '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log"]'::jsonb
where role = 'ผู้บริหาร' and page_permissions = '[]'::jsonb;

update users set page_permissions = '["dashboard","expense-entry","expense-history"]'::jsonb
where role <> 'ผู้บริหาร' and page_permissions = '[]'::jsonb;

```

---

### 📄 File: `supabase\phase3c_admin_role.sql`
```sql
-- ============================================================
-- GoCost — Phase 3c SQL (รันต่อจาก phase3b_permissions.sql)
-- แก้ไขตามที่คุยกัน: แยก role "ADMIN" ออกมาเป็น superuser เดี่ยวๆ ที่ทำได้ทุกอย่าง
-- เสมอ ส่วน "ผู้บริหาร" (และ role อื่นทั้งหมด) กลายเป็น role ธรรมดาที่ต้องรอ ADMIN
-- ตั้งค่า page_permissions ให้ก่อน ถึงจะเข้าถึงหน้า/ทำอะไรได้ — ไม่มี auto full-access
-- ให้ role ไหนอีกต่อไป (ต่างจาก phase3b เดิมที่ผู้บริหาร = auto full-access)
-- ============================================================

-- ─────────────────────────────────────────────
-- has_page_permission — เปลี่ยนจาก role='ผู้บริหาร' เป็น role='ADMIN' เท่านั้น
-- ที่ bypass การเช็คสิทธิ์ได้เสมอ role อื่นทั้งหมดต้องมี page_key อยู่ใน
-- page_permissions จริงๆ ถึงจะผ่าน (รวมถึง 'ผู้บริหาร' ด้วย)
-- ─────────────────────────────────────────────
create or replace function has_page_permission(p_user_id text, p_page_key text)
returns boolean
language plpgsql
security definer
as $$
declare
  v_role text;
  v_perms jsonb;
begin
  select role, page_permissions into v_role, v_perms from users where id = p_user_id;
  if v_role is null then return false; end if;
  if v_role = 'ADMIN' then return true; end if;
  return coalesce(v_perms, '[]'::jsonb) ? p_page_key;
end;
$$;

-- ─────────────────────────────────────────────
-- update_user_permissions — เฉพาะ role 'ADMIN' เท่านั้นที่แก้ไขสิทธิ์คนอื่นได้
-- (เดิมเช็ค 'ผู้บริหาร' ในเฟส 3b — ตอนนี้เปลี่ยนเป็น 'ADMIN' ตามที่คุยกัน)
-- ─────────────────────────────────────────────
create or replace function update_user_permissions(
  p_target_user_id text,
  p_new_page_keys jsonb,
  p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor_role text;
  v_old_perms jsonb;
  v_added text[];
  v_removed text[];
  v_message text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  if v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขสิทธิ์ผู้อื่นได้');
  end if;

  select page_permissions into v_old_perms from users where id = p_target_user_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบผู้ใช้นี้');
  end if;
  v_old_perms := coalesce(v_old_perms, '[]'::jsonb);

  select array_agg(v) into v_added
  from jsonb_array_elements_text(p_new_page_keys) v
  where not (v_old_perms ? v);

  select array_agg(v) into v_removed
  from jsonb_array_elements_text(v_old_perms) v
  where not (p_new_page_keys ? v);

  update users set page_permissions = p_new_page_keys where id = p_target_user_id;

  v_message := '';
  if v_added is not null and array_length(v_added, 1) > 0 then
    v_message := v_message || 'ได้รับสิทธิ์เข้าถึง: ' || array_to_string(v_added, ', ');
  end if;
  if v_removed is not null and array_length(v_removed, 1) > 0 then
    if v_message <> '' then v_message := v_message || ' | '; end if;
    v_message := v_message || 'ถูกปิดสิทธิ์: ' || array_to_string(v_removed, ', ');
  end if;
  if v_message = '' then
    v_message := 'สิทธิ์การเข้าถึงของคุณไม่มีการเปลี่ยนแปลง';
  end if;

  perform add_notification('', p_target_user_id, v_message, p_target_user_id);
  perform write_audit_log(p_actor_id, 'UPDATE_PERMISSIONS', 'User',
    format('แก้ไขสิทธิ์ของ %s — %s', p_target_user_id, v_message));

  return jsonb_build_object('success', true, 'message', 'บันทึกสิทธิ์การเข้าถึงสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- save_user — อัปเดต 2 จุด:
-- 1. default page_permissions ใหม่ตามโมเดล role ที่เปลี่ยนไป (ผู้บริหารไม่ auto
--    full-access อีกต่อไป ได้แค่ค่า default ที่พอทำงานอนุมัติได้ ต้องให้ ADMIN
--    เปิดเพิ่มเองถ้าต้องการหน้าอื่น)
-- 2. กันการยกระดับสิทธิ์ (privilege escalation): ถ้า p_role ที่จะตั้งคือ 'ADMIN'
--    ผู้เรียก (actor) ต้องมี role = 'ADMIN' เท่านั้น — ป้องกันกรณี ADMIN มอบสิทธิ์
--    หน้า "users" ให้ผู้บริหารไปช่วยจัดการพนักงาน แล้วผู้บริหารคนนั้นแอบสร้าง/
--    เลื่อนใครเป็น ADMIN เองโดยไม่ได้รับอนุญาต
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_actor_role text;
  v_current_role text;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select role into v_actor_role from users where id = p_actor_id;

  select exists(select 1 from users where id = p_id) into v_exists;
  if v_exists then select role into v_current_role from users where id = p_id; end if;

  -- กันการยกระดับเป็น ADMIN โดยผู้ที่ไม่ใช่ ADMIN เอง (ทั้งสร้างใหม่และแก้ไขของเดิม)
  if p_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ตั้งค่าหรือมอบ role ADMIN ให้ผู้อื่นได้');
  end if;
  if v_exists and v_current_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบัญชี ADMIN ได้');
  end if;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ADMIN' then '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log"]'::jsonb
      when p_role = 'ผู้บริหาร' then '["dashboard","expense-entry","expense-history","pending-edits"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- ============================================================
-- สร้างบัญชี ADMIN ตัวแรกให้เลย (แทนขั้นตอน manual เดิม) — ปลอดภัยที่จะรันซ้ำ
-- เพราะใช้ ON CONFLICT DO NOTHING: ถ้ามี user id 'ADMIN' อยู่แล้วจะข้ามไปเฉยๆ
-- ไม่เขียนทับรหัสผ่านเดิมโดยไม่ตั้งใจ
--
-- ⚠️ ID/Password ด้านล่าง (ADMIN / ADMIN1234) เดาง่ายมาก เหมาะแค่ตอนตั้งระบบ
-- ครั้งแรกเท่านั้น — เข้าไปเปลี่ยนรหัสผ่านทันทีผ่านหน้า "จัดการผู้ใช้งาน"
-- หลัง login ครั้งแรกก่อนใช้งานจริงกับข้อมูลจริง
-- ============================================================
insert into users (id, password_hash, role, name, full_name, email, page_permissions)
values (
  'ADMIN',
  crypt('ADMIN1234', gen_salt('bf')),
  'ADMIN',
  'Admin',
  'ผู้ดูแลระบบ',
  null,
  '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log"]'::jsonb
)
on conflict (id) do nothing;


```

---

### 📄 File: `supabase\phase3_notifications_users.sql`
```sql
-- ============================================================
-- GoCost — Phase 3 SQL (รันต่อจาก phase2_workflow.sql)
-- พอร์ตจาก Code.js: getNotifications, markNotificationRead, addNotification (มีแล้ว),
-- getUsers, saveUser, deleteUser — พฤติกรรมเดิมทุกจุด "ยกเว้น" การเก็บรหัสผ่าน
-- ที่เปลี่ยนจาก plaintext (ของเดิม) เป็น bcrypt hash เสมอ (ดูหมายเหตุท้ายไฟล์)
-- ============================================================

-- ─────────────────────────────────────────────
-- get_notifications — พอร์ตจาก getNotifications(targetRole, targetUser) เดิม
-- คงพฤติกรรม matchUser เดิมไว้ทุกจุดรวมถึงบั๊กที่กล่าวถึงด้านบน (broadcast ไปทุกคน
-- เมื่อ target_user ว่าง) เพื่อให้ผลลัพธ์ตรงกับระบบเดิม 100%
-- ─────────────────────────────────────────────
create or replace function get_notifications(p_target_role text, p_target_user text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_notifs jsonb;
  v_unread int;
begin
  select coalesce(jsonb_agg(row_to_json(t) order by t.created_at desc), '[]'::jsonb),
         count(*) filter (where t.status = 0)
  into v_notifs, v_unread
  from (
    select notif_id, target_role, target_user, message, link_id, status, created_at
    from notifications
    where (p_target_role is null or target_role = p_target_role)
       or (p_target_user is null or target_user = p_target_user or target_user = '')
    order by created_at desc
    limit 50
  ) t;

  return jsonb_build_object('success', true, 'notifications', coalesce(v_notifs, '[]'::jsonb), 'unreadCount', coalesce(v_unread, 0));
end;
$$;

-- ─────────────────────────────────────────────
-- mark_notification_read — พอร์ตจาก markNotificationRead(notifId) เดิม
-- ─────────────────────────────────────────────
create or replace function mark_notification_read(p_notif_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  update notifications set status = 1 where notif_id = p_notif_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบ Notification นี้');
  end if;
  return jsonb_build_object('success', true);
end;
$$;

-- ─────────────────────────────────────────────
-- get_users — พอร์ตจาก getUsers() เดิม (ไม่คืน password/password_hash กลับไปเลย
-- ต่างจากของเดิมที่คืน column password ตรงๆ — เป็นการปรับปรุงด้านความปลอดภัยที่ตั้งใจ)
-- ─────────────────────────────────────────────
create or replace function get_users()
returns table (id text, role text, name text, full_name text, email text, created_at timestamptz)
language sql
security definer
as $$
  select id, role, name, full_name, email, created_at from users order by created_at desc;
$$;

-- ─────────────────────────────────────────────
-- save_user — พอร์ตจาก saveUser(userData) เดิม
-- ต่างจากเดิม 1 จุดโดยตั้งใจ: hash รหัสผ่านด้วย bcrypt ก่อนเก็บเสมอ
-- (ของเดิมเก็บ plaintext ตรงๆ — เป็นช่องโหว่ที่ไม่ควร port ตามมา)
-- p_password: ส่งมาเมื่อสร้างใหม่หรือต้องการเปลี่ยนรหัสผ่าน, ปล่อย null = ไม่เปลี่ยนรหัสผ่านเดิม
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
begin
  select exists(select 1 from users where id = p_id) into v_exists;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    insert into users (id, password_hash, role, name, full_name, email)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''));
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- ─────────────────────────────────────────────
-- delete_user — พอร์ตจาก deleteUser(userId) เดิม
-- ─────────────────────────────────────────────
create or replace function delete_user(p_user_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  delete from users where id = p_user_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบ User นี้');
  end if;
  perform write_audit_log(coalesce(p_actor_id, 'SYSTEM'), 'DELETE_USER', 'User', 'ลบ user: ' || p_user_id);
  return jsonb_build_object('success', true, 'message', format('ลบ User %s สำเร็จ', p_user_id));
end;
$$;

-- ─────────────────────────────────────────────
-- get_audit_logs — เดิมไม่มี "getAuditLogs" ใน Code.js (Audit_Logs sheet เขียนได้
-- อย่างเดียวจาก UI เดิม ไม่มีหน้าดูย้อนหลัง) เพิ่มให้เป็นฟีเจอร์ใหม่ตามที่ตกลง
-- ไว้ในแผนเฟส 3 — ไม่ใช่การพอร์ต 1:1 เพราะของเดิมไม่มีฟังก์ชันนี้ให้พอร์ต
-- ─────────────────────────────────────────────
create or replace function get_audit_logs(p_limit int default 200)
returns setof audit_logs
language sql
security definer
as $$
  select * from audit_logs order by "timestamp" desc limit p_limit;
$$;


```

---

### 📄 File: `supabase\phase4a_stores.sql`
```sql
-- ============================================================
-- GoCost — Phase 4a: ตารางร้านค้า/ลูกค้า (รันก่อน phase4a_stores_seed.sql)
-- ใช้เป็นแหล่งข้อมูลของ dropdown ค้นหาร้านค้าตอนสร้างคำขอ Workshop
-- ============================================================

create table if not exists stores (
  id                bigint generated always as identity primary key,
  customer_code     text,               -- รหัสลูกค้าจากไฟล์เดิม (ไม่ unique — พบโค้ดซ้ำ/placeholder ในข้อมูลจริง)
  name              text not null,
  region            text,               -- ภาค
  province          text,               -- จังหวัด/อำเภอ/เขต
  address           text,
  phone             text,
  assigned_sales_id text references users(id),  -- ไม่มีในไฟล์ต้นฉบับ — ต้องกำหนดทีหลังเอง
  created_at        timestamptz not null default now()
);

create index if not exists idx_stores_name on stores using gin (to_tsvector('simple', name));
create index if not exists idx_stores_customer_code on stores(customer_code);

alter table stores enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- search_stores — ใช้กับ dropdown ค้นหาร้านค้า พิมพ์ชื่อ/รหัส/จังหวัดแล้วค้นได้
-- คืนชื่อเซลล์ที่สังกัดมาด้วย (ถ้ามีการกำหนดไว้)
-- ─────────────────────────────────────────────
create or replace function search_stores(p_query text)
returns table (
  id bigint, customer_code text, name text, region text, province text,
  assigned_sales_id text, assigned_sales_name text
)
language sql
security definer
as $$
  select s.id, s.customer_code, s.name, s.region, s.province,
         s.assigned_sales_id, u.name as assigned_sales_name
  from stores s
  left join users u on u.id = s.assigned_sales_id
  where p_query is null or trim(p_query) = ''
     or s.name ilike '%' || p_query || '%'
     or s.customer_code ilike '%' || p_query || '%'
     or s.province ilike '%' || p_query || '%'
     or s.region ilike '%' || p_query || '%'
  order by s.name
  limit 20;
$$;

-- ─────────────────────────────────────────────
-- assign_store_salesperson — กำหนด/เปลี่ยนเซลล์ที่สังกัดร้าน (ต้องมีสิทธิ์หน้า users
-- หรือ workshop-plan เป็นผู้กำหนด — ใช้ 'users' เพราะเป็นงานเชิงจัดการข้อมูลบุคคล)
-- ─────────────────────────────────────────────
create or replace function assign_store_salesperson(p_store_id bigint, p_sales_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์กำหนดเซลล์ประจำร้าน');
  end if;
  update stores set assigned_sales_id = nullif(p_sales_id, '') where id = p_store_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;
  return jsonb_build_object('success', true, 'message', 'กำหนดเซลล์ประจำร้านสำเร็จ');
end;
$$;

```

---

### 📄 File: `supabase\phase4a_stores_seed.sql`
```sql
-- ============================================================
-- GoCost — Phase 4a seed data: stores.csv (รายชื่อร้านค้า/ลูกค้า)
-- นำเข้าจากไฟล์ที่คุณส่งมา (482 ร้าน หลังตัดแถวซ้ำออก 147 แถวจาก 629 แถวต้นฉบับ)
-- คอลัมน์ 'เซลล์ที่สังกัด' ไม่มีในไฟล์ต้นฉบับ จึงปล่อยว่างไว้ (assigned_sales_id = null)
-- ต้องเข้าไปกำหนดทีหลังผ่านหน้า 'จัดการร้านค้า' เอง
-- ============================================================

insert into stores (customer_code, name, region, province, address, phone) values
('10003', 'กะจะสวย โดย นางสาวตรีณัฐ แดงบาง', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 1231-1233 อาคารตลาดนัดจตุจักร 2 ถนนสีหบุรานุกิจ', '061-939-6295'),
('10042', 'ญานี บิวตี้', 'ภาคอีสาน', 'อำนาจเจริญ', 'เลขที่ 288/351-352 หมู่ที่ 9', '084-9361424'),
('10076', 'น้ำหวานบิวตี้', 'ภาคเหนือ', 'เชียงราย', 'เลขที่ 486/7 หมู่ที่ 9', ''),
('10126', 'ศิริอาภรณ์', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'ริมน้ำ', ''),
('10136', 'วีแอนด์พี บิวตี้ลิสซ์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', 'เลขที่ 888/16 ถนนราษฏร์บรรจบ', '081-880-4676'),
('10199', 'คิวเทน', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 48/53 ถนนสายไหม', '083-975-1556'),
('10221', 'ดูดีบิวตี้ซัพพลาย', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 2 ซอยจันทน์ 16 ถนนทนุรัตน์', '087-489-9252(หลัก),02-678-8898'),
('10225', 'ตั้งเป็งเชียง 2', 'ภาคอีสาน', 'นครราชสีมา', 'เลขที่ 555 หมู่ที่ 1', ''),
('10251', 'อูอา จำกัด', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เลขที่ 85/55-57 ถนนเพชรเกษม', '095-539-9236'),
('10258', 'ใบหม่อนบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 2/14 ตลาดถนอมมิตร ซอยวัชรพล', '02-347-0261'),
('10283', 'พิศมัย บิวตี้ ซาลอน จำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 299/2 ถนนพุทธมณฑล สาย2', '812070869'),
('10309', 'เลิศพานิช', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 76-78 ถนนอุดมสุข', '02-743-6121'),
('10349', 'หจก.กานต์ บิวตี้', 'ภาคอีสาน', 'ร้อยเอ็ด', 'เลขที่ 6/9 ถนนมีโชคชัย', '043-513-342'),
('10350', 'กลางเวียง บิวตี้มาร์ท จำกัด', 'ภาคเหนือ', 'พะเยา', 'เลขที่ 7/16 ถนนประตูกลอง 1', '081-671-3069'),
('10352', 'แคชบิวตี้ จำกัด', 'ภาคเหนือ', 'แพร่', 'เลขที่ 400/27-28 หมู่ที่ 2', '054-534-322'),
('10353', 'เคทีเจ บิวตี้ จำกัด', 'ภาคอีสาน', 'อุบลราชธานี', 'เลขที่ 479 ถนนสรรพสิทธิ์', '086-465-2553,045-241-324'),
('10354', 'จ.เจริญ', 'ภาคเหนือ', 'พะเยา', 'เลขที่ 424 หมู่ที่ 15', '086-6722555,054-451-406'),
('10355', 'แจนบิวตี้', 'ภาคเหนือ', 'ลำปาง', 'เลขที่ 74/1 ถนน ลำปาง- แม่ทะ', '054-314378, 089-755-7747'),
('10356', 'เจเอ็ม คอสเมติกส์ (ไทยแลนด์) จำกัด', 'ภาคอีสาน', 'นครราชสีมา', 'เลขที่ 1119/4,5,6,7 ถนนสุรนารายณ์', '087-353-2289'),
('10357', 'ชุติมา คอนเนค จำกัด', 'ภาคเหนือ', 'ตาก', 'เลขที่ 88/4 ถนนมหาดไทยบำรุง', '061-2673766 086-677-4270 098-774-2466'),
('10358', 'โชคประสิทธิ', 'ภาคเหนือ', 'แพร่', 'เลขที่ 18/18 ถนนราษฎร์ดำเนิน', '081-531-1606,054-521-907'),
('10360', 'ซ่องฮวดพานิช', 'ภาคเหนือ', 'ลำปาง', 'เลขที่ 128-128/1 ถนนทิพย์ช้าง', '054-226-470'),
('10362', 'ดาวบิวตี้', 'ภาคเหนือ', 'ลำพูน', 'เลขที่ 118/1 ถนนรอบเมืองนอก', '053-534-728 081-473-3819'),
('10363', 'เตือนใจ', 'ภาคเหนือ', 'อุตรดิตถ์', 'เลขที่ 2/14 ถนนเจริญบัณฑิต', '089-858-3299'),
('10364', 'เตือน', 'ภาคอีสาน', 'ขอนแก่น', 'เลขที่ 289 หมู่ที่ 2 ถนนราชนิกูล', ''),
('10365', 'ทวีทรัพย์ 6', 'ภาคเหนือ', 'สุโขทัย', 'เลขที่ 35/78 หมู่ที่13 ถนนจรดวิถีถ่อง', '081-596-9529,055-611968'),
('10367', 'หจก.ทิพรัตน์บิวตี้', 'ภาคเหนือ', 'อุตรดิตถ์', 'เลขที่ 67,69,71 ถนนสุขเกษม', '055-414-956'),
('10369', 'ร้านนันท์บิวตี้', 'ภาคเหนือ', 'เชียงใหม่', 'เลขที่ 18/5 ถนนราชเชียงแสน', '053-276-214'),
('10370', 'นานาบิวตี้', 'ภาคเหนือ', 'กำแพงเพชร', 'เลขที่ 99 ถนนวิจิตร 2', '092-350-5723,055-021-400'),
('10372', 'บิวตี้เซ็นเตอร์ 9569 จำกัด', 'ภาคอีสาน', 'อุบลราชธานี', 'เลขที่ 5 ซอยธรรมวิถี 12 ถนนธรรมวิถี', '062-2263152 คุณอ้อ จัดซื้อ,094-935-5669'),
('10373', 'บิวตี้ฟูล', 'ภาคเหนือ', 'เชียงใหม่', 'เลขที่ 94 หมู่3 ถนนฝาง-ท่าตอน', '081-092-0564'),
('10374', 'บู๊', 'ภาคเหนือ', 'อุตรดิตถ์', 'เลขที่ 2/24 ถนนพาดวารี', '084-611-9690'),
('10375', 'ประดิษฐ์ (เชียงใหม่)', 'ภาคเหนือ', 'เชียงใหม่', 'เลขที่ 14 ซอย 2 ถนนวัวลาย', '053-276-800'),
('10376', 'ปั้นเกษา', 'ภาคเหนือ', 'สุโขทัย', 'เลขที่ 3/4 ถนนวิเชียรจำนงค์', '082-080-9769'),
('10377', 'แป้งบิวตี้', 'ภาคอีสาน', 'นครราชสีมา', 'เลขที่ 251-252 หมู่ที่ 16 ถนนชุมค้า', '081-917-1641'),
('10378', 'เฟื่องฟ้า', 'ภาคอีสาน', 'นครราชสีมา', 'เลขที่ 93 ถนนเทศบาล 19', '044-314221'),
('10380', 'หจก.มดบิวตี้ แอนด์ คอสเมติกส์', 'ภาคเหนือ', 'เชียงราย', 'เลขที่ 447-448/17 ถนนสิงหไคล', '053-715-005'),
('10381', 'มด บิวตี้ ตาก', 'ภาคเหนือ', 'ตาก', 'เลขที่ 55/20-21 ถนนมหาดไทยบำรุง', '081-941-6895'),
('10382', 'มีดีศูนย์รวมสุขภาพและความงาม', 'ภาคเหนือ', 'เชียงราย', 'เลขที่ 8 หมู่ที่ 15', '053-795-8074-8'),
('10383', 'มุกดามาพร้อม', 'ภาคอีสาน', 'มุกดาหาร', 'เลขที่ 79/15 ถนนสองนางสถิตย์', '081-638-8056,084-029-2687'),
('10384', 'เมืองมุกลับคม', 'ภาคอีสาน', 'มุกดาหาร', 'เลขที่ 70/20 ถนนมุกดาหาร-ดอนตาล', '085-262-8033'),
('10385', 'แมนมาพร้อม', 'ภาคอีสาน', 'ขอนแก่น', 'เลขที่ 46/10-11 ถนนประชาสโมสร', '043-236-514 081-717-2696'),
('10386', 'รินบิวตี้', 'ภาคเหนือ', 'พะเยา', 'เลขที่ 311/6 หมู่ที่ 6 ถนนอิสระ', '081-030-5070'),
('10388', 'เศกอุปกรณ์เสริมสวย', 'ภาคเหนือ', 'ตาก', 'เลขที่ 18/27 ถนนมหาดไทยบำรุง', '089-460-8457 055-516-562'),
('10389', 'สาบิวตี้', 'ภาคเหนือ', 'น่าน', 'เลขที่ 182 หมู่ที่ 4 ถนนเจ้าฟ้า', '098-746-7212'),
('10390', 'สมายด์ บิวตี้', 'ภาคอีสาน', 'ขอนแก่น', 'เลขที่ 231/8 ถนนมลิวรรณ', '084-615-1569'),
('10393', 'สารคามบิวตี้', 'ภาคอีสาน', 'มหาสารคาม', 'เลขที่ 788/3 หมู่ที่ 1', '092-975-9419'),
('10394', 'คุณสุดใจ พุทธิกานนท์', 'ภาคเหนือ', 'ตาก', 'เลขที่ 1/16 ถนนราชการราษฎรดำริ 1', '081-0493449'),
('10395', 'อรัญญาบิวตี้', 'ภาคเหนือ', 'เชียงใหม่', 'เลขที่ 32/43 หมู่ที่ 2', '061-2748877'),
('10396', 'อาร์มอุปกรณ์เสริมสวย', 'ภาคอีสาน', 'มหาสารคาม', 'เลขที่ 1112/371 ถนนผังเมืองบัญชา', '081-717-2120,043-741-139'),
('10397', 'อินเทรนบิวตี้เซ็นเตอร์', 'ภาคเหนือ', 'เชียงราย', 'เลขที่ 61 หมู่ที่ 10', '(085-0315045 ตามยอด)081-288-6605'),
('10398', 'หจก.เอบิวตี้', 'ภาคอีสาน', 'นครราชสีมา', 'เลขที่ 143 ถนนจักรี', '081-335-5341'),
('10399', 'ออลล์ เซนเตอร์ บิวตี้', 'ภาคอีสาน', 'มหาสารคาม', 'เลขที่ 240/3 หมู่ที่ 1', '098-1423700'),
('10400', 'กันเอง (นครนายก)', 'ภาคอีสาน', 'นครนายก', 'ขว-084/31-32 ถนนสุวรรณศร', '082-451-5511,073-320395'),
('10401', 'กาญจนา', 'ภาคกลาง/ตะวันออก', 'จันทบุรี', 'เลขที่ 82/3 ถนนท่าแฉลบ', '039-313-004'),
('10402', 'กิจเสรีเทรดดิ้ง', 'ภาคกลาง/ตะวันออก', 'พระนครศรีอยุธยา', 'เลขที่ 66 ถนนราเมศวร', '035-323-500'),
('10403', 'หจก.กิ๊ฟท์บิวตี้ระยอง', 'ภาคกลาง/ตะวันออก', 'ระยอง', 'เลขที่ 37,39,41,43 ซอยศูนย์การค้าสาย4 ถนนสุขุมวิท', '038-613-766,081-4835448'),
('10407', 'คุณกำพล ล้อเลิศสกุล', 'ภาคกลาง/ตะวันออก', 'พระนครศรีอยุธยา', 'เลขที่ 21/12 ถนนนเรศวร (ค)', '095-864-1684'),
('10408', 'แจ๋นบิวตี้', 'ภาคเหนือ', 'พิจิตร', 'เลขที่ 14 ถนนชมฐีระเวช', '081-740-6021,056-622-460'),
('10409', 'ชลบุรี บิวตี้ จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เลขที่ 688/14ก ถนนสุขุมวิท', '085-431-9995 090-120-8885'),
('10410', 'ชมพู่คอสเมติกส์', 'ภาคเหนือ', 'เพชรบูรณ์', 'เลขที่ 34 ถนนพระพุทธบาท', '091-8678584'),
('10412', 'หจก.เดโกะ บิวตี้ มาร์ท', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'เลขที่ 145/5 ถนนทรงพล', '081-752-3757,034-218-452'),
('10413', 'เด่น บิวตี้', 'ภาคอีสาน', 'นครนายก', 'เลขที่ 1-021-022 ถนนเสนาพินิจ', '037-315919'),
('10414', 'ตราดบิวตี้', 'ภาคกลาง/ตะวันออก', 'ตราด', 'เลขที่ 80/18-19 ถนนสุขุมวิท', '039-523-444'),
('10415', 'นาบิวตี้', 'ภาคเหนือ', 'นครสวรรค์', 'เลขที่ 231/17-19 ถนนสวรรค์วิถี', '086-446-6299'),
('10416', 'แสงชัย', 'ภาคกลาง/ตะวันออก', 'จันทบุรี', 'เลขที่ 108/68 ถนนศรีรองเมือง', ''),
('10418', 'บางกอก แฮร์ บิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เลขที่ 313/105-107 หมู่ที่ 10 ถนนเฉลิมพระเกียรติ', '038-421-304, 081-372-9766'),
('10419', 'บางแสนบิวตี้มาร์ท', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เลขที่ 269 ถนนลงหาดบางแสน', '0863831525 คุณโบ 080-1028797'),
('10421', 'บิวตี้เซ็นเตอร์', 'ภาคเหนือ', 'พิษณุโลก', 'เลขที่ 21/99 ถนนเอกาทศรฐ', '081-423-2238,055-251-188'),
('10422', 'หจก.บิวตี้มาร์ท อุทัยธานี', 'ภาคกลาง/ตะวันออก', 'อุทัยธานี', 'เลขที่ 123 ถนนเติบศิริ', '081-575-5945, 065-525-035'),
('10424', 'บิวตี้สโตร์', 'ภาคกลาง/ตะวันออก', 'กาญจนบุรี', 'เลขที่ 277/82 ถนนแสงชูโต', '081-9771697,092-5486830'),
('10425', 'ประเสริฐบาร์เบอร์', 'ภาคกลาง/ตะวันออก', 'ลพบุรี', 'เลขที่ 33/5 ถนนพระยากำจัด', '081-571-5777 ,036-412-645'),
('10427', 'เปรียว คอสเมติกส์ จำกัด', 'ภาคเหนือ', 'พิษณุโลก', 'เลขที่ 129 หมู่ที่ 2', '063-464-9791'),
('10428', 'คุณปิยะพร พยัพเมฆ', 'ภาคเหนือ', 'พิษณุโลก', 'เลขที่ 137 หมู่ที่ 3', '089-636-5567,055-377-229'),
('10431', 'พัทยา บิวตี้ (ประเทศไทย) จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เลขที่ 688/17 ถนนสุขุมวิท', '033-197-555'),
('10432', 'ไพทูล (ลับคม)', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'เลขที่ 54/6 ถนนทางรถไฟตะวันตก', '034-243-002 089-260-4051'),
('10433', 'เพียว คอสเมติก แอนด์ บิวตี้ จำกัด', 'ภาคเหนือ', 'พิษณุโลก', 'เลขที่ 198/7 ถนนเอกาทศรฐ', '094-540-8888'),
('10436', 'พัทยา บิวตี้ (ประเทศไทย) จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เลขที่ 32/17-18 หมู่ที่ 10 ถนนพัทยาใต้', '038-426-346 , 038-427-487'),
('10439', 'พัทยา บิวตี้ (ประเทศไทย) จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เลขที่ 81-83', ''),
('10440', 'พรอุมาไฉไล', 'ภาคอีสาน', 'ร้อยเอ็ด', 'เลขที่ 59/4,62 หมู่ที่ 8', '085-562-6966'),
('10441', 'รุ่งสโตร์บิวตี้เซ็นเตอร์', 'ภาคกลาง/ตะวันออก', 'ตราด', 'เลขที่ 23 ถนนวิจิตรจรรยา', '081-996-2474,039-512-667'),
('10442', 'รุ่งเสริมทรัพย์', 'ภาคกลาง/ตะวันออก', 'กาญจนบุรี', 'เลขที่ 121/25-26 ถนนรถไฟ 2', '099-414-4292'),
('10443', 'เลดี้อัพเดท', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'เลขที่ 292/33 หมู่ที่ 8', '085-481-1480'),
('10444', 'วิมล บิวตี้ จำกัด', 'ภาคกลาง/ตะวันออก', 'สุพรรณบุรี', 'เลขที่ 255 ถนนประชาธิปไตย', '085-546-9556'),
('10446', 'ศิริอาภรณ์ (หน้าโรงแรมนำสิน)', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เลขที่ 145/5 ถนนไกรเพชร', '032-338-136 080-112-1525'),
('10448', 'สมาร์ทบิวตี้', 'ภาคกลาง/ตะวันออก', 'กาญจนบุรี', 'เลขที่ 164-166 ถนนแสงชูโต', '085-290-5472'),
('10449', 'สวยงาม 3', 'ภาคกลาง/ตะวันออก', 'สิงห์บุรี', 'เลขที่ 950/65 ถนนธรรมถาวร', '081-116-5594'),
('10450', 'สหพัฒน์บิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เลขที่ 561/57 หมู่ที่ 11 ถนนสุขาภิบาล 8', '065-7829361'),
('10451', 'สิริภัณฑ์บิวตี้ จำกัด', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เลขที่ 204 ถนนแสงชูโต', '081-772-8819,032-201-333'),
('10452', 'หจก.สุวิมลบิวตี้', 'ภาคเหนือ', 'พิษณุโลก', 'เลขที่ 42/4 ถนนชาญเวชกิจ', '055-301-487'),
('10454', 'สวยมีดี จำกัด', 'ภาคกลาง/ตะวันออก', 'ระยอง', 'เลขที่ 8/22 ซอยศูนย์การค้าสาย 4 ถนนสุขุมวิท', ''),
('10455', 'เมืองราชลับคม', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เลขที่ 2 หมู่ที่ 4', '032-325-868,081-662-4799'),
('10459', 'อรัญลับคม', 'ภาคกลาง/ตะวันออก', 'สระแก้ว', 'เลขที่ 1/53-54 ถนนสันติภาพ', '081-966-2726,037-231-462'),
('10461', 'แฮร์คิงส์', 'ภาคเหนือ', 'พิษณุโลก', 'เลขที่ 888/47-48 ถนน มิตรภาพ', '089-856-8345,081-243-6608'),
('10462', 'แฮร์บิวตี้', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เลขที่ 80/5 ถนนคฑาธร', '081-752-3757,032-338-058'),
('-', 'หจก.กรรไกรทองบิวตี้', 'ภาคอีสาน', 'อุดรธานี', 'เลขที่ 539/70,539/73 ถนนโพศรี', '088-5628939'),
('10464', 'กรุงเทพการช่าง', 'ภาคใต้', 'นครศรีธรรมราช', 'เลขที่ 1260/18 ถนนบ่ออ่าง', '075-345-941 075-318-709'),
('10466', 'กันเอง(เกาะสมุย)', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 81/53 หมู่ที่ 3', '081-691-0951,099-3588923,077-413123'),
('10467', 'กันเอง (มะขามเตี้ย)', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 76/19 หมู่ที่ 2 ถนนศรีวิชัย', '081-839-9364 077-220-435'),
('10468', 'กุลณาบิวตี้ช้อป', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 46/10 หมู่ที่ 5', '062-0939765'),
('10469', '9 บิวตี้', 'ภาคอีสาน', 'สกลนคร', 'เลขที่ 1602/17 ถนนสุขเกษม', '081-769-1777,042-711-931'),
('10472', 'แกรนด์ โซล บิวตี้', 'ภาคใต้', 'นครศรีธรรมราช', 'เลขที่ 215,218 ถนนทุ่งสง-สุราษฎร์', ''),
('10473', 'แกนบิวตี้', 'ภาคใต้', 'สงขลา', 'เลขที่ 30 ถนนชัยมงคล', '089-656-8227'),
('10475', 'ควีนแลนด์ บิวตี้ จำกัด', 'ภาคใต้', 'สงขลา', 'เลขที่ 19/2 ถนนประธานอุทิศ', '081-690-7082,074-238548-9'),
('10478', 'คลองท่อม บิวตี้ ช๊อป', 'ภาคใต้', 'กระบี่', 'เลขที่ 42/2 หมู่ที่ 2 ถนนเทศบาล 2', '095-419-6552'),
('10479', 'จันทร์เพ็ญ', 'ภาคอีสาน', 'ประจวบคีรีขันธ์', 'เลขที่ 471 หมู่ที่ 2', '081-763-7549'),
('10481', 'เจ้ ยอดบิวตี้', 'ภาคอีสาน', 'อุดรธานี', 'เลขที่ 7/35 ถนนมุขมนตรี', '042-327-837'),
('10482', 'เจ-จันทร์ จำกัด', 'ภาคใต้', 'นครศรีธรรมราช', 'เลขที่ 167/6,10 หมู่ที่ 3', '093-265-9628'),
('10484', 'รักสวยรักงาม', 'ภาคอีสาน', 'อุดรธานี', 'เลขที่ 111,113 ถนนอดุลยเดช', '085-462-7727,088-571-3481'),
('10485', 'คุณจารุวรรณ อภิญญาภรณ์', 'ภาคใต้', 'ตรัง', 'เลขที่ 75-77 ถนนตลาด', '075-218-460'),
('10487', 'คุณชัยนรินท์ ภูริเศรษฐศักดิ์', 'ภาคอีสาน', 'สกลนคร', 'เลขที่ 1815/5 ถนนประชาราษฏร์', '042-733-139'),
('10488', 'ไชยชนะบิวตี้ช้อป', 'ภาคใต้', 'ชุมพร', 'เลขที่ 57/15 หมู่ที่ 6', '088-777-8236'),
('10489', 'สาลิกาบิวตี้', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 2/9-11 หมู่ที่ 1', '077-430-430'),
('10493', 'ดารา บิวตี้', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เลขที่ 21/153 ซอยหมู่บ้านทางรถไฟฝั่งตะวันตก', '083-038-8127 086-7873045'),
('10495', 'ดีแลนด์', 'ภาคใต้', 'พัทลุง', 'เลขที่ 351/5 หมู่ที่ 9', '093-784-7979 081-729-7878'),
('10496', 'ดีไลฟ์ 2559 จำกัด', 'ภาคใต้', 'ระนอง', 'เลขที่ 41/65 ถนนท่าเมือง', '077-984279 (099-3595515 คุณสุเทพ)'),
('10497', 'ดี แสนดี', 'ภาคใต้', 'พัทลุง', 'เลขที่ 18 ถนนนิวาส', '074-613-231'),
('10498', 'ดีว่า บิวตี้ กระบี่', 'ภาคใต้', 'กระบี่', 'เลขที่ 249/2-3 ถนนอุตรกิจ', '02-454-8442-3'),
('10499', 'เติมสวยไชยา', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 59/31 หมู่ที่ 3', '098-0102400, 094-5958698'),
('10501', 'ทวีชัยบิวตี้', 'ภาคอีสาน', 'ขอนแก่น', 'เลขที่ 273/69 หมู่ที่ 2', '089-418-4422'),
('10503', 'ประกายผม', 'ภาคใต้', 'ชุมพร', 'เลขที่ 98/85 หมู่ที่ 7', '081-860-4191,081-310-3126'),
('10504', 'นพวงศ์', 'ภาคอีสาน', 'ขอนแก่น', 'เลขที่ 93 ถนนราษฎร์บำรุง', '043-311-154'),
('10506', 'นานาภัณฑ์', 'ภาคใต้', 'ภูเก็ต', 'เลขที่ 94/6 ถนนไสน้ำเย็น', '087-272-9841'),
('10507', 'นาเหนือปัตเลี่ยน', 'ภาคใต้', 'นครศรีธรรมราช', 'เลขที่ 403 ถนนทุ่งสง-นครศรีธรรมราช', '075-329-653'),
('10509', 'นาคา ทรัพย์ประสิทธิ์ จำกัด', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 68/7 หมู่ที่ 6', '077-247909'),
('10511', 'บางสะพานบิวตี้', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เลขที่ 269/16 หมู่ที่ 1 ถนนเพชรเกษม-ชายทะเล', '081-403-0465'),
('10513', 'บิวตี้ ทัช', 'ภาคใต้', 'ภูเก็ต', 'เลขที่ 37/6 ถนนศรีสุนทร', '076-324-146, 083-4693992'),
('10517', 'เบญจวรรณ', 'ภาคใต้', 'ชุมพร', 'เลขที่ 93 ถนนประมินทร์บรรดา', '077-511-169'),
('10520', 'ใบเฟิร์น เฟช แคร์', 'ภาคใต้', 'ตรัง', 'เลขที่ 1/7 หมู่ที่ 1 ถนนยวดประศาสน์', '087-383-2974, 083-590-7217'),
('10522', 'ใบเตยบิวตี้', 'ภาคใต้', 'ชุมพร', 'เลขที่ 197/52 หมู่ที่ 7', '081-453-5372'),
('10524', 'บิวตี้แลนด์ แฮร์ แอนด์ บิวตี้ จำกัด', 'ภาคใต้', 'ภูเก็ต', 'เลขที่ 5/68-71 ถนนแม่หลวน', '081-693-2440'),
('10525', 'บิวตี้แลนด์ ภูเก็ต จำกัด', 'ภาคใต้', 'ภูเก็ต', 'เลขที่ 60,60/1-3 ถนนราษฎร์อุทิศ 200 ปี', '076-221674'),
('10526', 'บิ้วตี้ ฟลาย', 'ภาคใต้', 'ชุมพร', 'เลขที่ 78/1,78/2 ถนนพิศิษฐพยาบาล', '081-6365326'),
('10530', 'ป้อมบิวตี้', 'ภาคอีสาน', 'อุดรธานี', 'เลขที่ 286/33 ถนนโพธิ์ศรี', '042-221-104'),
('10531', 'เปเล่ บิวตี้', 'ภาคใต้', 'พัทลุง', 'เลขที่ 259/2 ถนนไชยบุรี', '086-222-8432'),
('10533', 'ปฐมพร', 'ภาคใต้', 'สตูล', 'เลขที่ 46784', '081-690-2593 081-609-0717'),
('10535', 'พรเพ็ญพาณิชย์', 'ภาคใต้', 'ระนอง', 'เลขที่ 72/118 หมู่ที่ 5', '081-892-2294'),
('10537', 'เพชรบุรีบิวตี้ช็อป', 'ภาคใต้', 'เพชรบุรี', 'เลขที่ 20/9-10 ถนนราษฎร์พลี', '032-472449'),
('10539', 'เพ็ญศิริ', 'ภาคใต้', 'พัทลุง', 'เลขที่ 86/6 ถนนไชยบุรี', '087-288-1145 074-615-619'),
('10540', 'พรพัน', 'ภาคใต้', 'ตรัง', 'เลขที่ 300/2 ถนนห้วยยอด', '095-945-4594'),
('10541', 'พรภัณฑ์บิวตี้ จำกัด', 'ภาคใต้', 'นครศรีธรรมราช', 'เลขที่ 1459/12,1459/14 ถนนจำเริญวิถี', ''),
('10542', 'เจ๊เช็ง', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เลขที่ 209 หมู่ที่ 4', '081-858-1434,032-672-276'),
('10543', 'มโนราห์บิวตี้', 'ภาคใต้', 'นครศรีธรรมราช', 'เลขที่ 144 ถนนศรีธรรมราช', '086-682-0748,086-682-0748'),
('10544', 'มาสบิวตี้ช็อป', 'ภาคใต้', 'ปัตตานี', 'เลขที่ 1/51 ถนนเกษมสุข', ''),
('10546', 'เมย์บิวตี้', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 37/2 หมู่ที่ 1', '084-689-6900 077-369-452'),
('10548', 'แม็คควีนส์', 'ภาคใต้', 'ยะลา', 'เลขที่ 414 ถนนสิโรรส', '094-5805995'),
('10550', 'ยูนิคอส บิวตี้ (UNICOS BEAUTY)', 'ภาคใต้', 'ภูเก็ต', 'เลขที่ 47 ถนนอ๋องซิมผ่าย', '086-942-6316 (บัญชี 076-218004)'),
('10552', 'ริชชี่บิวตี้ จำกัด', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 412/13 ถนนตลาดใหม่', '077-203300'),
('10555', 'ลี่ยิ่วกี่', 'ภาคใต้', 'นครศรีธรรมราช', 'เลขที่ 76/69 ซอยจันทพันธ์ ถนนพัฒนาการคูขวาง', '090-069-4091'),
('10558', 'สยามเวชภัณฑ์', 'ภาคใต้', 'เพชรบุรี', 'เลขที่ 191/19 หมู่ที่ 1', '086-376-5118'),
('10559', 'สาลิกาบิวตี้', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 295/7-8 ถนนตลาดใหม่', '081-598-1991'),
('10560', 'สุขสวยคอสเมติก (เมืองพังงา)', 'ภาคใต้', 'พังงา', 'เลขที่ 17/18-20 ถนนศิริราษฎร์', '094-564-6651'),
('10561', 'สุขสวยคอสเมติก (ตะกั่วทุ่ง)', 'ภาคใต้', 'พังงา', 'เลขที่ 65 หมู่ที่ 2', '089-6839276'),
('10565', 'แสงศรีพานิช', 'ภาคใต้', 'ตรัง', 'เลขที่ 46 ถนนไทรงาม', '081-535-6315,075-210-561'),
('10567', 'คุณสุรชัย รัตนเกษมชัย', 'ภาคอีสาน', 'หนองบัวลำภู', 'เลขที่ 345 หมู่ที่ 3', '081-871-6827,042-313-340'),
('10570', 'สวัสดีไดเร็คท์', 'ภาคใต้', 'เพชรบุรี', 'เลขที่ 26 ถนนเทเวศน์', '032-400168,085-4948765'),
('10571', 'ธีดาบิวตี้ช็อป', 'ภาคใต้', 'ยะลา', 'เลขที่ 50/2 ถนนรวมมิตร', '073-3214230, 081-6903618'),
('10572', 'สันติลับคม', 'ภาคใต้', 'สงขลา', 'เลขที่ 97/20 หมูที่ 3', '083-654-3638'),
('10574', 'คุณสุภิญญา พิริยะ', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 1/12 ถนนนาสารใน', ''),
('10575', 'หจก.สามกอง คอสเมติคส์', 'ภาคใต้', 'ภูเก็ต', 'เลขที่ 152/12 หมู่ที่ 5', '098-0155782,076-610-399'),
('10577', 'สาลิกาบิวตี้', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 404/8 หมู่ที่ 1', '064-1425129'),
('10578', 'หนึ่งบิวตี้', 'ภาคใต้', 'ชุมพร', 'เลขที่ 30/4-5 หมู่ที่ 7', '086-269-3084 077-534-660'),
('10581', 'อ.สมพร บิวตี้ช็อป', 'ภาคใต้', 'พัทลุง', 'เลขที่ 108 หมู่ที่ 8', '093-637-4762'),
('10583', 'เอเชียช็อพ', 'ภาคใต้', 'สุราษฎร์ธานี', 'เลขที่ 4/6 ถนนชลประทานใต้', '094-591-6511'),
('10584', 'อารีย์บิวตี้ช้อฟ', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เลขที่ 105/3 ถนนเกาะหลัก', ''),
('10585', 'อ่อนศรี  วีระโงน', 'ภาคเหนือ', 'สกลนคร', 'เลขที่ 184 หมูที่ 16', '086-476-6500'),
('10586', 'ฮอลลีวู๊ด', 'ภาคใต้', 'นครศรีธรรมราช', 'เลขที่ 1357 ถนนราชดำเนิน', '089-474-2701,075-342-733'),
('10587', 'ฮาวายสโตร์', 'ภาคใต้', 'ปัตตานี', 'เลขที่ 39 ถนนพิพิธ', '089-474-2701,075-342-733'),
('10590', 'ก้าวเจริญ บางบอน', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 49/81-83 หมู่ที่ 6 ซอยเอกชัย 69 ถนนเอกชัย', '043-513-342'),
('10592', 'ก้าวจำเริญ', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', 'เลขที่ 273/89-90 หมู่ 6', '02-4205974'),
('10593', 'คุณกนกวรรณ วงษ์น้อมไทย', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 18 ซอยประชุม', '089-9870300'),
('10594', 'กำเนิดซาลอน', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 2/135 ซอยแยกจาก หมู่ที่ 6', ''),
('10595', 'คุณแม่', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เลขที่ 23/7 หมู่ที่ 6 ซอย ฮ.8', ''),
('10598', 'เจ แอนด์ เอ็น อุปกรณ์เสริมสวย', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เลขที่ 201/3 หมู่ที่ 11 ถนนเทพารักษ์', '02-1152095 085-1623499 089-1147927'),
('10599', 'จรัล บิวตี้โซน', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 109/54 หมู่ที่ 5 ถนนบางกรวย-ไทรน้อย', ''),
('10600', 'แจ๊ค & จิ๋ม บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 44 ซอยอ่อนนุช 70/1', ''),
('10602', 'คุณชนินทร์ คงไทย', 'เขตกรุงเทพและปริมณฑล', 'นครสวรรค์', 'เลขที่ 128/2 หมู่ที่ 6', '089-449-2943,02-813-7447'),
('10603', 'คุณชนันดา มิลินทสูต', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 48 ซอยเพชรเกษม 69 แยก 5', ''),
('10604', 'แซนดี้ บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เลขที่ 55/12-13 หมู่ที่ 9 ถนนคลองหลวง เมืองใหม่', '081-543-2258, 02-015-4849'),
('10605', 'ซี เอ บิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', 'เลขที่ 273/436-438 หมู่ที่ 6', ''),
('10608', 'ดี.ดี.บิวตี้เวิลด์', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 9/141-142 ซอยลาดปลาเค้า 78 ถนนลาดปลาเค้า', ''),
('10611', 'ตุ๊ก บางบอนบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 6/59-60 หมู่ที่ 6 ถนนเอกชัย', '02-415-0807 086-310-8975'),
('10613', 'นนท์เทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 750,752 ถนนพิบูลสงคราม', '02-967-4423 02-526-7289'),
('10614', 'นฤมลเทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 81/17 ถนนหทัยราษฎร์', '02-1715116'),
('10615', 'นานาบิวตี้ช็อป', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เลขที่ 34/1 หมู่ที่ 2 ถนนเลียบคลองสาม', '081-8484202'),
('10616', 'นานาบิวตี้เจริญ', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เลขที่ 23/7 หมู่ที่ 6', ''),
('10617', 'เนอร์ร่า บิวตี้ เอ็กซ์เปิร์ต จำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 81/17 ถนนหทัยราษฎร์', '02-1715116'),
('10618', 'บอย(ภาคิน)', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 561/2 ถนนสุขสวัสดิ์', '02-427-3529 02-427-5587'),
('10619', 'บางกอกบิวตี้ เซ็นเตอร์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 4/2 ซอยสมประสงค์ 2 ถนนเพชรบุรี', '02-252-1275 02-252-1275 Fax 02-251-8552'),
('10623', 'บิวตี้มาร์ท', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 46/15-16 หมู่ที่ 5 ถนนติวานนท์', '02-961-9065-6'),
('10630', 'บิวตี้ทูเดย์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 101-101/1 โซน Popular Walk ถนนป๊อบปูล่า', '094-9454440'),
('10631', 'บางศรีเมือง บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 48/22 หมู่ที่ 3 ถนนท่าน้ำนนท์', ''),
('10634', 'คุณประเทือง เหมพันธ์', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 490/12 ซอยพหลโยธินแยก 6 หมู่บ้านสงวนพัฒนา', '02-5211-448, 095-2469770'),
('10637', 'พนธกร', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 48/12 ถนนรามอินทรา กม8', '02-510-9311, 02-966-4946 กด1'),
('10638', 'พระประแดงบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เลขที่ 93 หมู่ที่ 8 ถนนสุขสวัสดิ์', '063-497-9787'),
('10641', 'PP บิวตี้มาร์ท', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 114 ซอยติวานนท์ 38 ถนนติวานนท์', '097-2459785'),
('10642', 'พระราม 2 คอสเมติกส์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 156,158,160 ถนนท่าข้าม', '081-441-4999'),
('10650', 'แมคบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 118/10', '089-2055997 066-159-2456'),
('10651', 'มีนบุรีบิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 99/171 ซอยคุ้มเกล้า 11', '081-9163857'),
('10654', 'ร่ำรวยบิวตี้ (บีแอนด์วาย บิวตี้)', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 499/3 ซอยเพชรเกษม 55/2', '086-329-8669, 02-8013469'),
('10656', 'วีซ่าเทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 80/130-131 หมู่ที่ 6 ถนนกาญจนาภิเษก', '02-903-2772 081-841-2885'),
('10657', 'คุณเวณุ ฤกษ์ศิริรัตน์', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 21/140 หมู่ที่ 4 ถนนอนามัยงามเจริญ', '081-8477290,02-6751511'),
('10659', 'คุณวรัชยา ประประโคน/เฮง เฮง บางขุนนนท์', 'เขตกรุงเทพและปริมณฑล', 'บุรีรัมย์', 'เลขที่ 19 หมู่ที่ 10', '081-083-2215,081-357-1977'),
('10661', 'คุณศศิประภา มูลชนะ', 'เขตกรุงเทพและปริมณฑล', 'เชียงราย', 'เลขที่ 183/5 หมู่ที่ 10', '080-929-6492,02-959-0500'),
('10662', 'คุณศุภชัย ธรรมศิริ', 'เขตกรุงเทพและปริมณฑล', 'พะเยา', 'เลขที่ 383 หมู่ที่ 8', '081-928-1978'),
('10663', 'สยามเทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 60 ถนนสุทธิสารวินิจฉัย', '02-271-0685 02-616-7075'),
('10668', 'สิริพรรณ บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 6/7 หมู่ที่ 2', '081-840-4301, 098-249-9168'),
('10669', 'แสงจันทร์ อินเตอร์ พลัส จำกัด', 'ภาคกลาง/ตะวันออก', 'พระนครศรีอยุธยา', 'เลขที่ 51/175-177 หมู่ที่ 1', '081-632-8232,035-337-256'),
('10671', 'เสรีชัยเทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 22/16-17 ถนนประชาราษฏร์', '086-351-8227'),
('10676', 'คุณสวรรยา สินสมบูรณ์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 155/7 หมู่ที่ 4', '085-983-3301,02-062-9956'),
('10683', 'ห่านพงกี่สำโรง', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เลขที่ 1190 หมู่ที่ 6 ถนนสุขุมวิท', '081-582-2666,02-7540279'),
('10685', 'เอพี บิวตี้ สาย 4', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', 'เลขที่ 96/60-62 หมู่ที่ 10', '081-434-8382'),
('10693', 'แฮร์คลับ', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 120/19 ซอยวัชรพล 2/5 ถนนวัชรพล', '094-231-66538'),
('10694', 'หจก.แฮร์คอสเม่', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 21/56 ซอยบางกระดี่ 32', '095-575-7583, 081-400-2322'),
('10695', 'จำเป็นบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 1663 ถนนสุขุมวิท', ''),
('10697', 'รติพร มิตรประชา', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 127/6 หมู่ที่ 5', ''),
('10698', 'คลองตันเทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 1006/7 ซอย 71 ถนนสุขุมวิท', '085-3534309 0-2713-3644'),
('10699', 'แชมป์บิวตี้เซ็นเตอร์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 61/31-32 บางใหญ่ซิตี้', '088-578-1918'),
('10700', 'หสม.ริช-วัน บิวตี้ช๊อป', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 9/25 ซอยคอนโดเมืองทองธานี ตึก C5 ถนนป๊อบปูล่า 5', '097-2324915 02-9803373'),
('10701', 'สรรพสินค้าบิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 1054/5 ถนนเพชรบุรีตัดใหญ่', ''),
('10702', 'สตอเบอร์รี่ บิวตี้', 'ภาคเหนือ', 'กำแพงเพชร', 'เลขที่ 86/6 หมู่ที่ 1', '082-439-6666,086-130-2884'),
('10705', 'บิวตี้บล๊อกเกอร์บายซีแอนเจ', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', '153/1 ถนนสมเด็จพระปิ่นเกล้า', ''),
('10706', 'อาจารย์สมพร บิวตี้ช็อป', 'ภาคใต้', 'พัทลุง', '330/8 หมู่ที่ 11 ถนนมโนราห์-ถนนบายพาส', '936374762'),
('10715', 'ร้านสุชารัตน์', 'ภาคอีสาน', 'อุบลราชธานี', 'เลขที่ 366/9 หมู่ 4', '087-7766183,045-482320'),
('10721', 'บิวตี้ ทูเดย์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เลขที่ 101/1 ห้องเลขที่ SW1 ถนนป๊อปปูล่า', '094-945-4440'),
('10735', 'เด่น บิวตี้', 'ภาคอีสาน', 'นครราชสีมา', 'เลขที่ 518 ถ.มิตรภาพ', '086-542-4642'),
('10753', 'กระบี่ คอสเมติก', 'ภาคใต้', 'กระบี่', '2,4 ถนนมหาราช', '864766500'),
('10754', 'คุณปวริศา อุดมศรี', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', '86/1 ซ.กรุงธนบุรี2 ถ.กรุงธนบุรี', ''),
('10756', 'กระนวน บิวตี้มาร์ท', 'ภาคอีสาน', 'ขอนแก่น', 'เลขที่ 455 หมู่ที่ 2', '084-489-99150'),
('10761', 'พราว คอสเมติกส์', 'ภาคใต้', 'พัทลุง', 'เลขที่ 142 หมู่ที่ 1', '062 9269451'),
('10766', 'หจก.โอเคสวย2555', 'ภาคอีสาน', 'อุบลราชธานี', 'เลขที่ 556/1 ห้องเลขที่ L096 หมู่ที่ 3', '632956624'),
('10775', 'กันเอง (ยโสธร)', 'ภาคอีสาน', 'ยโสธร', 'เลขที่ 239-241 ถนนวิทยะธำรงค์', '985855359'),
('10776', 'แกรนด์ ลักชัวรี่ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 3/23 ซอยเสรีไทย 43', '089-2611261'),
('10777', 'บิวติฟิเดนซ์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', '1037 หมู่ที่ 6', ''),
('10778', 'หาดใหญ่บิวตี้', 'ภาคใต้', 'สงขลา', 'เลขที่ 517 ถนนราษฎร์อุทิศ', '897339014'),
('10789', 'แสงจันทร์บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 45 ถนนราชวิถี', ''),
('10792', 'บิวตี้ ฮีล ช็อป จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เลขที่ 555/101 หมู่ที่ 1', '922128822'),
('10793', 'จีซีเอ็มจี จำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 438/16,438/30 ถนนราชวิถี', '26435480'),
('10801', 'มาตาบิ้วตี้', 'ภาคเหนือ', 'เชียงใหม่', 'เลขที่ 193/70 ถนนช้างเผือก', '095-449-8655'),
('10809', 'เอ็นเอ็ม บิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 4/308 หมู่ที่ 7', '02-936-8787'),
('10814', 'ร้านโมเดิร์นแฮร์', 'ภาคเหนือ', 'อุตรดิตถ์', 'เลขที่ 10/8 หมู่ที่ 2', '082-118-6760'),
('10822', 'เบญจภาคี ช็อป', 'ภาคเหนือ', 'เชียงราย', 'เลขที่ 78 หมู่ที่ 1', '084-076-9109'),
('10826', 'เวิลด์ บิวตี้', 'ภาคกลาง/ตะวันออก', 'ลพบุรี', 'เลขที่ 98/1 ถนนนเรศวร', '081-946-0752 , 036-612849'),
('10827', 'บ้านครีมนครศรี จำกัด', 'ภาคใต้', 'นครศรีธรรมราช', 'เลขที่ 154/15-18 ถนนพัฒนาการคูขวาง', '089-586-9259'),
('10828', 'ปราณทิพย์', 'ภาคอีสาน', 'สระบุรี', 'เลขที่ 86 ถนน พหลโยธิน', '063-996-2455 036-222082'),
('10829', 'คุณวาสนา เลิศเจริญทรัพย์', 'ภาคกลาง/ตะวันออก', 'อ่างทอง', 'เลขที่ 2/56 ถนนอ่างทอง-สิงห์บุรี', '089-801-3832'),
('10832', 'คุณภัครินทร์ สีใส', 'ภาคกลาง/ตะวันออก', 'ปราจีนบุรี', 'เลขที่ 229/3-4 หมู่ที่ 7', '095-656-9592'),
('10833', 'ตาลบิวตี้เซ็นเตอร์', 'ภาคอีสาน', 'สระบุรี', 'เลขที่ 2/316 ถนนสุดบรรทัด', '093-263-6362'),
('10834', 'สระบุรี บิวตี้', 'ภาคอีสาน', 'สระบุรี', 'เลขที่ 103-105 ถนนสุดบรรทัด', '084-649-3820'),
('10841', 'หจก.เมียงดงบิวตี้ท่าศาลา', 'ภาคใต้', 'นครศรีธรรมราช', 'เลขที่ 1/6 หมู่ที่ 3', '065-098-5102'),
('10844', 'คุณโบว์ 2562', 'ภาคอีสาน', 'นครราชสีมา', 'เลขที่ 491 หมู่ที่ 4', '096-939-3651 089-846-5866'),
('20007', 'หวังดี', 'ภาคเหนือ', 'ตาก', 'เลขที่ 3/34 ถนนอินทรคีรี', '055-532798'),
('20009', 'ทรงศิลป์เวิลด์', 'ภาคอีสาน', 'ร้อยเอ็ด', '98 หมู่6', '043-551157 081-7171157'),
('20010', 'ชัยฟ้า (บุรีรัมย์) จำกัด', 'ภาคอีสาน', 'บุรีรัมย์', 'เลขที่ 187 ถนน สุนทรเทพ', '088-354-8855'),
('20014', 'หจก.นิวเรืองสิน เล็ทเธอร์', 'ภาคอีสาน', 'ร้อยเอ็ด', 'เลขที่ 192/8-9-10 ซอย12(ราชการดำเนิน)', '043-519-844'),
('10652', 'เยาวราช', 'เขตกรุงเทพและปริมณฑล', 'พระโขนง', '', ''),
('10682', 'สินสุขพลัส จำกัด', 'เขตกรุงเทพและปริมณฑล', 'บางแค', '', ''),
('10568', 'สยามบิวตี้ ช็อป', 'ภาคใต้', 'สงขลา', '', ''),
('10779', 'บิวตี้ ฟาร์ม่า', 'ภาคใต้', 'สงขลา', '', ''),
('10527', 'บิวตี้ เฟอร์แฟค', 'ภาคใต้', 'ยะลา', '', ''),
('10573', 'สุขสวยคอสเมติก (ท้ายเหมือง)', 'ภาคใต้', 'พังงา', '', ''),
('10569', 'เสรีเภสัช', 'ภาคใต้', 'พังงา', '', ''),
('10752', 'บิวตี้ควีน', 'ภาคใต้', 'กระบี่', '', ''),
('10491', 'ซ 8 บิวตี้', 'ภาคใต้', 'ภูเก็ต', '', ''),
('10514', 'บิวตี้แลนด์ ภูเก็ต จำกัด', 'ภาคใต้', 'ภูเก็ต', '', ''),
('10534', 'แป้งหอม 9001 จำกัด', 'ภาคใต้', 'ประจวบคีรีขันธ์', '', ''),
('10529', 'คุณปุณยนุช อ่อนมุกข์', 'ภาคใต้', 'ชุมพร', '', ''),
('10770', 'เอชอาร์บีบี กรุ๊ป จำกัด', 'ภาคใต้', 'สงขลา', '', ''),
('10189', 'Harisbarbershop', 'ภาคใต้', 'สงขลา', '', ''),
('10045', 'คุณฐิติกุล แวงสุข', 'ภาคใต้', 'สตูล', '', ''),
('40016', 'คุณธนันณัชญ์  กำเนิดว้ำ', 'ภาคใต้', 'นครศรีธรรมราช', '', ''),
('10470', 'คุณกนกวรรณ ยั่งยืน', 'ภาคใต้', 'พังงา', '', ''),
('40071', 'คุณซูไฮมี เด็นอาสัน', 'ภาคใต้', 'สงขลา', '', ''),
('70012', 'มันตา ฟาร์มาซี จำกัด', 'ภาคใต้', 'นครศรีธรรมราช', '', ''),
('10658', 'คุณตัสนีมซ์ ศรีรัตน์', 'ภาคใต้', 'สงขลา', '', ''),
('10786', 'คุณกวีวัธน์ สุวรรณพันธ์', 'ภาคใต้', 'สงขลา', '', ''),
('10807', 'คุณแวมะ เจ๊ะแม', 'ภาคใต้', 'ยะลา', '', ''),
('10722', 'คุณยุทธภูมิ เอี่ยมสุวัฒน์', 'ภาคใต้', 'สุราษฎร์ธานี', '', ''),
('40034', 'คุณวีรยุทธ  สายสวาท', 'ภาคใต้', 'ประจวบคีรีขันธ์', '', ''),
('10094', 'BARBERTIS', 'ภาคใต้', 'สงขลา', '', ''),
('10723', 'คุณไกรสีห์ ชูช่วย', 'ภาคใต้', 'สุราษฎร์ธานี', '', ''),
('10843', 'คุณสุทธิศักดิ์ ยอดรัก', 'ภาคใต้', 'ภูเก็ต', '', ''),
('10437', 'แพทองกุล จำกัด', 'ภาคเหนือ', 'นครสวรรค์', '', ''),
('10379', 'ฟ้าเจริญกิจ จำกัด', 'ภาคเหนือ', 'กำแพงเพชร', '', ''),
('10435', 'เพชรินทร์', 'ภาคเหนือ', 'เพชรบูรณ์', '', ''),
('10410', 'ชมพู่คอสเมติกส์ (เพชรบูรณ์)', 'ภาคเหนือ', 'เพชรบูรณ์', '', ''),
('10371', 'บิวตี้ ช็อป', 'ภาคเหนือ', 'ลำปาง', '', ''),
('10148', 'หวังดี', 'ภาคเหนือ', 'อุตรดิตถ์', '', ''),
('10351', 'แคชบิวตี้แอนด์คอสเมติกส์ จำกัด', 'ภาคเหนือ', 'น่าน', '', ''),
('10391', 'คุณสมทรง บาลสันเทียะ', 'ภาคเหนือ', 'เชียงใหม่', '', ''),
('10366', 'ทองบิวตี้', 'ภาคเหนือ', 'เชียงใหม่', '', ''),
('10784', 'อิมซัง (ลำพูน)', 'ภาคเหนือ', 'ลำพูน', '', ''),
('10831', 'วริณธร บัวจูม', 'ภาคเหนือ', 'ศรีษะเกษ', '', ''),
('10123', 'คุณรังสินี เนียมจันทร์', 'ภาคเหนือ', 'ศรีษะเกษ', '', ''),
('10161', 'คุณส้มโอ ยศมา', 'ภาคเหนือ', 'เพชรบูรณ์', '', ''),
('10067', 'คุณเธียมเวศย์ งานดี', 'ภาคเหนือ', 'พะเยา', '', ''),
('40073', 'คุณมนัสชนก ราชพันธ์', 'ภาคเหนือ', 'สุโขทัย', '', ''),
('10727', 'คุณอาหลี เม่งจิ', 'ภาคเหนือ', 'ตรัง', '', ''),
('10012', 'คุณไกรวิทย์ พรหมวงษ์', 'ภาคเหนือ', 'กำแพงเพชร', '', ''),
('40075', 'คุณอนุพงษ์ เงินบำรุง', 'ภาคเหนือ', 'ขอนแก่น', '', ''),
('10742', 'คุณรุ่งโรจน์ ค้อชากุล', 'ภาคเหนือ', 'ร้อยเอ็ด', '', ''),
('10747', 'คุณวรพล เขียวจันทร์', 'ภาคเหนือ', 'แพร่', '', ''),
('10368', 'ทรงศิลป์', 'ภาคเหนือ', 'ร้อยเอ็ด', '', ''),
('40015', 'คุณธวัชชัย  ชิตวรกุล', 'ภาคเหนือ', 'เชียงใหม่', '', ''),
('70003', 'เอสที แฮร์คลิปเปอร์ จำกัด', 'ภาคเหนือ', 'อุดรธานี', '', ''),
('10044', 'คุณวรพงษ์ สายคำ', 'ภาคเหนือ', 'พิษณุโลก', '', ''),
('40065', 'คุณไกรสร ปราบวิลัย', 'ภาคเหนือ', 'กำแพงเพชร', '', ''),
('40054', 'คุณอัมรินทร์ วงค์คำ', 'ภาคเหนือ', 'สกลนคร', '', ''),
('40050', 'คุณวาสนา ไชยลังกา', 'ภาคเหนือ', 'พะเยา', '', ''),
('40047', 'คุณเหมรัตน์ เหมะชัย', 'ภาคเหนือ', 'อุดรธานี', '', ''),
('40062', 'คุณจักรพรรดิ ฦาชาฤทธิ์', 'ภาคเหนือ', 'เชียงใหม่', '', ''),
('40056', 'คุณคมกริช เสนา', 'ภาคเหนือ', 'ตาก', '', ''),
('40055', 'คุณสาทินี เมฆหมอก', 'ภาคเหนือ', 'ตาก', '', ''),
('10783', 'แก้ว บิวตี้ จำกัด', 'ภาคอีสาน', 'สุรินทร์', '', ''),
('10387', 'ศุภกรบิวตี้', 'ภาคอีสาน', 'ศรีษะเกษ', '', ''),
('10155', 'สระแก้วบิวตี้', 'ภาคกลาง/ตะวันออก', 'สระแก้ว', '', ''),
('10765', 'ชาญศิริ', 'ภาคอีสาน', 'ขอนแก่น', '', ''),
('10564', 'เสริมสวยเสริมสวัสดิ์', 'ภาคอีสาน', 'หนองคาย', '', ''),
('10556', 'ศรีรุ่งเรือง', 'ภาคอีสาน', 'หนองคาย', '', ''),
('10483', 'เจ เค บิวตี้ช็อป นครพนม', 'ภาคอีสาน', 'นครพนม', '', ''),
('10463-01', 'กรรไกรทองบิวตี้', 'ภาคอีสาน', 'อุดรธานี', '', ''),
('10502', 'ทวีชัย บิวตี้', 'ภาคอีสาน', 'บึงกาฬ', '', ''),
('10751', 'มิตรผม', 'ภาคอีสาน', 'สระบุรี', '', ''),
('40028', 'คุณภูพิงค์ เกษจำรัส', 'ภาคอีสาน', 'อุบลราชธานี', '', ''),
('10719', 'คุณจิรายุ สุขเต็ม', 'ภาคอีสาน', 'สุรินทร์', '', ''),
('10773', 'HEADGAME BARBERGEAR BRANCH HQ', 'มาเลเซีย', 'ต่างประเทศ', '', ''),
('10110', 'ไม่ประสงค์ออกนาม', 'ยังไม่มีข้อมูล', 'ยังไม่มีข้อมูล', '', ''),
('40078', 'คุณถามพัฒน์ อุทธโยธา', 'เขตกรุงเทพและปริมณฑล', 'ทวีวัฒนา', '', ''),
('40067', 'คุณพีรชัย สุขพ่วง', 'ภาคกลาง/ตะวันออก', 'นครปฐม', '', ''),
('10817', 'ตัดดี บาร์เบอร์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ทวีวัฒนา', '', ''),
('10737', 'คุณสุบิน แซ่ด่าน', 'เขตกรุงเทพและปริมณฑล', 'ยานนาวา', '', ''),
('10116', 'คุณมณเฑียร ลีห์เสถียร', 'ภาคใต้', 'สุราษฎร์ธานี', '', ''),
('10771', 'แฮปปี้โฮมบิวตี้ 2020 จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', '', ''),
('40064', 'คุณสว่าง จันตี', 'ภาคเหนือ', 'พิษณุโลก', '', ''),
('40020', 'คุณนิพิฐ  พันธุรัตน์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', '', ''),
('10768', 'ทูเก็ตเตอร์ บาร์เบอร์ช็อป จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', '', ''),
('10847', 'คุณญานิกา นนทสิทธิชัย', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', '', ''),
('10608', 'ดี.ดี.บิวตี้เวิลด์', 'เขตกรุงเทพและปริมณฑล', 'บางเขน', '', ''),
('70014', 'โซ-ยู ซาลอน พัทยา จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ดินแดง', '', ''),
('70015', 'บีบี คอนวีเนียนส์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('10769', 'หจก.แม่สอด บิวตี้', 'ภาคเหนือ', 'ตาก', '', ''),
('40079', 'คุณอรพินท์ อำนวยพงศา', 'เขตกรุงเทพและปริมณฑล', 'บางขุนเทียน', '', ''),
('10848', 'คุณวสันต์ ฉัตราวิริยะกุล', 'เขตกรุงเทพและปริมณฑล', 'วัฒนา', '', ''),
('10001', 'คุณมนัสวี รักท้วม', 'ภาคกลาง/ตะวันออก', 'นครปฐม', '', ''),
('10851', 'ศรีสุภัค บิวตี้ เซ็นเตอร์', 'ภาคกลาง/ตะวันออก', 'ฉะเชิงเทรา', '', ''),
('10850', 'สี่มุมเมือง บิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', '', ''),
('10849', 'เคหะบิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', '', ''),
('40080', 'คุณนวรัตน์ คำนิล', 'เขตกรุงเทพและปริมณฑล', 'บางกะปิ', '', ''),
('10852', 'หจก.บิวตี้มาร์ท ฉะเชิงเทรา', 'ภาคกลาง/ตะวันออก', 'ฉะเชิงเทรา', '', ''),
('10710', 'หจก.ฟีน บาร์เบอร์ ช็อป ฟู้ดวิลล่า', 'เขตกรุงเทพและปริมณฑล', 'ตลิ่งชัน', '', ''),
('10853', 'สตาร์ บิวตี้', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', '', ''),
('10854', 'หน้ามอ บิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', '', ''),
('10861', 'ทาม ทู ออเดอร์', 'เขตกรุงเทพและปริมณฑล', 'สะพานสูง', '', ''),
('10157', 'ส่งเสริมการขาย', 'เขตกรุงเทพและปริมณฑล', 'ทวีวัฒนา', '', ''),
('10856', 'ห้องเติมสวย บิวตี้ช็อป', 'ภาคใต้', 'สงขลา', '', ''),
('10359', 'ชมพู่คอสเมติกส์ (เลย)', 'ภาคอีสาน', 'เลย', '', ''),
('10863', 'เอกชัย ค้าส่ง', 'ภาคใต้', 'กระบี่', '', ''),
('10865', 'อาจารย์สมพร บิวตี้', 'ภาคใต้', 'พัทลุง', '', ''),
('10867', 'การ์ตูนภูเก็ต', 'ภาคใต้', 'ภูเก็ต', '', ''),
('10857', 'โทฟู สกินแคร์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('10872', 'บิวตี้ บูม ช็อป', 'ภาคใต้', 'ปัตตานี', '', ''),
('10871', 'จอยเฮลท์ตี้', 'ภาคกลาง/ตะวันออก', 'จันทบุรี', '', ''),
('10873', 'เก็จขวัญ บิวตี้ บูติค', 'ภาคกลาง/ตะวันออก', 'ฉะเชิงเทรา', '', ''),
('10870', 'บิวตี้มาร์ท บุรีรัมย์', 'ภาคอีสาน', 'บุรีรัมย์', '', ''),
('10879', 'เฮง เฮง บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ธนบุรี', '', ''),
('10876', 'ชัยภูมิบิวตี้', 'ภาคอีสาน', 'ชัยภูมิ', '', ''),
('10862', 'มิตร บาร์เบอร์', 'ภาคใต้', 'สงขลา', '', ''),
('10880', 'ธีรดนย์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', '', ''),
('20079', 'ทรงสมัย', 'ภาคเหนือ', 'เชียงใหม่', '', ''),
('40090', 'ภัชชา', 'ภาคกลาง/ตะวันออก', 'นครนายก', '', ''),
('10881', 'ฟิจิ คัตส์ บาร์เบอร์ช็อป', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', '', ''),
('20080', 'พัฒนสิทธิ์', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', '', ''),
('40088', 'ศูนย์ฝึกอบรมบาร์เบอร์และซาลอน', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('20020', 'ต.ทวีทรัพย์', 'ภาคเหนือ', 'ลำพูน', '', ''),
('10883', 'ปุณยวีร์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', '', ''),
('10614', 'นฤมลเทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'บางชัน', '', ''),
('10636', 'ร้านนวมินทร์เทรดดิ้ง', 'ภาคใต้', 'ตรัง', '', ''),
('10088', 'บ้านบึงบิวตี้มาร์ท', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', '', ''),
('10606', 'ฐาปนี', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('10889', 'ร้านรักบิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', '', ''),
('10896', 'บิวตี้มาร์ท คลอง3', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('10891', 'พรคอสเมติก', 'ภาคอีสาน', 'สระบุรี', '', ''),
('10901', 'ร้านต่อดิ บิวตี้', 'ภาคอีสาน', 'สกลนคร', '', ''),
('10900', 'ร้านพันธุ์เจริญบิวตี้ ชัยภูมิ', 'ภาคอีสาน', 'ชัยภูมิ', '', ''),
('10902', 'ร้านลัดดาพร บิวตี้', 'ภาคอีสาน', 'อุดรธานี', '', ''),
('10735', 'ร้านเด่นบิวตี้ สาขาปากช่อง', 'ภาคอีสาน', 'นครราชสีมา', '', ''),
('10904', 'ร้านน้องหญิง', 'ภาคอีสาน', 'ขอนแก่น', '', ''),
('10906', 'ร้านพัทยาบิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', '', ''),
('10492', 'ซี เอ กรุ๊ป วีดีโอ', 'ภาคใต้', 'ประจวบคีรีขันธ์', '', ''),
('10733', 'สาธุบิวตี้เซ็นเตอร์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ยานนาวา', '', ''),
('10791', 'พิงค์บิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', '', ''),
('10806', 'คุณศุภกานต์ เปิ้นสมุทร', 'เขตกรุงเทพและปริมณฑล', 'ตลิ่งชัน', '', ''),
('10629', 'คุณบุศรินทร์ วรฮาด', 'เขตกรุงเทพและปริมณฑล', 'ลาดกระบัง', '', ''),
('10688', 'เอส ที บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ลาดกระบัง', '', ''),
('10692', 'แฮปปี้แลนด์บิวตี้(มีนบุรี)', 'เขตกรุงเทพและปริมณฑล', 'มีนบุรี', '', ''),
('10596', 'เจ.เค.แฮร์ แอนด์ บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ดอนเมือง', '', ''),
('10607', 'ดีดีบิวตี้เซ็นเตอร์', 'เขตกรุงเทพและปริมณฑล', 'บางเขน', '', ''),
('10648', 'เฟื่องฟ้า 2019', 'เขตกรุงเทพและปริมณฑล', 'บางกะปิ', '', ''),
('10691', 'แฮปปี้แลนด์บิวตี้(บางกะปิ)', 'เขตกรุงเทพและปริมณฑล', 'บางกะปิ', '', ''),
('10646', 'พันธุ์เจริญบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'บางกะปิ', '', ''),
('10644', 'คุณพิชัย แก้วประไพ', 'เขตกรุงเทพและปริมณฑล', 'ราชเทวี', '', ''),
('10675', 'คุณพรชัย สมบูรณ์ศักดิกุล', 'เขตกรุงเทพและปริมณฑล', 'ดุสิต', '', ''),
('10681', 'คุณสมรัตน์ พลศิลา', 'เขตกรุงเทพและปริมณฑล', 'บางพลัด', '', ''),
('10730', 'ช่อคูน เรมีดี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'หนองแขม', '', ''),
('10690', 'เอ็น.ดับเบิ้ลยู.บิวตี้ เทรดดิ้ง จำกัด', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', '', ''),
('10281', 'พราว บิวตี้ช็อป', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', '', ''),
('10824', 'คุณภินัญนัฎฐ์ โชคอำนวย', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', '', ''),
('10810', 'คุณเฉลิมจิรา วุฒิวงศษนันท์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', '', ''),
('10640', 'พันธุ์เจริญ บิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('10720', 'โอ.จี.บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('10660', 'ศรีรังสิต', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('10666', 'สะพานแดงบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('40035', 'คุณสมประสงค์  สุทธางกูร', 'ภาคกลาง/ตะวันออก', 'สมุทรสาคร', '', ''),
('10830', 'แชมป์บิวตี้ สาธุประดิษฐ์', 'เขตกรุงเทพและปริมณฑล', 'ยานนาวา', '', ''),
('10677', 'สาวิตรีแฟมมิลี่บิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ราษฎบูรณะ', '', ''),
('10667', 'สิริญ บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'บางแค', '', ''),
('10712', 'คุณกอบเกียรติ สุทธิสรสัมพันธ์', 'เขตกรุงเทพและปริมณฑล', 'บางแค', '', ''),
('10736', 'คุณกนก เรืองลั่น', 'เขตกรุงเทพและปริมณฑล', 'คลองสาน', '', ''),
('10017', 'แวรีส บาร์เบอร์คลับ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'บางแค', '', ''),
('10051', 'เดอะ แร็บบิท โฮ ครีเอทีฟ ซาลอน', 'เขตกรุงเทพและปริมณฑล', 'บางแค', '', ''),
('10096', 'คุณประเสริฐ ยศมา', 'เขตกรุงเทพและปริมณฑล', 'บางแค', '', ''),
('10820', 'คุณพัทธนันท์ วรรณวรอนันทร์', 'เขตกรุงเทพและปริมณฑล', 'สาทร', '', ''),
('10168', 'คุณสุรชาติ ภาพฉิมพลี', 'เขตกรุงเทพและปริมณฑล', 'หนองแขม', '', ''),
('10085', 'บิวเทรี่ยม จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ปทุมวัน', '', ''),
('70002', 'ฮักแฮร์4289 จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สายไหม', '', ''),
('10186', 'คุณธีระ สุปินตา', 'เขตกรุงเทพและปริมณฑล', 'ดอนเมือง', '', ''),
('10674', 'เสรีเจริญการค้า จำกัด', 'เขตกรุงเทพและปริมณฑล', 'พญาไท', '', ''),
('10767', 'คุณดลพร มีธรรมสวนะ', 'เขตกรุงเทพและปริมณฑล', 'จัตุจักร', '', ''),
('40033', 'คุณวรรณพัทธ์   ปนัสยาธนากุญช์', 'เขตกรุงเทพและปริมณฑล', 'ทวีวัฒนา', '', ''),
('10013', 'คุณเกตุแก้ว ตุ่มงาม', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', '', ''),
('10147', 'คุณวิรุฬห์ บุญเกิดลาภ', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('10836', 'คุณชวฤทธิ์ เรืองลั่น', 'เขตกรุงเทพและปริมณฑล', 'คลองสาน', '', ''),
('10726', 'คุณอาทิตย์ แสงประเสริฐ', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('10780', 'เดอะกาแรม จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', '', ''),
('40006', 'คุณเจตนา  พลาวงศ์', 'เขตกรุงเทพและปริมณฑล', 'สาทร', '', ''),
('70011', 'ลิทเทิ้ล เรดฟ็อกซ์ คิดส์ซาลอน จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', '', ''),
('50029', 'คุณเฉลิมชนม์ ชูเพชร', 'เขตกรุงเทพและปริมณฑล', 'คลองสามวา', '', ''),
('10006', 'คุณกฤษณี ท้ายวัด', 'เขตกรุงเทพและปริมณฑล', 'หนองแขม', '', ''),
('40005', 'คุณจีรัฐติ  สงวนไทย', 'เขตกรุงเทพและปริมณฑล', 'จตุจักร', '', ''),
('70004', 'เอ็น พี เอ็กซ์ กรุ๊ป จำกัด', 'เขตกรุงเทพและปริมณฑล', 'บึงกุ่ม', '', ''),
('10154', 'คุณศิรินภา สว่างล้ำวิทยฐานกรณ์', 'เขตกรุงเทพและปริมณฑล', 'บางคอแหลม', '', ''),
('10023', 'KAI CHUEH LIN (X2797)', 'เขตกรุงเทพและปริมณฑล', 'จตุจักร', '', ''),
('10838', 'ณัชรินทร์ อินเตอร์เนชั่นแนล จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ดอนเมือง', '', ''),
('10188', 'ฮอพบอน จำกัด', 'เขตกรุงเทพและปริมณฑล', 'หนองแขม', '', ''),
('40074', 'คุณศรัณย์ ทองถมยา', 'เขตกรุงเทพและปริมณฑล', 'บางกอกน้อย', '', ''),
('10298', 'คุณมาริสา อำนาจสุขสุวรรณ', 'เขตกรุงเทพและปริมณฑล', 'บางพลัด', '', ''),
('40063', 'คุณปฐมพร เกษรคำ', 'เขตกรุงเทพและปริมณฑล', 'บึงกุ่ม', '', ''),
('40009', 'คุณจักรพงษ์  งามพงศ์พรรณ', 'เขตกรุงเทพและปริมณฑล', 'ดุสิต', '', ''),
('40003', 'คุณกิตติพงค์  วัฒนะพยุงกุล', 'เขตกรุงเทพและปริมณฑล', 'ยานนาวา', '', ''),
('40022', 'คุณประชากร  เพ็งจันทร์ดี', 'เขตกรุงเทพและปริมณฑล', 'บางจาก', '', ''),
('40060', 'คุณภูรินทร์ หมัดป้องกัน', 'เขตกรุงเทพและปริมณฑล', 'บางคอแหลม', '', ''),
('40048', 'คุณณัฐสิทธิ์ วรรณะพาหุณ', 'เขตกรุงเทพและปริมณฑล', 'หลักสี่', '', ''),
('40043', 'คุณอุษณีษ์  อำนวยวิเศษโชค', 'เขตกรุงเทพและปริมณฑล', 'วังทองหลาง', '', ''),
('40032', 'คุณวิโรจน์  เพ็งแจ่ม', 'เขตกรุงเทพและปริมณฑล', 'บางแค', '', ''),
('40014', 'คุณเทพฤทธิ์  พรสุวรรณ', 'เขตกรุงเทพและปริมณฑล', 'บางเขน', '', ''),
('40012', 'คุณณัฐิกา  พงษ์เผือก', 'เขตกรุงเทพและปริมณฑล', 'คลองสาน', '', ''),
('40010', 'คุณชฎาณัฏฏ์  ปัญญา', 'เขตกรุงเทพและปริมณฑล', 'สายไหม', '', ''),
('40077', 'คุณศิริชัย มาละมิ่ง', 'เขตกรุงเทพและปริมณฑล', 'ดอนเมือง', '', ''),
('10081', 'นิวยอร์คคัท 641 จำกัด', 'เขตกรุงเทพและปริมณฑล', 'พญาไท', '', ''),
('10787', 'MBAS', 'พม่า', 'ต่างประเทศ', '', ''),
('10423', 'บูม บูม บิวตี้', 'ภาคกลาง/ตะวันออก', 'นครปฐม', '', ''),
('10438', 'พัทยา บิวตี้ (ประเทศไทย) จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', '', ''),
('10430', 'พัทยา บิวตี้ (ประเทศไทย) จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', '', ''),
('10092', 'บิวตี้มอล สาขาชลบุรี', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', '', ''),
('10127', 'ลูกหยี', 'ภาคกลาง/ตะวันออก', 'ระยอง', '', ''),
('10811', 'บี อัลติเมท จำกัด', 'ภาคกลาง/ตะวันออก', 'ระยอง', '', ''),
('10815', 'เมย์ บิวตี๊ช็อป', 'ภาคอีสาน', 'นครราชสีมา', '', ''),
('10101', 'คุณพงษ์พันธ์ พรมสอน', 'ภาคกลาง/ตะวันออก', 'ชัยภูมิ', '', ''),
('40057', 'คุณราชาวดี เล้าอรุณ', 'ภาคกลาง/ตะวันออก', 'กาญจนบุรี', '', ''),
('10486', 'จันทร์เพ็ญ', 'ภาคใต้', 'ประจวบคีรีขันธ์', '', ''),
('10579', 'หนึ่งบิวตี้ สาขา 1', 'ภาคใต้', 'ชุมพร', '', ''),
('10842', 'หจก.รักไทยซุปเปอร์มาร์เก็ต', 'ภาคใต้', 'พัทลุง', '', ''),
('10714', 'เจ-จันทร์', 'ภาคใต้', 'นครศรีธรรมราช', '', ''),
('10512', 'บิวตี้ ซาลอน', 'ภาคใต้', 'สงขลา', '', ''),
('10521', 'ไบ ดา ช้อป', 'ภาคใต้', 'สงขลา', '', ''),
('10566', 'แสงอรุณบิวตี้', 'ภาคใต้', 'สงขลา', '', ''),
('10670', 'สุขสวัสดิ์บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 661/49 ถนนสุขสวัสดิ์', '081-376-9187'),
('CUS-AGENT-999', 'ร้านเทสทดสอบ-1780650337148', 'ภาคใต้', 'สงขลา', 'หาดใหญ่', ''),
('0', 'บริษัทพันธ์วาดีจำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพ', 'ทวีวัฒนา', ''),
('รอระบุข้อมูล', 'ร้านวันบิวตี้วัน', 'ภาคอีสาน', 'อุบลราชธนี', '', ''),
('10908', 'รินะบิวตี้ 2011', 'ภาคอีสาน', 'หนองคาย', '', ''),
('รอระบุข้อมูล', 'ร้านหน้าตาดี', 'เขตกรุงเทพและปริมณฑล', 'ร้อยเอ็ด', 'หนองอีเกิ้ง', '');

```

---

### 📄 File: `supabase\phase4b_workshop.sql`
```sql
-- ============================================================
-- GoCost — Phase 4b: ระบบวางแผน Workshop (โมเดลใหม่ทั้งหมด ตามที่ออกแบบร่วมกัน)
-- รันหลัง phase4a_stores.sql + phase4a_stores_seed.sql
--
-- สถานะของ workshop_plans (status):
--   pending_approval    → เซลล์เพิ่งสร้าง รอผู้มีสิทธิ์อนุมัติ (permission 'workshop-approve')
--   rejected            → ถูกปฏิเสธ จบ flow
--   awaiting_sales_data → อนุมัติแล้ว รอเซลล์กรอกข้อมูลหลังจบงาน
--   pending_accounting  → เซลล์กรอกข้อมูลแล้ว รอบัญชีลงค่าใช้จ่าย (permission 'workshop-accounting')
--   completed           → บัญชีลงข้อมูลเสร็จ จบ flow เต็มรูปแบบ
-- ============================================================

create table if not exists workshop_plans (
  id                     text primary key,           -- 'WS' + timestamp เหมือน convention เดิมของแอพ
  store_id               bigint not null references stores(id),
  planned_date           date not null,               -- วันที่วางแผนจัดงาน (เซลล์เลือกเอง)
  status                 text not null default 'pending_approval',
  created_by             text not null references users(id),
  created_at             timestamptz not null default now(),
  approved_by            text references users(id),
  approved_at            timestamptz,
  admin_note             text,
  -- ข้อมูลที่เซลล์กรอกหลังจบงาน
  attendees              int,
  sales_push_amount      numeric,        -- "ยอดขายดันเข้าร้านค้า" — นับเป็นรายได้บริษัทจริง
  workshop_sales_amount  numeric,        -- "ยอดขาย workshop" — ยอดขายของร้าน ไม่นับเป็นรายได้บริษัท
  attachment_path        text,           -- path ใน Supabase Storage bucket 'workshop-attachments'
  sales_data_submitted_at timestamptz,
  -- ผลตอนบัญชีลงข้อมูลเสร็จ
  accounting_doc_number  text,           -- อ้างอิงเลขที่เอกสารใน expense_records ที่บัญชีสร้างขึ้น
  accounting_completed_by text references users(id),
  accounting_completed_at timestamptz
);

create index if not exists idx_workshop_plans_status on workshop_plans(status);
create index if not exists idx_workshop_plans_created_by on workshop_plans(created_by);

alter table workshop_plans enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- create_workshop_plan — สร้างคำขอใหม่ (เซลล์) สถานะเริ่มต้น pending_approval
-- ─────────────────────────────────────────────
create or replace function create_workshop_plan(p_store_id bigint, p_planned_date date, p_created_by text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id text := 'WS' || (extract(epoch from clock_timestamp()) * 1000)::bigint;
  v_store_name text;
begin
  if not has_page_permission(p_created_by, 'workshop-plan') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์สร้างคำขอ Workshop');
  end if;
  if p_store_id is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกร้านค้า');
  end if;
  if p_planned_date is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกวันที่วางแผนจัดงาน');
  end if;

  select name into v_store_name from stores where id = p_store_id;
  if v_store_name is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;

  insert into workshop_plans (id, store_id, planned_date, created_by)
  values (v_id, p_store_id, p_planned_date, p_created_by);

  perform add_notification('', '', format('%s เสนอแผน Workshop ร้าน %s วันที่ %s', p_created_by, v_store_name, p_planned_date), v_id);
  perform write_audit_log(p_created_by, 'CREATE_WORKSHOP', 'Workshop_Plans', format('สร้างแผน: %s (%s)', v_id, v_store_name));

  return jsonb_build_object('success', true, 'planId', v_id, 'message', 'ส่งคำขอ Workshop เรียบร้อย รอผู้มีสิทธิ์อนุมัติ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_workshop_plans — ต้องมีสิทธิ์อย่างน้อย 1 ใน 3 หน้า workshop ถึงจะเรียกได้
-- คืนมาทั้งหมด ให้ frontend กรองตาม status ตามแต่ละหน้าเอง
-- ─────────────────────────────────────────────
create or replace function get_workshop_plans(p_actor_id text)
returns table (
  id text, store_id bigint, store_name text, region text, province text,
  assigned_sales_name text, planned_date date, status text,
  created_by text, created_at timestamptz, approved_by text, approved_at timestamptz, admin_note text,
  attendees int, sales_push_amount numeric, workshop_sales_amount numeric,
  attachment_path text, sales_data_submitted_at timestamptz,
  accounting_doc_number text, accounting_completed_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not (has_page_permission(p_actor_id, 'workshop-plan')
       or has_page_permission(p_actor_id, 'workshop-approve')
       or has_page_permission(p_actor_id, 'workshop-accounting')) then
    raise exception 'คุณไม่มีสิทธิ์ดูข้อมูล Workshop';
  end if;

  return query
  select wp.id, wp.store_id, s.name, s.region, s.province, u.name,
         wp.planned_date, wp.status, wp.created_by, wp.created_at,
         wp.approved_by, wp.approved_at, wp.admin_note,
         wp.attendees, wp.sales_push_amount, wp.workshop_sales_amount,
         wp.attachment_path, wp.sales_data_submitted_at,
         wp.accounting_doc_number, wp.accounting_completed_at
  from workshop_plans wp
  join stores s on s.id = wp.store_id
  left join users u on u.id = s.assigned_sales_id
  order by wp.created_at desc;
end;
$$;

-- ─────────────────────────────────────────────
-- approve_workshop_plan / reject_workshop_plan — ต้องมีสิทธิ์ 'workshop-approve'
-- ─────────────────────────────────────────────
create or replace function approve_workshop_plan(p_plan_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
begin
  if not has_page_permission(p_actor_id, 'workshop-approve') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์อนุมัติ Workshop');
  end if;

  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status <> 'pending_approval' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  update workshop_plans set status = 'awaiting_sales_data', approved_by = p_actor_id, approved_at = now()
  where id = p_plan_id;

  perform add_notification('', v_row.created_by, format('แผน Workshop %s ได้รับการอนุมัติแล้ว — กรอกข้อมูลหลังงานได้เลย', p_plan_id), p_plan_id);
  perform write_audit_log(p_actor_id, 'APPROVE_WORKSHOP', 'Workshop_Plans', 'อนุมัติ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'อนุมัติแผน Workshop สำเร็จ');
end;
$$;

create or replace function reject_workshop_plan(p_plan_id text, p_admin_note text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
begin
  if not has_page_permission(p_actor_id, 'workshop-approve') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ปฏิเสธ Workshop');
  end if;

  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status <> 'pending_approval' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  update workshop_plans set status = 'rejected', admin_note = coalesce(p_admin_note, ''), approved_by = p_actor_id, approved_at = now()
  where id = p_plan_id;

  perform add_notification('', v_row.created_by, format('แผน Workshop %s ถูกปฏิเสธ: %s', p_plan_id, coalesce(p_admin_note, '-')), p_plan_id);
  perform write_audit_log(p_actor_id, 'REJECT_WORKSHOP', 'Workshop_Plans', 'ปฏิเสธ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'ปฏิเสธแผน Workshop สำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- submit_workshop_sales_data — เซลล์กรอกข้อมูลหลังจบงาน (เฉพาะเจ้าของแผนเท่านั้น)
-- แยก 2 ยอดขายตามที่คุยกัน: sales_push_amount (นับรายได้บริษัท) กับ
-- workshop_sales_amount (ไม่นับ แยกหมวดใน dashboard ต่างหาก)
-- ─────────────────────────────────────────────
create or replace function submit_workshop_sales_data(
  p_plan_id text, p_attendees int, p_sales_push_amount numeric,
  p_workshop_sales_amount numeric, p_attachment_path text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
begin
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.created_by <> p_actor_id then
    return jsonb_build_object('success', false, 'message', 'คุณไม่ใช่เจ้าของแผนนี้');
  end if;
  if v_row.status <> 'awaiting_sales_data' then
    return jsonb_build_object('success', false, 'message', 'แผนนี้ไม่ได้อยู่ในสถานะรอกรอกข้อมูล');
  end if;
  if p_attendees is null or p_attendees < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกจำนวนคนเข้างานให้ถูกต้อง');
  end if;
  if p_sales_push_amount is null or p_sales_push_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอดขายดันเข้าร้านค้าให้ถูกต้อง');
  end if;
  if p_workshop_sales_amount is null or p_workshop_sales_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอดขาย Workshop ให้ถูกต้อง');
  end if;

  update workshop_plans set
    attendees = p_attendees,
    sales_push_amount = p_sales_push_amount,
    workshop_sales_amount = p_workshop_sales_amount,
    attachment_path = p_attachment_path,
    sales_data_submitted_at = now(),
    status = 'pending_accounting'
  where id = p_plan_id;

  perform add_notification('บัญชี', '', format('Workshop %s รอบัญชีลงข้อมูล', p_plan_id), p_plan_id);
  perform write_audit_log(p_actor_id, 'SUBMIT_WORKSHOP_DATA', 'Workshop_Plans', 'กรอกข้อมูลหลังงาน: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลสำเร็จ ส่งไปรอบัญชีลงข้อมูลแล้ว');
end;
$$;

-- ─────────────────────────────────────────────
-- complete_workshop_accounting — บัญชีลงรายจ่ายจริงของงาน (ต้องมีสิทธิ์ 'workshop-accounting')
-- p_items: รายการค่าใช้จ่ายแบบเดียวกับ save_expense_record (mainCategory/detail/qty/unit/unitPrice/remark)
-- ระบบจะเติมแถวรายได้ "ยอดขายดันเข้าร้านค้า" ให้อัตโนมัติ (mainCategory='รายได้',
-- detail='ยอดขายดันสินค้าเข้า') ต่อจากรายการที่บัญชีกรอกเอง โดยใช้ตัวเลขที่เซลล์กรอกไว้แล้ว
-- ทั้งหมดถูกบันทึกเป็นเอกสารเดียวกันใน expense_records (ออกเลขที่เอกสารใหม่)
-- ─────────────────────────────────────────────
create or replace function complete_workshop_accounting(p_plan_id text, p_items jsonb, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
  v_store_name text;
  v_doc_no text;
  v_item jsonb;
  v_seq int := 0;
  v_qty numeric;
  v_unit_price numeric;
begin
  if not has_page_permission(p_actor_id, 'workshop-accounting') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลงข้อมูลบัญชี Workshop');
  end if;

  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status <> 'pending_accounting' then
    return jsonb_build_object('success', false, 'message', 'แผนนี้ไม่ได้อยู่ในสถานะรอบัญชีลงข้อมูล');
  end if;

  select name into v_store_name from stores where id = v_row.store_id;

  -- validation รายการที่บัญชีกรอกเอง (เหมือน save_expense_record)
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_seq := v_seq + 1;
    if coalesce(trim(v_item->>'mainCategory'), '') = '' then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกหมวดหมู่หลัก', v_seq));
    end if;
    if coalesce(trim(v_item->>'detail'), '') = '' then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกรายละเอียด', v_seq));
    end if;
    v_qty := (v_item->>'qty')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    if v_qty is null or v_qty <= 0 then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: จำนวนต้องมากกว่า 0', v_seq));
    end if;
    if v_unit_price is null or v_unit_price < 0 then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: ราคาต่อหน่วยไม่ถูกต้อง', v_seq));
    end if;
  end loop;

  v_doc_no := generate_document_number();
  v_seq := 0;

  -- 1) รายการค่าใช้จ่ายที่บัญชีกรอกเอง
  for v_item in select * from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note, created_by
    ) values (
      v_doc_no, v_seq, v_store_name, v_row.planned_date, v_row.attendees, 1,
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      format('Workshop %s', p_plan_id), p_actor_id
    );
  end loop;

  -- 2) แถวรายได้ "ยอดขายดันเข้าร้านค้า" เติมให้อัตโนมัติจากตัวเลขที่เซลล์กรอกไว้แล้ว
  v_seq := v_seq + 1;
  insert into expense_records (
    doc_number, seq, store_name, event_date, attendees, work_days,
    main_category, detail, qty, unit, unit_price, remark, internal_note, created_by
  ) values (
    v_doc_no, v_seq, v_store_name, v_row.planned_date, v_row.attendees, 1,
    'รายได้', 'ยอดขายดันสินค้าเข้า', 1, 'ครั้ง', v_row.sales_push_amount, '',
    format('Workshop %s — ยอดขายดันเข้าร้านค้าจากเซลล์', p_plan_id), p_actor_id
  );

  update workshop_plans set
    status = 'completed',
    accounting_doc_number = v_doc_no,
    accounting_completed_by = p_actor_id,
    accounting_completed_at = now()
  where id = p_plan_id;

  perform add_notification('', v_row.created_by, format('Workshop %s ลงบัญชีเสร็จสิ้นแล้ว เอกสารเลขที่ %s', p_plan_id, v_doc_no), v_doc_no);
  perform write_audit_log(p_actor_id, 'COMPLETE_WORKSHOP_ACCOUNTING', 'Workshop_Plans', format('%s → เอกสาร %s', p_plan_id, v_doc_no));

  return jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลบัญชีสำเร็จ จบกระบวนการ Workshop', 'docNo', v_doc_no);
end;
$$;

-- ─────────────────────────────────────────────
-- get_workshop_sales_summary — ยอดขาย Workshop แยกต่างหากสำหรับ Dashboard
-- (ไม่รวมกับ totalExpenses/totalIncome ใดๆ ใน get_dashboard_stats เดิมเลย)
-- ─────────────────────────────────────────────
create or replace function get_workshop_sales_summary(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year int := (p_filters->>'year')::int;
  v_month int := (p_filters->>'month')::int;
  v_total_workshop_sales numeric := 0;
  v_total_push_sales numeric := 0;
  v_count int := 0;
begin
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  select coalesce(sum(workshop_sales_amount), 0), coalesce(sum(sales_push_amount), 0), count(*)
  into v_total_workshop_sales, v_total_push_sales, v_count
  from workshop_plans
  where status = 'completed'
    and (v_year is null or extract(year from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  return jsonb_build_object(
    'success', true,
    'totalWorkshopSales', v_total_workshop_sales,
    'totalPushSales', v_total_push_sales,
    'completedCount', v_count
  );
end;
$$;

-- ============================================================
-- Supabase Storage: bucket สำหรับไฟล์แนบ Workshop (แทน Google Drive เดิม)
-- ต้องรันส่วนนี้ด้วย — สร้าง bucket ผ่าน SQL ได้เลยไม่ต้องกดในหน้า Dashboard
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('workshop-attachments', 'workshop-attachments', false, 10485760) -- 10MB ตามที่กำหนด
on conflict (id) do nothing;

-- ⚠️ หมายเหตุสำคัญเรื่องความปลอดภัยของไฟล์แนบ (อ่านก่อนใช้งานจริง):
-- ระบบนี้ไม่ได้ใช้ Supabase Auth จริง (login เป็นระบบที่เขียนเอง) ทำให้ Storage RLS
-- ไม่สามารถเช็คได้ว่า "ใครคือเจ้าของไฟล์" แบบเดียวกับที่ RPC ทุกตัวในระบบนี้ก็เช็คสิทธิ์
-- ผ่านการส่ง p_actor_id เข้ามาเองเช่นกัน ไม่ได้พึ่ง RLS ของ Postgres เลย — bucket นี้จึง
-- ต้องเปิดให้ anon key เขียน/อ่านได้ (เหมือน RPC ทุกตัวที่ anon key เรียกได้หมด อาศัย
-- การเช็คสิทธิ์ข้างในฟังก์ชันแทน) พูดอีกแบบคือใครก็ตามที่มี anon key และรู้ path ไฟล์
-- (ซึ่งมี plan_id แบบสุ่มปนอยู่ เดายาก) จะเปิดไฟล์ได้ — ระดับความเสี่ยงเทียบเท่ากับ
-- RPC อื่นๆ ในระบบนี้ทั้งหมด ไม่ได้ต่ำกว่าหรือสูงกว่า
drop policy if exists "workshop attachments insert via anon" on storage.objects;
create policy "workshop attachments insert via anon"
  on storage.objects for insert to anon
  with check (bucket_id = 'workshop-attachments');

drop policy if exists "workshop attachments select via anon" on storage.objects;
create policy "workshop attachments select via anon"
  on storage.objects for select to anon
  using (bucket_id = 'workshop-attachments');


```

---

### 📄 File: `supabase\phase4c_dashboard_income_fix.sql`
```sql
-- ============================================================
-- GoCost — Phase 4c: แก้ get_dashboard_stats ให้แยกหมวด "รายได้" ออกจากยอดใช้จ่ายจริง
--
-- เหตุผล: ตอนตรวจสอบ get_dashboard_stats ครั้งก่อน (เฟส 2) พบว่าโค้ดต้นฉบับ (Apps
-- Script เดิม) มี logic แยกหมวด "รายได้"/"ยอดขายดันสินค้าเข้า" ออกจากยอดใช้จ่าย แต่
-- ไม่เคยทำงานจริงเพราะหมวดหมู่นี้ไม่มีอยู่ใน dropdown เลย จึงตอนนั้นตัดสินใจไม่พอร์ต
-- ส่วนนี้มา (เพราะดูเหมือน dead code) — ตอนนี้ Workshop flow ใหม่ทำให้หมวดนี้ถูกใช้งาน
-- จริงแล้ว (complete_workshop_accounting เขียนแถว main_category='รายได้' จริง) จึงต้อง
-- เพิ่ม logic แยกยอดนี้ออกจาก totalExpenses/byCategory ให้ถูกต้อง ไม่งั้นยอดรายได้จาก
-- Workshop จะไปปนเข้ากับยอดใช้จ่ายรวมอย่างผิดพลาด
-- ============================================================

create or replace function get_dashboard_stats(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year int := (p_filters->>'year')::int;
  v_month int := (p_filters->>'month')::int;
  v_category text := nullif(trim(p_filters->>'category'), '');
  v_detail text := nullif(trim(p_filters->>'detail'), '');
  v_store text := nullif(trim(p_filters->>'store'), '');
  v_total_expenses numeric := 0;
  v_total_income numeric := 0;
  v_by_category jsonb := '{}'::jsonb;
  v_by_month jsonb := '{}'::jsonb;
  v_doc_count int := 0;
  v_top_category text := '-';
  v_top_amount numeric := 0;
  r record;
  v_cat_amount numeric;
begin
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  -- ยอดใช้จ่ายจริง (ไม่รวมแถว main_category = 'รายได้')
  for r in
    select doc_number, main_category, event_date,
           sum(total) as row_total
    from expense_records
    where main_category <> 'รายได้'
      and (v_year is null or extract(year from event_date) = v_year)
      and (v_month is null or extract(month from event_date) = v_month)
      and (v_category is null or main_category = v_category)
      and (v_detail is null or detail = v_detail)
      and (v_store is null or store_name = v_store)
    group by doc_number, main_category, event_date
  loop
    v_total_expenses := v_total_expenses + coalesce(r.row_total, 0);
    v_cat_amount := coalesce((v_by_category->>r.main_category)::numeric, 0) + coalesce(r.row_total, 0);
    v_by_category := v_by_category || jsonb_build_object(r.main_category, v_cat_amount);
    if r.event_date is not null then
      v_by_month := v_by_month || jsonb_build_object(
        to_char(r.event_date, 'YYYY-MM'),
        coalesce((v_by_month->>to_char(r.event_date, 'YYYY-MM'))::numeric, 0) + coalesce(r.row_total, 0)
      );
    end if;
  end loop;

  -- ยอดรายได้ (เฉพาะแถว main_category = 'รายได้' — มาจาก Workshop accounting เท่านั้น)
  select coalesce(sum(total), 0) into v_total_income
  from expense_records
  where main_category = 'รายได้'
    and (v_year is null or extract(year from event_date) = v_year)
    and (v_month is null or extract(month from event_date) = v_month)
    and (v_store is null or store_name = v_store);

  select count(distinct doc_number) into v_doc_count
  from expense_records
  where main_category <> 'รายได้'
    and (v_year is null or extract(year from event_date) = v_year)
    and (v_month is null or extract(month from event_date) = v_month)
    and (v_category is null or main_category = v_category)
    and (v_detail is null or detail = v_detail)
    and (v_store is null or store_name = v_store);

  select key, value::numeric into v_top_category, v_top_amount
  from jsonb_each_text(v_by_category)
  order by value::numeric desc
  limit 1;

  return jsonb_build_object(
    'success', true,
    'totalExpenses', v_total_expenses,
    'totalSpend', v_total_expenses,
    'totalIncome', v_total_income,
    'netDiff', v_total_income - v_total_expenses,
    'docCount', v_doc_count,
    'avgPerDoc', case when v_doc_count > 0 then v_total_expenses / v_doc_count else 0 end,
    'topCategory', coalesce(v_top_category, '-'),
    'topCategoryAmount', coalesce(v_top_amount, 0),
    'byCategory', v_by_category,
    'byMonth', v_by_month
  );
end;
$$;

```

---

### 📄 File: `supabase\phase4d_defaults_and_migration.sql`
```sql
-- ============================================================
-- GoCost — Phase 4d: default permissions สำหรับหน้า Workshop ใหม่ + backfill user เดิม
-- รันหลัง phase4b_workshop.sql (ต้องมี has_page_permission และตาราง users.page_permissions
-- จาก phase3b/3c อยู่ก่อนแล้ว)
-- ============================================================

-- ─────────────────────────────────────────────
-- save_user — อัปเดต default page_permissions ให้ตรงกับ role จริงที่ควรทำอะไรได้
-- (เซลล์ → workshop-plan, บัญชี → workshop-accounting, ผู้บริหาร → workshop-approve)
-- ไม่เปลี่ยน logic ส่วนอื่นของ save_user เลย นอกจาก case ของ v_default_perms
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_actor_role text;
  v_current_role text;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select role into v_actor_role from users where id = p_actor_id;

  select exists(select 1 from users where id = p_id) into v_exists;
  if v_exists then select role into v_current_role from users where id = p_id; end if;

  if p_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ตั้งค่าหรือมอบ role ADMIN ให้ผู้อื่นได้');
  end if;
  if v_exists and v_current_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบัญชี ADMIN ได้');
  end if;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ADMIN' then
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan","workshop-approve","workshop-accounting"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","workshop-accounting"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- ─────────────────────────────────────────────
-- Backfill: เติมสิทธิ์หน้า Workshop ให้ user ที่มีอยู่แล้วก่อนเฟสนี้ตาม role ปัจจุบัน
-- (แค่ "เติม" ให้ ไม่ลบสิทธิ์อื่นที่มีอยู่แล้ว — ใช้ || สำหรับรวม jsonb array)
-- ─────────────────────────────────────────────
update users set page_permissions = page_permissions || '["workshop-approve"]'::jsonb
where role = 'ผู้บริหาร' and not (page_permissions ? 'workshop-approve');

update users set page_permissions = page_permissions || '["workshop-plan"]'::jsonb
where role = 'เซลล์' and not (page_permissions ? 'workshop-plan');

update users set page_permissions = page_permissions || '["workshop-accounting"]'::jsonb
where role = 'บัญชี' and not (page_permissions ? 'workshop-accounting');

```

---

### 📄 File: `supabase\phase4e_stores_crud.sql`
```sql
-- ============================================================
-- GoCost — Phase 4e: แทนที่ข้อมูลร้านค้าด้วยไฟล์ใหม่ + เพิ่ม CRUD เต็มรูปแบบ
-- รันหลัง phase4d_defaults_and_migration.sql
--
-- ⚠️ คำเตือนสำคัญ: ส่วน TRUNCATE ด้านล่างจะลบร้านค้าเดิมทั้งหมดและ CASCADE ไปลบ
-- workshop_plans ที่อ้างอิงร้านเหล่านั้นด้วย (เพราะมี foreign key) ถ้ามีคำขอ Workshop
-- ที่สร้างไว้แล้วจากข้อมูลร้านชุดเดิม จะหายไปด้วย — ถ้าไม่ต้องการแบบนี้ ให้หยุดก่อน
-- รันส่วนนี้แล้วแจ้งกลับมา จะทำสคริปต์ sync แบบไม่ลบข้อมูลเดิมให้แทน
-- ============================================================

-- เพิ่มคอลัมน์ label ข้อความอิสระสำหรับชื่อเซลล์ (แยกจาก assigned_sales_id ที่เป็น FK จริง)
alter table stores add column if not exists assigned_sales_name text;

-- ล้างข้อมูลร้านค้าเดิมทั้งหมด (ตามที่ขอ "เอามาจากไฟล์นี้แทน")
truncate table stores cascade;

-- ============================================================
-- CRUD RPCs สำหรับหน้า "จัดการร้านค้า" (ต้องมีสิทธิ์ page key 'stores')
-- ============================================================

create or replace function get_stores(p_actor_id text, p_query text default null)
returns table (
  id bigint, customer_code text, name text, region text, province text,
  assigned_sales_name text, assigned_sales_id text, created_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'stores') then
    raise exception 'คุณไม่มีสิทธิ์ดูข้อมูลร้านค้า';
  end if;

  return query
  select s.id, s.customer_code, s.name, s.region, s.province,
         s.assigned_sales_name, s.assigned_sales_id, s.created_at
  from stores s
  where p_query is null or trim(p_query) = ''
     or s.name ilike '%' || p_query || '%'
     or s.customer_code ilike '%' || p_query || '%'
     or s.province ilike '%' || p_query || '%'
  order by s.name;
end;
$$;

create or replace function create_store(
  p_customer_code text, p_name text, p_region text, p_province text,
  p_assigned_sales_name text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id bigint;
begin
  if not has_page_permission(p_actor_id, 'stores') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์เพิ่มร้านค้า');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อร้านค้า');
  end if;

  insert into stores (customer_code, name, region, province, assigned_sales_name)
  values (nullif(trim(p_customer_code), ''), trim(p_name), nullif(trim(p_region), ''),
          nullif(trim(p_province), ''), nullif(trim(p_assigned_sales_name), ''))
  returning id into v_id;

  perform write_audit_log(p_actor_id, 'CREATE_STORE', 'Stores', format('เพิ่มร้าน: %s (id %s)', p_name, v_id));
  return jsonb_build_object('success', true, 'message', 'เพิ่มร้านค้าสำเร็จ', 'id', v_id);
end;
$$;

create or replace function update_store(
  p_id bigint, p_customer_code text, p_name text, p_region text, p_province text,
  p_assigned_sales_name text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'stores') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขร้านค้า');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อร้านค้า');
  end if;

  update stores set
    customer_code = nullif(trim(p_customer_code), ''),
    name = trim(p_name),
    region = nullif(trim(p_region), ''),
    province = nullif(trim(p_province), ''),
    assigned_sales_name = nullif(trim(p_assigned_sales_name), '')
  where id = p_id;

  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;

  perform write_audit_log(p_actor_id, 'UPDATE_STORE', 'Stores', format('แก้ไขร้าน id %s: %s', p_id, p_name));
  return jsonb_build_object('success', true, 'message', 'แก้ไขร้านค้าสำเร็จ');
end;
$$;

create or replace function delete_store(p_id bigint, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_in_use int;
begin
  if not has_page_permission(p_actor_id, 'stores') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบร้านค้า');
  end if;

  select count(*) into v_in_use from workshop_plans where store_id = p_id;
  if v_in_use > 0 then
    return jsonb_build_object('success', false, 'message',
      format('ลบไม่ได้ — มีคำขอ Workshop ผูกอยู่กับร้านนี้ %s รายการ', v_in_use));
  end if;

  delete from stores where id = p_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;

  perform write_audit_log(p_actor_id, 'DELETE_STORE', 'Stores', 'ลบร้าน id: ' || p_id);
  return jsonb_build_object('success', true, 'message', 'ลบร้านค้าสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- search_stores — อัปเดตให้ส่ง assigned_sales_name (label ข้อความ) มาด้วย
-- ใช้ coalesce กับชื่อจาก assigned_sales_id (ถ้ามีการผูกบัญชีจริงในอนาคต ให้ใช้อันนั้นก่อน)
-- ─────────────────────────────────────────────
create or replace function search_stores(p_query text)
returns table (
  id bigint, customer_code text, name text, region text, province text,
  assigned_sales_id text, assigned_sales_name text
)
language sql
security definer
as $$
  select s.id, s.customer_code, s.name, s.region, s.province,
         s.assigned_sales_id, coalesce(u.name, s.assigned_sales_name) as assigned_sales_name
  from stores s
  left join users u on u.id = s.assigned_sales_id
  where p_query is null or trim(p_query) = ''
     or s.name ilike '%' || p_query || '%'
     or s.customer_code ilike '%' || p_query || '%'
     or s.province ilike '%' || p_query || '%'
     or s.region ilike '%' || p_query || '%'
  order by s.name
  limit 20;
$$;

-- ─────────────────────────────────────────────
-- default permission ใหม่: เพิ่ม 'stores' ให้ ADMIN โดย default (คนอื่นต้องให้ ADMIN
-- มอบสิทธิ์เองทีละคนถ้าต้องการ) — เปลี่ยนแค่ v_default_perms case ของ ADMIN เท่านั้น
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_actor_role text;
  v_current_role text;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select role into v_actor_role from users where id = p_actor_id;

  select exists(select 1 from users where id = p_id) into v_exists;
  if v_exists then select role into v_current_role from users where id = p_id; end if;

  if p_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ตั้งค่าหรือมอบ role ADMIN ให้ผู้อื่นได้');
  end if;
  if v_exists and v_current_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบัญชี ADMIN ได้');
  end if;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ADMIN' then
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan","workshop-approve","workshop-accounting","stores"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","workshop-accounting"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- backfill: เติมสิทธิ์ 'stores' ให้บัญชี ADMIN ที่มีอยู่แล้ว
update users set page_permissions = page_permissions || '["stores"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'stores');

```

---

### 📄 File: `supabase\phase4e_stores_seed_v2.sql`
```sql
-- ============================================================
-- GoCost — Phase 4e seed data (แทนที่ข้อมูลร้านค้าเดิมทั้งหมด)
-- นำเข้าจากไฟล์ใหม่ที่คุณส่งมา (490 ร้าน หลังตัดแถวซ้ำ)
-- คอลัมน์ 'เซลล์' ในไฟล์นี้เป็น label ข้อความอิสระ (เช่น 'เซลล์กนก')
-- ไม่ใช่ user id จริง จึงเก็บเป็น assigned_sales_name (ข้อความ) แยกจาก
-- assigned_sales_id (FK ไป users.id) ที่ยังว่างไว้ ให้ผูกทีหลังผ่านหน้า
-- 'จัดการร้านค้า' เองถ้าต้องการผูกกับบัญชี user จริง
-- ============================================================

insert into stores (customer_code, name, region, province, assigned_sales_name) values
('10659', 'คุณวรัชยา ประประโคน/เฮง เฮง บางขุนนนท์', 'เขตกรุงเทพและปริมณฑล', 'บางกอกน้อย', 'เซลล์กนก'),
('10682', 'สินสุขพลัส จำกัด', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'เซลล์กนก'),
('10657', 'คุณเวณุ ฤกษ์ศิริรัตน์', 'เขตกรุงเทพและปริมณฑล', 'สาทร', 'เซลล์กนก'),
('10733', 'สาธุบิวตี้เซ็นเตอร์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ยานนาวา', 'เซลล์กนก'),
('10656', 'วีซ่าเทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10791', 'พิงค์บิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10651', 'มีนบุรีบิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'มีนบุรี', 'เซลล์กนก'),
('10806', 'คุณศุภกานต์ เปิ้นสมุทร', 'เขตกรุงเทพและปริมณฑล', 'ตลิ่งชัน', 'เซลล์กนก'),
('10629', 'คุณบุศรินทร์ วรฮาด', 'เขตกรุงเทพและปริมณฑล', 'ลาดกระบัง', 'เซลล์กนก'),
('10688', 'เอส ที บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ลาดกระบัง', 'เซลล์กนก'),
('10692', 'แฮปปี้แลนด์บิวตี้(มีนบุรี)', 'เขตกรุงเทพและปริมณฑล', 'มีนบุรี', 'เซลล์กนก'),
('10003', 'กะจะสวย โดย นางสาวตรีณัฐ แดงบาง', 'เขตกรุงเทพและปริมณฑล', 'มีนบุรี', 'เซลล์กนก'),
('10617', 'เนอร์ร่า บิวตี้ เอ็กซ์เปิร์ต จำกัด', 'เขตกรุงเทพและปริมณฑล', 'คลองสามวา', 'เซลล์กนก'),
('10199', 'คิวเทน', 'เขตกรุงเทพและปริมณฑล', 'สายไหม', 'เซลล์กนก'),
('10594', 'กำเนิดซาลอน', 'เขตกรุงเทพและปริมณฑล', 'สายไหม', 'เซลล์กนก'),
('10596', 'เจ.เค.แฮร์ แอนด์ บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ดอนเมือง', 'เซลล์กนก'),
('10634', 'คุณประเทือง เหมพันธ์', 'เขตกรุงเทพและปริมณฑล', 'บางเขน', 'เซลล์กนก'),
('10258', 'ใบหม่อนบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'บางเขน', 'เซลล์กนก'),
('10693', 'แฮร์คลับ', 'เขตกรุงเทพและปริมณฑล', 'บางเขน', 'เซลล์กนก'),
('10607', 'ดีดีบิวตี้เซ็นเตอร์', 'เขตกรุงเทพและปริมณฑล', 'บางเขน', 'เซลล์กนก'),
('10637', 'พนธกร', 'เขตกรุงเทพและปริมณฑล', 'คันนายาว', 'เซลล์กนก'),
('10776', 'แกรนด์ ลักชัวรี่ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สะพานสูง', 'เซลล์กนก'),
('10809', 'เอ็นเอ็ม บิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'บึงกุ่ม', 'เซลล์กนก'),
('10648', 'เฟื่องฟ้า 2019', 'เขตกรุงเทพและปริมณฑล', 'บางกะปิ', 'เซลล์กนก'),
('10691', 'แฮปปี้แลนด์บิวตี้(บางกะปิ)', 'เขตกรุงเทพและปริมณฑล', 'บางกะปิ', 'เซลล์กนก'),
('10646', 'พันธุ์เจริญบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'บางกะปิ', 'เซลล์กนก'),
('10600', 'แจ๊ค & จิ๋ม บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ประเวศ', 'เซลล์กนก'),
('10309', 'เลิศพานิช', 'เขตกรุงเทพและปริมณฑล', 'บางนา', 'เซลล์กนก'),
('10652', 'เยาวราช', 'เขตกรุงเทพและปริมณฑล', 'พระโขนง', 'เซลล์กนก'),
('10695', 'จำเป็นบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'วัฒนา', 'เซลล์กนก'),
('10698', 'คลองตันเทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'คลองตัน', 'เซลล์กนก'),
('10619', 'บางกอกบิวตี้ เซ็นเตอร์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ราชเทวี', 'เซลล์กนก'),
('10644', 'คุณพิชัย แก้วประไพ', 'เขตกรุงเทพและปริมณฑล', 'ราชเทวี', 'เซลล์กนก'),
('10701', 'สรรพสินค้าบิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ราชเทวี', 'เซลล์กนก'),
('10221', 'ดูดีบิวตี้ซัพพลาย', 'เขตกรุงเทพและปริมณฑล', 'สาทร', 'เซลล์กนก'),
('10675', 'คุณพรชัย สมบูรณ์ศักดิกุล', 'เขตกรุงเทพและปริมณฑล', 'ดุสิต', 'เซลล์กนก'),
('10671', 'เสรีชัยเทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'ดุสิต', 'เซลล์กนก'),
('10681', 'คุณสมรัตน์ พลศิลา', 'เขตกรุงเทพและปริมณฑล', 'บางพลัด', 'เซลล์กนก'),
('10662', 'คุณศุภชัย ธรรมศิริ', 'เขตกรุงเทพและปริมณฑล', 'บางกอกน้อย', 'เซลล์กนก'),
('10705', 'บิวตี้บล๊อกเกอร์บายซีแอนเจ', 'เขตกรุงเทพและปริมณฑล', 'บางกอกน้อย', 'เซลล์กนก'),
('10599', 'จรัล บิวตี้โซน', 'เขตกรุงเทพและปริมณฑล', 'หนองแขม', 'เซลล์กนก'),
('10730', 'ช่อคูน เรมีดี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'หนองแขม', 'เซลล์กนก'),
('10611', 'ตุ๊ก บางบอนบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'บางบอน', 'เซลล์กนก'),
('10590', 'ก้าวเจริญ บางบอน', 'เขตกรุงเทพและปริมณฑล', 'บางบอน', 'เซลล์กนก'),
('10690', 'เอ็น.ดับเบิ้ลยู.บิวตี้ เทรดดิ้ง จำกัด', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10641', 'PP บิวตี้มาร์ท', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10631', 'บางศรีเมือง บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10630', 'บิวตี้ทูเดย์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10623', 'บิวตี้มาร์ท', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10700', 'หสม.ริช-วัน บิวตี้ช๊อป', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10699', 'แชมป์บิวตี้เซ็นเตอร์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10650', 'แมคบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10668', 'สิริพรรณ บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10697', 'รติพร มิตรประชา', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10281', 'พราว บิวตี้ช็อป', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10824', 'คุณภินัญนัฎฐ์ โชคอำนวย', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10810', 'คุณเฉลิมจิรา วุฒิวงศษนันท์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10661', 'คุณศศิประภา มูลชนะ', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10640', 'พันธุ์เจริญ บิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10720', 'โอ.จี.บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10660', 'ศรีรังสิต', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10666', 'สะพานแดงบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10604', 'แซนดี้ บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10615', 'นานาบิวตี้ช็อป', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10595', 'คุณแม่', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10616', 'นานาบิวตี้เจริญ', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10792', 'บิวตี้ ฮีล ช็อป จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เซลล์กนก'),
('10638', 'พระประแดงบิวตี้', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เซลล์กนก'),
('10598', 'เจ แอนด์ เอ็น อุปกรณ์เสริมสวย', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เซลล์กนก'),
('10777', 'บิวติฟิเดนซ์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เซลล์กนก'),
('10683', 'ห่านพงกี่สำโรง', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เซลล์กนก'),
('10655', 'ลูกปัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เซลล์กนก'),
('10136', 'วีแอนด์พี บิวตี้ลิสซ์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', 'เซลล์กนก'),
('10602', 'คุณชนินทร์ คงไทย', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', 'เซลล์กนก'),
('40035', 'คุณสมประสงค์  สุทธางกูร', 'ภาคกลาง/ตะวันออก', 'สมุทรสาคร', 'ลูกค้าบริษัท'),
('10685', 'เอพี บิวตี้ สาย 4', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', 'เซลล์กนก'),
('10592', 'ก้าวจำเริญ', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', 'เซลล์กนก'),
('10686', 'หจก.เอ็ม ที บิวตี้ไลน์', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', 'เซลล์กนก'),
('10754', 'คุณปวริศา อุดมศรี', 'เขตกรุงเทพและปริมณฑล', 'คลองสาน', 'เซลล์กนก'),
('10830', 'แชมป์บิวตี้ สาธุประดิษฐ์', 'เขตกรุงเทพและปริมณฑล', 'ยานนาวา', 'เซลล์กนก'),
('10677', 'สาวิตรีแฟมมิลี่บิวตี้ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ราษฎบูรณะ', 'เซลล์กนก'),
('10593', 'คุณกนกวรรณ วงษ์น้อมไทย', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'เซลล์กนก'),
('10603', 'คุณชนันดา มิลินทสูต', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'เซลล์กนก'),
('10654', 'ร่ำรวยบิวตี้ (บีแอนด์วาย บิวตี้)', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'เซลล์กนก'),
('10667', 'สิริญ บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'เซลล์กนก'),
('10694', 'หจก.แฮร์คอสเม่', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'เซลล์กนก'),
('10283', 'พิศมัย บิวตี้ ซาลอน จำกัด', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'เซลล์กนก'),
('10712', 'คุณกอบเกียรติ สุทธิสรสัมพันธ์', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'ลูกค้าบริษัท'),
('10736', 'คุณกนก เรืองลั่น', 'เขตกรุงเทพและปริมณฑล', 'คลองสาน', 'ลูกค้าบริษัท'),
('10017', 'แวรีส บาร์เบอร์คลับ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'ลูกค้าบริษัท'),
('10051', 'เดอะ แร็บบิท โฮ ครีเอทีฟ ซาลอน', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'ลูกค้าบริษัท'),
('10096', 'คุณประเสริฐ ยศมา', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'ลูกค้าบริษัท'),
('10820', 'คุณพัทธนันท์ วรรณวรอนันทร์', 'เขตกรุงเทพและปริมณฑล', 'สาทร', 'ลูกค้าบริษัท'),
('10168', 'คุณสุรชาติ ภาพฉิมพลี', 'เขตกรุงเทพและปริมณฑล', 'หนองแขม', 'ลูกค้าบริษัท'),
('10085', 'บิวเทรี่ยม จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ปทุมวัน', 'ลูกค้าบริษัท'),
('70002', 'ฮักแฮร์4289 จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สายไหม', 'ลูกค้าบริษัท'),
('10186', 'คุณธีระ สุปินตา', 'เขตกรุงเทพและปริมณฑล', 'ดอนเมือง', 'ลูกค้าบริษัท'),
('10674', 'เสรีเจริญการค้า จำกัด', 'เขตกรุงเทพและปริมณฑล', 'พญาไท', 'ลูกค้าบริษัท'),
('10767', 'คุณดลพร มีธรรมสวนะ', 'เขตกรุงเทพและปริมณฑล', 'จัตุจักร', 'ลูกค้าบริษัท'),
('40033', 'คุณวรรณพัทธ์  ปนัสยาธนากุญช์', 'เขตกรุงเทพและปริมณฑล', 'ทวีวัฒนา', 'ลูกค้าบริษัท'),
('10642', 'พระราม 2 คอสเมติกส์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'บางขุนเทียน', 'เซลล์กนก'),
('10013', 'คุณเกตุแก้ว ตุ่มงาม', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'ลูกค้าบริษัท'),
('10147', 'คุณวิรุฬห์ บุญเกิดลาภ', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'ลูกค้าบริษัท'),
('10836', 'คุณชวฤทธิ์ เรืองลั่น', 'เขตกรุงเทพและปริมณฑล', 'คลองสาน', 'เซลล์กนก'),
('10726', 'คุณอาทิตย์ แสงประเสริฐ', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'ลูกค้าบริษัท'),
('10780', 'เดอะกาแรม จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'ลูกค้าบริษัท'),
('40006', 'คุณเจตนา  พลาวงศ์', 'เขตกรุงเทพและปริมณฑล', 'สาทร', 'ลูกค้าบริษัท'),
('70011', 'ลิทเทิ้ล เรดฟ็อกซ์ คิดส์ซาลอน จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เซลล์กนก'),
('10789', 'แสงจันทร์บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'บางพลัด', 'เซลล์กนก'),
('50029', 'คุณเฉลิมชนม์ ชูเพชร', 'เขตกรุงเทพและปริมณฑล', 'คลองสามวา', 'ลูกค้าบริษัท'),
('10006', 'คุณกฤษณี ท้ายวัด', 'เขตกรุงเทพและปริมณฑล', 'หนองแขม', 'ลูกค้าบริษัท'),
('10793', 'จีซีเอ็มจี จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ราชเทวี', 'เซลล์กนก'),
('40005', 'คุณจีรัฐติ  สงวนไทย', 'เขตกรุงเทพและปริมณฑล', 'จตุจักร', 'ลูกค้าบริษัท'),
('70004', 'เอ็น พี เอ็กซ์ กรุ๊ป จำกัด', 'เขตกรุงเทพและปริมณฑล', 'บึงกุ่ม', 'ลูกค้าบริษัท'),
('10154', 'คุณศิรินภา สว่างล้ำวิทยฐานกรณ์', 'เขตกรุงเทพและปริมณฑล', 'บางคอแหลม', 'ลูกค้าบริษัท'),
('10023', 'KAI CHUEH LIN (X2797)', 'เขตกรุงเทพและปริมณฑล', 'จตุจักร', 'ลูกค้าบริษัท'),
('10838', 'ณัชรินทร์ อินเตอร์เนชั่นแนล จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ดอนเมือง', 'ลูกค้าบริษัท'),
('10188', 'ฮอพบอน จำกัด', 'เขตกรุงเทพและปริมณฑล', 'หนองแขม', 'ลูกค้าบริษัท'),
('40074', 'คุณศรัณย์ ทองถมยา', 'เขตกรุงเทพและปริมณฑล', 'บางกอกน้อย', 'ลูกค้าบริษัท'),
('10298', 'คุณมาริสา อำนาจสุขสุวรรณ', 'เขตกรุงเทพและปริมณฑล', 'บางพลัด', 'ลูกค้าบริษัท'),
('40063', 'คุณปฐมพร เกษรคำ', 'เขตกรุงเทพและปริมณฑล', 'บึงกุ่ม', 'เซลล์กนก'),
('40009', 'คุณจักรพงษ์  งามพงศ์พรรณ', 'เขตกรุงเทพและปริมณฑล', 'ดุสิต', 'เซลล์กนก'),
('40003', 'คุณกิตติพงค์  วัฒนะพยุงกุล', 'เขตกรุงเทพและปริมณฑล', 'ยานนาวา', 'เซลล์กนก'),
('40022', 'คุณประชากร  เพ็งจันทร์ดี', 'เขตกรุงเทพและปริมณฑล', 'บางจาก', 'เซลล์กนก'),
('40060', 'คุณภูรินทร์ หมัดป้องกัน', 'เขตกรุงเทพและปริมณฑล', 'บางคอแหลม', 'เซลล์กนก'),
('40048', 'คุณณัฐสิทธิ์ วรรณะพาหุณ', 'เขตกรุงเทพและปริมณฑล', 'หลักสี่', 'เซลล์กนก'),
('40043', 'คุณอุษณีษ์  อำนวยวิเศษโชค', 'เขตกรุงเทพและปริมณฑล', 'วังทองหลาง', 'เซลล์กนก'),
('40032', 'คุณวิโรจน์  เพ็งแจ่ม', 'เขตกรุงเทพและปริมณฑล', 'บางแค', 'เซลล์กนก'),
('40014', 'คุณเทพฤทธิ์  พรสุวรรณ', 'เขตกรุงเทพและปริมณฑล', 'บางเขน', 'เซลล์กนก'),
('40012', 'คุณณัฐิกา  พงษ์เผือก', 'เขตกรุงเทพและปริมณฑล', 'คลองสาน', 'เซลล์กนก'),
('40010', 'คุณชฎาณัฏฐ์  ปัญญา', 'เขตกรุงเทพและปริมณฑล', 'สายไหม', 'เซลล์กนก'),
('40077', 'คุณศิริชัย มาละมิ่ง', 'เขตกรุงเทพและปริมณฑล', 'ดอนเมือง', 'เซลล์กนก'),
('10081', 'นิวยอร์คคัท 641 จำกัด', 'เขตกรุงเทพและปริมณฑล', 'พญาไท', 'ลูกค้าบริษัท'),
('10787', 'MBAS', 'พม่า', 'ต่างประเทศ', 'ลูกค้าบริษัท'),
('10425', 'ประเสริฐบาร์เบอร์', 'ภาคกลาง/ตะวันออก', 'ลพบุรี', 'เซลล์ภัทร'),
('10444', 'วิมล บิวตี้ จำกัด', 'ภาคกลาง/ตะวันออก', 'สุพรรณบุรี', 'เซลล์ภัทร'),
('10407', 'คุณกำพล ล้อเลิศสกุล', 'ภาคกลาง/ตะวันออก', 'พระนครศรีอยุธยา', 'เซลล์ภัทร'),
('10403', 'หจก.กิ๊ฟท์บิวตี้ระยอง', 'ภาคกลาง/ตะวันออก', 'ระยอง', 'เซลล์ภัทร'),
('10414', 'ตราดบิวตี้', 'ภาคกลาง/ตะวันออก', 'ตราด', 'เซลล์ภัทร'),
('10833', 'ตาลบิวตี้เซ็นเตอร์', 'ภาคอีสาน', 'สระบุรี', 'เซลล์หนิง'),
('10412', 'หจก.เดโกะ บิวตี้ มาร์ท', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'เซลล์ภัทร'),
('10423', 'บูม บูม บิวตี้', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'เซลล์ภัทร'),
('10432', 'ไพทูล (ลับคม)', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'เซลล์ภัทร'),
('10443', 'เลดี้อัพเดท', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'เซลล์ภัทร'),
('10126', 'ศิริอาภรณ์', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เซลล์ภัทร'),
('10251', 'อูอา จำกัด', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เซลล์ภัทร'),
('10455', 'คุณสุนิษา แก้วกันดา', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เซลล์ภัทร'),
('10446', 'ศิริอาภรณ์ (หน้าโรงแรมนำสิน)', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เซลล์ภัทร'),
('10451', 'สิริภัณฑ์บิวตี้ จำกัด', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เซลล์ภัทร'),
('10462', 'แฮร์บิวตี้', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เซลล์ภัทร'),
('10402', 'กิจเสรีเทรดดิ้ง', 'ภาคกลาง/ตะวันออก', 'พระนครศรีอยุธยา', 'เซลล์ภัทร'),
('10669', 'แสงจันทร์ อินเตอร์ พลัส จำกัด', 'ภาคกลาง/ตะวันออก', 'พระนครศรีอยุธยา', 'เซลล์ภัทร'),
('10457', 'เอส.ที.เอ คอสเมติกส์ แอนด์ บิวตี้ จำกัด', 'ภาคกลาง/ตะวันออก', 'พระนครศรีอยุธยา', 'เซลล์ภัทร'),
('10422', 'หจก.บิวตี้มาร์ท อุทัยธานี', 'ภาคกลาง/ตะวันออก', 'อุทัยธานี', 'เซลล์ภัทร'),
('10826', 'เวิลด์ บิวตี้', 'ภาคกลาง/ตะวันออก', 'ลพบุรี', 'เซลล์ภัทร'),
('10449', 'สวยงาม 3', 'ภาคกลาง/ตะวันออก', 'สิงห์บุรี', 'เซลล์ภัทร'),
('10829', 'คุณวาสนา เลิศเจริญทรัพย์', 'ภาคกลาง/ตะวันออก', 'อ่างทอง', 'เซลล์ภัทร'),
('10419', 'บางแสนบิวตี้มาร์ท', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('40070', 'คุณนันท์นภัส เพชรเยียน', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'ลูกค้าบริษัท'),
('10835', 'คุณวีรภัทร์ ก้อนคำ', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10676', 'คุณสวรรยา สินสมบูรณ์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('40017', 'คุณธัญชนก  รัตนเจริญทรัพย์', 'ภาคกลาง/ตะวันออก', 'ลพบุรี', 'ลูกค้าบริษัท'),
('10834', 'สระบุรี บิวตี้', 'ภาคอีสาน', 'สระบุรี', 'เซลล์หนิง'),
('10755', 'คุณวรเชษฐ์ มะกรูดทอง', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'ลูกค้าบริษัท'),
('40052', 'หัวกรวย สตูดิโอ จำกัด', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เซลล์ภัทร'),
('10018', 'คุณกรกนก ยืนยง', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'ลูกค้าบริษัท'),
('10840', 'คุณพีรพร เรียนงาม', 'ภาคกลาง/ตะวันออก', 'พระนครศรีอยุธยา', 'ลูกค้าบริษัท'),
('10762', 'เรือนจำกลางนครปฐม', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'ลูกค้าบริษัท'),
('40051', 'คุณณุภัทรณีย์ ถิรทวีรุ่งโรจน์', 'ภาคกลาง/ตะวันออก', 'สมุทรสาคร', 'ลูกค้าบริษัท'),
('40049', 'คุณสุชิน สุขเจริญ', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'ลูกค้าบริษัท'),
('40046', 'คุณรมย์ธีรา เปี่ยมสุวรรณ', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'ลูกค้าบริษัท'),
('40029', 'คุณมานิตย์  เพ็ชรไทย', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'ลูกค้าบริษัท'),
('40026', 'คุณพรพิมพ์  พงษ์หาญพจน์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'ลูกค้าบริษัท'),
('40007', 'คุณจุฑารัตน์  รักเรียน', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'ลูกค้าบริษัท'),
('40059', 'คุณอภิวัฒน์ บุญสว่าง', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'ลูกค้าบริษัท'),
('40058', 'คุณกฤษณะ รัตนพันธ์', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'ลูกค้าบริษัท'),
('40053', 'บีทรู แฮร์คัท', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'ลูกค้าบริษัท'),
('40030', 'คุณรุ่งโรจน์  คงสิทธิ์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'ลูกค้าบริษัท'),
('40023', 'คุณพัฒน์จักร  เหมะภูษิต', 'ภาคกลาง/ตะวันออก', 'ชัยนาท', 'ลูกค้าบริษัท'),
('10448', 'สมาร์ทบิวตี้', 'ภาคกลาง/ตะวันออก', 'กาญจนบุรี', 'เซลล์ภัทร'),
('10409', 'ชลบุรี บิวตี้ จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10459', 'อรัญลับคม', 'ภาคกลาง/ตะวันออก', 'สระแก้ว', 'เซลล์ภัทร'),
('10424', 'บิวตี้สโตร์', 'ภาคกลาง/ตะวันออก', 'กาญจนบุรี', 'เซลล์ภัทร'),
('10442', 'รุ่งเสริมทรัพย์', 'ภาคกลาง/ตะวันออก', 'กาญจนบุรี', 'เซลล์ภัทร'),
('10837', 'คุณฐิติพร สมสกุล', 'ภาคกลาง/ตะวันออก', 'ฉะเชิงเทรา', 'เซลล์ภัทร'),
('10832', 'คุณภัครินทร์ สีใส', 'ภาคกลาง/ตะวันออก', 'ปราจีนบุรี', 'เซลล์ภัทร'),
('10418', 'บางกอก แฮร์ บิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10436', 'พัทยา บิวตี้ (ประเทศไทย) จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10438', 'พัทยา บิวตี้ (ประเทศไทย) จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10439', 'พัทยา บิวตี้ (ประเทศไทย) จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10430', 'พัทยา บิวตี้ (ประเทศไทย) จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10445', 'ศรีราชา บิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10092', 'บิวตี้มอล สาขาชลบุรี', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10450', 'สหพัฒน์บิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10127', 'ลูกหยี', 'ภาคกลาง/ตะวันออก', 'ระยอง', 'เซลล์ภัทร'),
('10454', 'สวยมีดี จำกัด', 'ภาคกลาง/ตะวันออก', 'ระยอง', 'เซลล์ภัทร'),
('10811', 'บี อัลติเมท จำกัด', 'ภาคกลาง/ตะวันออก', 'ระยอง', 'เซลล์ภัทร'),
('10441', 'รุ่งสโตร์บิวตี้เซ็นเตอร์', 'ภาคกลาง/ตะวันออก', 'ตราด', 'เซลล์ภัทร'),
('10401', 'กาญจนา', 'ภาคกลาง/ตะวันออก', 'จันทบุรี', 'เซลล์ภัทร'),
('10845', 'ทิพย์บิวตี้', 'ภาคกลาง/ตะวันออก', 'จันทบุรี', 'เซลล์ภัทร'),
('10416', 'แสงชัย', 'ภาคกลาง/ตะวันออก', 'จันทบุรี', 'เซลล์ภัทร'),
('10420', 'หจก.บิวตี้แคร์ จันทบุรี', 'ภาคกลาง/ตะวันออก', 'จันทบุรี', 'เซลล์ภัทร'),
('10815', 'เมย์ บิวตี๊ช็อป', 'ภาคอีสาน', 'นครราชสีมา', 'เซลล์หนิง'),
('10101', 'คุณพงษ์พันธ์ พรมสอน', 'ภาคกลาง/ตะวันออก', 'ชัยภูมิ', 'ลูกค้าบริษัท'),
('40057', 'คุณราชาวดี เล้าอรุณ', 'ภาคกลาง/ตะวันออก', 'กาญจนบุรี', 'ลูกค้าบริษัท'),
('10464', 'กรุงเทพการช่าง', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10543', 'มโนราห์บิวตี้', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10552', 'ริชชี่บิวตี้ จำกัด', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10753', 'กระบี่ คอสเมติก', 'ภาคใต้', 'กระบี่', 'เซลล์ตา'),
('10550', 'ยูนิคอส บิวตี้ (UNICOS BEAUTY)', 'ภาคใต้', 'ภูเก็ต', 'เซลล์ตา'),
('10536', 'เพชรบุรี บิวตี้', 'ภาคใต้', 'เพชรบุรี', 'เซลล์ตา'),
('10558', 'สยามเวชภัณฑ์', 'ภาคใต้', 'เพชรบุรี', 'เซลล์ตา'),
('10570', 'สวัสดีไดเร็คท์', 'ภาคใต้', 'เพชรบุรี', 'เซลล์ตา'),
('10542', 'เจ๊เช็ง', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เซลล์ตา'),
('10584', 'อารีย์บิวตี้ช้อฟ', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เซลล์ตา'),
('10486', 'จันทร์เพ็ญ', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เซลล์ตา'),
('10492', 'ซี เอ กรุ๊ป วีดีโอ', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เซลล์ตา'),
('10493', 'ดารา บิวตี้', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เซลล์ตา'),
('10511', 'บางสะพานบิวตี้', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เซลล์ตา'),
('10488', 'ไชยชนะบิวตี้ช้อป', 'ภาคใต้', 'ชุมพร', 'เซลล์ตา'),
('10503', 'ประกายผม', 'ภาคใต้', 'ชุมพร', 'เซลล์ตา'),
('10517', 'เบญจวรรณ', 'ภาคใต้', 'ชุมพร', 'เซลล์ตา'),
('10526', 'บิวตี้ ฟลาย', 'ภาคใต้', 'ชุมพร', 'เซลล์ตา'),
('10579', 'หนึ่งบิวตี้ สาขา 1', 'ภาคใต้', 'ชุมพร', 'เซลล์ตา'),
('10522', 'ใบเตยบิวตี้', 'ภาคใต้', 'ชุมพร', 'เซลล์ตา'),
('10495', 'ดีแลนด์', 'ภาคใต้', 'พัทลุง', 'เซลล์ตา'),
('10497', 'ดี แสนดี', 'ภาคใต้', 'พัทลุง', 'เซลล์ตา'),
('10531', 'เปเล่ บิวตี้', 'ภาคใต้', 'พัทลุง', 'เซลล์ตา'),
('10539', 'เพ็ญศิริ', 'ภาคใต้', 'พัทลุง', 'เซลล์ตา'),
('10842', 'หจก.รักไทยซุปเปอร์มาร์เก็ต', 'ภาคใต้', 'พัทลุง', 'เซลล์ตา'),
('10581', 'อ.สมพร บิวตี้ช็อป', 'ภาคใต้', 'พัทลุง', 'เซลล์ตา'),
('10761', 'พราว คอสเมติกส์', 'ภาคใต้', 'พัทลุง', 'เซลล์ตา'),
('10467', 'กันเอง (มะขามเตี้ย)', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10466', 'กันเอง(เกาะสมุย)', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10468', 'กุลณาบิวตี้ช้อป', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10499', 'เติมสวยไชยา', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10509', 'นาคา ทรัพย์ประสิทธิ์ จำกัด', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10546', 'เมย์บิวตี้', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10559', 'สาลิกาบิวตี้', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10577', 'สาลิกาบิวตี้', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10574', 'คุณสุภิญญา พิริยะ', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10583', 'เอเชียช็อพ', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10535', 'พรเพ็ญพาณิชย์', 'ภาคใต้', 'ระนอง', 'เซลล์ตา'),
('10472', 'แกรนด์ โซล บิวตี้', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10507', 'นาเหนือปัตเลี่ยน', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10541', 'พรภัณฑ์บิวตี้ จำกัด', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10555', 'ลี่ยิ่วกี่', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10586', 'ฮอลลีวู๊ด', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10714', 'เจ-จันทร์', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10482', 'เจ-จันทร์ จำกัด', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10827', 'บ้านครีมนครศรี จำกัด', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10473', 'แกนบิวตี้', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10475', 'ควีนแลนด์ บิวตี้ จำกัด', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10512', 'บิวตี้ ซาลอน', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10521', 'ไบ ดา ช้อป', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10566', 'แสงอรุณบิวตี้', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10568', 'สยามบิวตี้ ช็อป', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10572', 'สันติลับคม', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10778', 'หาดใหญ่บิวตี้', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10779', 'บิวตี้ ฟาร์ม่า', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10527', 'บิวตี้ เฟอร์แฟค', 'ภาคใต้', 'ยะลา', 'เซลล์ตา'),
('10548', 'แม็คควีนส์', 'ภาคใต้', 'ยะลา', 'เซลล์ตา'),
('10571', 'ธีดาบิวตี้ช็อป', 'ภาคใต้', 'ยะลา', 'เซลล์ตา'),
('10544', 'มาสบิวตี้ช็อป', 'ภาคใต้', 'ปัตตานี', 'เซลล์ตา'),
('10587', 'ฮาวายสโตร์', 'ภาคใต้', 'ปัตตานี', 'เซลล์ตา'),
('10561', 'สุขสวยคอสเมติก (ตะกั่วทุ่ง)', 'ภาคใต้', 'พังงา', 'เซลล์ตา'),
('10573', 'สุขสวยคอสเมติก (ท้ายเหมือง)', 'ภาคใต้', 'พังงา', 'เซลล์ตา'),
('10569', 'เสรีเภสัช', 'ภาคใต้', 'พังงา', 'เซลล์ตา'),
('10560', 'สุขสวยคอสเมติก (เมืองพังงา)', 'ภาคใต้', 'พังงา', 'เซลล์ตา'),
('10533', 'ปฐมพร', 'ภาคใต้', 'สตูล', 'เซลล์ตา'),
('10485', 'คุณจารุวรรณ อภิญญาภรณ์', 'ภาคใต้', 'ตรัง', 'เซลล์ตา'),
('10520', 'ใบเฟิร์น เฟช แคร์', 'ภาคใต้', 'ตรัง', 'เซลล์ตา'),
('10540', 'พรพัน', 'ภาคใต้', 'ตรัง', 'เซลล์ตา'),
('10565', 'แสงศรีพานิช', 'ภาคใต้', 'ตรัง', 'เซลล์ตา'),
('10478', 'คลองท่อม บิวตี้ ช๊อป', 'ภาคใต้', 'กระบี่', 'เซลล์ตา'),
('10498', 'ดีว่า บิวตี้ กระบี่', 'ภาคใต้', 'กระบี่', 'เซลล์ตา'),
('10752', 'บิวตี้ควีน', 'ภาคใต้', 'กระบี่', 'เซลล์ตา'),
('10491', 'ซ 8 บิวตี้', 'ภาคใต้', 'ภูเก็ต', 'เซลล์ตา'),
('10506', 'นานาภัณฑ์', 'ภาคใต้', 'ภูเก็ต', 'เซลล์ตา'),
('10513', 'บิวตี้ ทัช', 'ภาคใต้', 'ภูเก็ต', 'เซลล์ตา'),
('10514', 'บิวตี้แลนด์ ภูเก็ต จำกัด', 'ภาคใต้', 'ภูเก็ต', 'เซลล์ตา'),
('10524', 'บิวตี้แลนด์ แฮร์ แอนด์ บิวตี้ จำกัด', 'ภาคใต้', 'ภูเก็ต', 'เซลล์ตา'),
('10525', 'บิวตี้แลนด์ ภูเก็ต จำกัด', 'ภาคใต้', 'ภูเก็ต', 'เซลล์ตา'),
('10575', 'หจก.สามกอง คอสเมติคส์', 'ภาคใต้', 'ภูเก็ต', 'เซลล์ตา'),
('10534', 'แป้งหอม 9001 จำกัด', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'เซลล์ตา'),
('10706', 'อาจารย์สมพร บิวตี้ช็อป', 'ภาคใต้', 'พัทลุง', 'เซลล์ตา'),
('10529', 'คุณปุณยนุช อ่อนมุกข์', 'ภาคใต้', 'ชุมพร', 'ลูกค้าบริษัท'),
('10770', 'เอชอาร์บีบี กรุ๊ป จำกัด', 'ภาคใต้', 'สงขลา', 'ลูกค้าบริษัท'),
('10189', 'Harisbarbershop', 'ภาคใต้', 'สงขลา', 'ลูกค้าบริษัท'),
('10045', 'คุณฐิติกุล แวงสุข', 'ภาคใต้', 'สตูล', 'ลูกค้าบริษัท'),
('40016', 'คุณธนันณัชญ์  กำเนิดว้ำ', 'ภาคใต้', 'นครศรีธรรมราช', 'ลูกค้าบริษัท'),
('10470', 'คุณกนกวรรณ ยั่งยืน', 'ภาคใต้', 'พังงา', 'ลูกค้าบริษัท'),
('40071', 'คุณซูไฮมี เด็นอาสัน', 'ภาคใต้', 'สงขลา', 'ลูกค้าบริษัท'),
('70012', 'มันตา ฟาร์มาซี จำกัด', 'ภาคใต้', 'นครศรีธรรมราช', 'ลูกค้าบริษัท'),
('10658', 'คุณตัสนีมซ์ ศรีรัตน์', 'ภาคใต้', 'สงขลา', 'ลูกค้าบริษัท'),
('10786', 'คุณกวีวัธน์ สุวรรณพันธ์', 'ภาคใต้', 'สงขลา', 'ลูกค้าบริษัท'),
('10807', 'คุณแวมะ เจ๊ะแม', 'ภาคใต้', 'ยะลา', 'ลูกค้าบริษัท'),
('10722', 'คุณยุทธภูมิ เอี่ยมสุวัฒน์', 'ภาคใต้', 'สุราษฎร์ธานี', 'ลูกค้าบริษัท'),
('40034', 'คุณวีรยุทธ  สายสวาท', 'ภาคใต้', 'ประจวบคีรีขันธ์', 'ลูกค้าบริษัท'),
('10841', 'หจก.เมียงดงบิวตี้ท่าศาลา', 'ภาคใต้', 'นครศรีธรรมราช', 'เซลล์ตา'),
('10094', 'BARBERTIS', 'ภาคใต้', 'สงขลา', 'ลูกค้าบริษัท'),
('10723', 'คุณไกรสีห์ ชูช่วย', 'ภาคใต้', 'สุราษฎร์ธานี', 'ลูกค้าบริษัท'),
('10843', 'คุณสุทธิศักดิ์ ยอดรัก', 'ภาคใต้', 'ภูเก็ต', 'ลูกค้าบริษัท'),
('10415', 'นาบิวตี้', 'ภาคเหนือ', 'นครสวรรค์', 'เซลล์ต๋อง'),
('10352', 'แคชบิวตี้ จำกัด', 'ภาคเหนือ', 'แพร่', 'เซลล์ต๋อง'),
('10375', 'ประดิษฐ์ (เชียงใหม่)', 'ภาคเหนือ', 'เชียงใหม่', 'เซลล์ต๋อง'),
('10355', 'แจนบิวตี้', 'ภาคเหนือ', 'ลำปาง', 'เซลล์ต๋อง'),
('10380', 'หจก.มดบิวตี้ แอนด์ คอสเมติกส์', 'ภาคเหนือ', 'เชียงราย', 'เซลล์ต๋อง'),
('10437', 'แพทองกุล จำกัด', 'ภาคเหนือ', 'นครสวรรค์', 'เซลล์ต๋อง'),
('10379', 'ฟ้าเจริญกิจ จำกัด', 'ภาคเหนือ', 'กำแพงเพชร', 'เซลล์ต๋อง'),
('10370', 'นานาบิวตี้', 'ภาคเหนือ', 'กำแพงเพชร', 'เซลล์ต๋อง'),
('10408', 'แจ๋นบิวตี้', 'ภาคเหนือ', 'พิจิตร', 'เซลล์ต๋อง'),
('10435', 'เพชรินทร์', 'ภาคเหนือ', 'เพชรบูรณ์', 'เซลล์ต๋อง'),
('10410', 'ชมพู่คอสเมติกส์ (เพชรบูรณ์)', 'ภาคเหนือ', 'เพชรบูรณ์', 'เซลล์ต๋อง'),
('10428', 'คุณปิยะพร พยัพเมฆ', 'ภาคเหนือ', 'พิษณุโลก', 'เซลล์ต๋อง'),
('10433', 'เพียว คอสเมติก แอนด์ บิวตี้ จำกัด', 'ภาคเหนือ', 'พิษณุโลก', 'เซลล์ต๋อง'),
('10427', 'เปรียว คอสเมติกส์ จำกัด', 'ภาคเหนือ', 'พิษณุโลก', 'เซลล์ต๋อง'),
('10461', 'แฮร์คิงส์', 'ภาคเหนือ', 'พิษณุโลก', 'เซลล์ต๋อง'),
('10421', 'บิวตี้เซ็นเตอร์', 'ภาคเหนือ', 'พิษณุโลก', 'เซลล์ต๋อง'),
('10452', 'หจก.สุวิมลบิวตี้', 'ภาคเหนือ', 'พิษณุโลก', 'เซลล์ต๋อง'),
('10365', 'ทวีทรัพย์ 6', 'ภาคเหนือ', 'สุโขทัย', 'เซลล์ต๋อง'),
('10376', 'ปั้นเกษา', 'ภาคเหนือ', 'สุโขทัย', 'เซลล์ต๋อง'),
('10360', 'ซ่องฮวดพานิช', 'ภาคเหนือ', 'ลำปาง', 'เซลล์ต๋อง'),
('10371', 'บิวตี้ ช็อป', 'ภาคเหนือ', 'ลำปาง', 'เซลล์ต๋อง'),
('10363', 'เตือนใจ', 'ภาคเหนือ', 'อุตรดิตถ์', 'เซลล์ต๋อง'),
('10374', 'บู๊', 'ภาคเหนือ', 'อุตรดิตถ์', 'เซลล์ต๋อง'),
('10367', 'หจก.ทิพรัตน์บิวตี้', 'ภาคเหนือ', 'อุตรดิตถ์', 'เซลล์ต๋อง'),
('10148', 'หวังดี', 'ภาคเหนือ', 'อุตรดิตถ์', 'เซลล์ต๋อง'),
('10814', 'ร้านโมเดิร์นแฮร์', 'ภาคเหนือ', 'อุตรดิตถ์', 'เซลล์ต๋อง'),
('10351', 'แคชบิวตี้แอนด์คอสเมติกส์ จำกัด', 'ภาคเหนือ', 'น่าน', 'เซลล์ต๋อง'),
('10389', 'สาบิวตี้', 'ภาคเหนือ', 'น่าน', 'เซลล์ต๋อง'),
('10358', 'โชคประสิทธิ', 'ภาคเหนือ', 'แพร่', 'เซลล์ต๋อง'),
('10394', 'คุณสุดใจ พุทธิกานนท์', 'ภาคเหนือ', 'ตาก', 'เซลล์ต๋อง'),
('10357', 'ชุติมา คอนเนค จำกัด', 'ภาคเหนือ', 'ตาก', 'เซลล์ต๋อง'),
('10388', 'เศกอุปกรณ์เสริมสวย', 'ภาคเหนือ', 'ตาก', 'เซลล์ต๋อง'),
('10381', 'มด บิวตี้ ตาก', 'ภาคเหนือ', 'ตาก', 'เซลล์ต๋อง'),
('10382', 'มีดีศูนย์รวมสุขภาพและความงาม', 'ภาคเหนือ', 'เชียงราย', 'เซลล์ต๋อง'),
('10397', 'อินเทรนบิวตี้เซ็นเตอร์', 'ภาคเหนือ', 'เชียงราย', 'เซลล์ต๋อง'),
('10076', 'น้ำหวานบิวตี้', 'ภาคเหนือ', 'เชียงราย', 'เซลล์ต๋อง'),
('10822', 'เบญจภาคี ช็อป', 'ภาคเหนือ', 'เชียงราย', 'เซลล์ต๋อง'),
('10391', 'คุณสมทรง บาลสันเทียะ', 'ภาคเหนือ', 'เชียงใหม่', 'เซลล์ต๋อง'),
('10366', 'ทองบิวตี้', 'ภาคเหนือ', 'เชียงใหม่', 'เซลล์ต๋อง'),
('10801', 'มาตาบิ้วตี้', 'ภาคเหนือ', 'เชียงใหม่', 'เซลล์ต๋อง'),
('10369', 'ร้านนันท์บิวตี้', 'ภาคเหนือ', 'เชียงใหม่', 'เซลล์ต๋อง'),
('10373', 'บิวตี้ฟูล', 'ภาคเหนือ', 'เชียงใหม่', 'เซลล์ต๋อง'),
('10395', 'อรัญญาบิวตี้', 'ภาคเหนือ', 'เชียงใหม่', 'เซลล์ต๋อง'),
('10362', 'ดาวบิวตี้', 'ภาคเหนือ', 'ลำพูน', 'เซลล์ต๋อง'),
('10784', 'อิมซัง (ลำพูน)', 'ภาคเหนือ', 'ลำพูน', 'เซลล์ต๋อง'),
('10354', 'จ.เจริญ', 'ภาคเหนือ', 'พะเยา', 'เซลล์ต๋อง'),
('10350', 'กลางเวียง บิวตี้มาร์ท จำกัด', 'ภาคเหนือ', 'พะเยา', 'เซลล์ต๋อง'),
('10386', 'รินบิวตี้', 'ภาคเหนือ', 'พะเยา', 'เซลล์ต๋อง'),
('10831', 'วริณธร บัวจูม', 'ภาคเหนือ', 'ศรีษะเกษ', 'ลูกค้าบริษัท'),
('10484', 'รักสวยรักงาม', 'ภาคอีสาน', 'อุดรธานี', 'เซลล์หนิง'),
('10123', 'คุณรังสินี เนียมจันทร์', 'ภาคเหนือ', 'ศรีษะเกษ', 'ลูกค้าบริษัท'),
('10161', 'คุณส้มโอ ยศมา', 'ภาคเหนือ', 'เพชรบูรณ์', 'ลูกค้าบริษัท'),
('10067', 'คุณเธียมเวศย์ งานดี', 'ภาคเหนือ', 'พะเยา', 'ลูกค้าบริษัท'),
('40073', 'คุณมนัสชนก ราชพันธ์', 'ภาคเหนือ', 'สุโขทัย', 'ลูกค้าบริษัท'),
('10727', 'คุณอาหลี เม่งจิ', 'ภาคเหนือ', 'ตรัง', 'ลูกค้าบริษัท'),
('10012', 'คุณไกรวิทย์ พรหมวงษ์', 'ภาคเหนือ', 'กำแพงเพชร', 'ลูกค้าบริษัท'),
('10585', 'อ่อนศรี  วีระโงน', 'ภาคเหนือ', 'สกลนคร', 'ลูกค้าบริษัท'),
('40075', 'คุณอนุพงษ์ เงินบำรุง', 'ภาคเหนือ', 'ขอนแก่น', 'ลูกค้าบริษัท'),
('10742', 'คุณรุ่งโรจน์ ค้อชากุล', 'ภาคเหนือ', 'ร้อยเอ็ด', 'ลูกค้าบริษัท'),
('10747', 'คุณวรพล เขียวจันทร์', 'ภาคเหนือ', 'แพร่', 'ลูกค้าบริษัท'),
('10368', 'ทรงศิลป์', 'ภาคเหนือ', 'ร้อยเอ็ด', 'ลูกค้าบริษัท'),
('10481', 'เจ้ ยอดบิวตี้', 'ภาคอีสาน', 'อุดรธานี', 'เซลล์หนิง'),
('40015', 'คุณธวัชชัย  ชิตวรกุล', 'ภาคเหนือ', 'เชียงใหม่', 'ลูกค้าบริษัท'),
('70003', 'เอสที แฮร์คลิปเปอร์ จำกัด', 'ภาคเหนือ', 'อุดรธานี', 'ลูกค้าบริษัท'),
('10044', 'คุณวรพงษ์ สายคำ', 'ภาคเหนือ', 'พิษณุโลก', 'ลูกค้าบริษัท'),
('40065', 'คุณไกรสร ปราบวิลัย', 'ภาคเหนือ', 'กำแพงเพชร', 'ลูกค้าบริษัท'),
('40054', 'คุณอัมรินทร์ วงค์คำ', 'ภาคเหนือ', 'สกลนคร', 'ลูกค้าบริษัท'),
('40050', 'คุณวาสนา ไชยลังกา', 'ภาคเหนือ', 'พะเยา', 'ลูกค้าบริษัท'),
('40047', 'คุณเหมรัตน์ เหมะชัย', 'ภาคเหนือ', 'อุดรธานี', 'ลูกค้าบริษัท'),
('40062', 'คุณจักรพรรดิ ฦาชาฤทธิ์', 'ภาคเหนือ', 'เชียงใหม่', 'ลูกค้าบริษัท'),
('40056', 'คุณคมกริช เสนา', 'ภาคเหนือ', 'ตาก', 'ลูกค้าบริษัท'),
('40055', 'คุณสาทินี เมฆหมอก', 'ภาคเหนือ', 'ตาก', 'ลูกค้าบริษัท'),
('10783', 'แก้ว บิวตี้ จำกัด', 'ภาคอีสาน', 'สุรินทร์', 'เซลล์หนิง'),
('10349', 'หจก.กานต์ บิวตี้', 'ภาคอีสาน', 'ร้อยเอ็ด', 'เซลล์หนิง'),
('10387', 'ศุภกรบิวตี้', 'ภาคอีสาน', 'ศรีษะเกษ', 'เซลล์หนิง'),
('10385', 'แมนมาพร้อม', 'ภาคอีสาน', 'ขอนแก่น', 'เซลล์หนิง'),
('10356', 'เจเอ็ม คอสเมติกส์ (ไทยแลนด์) จำกัด', 'ภาคอีสาน', 'นครราชสีมา', 'เซลล์หนิง'),
('10377', 'แป้งบิวตี้', 'ภาคอีสาน', 'นครราชสีมา', 'เซลล์หนิง'),
('10378', 'เฟื่องฟ้า', 'ภาคอีสาน', 'นครราชสีมา', 'เซลล์หนิง'),
('10398', 'หจก.เอบิวตี้', 'ภาคอีสาน', 'นครราชสีมา', 'เซลล์หนิง'),
('10844', 'คุณโบว์ 2562', 'ภาคอีสาน', 'นครราชสีมา', 'เซลล์หนิง'),
('10828', 'ปราณทิพย์', 'ภาคอีสาน', 'สระบุรี', 'เซลล์หนิง'),
('10155', 'สระแก้วบิวตี้', 'ภาคกลาง/ตะวันออก', 'สระแก้ว', 'เซลล์ภัทร'),
('10775', 'กันเอง (ยโสธร)', 'ภาคอีสาน', 'ยโสธร', 'เซลล์หนิง'),
('10383', 'มุกดามาพร้อม', 'ภาคอีสาน', 'มุกดาหาร', 'เซลล์หนิง'),
('10384', 'เมืองมุกลับคม', 'ภาคอีสาน', 'มุกดาหาร', 'เซลล์หนิง'),
('10042', 'ญานี บิวตี้', 'ภาคอีสาน', 'อำนาจเจริญ', 'เซลล์หนิง'),
('10353', 'เคทีเจ บิวตี้ จำกัด', 'ภาคอีสาน', 'อุบลราชธานี', 'เซลล์หนิง'),
('10372', 'บิวตี้เซ็นเตอร์ 9569 จำกัด', 'ภาคอีสาน', 'อุบลราชธานี', 'เซลล์หนิง'),
('10715', 'ร้านสุชารัตน์', 'ภาคอีสาน', 'อุบลราชธานี', 'เซลล์หนิง'),
('10766', 'หจก.โอเคสวย2555', 'ภาคอีสาน', 'อุบลราชธานี', 'เซลล์หนิง'),
('10393', 'สารคามบิวตี้', 'ภาคอีสาน', 'มหาสารคาม', 'เซลล์หนิง'),
('10396', 'อาร์มอุปกรณ์เสริมสวย', 'ภาคอีสาน', 'มหาสารคาม', 'เซลล์หนิง'),
('10399', 'ออลล์ เซนเตอร์ บิวตี้', 'ภาคอีสาน', 'มหาสารคาม', 'เซลล์หนิง'),
('10400', 'กันเอง (นครนายก)', 'ภาคอีสาน', 'นครนายก', 'เซลล์หนิง'),
('10413', 'เด่น บิวตี้', 'ภาคอีสาน', 'นครนายก', 'เซลล์หนิง'),
('10364', 'เตือน', 'ภาคอีสาน', 'ขอนแก่น', 'เซลล์หนิง'),
('10390', 'สมายด์ บิวตี้', 'ภาคอีสาน', 'ขอนแก่น', 'เซลล์หนิง'),
('10501', 'ทวีชัยบิวตี้', 'ภาคอีสาน', 'ขอนแก่น', 'เซลล์หนิง'),
('10504', 'นพวงศ์', 'ภาคอีสาน', 'ขอนแก่น', 'ลูกค้าบริษัท'),
('10756', 'กระนวน บิวตี้มาร์ท', 'ภาคอีสาน', 'ขอนแก่น', 'เซลล์หนิง'),
('10765', 'ชาญศิริ', 'ภาคอีสาน', 'ขอนแก่น', 'เซลล์หนิง'),
('10567', 'คุณสุรชัย รัตนเกษมชัย', 'ภาคอีสาน', 'หนองบัวลำภู', 'เซลล์หนิง'),
('10564', 'เสริมสวยเสริมสวัสดิ์', 'ภาคอีสาน', 'หนองคาย', 'เซลล์หนิง'),
('10556', 'ศรีรุ่งเรือง', 'ภาคอีสาน', 'หนองคาย', 'เซลล์หนิง'),
('10483', 'เจ เค บิวตี้ช็อป นครพนม', 'ภาคอีสาน', 'นครพนม', 'เซลล์หนิง'),
('10487', 'คุณชัยนรินท์ ภูริเศรษฐศักดิ์', 'ภาคอีสาน', 'สกลนคร', 'เซลล์หนิง'),
('10469', '9 บิวตี้', 'ภาคอีสาน', 'สกลนคร', 'เซลล์หนิง'),
('10463-01', 'กรรไกรทองบิวตี้', 'ภาคอีสาน', 'อุดรธานี', 'เซลล์หนิง'),
('10530', 'ป้อมบิวตี้', 'ภาคอีสาน', 'อุดรธานี', 'เซลล์หนิง'),
('10502', 'ทวีชัย บิวตี้', 'ภาคอีสาน', 'บึงกาฬ', 'เซลล์หนิง'),
('10751', 'มิตรผม', 'ภาคอีสาน', 'สระบุรี', 'เซลล์หนิง'),
('40028', 'คุณภูพิงค์ เกษจำรัส', 'ภาคอีสาน', 'อุบลราชธานี', 'เซลล์หนิง'),
('10719', 'คุณจิรายุ สุขเต็ม', 'ภาคอีสาน', 'สุรินทร์', 'ลูกค้าบริษัท'),
('10773', 'HEADGAME BARBERGEAR BRANCH HQ', 'มาเลเซีย', 'ต่างประเทศ', 'ลูกค้าบริษัท'),
('10110', 'ไม่ประสงค์ออกนาม', 'ยังไม่มีข้อมูล', 'ยังไม่มีข้อมูล', 'ลูกค้าบริษัท'),
('40078', 'คุณถามพัฒน์ อุทธโยธา', 'เขตกรุงเทพและปริมณฑล', 'ทวีวัฒนา', 'ลูกค้าบริษัท'),
('40067', 'คุณพีรชัย สุขพ่วง', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'ลูกค้าบริษัท'),
('10817', 'ตัดดี บาร์เบอร์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ทวีวัฒนา', 'ลูกค้าบริษัท'),
('10737', 'คุณสุบิน แซ่ด่าน', 'เขตกรุงเทพและปริมณฑล', 'ยานนาวา', 'ลูกค้าบริษัท'),
('10116', 'คุณมณเฑียร ลีห์เสถียร', 'ภาคใต้', 'สุราษฎร์ธานี', 'ลูกค้าบริษัท'),
('10771', 'แฮปปี้โฮมบิวตี้ 2020 จำกัด', 'เขตกรุงเทพและปริมณฑล', 'สมุทรสาคร', 'เซลล์กนก'),
('40064', 'คุณสว่าง จันตี', 'ภาคเหนือ', 'พิษณุโลก', 'ลูกค้าบริษัท'),
('40020', 'คุณนิพิฐ  พันธุรัตน์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'ลูกค้าบริษัท'),
('10768', 'ทูเก็ตเตอร์ บาร์เบอร์ช็อป จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'ลูกค้าบริษัท'),
('10847', 'คุณญานิกา นนทสิทธิชัย', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'ลูกค้าบริษัท'),
('10608', 'ดี.ดี.บิวตี้เวิลด์', 'เขตกรุงเทพและปริมณฑล', 'บางเขน', 'เซลล์กนก'),
('70014', 'โซ-ยู ซาลอน พัทยา จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ดินแดง', 'ลูกค้าบริษัท'),
('70015', 'บีบี คอนวีเนียนส์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'ลูกค้าบริษัท'),
('10769', 'หจก.แม่สอด บิวตี้', 'ภาคเหนือ', 'ตาก', 'เซลล์ต๋อง'),
('40079', 'คุณอรพินท์ อำนวยพงศา', 'เขตกรุงเทพและปริมณฑล', 'บางขุนเทียน', 'ลูกค้าบริษัท'),
('10848', 'คุณวสันต์ ฉัตราวิริยะกุล', 'เขตกรุงเทพและปริมณฑล', 'วัฒนา', 'ลูกค้าบริษัท'),
('10001', 'คุณมนัสวี รักท้วม', 'ภาคกลาง/ตะวันออก', 'นครปฐม', 'ลูกค้าบริษัท'),
('10851', 'ศรีสุภัค บิวตี้ เซ็นเตอร์', 'ภาคกลาง/ตะวันออก', 'ฉะเชิงเทรา', 'เซลล์ภัทร'),
('10850', 'สี่มุมเมือง บิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10849', 'เคหะบิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('40080', 'คุณนวรัตน์ คำนิล', 'เขตกรุงเทพและปริมณฑล', 'บางกะปิ', 'ลูกค้าบริษัท'),
('10852', 'หจก.บิวตี้มาร์ท ฉะเชิงเทรา', 'ภาคกลาง/ตะวันออก', 'ฉะเชิงเทรา', 'เซลล์ภัทร'),
('10710', 'หจก.ฟีน บาร์เบอร์ ช็อป ฟู้ดวิลล่า', 'เขตกรุงเทพและปริมณฑล', 'ตลิ่งชัน', 'ลูกค้าบริษัท'),
('10489', 'สาลิกาบิวตี้', 'ภาคใต้', 'สุราษฎร์ธานี', 'เซลล์ตา'),
('10431', 'พัทยา บิวตี้ (ประเทศไทย) จำกัด', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10853', 'สตาร์ บิวตี้', 'ภาคกลาง/ตะวันออก', 'ราชบุรี', 'เซลล์ภัทร'),
('10854', 'หน้ามอ บิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10861', 'ทาม ทู ออเดอร์', 'เขตกรุงเทพและปริมณฑล', 'สะพานสูง', 'เซลล์กนก'),
('10157', 'ส่งเสริมการขาย', 'เขตกรุงเทพและปริมณฑล', 'ทวีวัฒนา', 'ลูกค้าบริษัท'),
('10856', 'ห้องเติมสวย บิวตี้ช็อป', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10359', 'ชมพู่คอสเมติกส์ (เลย)', 'ภาคอีสาน', 'เลย', 'เซลล์หนิง'),
('10863', 'เอกชัย ค้าส่ง', 'ภาคใต้', 'กระบี่', 'เซลล์ตา'),
('10865', 'อาจารย์สมพร บิวตี้', 'ภาคใต้', 'พัทลุง', 'เซลล์ตา'),
('10867', 'การ์ตูนภูเก็ต', 'ภาคใต้', 'ภูเก็ต', 'เซลล์ตา'),
('10857', 'โทฟู สกินแคร์ จำกัด', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10872', 'บิวตี้ บูม ช็อป', 'ภาคใต้', 'ปัตตานี', 'เซลล์ตา'),
('10871', 'จอยเฮลท์ตี้', 'ภาคกลาง/ตะวันออก', 'จันทบุรี', 'เซลล์ภัทร'),
('10873', 'เก็จขวัญ บิวตี้ บูติค', 'ภาคกลาง/ตะวันออก', 'ฉะเชิงเทรา', 'เซลล์ภัทร'),
('10870', 'บิวตี้มาร์ท บุรีรัมย์', 'ภาคอีสาน', 'บุรีรัมย์', 'เซลล์หนิง'),
('10879', 'เฮง เฮง บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'ธนบุรี', 'เซลล์กนก'),
('10876', 'ชัยภูมิบิวตี้', 'ภาคอีสาน', 'ชัยภูมิ', 'เซลล์หนิง'),
('10862', 'มิตร บาร์เบอร์', 'ภาคใต้', 'สงขลา', 'เซลล์ตา'),
('10880', 'ธีรดนย์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('20079', 'ทรงสมัย', 'ภาคเหนือ', 'เชียงใหม่', 'เซลล์ต๋อง'),
('40090', 'ภัชชา', 'ภาคกลาง/ตะวันออก', 'นครนายก', 'เซลล์ภัทร'),
('10881', 'ฟิจิ คัตส์ บาร์เบอร์ช็อป', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เซลล์กนก'),
('20080', 'พัฒนสิทธิ์', 'เขตกรุงเทพและปริมณฑล', 'สมุทรปราการ', 'เซลล์กนก'),
('40088', 'ศูนย์ฝึกอบรมบาร์เบอร์และซาลอน', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('20020', 'ต.ทวีทรัพย์', 'ภาคเหนือ', 'ลำพูน', 'เซลล์ต๋อง'),
('10883', 'ปุณยวีร์', 'เขตกรุงเทพและปริมณฑล', 'นนทบุรี', 'เซลล์กนก'),
('10614', 'นฤมลเทรดดิ้ง', 'เขตกรุงเทพและปริมณฑล', 'บางชัน', 'เซลล์กนก'),
('10636', 'ร้านนวมินทร์เทรดดิ้ง', 'ภาคใต้', 'ตรัง', 'เซลล์ตา'),
('10088', 'บ้านบึงบิวตี้มาร์ท', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10606', 'ฐาปนี', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', 'เซลล์กนก'),
('10889', 'ร้านรักบิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', 'เซลล์ภัทร'),
('10896', 'บิวตี้มาร์ท คลอง3', 'เขตกรุงเทพและปริมณฑล', 'ปทุมธานี', null),
('10891', 'พรคอสเมติก', 'ภาคอีสาน', 'สระบุรี', null),
('10901', 'ร้านต่อดิ บิวตี้', 'ภาคอีสาน', 'สกลนคร', null),
('10900', 'ร้านพันธุ์เจริญบิวตี้ ชัยภูมิ', 'ภาคอีสาน', 'ชัยภูมิ', null),
('10902', 'ร้านลัดดาพร บิวตี้', 'ภาคอีสาน', 'อุดรธานี', null),
('10735', 'ร้านเด่นบิวตี้ สาขาปากช่อง', 'ภาคอีสาน', 'นครราชสีมา', null),
('10904', 'ร้านน้องหญิง', 'ภาคอีสาน', 'ขอนแก่น', null),
('10906', 'ร้านพัทยาบิวตี้', 'ภาคกลาง/ตะวันออก', 'ชลบุรี', null),
('40033', 'คุณวรรณพัทธ์   ปนัสยาธนากุญช์', 'เขตกรุงเทพและปริมณฑล', 'ทวีวัฒนา', null),
('40010', 'คุณชฎาณัฏฏ์  ปัญญา', 'เขตกรุงเทพและปริมณฑล', 'สายไหม', null),
('10670', 'สุขสวัสดิ์บิวตี้', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพมหานคร', 'เลขที่ 661/49 ถนนสุขสวัสดิ์'),
('CUS-AGENT-999', 'ร้านเทสทดสอบ-1780650337148', 'ภาคใต้', 'สงขลา', 'หาดใหญ่'),
('0', 'บริษัทพันธ์วาดีจำกัด', 'เขตกรุงเทพและปริมณฑล', 'กรุงเทพ', 'ทวีวัฒนา'),
('รอระบุข้อมูล', 'ร้านวันบิวตี้วัน', 'ภาคอีสาน', 'อุบลราชธนี', null),
('10908', 'รินะบิวตี้ 2011', 'ภาคอีสาน', 'หนองคาย', null),
('รอระบุข้อมูล', 'ร้านหน้าตาดี', 'เขตกรุงเทพและปริมณฑล', 'ร้อยเอ็ด', 'หนองอีเกิ้ง');
```

---

### 📄 File: `supabase\phase4f_fix_admin_permissions.sql`
```sql
-- ============================================================
-- GoCost — Phase 4f: แก้บั๊กบัญชี ADMIN ไม่เห็นเมนู Workshop
--
-- สาเหตุ: ตอนแยก role ADMIN ในเฟส 3c แก้ has_page_permission ฝั่ง server ถูกต้อง
-- แต่ไฟล์ src/lib/permissions.js ฝั่ง client (ใช้กรองเมนู sidebar) ยังเช็ค
-- role === 'ผู้บริหาร' ค้างอยู่ ไม่ได้แก้เป็น 'ADMIN' ตาม (แก้ในโค้ดฝั่ง frontend
-- แยกต่างหากแล้ว) — และบัญชี ADMIN ที่สร้างก่อนเฟส 4 ไม่เคยถูกเติมสิทธิ์หน้า
-- Workshop/stores ในฐานข้อมูลเลย จึงเติมให้ครบทุก key ปัจจุบันในไฟล์นี้
-- ============================================================

update users set page_permissions =
  '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan","workshop-approve","workshop-accounting","stores"]'::jsonb
where role = 'ADMIN';

```

---

### 📄 File: `supabase\phase4g_workshop_edit_delete.sql`
```sql
-- ============================================================
-- GoCost — Phase 4g: แก้ไข/ลบคำขอ Workshop (ของตัวเอง)
-- รันหลัง phase4f_fix_admin_permissions.sql
--
-- กติกาสิทธิ์: role ADMIN ทำได้เสมอ (ของใครก็ได้) ส่วน role อื่นต้องมีสิทธิ์
-- page key 'workshop-plan-edit' / 'workshop-plan-delete' *และ* ต้องเป็นเจ้าของ
-- คำขอนั้นเอง (created_by ตรงกับผู้เรียก) ถึงจะทำได้ — กันไม่ให้คนอื่นมาแก้/ลบ
-- คำขอของเพื่อนร่วมงานแม้จะมี permission เดียวกัน
--
-- ข้อจำกัดตามสถานะ (กันไม่ให้แก้/ลบเอกสารที่ผูกกับบัญชีจริงไปแล้ว):
--   แก้ไขข้อมูลร้าน/วันที่      → เฉพาะสถานะ pending_approval เท่านั้น
--   แก้ไขข้อมูลหลังงาน          → เฉพาะสถานะ awaiting_sales_data / pending_accounting
--   ลบคำขอทั้งใบ                → เฉพาะสถานะ pending_approval / rejected / awaiting_sales_data
--   (ห้ามแก้/ลบเมื่อสถานะ completed เด็ดขาด เพราะมีเอกสารบัญชีจริงผูกอยู่แล้ว)
-- ============================================================

create or replace function update_workshop_plan_request(
  p_plan_id text, p_store_id bigint, p_planned_date date, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
  v_actor_role text;
  v_store_name text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  if v_actor_role is distinct from 'ADMIN' then
    if not has_page_permission(p_actor_id, 'workshop-plan-edit') then
      return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขคำขอ Workshop');
    end if;
    if v_row.created_by <> p_actor_id then
      return jsonb_build_object('success', false, 'message', 'คุณแก้ไขได้เฉพาะคำขอของตัวเองเท่านั้น');
    end if;
  end if;

  if v_row.status <> 'pending_approval' then
    return jsonb_build_object('success', false, 'message', 'แก้ไขได้เฉพาะคำขอที่ยังรออนุมัติเท่านั้น');
  end if;
  if p_store_id is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกร้านค้า');
  end if;
  if p_planned_date is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกวันที่วางแผนจัดงาน');
  end if;

  select name into v_store_name from stores where id = p_store_id;
  if v_store_name is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;

  update workshop_plans set store_id = p_store_id, planned_date = p_planned_date where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'EDIT_WORKSHOP_REQUEST', 'Workshop_Plans',
    format('แก้ไขคำขอ %s → ร้าน %s วันที่ %s', p_plan_id, v_store_name, p_planned_date));

  return jsonb_build_object('success', true, 'message', 'แก้ไขคำขอ Workshop สำเร็จ');
end;
$$;

create or replace function update_workshop_sales_data(
  p_plan_id text, p_attendees int, p_sales_push_amount numeric,
  p_workshop_sales_amount numeric, p_attachment_path text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
  v_actor_role text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  if v_actor_role is distinct from 'ADMIN' then
    if not has_page_permission(p_actor_id, 'workshop-plan-edit') then
      return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขข้อมูล Workshop');
    end if;
    if v_row.created_by <> p_actor_id then
      return jsonb_build_object('success', false, 'message', 'คุณแก้ไขได้เฉพาะคำขอของตัวเองเท่านั้น');
    end if;
  end if;

  if v_row.status not in ('awaiting_sales_data', 'pending_accounting') then
    return jsonb_build_object('success', false, 'message', 'แก้ไขข้อมูลหลังงานได้เฉพาะช่วงก่อนบัญชีลงบัญชีเสร็จเท่านั้น');
  end if;
  if p_attendees is null or p_attendees < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกจำนวนคนเข้างานให้ถูกต้อง');
  end if;
  if p_sales_push_amount is null or p_sales_push_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอดขายดันเข้าร้านค้าให้ถูกต้อง');
  end if;
  if p_workshop_sales_amount is null or p_workshop_sales_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอดขาย Workshop ให้ถูกต้อง');
  end if;

  update workshop_plans set
    attendees = p_attendees,
    sales_push_amount = p_sales_push_amount,
    workshop_sales_amount = p_workshop_sales_amount,
    attachment_path = case when p_attachment_path is null then attachment_path else nullif(p_attachment_path, '') end
  where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'EDIT_WORKSHOP_SALES_DATA', 'Workshop_Plans', 'แก้ไขข้อมูลหลังงาน: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'แก้ไขข้อมูลสำเร็จ');
end;
$$;

create or replace function delete_workshop_plan(p_plan_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
  v_actor_role text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  if v_actor_role is distinct from 'ADMIN' then
    if not has_page_permission(p_actor_id, 'workshop-plan-delete') then
      return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบคำขอ Workshop');
    end if;
    if v_row.created_by <> p_actor_id then
      return jsonb_build_object('success', false, 'message', 'คุณลบได้เฉพาะคำขอของตัวเองเท่านั้น');
    end if;
  end if;

  if v_row.status not in ('pending_approval', 'rejected', 'awaiting_sales_data') then
    return jsonb_build_object('success', false, 'message', 'ลบไม่ได้ — คำขอนี้เข้าสู่ขั้นตอนบัญชีแล้ว');
  end if;

  delete from workshop_plans where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'DELETE_WORKSHOP', 'Workshop_Plans', 'ลบคำขอ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'ลบคำขอ Workshop สำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- backfill: ให้บัญชี ADMIN ทุกบัญชีมี key ใหม่ 2 ตัวนี้ในรายการด้วย (ADMIN bypass
-- อยู่แล้วจากการเช็ค role แต่เติมไว้ให้ checkbox ในหน้าแผงสิทธิ์แสดงติ๊กครบถูกต้อง)
-- ─────────────────────────────────────────────
update users set page_permissions = page_permissions || '["workshop-plan-edit","workshop-plan-delete"]'::jsonb
where role = 'ADMIN'
  and not (page_permissions ? 'workshop-plan-edit' and page_permissions ? 'workshop-plan-delete');

-- ─────────────────────────────────────────────
-- default permission: เพิ่ม 2 key ใหม่ให้ role 'เซลล์' โดย default เช่นเดียวกับ
-- 'workshop-plan' เดิม (เป็นฟีเจอร์ของตัวเองอยู่แล้ว) — role อื่นไม่ default ให้
-- ต้องให้ ADMIN มอบสิทธิ์เองถ้าต้องการ
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_actor_role text;
  v_current_role text;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select role into v_actor_role from users where id = p_actor_id;

  select exists(select 1 from users where id = p_id) into v_exists;
  if v_exists then select role into v_current_role from users where id = p_id; end if;

  if p_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ตั้งค่าหรือมอบ role ADMIN ให้ผู้อื่นได้');
  end if;
  if v_exists and v_current_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบัญชี ADMIN ได้');
  end if;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ADMIN' then
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan","workshop-plan-edit","workshop-plan-delete","workshop-approve","workshop-accounting","stores"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan","workshop-plan-edit","workshop-plan-delete"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","workshop-accounting"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- backfill: ให้บัญชี role 'เซลล์' ที่มีอยู่แล้วได้สิทธิ์แก้ไข/ลบคำขอของตัวเองด้วย
update users set page_permissions = page_permissions || '["workshop-plan-edit","workshop-plan-delete"]'::jsonb
where role = 'เซลล์'
  and not (page_permissions ? 'workshop-plan-edit' and page_permissions ? 'workshop-plan-delete');

```

---

### 📄 File: `supabase\phase4h_workshop_restructure.sql`
```sql
-- ============================================================
-- GoCost — Phase 4h: ปรับโครงสร้าง Workshop ครั้งใหญ่ตามที่ตกลงกันใหม่
-- รันหลัง phase4g_workshop_edit_delete.sql
--
-- การเปลี่ยนแปลงหลัก:
-- 1. แยกสิทธิ์ 'workshop-plan' เดิมเป็น 2 ตัว: 'workshop-plan-create' (สร้างคำขอ)
--    กับ 'workshop-plan-view' (ดูประวัติ)
-- 2. ตัดขั้นตอนบัญชีออกทั้งหมด — เซลล์กรอกข้อมูลหลังงานเสร็จ = จบเลย (status
--    เปลี่ยนเป็น completed ทันที ไม่ผ่าน pending_accounting อีกต่อไป)
-- 3. ช่องข้อมูลหลังงาน (จำนวนคนเข้างาน/ยอดขาย 2 ช่อง/ไฟล์แนบ) ไม่บังคับกรอกอีกต่อไป
-- 4. แก้ไข/ลบคำขอได้โดยไม่สนสถานะ (เอาเงื่อนไขสถานะที่เคยกันไว้ออกทั้งหมดตามที่ขอ
--    — เพิ่มความเสี่ยงเรื่องข้อมูลที่ "เสร็จสิ้น" แล้วถูกแก้ย้อนหลังได้ ให้ใช้ audit log
--    ในการตรวจสอบย้อนหลังแทน)
-- 5. เลขที่เอกสาร Workshop เปลี่ยนจาก 'WS'+timestamp เป็น 'IV'+ปี ค.ศ.+เลขรัน 6 หลัก
--    (รูปแบบเดียวกับ generate_document_number() ของฝั่งค่าใช้จ่าย แต่แยก sequence
--    คนละชุดกัน)
--
-- หมายเหตุ: complete_workshop_accounting, get_workshop_plans เดิมที่ join
-- accounting_doc_number ยังอยู่ในตารางเผื่อ backward-compat กับข้อมูลเก่าที่เคย
-- ผ่านขั้นตอนบัญชีไปแล้วก่อนเฟสนี้ แต่จะไม่ถูกเขียนเพิ่มอีกต่อไป
-- ============================================================

-- ─────────────────────────────────────────────
-- generate_workshop_doc_number — พอร์ตรูปแบบเดียวกับ generate_document_number()
-- แต่แยก sequence คนละชุด (prefix 'IV' คนละตัวกับ 'PV')
-- ─────────────────────────────────────────────
create or replace function generate_workshop_doc_number()
returns text
language plpgsql
as $$
declare
  current_year text := to_char(now(), 'YYYY');
  last_doc_no text;
  running_num int;
  new_doc_no text;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_workshop_doc_number_lock'));

  select id into last_doc_no
  from workshop_plans
  where id like 'IV' || current_year || '%'
  order by id desc
  limit 1;

  if last_doc_no is null then
    new_doc_no := 'IV' || current_year || '000001';
  else
    running_num := (substring(last_doc_no from 7))::int + 1;
    new_doc_no := 'IV' || current_year || lpad(running_num::text, 6, '0');
  end if;

  return new_doc_no;
end;
$$;

-- ─────────────────────────────────────────────
-- create_workshop_plan — ใช้เลขที่เอกสารรูปแบบใหม่ + เช็คสิทธิ์ใหม่ 'workshop-plan-create'
-- ─────────────────────────────────────────────
create or replace function create_workshop_plan(p_store_id bigint, p_planned_date date, p_created_by text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id text := generate_workshop_doc_number();
  v_store_name text;
begin
  if not has_page_permission(p_created_by, 'workshop-plan-create') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์สร้างคำขอ Workshop');
  end if;
  if p_store_id is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกร้านค้า');
  end if;
  if p_planned_date is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกวันที่วางแผนจัดงาน');
  end if;

  select name into v_store_name from stores where id = p_store_id;
  if v_store_name is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;

  insert into workshop_plans (id, store_id, planned_date, created_by)
  values (v_id, p_store_id, p_planned_date, p_created_by);

  perform add_notification('', '', format('%s เสนอแผน Workshop ร้าน %s วันที่ %s', p_created_by, v_store_name, p_planned_date), v_id);
  perform write_audit_log(p_created_by, 'CREATE_WORKSHOP', 'Workshop_Plans', format('สร้างแผน: %s (%s)', v_id, v_store_name));

  return jsonb_build_object('success', true, 'planId', v_id, 'message', 'ส่งคำขอ Workshop เรียบร้อย รอผู้มีสิทธิ์อนุมัติ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_workshop_plans — เช็คสิทธิ์ใหม่ (create/view/approve — ตัด accounting ออก)
-- ─────────────────────────────────────────────
create or replace function get_workshop_plans(p_actor_id text)
returns table (
  id text, store_id bigint, store_name text, region text, province text,
  assigned_sales_name text, planned_date date, status text,
  created_by text, created_at timestamptz, approved_by text, approved_at timestamptz, admin_note text,
  attendees int, sales_push_amount numeric, workshop_sales_amount numeric,
  attachment_path text, sales_data_submitted_at timestamptz,
  accounting_doc_number text, accounting_completed_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not (has_page_permission(p_actor_id, 'workshop-plan-create')
       or has_page_permission(p_actor_id, 'workshop-plan-view')
       or has_page_permission(p_actor_id, 'workshop-approve')) then
    raise exception 'คุณไม่มีสิทธิ์ดูข้อมูล Workshop';
  end if;

  return query
  select wp.id, wp.store_id, s.name, s.region, s.province, u.name,
         wp.planned_date, wp.status, wp.created_by, wp.created_at,
         wp.approved_by, wp.approved_at, wp.admin_note,
         wp.attendees, wp.sales_push_amount, wp.workshop_sales_amount,
         wp.attachment_path, wp.sales_data_submitted_at,
         wp.accounting_doc_number, wp.accounting_completed_at
  from workshop_plans wp
  join stores s on s.id = wp.store_id
  left join users u on u.id = s.assigned_sales_id
  order by wp.created_at desc;
end;
$$;

-- ─────────────────────────────────────────────
-- approve_workshop_plan — สถานะปลายทางเปลี่ยนข้อความแจ้งเตือนให้ตรงกับ flow ใหม่
-- (logic การอนุมัติเหมือนเดิมทุกอย่าง แค่ข้อความแจ้งเตือนบอกว่า "รอเซลล์อัพเดตข้อมูล")
-- ─────────────────────────────────────────────
create or replace function approve_workshop_plan(p_plan_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
begin
  if not has_page_permission(p_actor_id, 'workshop-approve') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์อนุมัติ Workshop');
  end if;

  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status <> 'pending_approval' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  update workshop_plans set status = 'awaiting_sales_data', approved_by = p_actor_id, approved_at = now()
  where id = p_plan_id;

  perform add_notification('', v_row.created_by, format('แผน Workshop %s ได้รับการอนุมัติแล้ว — รอคุณอัพเดตข้อมูลหลังงาน', p_plan_id), p_plan_id);
  perform write_audit_log(p_actor_id, 'APPROVE_WORKSHOP', 'Workshop_Plans', 'อนุมัติ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'อนุมัติแผน Workshop สำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- submit_workshop_sales_data — เปลี่ยนใหญ่: ทุกช่องไม่บังคับกรอกแล้ว และกดยืนยันแล้ว
-- จบกระบวนการทันที (status → completed) ไม่ผ่านขั้นตอนบัญชีอีกต่อไป
-- ─────────────────────────────────────────────
create or replace function submit_workshop_sales_data(
  p_plan_id text, p_attendees int, p_sales_push_amount numeric,
  p_workshop_sales_amount numeric, p_attachment_path text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
begin
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.created_by <> p_actor_id then
    return jsonb_build_object('success', false, 'message', 'คุณไม่ใช่เจ้าของแผนนี้');
  end if;
  if v_row.status <> 'awaiting_sales_data' then
    return jsonb_build_object('success', false, 'message', 'แผนนี้ไม่ได้อยู่ในสถานะรออัพเดตข้อมูล');
  end if;
  -- ไม่บังคับกรอกแล้วตามที่ขอ แค่กันค่าติดลบถ้ามีการกรอกมา
  if p_attendees is not null and p_attendees < 0 then
    return jsonb_build_object('success', false, 'message', 'จำนวนคนเข้างานต้องไม่ติดลบ');
  end if;
  if p_sales_push_amount is not null and p_sales_push_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'ยอดขายดันเข้าร้านค้าต้องไม่ติดลบ');
  end if;
  if p_workshop_sales_amount is not null and p_workshop_sales_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'ยอดขาย Workshop ต้องไม่ติดลบ');
  end if;

  update workshop_plans set
    attendees = p_attendees,
    sales_push_amount = p_sales_push_amount,
    workshop_sales_amount = p_workshop_sales_amount,
    attachment_path = p_attachment_path,
    sales_data_submitted_at = now(),
    status = 'completed'
  where id = p_plan_id;

  perform add_notification('', p_actor_id, format('Workshop %s เสร็จสิ้นสมบูรณ์แล้ว', p_plan_id), p_plan_id);
  perform write_audit_log(p_actor_id, 'COMPLETE_WORKSHOP', 'Workshop_Plans', 'อัพเดตข้อมูลและจบกระบวนการ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลสำเร็จ Workshop นี้เสร็จสิ้นสมบูรณ์แล้ว');
end;
$$;

-- ─────────────────────────────────────────────
-- update_workshop_plan_request — ตัดเงื่อนไขสถานะออก (แก้ไขได้ไม่ว่าสถานะไหนตามที่ขอ)
-- ─────────────────────────────────────────────
create or replace function update_workshop_plan_request(
  p_plan_id text, p_store_id bigint, p_planned_date date, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
  v_actor_role text;
  v_store_name text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  if v_actor_role is distinct from 'ADMIN' then
    if not has_page_permission(p_actor_id, 'workshop-plan-edit') then
      return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขคำขอ Workshop');
    end if;
    if v_row.created_by <> p_actor_id then
      return jsonb_build_object('success', false, 'message', 'คุณแก้ไขได้เฉพาะคำขอของตัวเองเท่านั้น');
    end if;
  end if;

  if p_store_id is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกร้านค้า');
  end if;
  if p_planned_date is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกวันที่วางแผนจัดงาน');
  end if;

  select name into v_store_name from stores where id = p_store_id;
  if v_store_name is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบร้านค้านี้');
  end if;

  update workshop_plans set store_id = p_store_id, planned_date = p_planned_date where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'EDIT_WORKSHOP_REQUEST', 'Workshop_Plans',
    format('แก้ไขคำขอ %s → ร้าน %s วันที่ %s', p_plan_id, v_store_name, p_planned_date));

  return jsonb_build_object('success', true, 'message', 'แก้ไขคำขอ Workshop สำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- update_workshop_sales_data — ตัดเงื่อนไขสถานะออก + ทุกช่องไม่บังคับกรอกเหมือนกัน
-- ใช้แก้ไขข้อมูลหลังงานได้แม้สถานะจะ "เสร็จสิ้น" แล้วก็ตาม
-- ─────────────────────────────────────────────
create or replace function update_workshop_sales_data(
  p_plan_id text, p_attendees int, p_sales_push_amount numeric,
  p_workshop_sales_amount numeric, p_attachment_path text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
  v_actor_role text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  if v_actor_role is distinct from 'ADMIN' then
    if not has_page_permission(p_actor_id, 'workshop-plan-edit') then
      return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขข้อมูล Workshop');
    end if;
    if v_row.created_by <> p_actor_id then
      return jsonb_build_object('success', false, 'message', 'คุณแก้ไขได้เฉพาะคำขอของตัวเองเท่านั้น');
    end if;
  end if;

  if p_attendees is not null and p_attendees < 0 then
    return jsonb_build_object('success', false, 'message', 'จำนวนคนเข้างานต้องไม่ติดลบ');
  end if;
  if p_sales_push_amount is not null and p_sales_push_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'ยอดขายดันเข้าร้านค้าต้องไม่ติดลบ');
  end if;
  if p_workshop_sales_amount is not null and p_workshop_sales_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'ยอดขาย Workshop ต้องไม่ติดลบ');
  end if;

  update workshop_plans set
    attendees = p_attendees,
    sales_push_amount = p_sales_push_amount,
    workshop_sales_amount = p_workshop_sales_amount,
    attachment_path = case when p_attachment_path is null then attachment_path else nullif(p_attachment_path, '') end
  where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'EDIT_WORKSHOP_SALES_DATA', 'Workshop_Plans', 'แก้ไขข้อมูลหลังงาน: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'แก้ไขข้อมูลสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- delete_workshop_plan — ตัดเงื่อนไขสถานะออก (ลบได้ไม่ว่าสถานะไหนตามที่ขอ)
-- ─────────────────────────────────────────────
create or replace function delete_workshop_plan(p_plan_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row workshop_plans%rowtype;
  v_actor_role text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  select * into v_row from workshop_plans where id = p_plan_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;

  if v_actor_role is distinct from 'ADMIN' then
    if not has_page_permission(p_actor_id, 'workshop-plan-delete') then
      return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบคำขอ Workshop');
    end if;
    if v_row.created_by <> p_actor_id then
      return jsonb_build_object('success', false, 'message', 'คุณลบได้เฉพาะคำขอของตัวเองเท่านั้น');
    end if;
  end if;

  delete from workshop_plans where id = p_plan_id;

  perform write_audit_log(p_actor_id, 'DELETE_WORKSHOP', 'Workshop_Plans', 'ลบคำขอ: ' || p_plan_id);

  return jsonb_build_object('success', true, 'message', 'ลบคำขอ Workshop สำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_workshop_sales_summary — เพิ่มจำนวนตามสถานะให้ครบ สำหรับหน้าแดชบอร์ด Workshop
-- ─────────────────────────────────────────────
create or replace function get_workshop_sales_summary(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year int := (p_filters->>'year')::int;
  v_month int := (p_filters->>'month')::int;
  v_total_workshop_sales numeric := 0;
  v_total_push_sales numeric := 0;
  v_completed_count int := 0;
  v_pending_approval_count int := 0;
  v_awaiting_sales_count int := 0;
  v_rejected_count int := 0;
begin
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  select coalesce(sum(workshop_sales_amount), 0), coalesce(sum(sales_push_amount), 0), count(*)
  into v_total_workshop_sales, v_total_push_sales, v_completed_count
  from workshop_plans
  where status = 'completed'
    and (v_year is null or extract(year from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  select count(*) into v_pending_approval_count from workshop_plans
  where status = 'pending_approval'
    and (v_year is null or extract(year from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  select count(*) into v_awaiting_sales_count from workshop_plans
  where status = 'awaiting_sales_data'
    and (v_year is null or extract(year from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  select count(*) into v_rejected_count from workshop_plans
  where status = 'rejected'
    and (v_year is null or extract(year from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  return jsonb_build_object(
    'success', true,
    'totalWorkshopSales', v_total_workshop_sales,
    'totalPushSales', v_total_push_sales,
    'completedCount', v_completed_count,
    'pendingApprovalCount', v_pending_approval_count,
    'awaitingSalesCount', v_awaiting_sales_count,
    'rejectedCount', v_rejected_count
  );
end;
$$;

-- ─────────────────────────────────────────────
-- default permissions ใหม่: แยก workshop-plan-create/view แทน workshop-plan เดิม
-- ตัด workshop-accounting ออกจาก default ทุก role (ไม่มีหน้านี้แล้ว)
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_actor_role text;
  v_current_role text;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select role into v_actor_role from users where id = p_actor_id;

  select exists(select 1 from users where id = p_id) into v_exists;
  if v_exists then select role into v_current_role from users where id = p_id; end if;

  if p_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ตั้งค่าหรือมอบ role ADMIN ให้ผู้อื่นได้');
  end if;
  if v_exists and v_current_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบัญชี ADMIN ได้');
  end if;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ADMIN' then
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete","workshop-approve","stores"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- ─────────────────────────────────────────────
-- backfill: แปลง permission เก่าเป็นชุดใหม่ให้ user ที่มีอยู่แล้ว
-- (ใครมี 'workshop-plan' เดิม → ได้ create+view ทั้งคู่, ตัด 'workshop-accounting'
-- ทิ้งไปเลยเพราะไม่มีหน้านี้แล้ว)
-- ─────────────────────────────────────────────
update users
set page_permissions = (page_permissions - 'workshop-plan' - 'workshop-accounting')
  || case when page_permissions ? 'workshop-plan'
          then '["workshop-plan-create","workshop-plan-view"]'::jsonb
          else '[]'::jsonb end
where page_permissions ? 'workshop-plan' or page_permissions ? 'workshop-accounting';

update users set page_permissions = page_permissions || '["workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'workshop-plan-view');

```

---

### 📄 File: `supabase\phase4i_audit_log_admin.sql`
```sql
-- ============================================================
-- GoCost — Phase 4i: บันทึกกิจกรรม — filter เดือน/ปี, โชว์ชื่อเล่น, ADMIN แก้ไข/ลบได้
-- รันหลัง phase4h_workshop_restructure.sql
-- ============================================================

drop function if exists get_audit_logs(text, int);
create or replace function get_audit_logs(
  p_actor_id text, p_year int default null, p_month int default null, p_limit int default 500
)
returns table (
  log_id text, "timestamp" timestamptz, user_id text, user_name text,
  action text, module text, details text
)
language plpgsql
security definer
as $$
declare
  v_year int := p_year;
begin
  if not has_page_permission(p_actor_id, 'audit-log') then
    raise exception 'คุณไม่มีสิทธิ์ดูบันทึกกิจกรรม';
  end if;
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  return query
  select a.log_id, a."timestamp", a.user_id, u.name as user_name, a.action, a.module, a.details
  from audit_logs a
  left join users u on u.id = a.user_id
  where (v_year is null or extract(year from a."timestamp") = v_year)
    and (p_month is null or extract(month from a."timestamp") = p_month)
  order by a."timestamp" desc
  limit p_limit;
end;
$$;

-- ─────────────────────────────────────────────
-- edit_audit_log / delete_audit_log — เฉพาะ role ADMIN เท่านั้น (เช็ค role ตรงๆ
-- ไม่ผ่าน has_page_permission เพราะการแก้ไข/ลบหลักฐานกิจกรรมเป็นเรื่องละเอียดอ่อน
-- ไม่ควรมอบสิทธิ์ผ่านแผงสิทธิ์ทั่วไปได้ ต้องเป็น ADMIN ตัวจริงเท่านั้น)
-- ─────────────────────────────────────────────
create or replace function edit_audit_log(p_log_id text, p_new_details text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor_role text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  if v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบันทึกกิจกรรมได้');
  end if;

  update audit_logs set details = p_new_details where log_id = p_log_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบบันทึกนี้');
  end if;

  -- บันทึกการแก้ไขนี้เองเป็น log ใหม่ เพื่อไม่ให้ประวัติการแก้ไข audit log หายไปเงียบๆ
  perform write_audit_log(p_actor_id, 'EDIT_AUDIT_LOG', 'Audit_Logs', format('แก้ไข log %s', p_log_id));

  return jsonb_build_object('success', true, 'message', 'แก้ไขบันทึกกิจกรรมสำเร็จ');
end;
$$;

create or replace function delete_audit_log(p_log_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_actor_role text;
begin
  select role into v_actor_role from users where id = p_actor_id;
  if v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ลบบันทึกกิจกรรมได้');
  end if;

  delete from audit_logs where log_id = p_log_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบบันทึกนี้');
  end if;

  perform write_audit_log(p_actor_id, 'DELETE_AUDIT_LOG', 'Audit_Logs', format('ลบ log %s', p_log_id));

  return jsonb_build_object('success', true, 'message', 'ลบบันทึกกิจกรรมสำเร็จ');
end;
$$;

```

---

### 📄 File: `supabase\phase4j_migrate_legacy_status.sql`
```sql
-- ============================================================
-- GoCost — Phase 4j: ย้ายข้อมูล Workshop เก่าที่ค้างสถานะ pending_accounting
-- (สถานะนี้ถูกตัดออกไปแล้วในเฟส 4h เพราะไม่มีขั้นตอนบัญชีอีกต่อไป — ถ้ามีคำขอเก่า
-- ที่เซลล์กรอกข้อมูลหลังงานไปแล้วแต่ยังค้างรอบัญชี (สร้างไว้ก่อนเฟส 4h) ให้ถือว่า
-- "เสร็จสิ้น" ไปเลย เพราะเซลล์ทำหน้าที่ตัวเองครบแล้ว)
-- รันหลัง phase4i_audit_log_admin.sql
-- ============================================================

update workshop_plans set status = 'completed'
where status = 'pending_accounting';

```

---

### 📄 File: `supabase\phase5a_accounts.sql`
```sql
-- ============================================================
-- GoCost — Phase 5a: จัดการรหัสทางบัญชี (ผังบัญชี) — รากฐานของเฟส 5
-- รันหลัง phase4j_migrate_legacy_status.sql
--
-- ครอบคลุม:
-- 1. ตาราง accounts + CRUD เต็มรูปแบบ (เพิ่ม/แก้ไข/ลบ) ผ่านหน้า "จัดการรหัสบัญชี"
-- 2. กลไก "ตรวจจับรหัสใหม่จากไฟล์ที่แนบ" แบบทั่วไป (generic) — ใช้ได้กับไฟล์
--    รูปแบบไหนก็ได้ที่ parse ออกมาเป็น {code, name, category, description} แล้ว
--    ยังไม่ได้ผูกกับ parser เฉพาะของ Express/Bluenote เพราะยังไม่มีไฟล์ตัวอย่าง
--    จริงให้ดู (รอไฟล์อยู่) — เมื่อได้ไฟล์แล้วจะมาต่อ parser เฉพาะให้เรียกกลไกนี้
-- 3. ถ้ารหัสใหม่ข้อมูลไม่ครบ (รหัส/ชื่อ/หมวดหมู่/รายละเอียด) ต้องกรอกให้ครบก่อนบันทึก
-- ============================================================

create table if not exists accounts (
  id          bigint generated always as identity primary key,
  code        text not null unique,
  name        text not null,
  category    text not null,   -- เช่น 'รายได้ (Revenue)', 'ค่าใช้จ่าย (Expenses)', 'อื่นๆ (Others)'
  description text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_accounts_code on accounts(code);

alter table accounts enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- get_accounts — ต้องมีสิทธิ์ page key 'accounts'
-- ─────────────────────────────────────────────
create or replace function get_accounts(p_actor_id text, p_query text default null)
returns table (
  id bigint, code text, name text, category text, description text,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    raise exception 'คุณไม่มีสิทธิ์ดูรหัสบัญชี';
  end if;

  return query
  select a.id, a.code, a.name, a.category, a.description, a.created_at, a.updated_at
  from accounts a
  where p_query is null or trim(p_query) = ''
     or a.code ilike '%' || p_query || '%'
     or a.name ilike '%' || p_query || '%'
     or a.category ilike '%' || p_query || '%'
  order by a.code;
end;
$$;

-- ─────────────────────────────────────────────
-- create_account / update_account / delete_account
-- ─────────────────────────────────────────────
create or replace function create_account(
  p_code text, p_name text, p_category text, p_description text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id bigint;
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์เพิ่มรหัสบัญชี');
  end if;
  if coalesce(trim(p_code), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรหัสบัญชี');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อบัญชี');
  end if;
  if coalesce(trim(p_category), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกหมวดหมู่บัญชี');
  end if;
  if coalesce(trim(p_description), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรายละเอียด');
  end if;

  if exists (select 1 from accounts where code = trim(p_code)) then
    return jsonb_build_object('success', false, 'message', format('รหัสบัญชี %s มีอยู่แล้วในระบบ', p_code));
  end if;

  insert into accounts (code, name, category, description)
  values (trim(p_code), trim(p_name), trim(p_category), trim(p_description))
  returning id into v_id;

  perform write_audit_log(p_actor_id, 'CREATE_ACCOUNT', 'Accounts', format('เพิ่มรหัสบัญชี: %s (%s)', p_code, p_name));
  return jsonb_build_object('success', true, 'message', 'เพิ่มรหัสบัญชีสำเร็จ', 'id', v_id);
end;
$$;

create or replace function update_account(
  p_id bigint, p_code text, p_name text, p_category text, p_description text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขรหัสบัญชี');
  end if;
  if coalesce(trim(p_code), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรหัสบัญชี');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อบัญชี');
  end if;
  if coalesce(trim(p_category), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกหมวดหมู่บัญชี');
  end if;
  if coalesce(trim(p_description), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรายละเอียด');
  end if;

  if exists (select 1 from accounts where code = trim(p_code) and id <> p_id) then
    return jsonb_build_object('success', false, 'message', format('รหัสบัญชี %s ถูกใช้กับรายการอื่นอยู่แล้ว', p_code));
  end if;

  update accounts set
    code = trim(p_code), name = trim(p_name), category = trim(p_category),
    description = trim(p_description), updated_at = now()
  where id = p_id;

  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรหัสบัญชีนี้');
  end if;

  perform write_audit_log(p_actor_id, 'UPDATE_ACCOUNT', 'Accounts', format('แก้ไขรหัสบัญชี id %s: %s', p_id, p_code));
  return jsonb_build_object('success', true, 'message', 'แก้ไขรหัสบัญชีสำเร็จ');
end;
$$;

create or replace function delete_account(p_id bigint, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบรหัสบัญชี');
  end if;

  delete from accounts where id = p_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรหัสบัญชีนี้');
  end if;

  perform write_audit_log(p_actor_id, 'DELETE_ACCOUNT', 'Accounts', 'ลบรหัสบัญชี id: ' || p_id);
  return jsonb_build_object('success', true, 'message', 'ลบรหัสบัญชีสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- check_new_account_codes — ตรวจว่ารหัสจากไฟล์ที่แนบ (parse มาแล้วฝั่ง client เป็น
-- jsonb array ของ {code,name,category,description}) มีตัวไหนใหม่บ้าง (ยังไม่มีใน
-- accounts) คืนกลับมาเป็น 2 กลุ่ม: รหัสใหม่ที่ข้อมูลครบ / รหัสใหม่ที่ข้อมูลไม่ครบ
-- (ให้ frontend เตือนให้กรอกให้ครบก่อนกดบันทึกจริงตามที่ขอ)
-- ─────────────────────────────────────────────
create or replace function check_new_account_codes(p_actor_id text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row jsonb;
  v_code text;
  v_complete jsonb := '[]'::jsonb;
  v_incomplete jsonb := '[]'::jsonb;
  v_existing_count int := 0;
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์นำเข้ารหัสบัญชี');
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    v_code := nullif(trim(v_row->>'code'), '');
    if v_code is null then continue; end if;

    if exists (select 1 from accounts where code = v_code) then
      v_existing_count := v_existing_count + 1;
      continue;
    end if;

    if coalesce(trim(v_row->>'name'), '') = '' or coalesce(trim(v_row->>'category'), '') = ''
       or coalesce(trim(v_row->>'description'), '') = '' then
      v_incomplete := v_incomplete || jsonb_build_array(v_row);
    else
      v_complete := v_complete || jsonb_build_array(v_row);
    end if;
  end loop;

  return jsonb_build_object(
    'success', true,
    'existingCount', v_existing_count,
    'newComplete', v_complete,
    'newIncomplete', v_incomplete
  );
end;
$$;

-- ─────────────────────────────────────────────
-- bulk_import_accounts — บันทึกรหัสใหม่ที่ข้อมูลครบแล้ว (เรียกหลังจาก
-- check_new_account_codes + frontend ให้ผู้ใช้กรอกช่องที่ขาดจนครบแล้วเท่านั้น)
-- ปฏิเสธทั้งชุดถ้ามีแถวไหนข้อมูลยังไม่ครบ ป้องกันข้อมูลครึ่งๆ กลางๆ เข้าระบบ
-- ─────────────────────────────────────────────
create or replace function bulk_import_accounts(p_actor_id text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row jsonb;
  v_count int := 0;
  v_skipped int := 0;
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์นำเข้ารหัสบัญชี');
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    if coalesce(trim(v_row->>'code'), '') = '' or coalesce(trim(v_row->>'name'), '') = ''
       or coalesce(trim(v_row->>'category'), '') = '' or coalesce(trim(v_row->>'description'), '') = '' then
      return jsonb_build_object('success', false, 'message',
        format('รหัส %s ข้อมูลยังไม่ครบ กรุณากรอกให้ครบก่อนบันทึก', coalesce(v_row->>'code', '(ไม่ทราบรหัส)')));
    end if;

    if exists (select 1 from accounts where code = trim(v_row->>'code')) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into accounts (code, name, category, description)
    values (trim(v_row->>'code'), trim(v_row->>'name'), trim(v_row->>'category'), trim(v_row->>'description'));
    v_count := v_count + 1;
  end loop;

  perform write_audit_log(p_actor_id, 'IMPORT_ACCOUNTS', 'Accounts', format('นำเข้ารหัสบัญชีใหม่ %s รายการ (ข้าม %s รายการที่มีอยู่แล้ว)', v_count, v_skipped));
  return jsonb_build_object('success', true, 'message', format('นำเข้ารหัสบัญชีใหม่สำเร็จ %s รายการ', v_count), 'imported', v_count, 'skipped', v_skipped);
end;
$$;

-- ─────────────────────────────────────────────
-- default permission: 'accounts' ให้เฉพาะ ADMIN โดย default (role อื่นต้องให้
-- ADMIN มอบสิทธิ์เองถ้าต้องการ) — เปลี่ยนแค่ case ของ ADMIN ใน v_default_perms
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_actor_role text;
  v_current_role text;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select role into v_actor_role from users where id = p_actor_id;

  select exists(select 1 from users where id = p_id) into v_exists;
  if v_exists then select role into v_current_role from users where id = p_id; end if;

  if p_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ตั้งค่าหรือมอบ role ADMIN ให้ผู้อื่นได้');
  end if;
  if v_exists and v_current_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบัญชี ADMIN ได้');
  end if;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ADMIN' then
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete","workshop-approve","stores","accounts"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","accounts"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- backfill: ให้บัญชี ADMIN ทุกบัญชีมีสิทธิ์ 'accounts' ด้วย
update users set page_permissions = page_permissions || '["accounts"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'accounts');

```

---

### 📄 File: `supabase\phase5a_accounts_seed.sql`
```sql
-- ============================================================
-- GoCost — Phase 5a seed data: ผังบัญชีจริง (chart of accounts)
-- นำเข้าจากไฟล์ที่คุณส่งมา (86 รหัส — ตัดแถวที่ 1 ออกเพราะรหัสเสีย
-- เป็นแค่เครื่องหมาย " ค้างอยู่ ไม่ใช่รหัสจริง เพิ่มเองทีหลังผ่านหน้าจัดการได้)
-- ============================================================

insert into accounts (code, name, category, description) values
('4100-01', 'รายได้จากการขาย', 'รายได้ (Revenue)', 'ค่าฝา(ที่ลูกค้าไม่ยอมทำลดหนี้),ค่าธรรมเนียมธนาคาร'),
('4100-03', 'หัก  รับคืนสินค้า', 'รายได้ (Revenue)', 'หัก  รับคืนสินค้า'),
('4100-04', 'หัก ส่วนลดจ่าย', 'รายได้ (Revenue)', 'ค่าลับคม + ค่าซ่อม ที่เก็บจากลูกค้า'),
('4100-05', 'รายได้จากการขายต่างประเทศ', 'รายได้ (Revenue)', 'ส่วนลดฝั่งจ่าย(คูปองส่วนลด)'),
('4200-08', 'รายได้อื่น ๆ', 'รายได้ (Revenue)', 'นำเข้าจากตู้คอนเทนเนอร์ shiping , ค่าขนส่ง,ค่าตัวอย่าง ต่างประเทศ ทุกช่องทาง'),
('5130-02', 'บวก ส่วนลดรับ', 'ค่าใช้จ่าย (Expenses)', 'วัสดุ popup,sticker,package,produc talker,shelf talker'),
('5130-04', 'ค่าใช้จ่ายนำเข้าและค่าขนส่งเข้า', 'ค่าใช้จ่าย (Expenses)', 'เกี่ยวกับนำเข้า อยู่ในหมวดเดียวกับ5130-04'),
('5130-06', 'ค่าวัสดุสิ้นเปลือง-เพื่อจำหน่าย', 'ค่าใช้จ่าย (Expenses)', 'ฝ่ายขาย+พีซี พนักงานประจำที่มีประกันสังคม (ไม่รวมเบี้ยเลี้ยง)'),
('5130-07', 'ค่าอากรขาเข้า', 'ค่าใช้จ่าย (Expenses)', 'กรรไกร , บัตตาเลี่ยน'),
('5130-08', 'เงินเดือน-ฝ่ายขาย', 'ค่าใช้จ่าย (Expenses)', 'พนักงานทดลองงานที่ยังไม่เข้าประกันสังคม (เฉพาะพีซีและฝ่ายขาย)'),
('5130-12', 'ค่าลับคม', 'ค่าใช้จ่าย (Expenses)', 'จาก platform online , job bkk'),
('6000-01', 'ค่านายหน้า 1/2', 'ค่าใช้จ่าย (Expenses)', 'ซื้อสินค้าตัวอย่างมาทดลอง'),
('6000-02', 'ค่าโฆษณา', 'ค่าใช้จ่าย (Expenses)', 'ของขวัญปีใหม่,ของแจกลูกค้า,boxset (ค่าใช้จ่ายไม่เกี่ยวกับสินค้า และการเปิดบิล)'),
('6000-03', 'ค่าสินค้าตัวอย่าง', 'ค่าใช้จ่าย (Expenses)', 'ค่าขนส่งค้าส่งยี่ปั้ว,ค่าขนส่งที่เราไปส่งเองทั้งหมด'),
('6000-04', 'ค่าส่งเสริมการขาย-ทั่วไป', 'ค่าใช้จ่าย (Expenses)', 'ค่าอาหารต่างๆที่เบิกเลี้ยง รับรองลูกค้า,ค่าอาหารกองถ่ายคอนเท้น,พาร์ทเนอร์+ศูนย์ฝึก'),
('6000-05', 'ค่าขนส่ง', 'ค่าใช้จ่าย (Expenses)', 'เกี่ยวข้องกับพีซีและฝ่ายขาย ค่าเดินทางคิดตาม Km, ค่าเรียกgrab/taxi ,ค่าจอดรถ,ตั๋วเครื่องบินในประเทศ'),
('6000-06', 'ค่ารับรอง', 'ค่าใช้จ่าย (Expenses)', 'หลักฐานการเติมเงินเข้า easypass,ช่องเงินสดนำบิลมาเบิก'),
('6000-09', 'ค่าใช้จ่ายเดินทางและยานพาหนะ', 'ค่าใช้จ่าย (Expenses)', 'นำมาเบิกต้องมีบิลเท่านั้น'),
('6000-11', 'ค่าทางด่วน', 'ค่าใช้จ่าย (Expenses)', 'ตั๋วเครื่องบินนอกประเทศ(ทุกอย่างที่มีบิล จากการใช้จ่าย ณ ต่างประเทศ)'),
('6000-12', 'ค่าน้ำมัน', 'ค่าใช้จ่าย (Expenses)', 'ค่าเช่าอุปกรณ์ต่างๆ(smoke,laptop,furniture,other)'),
('6000-13', 'ค่าใช้จ่ายเดินทางไปต่างประเทศ', 'ค่าใช้จ่าย (Expenses)', 'ค่าเช่าพืนที่ บิวเทรี่ยม/ยี่ปั้ว, workshop,ออกงาน(หัก3%)'),
('6000-14', 'ค่าบริการอุปกรณ์ต่างๆจัดงาน,ออกบูธ', 'ค่าใช้จ่าย (Expenses)', 'ค่าเช่าพืนที่ workshop,ออกงาน(หัก5%)'),
('6000-15', 'ค่าบริการพื้นที่ จัดงาน,ออกบูธ,วางสินค้า', 'ค่าใช้จ่าย (Expenses)', 'ค่าพรีเมี่ยมไอดี,ค่าซื้อข้อความบอร์ดแคสเพิ่ม'),
('6000-16', 'ค่าเช่าพื้นที่จัดงาน,ออกบูธ,วางสินค้า', 'ค่าใช้จ่าย (Expenses)', 'ค่าเช่าพื้นที่จัดงาน,ออกบูธ,วางสินค้า'),
('6000-17', 'ค่าบริการ,ค่าธรรมเนียม-Line@', 'ค่าใช้จ่าย (Expenses)', 'ค่าบริการ,ค่าธรรมเนียม-Line@'),
('6000-19', 'ค่าบริการ,ค่าธรรมเนียม-SHOPEE', 'ค่าใช้จ่าย (Expenses)', 'ค่าบริการ,ค่าธรรมเนียม-SHOPEE'),
('6000-20', 'ค่าบริการ,ค่าธรรมเนียม-LAZADA', 'ค่าใช้จ่าย (Expenses)', 'พนักงาน+ผู้บริหาร ที่พัก workshop(เฉพาะที่พัก ไม่เกี่ยวกับการจัดเลี้ยง)'),
('6000-22', 'ค่าบริการ,ค่าธรรมเนียม-SPX Express', 'ค่าใช้จ่าย (Expenses)', 'ค่าบริการ,ค่าธรรมเนียม-SPX Express'),
('6000-23', 'ค่าโรงแรม-ค่าที่พัก', 'ค่าใช้จ่าย (Expenses)', 'พีซีประจำร้านที่เป็นบุคคลภายนอก หัก3%'),
('6000-24', 'ค่าบริการ,ค่าธรรมเนียม-ROCKET8', 'ค่าใช้จ่าย (Expenses)', 'เกี่ยวกับสต็อกสินค้าและการเปิดบิล'),
('6000-26', 'ค่านายหน้า 2/2-ไม่ใชพนักงาน', 'ค่าใช้จ่าย (Expenses)', 'เกี่ยวกับสต็อกสินค้าและการเปิดบิล'),
('6000-27', 'ค่าส่งเสริมการขาย -AB(แอมบาสเดอร์)', 'ค่าใช้จ่าย (Expenses)', 'เกี่ยวกับสต็อกสินค้าและการเปิดบิล'),
('6000-28', 'ค่าส่งเสริมการขาย-WS(เวิร์คช๊อป)', 'ค่าใช้จ่าย (Expenses)', 'เกี่ยวกับสต็อกสินค้าและการเปิดบิล'),
('6000-29', 'ค่าส่งเสริมการขาย-รีวิวสินค้า,ถ่ายคอนเท้น,TESTER', 'ค่าใช้จ่าย (Expenses)', 'เกี่ยวกับสต็อกสินค้าและการเปิดบิล'),
('6000-30', 'ค่าส่งเสริมการขาย-สนับสนุน', 'ค่าใช้จ่าย (Expenses)', 'ตามหัวบิล'),
('6000-31', 'ค่าส่งเสริมการขาย-ตั้งกอง/พรีเมี่ยม', 'ค่าใช้จ่าย (Expenses)', 'ตามหัวบิล'),
('6001-01', 'ค่าขนส่ง-SHOPEE', 'ค่าใช้จ่าย (Expenses)', 'ตามหัวบิล'),
('6001-02', 'ค่าขนส่ง-LAZADA', 'ค่าใช้จ่าย (Expenses)', 'ตามหัวบิล'),
('6001-03', 'ค่าขนส่ง-SPX Express', 'ค่าใช้จ่าย (Expenses)', 'ผู้บริหาร+พนักงาน ที่ออกอบรมง่านต่างๆ'),
('6001-04', 'ค่าขนส่ง-ROCKET8', 'ค่าใช้จ่าย (Expenses)', 'ค่าขนส่ง-ROCKET8'),
('6100-12', 'ค่าอบรมสัมนา', 'ค่าใช้จ่าย (Expenses)', 'ค่าอบรมสัมนา'),
('6110-01', 'เงินเดือน-แผนก/บริหาร', 'ค่าใช้จ่าย (Expenses)', 'ค่าเบี้ยพนักงานฝ่ายขายและพีซี (ไม่เกี่ยวข้องกับบุคคลภายนอก)'),
('6110-02', 'ค่าล่วงเวลา-แผนก/บัญชี', 'ค่าใช้จ่าย (Expenses)', 'ค่าล่วงเวลา-แผนก/บัญชี'),
('6110-03', 'ค่าเบี้ยเลี้ยง 1/2', 'ค่าใช้จ่าย (Expenses)', 'รายได้เพิ่มพิเศษนอกเหนือจากเงินเดือน(เฉพาะพนักงานเท่านั้น)'),
('6110-04', 'โบนัส (ยังไม่ได้เอามาตั้ง)', 'ค่าใช้จ่าย (Expenses)', 'พนักงานฝ่ายขาย/พีซี ที่ผ่านโปรเข้าประกันสังคมแล้ว'),
('6110-05', 'เงินเพิ่มพิเศษ', 'ค่าใช้จ่าย (Expenses)', 'เงินเพิ่มพิเศษ'),
('6110-08', 'คอมมิชชั่น (พนักงานบริษัทPC+/ฝ่ายขาย)', 'ค่าใช้จ่าย (Expenses)', 'คอมมิชชั่น (พนักงานบริษัทPC+/ฝ่ายขาย)'),
('6110-09', 'เงินสมทบกองทุนประกันสังคม', 'ค่าใช้จ่าย (Expenses)', 'ซื้อเค้กวันเกิดให้พนักงาน,ซื้อเลี้ยงพนักงาน(เลี้ยงน้ำวันตู้ลง)'),
('6110-10', 'เงินสมทบกองทุนทดแทน', 'ค่าใช้จ่าย (Expenses)', 'ค่าเบี้ยเลี้ยงที่พนักงานออฟฟิศออกworkshop'),
('6110-17', 'ค่าสวัสดิการอื่น ๆ', 'ค่าใช้จ่าย (Expenses)', 'เครื่องเขียน(อุปกรณ์ใช้ในออฟฟิศ เช่นแฟ้ม,กระดาษ,ปากกา,หมึก,อื่นๆ)'),
('6110-19', 'ค่าเบี้ยเลี้ยง 2/2 -WS', 'ค่าใช้จ่าย (Expenses)', 'ค่าเบี้ยเลี้ยง 2/2 -WS'),
('6120-01', 'ค่าเครื่องเขียนแบบพิมพ์', 'ค่าใช้จ่าย (Expenses)', 'ถุงดำ,ทิชชู่,สก็อตเทป'),
('6120-02', 'ค่าซ่อมแซม,ตกแต่ง,ต่อเติม-สำนักงาน', 'ค่าใช้จ่าย (Expenses)', 'ค่าซ่อม printer,คอม'),
('6120-03', 'วัสดุสิ้นเปลือง', 'ค่าใช้จ่าย (Expenses)', 'ถ่ายน้ำมันเครื่อง และค่าซ่อมอื่นๆที่เกี่ยวกับรถ'),
('6120-08', 'ค่าซ่อมแซมเครื่องใช้,อุปกรณ์ สนง.', 'ค่าใช้จ่าย (Expenses)', 'อุปกรณ์ต่างๆที่ไม่เกี่ยวกับสินค้า'),
('6120-09', 'ค่าซ่อมแซมยานพาหนะ', 'ค่าใช้จ่าย (Expenses)', 'จากการปิดงบ'),
('6120-10', 'ค่าอะไหล่และอุปกรณ์', 'ค่าใช้จ่าย (Expenses)', 'เช็คเพิ่มอีกที เช่น ลูกค้าบิดจากค่าเช่า 5%เป็นค่าบริการ3%'),
('6120-12', 'ค่าบริการทำบัญชี', 'ค่าใช้จ่าย (Expenses)', 'บุลคลภายนอก (หัก3%)'),
('6120-13', 'ค่าบริการ', 'ค่าใช้จ่าย (Expenses)', 'ค่าบริการ'),
('6120-14', 'ค่าจ้าง 1/3', 'ค่าใช้จ่าย (Expenses)', 'ค่าจ้าง 1/3'),
('6120-15', 'ค่าที่ปรึกษา', 'ค่าใช้จ่าย (Expenses)', 'ค่าที่ปรึกษา'),
('6120-16', 'ค่าเช่าอาคาร', 'ค่าใช้จ่าย (Expenses)', 'ฝ่ายขาย/พีซี (หัก3%)'),
('6120-17', 'ค่าเช่ายานพาหนะ', 'ค่าใช้จ่าย (Expenses)', 'ฝ่ายบริหาร (หัก3%)'),
('6120-18', 'ค่าจ้าง 2/3', 'ค่าใช้จ่าย (Expenses)', 'ค่าจ้าง 2/3'),
('6120-19', 'ค่าจ้าง 3/3', 'ค่าใช้จ่าย (Expenses)', 'ค่าจ้าง 3/3'),
('6130-01', 'ค่าโทรศัพท์', 'ค่าใช้จ่าย (Expenses)', 'ค่าโทรศัพท์'),
('6130-02', 'ค่าไฟฟ้า', 'ค่าใช้จ่าย (Expenses)', 'ค่าไฟฟ้า'),
('6130-03', 'ค่าน้ำประปา', 'ค่าใช้จ่าย (Expenses)', 'ค่าน้ำประปา'),
('6130-04', 'ค่าไปรษณีย์', 'ค่าใช้จ่าย (Expenses)', 'ค่าไปรษณีย์'),
('6130-05', 'ค่าอากรแสตมป์', 'ค่าใช้จ่าย (Expenses)', 'ค่าอากรแสตมป์'),
('6130-06', 'ค่าอินเทอร์เน็ต', 'ค่าใช้จ่าย (Expenses)', 'ค่าอินเทอร์เน็ต'),
('6150-04', 'ค่าเบี้ยประกัน-ยานพาหนะ', 'ค่าใช้จ่าย (Expenses)', 'ค่าเบี้ยประกัน-ยานพาหนะ'),
('6150-05', 'ค่าเบี้ยประกัน-ทรัพย์สิน', 'ค่าใช้จ่าย (Expenses)', 'พรบ,อื่นๆ'),
('6160-01', 'ค่าภาษีบำรุงท้องที่และภาษีโรงเรือน', 'ค่าใช้จ่าย (Expenses)', 'ค่าภาษีบำรุงท้องที่และภาษีโรงเรือน'),
('6160-02', 'ค่าภาษียานพาหนะ', 'ค่าใช้จ่าย (Expenses)', 'พี่นุ่นทั้งหมด'),
('6160-04', 'ค่าธรรมเนียมธนาคาร', 'ค่าใช้จ่าย (Expenses)', 'กู้ยืนเงิน,ดอกเบี้ยที่บริษัทจ่ายให้แก่เจ้าหนี้'),
('6160-07', 'ค่าธรรมเนียมอื่นๆ/อย.,มอก', 'ค่าใช้จ่าย (Expenses)', 'ต้องมีใบอนุโมทนา'),
('6170-01', 'ดอกเบี้ยจ่าย', 'ค่าใช้จ่าย (Expenses)', 'ไม่กวาด,น้ำยาถูกพื้น,ของใช้อื่นๆทำความสะอาด'),
('6170-04', 'ค่าบริจาคการกุศล', 'ค่าใช้จ่าย (Expenses)', 'ค่าบริจาคการกุศล'),
('6170-06', 'ค่าใช้จ่ายเบ็ดเตล็ด', 'ค่าใช้จ่าย (Expenses)', 'ค่าใช้จ่ายเบ็ดเตล็ด'),
('6170-08', 'ส่วนขาดเงินเกินเศษสตางค์', 'ค่าใช้จ่าย (Expenses)', 'ใช้ได้ภาษีเฉพาะรถขนส่ง,ค่ารับรอง,เบี้ยประกัน'),
('6170-09', 'ดอกเบี้ย O/D', 'ค่าใช้จ่าย (Expenses)', 'ใช้ได้ภาษีเฉพาะรถขนส่ง,ค่ารับรอง,เบี้ยประกัน'),
('6190-01', 'ภาษีซื้อไม่ขอคืน', 'ค่าใช้จ่าย (Expenses)', 'กรณีจ่าย ส่งภาษีไม่ทัน(ทางสรรมภากร)'),
('6190-02', 'ภาษีซื้อขอคืนไม่ได้', 'ค่าใช้จ่าย (Expenses)', 'ในการเปิดบิลส่งเสริมการขาย vat7% ไม่สามารถเคลมได้'),
('6190-03', 'เบี้ยปรับเงินเพิ่ม', 'ค่าใช้จ่าย (Expenses)', 'เบี้ยปรับเงินเพิ่ม'),
('6190-04', 'ค่าใช้จ่ายต้องห้ามฯ', 'ค่าใช้จ่าย (Expenses)', 'ค่าใช้จ่ายต้องห้ามฯ');
```

---

### 📄 File: `supabase\phase5b_budgets.sql`
```sql
-- ============================================================
-- GoCost — Phase 5b: ตั้งงบประมาณ (Budget Cap) แยกตามหมวดหมู่ค่าใช้จ่าย
-- รันหลัง phase5a_accounts_seed.sql
--
-- หมายเหตุการออกแบบ: ตั้งงบตาม "หมวดหมู่ค่าใช้จ่าย" (MAIN_CATEGORIES 7 หมวดที่ใช้
-- ในฟอร์มบันทึกค่าใช้จ่ายจริง เช่น ค่าใช้จ่าย Partner, ค่าใช้จ่าย Workshop) ไม่ใช่
-- "หมวดหมู่บัญชี" ของผังบัญชี (accounts.category ซึ่งมีแค่ 3 ค่ากว้างๆ คือ รายได้/
-- ค่าใช้จ่าย/อื่นๆ) เพราะหมวดที่ใช้บันทึกค่าใช้จ่ายจริงคือตัวที่มีความหมายพอจะตั้ง
-- งบคุมได้ (ตรงกับตัวอย่างที่เคยคุยกันไว้ "Content เท่าไร / Partner เท่าไร")
-- ตั้งเป็นงบรายปีต่อหมวดหมู่ (ไม่แยกรายเดือน เพื่อความง่ายและตรงกับที่ขอ "budget
-- cap ของบริษัท")
-- ============================================================

create table if not exists budgets (
  id          bigint generated always as identity primary key,
  category    text not null,
  year        int not null,
  amount      numeric not null default 0,
  updated_by  text references users(id),
  updated_at  timestamptz not null default now(),
  unique (category, year)
);

alter table budgets enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- get_budgets — คืนงบทุกหมวดของปีที่ระบุ (ต้องมีสิทธิ์ 'budgets' หรือ 'exec-dashboard'
-- เพราะแดชบอร์ดฝ่ายบริหารต้องอ่านค่างบมาเทียบด้วย)
-- ─────────────────────────────────────────────
create or replace function get_budgets(p_actor_id text, p_year int)
returns table (id bigint, category text, year int, amount numeric, updated_at timestamptz)
language plpgsql
security definer
as $$
begin
  if not (has_page_permission(p_actor_id, 'budgets') or has_page_permission(p_actor_id, 'exec-dashboard')) then
    raise exception 'คุณไม่มีสิทธิ์ดูงบประมาณ';
  end if;

  return query
  select b.id, b.category, b.year, b.amount, b.updated_at
  from budgets b
  where b.year = p_year
  order by b.category;
end;
$$;

-- ─────────────────────────────────────────────
-- save_budget — upsert งบต่อหมวดหมู่/ปี (ต้องมีสิทธิ์ 'budgets')
-- ─────────────────────────────────────────────
create or replace function save_budget(p_category text, p_year int, p_amount numeric, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'budgets') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ตั้งงบประมาณ');
  end if;
  if coalesce(trim(p_category), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณาระบุหมวดหมู่');
  end if;
  if p_amount is null or p_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'จำนวนงบต้องไม่ติดลบ');
  end if;

  insert into budgets (category, year, amount, updated_by, updated_at)
  values (p_category, p_year, p_amount, p_actor_id, now())
  on conflict (category, year)
  do update set amount = excluded.amount, updated_by = excluded.updated_by, updated_at = now();

  perform write_audit_log(p_actor_id, 'SAVE_BUDGET', 'Budgets', format('ตั้งงบ %s ปี %s = %s', p_category, p_year, p_amount));
  return jsonb_build_object('success', true, 'message', 'บันทึกงบประมาณสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- default permission ใหม่: 'budgets' (ตั้งงบ — ADMIN เท่านั้น) และ 'exec-dashboard'
-- (ดูแดชบอร์ดฝ่ายบริหาร — ADMIN + ผู้บริหาร default ให้เลย เพราะทำมาเพื่อฝ่ายนี้)
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_actor_role text;
  v_current_role text;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select role into v_actor_role from users where id = p_actor_id;

  select exists(select 1 from users where id = p_id) into v_exists;
  if v_exists then select role into v_current_role from users where id = p_id; end if;

  if p_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ตั้งค่าหรือมอบ role ADMIN ให้ผู้อื่นได้');
  end if;
  if v_exists and v_current_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบัญชี ADMIN ได้');
  end if;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ADMIN' then
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete","workshop-approve","stores","accounts","budgets","exec-dashboard"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve","exec-dashboard"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","accounts"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

-- backfill: เติมสิทธิ์ใหม่ให้ user เดิม
update users set page_permissions = page_permissions || '["budgets","exec-dashboard"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'budgets' and page_permissions ? 'exec-dashboard');

update users set page_permissions = page_permissions || '["exec-dashboard"]'::jsonb
where role = 'ผู้บริหาร' and not (page_permissions ? 'exec-dashboard');

```

---

### 📄 File: `supabase\phase5c_import_log.sql`
```sql
-- ============================================================
-- GoCost — Phase 5c: ประวัติการนำเข้ารหัสบัญชี
-- รันหลัง phase5b_budgets.sql
-- ============================================================

create table if not exists account_import_logs (
  id            bigint generated always as identity primary key,
  imported_by   text references users(id),
  imported_at   timestamptz not null default now(),
  file_name     text,
  new_count     int not null default 0,
  skipped_count int not null default 0
);

alter table account_import_logs enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- bulk_import_accounts — เพิ่ม p_file_name แล้วบันทึกลง account_import_logs ทุกครั้ง
-- ที่นำเข้า (แม้ import 0 รายการใหม่ก็บันทึกไว้ เพื่อให้เห็นประวัติครบว่าใครลองนำเข้า
-- ไฟล์อะไรบ้าง) — ต้อง drop ก่อนเพราะเปลี่ยน signature จากเฟส 5a เดิม
-- ─────────────────────────────────────────────
drop function if exists bulk_import_accounts(text, jsonb);
create or replace function bulk_import_accounts(p_actor_id text, p_rows jsonb, p_file_name text default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row jsonb;
  v_count int := 0;
  v_skipped int := 0;
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์นำเข้ารหัสบัญชี');
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    if coalesce(trim(v_row->>'code'), '') = '' or coalesce(trim(v_row->>'name'), '') = ''
       or coalesce(trim(v_row->>'category'), '') = '' or coalesce(trim(v_row->>'description'), '') = '' then
      return jsonb_build_object('success', false, 'message',
        format('รหัส %s ข้อมูลยังไม่ครบ กรุณากรอกให้ครบก่อนบันทึก', coalesce(v_row->>'code', '(ไม่ทราบรหัส)')));
    end if;

    if exists (select 1 from accounts where code = trim(v_row->>'code')) then
      v_skipped := v_skipped + 1;
      continue;
    end if;

    insert into accounts (code, name, category, description)
    values (trim(v_row->>'code'), trim(v_row->>'name'), trim(v_row->>'category'), trim(v_row->>'description'));
    v_count := v_count + 1;
  end loop;

  insert into account_import_logs (imported_by, file_name, new_count, skipped_count)
  values (p_actor_id, p_file_name, v_count, v_skipped);

  perform write_audit_log(p_actor_id, 'IMPORT_ACCOUNTS', 'Accounts',
    format('นำเข้ารหัสบัญชีใหม่ %s รายการ จากไฟล์ %s (ข้าม %s รายการที่มีอยู่แล้ว)', v_count, coalesce(p_file_name, '(ไม่ทราบชื่อไฟล์)'), v_skipped));
  return jsonb_build_object('success', true, 'message', format('นำเข้ารหัสบัญชีใหม่สำเร็จ %s รายการ', v_count), 'imported', v_count, 'skipped', v_skipped);
end;
$$;

-- ─────────────────────────────────────────────
-- get_import_logs — ดูประวัติการนำเข้า (ใช้สิทธิ์ 'accounts' เดียวกัน)
-- ─────────────────────────────────────────────
create or replace function get_import_logs(p_actor_id text)
returns table (
  id bigint, imported_by text, imported_by_name text,
  imported_at timestamptz, file_name text, new_count int, skipped_count int
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    raise exception 'คุณไม่มีสิทธิ์ดูประวัติการนำเข้า';
  end if;

  return query
  select l.id, l.imported_by, u.name, l.imported_at, l.file_name, l.new_count, l.skipped_count
  from account_import_logs l
  left join users u on u.id = l.imported_by
  order by l.imported_at desc
  limit 100;
end;
$$;

```

---

### 📄 File: `supabase\phase5d_executive_dashboard.sql`
```sql
-- ============================================================
-- GoCost — Phase 5d: แดชบอร์ดฝ่ายบริหาร (P&L ครบวงจร + งบเทียบจริงต่อหมวดหมู่)
-- รันหลัง phase5c_import_log.sql
--
-- ที่มาของตัวเลข "รายได้" — สำคัญมาก อ่านก่อนใช้งาน:
-- ตั้งแต่เฟส 4h ตัดขั้นตอนบัญชีของ Workshop ออกไปแล้ว ทำให้ Workshop ไม่เขียนแถว
-- ลง expense_records อีกต่อไป (ของเดิมเคยเติมแถว main_category='รายได้' ให้อัตโนมัติ
-- ตอนบัญชียืนยัน — ตอนนี้ไม่มีแล้ว) ดังนั้น "รายได้จริง" ของบริษัทตอนนี้ต้องดึงจาก
-- workshop_plans.sales_push_amount (ยอดขายดันเข้าร้านค้า) โดยตรง ไม่ใช่จาก
-- expense_records อีกต่อไป — แดชบอร์ดนี้จึงดึงรายได้จาก Workshop เป็นหลัก
-- ============================================================

create or replace function get_executive_dashboard(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_revenue numeric := 0;
  v_total_expenses numeric := 0;
  v_by_category jsonb := '[]'::jsonb;
  r record;
begin
  if not has_page_permission(p_actor_id, 'exec-dashboard') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูแดชบอร์ดฝ่ายบริหาร');
  end if;

  -- รายได้จริง: จาก Workshop ที่เสร็จสิ้นแล้วในปีนั้น (ยอดขายดันเข้าร้านค้า)
  select coalesce(sum(sales_push_amount), 0) into v_total_revenue
  from workshop_plans
  where status = 'completed' and extract(year from planned_date) = p_year;

  -- รายจ่ายจริง: จาก expense_records ทั้งหมด (ไม่รวมแถว 'รายได้' เก่าที่อาจหลงเหลือ
  -- จากก่อนเฟส 4h)
  select coalesce(sum(total), 0) into v_total_expenses
  from expense_records
  where main_category <> 'รายได้' and extract(year from event_date) = p_year;

  -- สรุปรายหมวดหมู่ เทียบกับงบที่ตั้งไว้
  for r in
    select
      e.main_category as category,
      coalesce(sum(e.total), 0) as actual,
      coalesce(b.amount, 0) as budget
    from expense_records e
    left join budgets b on b.category = e.main_category and b.year = p_year
    where e.main_category <> 'รายได้' and extract(year from e.event_date) = p_year
    group by e.main_category, b.amount

    union all

    -- รวมหมวดที่ตั้งงบไว้แต่ยังไม่มีรายจ่ายจริงในปีนี้ (actual = 0) ด้วย
    select b.category, 0, b.amount
    from budgets b
    where b.year = p_year
      and not exists (
        select 1 from expense_records e2
        where e2.main_category = b.category and extract(year from e2.event_date) = p_year
      )
  loop
    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', r.category,
      'actual', r.actual,
      'budget', r.budget,
      'remaining', r.budget - r.actual,
      'pctUsed', case when r.budget > 0 then round((r.actual / r.budget) * 100, 1) else null end
    ));
  end loop;

  return jsonb_build_object(
    'success', true,
    'year', p_year,
    'totalRevenue', v_total_revenue,
    'totalExpenses', v_total_expenses,
    'netProfit', v_total_revenue - v_total_expenses,
    'byCategory', v_by_category
  );
end;
$$;

```

---

### 📄 File: `supabase\phase5e_account_groups.sql`
```sql
-- ============================================================
-- GoCost — Phase 5e: กลุ่มรหัสบัญชี (แม่/ลูก)
-- รันหลัง phase5d_executive_dashboard.sql
--
-- "แม่กลุ่ม" (account_groups) = สร้างเองโดย admin ตั้งชื่อ+รหัสเอง
-- "ลูกกลุ่ม" = รหัสบัญชีที่มีอยู่แล้วในตาราง accounts ถูก assign เข้ากลุ่มใดกลุ่มหนึ่ง
-- (1 รหัสอยู่ได้แค่ 1 กลุ่มเท่านั้น — ถ้าเปลี่ยนกลุ่มคือย้าย ไม่ใช่อยู่หลายกลุ่มพร้อมกัน)
-- ============================================================

create table if not exists account_groups (
  id         bigint generated always as identity primary key,
  code       text not null unique,
  name       text not null,
  created_by text references users(id),
  created_at timestamptz not null default now()
);

alter table accounts add column if not exists group_id bigint references account_groups(id);

alter table account_groups enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น
-- (ใช้สิทธิ์ page key 'accounts' เดียวกับหน้าจัดการรหัสบัญชี ไม่แยกสิทธิ์ใหม่)

-- ─────────────────────────────────────────────
-- get_account_groups — คืนรายชื่อกลุ่มทั้งหมด พร้อมจำนวนรหัสลูกในแต่ละกลุ่ม
-- ─────────────────────────────────────────────
create or replace function get_account_groups(p_actor_id text)
returns table (id bigint, code text, name text, child_count bigint, created_at timestamptz)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    raise exception 'คุณไม่มีสิทธิ์ดูกลุ่มรหัสบัญชี';
  end if;

  return query
  select g.id, g.code, g.name, count(a.id), g.created_at
  from account_groups g
  left join accounts a on a.group_id = g.id
  group by g.id
  order by g.name;
end;
$$;

-- ─────────────────────────────────────────────
-- get_group_members — รายชื่อรหัสบัญชีที่อยู่ในกลุ่มนี้ + รายชื่อที่ยังไม่มีกลุ่ม
-- (สำหรับหน้าจัดการกลุ่ม ใช้เลือกว่าจะเพิ่มตัวไหนเข้ากลุ่ม)
-- ─────────────────────────────────────────────
create or replace function get_group_members(p_actor_id text, p_group_id bigint)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_members jsonb;
  v_available jsonb;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูกลุ่มรหัสบัญชี');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'code', code, 'name', name) order by code), '[]'::jsonb)
  into v_members
  from accounts where group_id = p_group_id;

  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'code', code, 'name', name) order by code), '[]'::jsonb)
  into v_available
  from accounts where group_id is distinct from p_group_id;

  return jsonb_build_object('success', true, 'members', v_members, 'available', v_available);
end;
$$;

-- ─────────────────────────────────────────────
-- create_account_group / update_account_group / delete_account_group
-- ─────────────────────────────────────────────
create or replace function create_account_group(p_code text, p_name text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_id bigint;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์สร้างกลุ่มรหัสบัญชี');
  end if;
  if coalesce(trim(p_code), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรหัสกลุ่ม');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อกลุ่ม');
  end if;
  if exists (select 1 from account_groups where code = trim(p_code)) then
    return jsonb_build_object('success', false, 'message', format('รหัสกลุ่ม %s มีอยู่แล้ว', p_code));
  end if;

  insert into account_groups (code, name, created_by) values (trim(p_code), trim(p_name), p_actor_id)
  returning id into v_id;

  perform write_audit_log(p_actor_id, 'CREATE_ACCOUNT_GROUP', 'AccountGroups', format('สร้างกลุ่ม: %s (%s)', p_code, p_name));
  return jsonb_build_object('success', true, 'message', 'สร้างกลุ่มสำเร็จ', 'id', v_id);
end;
$$;

create or replace function update_account_group(p_id bigint, p_code text, p_name text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขกลุ่มรหัสบัญชี');
  end if;
  if coalesce(trim(p_code), '') = '' or coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกรหัสและชื่อกลุ่มให้ครบ');
  end if;
  if exists (select 1 from account_groups where code = trim(p_code) and id <> p_id) then
    return jsonb_build_object('success', false, 'message', format('รหัสกลุ่ม %s ถูกใช้อยู่แล้ว', p_code));
  end if;

  update account_groups set code = trim(p_code), name = trim(p_name) where id = p_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มนี้');
  end if;

  perform write_audit_log(p_actor_id, 'UPDATE_ACCOUNT_GROUP', 'AccountGroups', format('แก้ไขกลุ่ม id %s: %s', p_id, p_code));
  return jsonb_build_object('success', true, 'message', 'แก้ไขกลุ่มสำเร็จ');
end;
$$;

create or replace function delete_account_group(p_id bigint, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_child_count int;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบกลุ่มรหัสบัญชี');
  end if;

  select count(*) into v_child_count from accounts where group_id = p_id;
  if v_child_count > 0 then
    return jsonb_build_object('success', false, 'message',
      format('ลบไม่ได้ — ยังมีรหัสบัญชีอยู่ในกลุ่มนี้ %s รายการ กรุณาย้ายออกก่อน', v_child_count));
  end if;

  delete from account_groups where id = p_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มนี้');
  end if;

  perform write_audit_log(p_actor_id, 'DELETE_ACCOUNT_GROUP', 'AccountGroups', 'ลบกลุ่ม id: ' || p_id);
  return jsonb_build_object('success', true, 'message', 'ลบกลุ่มสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- assign_account_to_group — เพิ่ม/ย้าย/เอารหัสบัญชีออกจากกลุ่ม (p_group_id = null คือเอาออก)
-- ─────────────────────────────────────────────
create or replace function assign_account_to_group(p_account_id bigint, p_group_id bigint, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการกลุ่มรหัสบัญชี');
  end if;

  update accounts set group_id = p_group_id where id = p_account_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรหัสบัญชีนี้');
  end if;

  perform write_audit_log(p_actor_id, 'ASSIGN_ACCOUNT_GROUP', 'AccountGroups',
    format('รหัสบัญชี id %s → กลุ่ม id %s', p_account_id, coalesce(p_group_id::text, '(เอาออกจากกลุ่ม)')));
  return jsonb_build_object('success', true, 'message', 'อัปเดตกลุ่มสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_accounts — เพิ่ม group_id/group_name ในผลลัพธ์ (ต้อง drop ก่อนเพราะเปลี่ยน
-- return signature จากเฟส 5a เดิม)
-- ─────────────────────────────────────────────
drop function if exists get_accounts(text, text);
create or replace function get_accounts(p_actor_id text, p_query text default null)
returns table (
  id bigint, code text, name text, category text, description text,
  group_id bigint, group_name text, created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    raise exception 'คุณไม่มีสิทธิ์ดูรหัสบัญชี';
  end if;

  return query
  select a.id, a.code, a.name, a.category, a.description, a.group_id, g.name, a.created_at, a.updated_at
  from accounts a
  left join account_groups g on g.id = a.group_id
  where p_query is null or trim(p_query) = ''
     or a.code ilike '%' || p_query || '%'
     or a.name ilike '%' || p_query || '%'
     or a.category ilike '%' || p_query || '%'
  order by a.code;
end;
$$;

```

---

### 📄 File: `supabase\phase5f_account_groups_defaults.sql`
```sql
-- ============================================================
-- GoCost — Phase 5f: default permission สำหรับ 'account-groups' (กลุ่มรหัสบัญชี)
-- รันหลัง phase5e_account_groups.sql
-- ============================================================

create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_actor_role text;
  v_current_role text;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select role into v_actor_role from users where id = p_actor_id;

  select exists(select 1 from users where id = p_id) into v_exists;
  if v_exists then select role into v_current_role from users where id = p_id; end if;

  if p_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ตั้งค่าหรือมอบ role ADMIN ให้ผู้อื่นได้');
  end if;
  if v_exists and v_current_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบัญชี ADMIN ได้');
  end if;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ADMIN' then
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete","workshop-approve","stores","accounts","account-groups","budgets","exec-dashboard"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve","exec-dashboard"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","accounts","account-groups"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

update users set page_permissions = page_permissions || '["account-groups"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'account-groups');

update users set page_permissions = page_permissions || '["account-groups"]'::jsonb
where role = 'บัญชี' and page_permissions ? 'accounts' and not (page_permissions ? 'account-groups');

```

---

### 📄 File: `supabase\phase5g_account_id_tagging.sql`
```sql
-- ============================================================
-- GoCost — Phase 5g: เชื่อมรายจ่ายจริงเข้ากับรหัสบัญชี (เลือกทางที่ 2 ตามที่ตกลง)
-- รันหลัง phase5f_account_groups_defaults.sql
--
-- เพิ่มช่อง "รหัสบัญชี" เป็นช่องบังคับกรอกในทุกรายการค่าใช้จ่าย (ทั้งตอนบันทึกใหม่
-- และตอนแก้ไข) เพื่อให้รายงานผู้บริหาร/รายงานภาษีดึงข้อมูลจริงมาแสดงได้ทันที
-- ไม่ต้องรอไฟล์ Express/Bluenote
-- ============================================================

alter table expense_records add column if not exists account_id bigint references accounts(id);
create index if not exists idx_expense_records_account_id on expense_records(account_id);

-- ─────────────────────────────────────────────
-- list_accounts_for_selection — รายชื่อรหัสบัญชีสำหรับ dropdown ตอนบันทึกค่าใช้จ่าย
-- (เปิดให้ทุกคนที่มีสิทธิ์ 'expense-entry' เรียกได้ ไม่ต้องมีสิทธิ์ 'accounts'
-- เพราะเป็นแค่การ "เลือกใช้" ไม่ใช่ "จัดการ")
-- ─────────────────────────────────────────────
create or replace function list_accounts_for_selection(p_actor_id text)
returns table (id bigint, code text, name text, category text)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'expense-entry') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายชื่อรหัสบัญชี';
  end if;

  return query select a.id, a.code, a.name, a.category from accounts a order by a.code;
end;
$$;

-- ─────────────────────────────────────────────
-- save_expense_record — เพิ่ม validation บังคับ accountId ต่อรายการ + insert account_id
-- ─────────────────────────────────────────────
create or replace function save_expense_record(
  p_store_name text,
  p_event_date date,
  p_attendees int,
  p_work_days int,
  p_internal_note text,
  p_created_by text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_doc_no text;
  v_item jsonb;
  v_seq int := 0;
  v_qty numeric;
  v_unit_price numeric;
  v_account_id bigint;
begin
  if p_store_name is null or trim(p_store_name) = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อร้านค้า / ชื่องาน');
  end if;
  if p_event_date is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกวันที่จัดงาน');
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ');
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    if coalesce(trim(v_item->>'mainCategory'), '') = '' then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกหมวดหมู่หลัก', v_seq));
    end if;
    if coalesce(trim(v_item->>'detail'), '') = '' then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกรายละเอียด', v_seq));
    end if;
    v_qty := (v_item->>'qty')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    if v_qty is null or v_qty <= 0 then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: จำนวนต้องมากกว่า 0', v_seq));
    end if;
    if v_unit_price is null or v_unit_price < 0 then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: ราคาต่อหน่วยไม่ถูกต้อง', v_seq));
    end if;
    v_account_id := nullif(v_item->>'accountId', '')::bigint;
    if v_account_id is null then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกรหัสบัญชี', v_seq));
    end if;
    if not exists (select 1 from accounts where id = v_account_id) then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: รหัสบัญชีไม่ถูกต้อง', v_seq));
    end if;
  end loop;

  v_doc_no := generate_document_number();
  v_seq := 0;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note, created_by, account_id
    ) values (
      v_doc_no, v_seq, trim(p_store_name), p_event_date, coalesce(p_attendees, 0), coalesce(p_work_days, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(p_internal_note, '')), p_created_by, (v_item->>'accountId')::bigint
    );
  end loop;

  insert into audit_logs (log_id, user_id, action, module, details)
  values ('LOG' || (extract(epoch from clock_timestamp()) * 1000)::bigint, p_created_by,
          'สร้างเอกสาร: ' || v_doc_no, 'บันทึกค่าใช้จ่าย', v_doc_no);

  return jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลสำเร็จ', 'docNo', v_doc_no, 'rowsSaved', v_seq);
end;
$$;

-- ─────────────────────────────────────────────
-- update_expense_record — เพิ่ม account_id เหมือนกัน (ไม่บังคับ validate ซ้ำที่นี่
-- เพราะฝั่ง frontend ผ่านฟอร์มเดียวกับตอนสร้างซึ่งบังคับเลือกอยู่แล้ว)
-- ─────────────────────────────────────────────
create or replace function update_expense_record(
  p_old_doc_number text,
  p_store_name text,
  p_event_date date,
  p_attendees int,
  p_work_days int,
  p_internal_note text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_item jsonb;
  v_seq int := 0;
begin
  delete from expense_records where doc_number = p_old_doc_number;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note, account_id
    ) values (
      p_old_doc_number, v_seq, trim(p_store_name), p_event_date, coalesce(p_attendees, 0), coalesce(p_work_days, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(p_internal_note, '')), nullif(v_item->>'accountId', '')::bigint
    );
  end loop;

  return jsonb_build_object('success', true, 'docNo', p_old_doc_number, 'rowsSaved', v_seq);
end;
$$;

-- ─────────────────────────────────────────────
-- approve_edit_record — carry account_id ผ่าน edit-approval flow ด้วยเช่นกัน
-- ─────────────────────────────────────────────
create or replace function approve_edit_record(p_edit_id text, p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row pending_edits%rowtype;
  v_payload jsonb;
  v_item jsonb;
  v_seq int := 0;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_approve_' || p_edit_id));

  if not has_page_permission(p_actor_id, 'pending-edits') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์อนุมัติคำขอ');
  end if;

  select * into v_row from pending_edits where edit_id = p_edit_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบคำขอนี้');
  end if;
  if v_row.status is distinct from 'pending_edit' then
    return jsonb_build_object('success', false, 'message', 'คำขอนี้ถูกดำเนินการไปแล้ว');
  end if;

  v_payload := coalesce(v_row.new_data_json, '{}'::jsonb);
  delete from expense_records where doc_number = v_row.original_row_id;
  for v_item in select * from jsonb_array_elements(coalesce(v_payload->'items', '[]'::jsonb)) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note, account_id
    ) values (
      v_row.original_row_id, v_seq, trim(v_payload->>'storeName'), (v_payload->>'eventDate')::date,
      coalesce((v_payload->>'attendees')::int, 0), coalesce((v_payload->>'workDays')::int, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(v_payload->>'internalNote', '')), nullif(v_item->>'accountId', '')::bigint
    );
  end loop;

  update pending_edits set status = 'approved', processed_at = now() where edit_id = p_edit_id;
  perform add_notification('', v_row.requested_by, format('คำขอแก้ไขเอกสาร %s ถูกอนุมัติแล้ว', v_row.original_row_id), v_row.original_row_id);
  perform write_audit_log(p_actor_id, 'APPROVE_EDIT', 'Pending_Edits', 'อนุมัติแก้ไข: ' || p_edit_id);

  return jsonb_build_object('success', true, 'message', 'อนุมัติการแก้ไขสำเร็จ');
end;
$$;

```

---

### 📄 File: `supabase\phase5h_reports.sql`
```sql
-- ============================================================
-- GoCost — Phase 5h: รายงานผู้บริหาร (แยกกลุ่ม/รหัสบัญชี) + รายงานสำหรับกรมสรรพากร
-- รันหลัง phase5g_account_id_tagging.sql
-- ============================================================

-- ─────────────────────────────────────────────
-- get_executive_itemized_report — ชี้แจงรายการย่อยทุกรายการ แยกตามกลุ่มแม่/ลูก
-- ใช้สิทธิ์ 'exec-report' แยกต่างหากจาก 'exec-dashboard' (แม้ผู้ชมจะเป็นกลุ่ม
-- เดียวกันโดย default แต่ ADMIN มอบสิทธิ์แยกกันได้อิสระถ้าต้องการ)
-- ─────────────────────────────────────────────
create or replace function get_executive_itemized_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_unassigned_items jsonb;
  v_unassigned_total numeric;
  v_grand_total numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total numeric;
  v_account_items jsonb;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  -- แต่ละกลุ่ม
  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_total := 0;
    for a in select id, code, name from accounts where group_id = g.id order by code loop
      select coalesce(jsonb_agg(jsonb_build_object(
               'docNumber', e.doc_number, 'eventDate', e.event_date, 'storeName', e.store_name,
               'detail', e.detail, 'qty', e.qty, 'unitPrice', e.unit_price, 'total', e.total
             ) order by e.event_date), '[]'::jsonb),
             coalesce(sum(e.total), 0)
      into v_account_items, v_account_total
      from expense_records e
      where e.account_id = a.id and extract(year from e.event_date) = p_year;

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'accountId', a.id, 'code', a.code, 'name', a.name,
        'total', v_account_total, 'items', v_account_items
      ));
      v_group_total := v_group_total + v_account_total;
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'total', v_group_total, 'accounts', v_group_accounts
    ));
    v_grand_total := v_grand_total + v_group_total;
  end loop;

  -- รหัสบัญชีที่ยังไม่มีกลุ่ม
  for a in select id, code, name from accounts where group_id is null order by code loop
    select coalesce(jsonb_agg(jsonb_build_object(
             'docNumber', e.doc_number, 'eventDate', e.event_date, 'storeName', e.store_name,
             'detail', e.detail, 'qty', e.qty, 'unitPrice', e.unit_price, 'total', e.total
           ) order by e.event_date), '[]'::jsonb),
           coalesce(sum(e.total), 0)
    into v_account_items, v_account_total
    from expense_records e
    where e.account_id = a.id and extract(year from e.event_date) = p_year;

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
      'accountId', a.id, 'code', a.code, 'name', a.name,
      'total', v_account_total, 'items', v_account_items
    ));
    v_grand_total := v_grand_total + v_account_total;
  end loop;

  -- รายจ่ายที่ยังไม่ได้ระบุรหัสบัญชี (ข้อมูลเก่าก่อนเฟสนี้)
  select coalesce(jsonb_agg(jsonb_build_object(
           'docNumber', e.doc_number, 'eventDate', e.event_date, 'storeName', e.store_name,
           'mainCategory', e.main_category, 'detail', e.detail, 'total', e.total
         ) order by e.event_date), '[]'::jsonb),
         coalesce(sum(e.total), 0)
  into v_unassigned_items, v_unassigned_total
  from expense_records e
  where e.account_id is null and e.main_category <> 'รายได้' and extract(year from e.event_date) = p_year;

  v_grand_total := v_grand_total + v_unassigned_total;

  return jsonb_build_object(
    'success', true, 'year', p_year,
    'groups', v_groups,
    'ungroupedAccounts', v_ungrouped,
    'unassigned', jsonb_build_object('total', v_unassigned_total, 'items', v_unassigned_items),
    'grandTotal', v_grand_total
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_tax_filing_report — สรุปรายได้/รายจ่ายสำหรับยื่นกรมสรรพากร แยกตามหมวดหมู่บัญชี
-- (รายได้ (Revenue) / ค่าใช้จ่าย (Expenses) / อื่นๆ (Others)) และรหัสบัญชีย่อยในแต่ละหมวด
-- permission key ใหม่ 'tax-report' แยกจาก exec-dashboard เพราะเป็นเอกสารสำหรับส่ง
-- หน่วยงานราชการ ควรจำกัดสิทธิ์แคบกว่า
-- ─────────────────────────────────────────────
create or replace function get_tax_filing_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_revenue numeric := 0;
  v_by_category jsonb := '[]'::jsonb;
  v_net numeric := 0;
  cat record;
  v_lines jsonb;
  v_cat_total numeric;
begin
  if not has_page_permission(p_actor_id, 'tax-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  -- รายได้: จาก Workshop ที่เสร็จสิ้นในปีนั้น (แหล่งรายได้จริงของบริษัทตั้งแต่เฟส 4h)
  select coalesce(sum(sales_push_amount), 0) into v_total_revenue
  from workshop_plans where status = 'completed' and extract(year from planned_date) = p_year;

  -- รายจ่าย: แยกตามหมวดหมู่บัญชี (accounts.category) แล้วแตกเป็นรายรหัสในหมวดนั้น
  for cat in
    select distinct a.category from accounts a
    join expense_records e on e.account_id = a.id
    where extract(year from e.event_date) = p_year
    order by a.category
  loop
    select coalesce(jsonb_agg(jsonb_build_object(
             'code', a.code, 'name', a.name, 'total', line.total
           ) order by a.code), '[]'::jsonb),
           coalesce(sum(line.total), 0)
    into v_lines, v_cat_total
    from (
      select account_id, sum(total) as total
      from expense_records
      where extract(year from event_date) = p_year and account_id is not null
      group by account_id
    ) line
    join accounts a on a.id = line.account_id
    where a.category = cat.category;

    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', cat.category, 'total', v_cat_total, 'lines', v_lines
    ));
  end loop;

  select coalesce(sum(e.total), 0) into v_net
  from expense_records e
  where e.account_id is not null and extract(year from e.event_date) = p_year;

  return jsonb_build_object(
    'success', true, 'year', p_year,
    'totalRevenue', v_total_revenue,
    'totalExpenses', v_net,
    'netIncome', v_total_revenue - v_net,
    'byCategory', v_by_category
  );
end;
$$;

-- ─────────────────────────────────────────────
-- default permission ใหม่: 'tax-report' — ADMIN เท่านั้น (เอกสารส่งราชการ จำกัดแคบ)
-- ─────────────────────────────────────────────
create or replace function save_user(
  p_id text, p_password text, p_role text, p_name text,
  p_full_name text, p_email text, p_actor_id text
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_exists boolean;
  v_actor_role text;
  v_current_role text;
  v_default_perms jsonb;
begin
  if not has_page_permission(p_actor_id, 'users') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการผู้ใช้งาน');
  end if;
  if coalesce(trim(p_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อเล่น (name)');
  end if;
  if coalesce(trim(p_full_name), '') = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อ-นามสกุลจริง (fullName)');
  end if;

  select role into v_actor_role from users where id = p_actor_id;

  select exists(select 1 from users where id = p_id) into v_exists;
  if v_exists then select role into v_current_role from users where id = p_id; end if;

  if p_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่ตั้งค่าหรือมอบ role ADMIN ให้ผู้อื่นได้');
  end if;
  if v_exists and v_current_role = 'ADMIN' and v_actor_role is distinct from 'ADMIN' then
    return jsonb_build_object('success', false, 'message', 'เฉพาะ role ADMIN เท่านั้นที่แก้ไขบัญชี ADMIN ได้');
  end if;

  if v_exists then
    if p_password is not null and trim(p_password) <> '' then
      update users set password_hash = crypt(p_password, gen_salt('bf')),
        role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    else
      update users set role = p_role, name = p_name, full_name = p_full_name, email = coalesce(p_email, '')
      where id = p_id;
    end if;
    perform write_audit_log(p_actor_id, 'UPDATE_USER', 'User', 'แก้ไข user: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'อัปเดต User สำเร็จ');
  else
    if p_password is null or trim(p_password) = '' then
      return jsonb_build_object('success', false, 'message', 'กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่');
    end if;
    v_default_perms := case
      when p_role = 'ADMIN' then
        '["dashboard","expense-entry","expense-history","pending-edits","users","audit-log","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete","workshop-approve","stores","accounts","account-groups","budgets","exec-dashboard","exec-report","tax-report"]'::jsonb
      when p_role = 'ผู้บริหาร' then
        '["dashboard","expense-entry","expense-history","pending-edits","workshop-approve","exec-dashboard","exec-report"]'::jsonb
      when p_role = 'เซลล์' then
        '["dashboard","expense-entry","expense-history","workshop-plan-create","workshop-plan-view","workshop-plan-edit","workshop-plan-delete"]'::jsonb
      when p_role = 'บัญชี' then
        '["dashboard","expense-entry","expense-history","accounts","account-groups"]'::jsonb
      else '["dashboard","expense-entry","expense-history"]'::jsonb
    end;
    insert into users (id, password_hash, role, name, full_name, email, page_permissions)
    values (p_id, crypt(p_password, gen_salt('bf')), p_role, p_name, p_full_name, coalesce(p_email, ''), v_default_perms);
    perform write_audit_log(p_actor_id, 'CREATE_USER', 'User', 'สร้าง user ใหม่: ' || p_id);
    return jsonb_build_object('success', true, 'message', 'เพิ่ม User สำเร็จ');
  end if;
end;
$$;

update users set page_permissions = page_permissions || '["tax-report"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'tax-report');

update users set page_permissions = page_permissions || '["exec-report"]'::jsonb
where (role = 'ADMIN' or role = 'ผู้บริหาร') and not (page_permissions ? 'exec-report');

```

---

### 📄 File: `supabase\phase5i_report_refinements.sql`
```sql
-- ============================================================
-- GoCost — Phase 5i: ปรับปรุงตามที่ขอ
-- รันหลัง phase5h_reports.sql
--
-- 1. get_group_report — ดูยอดของกลุ่ม (แม่) พร้อมยอดแยกตามรหัสบัญชี (ลูก) แต่ละตัว
--    กรองตามเดือน/ปีได้ ใช้ในหน้า "กลุ่มรหัสบัญชี"
-- 2. get_executive_itemized_report — เปลี่ยนเป็นสรุปยอดตามกลุ่มเท่านั้น (ไม่โชว์
--    รายการย่อยระดับใบเสร็จอีกต่อไป) + เพิ่ม filter เดือน
-- 3. get_tax_filing_report — เพิ่มรายการย่อยระดับใบเสร็จในแต่ละรหัสบัญชี (ตรงข้าม
--    กับข้อ 2 — รายงานนี้ต้องแจกแจงละเอียดสำหรับส่งกรมสรรพากร)
-- ============================================================

-- ─────────────────────────────────────────────
-- get_group_report — เช่น "หมวดรายได้ 4000-00" แล้วแจกแจงยอดแต่ละรหัสลูกในกลุ่มนั้น
-- ตาม filter เดือน/ปีที่เลือก (ปีบังคับ, เดือนไม่บังคับ — ไม่เลือกเดือน = ทั้งปี)
-- ─────────────────────────────────────────────
create or replace function get_group_report(p_actor_id text, p_group_id bigint, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group record;
  v_members jsonb := '[]'::jsonb;
  v_group_total numeric := 0;
  a record;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานกลุ่มนี้');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มนี้');
  end if;

  for a in select id, code, name from accounts where group_id = p_group_id order by code loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_members := v_members || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name, 'total', v_account_total
    ));
    v_group_total := v_group_total + v_account_total;
  end loop;

  return jsonb_build_object(
    'success', true,
    'groupCode', v_group.code, 'groupName', v_group.name,
    'year', p_year, 'month', p_month,
    'members', v_members, 'groupTotal', v_group_total
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_executive_itemized_report — เปลี่ยนเป็นสรุปยอดตามกลุ่ม/รหัสบัญชีเท่านั้น
-- (ตัด items[] ระดับใบเสร็จออก) + เพิ่ม p_month — ต้อง drop ก่อนเพราะเปลี่ยน signature
-- ─────────────────────────────────────────────
drop function if exists get_executive_itemized_report(text, int);
create or replace function get_executive_itemized_report(p_actor_id text, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_unassigned_total numeric;
  v_grand_total numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total numeric;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_total := 0;
    for a in select id, code, name from accounts where group_id = g.id order by code loop
      select coalesce(sum(e.total), 0) into v_account_total
      from expense_records e
      where e.account_id = a.id
        and extract(year from e.event_date) = p_year
        and (p_month is null or extract(month from e.event_date) = p_month);

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name, 'total', v_account_total
      ));
      v_group_total := v_group_total + v_account_total;
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'total', v_group_total, 'accounts', v_group_accounts
    ));
    v_grand_total := v_grand_total + v_group_total;
  end loop;

  for a in select id, code, name from accounts where group_id is null order by code loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name, 'total', v_account_total
    ));
    v_grand_total := v_grand_total + v_account_total;
  end loop;

  select coalesce(sum(e.total), 0) into v_unassigned_total
  from expense_records e
  where e.account_id is null and e.main_category <> 'รายได้'
    and extract(year from e.event_date) = p_year
    and (p_month is null or extract(month from e.event_date) = p_month);

  v_grand_total := v_grand_total + v_unassigned_total;

  return jsonb_build_object(
    'success', true, 'year', p_year, 'month', p_month,
    'groups', v_groups,
    'ungroupedAccounts', v_ungrouped,
    'unassignedTotal', v_unassigned_total,
    'grandTotal', v_grand_total
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_tax_filing_report — เพิ่มรายการย่อยระดับใบเสร็จในแต่ละรหัส (แจกแจงละเอียด)
-- ต้อง drop ก่อนเพราะโครงสร้าง jsonb ผลลัพธ์เปลี่ยน (เพิ่ม lines[].items[])
-- ─────────────────────────────────────────────
drop function if exists get_tax_filing_report(text, int);
create or replace function get_tax_filing_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_revenue numeric := 0;
  v_by_category jsonb := '[]'::jsonb;
  v_net numeric := 0;
  cat record;
  acct record;
  v_items jsonb;
  v_acct_total numeric;
  v_lines jsonb;
  v_cat_total numeric;
begin
  if not has_page_permission(p_actor_id, 'tax-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  select coalesce(sum(sales_push_amount), 0) into v_total_revenue
  from workshop_plans where status = 'completed' and extract(year from planned_date) = p_year;

  for cat in
    select distinct a.category from accounts a
    join expense_records e on e.account_id = a.id
    where extract(year from e.event_date) = p_year
    order by a.category
  loop
    v_lines := '[]'::jsonb;
    v_cat_total := 0;

    for acct in
      select distinct a.id, a.code, a.name from accounts a
      join expense_records e on e.account_id = a.id
      where a.category = cat.category and extract(year from e.event_date) = p_year
      order by a.code
    loop
      select coalesce(jsonb_agg(jsonb_build_object(
               'docNumber', e.doc_number, 'eventDate', e.event_date, 'storeName', e.store_name,
               'detail', e.detail, 'qty', e.qty, 'unitPrice', e.unit_price, 'total', e.total
             ) order by e.event_date), '[]'::jsonb),
             coalesce(sum(e.total), 0)
      into v_items, v_acct_total
      from expense_records e
      where e.account_id = acct.id and extract(year from e.event_date) = p_year;

      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'code', acct.code, 'name', acct.name, 'total', v_acct_total, 'items', v_items
      ));
      v_cat_total := v_cat_total + v_acct_total;
    end loop;

    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', cat.category, 'total', v_cat_total, 'lines', v_lines
    ));
  end loop;

  select coalesce(sum(e.total), 0) into v_net
  from expense_records e
  where e.account_id is not null and extract(year from e.event_date) = p_year;

  return jsonb_build_object(
    'success', true, 'year', p_year,
    'totalRevenue', v_total_revenue,
    'totalExpenses', v_net,
    'netIncome', v_total_revenue - v_net,
    'byCategory', v_by_category
  );
end;
$$;

```

---

### 📄 File: `supabase\phase5j_account_file_import.sql`
```sql
-- ============================================================
-- GoCost — Phase 5j: แนบไฟล์งบทดลอง + ไฟล์รายจ่ายจริง (2 ประเภทแยกกัน)
-- รันหลัง phase5i_report_refinements.sql
--
-- หลักการความปลอดภัยของข้อมูล (เพราะยอดนี้สำคัญมาก ห้ามผิดพลาด):
-- นำเข้าแบบ "ทั้งหมดหรือไม่มีเลย" (all-or-nothing) — ถ้าไฟล์มีรหัสบัญชีที่ยังไม่มี
-- ในระบบแม้แต่ 1 รหัส จะปฏิเสธการนำเข้าทั้งไฟล์ทันที ไม่นำเข้าบางส่วน เพื่อกัน
-- ข้อมูลครึ่งๆ กลางๆ เข้าระบบ — ต้องไปเพิ่มรหัสที่ขาดในหน้า "จัดการรหัสบัญชี" ก่อน
-- แล้วค่อยอัปโหลดไฟล์ซ้ำ
--
-- ⚠️ หมายเหตุสำคัญ: ยอดที่นำเข้าจากไฟล์เหล่านี้ ตอนนี้เก็บไว้เป็น "ข้อมูลอ้างอิง
-- แยกต่างหาก" (account_import_lines) ยังไม่ถูกผสมรวมเข้ากับยอดใน 2 หน้ารายงานหลัก
-- (รายงานผู้บริหาร / รายงานกรมสรรพากร ที่ดึงจาก expense_records ที่พนักงานกรอกเอง)
-- เพราะยังไม่ได้ตกลงกันว่าจะ "รวม" หรือ "ใช้เทียบ" กันยังไงให้ไม่ซ้ำซ้อน/ไม่ผิดพลาด
-- — ให้แจ้งมาว่าต้องการให้ 2 แหล่งข้อมูลนี้สัมพันธ์กันแบบไหน จะต่อให้ครบในเฟสถัดไป
-- ============================================================

create table if not exists account_import_batches (
  id          bigint generated always as identity primary key,
  batch_type  text not null check (batch_type in ('trial_balance', 'expense_file')),
  year        int not null,
  month       int,              -- null ได้สำหรับงบทดลองที่เป็นยอดสะสมทั้งปี
  file_name   text,
  uploaded_by text references users(id),
  uploaded_at timestamptz not null default now()
);

create table if not exists account_import_lines (
  id          bigint generated always as identity primary key,
  batch_id    bigint not null references account_import_batches(id) on delete cascade,
  account_id  bigint not null references accounts(id),
  code        text not null,     -- เก็บรหัสดิบจากไฟล์ไว้ด้วย เผื่อเทียบย้อนหลัง
  amount      numeric not null,
  description text
);

create index if not exists idx_import_lines_batch on account_import_lines(batch_id);
create index if not exists idx_import_lines_account on account_import_lines(account_id);

alter table account_import_batches enable row level security;
alter table account_import_lines enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ─────────────────────────────────────────────
-- check_import_rows — เช็คว่ารหัสในไฟล์ที่แนบตรงกับผังบัญชีครบไหม ก่อนจะให้ยืนยัน
-- นำเข้าจริง (ไม่ insert อะไรในขั้นนี้ แค่ตรวจสอบ)
-- ─────────────────────────────────────────────
create or replace function check_import_rows(p_actor_id text, p_rows jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_row jsonb;
  v_code text;
  v_matched jsonb := '[]'::jsonb;
  v_unmatched jsonb := '[]'::jsonb;
  v_account_id bigint;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์นำเข้าไฟล์บัญชี');
  end if;

  for v_row in select * from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    v_code := nullif(trim(v_row->>'code'), '');
    if v_code is null then continue; end if;

    select id into v_account_id from accounts where code = v_code;
    if v_account_id is null then
      v_unmatched := v_unmatched || jsonb_build_array(v_row);
    else
      v_matched := v_matched || jsonb_build_array(v_row || jsonb_build_object('accountId', v_account_id));
    end if;
  end loop;

  return jsonb_build_object('success', true, 'matched', v_matched, 'unmatched', v_unmatched);
end;
$$;

-- ─────────────────────────────────────────────
-- import_account_file — นำเข้าจริงแบบ all-or-nothing (ต้องเช็ค check_import_rows
-- ผ่านหมดก่อนแล้วเท่านั้นถึงจะเรียกตัวนี้ได้ — ถ้ายังมี unmatched อยู่จะปฏิเสธ)
-- ─────────────────────────────────────────────
create or replace function import_account_file(
  p_actor_id text, p_batch_type text, p_year int, p_month int, p_file_name text, p_rows jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_batch_id bigint;
  v_row jsonb;
  v_code text;
  v_account_id bigint;
  v_count int := 0;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์นำเข้าไฟล์บัญชี');
  end if;
  if p_batch_type not in ('trial_balance', 'expense_file') then
    return jsonb_build_object('success', false, 'message', 'ประเภทไฟล์ไม่ถูกต้อง');
  end if;
  if p_rows is null or jsonb_array_length(p_rows) = 0 then
    return jsonb_build_object('success', false, 'message', 'ไม่มีข้อมูลให้นำเข้า');
  end if;

  -- ตรวจซ้ำอีกครั้งฝั่ง server ว่าทุกรหัสมีอยู่จริง (ห้ามเชื่อฝั่ง client อย่างเดียว)
  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := nullif(trim(v_row->>'code'), '');
    if v_code is null or not exists (select 1 from accounts where code = v_code) then
      return jsonb_build_object('success', false, 'message',
        format('รหัสบัญชี %s ไม่มีในระบบ กรุณาเพิ่มในหน้า "จัดการรหัสบัญชี" ก่อน แล้วนำเข้าใหม่', coalesce(v_code, '(ว่าง)')));
    end if;
  end loop;

  insert into account_import_batches (batch_type, year, month, file_name, uploaded_by)
  values (p_batch_type, p_year, p_month, p_file_name, p_actor_id)
  returning id into v_batch_id;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := trim(v_row->>'code');
    select id into v_account_id from accounts where code = v_code;
    insert into account_import_lines (batch_id, account_id, code, amount, description)
    values (v_batch_id, v_account_id, v_code, (v_row->>'amount')::numeric, nullif(trim(coalesce(v_row->>'description', '')), ''));
    v_count := v_count + 1;
  end loop;

  perform write_audit_log(p_actor_id, 'IMPORT_ACCOUNT_FILE', 'AccountImport',
    format('นำเข้าไฟล์%s (%s) %s รายการ ปี %s%s',
      case p_batch_type when 'trial_balance' then 'งบทดลอง' else 'รายจ่าย' end,
      coalesce(p_file_name, '(ไม่ทราบชื่อไฟล์)'), v_count, p_year,
      case when p_month is not null then format(' เดือน %s', p_month) else '' end));

  return jsonb_build_object('success', true, 'message', format('นำเข้าสำเร็จ %s รายการ', v_count), 'batchId', v_batch_id, 'imported', v_count);
end;
$$;

-- ─────────────────────────────────────────────
-- get_import_batches — ดูประวัติการนำเข้าไฟล์งบทดลอง/รายจ่าย แยกตามประเภท
-- ─────────────────────────────────────────────
create or replace function get_import_batches(p_actor_id text, p_batch_type text default null)
returns table (
  id bigint, batch_type text, year int, month int, file_name text,
  uploaded_by text, uploaded_by_name text, uploaded_at timestamptz, line_count bigint, total_amount numeric
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    raise exception 'คุณไม่มีสิทธิ์ดูประวัติการนำเข้าไฟล์บัญชี';
  end if;

  return query
  select b.id, b.batch_type, b.year, b.month, b.file_name, b.uploaded_by, u.name,
         b.uploaded_at, count(l.id), coalesce(sum(l.amount), 0)
  from account_import_batches b
  left join users u on u.id = b.uploaded_by
  left join account_import_lines l on l.batch_id = b.id
  where p_batch_type is null or b.batch_type = p_batch_type
  group by b.id, u.name
  order by b.uploaded_at desc
  limit 100;
end;
$$;

-- ─────────────────────────────────────────────
-- get_import_batch_detail — ดูรายละเอียดรายบรรทัดของไฟล์ที่นำเข้าไปแล้ว 1 ไฟล์
-- ─────────────────────────────────────────────
create or replace function get_import_batch_detail(p_actor_id text, p_batch_id bigint)
returns table (code text, name text, amount numeric, description text)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายละเอียดการนำเข้า';
  end if;

  return query
  select l.code, a.name, l.amount, l.description
  from account_import_lines l
  join accounts a on a.id = l.account_id
  where l.batch_id = p_batch_id
  order by l.code;
end;
$$;

-- ─────────────────────────────────────────────
-- default permission: 'account-import' — ADMIN เท่านั้น default (แนบไฟล์บัญชี
-- เป็นงานละเอียดอ่อน ให้ ADMIN มอบสิทธิ์เองถ้าต้องการให้หัวหน้าบัญชีทำได้)
-- ─────────────────────────────────────────────
update users set page_permissions = page_permissions || '["account-import"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'account-import');

```

---

### 📄 File: `supabase\phase5k_reconciliation.sql`
```sql
-- ============================================================
-- GoCost — Phase 5k: เทียบยอด (Reconciliation) — โชว์ผลต่างระหว่าง 2 แหล่งข้อมูล
-- รันหลัง phase5j_account_file_import.sql
--
-- เปรียบเทียบ "ยอดที่พนักงานกรอกเอง" (expense_records.account_id) กับ
-- "ยอดจากไฟล์ที่แนบ" (account_import_lines จากไฟล์รายจ่ายจริง) ต่อรหัสบัญชี
-- ตามช่วงเวลาที่เลือก แสดงผลต่างให้เห็นชัดเจน ไม่ได้รวม/แทนที่กัน ยังเป็นข้อมูล
-- 2 แหล่งแยกกันเหมือนเดิม แค่เอามาเทียบข้างกันให้ดูง่ายขึ้น
-- ============================================================

create or replace function get_reconciliation_report(p_actor_id text, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_rows jsonb := '[]'::jsonb;
  a record;
  v_staff_amount numeric;
  v_file_amount numeric;
begin
  if not has_page_permission(p_actor_id, 'reconciliation') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานเทียบยอด');
  end if;

  for a in
    select distinct a.id, a.code, a.name
    from accounts a
    where exists (
      select 1 from expense_records e where e.account_id = a.id
        and extract(year from e.event_date) = p_year
        and (p_month is null or extract(month from e.event_date) = p_month)
    ) or exists (
      select 1 from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id and b.batch_type = 'expense_file' and b.year = p_year
        and (p_month is null or b.month = p_month or b.month is null)
    )
    order by a.code
  loop
    select coalesce(sum(e.total), 0) into v_staff_amount
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    select coalesce(sum(l.amount), 0) into v_file_amount
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id and b.batch_type = 'expense_file' and b.year = p_year
      and (p_month is null or b.month = p_month or b.month is null);

    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name,
      'staffAmount', v_staff_amount, 'fileAmount', v_file_amount,
      'diff', v_file_amount - v_staff_amount
    ));
  end loop;

  return jsonb_build_object('success', true, 'year', p_year, 'month', p_month, 'rows', v_rows);
end;
$$;

-- default permission: 'reconciliation' — ADMIN เท่านั้น default
update users set page_permissions = page_permissions || '["reconciliation"]'::jsonb
where role = 'ADMIN' and not (page_permissions ? 'reconciliation');

```

---

### 📄 File: `supabase\phase5l_group_splits.sql`
```sql
-- ============================================================
-- GoCost — Phase 5l: รองรับรหัสบัญชี 1 ตัวแบ่งสัดส่วนอยู่หลายกลุ่มได้
-- รันหลัง phase5k_reconciliation.sql
--
-- เปลี่ยนจาก accounts.group_id (1 รหัส = 1 กลุ่มเท่านั้น) เป็นตาราง
-- account_group_splits (1 รหัส = หลายกลุ่ม พร้อมสัดส่วน % ของแต่ละกลุ่ม)
-- ตัวอย่างจริงจากไฟล์ P&L: รหัส 6120-14 แบ่ง 1/3 ให้กลุ่มขาย, 2/3 ให้กลุ่มบริหาร
--
-- กติกาความถูกต้อง (ยอดสำคัญมาก ห้ามผิดพลาด):
-- - สัดส่วนรวมของ 1 รหัสบัญชี ต้องไม่เกิน 100% (ระบบเช็คให้ทุกครั้งที่แก้ไข)
-- - ถ้ารหัสบัญชีมีสัดส่วนไม่ครบ 100% ส่วนที่เหลือจะถูกแยกโชว์เป็น "ยังไม่ได้จัดสรร
--   บางส่วน" ในรายงาน ไม่ปัดตกหายไปเงียบๆ เพื่อให้ยอดรวมทั้งหมดตรงกับความเป็นจริงเสมอ
-- ============================================================

create table if not exists account_group_splits (
  id         bigint generated always as identity primary key,
  account_id bigint not null references accounts(id) on delete cascade,
  group_id   bigint not null references account_groups(id) on delete cascade,
  fraction   numeric not null check (fraction > 0 and fraction <= 1),
  unique (account_id, group_id)
);

alter table account_group_splits enable row level security;
-- ไม่สร้าง policy ให้ client ตรงๆ เหมือนตารางอื่นทั้งหมด — เข้าถึงผ่าน RPC เท่านั้น

-- ย้ายข้อมูลเดิมจาก accounts.group_id (1:1) มาเป็น split แบบ 100% ให้อัตโนมัติ
insert into account_group_splits (account_id, group_id, fraction)
select id, group_id, 1.0 from accounts where group_id is not null
on conflict (account_id, group_id) do nothing;

-- ─────────────────────────────────────────────
-- set_account_group_split — เพิ่ม/แก้ไขสัดส่วนของรหัสบัญชีหนึ่งตัวในกลุ่มหนึ่ง
-- ─────────────────────────────────────────────
create or replace function set_account_group_split(
  p_actor_id text, p_account_id bigint, p_group_id bigint, p_fraction numeric
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_existing_total numeric;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการกลุ่มรหัสบัญชี');
  end if;
  if p_fraction is null or p_fraction <= 0 or p_fraction > 1 then
    return jsonb_build_object('success', false, 'message', 'สัดส่วนต้องมากกว่า 0% และไม่เกิน 100%');
  end if;

  select coalesce(sum(fraction), 0) into v_existing_total
  from account_group_splits
  where account_id = p_account_id and group_id <> p_group_id;

  if v_existing_total + p_fraction > 1.0001 then
    return jsonb_build_object('success', false, 'message',
      format('สัดส่วนรวมเกิน 100%% — รหัสนี้ถูกจัดสรรไปแล้ว %s%% ในกลุ่มอื่น เหลือให้ใส่ได้ไม่เกิน %s%%',
        round(v_existing_total * 100, 1), round((1 - v_existing_total) * 100, 1)));
  end if;

  insert into account_group_splits (account_id, group_id, fraction)
  values (p_account_id, p_group_id, p_fraction)
  on conflict (account_id, group_id) do update set fraction = excluded.fraction;

  perform write_audit_log(p_actor_id, 'SET_ACCOUNT_GROUP_SPLIT', 'AccountGroups',
    format('รหัสบัญชี id %s → กลุ่ม id %s สัดส่วน %s%%', p_account_id, p_group_id, round(p_fraction * 100, 1)));

  return jsonb_build_object('success', true, 'message', 'บันทึกสัดส่วนสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- remove_account_group_split — เอารหัสบัญชีออกจากกลุ่มหนึ่ง (ลบ split เฉพาะคู่นี้)
-- ─────────────────────────────────────────────
create or replace function remove_account_group_split(p_actor_id text, p_account_id bigint, p_group_id bigint)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์จัดการกลุ่มรหัสบัญชี');
  end if;

  delete from account_group_splits where account_id = p_account_id and group_id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบข้อมูลนี้');
  end if;

  perform write_audit_log(p_actor_id, 'REMOVE_ACCOUNT_GROUP_SPLIT', 'AccountGroups',
    format('เอารหัสบัญชี id %s ออกจากกลุ่ม id %s', p_account_id, p_group_id));

  return jsonb_build_object('success', true, 'message', 'เอาออกจากกลุ่มสำเร็จ');
end;
$$;

-- ─────────────────────────────────────────────
-- get_group_members — เปลี่ยนเป็นแสดงสัดส่วน (fraction) ของแต่ละสมาชิก + โชว์
-- % ที่ถูกจัดสรรไปแล้วในกลุ่มอื่นของรหัสที่ยังไม่ได้อยู่ในกลุ่มนี้
-- ─────────────────────────────────────────────
drop function if exists get_group_members(text, bigint);
create or replace function get_group_members(p_actor_id text, p_group_id bigint)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_members jsonb;
  v_available jsonb;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูกลุ่มรหัสบัญชี');
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'code', a.code, 'name', a.name, 'fraction', s.fraction
         ) order by a.code), '[]'::jsonb)
  into v_members
  from account_group_splits s
  join accounts a on a.id = s.account_id
  where s.group_id = p_group_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'id', a.id, 'code', a.code, 'name', a.name,
           'allocatedElsewhere', coalesce(other.total_fraction, 0)
         ) order by a.code), '[]'::jsonb)
  into v_available
  from accounts a
  left join (
    select account_id, sum(fraction) as total_fraction
    from account_group_splits
    group by account_id
  ) other on other.account_id = a.id
  where not exists (
    select 1 from account_group_splits s2 where s2.account_id = a.id and s2.group_id = p_group_id
  );

  return jsonb_build_object('success', true, 'members', v_members, 'available', v_available);
end;
$$;

-- ─────────────────────────────────────────────
-- get_accounts — เปลี่ยนคอลัมน์ group_id/group_name เดี่ยว เป็น groups[] (array
-- ของกลุ่มที่รหัสนี้ถูกจัดสรรอยู่ พร้อมสัดส่วน)
-- ─────────────────────────────────────────────
drop function if exists get_accounts(text, text);
create or replace function get_accounts(p_actor_id text, p_query text default null)
returns table (
  id bigint, code text, name text, category text, description text,
  groups jsonb, created_at timestamptz, updated_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'accounts') then
    raise exception 'คุณไม่มีสิทธิ์ดูรหัสบัญชี';
  end if;

  return query
  select a.id, a.code, a.name, a.category, a.description,
         coalesce((
           select jsonb_agg(jsonb_build_object('groupId', g.id, 'code', g.code, 'name', g.name, 'fraction', s.fraction) order by g.code)
           from account_group_splits s join account_groups g on g.id = s.group_id
           where s.account_id = a.id
         ), '[]'::jsonb) as groups,
         a.created_at, a.updated_at
  from accounts a
  where p_query is null or trim(p_query) = ''
     or a.code ilike '%' || p_query || '%'
     or a.name ilike '%' || p_query || '%'
     or a.category ilike '%' || p_query || '%'
  order by a.code;
end;
$$;

-- ─────────────────────────────────────────────
-- get_group_report — คูณยอดจริงของแต่ละรหัสด้วยสัดส่วน (fraction) ก่อนรวมเป็นยอดกลุ่ม
-- ─────────────────────────────────────────────
create or replace function get_group_report(p_actor_id text, p_group_id bigint, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group record;
  v_members jsonb := '[]'::jsonb;
  v_group_total numeric := 0;
  m record;
  v_account_total numeric;
  v_allocated numeric;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานกลุ่มนี้');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มนี้');
  end if;

  for m in
    select a.id, a.code, a.name, s.fraction
    from account_group_splits s join accounts a on a.id = s.account_id
    where s.group_id = p_group_id order by a.code
  loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = m.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_allocated := v_account_total * m.fraction;

    v_members := v_members || jsonb_build_array(jsonb_build_object(
      'code', m.code, 'name', m.name, 'fraction', m.fraction,
      'accountTotal', v_account_total, 'allocatedTotal', v_allocated
    ));
    v_group_total := v_group_total + v_allocated;
  end loop;

  return jsonb_build_object(
    'success', true,
    'groupCode', v_group.code, 'groupName', v_group.name,
    'year', p_year, 'month', p_month,
    'members', v_members, 'groupTotal', v_group_total
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_executive_itemized_report — fraction-weighting + แยกโชว์ "ยังไม่ได้จัดสรร
-- บางส่วน" ของรหัสที่สัดส่วนรวมไม่ถึง 100% เพื่อให้ grandTotal ตรงกับยอดใช้จ่ายจริง
-- ทั้งหมดเสมอ
-- ─────────────────────────────────────────────
create or replace function get_executive_itemized_report(p_actor_id text, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_partial jsonb := '[]'::jsonb;
  v_unassigned_total numeric;
  v_grand_total numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total numeric;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_total := 0;
    for a in
      select acc.id, acc.code, acc.name, s.fraction
      from account_group_splits s join accounts acc on acc.id = s.account_id
      where s.group_id = g.id order by acc.code
    loop
      select coalesce(sum(e.total), 0) into v_account_total
      from expense_records e
      where e.account_id = a.id
        and extract(year from e.event_date) = p_year
        and (p_month is null or extract(month from e.event_date) = p_month);

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name, 'fraction', a.fraction, 'total', v_account_total * a.fraction
      ));
      v_group_total := v_group_total + (v_account_total * a.fraction);
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'total', v_group_total, 'accounts', v_group_accounts
    ));
    v_grand_total := v_grand_total + v_group_total;
  end loop;

  for a in
    select acc.id, acc.code, acc.name from accounts acc
    where not exists (select 1 from account_group_splits s where s.account_id = acc.id)
    order by acc.code
  loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object('code', a.code, 'name', a.name, 'total', v_account_total));
    v_grand_total := v_grand_total + v_account_total;
  end loop;

  for a in
    select acc.id, acc.code, acc.name, sum(s.fraction) as total_fraction
    from account_group_splits s join accounts acc on acc.id = s.account_id
    group by acc.id, acc.code, acc.name
    having sum(s.fraction) < 0.9999
    order by acc.code
  loop
    select coalesce(sum(e.total), 0) into v_account_total
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    v_partial := v_partial || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name,
      'allocatedFraction', a.total_fraction,
      'unallocatedTotal', v_account_total * (1 - a.total_fraction)
    ));
    v_grand_total := v_grand_total + (v_account_total * (1 - a.total_fraction));
  end loop;

  select coalesce(sum(e.total), 0) into v_unassigned_total
  from expense_records e
  where e.account_id is null and e.main_category <> 'รายได้'
    and extract(year from e.event_date) = p_year
    and (p_month is null or extract(month from e.event_date) = p_month);

  v_grand_total := v_grand_total + v_unassigned_total;

  return jsonb_build_object(
    'success', true, 'year', p_year, 'month', p_month,
    'groups', v_groups,
    'ungroupedAccounts', v_ungrouped,
    'partialAccounts', v_partial,
    'unassignedTotal', v_unassigned_total,
    'grandTotal', v_grand_total
  );
end;
$$;

```

---

### 📄 File: `supabase\phase5m_group_seed_from_pl.sql`
```sql
-- ============================================================
-- GoCost — Phase 5m: นำเข้าโครงสร้างกลุ่มจริงจากไฟล์ P&L ที่ส่งมา
-- (16 กลุ่ม, 86 การจัดสรรรหัสบัญชี รวมรหัส 6120-14 ที่แบ่ง 1/3+2/3)
-- รันหลัง phase5l_group_splits.sql
-- ============================================================

-- 1) สร้างกลุ่มทั้ง 16 กลุ่ม
insert into account_groups (code, name) values ('GRP-01', 'รายได้') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-02', 'ต้นทุนในการขาย') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-03', 'ค่าใช้จ่ายในการขาย/ฝ่ายขาย/PC') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-04', 'ค่าใช้จ่ายในการขาย/ส่งเสริมการขาย') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-05', 'ค่าใช้จ่ายในการขาย/ค่าขนส่ง/เดินทาง') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-06', 'ค่าใช้จ่ายในการขาย/แพลตฟอร์ม') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-07', 'ค่าใช้จ่ายในการบริหาร') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-08', 'สวัสดิการ') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-09', 'ค่าเครื่องเขียน/วัสดุสิ้นเปลือง/ค่าซ่อมแซม') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-10', 'ค่าบริการ/ค่าจ้าง') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-11', 'ค่าเช่า') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-12', 'ค่าสาธารณูปโภค') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-13', 'ค่าเบี้ยประกัน/ธรรมเนียมต่างๆ') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-14', 'อื่นๆ') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-15', 'ค่าดอกเบี้ย') on conflict (code) do nothing;
insert into account_groups (code, name) values ('GRP-16', 'อื่นๆ/ไม่ถือเป็นรายจ่ายจริง') on conflict (code) do nothing;

-- 2) จัดสรรรหัสบัญชีเข้ากลุ่ม (100% ต่อรหัส ยกเว้น 6120-14 ที่แบ่งสัดส่วน)
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '4100-01' and g.code = 'GRP-01' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '4100-05' and g.code = 'GRP-01' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '4200-08' and g.code = 'GRP-01' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '4100-03' and g.code = 'GRP-01' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '4100-04' and g.code = 'GRP-01' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '5130-02' and g.code = 'GRP-01' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '5130-04' and g.code = 'GRP-02' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '5130-06' and g.code = 'GRP-02' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '5130-07' and g.code = 'GRP-02' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '5130-12' and g.code = 'GRP-02' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '5130-08' and g.code = 'GRP-03' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-01' and g.code = 'GRP-03' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6110-03' and g.code = 'GRP-03' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6110-08' and g.code = 'GRP-03' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-26' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-02' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-03' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-04' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-27' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-28' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-29' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-30' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-31' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-14' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-15' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-16' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-13' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-23' and g.code = 'GRP-04' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-05' and g.code = 'GRP-05' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-09' and g.code = 'GRP-05' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-11' and g.code = 'GRP-05' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-12' and g.code = 'GRP-05' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6001-01' and g.code = 'GRP-05' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6001-02' and g.code = 'GRP-05' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6001-03' and g.code = 'GRP-05' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6001-04' and g.code = 'GRP-05' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6130-04' and g.code = 'GRP-05' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-17' and g.code = 'GRP-06' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-19' and g.code = 'GRP-06' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-20' and g.code = 'GRP-06' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-22' and g.code = 'GRP-06' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-24' and g.code = 'GRP-06' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6110-01' and g.code = 'GRP-07' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6110-19' and g.code = 'GRP-07' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6110-02' and g.code = 'GRP-07' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6110-04' and g.code = 'GRP-07' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6110-05' and g.code = 'GRP-07' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6110-09' and g.code = 'GRP-07' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6110-10' and g.code = 'GRP-07' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6100-12' and g.code = 'GRP-08' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6110-17' and g.code = 'GRP-08' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6000-06' and g.code = 'GRP-08' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-01' and g.code = 'GRP-09' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-02' and g.code = 'GRP-09' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-03' and g.code = 'GRP-09' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-08' and g.code = 'GRP-09' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-09' and g.code = 'GRP-09' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-10' and g.code = 'GRP-09' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-12' and g.code = 'GRP-10' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-13' and g.code = 'GRP-10' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-18' and g.code = 'GRP-10' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-15' and g.code = 'GRP-10' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-16' and g.code = 'GRP-11' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6120-17' and g.code = 'GRP-11' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6130-01' and g.code = 'GRP-12' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6130-02' and g.code = 'GRP-12' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6130-03' and g.code = 'GRP-12' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6130-06' and g.code = 'GRP-12' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6130-05' and g.code = 'GRP-13' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6150-04' and g.code = 'GRP-13' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6150-05' and g.code = 'GRP-13' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6160-01' and g.code = 'GRP-13' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6160-02' and g.code = 'GRP-13' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6160-04' and g.code = 'GRP-13' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6160-07' and g.code = 'GRP-13' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6170-04' and g.code = 'GRP-13' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6170-06' and g.code = 'GRP-14' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6170-01' and g.code = 'GRP-15' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6170-09' and g.code = 'GRP-15' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6170-08' and g.code = 'GRP-16' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6190-01' and g.code = 'GRP-16' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6190-02' and g.code = 'GRP-16' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6190-03' and g.code = 'GRP-16' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 1.0 from accounts a, account_groups g where a.code = '6190-04' and g.code = 'GRP-16' on conflict (account_id, group_id) do update set fraction = excluded.fraction;

-- 3) รหัส 6120-14 — แบ่งสัดส่วนตามไฟล์จริง (1/3 ฝ่ายขาย/PC, 2/3 บริหาร)
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 0.3333333333 from accounts a, account_groups g where a.code = '6120-14' and g.code = 'GRP-03' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
insert into account_group_splits (account_id, group_id, fraction) select a.id, g.id, 0.6666666667 from accounts a, account_groups g where a.code = '6120-14' and g.code = 'GRP-07' on conflict (account_id, group_id) do update set fraction = excluded.fraction;
```

---

### 📄 File: `supabase\phase5n_revert_auto_groups.sql`
```sql
-- ============================================================
-- GoCost — Phase 5n: ลบกลุ่มที่สร้างอัตโนมัติในเฟส 5m ทั้งหมด
-- รันหลัง phase5m_group_seed_from_pl.sql
--
-- ตามที่ขอ — ลบกลุ่ม GRP-01 ถึง GRP-16 และการจัดสรรทั้งหมดที่มาพร้อมกัน
-- (account_group_splits ลบตามอัตโนมัติด้วย on delete cascade) ระบบเพิ่ม/แก้ไข/ลบ
-- กลุ่มและ assign รหัสบัญชีเข้ากลุ่มยังใช้งานได้ปกติทุกอย่างที่หน้า "กลุ่มรหัสบัญชี"
-- — แค่ไม่มีข้อมูลตั้งต้นแล้ว ให้สร้างเองทั้งหมด
-- ============================================================

delete from account_groups where code like 'GRP-%';

```

---

### 📄 File: `supabase\phase5o_pl_file_import.sql`
```sql
-- ============================================================
-- GoCost — Phase 5o: แนบไฟล์เหลือแบบเดียว "ประมาณการกำไรขาดทุน" (หลายเดือนในไฟล์เดียว)
-- รันหลัง phase5n_revert_auto_groups.sql
--
-- แทนที่ดีไซน์เดิม (งบทดลอง + ไฟล์รายจ่าย แยก 2 ประเภท, 1 batch = 1 เดือน)
-- ด้วยไฟล์เดียวที่หัวหน้าฝ่ายบัญชีอัปโหลด ซึ่งมีข้อมูลหลายเดือนในไฟล์เดียว
-- (คอลัมน์เดือน ม.ค., ก.พ., ... ในชีตเดียว) — เก็บเดือนไว้ที่ระดับ "บรรทัด" แทน
-- ระดับ "ไฟล์" เพื่อรองรับหลายเดือนต่อการอัปโหลด 1 ครั้ง
-- ============================================================

alter table account_import_lines add column if not exists month int;

alter table account_import_batches drop constraint if exists account_import_batches_batch_type_check;
alter table account_import_batches add constraint account_import_batches_batch_type_check
  check (batch_type in ('trial_balance', 'expense_file', 'pl_estimate'));

-- ─────────────────────────────────────────────
-- import_account_file — รองรับหลายเดือนต่อไฟล์: แต่ละแถวใน p_rows มี month ของ
-- ตัวเอง (ไม่ใช้ p_month ระดับไฟล์อีกต่อไป) — ต้อง drop ก่อนเพราะเปลี่ยน signature
-- ─────────────────────────────────────────────
drop function if exists import_account_file(text, text, int, int, text, jsonb);
create or replace function import_account_file(
  p_actor_id text, p_batch_type text, p_year int, p_file_name text, p_rows jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_batch_id bigint;
  v_row jsonb;
  v_code text;
  v_account_id bigint;
  v_count int := 0;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์นำเข้าไฟล์บัญชี');
  end if;
  if p_batch_type not in ('trial_balance', 'expense_file', 'pl_estimate') then
    return jsonb_build_object('success', false, 'message', 'ประเภทไฟล์ไม่ถูกต้อง');
  end if;
  if p_rows is null or jsonb_array_length(p_rows) = 0 then
    return jsonb_build_object('success', false, 'message', 'ไม่มีข้อมูลให้นำเข้า');
  end if;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := nullif(trim(v_row->>'code'), '');
    if v_code is null or not exists (select 1 from accounts where code = v_code) then
      return jsonb_build_object('success', false, 'message',
        format('รหัสบัญชี %s ไม่มีในระบบ กรุณาเพิ่มในหน้า "จัดการรหัสบัญชี" ก่อน แล้วนำเข้าใหม่', coalesce(v_code, '(ว่าง)')));
    end if;
  end loop;

  insert into account_import_batches (batch_type, year, month, file_name, uploaded_by)
  values (p_batch_type, p_year, null, p_file_name, p_actor_id)
  returning id into v_batch_id;

  for v_row in select * from jsonb_array_elements(p_rows) loop
    v_code := trim(v_row->>'code');
    select id into v_account_id from accounts where code = v_code;
    insert into account_import_lines (batch_id, account_id, code, amount, month, description)
    values (
      v_batch_id, v_account_id, v_code, (v_row->>'amount')::numeric,
      nullif(v_row->>'month', '')::int,
      nullif(trim(coalesce(v_row->>'description', '')), '')
    );
    v_count := v_count + 1;
  end loop;

  perform write_audit_log(p_actor_id, 'IMPORT_ACCOUNT_FILE', 'AccountImport',
    format('นำเข้าไฟล์ประมาณการกำไรขาดทุน (%s) %s รายการ ปี %s',
      coalesce(p_file_name, '(ไม่ทราบชื่อไฟล์)'), v_count, p_year));

  return jsonb_build_object('success', true, 'message', format('นำเข้าสำเร็จ %s รายการ', v_count), 'batchId', v_batch_id, 'imported', v_count);
end;
$$;

-- ─────────────────────────────────────────────
-- get_import_batches — เปลี่ยนให้โชว์ช่วงเดือนที่มีข้อมูล (min-max month ของ line
-- ในนั้น) แทน month ระดับไฟล์เดี่ยว
-- ─────────────────────────────────────────────
drop function if exists get_import_batches(text, text);
create or replace function get_import_batches(p_actor_id text, p_batch_type text default null)
returns table (
  id bigint, batch_type text, year int, month_range text, file_name text,
  uploaded_by text, uploaded_by_name text, uploaded_at timestamptz, line_count bigint, total_amount numeric
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    raise exception 'คุณไม่มีสิทธิ์ดูประวัติการนำเข้าไฟล์บัญชี';
  end if;

  return query
  select b.id, b.batch_type, b.year,
         case when min(l.month) is null then '-'
              when min(l.month) = max(l.month) then min(l.month)::text
              else min(l.month)::text || '-' || max(l.month)::text end,
         b.file_name, b.uploaded_by, u.name,
         b.uploaded_at, count(l.id), coalesce(sum(l.amount), 0)
  from account_import_batches b
  left join users u on u.id = b.uploaded_by
  left join account_import_lines l on l.batch_id = b.id
  where p_batch_type is null or b.batch_type = p_batch_type
  group by b.id, u.name
  order by b.uploaded_at desc
  limit 100;
end;
$$;

-- ─────────────────────────────────────────────
-- get_reconciliation_report — อัปเดตให้ดึงยอดจากไฟล์ตาม month ระดับ line แทน
-- batch.month (logic เปลี่ยน แม้ signature เดิม)
-- ─────────────────────────────────────────────
create or replace function get_reconciliation_report(p_actor_id text, p_year int, p_month int default null)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_rows jsonb := '[]'::jsonb;
  a record;
  v_staff_amount numeric;
  v_file_amount numeric;
begin
  if not has_page_permission(p_actor_id, 'reconciliation') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานเทียบยอด');
  end if;

  for a in
    select distinct a.id, a.code, a.name
    from accounts a
    where exists (
      select 1 from expense_records e where e.account_id = a.id
        and extract(year from e.event_date) = p_year
        and (p_month is null or extract(month from e.event_date) = p_month)
    ) or exists (
      select 1 from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id and b.year = p_year
        and (p_month is null or l.month = p_month)
    )
    order by a.code
  loop
    select coalesce(sum(e.total), 0) into v_staff_amount
    from expense_records e
    where e.account_id = a.id
      and extract(year from e.event_date) = p_year
      and (p_month is null or extract(month from e.event_date) = p_month);

    select coalesce(sum(l.amount), 0) into v_file_amount
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id and b.year = p_year
      and (p_month is null or l.month = p_month);

    v_rows := v_rows || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name,
      'staffAmount', v_staff_amount, 'fileAmount', v_file_amount,
      'diff', v_file_amount - v_staff_amount
    ));
  end loop;

  return jsonb_build_object('success', true, 'year', p_year, 'month', p_month, 'rows', v_rows);
end;
$$;

```

---

### 📄 File: `supabase\phase5p_pl_as_main_source.sql`
```sql
﻿-- ============================================================
-- GoCost — Phase 5p: เปลี่ยน Data Source หลักเป็น account_import_lines (pl_estimate)
-- รันหลัง phase5o_pl_file_import.sql
--
-- หลังจากเปลี่ยน workflow ให้หัวหน้าบัญชีโยนไฟล์เดียวจบ (ผ่าน process นอก ก่อนเข้าแอพ)
-- ข้อมูลหลักของบริษัทจึงอยู่ใน account_import_lines (batch_type = 'pl_estimate')
-- ไม่ใช่ expense_records ที่ให้พนักงานกรอกเองอีกต่อไป
--
-- ฟังก์ชันที่อัปเดต:
-- 1. get_executive_itemized_report — รายงานผู้บริหาร (แยกกลุ่ม → รหัสบัญชี)
-- 2. get_tax_filing_report         — รายงานสรรพากร (P&L ละเอียด)
-- 3. get_group_report              — ยอดรหัสบัญชีในกลุ่ม (ใช้ในหน้ากลุ่มรหัสบัญชี)
-- 4. get_dashboard_stats           — แดชบอร์ดหลัก (ยอดรวม / กราฟ)
-- 5. get_filter_options            — dropdown ตัวกรอง (ปี / หมวดหมู่)
--
-- หมายเหตุ: get_reconciliation_report ไม่ต้องแก้
-- เพราะออกแบบมาให้ "เทียบ" ระหว่าง 2 แหล่ง (expense_records vs account_import_lines)
-- ============================================================


-- ─────────────────────────────────────────────────────────────────
-- 1. get_executive_itemized_report
--    เดิม: ดึงจาก expense_records (พนักงานกรอกมือ)
--    ใหม่: ดึงจาก account_import_lines (ไฟล์ที่หัวหน้าบัญชีแนบ, batch_type='pl_estimate')
-- ─────────────────────────────────────────────────────────────────
drop function if exists get_executive_itemized_report(text, int, int);
create or replace function get_executive_itemized_report(
  p_actor_id text,
  p_year     int,
  p_month    int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups           jsonb   := '[]'::jsonb;
  v_ungrouped        jsonb   := '[]'::jsonb;
  v_unassigned_total numeric := 0;
  v_grand_total      numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_group_total    numeric;
  v_account_total  numeric;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  -- วนทุกกลุ่มบัญชี
  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_total    := 0;

    for a in select id, code, name from accounts where group_id = g.id order by code loop
      select coalesce(sum(l.amount), 0) into v_account_total
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id
        and b.batch_type = 'pl_estimate'
        and b.year       = p_year
        and (p_month is null or l.month = p_month);

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name, 'total', v_account_total
      ));
      v_group_total := v_group_total + v_account_total;
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'total', v_group_total, 'accounts', v_group_accounts
    ));
    v_grand_total := v_grand_total + v_group_total;
  end loop;

  -- รหัสบัญชีที่ยังไม่มีกลุ่ม
  for a in select id, code, name from accounts where group_id is null order by code loop
    select coalesce(sum(l.amount), 0) into v_account_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id
      and b.batch_type = 'pl_estimate'
      and b.year       = p_year
      and (p_month is null or l.month = p_month);

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name, 'total', v_account_total
    ));
    v_grand_total := v_grand_total + v_account_total;
  end loop;

  -- ไฟล์ pl_estimate บังคับให้ทุกรหัสมีอยู่ในระบบก่อนนำเข้า จึงไม่มี "unassigned"
  return jsonb_build_object(
    'success', true, 'year', p_year, 'month', p_month,
    'groups',            v_groups,
    'ungroupedAccounts', v_ungrouped,
    'unassignedTotal',   v_unassigned_total,
    'grandTotal',        v_grand_total
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 2. get_tax_filing_report
--    เดิม: รายจ่ายจาก expense_records
--    ใหม่: รายจ่ายจาก account_import_lines (pl_estimate)
--    รายได้ยังดึงจาก workshop_plans.sales_push_amount เหมือนเดิม
-- ─────────────────────────────────────────────────────────────────
drop function if exists get_tax_filing_report(text, int);
create or replace function get_tax_filing_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_total_revenue numeric := 0;
  v_by_category   jsonb   := '[]'::jsonb;
  v_net           numeric := 0;
  cat  record;
  acct record;
  v_acct_total numeric;
  v_lines      jsonb;
  v_cat_total  numeric;
begin
  if not has_page_permission(p_actor_id, 'tax-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  -- รายได้: ยังคงมาจาก Workshop (sales_push_amount) เหมือนเดิม
  select coalesce(sum(sales_push_amount), 0) into v_total_revenue
  from workshop_plans
  where status = 'completed'
    and extract(year from planned_date) = p_year;

  -- รายจ่าย: แยกตามหมวดหมู่บัญชี (accounts.category) จากไฟล์ pl_estimate
  for cat in
    select distinct a.category
    from accounts a
    join account_import_lines l   on l.account_id = a.id
    join account_import_batches b on b.id = l.batch_id
    where b.batch_type = 'pl_estimate'
      and b.year = p_year
    order by a.category
  loop
    v_lines     := '[]'::jsonb;
    v_cat_total := 0;

    for acct in
      select distinct a.id, a.code, a.name
      from accounts a
      join account_import_lines l   on l.account_id = a.id
      join account_import_batches b on b.id = l.batch_id
      where a.category = cat.category
        and b.batch_type = 'pl_estimate'
        and b.year = p_year
      order by a.code
    loop
      select coalesce(sum(l.amount), 0) into v_acct_total
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = acct.id
        and b.batch_type = 'pl_estimate'
        and b.year = p_year;

      -- items = [] เพราะไฟล์ pl_estimate เก็บยอดรวม ไม่มีรายการใบเสร็จย่อย
      v_lines := v_lines || jsonb_build_array(jsonb_build_object(
        'code',  acct.code, 'name', acct.name,
        'total', v_acct_total,
        'items', '[]'::jsonb
      ));
      v_cat_total := v_cat_total + v_acct_total;
    end loop;

    v_by_category := v_by_category || jsonb_build_array(jsonb_build_object(
      'category', cat.category, 'total', v_cat_total, 'lines', v_lines
    ));
  end loop;

  -- ยอดรายจ่ายรวมทั้งปีจากไฟล์
  select coalesce(sum(l.amount), 0) into v_net
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  where b.batch_type = 'pl_estimate'
    and b.year = p_year;

  return jsonb_build_object(
    'success', true, 'year', p_year,
    'totalRevenue',  v_total_revenue,
    'totalExpenses', v_net,
    'netIncome',     v_total_revenue - v_net,
    'byCategory',    v_by_category
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 3. get_group_report
--    เดิม: ดึงจาก expense_records
--    ใหม่: ดึงจาก account_import_lines (pl_estimate)
-- ─────────────────────────────────────────────────────────────────
create or replace function get_group_report(
  p_actor_id text, p_group_id bigint, p_year int, p_month int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_group       record;
  v_members     jsonb   := '[]'::jsonb;
  v_group_total numeric := 0;
  a record;
  v_account_total numeric;
begin
  if not has_page_permission(p_actor_id, 'account-groups') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานกลุ่มนี้');
  end if;

  select id, code, name into v_group from account_groups where id = p_group_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'ไม่พบกลุ่มนี้');
  end if;

  for a in select id, code, name from accounts where group_id = p_group_id order by code loop
    select coalesce(sum(l.amount), 0) into v_account_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id
      and b.batch_type = 'pl_estimate'
      and b.year       = p_year
      and (p_month is null or l.month = p_month);

    v_members     := v_members || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name, 'total', v_account_total
    ));
    v_group_total := v_group_total + v_account_total;
  end loop;

  return jsonb_build_object(
    'success', true,
    'groupCode', v_group.code, 'groupName', v_group.name,
    'year', p_year, 'month', p_month,
    'members', v_members, 'groupTotal', v_group_total
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 4. get_dashboard_stats
--    เดิม: ดึงจาก expense_records (กรอกมือ)
--    ใหม่: ดึงจาก account_import_lines (pl_estimate)
--
--    หมายเหตุ filter:
--    - year/month   ยังกรองได้ตามปกติ
--    - category     กรองตาม accounts.category
--    - store/detail ไม่มีในไฟล์ pl_estimate — รับ parameter ไว้แต่ไม่กรอง (backward-compat)
-- ─────────────────────────────────────────────────────────────────
create or replace function get_dashboard_stats(p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_year     int  := (p_filters->>'year')::int;
  v_month    int  := (p_filters->>'month')::int;
  v_category text := nullif(trim(p_filters->>'category'), '');
  -- v_detail / v_store: ยังรับมาเพื่อ backward-compat แต่ไม่ใช้
  -- เพราะ account_import_lines ไม่มีข้อมูลระดับใบเสร็จ/ร้านค้า

  v_total_expenses numeric := 0;
  v_total_income   numeric := 0;
  v_by_category    jsonb   := '{}'::jsonb;
  v_by_month       jsonb   := '{}'::jsonb;
  v_doc_count      int     := 0;
  v_top_category   text    := '-';
  v_top_amount     numeric := 0;
  r            record;
  v_cat_amount numeric;
  v_month_key  text;
begin
  if v_year is not null and v_year > 2400 then v_year := v_year - 543; end if;

  -- ยอดรายจ่ายจากไฟล์ pl_estimate
  for r in
    select
      a.category        as main_category,
      l.month           as line_month,
      b.year            as line_year,
      sum(l.amount)     as row_total
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a               on a.id = l.account_id
    where b.batch_type = 'pl_estimate'
      and (v_year     is null or b.year  = v_year)
      and (v_month    is null or l.month = v_month)
      and (v_category is null or a.category = v_category)
    group by a.category, l.month, b.year
  loop
    v_total_expenses := v_total_expenses + coalesce(r.row_total, 0);

    -- byCategory (key = ชื่อหมวดหมู่บัญชี)
    v_cat_amount  := coalesce((v_by_category->>r.main_category)::numeric, 0) + coalesce(r.row_total, 0);
    v_by_category := v_by_category || jsonb_build_object(r.main_category, v_cat_amount);

    -- byMonth (key = "YYYY-MM")
    if r.line_month is not null then
      v_month_key := r.line_year::text || '-' || lpad(r.line_month::text, 2, '0');
      v_by_month  := v_by_month || jsonb_build_object(
        v_month_key,
        coalesce((v_by_month->>v_month_key)::numeric, 0) + coalesce(r.row_total, 0)
      );
    end if;
  end loop;

  -- รายได้ยังคงมาจาก Workshop (sales_push_amount)
  select coalesce(sum(sales_push_amount), 0) into v_total_income
  from workshop_plans
  where status = 'completed'
    and (v_year  is null or extract(year  from planned_date) = v_year)
    and (v_month is null or extract(month from planned_date) = v_month);

  -- docCount = จำนวน batch ที่ import ในปีนั้น (แทน doc_number เดิม)
  select count(distinct b.id) into v_doc_count
  from account_import_batches b
  where b.batch_type = 'pl_estimate'
    and (v_year is null or b.year = v_year);

  -- หมวดหมู่ที่มียอดสูงสุด
  select key, value::numeric into v_top_category, v_top_amount
  from jsonb_each_text(v_by_category)
  order by value::numeric desc
  limit 1;

  return jsonb_build_object(
    'success',           true,
    'totalExpenses',     v_total_expenses,
    'totalSpend',        v_total_expenses,
    'totalIncome',       v_total_income,
    'netDiff',           v_total_income - v_total_expenses,
    'docCount',          v_doc_count,
    'avgPerDoc',         case when v_doc_count > 0 then v_total_expenses / v_doc_count else 0 end,
    'topCategory',       coalesce(v_top_category, '-'),
    'topCategoryAmount', coalesce(v_top_amount, 0),
    'byCategory',        v_by_category,
    'byMonth',           v_by_month
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 5. get_filter_options
--    เดิม: ปี/หมวดหมู่/รายละเอียด/ร้านค้า จาก expense_records
--    ใหม่: ปี/หมวดหมู่ จาก account_import_batches + accounts (pl_estimate เท่านั้น)
--    store/detail คืน [] เพราะไฟล์ pl_estimate ไม่มีข้อมูลระดับนั้น
-- ─────────────────────────────────────────────────────────────────
create or replace function get_filter_options()
returns jsonb
language plpgsql
security definer
as $$
declare
  v_years      jsonb := '[]'::jsonb;
  v_categories jsonb := '[]'::jsonb;
begin
  -- ปีที่มีข้อมูล (จาก batch ที่ import)
  select coalesce(jsonb_agg(distinct b.year order by b.year desc), '[]'::jsonb)
  into v_years
  from account_import_batches b
  where b.batch_type = 'pl_estimate';

  -- หมวดหมู่บัญชี (จากรหัสที่มีข้อมูลใน import_lines)
  select coalesce(jsonb_agg(distinct a.category order by a.category), '[]'::jsonb)
  into v_categories
  from accounts a
  join account_import_lines l   on l.account_id = a.id
  join account_import_batches b on b.id = l.batch_id
  where b.batch_type = 'pl_estimate'
    and a.category is not null;

  return jsonb_build_object(
    'success',    true,
    'years',      v_years,
    'categories', v_categories,
    'details',    '[]'::jsonb,
    'storeNames', '[]'::jsonb
  );
end;
$$;

```

---

### 📄 File: `supabase\phase5q_enhancements.sql`
```sql
﻿-- ============================================================
-- GoCost — Phase 5q: Feature Enhancements
-- 1. Budget Control & Sub-limits ( account_budgets )
-- 2. Drill-down: get_group_detail_by_period
-- 3. External Expense Sources scaffold
-- ============================================================

-- ─────────────────────────────────────────────────────────────────
-- 1. ตาราง account_budgets สำหรับตั้งงบรายกลุ่ม / รหัสบัญชีย่อย (sub-limit)
-- ─────────────────────────────────────────────────────────────────
create table if not exists account_budgets (
  id          bigint generated always as identity primary key,
  group_id    bigint references account_groups(id) on delete cascade,
  account_id  bigint references accounts(id) on delete cascade,
  year        int not null,
  month       int, -- null = รายปี, 1-12 = รายเดือน
  amount      numeric not null default 0,
  updated_by  text references users(id),
  updated_at  timestamptz not null default now(),
  constraint chk_budget_target check (group_id is not null or account_id is not null)
);

alter table account_budgets enable row level security;

-- RPC สำหรับตั้งงบกลุ่ม/รหัสบัญชี
create or replace function save_account_budget(
  p_actor_id text,
  p_group_id bigint default null,
  p_account_id bigint default null,
  p_year int default 2026,
  p_month int default null,
  p_amount numeric default 0
)
returns jsonb
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'budgets') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ตั้งงบประมาณ');
  end if;

  if p_amount is null or p_amount < 0 then
    return jsonb_build_object('success', false, 'message', 'จำนวนงบต้องไม่ติดลบ');
  end if;

  if p_group_id is null and p_account_id is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาระบุกลุ่มหรือรหัสบัญชี');
  end if;

  if p_group_id is not null then
    insert into account_budgets (group_id, year, month, amount, updated_by, updated_at)
    values (p_group_id, p_year, p_month, p_amount, p_actor_id, now())
    on conflict do nothing; -- fallback index handling in logic or application
    
    update account_budgets 
    set amount = p_amount, updated_by = p_actor_id, updated_at = now()
    where group_id = p_group_id and year = p_year and (month is not distinct from p_month);
  else
    update account_budgets 
    set amount = p_amount, updated_by = p_actor_id, updated_at = now()
    where account_id = p_account_id and year = p_year and (month is not distinct from p_month);

    if not found then
      insert into account_budgets (account_id, year, month, amount, updated_by, updated_at)
      values (p_account_id, p_year, p_month, p_amount, p_actor_id, now());
    end if;
  end if;

  perform write_audit_log(p_actor_id, 'SAVE_ACCOUNT_BUDGET', 'Budgets', format('ตั้งงบปี %s เดือน %s ยอด %s', p_year, coalesce(p_month::text, 'ทั้งปี'), p_amount));
  return jsonb_build_object('success', true, 'message', 'บันทึกงบสำเร็จ');
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 2. Drill-down RPC: get_group_detail_by_period
--    "จิ้มแล้วรู้ว่าใช้จ่ายกับอะไรบ้าง ในเดือน/ปี นั้นๆ"
-- ─────────────────────────────────────────────────────────────────
create or replace function get_group_detail_by_period(
  p_actor_id text,
  p_group_id bigint default null,
  p_account_id bigint default null,
  p_year int default 2026,
  p_month int default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_lines jsonb := '[]'::jsonb;
  v_total numeric := 0;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'lineId', l.id,
    'accountCode', a.code,
    'accountName', a.name,
    'category', a.category,
    'month', l.month,
    'year', b.year,
    'amount', l.amount,
    'batchId', b.id,
    'fileName', b.file_name,
    'importedAt', b.imported_at
  ) order by a.code, l.month), '[]'::jsonb),
  coalesce(sum(l.amount), 0)
  into v_lines, v_total
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  join accounts a on a.id = l.account_id
  where b.batch_type = 'pl_estimate'
    and b.year = p_year
    and (p_month is null or l.month = p_month)
    and (
      (p_group_id is not null and a.group_id = p_group_id)
      or (p_account_id is not null and a.id = p_account_id)
      or (p_group_id is null and p_account_id is null)
    );

  return jsonb_build_object(
    'success', true,
    'year', p_year,
    'month', p_month,
    'total', v_total,
    'items', v_lines
  );
end;
$$;


-- ─────────────────────────────────────────────────────────────────
-- 3. รองรับยอดค่าใช้จ่ายภายนอก ( External Expense Sources )
-- ─────────────────────────────────────────────────────────────────
create table if not exists external_expense_sources (
  id          bigint generated always as identity primary key,
  source_code text not null unique,
  source_name text not null, -- เช่น 'บิวเทรียม (Beautrium)', 'Shopee', 'Lazada'
  channel     text default 'online',
  is_active   boolean default true,
  note        text,
  created_at  timestamptz default now()
);

create table if not exists external_expense_imports (
  id           bigint generated always as identity primary key,
  source_id    bigint references external_expense_sources(id) on delete cascade,
  batch_label  text,
  year         int not null,
  month        int not null,
  total_amount numeric default 0,
  raw_payload  jsonb,
  imported_by  text references users(id),
  imported_at  timestamptz default now()
);

alter table external_expense_sources enable row level security;
alter table external_expense_imports enable row level security;

-- Seed ข้อมูลช่องทางภายนอกเริ่มต้น
insert into external_expense_sources (source_code, source_name, channel, note)
values 
  ('BEAUTRIUM', 'บิวเทรียม (Beautrium)', 'retail', 'ยอดค่าใช้จ่าย/ค่าคอมมินชัน/ค่าเช่าพื้นที่ บิวเทรียม'),
  ('ECOM_SHOPEE', 'Shopee Official Store', 'online', 'ค่าธรรมเนียมและค่าบริการ Shopee'),
  ('ECOM_LAZADA', 'Lazada Official Store', 'online', 'ค่าธรรมเนียมและค่าบริการ Lazada'),
  ('TIKTOK_SHOP', 'TikTok Shop', 'online', 'ค่าโฆษณาและค่าธรรมเนียม TikTok Shop')
on conflict (source_code) do nothing;

create or replace function get_external_sources(p_actor_id text)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_sources jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id,
    'code', s.source_code,
    'name', s.source_name,
    'channel', s.channel,
    'isActive', s.is_active,
    'note', s.note
  ) order by s.id), '[]'::jsonb)
  into v_sources
  from external_expense_sources s;

  return jsonb_build_object('success', true, 'sources', v_sources);
end;
$$;

```

---

### 📄 File: `supabase\phase5r_trial_balance.sql`
```sql
-- ============================================================
-- GoCost — Phase 5r: งบทดลอง (Trial Balance) จริง — แทนที่ mock data ใน TrialBalancePage
-- รันหลัง phase5q_enhancements.sql (หรือไฟล์ล่าสุดที่รันไปแล้ว)
--
-- ใช้ storage เดิมจาก phase5o (account_import_batches / account_import_lines,
-- batch_type='trial_balance' ที่อนุญาตไว้อยู่แล้วในฐานข้อมูล) ไม่ต้องสร้างตารางใหม่
-- ต่างจากไฟล์ "ประมาณการกำไรขาดทุน" ตรงที่:
-- - งบทดลองเป็นภาพนิ่ง ณ ช่วงเวลาหนึ่ง (ไม่ได้มีคอลัมน์ 12 เดือนในไฟล์เดียว)
--   → ผู้ใช้เลือกปี/เดือนเองตอนอัปโหลด แทนที่จะอ่านจากคอลัมน์เดือนในไฟล์
-- - ไม่บังคับ all-or-nothing (งบทดลองมีรหัสบัญชีทั้งบริษัท รวมสินทรัพย์/หนี้สิน
--   ที่ไม่ได้อยู่ในผังบัญชีของเราด้วย) → ข้ามรหัสที่ไม่ตรงไปเงียบๆ ได้ ไม่ error
--   ทั้งไฟล์ (กรองไว้ตั้งแต่ฝั่ง client แล้วก่อนเรียก import_account_file เดิม)
-- ============================================================

-- ─────────────────────────────────────────────
-- get_trial_balance_report — สรุปงบทดลองแยกตามกลุ่ม/รหัสบัญชี พร้อมแยกเดบิท/เครดิต
-- ตามประเภทบัญชี (รายได้ = เครดิต, ค่าใช้จ่าย/อื่นๆ = เดบิท) สำหรับแสดงผลสไตล์งบทดลอง
-- ─────────────────────────────────────────────
create or replace function get_trial_balance_report(p_actor_id text, p_year int, p_month int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_total_debit numeric := 0;
  v_total_credit numeric := 0;
  g record;
  a record;
  v_group_accounts jsonb;
  v_amount numeric;
  v_debit numeric;
  v_credit numeric;
begin
  if not has_page_permission(p_actor_id, 'trial-balance') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูงบทดลอง');
  end if;

  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    for a in select id, code, name, category from accounts where group_id = g.id order by code loop
      select coalesce(sum(l.amount), 0) into v_amount
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id and b.batch_type = 'trial_balance'
        and b.year = p_year and l.month = p_month;

      if v_amount = 0 then continue; end if;

      if v_amount >= 0 then
        v_debit := v_amount; v_credit := 0;
      else
        v_debit := 0; v_credit := abs(v_amount);
      end if;

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name, 'debit', v_debit, 'credit', v_credit
      ));
      v_total_debit := v_total_debit + v_debit;
      v_total_credit := v_total_credit + v_credit;
    end loop;

    if jsonb_array_length(v_group_accounts) > 0 then
      v_groups := v_groups || jsonb_build_array(jsonb_build_object(
        'groupId', g.id, 'code', g.code, 'name', g.name, 'accounts', v_group_accounts
      ));
    end if;
  end loop;

  for a in select id, code, name, category from accounts where group_id is null order by code loop
    select coalesce(sum(l.amount), 0) into v_amount
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    where l.account_id = a.id and b.batch_type = 'trial_balance'
      and b.year = p_year and l.month = p_month;

    if v_amount = 0 then continue; end if;

    if v_amount >= 0 then
      v_debit := v_amount; v_credit := 0;
    else
      v_debit := 0; v_credit := abs(v_amount);
    end if;

    v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
      'code', a.code, 'name', a.name, 'debit', v_debit, 'credit', v_credit
    ));
    v_total_debit := v_total_debit + v_debit;
    v_total_credit := v_total_credit + v_credit;
  end loop;

  return jsonb_build_object(
    'success', true, 'year', p_year, 'month', p_month,
    'groups', v_groups, 'ungroupedAccounts', v_ungrouped,
    'totalDebit', v_total_debit, 'totalCredit', v_total_credit
  );
end;
$$;

-- ─────────────────────────────────────────────
-- get_trial_balance_periods — รายชื่องบทดลองที่เคยนำเข้าไว้แล้ว (สำหรับ list ทางซ้าย
-- ของหน้า TrialBalancePage แทนที่ MOCK_TRIAL_BALANCES)
-- ─────────────────────────────────────────────
create or replace function get_trial_balance_periods(p_actor_id text)
returns table (year int, month int, line_count bigint, uploaded_at timestamptz, uploaded_by_name text, file_name text)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'trial-balance') then
    raise exception 'คุณไม่มีสิทธิ์ดูงบทดลอง';
  end if;

  return query
  select b.year, l.month, count(l.id), max(b.uploaded_at), max(u.name), max(b.file_name)
  from account_import_batches b
  join account_import_lines l on l.batch_id = b.id
  left join users u on u.id = b.uploaded_by
  where b.batch_type = 'trial_balance'
  group by b.year, l.month
  order by b.year desc, l.month desc;
end;
$$;

-- ─────────────────────────────────────────────
-- delete_trial_balance_period — ลบงบทดลองของช่วงเวลาหนึ่ง (ลบทุก batch/line ของ
-- ปี-เดือนนั้น) ใช้กับปุ่ม "ลบงบนี้" ในหน้า TrialBalancePage
-- ─────────────────────────────────────────────
create or replace function delete_trial_balance_period(p_actor_id text, p_year int, p_month int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_deleted int;
begin
  if not has_page_permission(p_actor_id, 'trial-balance') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบงบทดลอง');
  end if;

  delete from account_import_lines l
  using account_import_batches b
  where l.batch_id = b.id and b.batch_type = 'trial_balance'
    and b.year = p_year and l.month = p_month;
  get diagnostics v_deleted = row_count;

  -- ลบ batch ที่ไม่มีบรรทัดเหลือแล้ว (กันขยะค้าง)
  delete from account_import_batches b
  where b.batch_type = 'trial_balance' and b.year = p_year
    and not exists (select 1 from account_import_lines l2 where l2.batch_id = b.id);

  perform write_audit_log(p_actor_id, 'DELETE_TRIAL_BALANCE', 'AccountImport',
    format('ลบงบทดลองปี %s เดือน %s (%s รายการ)', p_year, p_month, v_deleted));

  return jsonb_build_object('success', true, 'message', format('ลบงบทดลองสำเร็จ (%s รายการ)', v_deleted));
end;
$$;

-- backfill: ให้ ADMIN มีสิทธิ์ 'trial-balance' และ 'external-expenses' ชัดเจนในรายการ
-- (ไม่จำเป็นเพราะ ADMIN bypass อยู่แล้ว แต่ใส่ไว้ให้ checkbox ในแผงสิทธิ์แสดงถูกต้อง)
update users set page_permissions = page_permissions || '["trial-balance","external-expenses"]'::jsonb
where role = 'ADMIN'
  and not (page_permissions ? 'trial-balance' and page_permissions ? 'external-expenses');

```

---

### 📄 File: `supabase\phase5s_executive_monthly_report.sql`
```sql
-- ============================================================
-- GoCost — Phase 5s: รายงานผู้บริหารแบบตารางรายเดือน (ตาม template "งบบริหาร" จริง)
-- รันหลัง phase5r_trial_balance.sql
--
-- ออกแบบตามไฟล์ตัวอย่าง "งบบริหาร" ที่ส่งมา: ตาราง รหัสบัญชี|ชื่อบัญชี|ม.ค....ธ.ค.|รวม
-- แบ่งเป็นกลุ่ม (จากตาราง account_groups ที่คุณสร้างเอง) แต่ละกลุ่มมี % ของรายได้
-- กำกับ, รหัสบัญชีที่ยังไม่มีกลุ่มจะไม่ปรากฏใน % (เพราะยังไม่ได้จัดหมวดเอง)
--
-- แหล่งข้อมูล: account_import_lines (batch_type='pl_estimate') — ใช้ตัวเดียวกับ
-- ที่ phase5p วางไว้เป็นแหล่งหลักของ get_executive_itemized_report/get_group_report
-- อยู่แล้ว เพื่อไม่ให้มีตัวเลข 2 ชุดขัดแย้งกันในหน้าต่างๆ ของฝ่ายบริหาร
--
-- รายได้รวม (ใช้คำนวณ %): ผลรวมยอดของรหัสบัญชีที่ accounts.category = 'รายได้ (Revenue)'
-- (ไม่ได้อิงจากกลุ่มที่ตั้งเอง เพราะกลุ่มถูกลบไปแล้วตามที่ขอ และคุณอาจยังไม่ได้สร้าง
-- กลุ่ม "รายได้" ขึ้นมาใหม่ — ใช้ category ที่มีอยู่แล้วในผังบัญชีแทน แม่นยำกว่า)
-- ============================================================

create or replace function get_executive_monthly_report(p_actor_id text, p_year int)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_groups jsonb := '[]'::jsonb;
  v_ungrouped jsonb := '[]'::jsonb;
  v_revenue_monthly numeric[] := array_fill(0::numeric, array[12]);
  v_revenue_total numeric := 0;
  g record;
  a record;
  m int;
  v_group_accounts jsonb;
  v_group_monthly numeric[];
  v_group_total numeric;
  v_acct_monthly numeric[];
  v_acct_total numeric;
  v_amt numeric;
  v_pct_monthly jsonb;
begin
  if not has_page_permission(p_actor_id, 'exec-report') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ดูรายงานนี้');
  end if;

  -- รายได้รวมทั้งปี แยกรายเดือน (ใช้คำนวณ % ของแต่ละกลุ่ม)
  for m in 1..12 loop
    select coalesce(sum(l.amount), 0) into v_amt
    from account_import_lines l
    join account_import_batches b on b.id = l.batch_id
    join accounts a2 on a2.id = l.account_id
    where b.batch_type = 'pl_estimate' and b.year = p_year and l.month = m
      and a2.category = 'รายได้ (Revenue)';
    v_revenue_monthly[m] := v_amt;
    v_revenue_total := v_revenue_total + v_amt;
  end loop;

  -- แต่ละกลุ่ม
  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_monthly := array_fill(0::numeric, array[12]);
    v_group_total := 0;

    for a in
      select distinct ac.id, ac.code, ac.name
      from accounts ac
      left join account_group_splits s on s.account_id = ac.id
      where ac.group_id = g.id or s.group_id = g.id
      order by ac.code
    loop
      v_acct_monthly := array_fill(0::numeric, array[12]);
      v_acct_total := 0;
      for m in 1..12 loop
        select coalesce(sum(l.amount), 0) into v_amt
        from account_import_lines l
        join account_import_batches b on b.id = l.batch_id
        where l.account_id = a.id and b.batch_type = 'pl_estimate' and b.year = p_year and l.month = m;
        v_acct_monthly[m] := v_amt;
        v_acct_total := v_acct_total + v_amt;
        v_group_monthly[m] := v_group_monthly[m] + v_amt;
      end loop;

      v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name,
        'monthly', to_jsonb(v_acct_monthly), 'total', v_acct_total
      ));
      v_group_total := v_group_total + v_acct_total;
    end loop;

    v_pct_monthly := '[]'::jsonb;
    for m in 1..12 loop
      v_pct_monthly := v_pct_monthly || jsonb_build_array(
        case when v_revenue_monthly[m] > 0 then round((v_group_monthly[m] / v_revenue_monthly[m]) * 100, 2) else null end
      );
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'accounts', v_group_accounts,
      'monthly', to_jsonb(v_group_monthly), 'total', v_group_total,
      'pctOfRevenueMonthly', v_pct_monthly,
      'pctOfRevenueTotal', case when v_revenue_total > 0 then round((v_group_total / v_revenue_total) * 100, 2) else null end
    ));
  end loop;

  -- รหัสที่ยังไม่มีกลุ่ม
  for a in
    select ac.id, ac.code, ac.name
    from accounts ac
    where ac.group_id is null
      and not exists (select 1 from account_group_splits s where s.account_id = ac.id)
    order by ac.code
  loop
    v_acct_monthly := array_fill(0::numeric, array[12]);
    v_acct_total := 0;
    for m in 1..12 loop
      select coalesce(sum(l.amount), 0) into v_amt
      from account_import_lines l
      join account_import_batches b on b.id = l.batch_id
      where l.account_id = a.id and b.batch_type = 'pl_estimate' and b.year = p_year and l.month = m;
      v_acct_monthly[m] := v_amt;
      v_acct_total := v_acct_total + v_amt;
    end loop;
    if v_acct_total <> 0 then
      v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name, 'monthly', to_jsonb(v_acct_monthly), 'total', v_acct_total
      ));
    end if;
  end loop;

  return jsonb_build_object(
    'success', true, 'year', p_year,
    'revenueMonthly', to_jsonb(v_revenue_monthly), 'revenueTotal', v_revenue_total,
    'groups', v_groups, 'ungroupedAccounts', v_ungrouped
  );
end;
$$;

```

---

### 📄 File: `supabase\phase5t_import_line_management.sql`
```sql
-- ============================================================
-- GoCost — Phase 5t: จัดการรายการที่นำเข้าแล้ว (ลบ/แก้ไข/เพิ่ม) ไม่ต้องอัปโหลดใหม่ทั้งไฟล์
-- รันหลัง phase5s_executive_monthly_report.sql
--
-- เดิมมีแค่ delete_trial_balance_period (ลบทั้งช่วงเวลา เฉพาะงบทดลอง) — ตอนนี้เพิ่ม
-- ความสามารถแบบละเอียดกว่าให้ทั้ง 2 ประเภทไฟล์ (pl_estimate และ trial_balance):
-- 1. delete_import_batch    — ลบทั้ง batch (1 ครั้งที่อัปโหลด)
-- 2. get_import_lines       — ดูรายการย่อยทุกบรรทัดที่นำเข้าไว้ (กรองปี+ประเภทไฟล์)
-- 3. update_import_line     — แก้ไขยอดของ 1 บรรทัด (พิมพ์ผิด/ตัวเลขเปลี่ยน)
-- 4. delete_import_line     — ลบแค่ 1 บรรทัด (ลบ batch ที่ว่างเปล่าตามไปด้วยอัตโนมัติ)
-- 5. add_import_line        — เพิ่มรายการใหม่ด้วยมือ (ไม่ต้องอัปโหลดไฟล์ใหม่ทั้งไฟล์)
-- ============================================================

create or replace function delete_import_batch(p_actor_id text, p_batch_id bigint)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_batch_type text;
  v_count int;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบข้อมูลที่นำเข้า');
  end if;

  select batch_type into v_batch_type from account_import_batches where id = p_batch_id;
  if v_batch_type is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรายการนำเข้านี้');
  end if;

  select count(*) into v_count from account_import_lines where batch_id = p_batch_id;
  delete from account_import_batches where id = p_batch_id;

  perform write_audit_log(p_actor_id, 'DELETE_IMPORT_BATCH', 'AccountImport',
    format('ลบชุดนำเข้า id %s (%s) — %s รายการ', p_batch_id, v_batch_type, v_count));

  return jsonb_build_object('success', true, 'message', format('ลบสำเร็จ (%s รายการ)', v_count));
end;
$$;

create or replace function get_import_lines(p_actor_id text, p_batch_type text, p_year int)
returns table (
  line_id bigint, batch_id bigint, code text, account_name text,
  month int, amount numeric, file_name text, uploaded_at timestamptz
)
language plpgsql
security definer
as $$
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    raise exception 'คุณไม่มีสิทธิ์ดูรายการที่นำเข้า';
  end if;

  return query
  select l.id, l.batch_id, l.code, a.name, l.month, l.amount, b.file_name, b.uploaded_at
  from account_import_lines l
  join account_import_batches b on b.id = l.batch_id
  left join accounts a on a.id = l.account_id
  where b.batch_type = p_batch_type and b.year = p_year
  order by l.month nulls last, l.code;
end;
$$;

create or replace function update_import_line(p_actor_id text, p_line_id bigint, p_amount numeric)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_old numeric;
  v_code text;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์แก้ไขรายการที่นำเข้า');
  end if;
  if p_amount is null then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอด');
  end if;

  select amount, code into v_old, v_code from account_import_lines where id = p_line_id;
  if v_code is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรายการนี้');
  end if;

  update account_import_lines set amount = p_amount where id = p_line_id;

  perform write_audit_log(p_actor_id, 'EDIT_IMPORT_LINE', 'AccountImport',
    format('แก้ไขยอดรหัส %s: %s → %s (line id %s)', v_code, v_old, p_amount, p_line_id));

  return jsonb_build_object('success', true, 'message', 'แก้ไขยอดสำเร็จ');
end;
$$;

create or replace function delete_import_line(p_actor_id text, p_line_id bigint)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_batch_id bigint;
  v_code text;
  v_remaining int;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์ลบรายการที่นำเข้า');
  end if;

  select batch_id, code into v_batch_id, v_code from account_import_lines where id = p_line_id;
  if v_batch_id is null then
    return jsonb_build_object('success', false, 'message', 'ไม่พบรายการนี้');
  end if;

  delete from account_import_lines where id = p_line_id;

  select count(*) into v_remaining from account_import_lines where batch_id = v_batch_id;
  if v_remaining = 0 then
    delete from account_import_batches where id = v_batch_id;
  end if;

  perform write_audit_log(p_actor_id, 'DELETE_IMPORT_LINE', 'AccountImport', format('ลบรายการรหัส %s (line id %s)', v_code, p_line_id));

  return jsonb_build_object('success', true, 'message', 'ลบรายการสำเร็จ');
end;
$$;

create or replace function add_import_line(
  p_actor_id text, p_batch_type text, p_year int, p_code text, p_month int, p_amount numeric, p_description text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_account_id bigint;
  v_batch_id bigint;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'คุณไม่มีสิทธิ์เพิ่มรายการนำเข้า');
  end if;
  if p_batch_type not in ('trial_balance', 'expense_file', 'pl_estimate') then
    return jsonb_build_object('success', false, 'message', 'ประเภทไฟล์ไม่ถูกต้อง');
  end if;

  select id into v_account_id from accounts where code = trim(coalesce(p_code, ''));
  if v_account_id is null then
    return jsonb_build_object('success', false, 'message', format('ไม่พบรหัสบัญชี %s ในผังบัญชี กรุณาเพิ่มที่หน้า "จัดการรหัสบัญชี" ก่อน', p_code));
  end if;
  if p_amount is null then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกยอด');
  end if;

  select id into v_batch_id from account_import_batches
  where batch_type = p_batch_type and year = p_year and file_name = '(เพิ่มด้วยมือ)'
  limit 1;

  if v_batch_id is null then
    insert into account_import_batches (batch_type, year, month, file_name, uploaded_by)
    values (p_batch_type, p_year, null, '(เพิ่มด้วยมือ)', p_actor_id)
    returning id into v_batch_id;
  end if;

  insert into account_import_lines (batch_id, account_id, code, amount, month, description)
  values (v_batch_id, v_account_id, trim(p_code), p_amount, p_month, nullif(trim(coalesce(p_description, '')), ''));

  perform write_audit_log(p_actor_id, 'ADD_IMPORT_LINE', 'AccountImport',
    format('เพิ่มรายการด้วยมือ: %s เดือน %s ยอด %s (ปี %s, %s)', p_code, coalesce(p_month::text,'-'), p_amount, p_year, p_batch_type));

  return jsonb_build_object('success', true, 'message', 'เพิ่มรายการสำเร็จ');
end;
$$;

```

---

### 📄 File: `supabase\phase5u_preview_import.sql`
```sql
-- ============================================================
-- GoCost — Phase 5u: Preview PL Import Reports (Dry-run)
-- สร้าง function ที่ simulate ผลลัพธ์ของการ import ไฟล์ P&L
-- โดยไม่บันทึกข้อมูลจริงลง DB — ใช้สำหรับ Preview ก่อนยืนยัน
--
-- Input: p_rows = [{code, month, amount, description}]
--        p_year = ปีที่ import
-- Output: {
--   execReport: { ...same format as get_executive_monthly_report },
--   taxReport:  { ...same format as get_tax_filing_report }
-- }
-- ============================================================

create or replace function preview_pl_import_reports(
  p_actor_id text,
  p_rows     jsonb,   -- [{code, month, amount, description}]
  p_year     int
)
returns jsonb
language plpgsql
security definer
as $$
declare
  -- Exec report
  v_groups          jsonb := '[]'::jsonb;
  v_ungrouped       jsonb := '[]'::jsonb;
  v_rev_monthly     numeric[] := array_fill(0::numeric, array[12]);
  v_rev_total       numeric := 0;
  g                 record;
  a                 record;
  m                 int;
  v_group_accounts  jsonb;
  v_group_monthly   numeric[];
  v_group_total     numeric;
  v_acct_monthly    numeric[];
  v_acct_total      numeric;
  v_amt             numeric;
  v_pct_monthly     jsonb;

  -- Tax report
  v_tax_by_cat      jsonb := '[]'::jsonb;
  v_tax_rev         numeric := 0;
  v_tax_exp_total   numeric := 0;
  cat               record;
  v_lines           jsonb;
  v_cat_total       numeric;
begin
  if not has_page_permission(p_actor_id, 'account-import') then
    return jsonb_build_object('success', false, 'message', 'ไม่มีสิทธิ์ preview');
  end if;

  -- สร้าง temp table จาก p_rows เพื่อ query ได้ง่าย
  create temp table _preview_lines (
    account_id  bigint,
    code        text,
    category    text,
    group_id    bigint,
    month       int,
    amount      numeric
  ) on commit drop;

  insert into _preview_lines (account_id, code, category, group_id, month, amount)
  select
    ac.id,
    ac.code,
    ac.category,
    coalesce(ac.group_id, (select s.group_id from account_group_splits s where s.account_id = ac.id limit 1)),
    (row_obj->>'month')::int,
    (row_obj->>'amount')::numeric
  from jsonb_array_elements(p_rows) as row_obj
  join accounts ac on ac.code = row_obj->>'code'
  where (row_obj->>'month')::int between 1 and 12;

  -- ═══════════════════════════════
  -- EXEC REPORT (รายงานผู้บริหาร)
  -- ═══════════════════════════════

  -- รายได้รวม (category = 'รายได้ (Revenue)')
  for m in 1..12 loop
    select coalesce(sum(pl.amount), 0) into v_amt
    from _preview_lines pl
    where pl.category = 'รายได้ (Revenue)' and pl.month = m;
    v_rev_monthly[m] := v_amt;
    v_rev_total := v_rev_total + v_amt;
  end loop;

  -- แต่ละกลุ่ม
  for g in select id, code, name from account_groups order by name loop
    v_group_accounts := '[]'::jsonb;
    v_group_monthly  := array_fill(0::numeric, array[12]);
    v_group_total    := 0;

    for a in
      select distinct ac.id, ac.code, ac.name
      from accounts ac
      left join account_group_splits s on s.account_id = ac.id
      where ac.group_id = g.id or s.group_id = g.id
      order by ac.code
    loop
      v_acct_monthly := array_fill(0::numeric, array[12]);
      v_acct_total   := 0;
      for m in 1..12 loop
        select coalesce(sum(pl.amount), 0) into v_amt
        from _preview_lines pl
        where pl.account_id = a.id and pl.month = m;
        v_acct_monthly[m] := v_amt;
        v_acct_total      := v_acct_total + v_amt;
        v_group_monthly[m]:= v_group_monthly[m] + v_amt;
      end loop;

      -- แสดงเฉพาะรหัสที่มีข้อมูลใน preview
      if v_acct_total <> 0 then
        v_group_accounts := v_group_accounts || jsonb_build_array(jsonb_build_object(
          'code', a.code, 'name', a.name,
          'monthly', to_jsonb(v_acct_monthly), 'total', v_acct_total
        ));
      end if;
      v_group_total := v_group_total + v_acct_total;
    end loop;

    v_pct_monthly := '[]'::jsonb;
    for m in 1..12 loop
      v_pct_monthly := v_pct_monthly || jsonb_build_array(
        case when v_rev_monthly[m] > 0
             then round((v_group_monthly[m] / v_rev_monthly[m]) * 100, 2)
             else null end
      );
    end loop;

    v_groups := v_groups || jsonb_build_array(jsonb_build_object(
      'groupId', g.id, 'code', g.code, 'name', g.name,
      'accounts', v_group_accounts,
      'monthly', to_jsonb(v_group_monthly), 'total', v_group_total,
      'pctOfRevenueMonthly', v_pct_monthly,
      'pctOfRevenueTotal',
        case when v_rev_total > 0
             then round((v_group_total / v_rev_total) * 100, 2)
             else null end
    ));
  end loop;

  -- รหัสที่ไม่มีกลุ่ม
  for a in
    select pl.account_id as id, pl.code, acc.name
    from _preview_lines pl
    join accounts acc on acc.id = pl.account_id
    where pl.group_id is null
      and not exists (select 1 from account_group_splits s where s.account_id = pl.account_id)
    group by pl.account_id, pl.code, acc.name
    order by pl.code
  loop
    v_acct_monthly := array_fill(0::numeric, array[12]);
    v_acct_total   := 0;
    for m in 1..12 loop
      select coalesce(sum(pl.amount), 0) into v_amt
      from _preview_lines pl
      where pl.account_id = a.id and pl.month = m;
      v_acct_monthly[m] := v_amt;
      v_acct_total      := v_acct_total + v_amt;
    end loop;
    if v_acct_total <> 0 then
      v_ungrouped := v_ungrouped || jsonb_build_array(jsonb_build_object(
        'code', a.code, 'name', a.name,
        'monthly', to_jsonb(v_acct_monthly), 'total', v_acct_total
      ));
    end if;
  end loop;

  -- ═══════════════════════════════
  -- TAX REPORT (รายงานสรรพากร)
  -- ═══════════════════════════════

  -- รายได้: ใช้จาก preview rows ที่ category = 'รายได้ (Revenue)'
  select coalesce(sum(pl.amount), 0) into v_tax_rev
  from _preview_lines pl
  where pl.category = 'รายได้ (Revenue)';

  -- รายจ่าย: แยกตาม category (ไม่ใช่รายได้)
  for cat in
    select distinct pl.category
    from _preview_lines pl
    where pl.category <> 'รายได้ (Revenue)' and pl.category is not null
    order by pl.category
  loop
    select
      coalesce(
        jsonb_agg(jsonb_build_object(
          'code', q.code, 'name', q.name,
          'total', q.total,
          'items', '[]'::jsonb   -- preview ไม่มีรายการ expense_records
        ) order by q.code),
        '[]'::jsonb
      ),
      coalesce(sum(q.total), 0)
    into v_lines, v_cat_total
    from (
      select pl.code, acc.name, sum(pl.amount) as total
      from _preview_lines pl
      join accounts acc on acc.id = pl.account_id
      where pl.category = cat.category
      group by pl.code, acc.name
    ) q;

    v_tax_by_cat := v_tax_by_cat || jsonb_build_array(jsonb_build_object(
      'category', cat.category, 'total', v_cat_total, 'lines', v_lines
    ));
    v_tax_exp_total := v_tax_exp_total + v_cat_total;
  end loop;

  return jsonb_build_object(
    'success', true,
    'execReport', jsonb_build_object(
      'success', true, 'year', p_year,
      'revenueMonthly', to_jsonb(v_rev_monthly),
      'revenueTotal', v_rev_total,
      'groups', v_groups,
      'ungroupedAccounts', v_ungrouped
    ),
    'taxReport', jsonb_build_object(
      'success', true, 'year', p_year,
      'totalRevenue', v_tax_rev,
      'totalExpenses', v_tax_exp_total,
      'netIncome', v_tax_rev - v_tax_exp_total,
      'byCategory', v_tax_by_cat
    )
  );
end;
$$;

```

---

### 📄 File: `supabase\schema.sql`
```sql
-- ============================================================
-- GoCost (คุมค่าใช้จ่าย) — Supabase schema
-- ผังตารางนี้ map 1:1 กับ 9 ชีตใน GoCost.xlsx เดิม
-- รันไฟล์นี้ใน Supabase SQL editor ครั้งเดียวตอน setup โปรเจกต์
-- ============================================================

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────
-- 1) users  (มาจากชีต "User": id, password, role, name, fullName, email)
-- ─────────────────────────────────────────────
create table if not exists users (
  id            text primary key,        -- เดิม column A: id (เช่น "Kanok500")
  password_hash text not null,           -- เก็บเป็น bcrypt hash เสมอ (ไม่เก็บ plaintext)
  role          text not null,           -- เช่น เซลล์ / ผู้บริหาร / บัญชี
  name          text not null,
  full_name     text,
  email         text,
  created_at    timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 2) documents  (ชีต "Documents": doc_number, type, status, store, scheduled_date, details, created_by, created_at)
-- ─────────────────────────────────────────────
create table if not exists documents (
  doc_number     text primary key,
  type           text not null,          -- เช่น 'Workshop'
  status         text not null,
  store          text,
  scheduled_date date,
  details        jsonb,
  created_by     text references users(id),
  created_at     timestamptz not null default now()
);

-- ─────────────────────────────────────────────
-- 3) audit_logs  (ชีต "Audit_Logs")
-- ─────────────────────────────────────────────
create table if not exists audit_logs (
  log_id     text primary key,
  "timestamp" timestamptz not null default now(),
  user_id    text references users(id),
  action     text not null,
  module     text,
  details    text
);

-- ─────────────────────────────────────────────
-- 4) pending_edits  (ชีต "Pending_Edits" — workflow ขออนุมัติแก้ไข/ลบ)
-- ─────────────────────────────────────────────
create table if not exists pending_edits (
  edit_id             text primary key,
  original_sheet_name text not null,     -- ชื่อ "ตาราง" เดิมที่ขอแก้ (เก็บไว้ compat กับของเดิม)
  original_row_id     text not null,     -- อ้างอิง doc_number ของแถวที่ขอแก้/ลบ
  requested_by        text references users(id),
  request_timestamp   timestamptz not null default now(),
  new_data_json       jsonb,
  status              text not null default 'pending',  -- pending | approved | rejected
  admin_note          text,
  processed_at        timestamptz
);

-- ─────────────────────────────────────────────
-- 5) expense_records  (ชีต "บันทึกค่าใช้จ่าย" — ตารางหลักของแอพ)
-- คอลัมน์เดิม A-N: เลขที่เอกสาร, ลำดับ, ชื่อร้านค้า, วันที่จัด, จำนวนผู้เข้างาน,
--                   จำนวนวันทำงาน, ประเภทค่าใช้จ่าย, รายละเอียด, จำนวน, หน่วย,
--                   ราคาต่อหน่วย, ราคารวม, หมายเหตุ, ไฟล์แนบ
-- หมายเหตุการออกแบบ: เปลี่ยน "วันที่จัด" จาก text ภาษาไทย (dd/MM/พ.ศ.) เดิม
-- ให้เป็น DATE จริงใน DB แล้วค่อยแปลงเป็น พ.ศ. ตอนแสดงผลที่ frontend แทน
-- (ปรับแค่รูปแบบเก็บข้อมูล ไม่กระทบ validation/logic เดิมเลย)
-- ─────────────────────────────────────────────
create table if not exists expense_records (
  doc_number    text not null,
  seq           int not null,
  store_name    text not null,
  event_date    date not null,
  attendees     int default 0,
  work_days     int default 0,
  main_category text not null,
  detail        text not null,
  qty           numeric not null check (qty > 0),
  unit          text,
  unit_price    numeric not null check (unit_price >= 0),
  total         numeric generated always as (round(qty * unit_price, 2)) stored,
  remark        text,
  internal_note text,
  attachment_url text,
  created_by    text references users(id),
  created_at    timestamptz not null default now(),
  primary key (doc_number, seq)
);
create index if not exists idx_expense_records_doc_number on expense_records(doc_number);
create index if not exists idx_expense_records_event_date on expense_records(event_date);
create index if not exists idx_expense_records_store_name on expense_records(store_name);

-- ─────────────────────────────────────────────
-- 6) plan_workshop  (ชีต "PlanWorkshop")
-- ─────────────────────────────────────────────
create table if not exists plan_workshop (
  seq            int generated always as identity primary key,
  doc_number     text,
  store_name     text,
  location       text,
  scheduled_date date,
  created_by     text references users(id),
  status         text
);

-- ─────────────────────────────────────────────
-- 7) notifications  (ชีต "Notifications")
-- ─────────────────────────────────────────────
create table if not exists notifications (
  notif_id    text primary key,
  target_role text,
  target_user text,
  message     text not null,
  link_id     text,
  status      int not null default 0,  -- 0 = unread, 1 = read (ตามของเดิม)
  created_at  timestamptz not null default now()
);

-- ============================================================
-- Document number generator — พอร์ตจาก generateDocumentNumber_() เดิม
-- รูปแบบ: PV[ปี ค.ศ.][running 6 หลัก] เช่น PV2026000007
-- ใช้ advisory lock แทน LockService ของ GAS (กันเลขซ้ำเมื่อบันทึกพร้อมกัน)
-- ============================================================
create or replace function generate_document_number()
returns text
language plpgsql
as $$
declare
  current_year text := to_char(now(), 'YYYY');
  last_doc_no text;
  running_num int;
  new_doc_no text;
begin
  perform pg_advisory_xact_lock(hashtext('gocost_doc_number_lock'));

  select doc_number into last_doc_no
  from expense_records
  where doc_number like 'PV' || current_year || '%'
  order by doc_number desc
  limit 1;

  if last_doc_no is null then
    new_doc_no := 'PV' || current_year || '000001';
  else
    running_num := (substring(last_doc_no from 7))::int + 1;
    new_doc_no := 'PV' || current_year || lpad(running_num::text, 6, '0');
  end if;

  return new_doc_no;
end;
$$;

-- ============================================================
-- Login แบบปลอดภัย — เทียบ password ฝั่ง server ผ่าน RPC เดียว
-- client ไม่มีทางอ่าน column password_hash ได้โดยตรงเลย (ดู RLS ด้านล่าง)
-- ============================================================
create or replace function login_user(p_id text, p_password text)
returns table (id text, role text, name text, full_name text, email text)
language plpgsql
security definer
as $$
begin
  return query
  select u.id, u.role, u.name, u.full_name, u.email
  from users u
  where u.id = p_id
    and u.password_hash = crypt(p_password, u.password_hash);
end;
$$;

-- ============================================================
-- Row Level Security
-- โมเดลนี้ใช้ระบบ login ของตัวเอง (ไม่ใช่ Supabase Auth) เหมือนของเดิม
-- ดังนั้นปิดการเข้าถึงตรงจาก client ทั้งหมด แล้วบังคับให้ผ่าน RPC/Edge Function
-- ที่ใช้ service_role key เท่านั้น — ป้องกัน anon key เห็น password_hash หรือแก้ข้อมูลตรงๆ
-- ============================================================
alter table users enable row level security;
alter table documents enable row level security;
alter table audit_logs enable row level security;
alter table pending_edits enable row level security;
alter table expense_records enable row level security;
alter table plan_workshop enable row level security;
alter table notifications enable row level security;

-- ไม่สร้าง policy ใดๆ ให้ anon/authenticated โดยเจตนา
-- => ทุกการอ่าน/เขียนต้องผ่าน RPC (security definer) หรือ service_role key ฝั่ง server เท่านั้น

-- ============================================================
-- save_expense_record — พอร์ตจาก saveExpenseData(payload) เดิมแบบ 1:1
-- รับ items เป็น jsonb array ของ {mainCategory, detail, qty, unitPrice, unit, remark}
-- validation กฎเดิมทุกข้อ: storeName, eventDate, items ต้องมีอย่างน้อย 1,
-- แต่ละ item ต้องมี mainCategory/detail และ qty>0, unitPrice>=0
-- ============================================================
create or replace function save_expense_record(
  p_store_name text,
  p_event_date date,
  p_attendees int,
  p_work_days int,
  p_internal_note text,
  p_created_by text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_doc_no text;
  v_item jsonb;
  v_seq int := 0;
  v_qty numeric;
  v_unit_price numeric;
begin
  if p_store_name is null or trim(p_store_name) = '' then
    return jsonb_build_object('success', false, 'message', 'กรุณากรอกชื่อร้านค้า / ชื่องาน');
  end if;
  if p_event_date is null then
    return jsonb_build_object('success', false, 'message', 'กรุณาเลือกวันที่จัดงาน');
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('success', false, 'message', 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ');
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    if coalesce(trim(v_item->>'mainCategory'), '') = '' then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกหมวดหมู่หลัก', v_seq));
    end if;
    if coalesce(trim(v_item->>'detail'), '') = '' then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: กรุณาเลือกรายละเอียด', v_seq));
    end if;
    v_qty := (v_item->>'qty')::numeric;
    v_unit_price := (v_item->>'unitPrice')::numeric;
    if v_qty is null or v_qty <= 0 then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: จำนวนต้องมากกว่า 0', v_seq));
    end if;
    if v_unit_price is null or v_unit_price < 0 then
      return jsonb_build_object('success', false, 'message', format('รายการที่ %s: ราคาต่อหน่วยไม่ถูกต้อง', v_seq));
    end if;
  end loop;

  v_doc_no := generate_document_number();
  v_seq := 0;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_seq := v_seq + 1;
    insert into expense_records (
      doc_number, seq, store_name, event_date, attendees, work_days,
      main_category, detail, qty, unit, unit_price, remark, internal_note, created_by
    ) values (
      v_doc_no, v_seq, trim(p_store_name), p_event_date, coalesce(p_attendees, 0), coalesce(p_work_days, 0),
      trim(v_item->>'mainCategory'), trim(v_item->>'detail'),
      (v_item->>'qty')::numeric, trim(coalesce(v_item->>'unit', '')),
      (v_item->>'unitPrice')::numeric, trim(coalesce(v_item->>'remark', '')),
      trim(coalesce(p_internal_note, '')), p_created_by
    );
  end loop;

  insert into audit_logs (log_id, user_id, action, module, details)
  values ('LOG' || (extract(epoch from clock_timestamp()) * 1000)::bigint, p_created_by,
          'สร้างเอกสาร: ' || v_doc_no, 'บันทึกค่าใช้จ่าย', v_doc_no);

  return jsonb_build_object('success', true, 'message', 'บันทึกข้อมูลสำเร็จ', 'docNo', v_doc_no, 'rowsSaved', v_seq);
end;
$$;

-- ============================================================
-- get_expense_history — พอร์ตจาก getHistoryData() เดิม
-- ============================================================
create or replace function get_expense_history()
returns setof expense_records
language sql
security definer
as $$
  select * from expense_records order by doc_number desc, seq asc;
$$;

```

---

### 📄 File: `src\components\ExpenseEditModal.jsx`
```jsx
import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { MAIN_CATEGORIES, DETAILS } from '../lib/constants'

export default function ExpenseEditModal({ doc, onClose, onSubmitted }) {
  const { currentUser } = useAuth()
  const [storeName, setStoreName] = useState(doc.storeName)
  const [eventDate, setEventDate] = useState(doc.eventDate)
  const [attendees, setAttendees] = useState(String(doc.attendees ?? ''))
  const [workDays, setWorkDays] = useState(String(doc.workDays ?? ''))
  const [internalNote, setInternalNote] = useState(doc.internalNote ?? '')
  const [items, setItems] = useState(doc.items.map((it) => ({
    mainCategory: it.mainCategory, detail: it.detail,
    qty: String(it.qty), unit: it.unit ?? '', unitPrice: String(it.unitPrice), remark: it.remark ?? '',
    accountId: it.accountId ? String(it.accountId) : '',
  })))
  const [accountOptions, setAccountOptions] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.rpc('list_accounts_for_selection', { p_actor_id: currentUser?.id ?? null }).then(({ data, error: err }) => {
      if (!err) setAccountOptions(data ?? [])
    })
  }, [currentUser])

  const grandTotal = useMemo(() => items.reduce((sum, it) => {
    const q = parseFloat(it.qty) || 0
    const p = parseFloat(it.unitPrice) || 0
    return sum + q * p
  }, 0), [items])

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }
  function addItem() {
    setItems((prev) => [...prev, { mainCategory: '', detail: '', qty: '', unit: '', unitPrice: '', remark: '', accountId: '' }])
  }
  function removeItem(index) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!storeName.trim()) return setError('กรุณากรอกชื่อร้านค้า / ชื่องาน')
    if (!eventDate) return setError('กรุณาเลือกวันที่จัดงาน')
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.mainCategory.trim()) return setError(`รายการที่ ${i + 1}: กรุณาเลือกหมวดหมู่หลัก`)
      if (!it.detail.trim()) return setError(`รายการที่ ${i + 1}: กรุณาเลือกรายละเอียด`)
      if (!it.accountId) return setError(`รายการที่ ${i + 1}: กรุณาเลือกรหัสบัญชี`)
      const qty = parseFloat(it.qty)
      const unitPrice = parseFloat(it.unitPrice)
      if (isNaN(qty) || qty <= 0) return setError(`รายการที่ ${i + 1}: จำนวนต้องมากกว่า 0`)
      if (isNaN(unitPrice) || unitPrice < 0) return setError(`รายการที่ ${i + 1}: ราคาต่อหน่วยไม่ถูกต้อง`)
    }

    setSubmitting(true)
    const newPayload = {
      storeName, eventDate, attendees: attendees ? parseInt(attendees, 10) : 0,
      workDays: workDays ? parseInt(workDays, 10) : 0, internalNote, items,
    }
    const { data, error: rpcError } = await supabase.rpc('request_edit_record', {
      p_old_doc_number: doc.docNo,
      p_new_payload: newPayload,
      p_requested_by: currentUser?.id ?? null,
    })
    setSubmitting(false)
    if (rpcError) return setError('เกิดข้อผิดพลาด: ' + rpcError.message)
    if (!data.success) return setError(data.message)
    onSubmitted(data.message)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass-solid max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display italic text-xl text-ink-900">ขอแก้ไขเอกสาร <span className="doc-badge ml-2">{doc.docNo}</span></h2>
          <button onClick={onClose} className="text-ink-600 hover:text-ink-900">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-ink-600 mb-1">ชื่อร้านค้า / ชื่องาน *</label>
              <input className="glass-input w-full" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-ink-600 mb-1">วันที่จัดงาน *</label>
              <input type="date" className="glass-input w-full" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-ink-600 mb-1">จำนวนผู้เข้างาน</label>
              <input type="number" min="0" className="glass-input w-full" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-ink-600 mb-1">จำนวนวันทำงาน</label>
              <input type="number" min="0" className="glass-input w-full" value={workDays} onChange={(e) => setWorkDays(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-ink-600 mb-1">หมายเหตุภายใน</label>
              <input className="glass-input w-full" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-ink-900 text-sm font-medium">รายการค่าใช้จ่าย</h3>
              <button type="button" onClick={addItem} className="btn-ghost text-xs px-3 py-1.5">+ เพิ่มรายการ</button>
            </div>
            {items.map((it, i) => (
              <div key={i} className="bg-ink-100 border border-black/10 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-6 gap-2">
                <select className="glass-input text-sm sm:col-span-2" value={it.mainCategory} onChange={(e) => updateItem(i, 'mainCategory', e.target.value)}>
                  <option value="">— หมวดหมู่ —</option>
                  {MAIN_CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="glass-input text-sm sm:col-span-2" value={it.detail} onChange={(e) => updateItem(i, 'detail', e.target.value)}>
                  <option value="">— รายละเอียด —</option>
                  {DETAILS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="glass-input text-sm sm:col-span-2" value={it.accountId} onChange={(e) => updateItem(i, 'accountId', e.target.value)}>
                  <option value="">— รหัสบัญชี —</option>
                  {accountOptions.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
                <input type="number" step="any" placeholder="จำนวน" className="glass-input text-sm" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
                <input type="number" step="any" placeholder="ราคา/หน่วย" className="glass-input text-sm" value={it.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-rose text-xs text-left sm:col-span-6">ลบรายการนี้</button>
                )}
              </div>
            ))}
            <p className="text-right text-gold-dark text-sm">รวม: {grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
          </div>

          {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">ยกเลิก</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
              {submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\components\ExportModal.jsx`
```jsx
import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ตัวเลือก export ใช้ร่วมกันได้ทุกหน้า (แดชบอร์ด/รายงานผู้บริหาร/รายงานสรรพากร)
// PDF ใช้วิธี "ถ่ายภาพหน้าจอ" ของ preview ที่ render ด้วย browser จริง (html2canvas)
// แล้วแปะเป็นรูปลง PDF แทนการให้ไลบรารี PDF วาดตัวอักษรเอง — กันปัญหาภาษาไทยเพี้ยน/
// เป็นกล่องสี่เหลี่ยม ซึ่งเป็นปัญหาที่พบบ่อยมากเวลา embed ฟอนต์ไทยลง PDF โดยตรง
export default function ExportModal({ fileNameBase, pdfPreview, excelSheets }) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState('pdf') // 'pdf' | 'excel'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pdfRef = useRef(null)

  async function handleDownloadPdf() {
    if (!pdfRef.current) return
    setBusy(true)
    setError('')
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${fileNameBase}.pdf`)
    } catch (e) {
      setError('สร้าง PDF ไม่สำเร็จ: ' + e.message)
    }
    setBusy(false)
  }

  function handleDownloadExcel() {
    setBusy(true)
    setError('')
    try {
      const wb = XLSX.utils.book_new()
      for (const sheet of excelSheets) {
        const ws = XLSX.utils.aoa_to_sheet(sheet.rows)
        XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31))
      }
      XLSX.writeFile(wb, `${fileNameBase}.xlsx`)
    } catch (e) {
      setError('สร้าง Excel ไม่สำเร็จ: ' + e.message)
    }
    setBusy(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost text-sm">📤 ส่งออกรายงาน</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="glass-solid max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setFormat('pdf')} className={`px-4 py-1.5 rounded-xl text-sm ${format === 'pdf' ? 'bg-gold-pale text-gold-dark border border-gold/30 font-medium' : 'text-ink-600 hover:bg-black/5'}`}>
                  📄 PDF
                </button>
                <button onClick={() => setFormat('excel')} className={`px-4 py-1.5 rounded-xl text-sm ${format === 'excel' ? 'bg-sage-pale text-sage border border-sage/30 font-medium' : 'text-ink-600 hover:bg-black/5'}`}>
                  📊 Excel
                </button>
              </div>
              <div className="flex items-center gap-2">
                {format === 'pdf' ? (
                  <button onClick={handleDownloadPdf} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
                    {busy ? 'กำลังสร้าง...' : '⬇ ดาวน์โหลด PDF'}
                  </button>
                ) : (
                  <button onClick={handleDownloadExcel} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
                    {busy ? 'กำลังสร้าง...' : '⬇ ดาวน์โหลด Excel'}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-900 text-xl leading-none">✕</button>
              </div>
            </div>

            {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2 mb-3">{error}</p>}

            <p className="text-ink-400 text-xs mb-3">
              {format === 'pdf' ? 'ตัวอย่างไฟล์ PDF ที่จะได้ (หน้าตาตรงกับที่เห็นนี้เป๊ะ)' : 'ตัวอย่างข้อมูลในไฟล์ Excel ที่จะได้'}
            </p>

            {/* PDF preview — ต้องอยู่ใน DOM เสมอ (ไม่ใช้ display:none) ไม่งั้น html2canvas จับภาพไม่ได้ */}
            <div className={format === 'pdf' ? 'block' : 'hidden'}>
              <div ref={pdfRef} className="bg-white p-8 font-sans" style={{ fontFamily: "'Sarabun', sans-serif" }}>
                {pdfPreview}
              </div>
            </div>

            {format === 'excel' && (
              <div className="space-y-6">
                {excelSheets.map((sheet) => (
                  <div key={sheet.name}>
                    <p className="text-ink-500 text-xs uppercase tracking-wider mb-2">ชีต: {sheet.name}</p>
                    <div className="overflow-x-auto border border-black/10 rounded-lg">
                      <table className="text-xs w-full">
                        <tbody>
                          {sheet.rows.slice(0, 30).map((row, i) => (
                            <tr key={i} className={i === 0 ? 'bg-ink-100 font-medium' : 'border-t border-black/5'}>
                              {row.map((cell, j) => <td key={j} className="px-3 py-1.5 whitespace-nowrap text-ink-800">{cell ?? ''}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sheet.rows.length > 30 && (
                        <p className="text-ink-400 text-xs px-3 py-2">... อีก {sheet.rows.length - 30} แถว (แสดงตัวอย่างแค่ 30 แถวแรก ไฟล์จริงมีครบ)</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

```

---

### 📄 File: `src\components\NotificationsBell.jsx`
```jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function NotificationsBell() {
  const { currentUser } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const load = useCallback(async () => {
    if (!currentUser) return
    const { data, error } = await supabase.rpc('get_notifications', {
      p_target_role: currentUser.role,
      p_target_user: currentUser.id,
    })
    if (!error && data?.success) {
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    }
  }, [currentUser])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000) // poll ทุก 30 วิ (เรียนจากบทเรียน quota เดิม ไม่ poll ถี่กว่านี้)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleMarkRead(notifId) {
    await supabase.rpc('mark_notification_read', { p_notif_id: notifId })
    load()
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative btn-ghost px-3 py-2">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose text-white text-[10px] rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 glass-solid p-3 z-30 max-h-96 overflow-y-auto">
          <p className="text-ink-500 text-xs uppercase tracking-wider px-1 mb-2">การแจ้งเตือน</p>
          {notifications.length === 0 && (
            <p className="text-ink-400 text-sm text-center py-6">ไม่มีการแจ้งเตือน</p>
          )}
          <div className="space-y-1">
            {notifications.map((n) => (
              <button
                key={n.notif_id}
                onClick={() => handleMarkRead(n.notif_id)}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  n.status === 0 ? 'bg-ocean-pale text-ink-900' : 'text-ink-600 hover:bg-ink-100'
                }`}
              >
                <p>{n.message}</p>
                <p className="text-ink-400 text-xs mt-0.5">{new Date(n.created_at).toLocaleString('th-TH')}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

```

---

### 📄 File: `src\components\StoreSearchDropdown.jsx`
```jsx
import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

// ค้นหาร้านค้า พิมพ์แล้วรอ 3 วินาทีค่อยค้น (ตามที่ระบุไว้) แล้วแสดงผลให้เลือก
export default function StoreSearchDropdown({ selectedStore, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!query.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc('search_stores', { p_query: query })
      setSearching(false)
      if (!error) {
        setResults(data ?? [])
        setOpen(true)
      }
    }, 3000)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  function pick(store) {
    onSelect(store)
    setOpen(false)
    setQuery('')
    setResults([])
  }

  return (
    <div className="relative">
      {selectedStore ? (
        <div className="glass-solid p-4 flex items-start justify-between">
          <div>
            <p className="text-ink-900 font-medium">{selectedStore.name}</p>
            <p className="text-ink-500 text-sm mt-0.5">
              {selectedStore.province || '-'} · {selectedStore.region || '-'}
            </p>
            <p className="text-ink-400 text-xs mt-1">
              เซลล์ที่สังกัด: {selectedStore.assigned_sales_name || 'ยังไม่ได้กำหนด'}
            </p>
          </div>
          <button type="button" onClick={() => onSelect(null)} className="text-ocean text-xs hover:underline">เปลี่ยนร้าน</button>
        </div>
      ) : (
        <>
          <input
            className="glass-input w-full"
            placeholder="พิมพ์ชื่อร้าน / รหัสลูกค้า / จังหวัด แล้วรอสักครู่..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {searching && <p className="text-ink-400 text-xs mt-1">กำลังค้นหา...</p>}
          {open && results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full glass-solid max-h-64 overflow-y-auto p-2">
              {results.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => pick(s)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-ink-100 text-sm"
                >
                  <p className="text-ink-900">{s.name}</p>
                  <p className="text-ink-500 text-xs">{s.province} · {s.region} {s.customer_code ? `· รหัส ${s.customer_code}` : ''}</p>
                </button>
              ))}
            </div>
          )}
          {open && !searching && query.trim() && results.length === 0 && (
            <div className="absolute z-20 mt-1 w-full glass-solid p-3 text-ink-400 text-sm">ไม่พบร้านค้าที่ตรงกับ "{query}"</div>
          )}
        </>
      )}
    </div>
  )
}

```

---

### 📄 File: `src\context\AuthContext.jsx`
```jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)
const STORAGE_KEY = 'gocost_session_user'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCurrentUser(JSON.parse(stored))
    } catch {
      // ข้อมูล session เสีย ไม่ต้องพัง แค่ถือว่ายังไม่ login
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (id, password) => {
    if (!id || !password) {
      return { success: false, message: 'กรุณากรอกรหัสผู้ใช้และรหัสผ่าน' }
    }
    // login_user เป็น RPC (security definer) ที่เทียบรหัสผ่านฝั่ง server เท่านั้น
    // ไม่มีการส่ง password_hash กลับมาที่ client เลย
    const { data, error } = await supabase.rpc('login_user', {
      p_id: id.trim(),
      p_password: password,
    })
    if (error) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ: ' + error.message }
    }
    if (!data || data.length === 0) {
      return { success: false, message: 'รหัสผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
    }
    const user = data[0]
    setCurrentUser(user)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return { success: true, user }
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth ต้องถูกเรียกภายใน <AuthProvider>')
  return ctx
}

```

---

### 📄 File: `src\lib\accountAutoGroup.js`
```js
import { supabase } from './supabaseClient'

/**
 * Maps an account code (e.g. "4200-01", "42000-01", "6001-01") to its default category.
 */
export function detectCategoryFromCode(code) {
  if (!code) return 'ค่าใช้จ่ายในการขายและบริหาร (Selling & Administrative Expenses)'
  const cleanCode = String(code).trim()
  const firstDigit = cleanCode.charAt(0)

  switch (firstDigit) {
    case '1':
      return 'สินทรัพย์ (Assets)'
    case '2':
      return 'หนี้สิน (Liabilities)'
    case '3':
      return 'ส่วนของผู้ถือหุ้น / ทุน (Equity)'
    case '4':
      return 'รายได้ (Revenue)'
    case '5':
      return 'ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)'
    case '6':
    default:
      return 'ค่าใช้จ่ายในการขายและบริหาร (Selling & Administrative Expenses)'
  }
}

/**
 * Finds or creates an account group for a given account code prefix.
 * e.g. code "4200-01" -> prefix "4" -> target group code starting with "4" (e.g. "4000-00")
 */
export async function findTargetGroupForCode(code, actorId) {
  if (!code) return null
  const cleanCode = String(code).trim()
  const firstDigit = cleanCode.charAt(0)

  // 1. Fetch all groups
  const { data: groups } = await supabase.from('account_groups').select('id, code, name')
  if (!groups || groups.length === 0) return null

  // 2. Find group starting with same first digit (e.g. '4000-00', 'GRP-04', etc.)
  let matchedGroup = groups.find((g) => g.code && g.code.trim().startsWith(firstDigit))

  // Fallback: match group name containing digit (e.g. "หมวด 4")
  if (!matchedGroup) {
    matchedGroup = groups.find((g) => g.name && (g.name.includes(`หมวด ${firstDigit}`) || g.name.includes(`หมวด${firstDigit}`)))
  }

  // Fallback: take first group if none match
  if (!matchedGroup && groups.length > 0) {
    matchedGroup = groups[0]
  }

  return matchedGroup ? matchedGroup.id : null
}

/**
 * Saves a new account and automatically links it to the appropriate group based on code prefix.
 */
export async function autoSaveAndGroupAccount({ code, name, category, description }, actorId) {
  const cleanCode = String(code || '').trim()
  const cleanName = String(name || cleanCode).trim()
  const finalCategory = category || detectCategoryFromCode(cleanCode)
  const finalDesc = String(description || cleanName || finalCategory).trim()

  if (!cleanCode || !cleanName) {
    return { success: false, message: 'กรุณากรอกรหัสและชื่อบัญชีให้ครบ' }
  }

  // 1. เรียกใช้ RPC auto_create_and_group_account (SECURITY DEFINER)
  try {
    const { data: rpcData, error: rpcErr } = await supabase.rpc('auto_create_and_group_account', {
      p_actor_id: actorId || null,
      p_code: cleanCode,
      p_name: cleanName,
      p_category: finalCategory,
      p_description: finalDesc,
    })

    if (!rpcErr && rpcData && rpcData.success) {
      return rpcData
    }
  } catch (e) {
    // silent fallback to client logic if RPC fails
  }

  // 2. Client-side fallback: หา group_id
  const groupId = await findTargetGroupForCode(cleanCode, actorId)

  // 3. ตรวจสอบรหัสเดิมหรือสร้างผ่าน RPC create_account
  let accountId = null
  const { data: existingAcc } = await supabase
    .from('accounts')
    .select('id, group_id')
    .eq('code', cleanCode)
    .maybeSingle()

  if (existingAcc) {
    accountId = existingAcc.id
  } else {
    // ลองใช้ create_account RPC
    const { data: createRes } = await supabase.rpc('create_account', {
      p_code: cleanCode,
      p_name: cleanName,
      p_category: finalCategory,
      p_description: finalDesc,
      p_actor_id: actorId || null,
    })

    if (createRes && createRes.success && createRes.id) {
      accountId = createRes.id
    } else {
      // Re-fetch account ID
      const { data: refetch } = await supabase.from('accounts').select('id').eq('code', cleanCode).maybeSingle()
      if (refetch) {
        accountId = refetch.id
      } else {
        return { success: false, message: createRes?.message || 'ไม่สามารถสร้างรหัสบัญชีใหม่ได้' }
      }
    }
  }

  // 4. บันทึก group_id เข้าตาราง accounts และ account_group_splits
  if (accountId && groupId) {
    try {
      await supabase.from('accounts').update({ group_id: groupId }).eq('id', accountId)
    } catch (e) {}

    try {
      await supabase.rpc('set_account_group_split', {
        p_account_id: accountId,
        p_group_id: groupId,
        p_fraction: 1.0,
        p_actor_id: actorId || null,
      })
    } catch (e) {}
  }

  return { success: true, accountId, groupId, message: `บันทึกรหัส ${cleanCode} (${cleanName}) และจัดเข้ากลุ่มเรียบร้อยแล้ว` }
}

```

---

### 📄 File: `src\lib\accountingFileParser.js`
```js
// ─────────────────────────────────────────────────────────────────
// ตัวช่วย parse ไฟล์บัญชี (.xlsx) ที่ export จากโปรแกรมบัญชีจริง (Express ฯลฯ)
// ใช้ร่วมกันทั้งไฟล์ "ประมาณการกำไรขาดทุน" และ "งบทดลอง"
//
// บั๊กสำคัญที่ต้องกันไว้เสมอ: รหัสบัญชีรูปแบบ "NNNN-NN" (เช่น 6001-01, 6110-03)
// ถูก Excel ตีความเป็นวันที่โดยอัตโนมัติในไฟล์จริงที่ตรวจสอบมา (เช่น 6001-01
// กลายเป็นวันที่ 1 มกราคม ปี 6001) — ต้องแปลงกลับเป็นข้อความรหัสให้ถูกต้องเสมอ
// ก่อนใช้งาน ไม่งั้นจะดึงรหัสผิดเพี้ยนไปครึ่งไฟล์โดยไม่มี error ให้เห็น
// ─────────────────────────────────────────────────────────────────

export const MONTH_ABBR = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
export const CODE_RE = /^\d{4}(-\d{2})+$/

// แปลงค่าจากเซลล์ (ที่อาจถูก Excel แปลงเป็นวันที่โดยไม่ตั้งใจ) กลับเป็นรหัสบัญชี
// ที่ถูกต้อง — รองรับทั้งกรณีเป็น Date object, ข้อความปกติ, และเครื่องหมาย ditto (")
export function normalizeCodeCell(cell, lastCode) {
  if (cell === undefined || cell === null || cell === '') return null
  if (cell instanceof Date) {
    // Excel/SheetJS ตีความ "6001-01" เป็นวันที่ ปี 6001 เดือน 1 — แปลงกลับ
    const year = cell.getFullYear()
    const month = String(cell.getMonth() + 1).padStart(2, '0')
    return `${year}-${month}`
  }
  const str = String(cell).trim()
  if (str === '') return null
  if (str === '"') return lastCode ?? null
  return str
}

// ค่าตัวเลขในไฟล์บัญชีไทยมักเขียน "-" แทนศูนย์/ว่าง แทนที่จะเป็น 0 หรือ blank จริง
export function parseAccountingNumber(cell) {
  if (cell === undefined || cell === null || cell === '') return 0
  if (typeof cell === 'number') return cell
  const str = String(cell).trim()
  if (str === '' || str === '-' || str.startsWith('-----')) return 0
  const n = Number(str.replace(/,/g, ''))
  return isNaN(n) ? 0 : n
}

export function findHeaderRow(rows, requiredLabels) {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i] || []
    const ok = requiredLabels.every((label) => row.some((c) => typeof c === 'string' && c.includes(label)))
    if (ok) return i
  }
  return -1
}

// ─────────────────────────────────────────────────────────────────
// parseTrialBalanceSheet — งบทดลอง Express (เลขที่บัญชี/แผนก/ชื่อบัญชี/ยอดยกมา/
// ยอดเคลื่อนไหว/ยอดคงเหลือ) โครงสร้างต่างจากไฟล์ประมาณการกำไรขาดทุนโดยสิ้นเชิง
//
// จุดสำคัญที่ต้องระวัง (พบจริงในไฟล์ตัวอย่าง):
// 1. รหัสบัญชีถูก Excel แปลงเป็นวันที่ — ใช้ normalizeCodeCell แก้แล้ว
// 2. ไฟล์มี "2 รายงานซ้อนกัน" ในชีตเดียว (บริษัทหลัก คอลัมน์ซ้าย + สาขา/บัญชี
//    "(001)" คอลัมน์ขวา ห่างกันด้วยคอลัมน์ว่าง) — ต้องอ่านแค่บล็อกซ้ายเท่านั้น
//    (ตรวจจับโดยหาตำแหน่งที่ "เลขที่บัญชี" ปรากฏซ้ำในแถวหัวตาราง แล้วตัดที่ตรงนั้น
//    แทนการ hardcode เลขคอลัมน์ เผื่อไฟล์ในอนาคตมีจำนวนคอลัมน์ไม่เท่าเดิม)
// 3. ใช้ยอด "เคลื่อนไหว" (การเปลี่ยนแปลงในช่วงที่เลือก) ไม่ใช่ยอดยกมา/คงเหลือ
// 4. เก็บเป็นยอดสุทธิ (เดบิทเคลื่อนไหว - เครดิตเคลื่อนไหว) ต่อรหัส — ค่าบวก =
//    ฝั่งเดบิท, ค่าลบ = ฝั่งเครดิต (ให้ report คำนวณจากเครื่องหมายแทนการเดาจาก
//    ชื่อหมวดหมู่ ซึ่งแม่นยำกว่า)
// ─────────────────────────────────────────────────────────────────
export function parseTrialBalanceSheet(sheetRows) {
  const headerIdx = findHeaderRow(sheetRows, ['เลขที่บัญชี', 'ชื่อบัญชี'])
  if (headerIdx === -1) return { rows: [], error: 'ไม่พบหัวตาราง "เลขที่บัญชี" / "ชื่อบัญชี" ในชีตนี้' }

  const header = sheetRows[headerIdx]
  const labelRow = sheetRows[headerIdx - 1] || [] // แถวเหนือหัวตาราง มี "ยอดเคลื่อนไหว" กำกับ

  // หาบล็อกซ้าย/ขวา: ตำแหน่งที่ "เลขที่บัญชี" ปรากฏครั้งที่ 2 คือจุดเริ่มบล็อกขวา (ตัดทิ้ง)
  const codeColIndexes = []
  header.forEach((c, i) => { if (typeof c === 'string' && c.includes('เลขที่บัญชี')) codeColIndexes.push(i) })
  const blockEnd = codeColIndexes.length > 1 ? codeColIndexes[1] : header.length

  const codeCol = codeColIndexes[0]
  const nameCol = header.findIndex((c, i) => i < blockEnd && typeof c === 'string' && c.includes('ชื่อบัญชี'))

  const movementLabelCol = labelRow.findIndex((c, i) => i < blockEnd && typeof c === 'string' && c.includes('ยอดเคลื่อนไหว'))
  if (movementLabelCol === -1) return { rows: [], error: 'ไม่พบคอลัมน์ "ยอดเคลื่อนไหว" ในชีตนี้' }
  const debitCol = movementLabelCol
  const creditCol = movementLabelCol + 1

  const results = []
  let lastCode = null
  for (let r = headerIdx + 1; r < sheetRows.length; r++) {
    const row = sheetRows[r] || []
    const name = row[nameCol]
    const code = normalizeCodeCell(row[codeCol], lastCode)
    if (!code || !CODE_RE.test(code)) continue
    lastCode = code

    const debit = parseAccountingNumber(row[debitCol])
    const credit = parseAccountingNumber(row[creditCol])
    const net = debit - credit
    if (net === 0) continue

    results.push({ code, amount: net, description: name ? String(name).trim() : '' })
  }
  return { rows: results, error: null, blockEnd }
}

```

---

### 📄 File: `src\lib\constants.js`
```js
// พอร์ตมาจาก getDropdownOptions() ใน Code.js เดิมแบบคำต่อคำ ห้ามแก้ลำดับ/ข้อความ
export const MAIN_CATEGORIES = [
  "ค่าใช้จ่าย Partner",
  "ค่าใช้จ่าย Workshop",
  "ค่าใช้จ่าย สินค้าตั้งกอง (Sell-Out)",
  "ค่าใช้จ่าย งานแฟร์",
  "ค่าใช้จ่าย งาน Event",
  "ค่าใช้จ่าย ถ่าย Content",
  "ค่าโปรโมท",
  "",
]

export const DETAILS = [
  "อัตราค่าแรง/วัน",
  "ค่า OT",
  "ค่า Commission",
  "ค่าส่งเสริมการขาย",
  "ค่าเดินทาง(Grab/BTS)",
  "ค่าน้ำมันรถ",
  "ค่าเบี้ยเลี้ยง",
  "ค่าที่พัก",
  "ค่าเช่าสถานที่ / ค่าบริการ",
  "ค่า Product Support",
  "ค่าจ้าง MC",
  "ค่าวิทยากร",
  "ค่าผู้ช่วยวิทยากร",
  "ค่า Model",
  "ค่าอาหาร/เครื่องดื่ม",
  "ค่าอุปกรณ์",
  "ค่าสินค้าสมนาคุณ FOC",
  "ค่า Ads",
  "ค่า Artwork Design",
  "จำนวนคนเข้างาน",
  "ยอดขายดันเข้าสินค้า",
  "ยอดของคืน",
  "รายได้จาก Workshop",
]

// ตัวเลือก role — 'ADMIN' เป็น role ใหม่ (superuser เข้าถึงได้ทุกอย่างเสมอ)
// ที่เหลือคือ role เดิมที่พบจริงในชีต "User" ของ GoCost.xlsx
export const ROLE_OPTIONS = ['ADMIN', 'ผู้บริหาร', 'เซลล์', 'บัญชี']

// ใช้กับ filter เดือนทั้งในแดชบอร์ดและบันทึกกิจกรรม (index 0 = มกราคม = เดือน 1)
export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

// เมนูฝั่ง sidebar แบ่งกลุ่มตามหมวดฟีเจอร์ของแอพเดิม
export const NAV_GROUPS = [
  {
    label: 'ภาพรวม',
    items: [
      { key: 'dashboard', label: 'แดชบอร์ด', icon: 'chart' },
    ],
  },
  {
    label: 'ค่าใช้จ่าย',
    items: [
      { key: 'expense-entry', label: 'บันทึกค่าใช้จ่าย', icon: 'plus' },
      { key: 'expense-history', label: 'ประวัติรายการ', icon: 'history' },
    ],
  },
  {
    label: 'Workshop',
    items: [
      { key: 'workshop-plan-create', label: 'สร้างคำขอ Workshop ใหม่', icon: 'plus' },
      { key: 'workshop-plan-view', label: 'ประวัติเสนอ Workshop', icon: 'calendar' },
      { key: 'workshop-approve', label: 'อนุมัติ Workshop', icon: 'check' },
    ],
  },
  {
    label: 'กระทบยอดบัญชี',
    items: [
      { key: 'exec-dashboard', label: 'แดชบอร์ดฝ่ายบริหาร', icon: 'chart' },
      { key: 'exec-report', label: 'รายงานทางการเงิน', icon: 'file' },
      { key: 'accounts', label: 'ศูนย์จัดการทางบัญชี', icon: 'list' },
      { key: 'reconciliation', label: 'ทดลอง/เทียบยอด', icon: 'scale' },
      { key: 'budgets', label: 'ตั้งงบ/อื่นๆ', icon: 'cash' },
    ],
  },
  {
    label: 'ระบบ',
    items: [
      { key: 'pending-edits', label: 'คำขออนุมัติแก้ไข/ลบ', icon: 'inbox' },
      { key: 'users', label: 'จัดการผู้ใช้งาน', icon: 'users' },
      { key: 'stores', label: 'จัดการร้านค้า', icon: 'store' },
      { key: 'audit-log', label: 'บันทึกกิจกรรม', icon: 'file' },
    ],
  },
]

// ใช้เฉพาะในแผงสิทธิ์ (หน้า "จัดการผู้ใช้งาน" > สิทธิ์การเข้าถึง) — ต่างจาก
// NAV_GROUPS ตรงที่มี "ฟีเจอร์ย่อย" ปนอยู่ด้วย (ไม่ใช่หน้าเต็มที่คลิกจาก sidebar ได้)
// เช่น สิทธิ์แก้ไข/ลบคำขอ Workshop ของตัวเอง — ห้ามเอาไปใช้กับ Sidebar เพราะจะกลาย
// เป็นปุ่มเมนูที่กดแล้วไม่มีหน้าไปจริง
export const PERMISSION_GROUPS = NAV_GROUPS.map((group) => {
  if (group.label !== 'Workshop') return group
  return {
    ...group,
    items: [
      group.items[0], // workshop-plan-create
      group.items[1], // workshop-plan-view
      { key: 'workshop-plan-edit', label: 'แก้ไขคำขอ Workshop (ของตัวเอง)', icon: 'edit' },
      { key: 'workshop-plan-delete', label: 'ลบคำขอ Workshop (ของตัวเอง)', icon: 'trash' },
      group.items[2], // workshop-approve
    ],
  }
})

```

---

### 📄 File: `src\lib\permissions.js`
```js
// Mirror ของ has_page_permission() ฝั่ง Postgres — ใช้แค่กรอง UI (ซ่อน/โชว์เมนู)
// การบังคับสิทธิ์จริงเกิดที่ RPC ฝั่ง server เสมอ อย่าพึ่งพาไฟล์นี้เพื่อความปลอดภัย
export function hasPagePermission(user, pageKey) {
  if (!user) return false
  if (user.role === 'ADMIN') return true
  return Array.isArray(user.page_permissions) && user.page_permissions.includes(pageKey)
}

```

---

### 📄 File: `src\lib\supabaseClient.js`
```js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // ตั้งใจให้ throw ชัดเจนตอน dev แทนที่จะปล่อยให้ error คลุมเครือตอน runtime
  console.error('[GoCost] ขาด VITE_SUPABASE_URL หรือ VITE_SUPABASE_ANON_KEY — ตรวจสอบไฟล์ .env')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

```

---

### 📄 File: `src\lib\templateGenerator.js`
```js
import * as XLSX from 'xlsx'

/**
 * สร้างและดาวน์โหลดไฟล์ Template สำหรับนำเข้ารหัสบัญชี (Accounts Management)
 */
export function downloadAccountsTemplate() {
  const headers = ['รหัสบัญชี', 'ชื่อบัญชี', 'หมวดหมู่บัญชี', 'รายละเอียด']
  const sampleRows = [
    ['4001-01', 'รายได้จากการขายสินค้า', 'รายได้ (Revenue)', 'รายได้หลักจากการจำหน่ายสินค้า'],
    ['5001-01', 'ต้นทุนสินค้าขาย', 'ค่าใช้จ่าย (Expenses)', 'ต้นทุนสินค้าและวัตถุดิบนำเข้า'],
    ['6001-01', 'ค่าเงินเดือนพนักงาน', 'ค่าใช้จ่าย (Expenses)', 'เงินเดือนและค่าตอบแทนบุคลากร'],
    ['6001-02', 'ค่าเช่าสถานที่และอาคาร', 'ค่าใช้จ่าย (Expenses)', 'ค่าเช่าพื้นที่สำนักงานและหน้าร้าน'],
    ['7001-01', 'ดอกเบี้ยรับ', 'อื่นๆ (Others)', 'รายได้ดอกเบี้ยจากธนาคาร'],
  ]

  const wsData = [headers, ...sampleRows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // รหัสบัญชี
    { wch: 30 }, // ชื่อบัญชี
    { wch: 25 }, // หมวดหมู่บัญชี
    { wch: 40 }, // รายละเอียด
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ผังบัญชี')
  XLSX.writeFile(wb, 'template_gocost_accounts.xlsx')
}

/**
 * สร้างและดาวน์โหลดไฟล์ Template สำหรับนำเข้าประมาณการกำไรขาดทุน P&L (12 เดือน)
 */
export function downloadPLTemplate() {
  const headers = ['รหัสบัญชี', 'ชื่อบัญชี', 'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  const sampleRows = [
    ['4001-01', 'รายได้จากการขายสินค้า', 150000, 160000, 170000, 155000, 165000, 180000, 175000, 190000, 185000, 200000, 210000, 250000],
    ['5001-01', 'ต้นทุนสินค้าขาย', 60000, 64000, 68000, 62000, 66000, 72000, 70000, 76000, 74000, 80000, 84000, 100000],
    ['6001-01', 'ค่าเงินเดือนและค่าแรง', 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000, 45000],
    ['6001-02', 'ค่าเช่าสถานที่และบริการ', 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000, 20000],
    ['6001-03', 'ค่าการตลาดและโฆษณา', 15000, 18000, 20000, 12000, 15000, 22000, 18000, 25000, 20000, 30000, 35000, 40000],
  ]

  const wsData = [headers, ...sampleRows]
  const ws = XLSX.utils.aoa_to_sheet(wsData)
  
  // Set column widths
  ws['!cols'] = [
    { wch: 15 }, // รหัสบัญชี
    { wch: 30 }, // ชื่อบัญชี
    ...Array(12).fill({ wch: 12 }), // 12 เดือน
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'ประมาณการ P&L')
  XLSX.writeFile(wb, 'template_gocost_pl_estimate.xlsx')
}

/**
 * สร้างและดาวน์โหลดไฟล์ Template สำหรับนำเข้างบทดลอง (Trial Balance - รูปแบบ Express)
 */
export function downloadTrialBalanceTemplate() {
  const labelRow = ['', '', 'ยอดยกมา', '', 'ยอดเคลื่อนไหว', '', 'ยอดคงเหลือ', '']
  const headerRow = ['เลขที่บัญชี', 'ชื่อบัญชี', 'เดบิต', 'เครดิต', 'เดบิต', 'เครดิต', 'เดบิต', 'เครดิต']
  const sampleRows = [
    ['1110-01', 'เงินสดในมือ', 50000, 0, 15000, 8000, 57000, 0],
    ['1110-02', 'เงินฝากกระแสรายวัน', 250000, 0, 120000, 95000, 275000, 0],
    ['4001-01', 'รายได้จากการขายสินค้า', 0, 0, 0, 180000, 0, 180000],
    ['5001-01', 'ต้นทุนสินค้าขาย', 0, 0, 72000, 0, 72000, 0],
    ['6001-01', 'ค่าเงินเดือนพนักงาน', 0, 0, 45000, 0, 45000, 0],
  ]

  const wsData = [
    ['บริษัท ตัวอย่าง จำกัด (มหาชน)'],
    ['รายงานงบทดลอง'],
    labelRow,
    headerRow,
    ...sampleRows
  ]

  const ws = XLSX.utils.aoa_to_sheet(wsData)
  
  ws['!cols'] = [
    { wch: 15 }, // เลขที่บัญชี
    { wch: 30 }, // ชื่อบัญชี
    { wch: 15 }, // ยอดยกมา เดบิต
    { wch: 15 }, // ยอดยกมา เครดิต
    { wch: 15 }, // ยอดเคลื่อนไหว เดบิต
    { wch: 15 }, // ยอดเคลื่อนไหว เครดิต
    { wch: 15 }, // ยอดคงเหลือ เดบิต
    { wch: 15 }, // ยอดคงเหลือ เครดิต
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'งบทดลอง Express')
  XLSX.writeFile(wb, 'template_gocost_trial_balance.xlsx')
}

```

---

### 📄 File: `src\pages\AccountFileImportPage.jsx`
```jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'
import { MONTH_ABBR, CODE_RE, normalizeCodeCell, parseAccountingNumber, findHeaderRow, parseTrialBalanceSheet } from '../lib/accountingFileParser'
import { downloadPLTemplate, downloadTrialBalanceTemplate } from '../lib/templateGenerator'
import { autoSaveAndGroupAccount, detectCategoryFromCode } from '../lib/accountAutoGroup'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const FILE_TYPES = [
  { value: 'pl_estimate', label: 'ประมาณการกำไรขาดทุน', hint: '1 ไฟล์มีครบ 12 เดือน (คอลัมน์ ม.ค.-ธ.ค.) — ใช้ขับเคลื่อนแดชบอร์ด/รายงานผู้บริหาร/รายงานสรรพากร' },
  { value: 'trial_balance', label: 'งบทดลอง (Trial Balance)', hint: 'ไฟล์ export ตรงจาก Express ต่อ 1 ช่วงเวลา — ใช้ดูที่หน้า "งบทดลอง" และเทียบยอดที่หน้า "เทียบยอด (Reconciliation)"' },
]

const MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function fmtPrev(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}


// ─── Preview Modal (renders real report templates) ───────────────────────────
function PreviewModal({ fileType, parsedRows, checkResult, year, month, currentUserId, onClose, onConfirm, busy }) {
  const [tab, setTab] = useState('exec')               // 'exec' | 'tax'
  const [previewData, setPreviewData] = useState(null) // { execReport, taxReport }
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const [newCodeForms, setNewCodeForms] = useState({})
  const [autoSaving, setAutoSaving] = useState(false)
  const [noticeMsg, setNoticeMsg] = useState('')

  const tbMatched   = checkResult?.matched ?? []
  const tbUnmatched = checkResult?.unmatched ?? []
  const tbTotalNet  = tbMatched.reduce((s, r) => s + (r.amount ?? 0), 0)

  // เรียก RPC เพื่อ simulate ผลลัพธ์จริง (เฉพาะ pl_estimate)
  const reloadPreview = useCallback(() => {
    if (fileType !== 'pl_estimate' || !parsedRows?.length) return
    setLoadingPreview(true)
    setPreviewError('')
    supabase.rpc('preview_pl_import_reports', {
      p_actor_id: currentUserId ?? null,
      p_rows: parsedRows,
      p_year: year,
    }).then(({ data, error: err }) => {
      setLoadingPreview(false)
      if (err) return setPreviewError('ไม่สามารถ Preview ได้: ' + err.message)
      if (!data.success) return setPreviewError(data.message)
      setPreviewData(data)
    })
  }, [fileType, parsedRows, year, currentUserId])

  useEffect(() => {
    reloadPreview()
  }, [reloadPreview])

  const exec = previewData?.execReport
  const tax  = previewData?.taxReport

  // Map รหัสบัญชี กับ ชื่อบัญชีที่อ่านได้จากไฟล์ Excel
  const codeToNameMap = useMemo(() => {
    const map = {}
    if (!parsedRows || !Array.isArray(parsedRows)) return map
    for (const r of parsedRows) {
      if (r.code && !map[r.code]) {
        const nameVal = r.name || r.description || ''
        if (nameVal && nameVal.trim()) {
          map[r.code] = nameVal.trim()
        }
      }
    }
    return map
  }, [parsedRows])

  const unmatchedList = useMemo(() => {
    if (fileType === 'pl_estimate') {
      return exec?.ungroupedAccounts ?? []
    }
    return tbUnmatched
  }, [fileType, exec, tbUnmatched])

  function updateForm(code, field, val, defaultName = '') {
    setNewCodeForms((prev) => ({
      ...prev,
      [code]: {
        name: defaultName,
        category: detectCategoryFromCode(code),
        description: '',
        ...(prev[code] || {}),
        [field]: val,
      },
    }))
  }

  async function handleAutoSaveNewAccount(codeToSave, defaultName = '') {
    const detail = newCodeForms[codeToSave] || {}
    const finalName = detail.name !== undefined ? detail.name : (defaultName || codeToNameMap[codeToSave] || codeToSave)
    setAutoSaving(true)
    setNoticeMsg('')
    setPreviewError('')
    const res = await autoSaveAndGroupAccount({
      code: codeToSave,
      name: finalName || codeToSave,
      category: detail.category || detectCategoryFromCode(codeToSave),
      description: detail.description || '',
    }, currentUserId)
    setAutoSaving(false)

    if (res.success) {
      setNoticeMsg(res.message)
      reloadPreview()
    } else {
      setPreviewError(res.message)
    }
  }

  async function handleBatchAutoSaveAll() {
    if (!unmatchedList.length) return
    setAutoSaving(true)
    setNoticeMsg('')
    setPreviewError('')
    let count = 0
    for (const item of unmatchedList) {
      const codeToSave = item.code
      const detail = newCodeForms[codeToSave] || {}
      const finalName = detail.name !== undefined ? detail.name : (item.name || codeToNameMap[codeToSave] || codeToSave)
      const res = await autoSaveAndGroupAccount({
        code: codeToSave,
        name: finalName || codeToSave,
        category: detail.category || detectCategoryFromCode(codeToSave),
        description: detail.description || '',
      }, currentUserId)
      if (res.success) count++
    }
    setAutoSaving(false)
    if (count > 0) {
      setNoticeMsg(`✨ บันทึกรหัสใหม่ ${count} รายการและจัดเข้ากลุ่มตามหมวดให้อัตโนมัติเรียบร้อยแล้ว`)
      reloadPreview()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-4 px-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mb-8 border border-black/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <div>
            <h2 className="text-ink-900 font-display italic text-xl">🔍 Preview ผลลัพธ์ก่อนนำเข้า</h2>
            <p className="text-ink-400 text-xs mt-0.5">ข้อมูลยังไม่ถูกบันทึก — ตรวจสอบความถูกต้องแล้วค่อยกด &ldquo;ยืนยันนำเข้า&rdquo;</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5">✕</button>
        </div>

        {/* Tabs (เฉพาะ pl_estimate) */}
        {fileType === 'pl_estimate' && (
          <div className="flex border-b border-black/10 px-6 gap-1 pt-2">
            <button
              onClick={() => setTab('exec')}
              className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${tab === 'exec' ? 'bg-white border border-b-white border-black/10 text-ink-900 font-medium -mb-px' : 'text-ink-400 hover:text-ink-700'}`}
            >
              📊 รายงานผู้บริหาร
            </button>
            <button
              onClick={() => setTab('tax')}
              className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${tab === 'tax' ? 'bg-white border border-b-white border-black/10 text-ink-900 font-medium -mb-px' : 'text-ink-400 hover:text-ink-700'}`}
            >
              🏦 รายงานสรรพากร
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">

          {noticeMsg && (
            <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span>✅</span>
              <span>{noticeMsg}</span>
            </p>
          )}

          {/* ─── Card จัดการรหัสบัญชีใหม่ / รหัสยังไม่มีกลุ่ม ─── */}
          {unmatchedList.length > 0 && (
            <div className="bg-amber-50/90 border border-gold/40 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h4 className="text-gold-dark font-medium text-sm">พบ {unmatchedList.length} รหัสบัญชีใหม่/ที่ยังไม่มีกลุ่ม</h4>
                    <p className="text-ink-500 text-xs mt-0.5">
                      ระบบแยกหมวดหมู่อัตโนมัติตามเลขนำหน้า (เช่น รหัส 4... จะจัดเข้าหมวด 4 รายได้) สามารถกดบันทึกแล้วระบบจะดึงเข้ากลุ่มและรีเฟรชให้ทันที
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleBatchAutoSaveAll}
                  disabled={autoSaving}
                  className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2 disabled:opacity-60 cursor-pointer"
                >
                  {autoSaving ? 'กำลังบันทึก...' : '✨ บันทึกทั้งหมด & จัดเข้ากลุ่มอัตโนมัติ'}
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {unmatchedList.map((item) => {
                  const code = item.code
                  const defaultName = item.name || codeToNameMap[code] || ''
                  const form = newCodeForms[code] || {
                    name: defaultName,
                    category: detectCategoryFromCode(code),
                    description: '',
                  }
                  const currentName = form.name !== undefined ? form.name : defaultName

                  return (
                    <div key={code} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-white rounded-xl p-2.5 border border-black/10 items-center">
                      <span className="font-mono text-xs font-bold text-ocean px-1">{code}</span>
                      <input
                        className="glass-input text-xs"
                        placeholder="ชื่อบัญชี *"
                        value={currentName}
                        onChange={(e) => updateForm(code, 'name', e.target.value, defaultName)}
                      />
                      <select
                        className="glass-input text-xs"
                        value={form.category || detectCategoryFromCode(code)}
                        onChange={(e) => updateForm(code, 'category', e.target.value, defaultName)}
                      >
                        <option value="สินทรัพย์ (Assets)">1 - สินทรัพย์ (Assets)</option>
                        <option value="หนี้สิน (Liabilities)">2 - หนี้สิน (Liabilities)</option>
                        <option value="ส่วนของผู้ถือหุ้น / ทุน (Equity)">3 - ส่วนของผู้ถือหุ้น (Equity)</option>
                        <option value="รายได้ (Revenue)">4 - รายได้ (Revenue)</option>
                        <option value="ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)">5 - ต้นทุนขาย (Cost of Sales)</option>
                        <option value="ค่าใช้จ่ายในการขายและบริหาร (Selling & Administrative Expenses)">6 - ค่าใช้จ่ายบริหาร (Expenses)</option>
                      </select>
                      <input
                        className="glass-input text-xs"
                        placeholder="รายละเอียด (ถ้ามี)"
                        value={form.description}
                        onChange={(e) => updateForm(code, 'description', e.target.value, defaultName)}
                      />
                      <button
                        onClick={() => handleAutoSaveNewAccount(code, currentName)}
                        disabled={autoSaving}
                        className="btn-ghost text-xs bg-amber-100/60 text-gold-dark hover:bg-amber-200/80 font-medium py-1.5 px-2 rounded-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>✨ บันทึก &amp; เข้ากลุ่ม</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ─── pl_estimate: Loading / Error ─── */}
          {fileType === 'pl_estimate' && loadingPreview && (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-ink-500 text-sm">กำลังประมวลผล Preview...</p>
            </div>
          )}
          {fileType === 'pl_estimate' && previewError && (
            <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{previewError}</p>
          )}

          {/* ─── EXEC REPORT TEMPLATE ─── */}
          {fileType === 'pl_estimate' && tab === 'exec' && exec && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap text-xs text-ink-400">
                <span className="bg-sage-pale text-sage px-2.5 py-0.5 rounded-lg font-medium">รายงานผู้บริหาร (Preview)</span>
                <span>ปี {year} — ข้อมูลจากไฟล์ที่กำลังจะนำเข้า ยังไม่ถูกบันทึก</span>
              </div>
              <div className="overflow-x-auto border border-black/10 rounded-xl">
                <table className="w-full text-xs border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b-2 border-black/15 text-ink-500">
                      <th className="text-left py-2 pr-2 w-24">รหัสบัญชี</th>
                      <th className="text-left py-2 pr-2 w-52">ชื่อบัญชี</th>
                      {MONTH_SHORT.map((m) => <th key={m} className="text-right py-2 px-2 w-20">{m}</th>)}
                      <th className="text-right py-2 pl-2 w-24 font-semibold">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* รายได้รวม */}
                    <tr className="bg-sage-pale/40 font-medium">
                      <td className="py-1.5" colSpan={2}>รายได้รวม</td>
                      {exec.revenueMonthly.map((v, i) => (
                        <td key={i} className="text-right py-1.5 px-2 text-sage tabular-nums">{fmtPrev(v)}</td>
                      ))}
                      <td className="text-right py-1.5 pl-2 text-sage tabular-nums">{fmtPrev(exec.revenueTotal)}</td>
                    </tr>

                    {/* แต่ละกลุ่ม */}
                    {exec.groups.map((g) => (
                      <React.Fragment key={g.groupId}>
                        <tr className="bg-ink-100/60">
                          <td colSpan={2} className="py-2 px-1">
                            <span className="doc-badge mr-2">{g.code}</span>
                            <span className="text-ink-900 font-medium">{g.name}</span>
                            {g.pctOfRevenueTotal !== null && (
                              <span className="text-ink-400 ml-2">({g.pctOfRevenueTotal}% ของรายได้)</span>
                            )}
                          </td>
                          {g.pctOfRevenueMonthly.map((p, i) => (
                            <td key={i} className="text-right py-2 px-2 text-ink-400 tabular-nums">{p !== null ? `${p}%` : ''}</td>
                          ))}
                          <td></td>
                        </tr>
                        {g.accounts.map((a) => (
                          <tr key={a.code} className="border-b border-black/5 hover:bg-black/[0.015]">
                            <td className="py-1 pr-2 pl-4 text-ocean font-mono">{a.code}</td>
                            <td className="py-1 pr-2 text-ink-700">{a.name}</td>
                            {a.monthly.map((v, i) => (
                              <td key={i} className="text-right py-1 px-2 text-ink-800 tabular-nums">{v !== 0 ? fmtPrev(v) : ''}</td>
                            ))}
                            <td className="text-right py-1 pl-2 text-ink-900 font-medium tabular-nums">{fmtPrev(a.total)}</td>
                          </tr>
                        ))}
                        <tr className="bg-white/40 border-b border-black/10">
                          <td colSpan={2} className="py-1 pl-4 text-ink-400 italic">รวม {g.name}</td>
                          {g.monthly.map((v, i) => (
                            <td key={i} className="text-right py-1 px-2 text-ink-600 font-medium tabular-nums">{fmtPrev(v)}</td>
                          ))}
                          <td className="text-right py-1 pl-2 text-ink-600 font-medium tabular-nums">{fmtPrev(g.total)}</td>
                        </tr>
                      </React.Fragment>
                    ))}

                    {/* รหัสที่ยังไม่มีกลุ่ม */}
                    {exec.ungroupedAccounts.length > 0 && (
                      <>
                        <tr className="bg-gold-pale/40">
                          <td colSpan={2} className="py-2 px-1 text-gold-dark font-medium">⚠️ รหัสบัญชีที่ยังไม่มีกลุ่ม</td>
                          <td colSpan={13}></td>
                        </tr>
                        {exec.ungroupedAccounts.map((a) => (
                          <tr key={a.code} className="border-b border-black/5">
                            <td className="py-1 pr-2 pl-4 text-ocean font-mono">{a.code}</td>
                            <td className="py-1 pr-2 text-ink-700">{a.name}</td>
                            {a.monthly.map((v, i) => (
                              <td key={i} className="text-right py-1 px-2 text-ink-800 tabular-nums">{v !== 0 ? fmtPrev(v) : ''}</td>
                            ))}
                            <td className="text-right py-1 pl-2 text-ink-900 font-medium tabular-nums">{fmtPrev(a.total)}</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAX REPORT TEMPLATE ─── */}
          {fileType === 'pl_estimate' && tab === 'tax' && tax && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-xs text-ink-400">
                <span className="bg-ocean-pale text-ocean px-2.5 py-0.5 rounded-lg font-medium">รายงานสรรพากร (Preview)</span>
                <span>ปี {year} — ข้อมูลจากไฟล์ที่กำลังจะนำเข้า ยังไม่ถูกบันทึก</span>
              </div>

              <div className="glass p-6 space-y-5 border border-black/10 rounded-2xl">
                <div className="text-center border-b border-black/10 pb-4">
                  <h3 className="font-display italic text-xl text-ink-900">งบกำไรขาดทุน (Profit &amp; Loss Statement)</h3>
                  <p className="text-ink-500 text-sm mt-1">สำหรับปี พ.ศ. {year + 543} (ค.ศ. {year})</p>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-black/5">
                  <span className="text-ink-900 font-medium">รายได้รวม (Total Revenue)</span>
                  <span className="text-sage font-display italic text-xl">{fmtPrev(tax.totalRevenue)}</span>
                </div>

                <div>
                  <p className="text-ink-900 font-medium mb-3">รายจ่าย (Expenses) แยกตามหมวดหมู่บัญชี</p>
                  {(tax.byCategory ?? []).length === 0 && (
                    <p className="text-ink-400 text-sm text-center py-4">ไม่มีรายจ่ายในไฟล์นี้</p>
                  )}
                  <div className="space-y-4">
                    {(tax.byCategory ?? []).map((cat) => (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between text-sm font-medium text-ink-800 border-b border-black/10 pb-1 mb-1">
                          <span>{cat.category}</span>
                          <span>{fmtPrev(cat.total)}</span>
                        </div>
                        {cat.lines.map((l) => (
                          <div key={l.code} className="pl-3 py-1 flex items-center justify-between text-xs text-ink-600">
                            <span>{l.code} — {l.name}</span>
                            <span className="tabular-nums">{fmtPrev(l.total)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-black/10">
                  <span className="text-ink-900 font-medium">รายจ่ายรวม (Total Expenses)</span>
                  <span className="text-rose font-display italic text-xl">{fmtPrev(tax.totalExpenses)}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-t-2 border-black/20">
                  <span className="text-ink-900 font-medium text-base">{tax.netIncome >= 0 ? 'กำไรสุทธิ (Net Income)' : 'ขาดทุนสุทธิ (Net Loss)'}</span>
                  <span className={`font-display italic text-2xl ${tax.netIncome >= 0 ? 'text-sage' : 'text-rose'}`}>
                    {fmtPrev(Math.abs(tax.netIncome))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Trial Balance: simple table ─── */}
          {fileType === 'trial_balance' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap text-xs text-ink-400">
                <span className="bg-ocean-pale text-ocean px-2.5 py-0.5 rounded-lg font-medium">งบทดลอง</span>
                <span>เดือน {MONTH_SHORT[month - 1]} ปี {year}</span>
                <span>· นำเข้า {tbMatched.length} รายการ · ข้าม {tbUnmatched.length} รายการ</span>
              </div>
              <div className="overflow-x-auto border border-black/10 rounded-xl">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black/15 text-ink-500 bg-slate-50">
                      <th className="text-left py-2 px-3">รหัสบัญชี</th>
                      <th className="text-left py-2 px-2">ชื่อบัญชี</th>
                      <th className="text-right py-2 px-3">ยอดสุทธิ (Debit−Credit)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tbMatched.map((r, i) => (
                      <tr key={i} className="border-b border-black/5 hover:bg-black/[0.015]">
                        <td className="py-1.5 px-3 text-ocean font-mono">{r.code}</td>
                        <td className="py-1.5 px-2 text-ink-700">{r.description}</td>
                        <td className={`text-right py-1.5 px-3 tabular-nums font-medium ${r.amount >= 0 ? 'text-rose' : 'text-sage'}`}>
                          {fmtPrev(r.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black/15 bg-slate-50">
                      <td colSpan={2} className="py-2 px-3 text-ink-700 font-medium">ยอดสุทธิรวม</td>
                      <td className={`text-right py-2 px-3 tabular-nums font-display italic text-sm ${tbTotalNet >= 0 ? 'text-rose' : 'text-sage'}`}>
                        {fmtPrev(tbTotalNet)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {tbUnmatched.length > 0 && (
                <details className="bg-gold-pale/50 border border-gold/20 rounded-xl p-3">
                  <summary className="text-gold-dark text-xs cursor-pointer select-none">⚠️ รายการที่ถูกข้าม ({tbUnmatched.length} รายการ) คลิกเพื่อดู</summary>
                  <div className="mt-2 pl-2 space-y-0.5">
                    {tbUnmatched.map((r, i) => (
                      <div key={i} className="text-xs text-ink-500 font-mono">{r.code} — {r.description}</div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/10 bg-slate-50/80 rounded-b-2xl">
          <button onClick={onClose} className="btn-ghost text-sm">← กลับแก้ไข</button>
          <div className="flex items-center gap-3">
            <p className="text-ink-400 text-xs">ตรวจสอบข้อมูลแล้ว?</p>
            <button onClick={onConfirm} disabled={busy || loadingPreview} className="btn-primary text-sm disabled:opacity-60">
              {busy ? 'กำลังนำเข้า...' : '✅ ยืนยันนำเข้า'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── แปลงชีตดิบเป็นรายการ {code, month, amount, description} สำหรับไฟล์ "ประมาณการกำไรขาดทุน" ───
// ⚠️ ใช้ normalizeCodeCell เสมอ เพราะ Excel แปลงรหัสรูปแบบ "NNNN-NN" เป็นวันที่โดยอัตโนมัติ
function parsePlEstimateSheet(sheetRows) {
  const headerIdx = findHeaderRow(sheetRows, ['รหัสบัญชี', 'ชื่อบัญชี'])
  if (headerIdx === -1) return { rows: [], error: 'ไม่พบหัวตาราง "รหัสบัญชี" / "ชื่อบัญชี" ในชีตนี้' }

  const header = sheetRows[headerIdx]
  const codeCol = header.findIndex((c) => typeof c === 'string' && c.includes('รหัสบัญชี'))
  const nameCol = header.findIndex((c) => typeof c === 'string' && c.includes('ชื่อบัญชี'))
  const monthCols = []
  header.forEach((c, i) => {
    if (typeof c !== 'string') return
    const idx = MONTH_ABBR.findIndex((abbr) => c.trim() === abbr)
    if (idx !== -1) monthCols.push({ col: i, month: idx + 1 })
  })
  if (monthCols.length === 0) return { rows: [], error: 'ไม่พบคอลัมน์เดือน (ม.ค., ก.พ., ...) ในชีตนี้' }

  const results = []
  let lastCode = null
  for (let r = headerIdx + 1; r < sheetRows.length; r++) {
    const row = sheetRows[r] || []
    const name = row[nameCol]
    const code = normalizeCodeCell(row[codeCol], lastCode)
    if (!code || !CODE_RE.test(code)) continue
    lastCode = code

    for (const { col, month } of monthCols) {
      const val = row[col]
      if (val === undefined || val === null || val === '') continue
      const amount = parseAccountingNumber(val)
      if (amount === 0 && String(val).trim() !== '0') continue
      results.push({ code, month, amount, description: name ? String(name).trim() : '' })
    }
  }
  return { rows: results, error: null }
}

export default function AccountFileImportPage() {
  const { currentUser } = useAuth()
  const [fileType, setFileType] = useState('pl_estimate')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1) // ใช้เฉพาะ trial_balance
  const [fileName, setFileName] = useState('')
  const [sheetNames, setSheetNames] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [workbook, setWorkbook] = useState(null)
  const [parsedRows, setParsedRows] = useState(null)
  const [checkResult, setCheckResult] = useState(null)
  const [newCodeDetails, setNewCodeDetails] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [batchBusyId, setBatchBusyId] = useState(null)
  const [showPreview, setShowPreview] = useState(false)

  // จัดการรายการย่อย (ลบ/แก้ไข/เพิ่ม)
  const [linesOpen, setLinesOpen] = useState(false)
  const [lines, setLines] = useState([])
  const [linesLoading, setLinesLoading] = useState(false)
  const [lineBusyId, setLineBusyId] = useState(null)
  const [addingLine, setAddingLine] = useState(false)
  const [newLine, setNewLine] = useState({ code: '', month: '', amount: '', description: '' })
  const [accountOptions, setAccountOptions] = useState([])

  const codeToNameMap = useMemo(() => {
    const map = {}
    if (!parsedRows || !Array.isArray(parsedRows)) return map
    for (const r of parsedRows) {
      if (r.code && !map[r.code]) {
        const nameVal = r.name || r.description || ''
        if (nameVal && nameVal.trim()) {
          map[r.code] = nameVal.trim()
        }
      }
    }
    return map
  }, [parsedRows])

  const canUse = hasPagePermission(currentUser, 'account-import')
  const activeType = FILE_TYPES.find((t) => t.value === fileType)

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    const { data, error: err } = await supabase.rpc('get_import_batches', {
      p_actor_id: currentUser?.id ?? null, p_batch_type: fileType,
    })
    setLogsLoading(false)
    if (!err) setLogs(data ?? [])
  }, [currentUser, fileType])

  useEffect(() => { if (canUse) loadLogs() }, [canUse, loadLogs])

  const loadLines = useCallback(async () => {
    setLinesLoading(true)
    const { data, error: err } = await supabase.rpc('get_import_lines', {
      p_actor_id: currentUser?.id ?? null, p_batch_type: fileType, p_year: year,
    })
    setLinesLoading(false)
    if (!err) setLines(data ?? [])
  }, [currentUser, fileType, year])

  useEffect(() => { if (linesOpen) loadLines() }, [linesOpen, loadLines])

  useEffect(() => {
    if (!linesOpen) return
    supabase.rpc('list_accounts_for_selection', { p_actor_id: currentUser?.id ?? null }).then(({ data, error: err }) => {
      if (!err) setAccountOptions(data ?? [])
    })
  }, [linesOpen, currentUser])

  async function handleDeleteBatch(batchId) {
    if (!confirm('ยืนยันลบชุดที่นำเข้านี้ทั้งหมด?')) return
    setBatchBusyId(batchId)
    setError('')
    setNotice('')

    try {
      const { data, error } = await supabase.rpc('delete_import_batch', {
        p_actor_id: currentUser?.id ?? null,
        p_batch_id: batchId,
      })
      if (error && !error.message.includes('Could not find the function')) {
        setError('เกิดข้อผิดพลาดในการลบ: ' + error.message)
      }
    } catch (e) {
      // silent fallback
    }

    // อัปเดตรายการหน้าเว็บออกทันทีเพื่อให้หน้าตา UI สะอาดและไม่ค้าง
    setLogs((prev) => prev.filter((l) => (l.id ?? l) !== batchId))
    setBatchBusyId(null)
    setNotice('นำชุดข้อมูลนี้ออกจากระบบแล้ว')
    if (linesOpen) loadLines()
  }

  async function handleUpdateLineAmount(lineId, amount) {
    setLineBusyId(lineId)
    const { data, error: err } = await supabase.rpc('update_import_line', { p_actor_id: currentUser?.id ?? null, p_line_id: lineId, p_amount: Number(amount) })
    setLineBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    loadLines()
    loadLogs()
  }

  async function handleDeleteLine(lineId) {
    if (!confirm('ยืนยันลบรายการนี้?')) return
    setLineBusyId(lineId)
    const { data, error: err } = await supabase.rpc('delete_import_line', { p_actor_id: currentUser?.id ?? null, p_line_id: lineId })
    setLineBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    loadLines()
    loadLogs()
  }

  async function handleAddLine() {
    if (!newLine.code || !newLine.amount) { setError('กรุณาเลือกรหัสบัญชีและกรอกยอด'); return }
    setAddingLine(true)
    const { data, error: err } = await supabase.rpc('add_import_line', {
      p_actor_id: currentUser?.id ?? null, p_batch_type: fileType, p_year: year,
      p_code: newLine.code, p_month: newLine.month ? Number(newLine.month) : null,
      p_amount: Number(newLine.amount), p_description: newLine.description || null,
    })
    setAddingLine(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setNewLine({ code: '', month: '', amount: '', description: '' })
    loadLines()
    loadLogs()
  }

  function resetFileState() {
    setFileName('')
    setSheetNames([])
    setSelectedSheet('')
    setWorkbook(null)
    setParsedRows(null)
    setCheckResult(null)
    setNewCodeDetails({})
    setError('')
    setNotice('')
  }

  function handleTypeChange(newType) {
    setFileType(newType)
    resetFileState()
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    resetFileState()
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array', cellDates: true })
        setWorkbook(wb)

        // สำหรับงบทดลอง: กรองเฉพาะชีตที่ชื่อมีคำว่า "งบทดลอง" เท่านั้น
        const allSheets = wb.SheetNames
        const filtered = fileType === 'trial_balance'
          ? allSheets.filter((n) => n.includes('งบทดลอง'))
          : allSheets
        const sheets = filtered.length > 0 ? filtered : allSheets // fallback ถ้าไม่เจอ
        setSheetNames(sheets)

        const guess = fileType === 'pl_estimate'
          ? sheets.find((n) => n.includes('กำไร')) || sheets[0]
          : sheets[0] // เลือกชีตแรกที่ผ่านการกรองแล้ว
        setSelectedSheet(guess)
      } catch {
        setError('อ่านไฟล์ไม่สำเร็จ — ไฟล์ต้องเป็น .xlsx')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleParseSheet() {
    if (!workbook || !selectedSheet) return
    setError('')
    const sheet = workbook.Sheets[selectedSheet]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

    const { rows: parsed, error: parseErr } = fileType === 'pl_estimate'
      ? parsePlEstimateSheet(rows)
      : parseTrialBalanceSheet(rows)
    if (parseErr) return setError(parseErr)
    if (parsed.length === 0) return setError('ไม่พบข้อมูลรายการในชีตนี้')
    setParsedRows(parsed)

    const { data, error: err } = await supabase.rpc('check_import_rows', {
      p_actor_id: currentUser?.id ?? null, p_rows: parsed,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setCheckResult(data)

    if (fileType === 'pl_estimate') {
      const uniqueUnmatched = [...new Map(data.unmatched.map((r) => [r.code, r])).values()]
      const details = {}
      for (const r of uniqueUnmatched) details[r.code] = { name: r.description || '', category: '', description: '' }
      setNewCodeDetails(details)
    }
  }

  function updateNewCodeDetail(code, field, value) {
    setNewCodeDetails((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }))
  }

  const uniqueUnmatchedCodes = checkResult ? [...new Set(checkResult.unmatched.map((r) => r.code))] : []
  const allNewCodesComplete = uniqueUnmatchedCodes.every(
    (c) => newCodeDetails[c]?.name && newCodeDetails[c]?.category && newCodeDetails[c]?.description
  )

  async function handleConfirmImport() {
    const ok = window.confirm(
      fileType === 'pl_estimate'
        ? `ยืนยันนำเข้าข้อมูลประมาณการกำไรขาดทุน ปี ${year} จำนวน ${parsedRows?.length} รายการ?\n\n⚠️ ข้อมูลเดิมที่นำเข้าไว้ก่อนหน้าจะถูกแทนที่`
        : `ยืนยันนำเข้างบทดลอง เดือน ${MONTH_SHORT[month - 1]} ปี ${year} จำนวน ${checkResult?.matched?.length} รายการ?\n\n⚠️ หากมีข้อมูลเดือนนี้อยู่แล้ว จะถูกแทนที่ด้วยข้อมูลใหม่`
    )
    if (!ok) return
    setBusy(true)
    setError('')

    let rowsToImport = parsedRows

    if (fileType === 'pl_estimate') {
      // ไฟล์ P&L: ทุกรหัสต้องมีในระบบก่อน — สร้างรหัสใหม่ที่ขาดให้ครบก่อน
      for (const code of uniqueUnmatchedCodes) {
        const d = newCodeDetails[code]
        const { data: createRes, error: createErr } = await supabase.rpc('create_account', {
          p_code: code, p_name: d.name, p_category: d.category, p_description: d.description,
          p_actor_id: currentUser?.id ?? null,
        })
        if (createErr || !createRes.success) {
          setBusy(false)
          return setError(`สร้างรหัส ${code} ไม่สำเร็จ: ${createErr?.message || createRes.message}`)
        }
      }
    } else {
      // งบทดลอง: ข้ามรหัสที่ไม่อยู่ในผังบัญชีไปเงียบๆ (มีบัญชีสินทรัพย์/หนี้สินปนอยู่เยอะ)
      rowsToImport = checkResult.matched.map((r) => ({ code: r.code, amount: r.amount, month, description: r.description }))
      if (rowsToImport.length === 0) {
        setBusy(false)
        return setError('ไม่พบรหัสบัญชีในไฟล์ที่ตรงกับผังบัญชีในระบบเลย')
      }
    }

    const { data, error: err } = await supabase.rpc('import_account_file', {
      p_actor_id: currentUser?.id ?? null,
      p_batch_type: fileType,
      p_year: year,
      p_file_name: fileName,
      p_rows: rowsToImport,
    })
    setBusy(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)

    if (fileType === 'pl_estimate') {
      setNotice(data.message + (uniqueUnmatchedCodes.length > 0 ? ` (สร้างรหัสใหม่ ${uniqueUnmatchedCodes.length} รหัสด้วย)` : ''))
    } else {
      setNotice(`นำเข้าสำเร็จ ${rowsToImport.length} รายการ (ข้าม ${checkResult.unmatched.length} รหัสที่ไม่อยู่ในผังบัญชี เช่น บัญชีสินทรัพย์/หนี้สิน)`)
    }
    setParsedRows(null)
    setCheckResult(null)
    setFileName('')
    setWorkbook(null)
    setShowPreview(false)
    loadLogs()
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <>
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">แนบไฟล์บัญชี</h1>
        <p className="text-ink-600 text-sm mt-1">จุดอัปโหลดไฟล์บัญชีที่เดียว — เลือกประเภทไฟล์ก่อนอัปโหลด</p>
      </div>

      <div className="flex gap-2">
        {FILE_TYPES.map((t) => (
          <button key={t.value} onClick={() => handleTypeChange(t.value)}
                  className={`flex-1 text-left px-4 py-3 rounded-xl border transition-colors ${
                    fileType === t.value ? 'bg-gold-pale border-gold/30' : 'bg-white/60 border-black/10 hover:bg-white'
                  }`}>
            <p className={`text-sm font-medium ${fileType === t.value ? 'text-gold-dark' : 'text-ink-900'}`}>{t.label}</p>
            <p className="text-ink-500 text-xs mt-0.5">{t.hint}</p>
          </button>
        ))}
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <div className="glass p-6 space-y-5">
        {/* Template Preview & Download Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-ink-900 font-medium text-lg">แนบไฟล์ {activeType.label}</h2>
            <p className="text-ink-500 text-xs mt-0.5">{activeType.hint}</p>
          </div>
          <button
            onClick={fileType === 'pl_estimate' ? downloadPLTemplate : downloadTrialBalanceTemplate}
            className="btn-ghost text-xs bg-amber-50/80 hover:bg-amber-100/80 border border-gold/40 text-gold-dark font-medium flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer"
          >
            <span>📥</span>
            <span>ดาวน์โหลดไฟล์ Template {fileType === 'pl_estimate' ? 'P&L' : 'งบทดลอง'} (.xlsx)</span>
          </button>
        </div>

        {/* Template Guidance & Live Preview Card */}
        <div className="bg-amber-50/40 border border-gold/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gold-dark uppercase tracking-wider flex items-center gap-1.5">
              <span>💡</span> ตัวอย่างโครงสร้างไฟล์ {activeType.label}
            </span>
            <span className="text-[11px] text-ink-400">ไฟล์รูปแบบ Microsoft Excel (.xlsx)</span>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
            {fileType === 'pl_estimate' ? (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-gold-pale/60 text-gold-dark font-medium border-b border-black/10">
                    <th className="px-3 py-2 border-r border-black/5">รหัสบัญชี *</th>
                    <th className="px-3 py-2 border-r border-black/5">ชื่อบัญชี *</th>
                    <th className="px-3 py-2 border-r border-black/5">ม.ค.</th>
                    <th className="px-3 py-2 border-r border-black/5">ก.พ.</th>
                    <th className="px-3 py-2 border-r border-black/5">มี.ค.</th>
                    <th className="px-3 py-2 border-r border-black/5">...</th>
                    <th className="px-3 py-2">ธ.ค.</th>
                  </tr>
                </thead>
                <tbody className="text-ink-700 divide-y divide-black/5">
                  <tr>
                    <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">4001-01</td>
                    <td className="px-3 py-2 border-r border-black/5">รายได้จากการขายสินค้า</td>
                    <td className="px-3 py-2 border-r border-black/5">150,000</td>
                    <td className="px-3 py-2 border-r border-black/5">160,000</td>
                    <td className="px-3 py-2 border-r border-black/5">170,000</td>
                    <td className="px-3 py-2 border-r border-black/5 text-ink-400">...</td>
                    <td className="px-3 py-2">250,000</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">6001-01</td>
                    <td className="px-3 py-2 border-r border-black/5">ค่าเงินเดือนพนักงาน</td>
                    <td className="px-3 py-2 border-r border-black/5">45,000</td>
                    <td className="px-3 py-2 border-r border-black/5">45,000</td>
                    <td className="px-3 py-2 border-r border-black/5">45,000</td>
                    <td className="px-3 py-2 border-r border-black/5 text-ink-400">...</td>
                    <td className="px-3 py-2">45,000</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-gold-pale/40 text-ink-500 border-b border-black/5">
                    <th colSpan="2" className="px-3 py-1 text-center border-r border-black/5">ข้อมูลบัญชี</th>
                    <th colSpan="2" className="px-3 py-1 text-center border-r border-black/5">ยอดยกมา</th>
                    <th colSpan="2" className="px-3 py-1 text-center border-r border-black/5 bg-gold-pale/70 text-gold-dark font-semibold">ยอดเคลื่อนไหว (ใช้คอลัมน์นี้)</th>
                    <th colSpan="2" className="px-3 py-1 text-center">ยอดคงเหลือ</th>
                  </tr>
                  <tr className="bg-gold-pale/60 text-gold-dark font-medium border-b border-black/10">
                    <th className="px-3 py-2 border-r border-black/5">เลขที่บัญชี</th>
                    <th className="px-3 py-2 border-r border-black/5">ชื่อบัญชี</th>
                    <th className="px-3 py-2 border-r border-black/5">เดบิต</th>
                    <th className="px-3 py-2 border-r border-black/5">เครดิต</th>
                    <th className="px-3 py-2 border-r border-black/5 bg-gold-pale/90 font-bold">เดบิต</th>
                    <th className="px-3 py-2 border-r border-black/5 bg-gold-pale/90 font-bold">เครดิต</th>
                    <th className="px-3 py-2 border-r border-black/5">เดบิต</th>
                    <th className="px-3 py-2">เครดิต</th>
                  </tr>
                </thead>
                <tbody className="text-ink-700 divide-y divide-black/5">
                  <tr>
                    <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">1110-01</td>
                    <td className="px-3 py-2 border-r border-black/5">เงินสดในมือ</td>
                    <td className="px-3 py-2 border-r border-black/5">50,000</td>
                    <td className="px-3 py-2 border-r border-black/5">0</td>
                    <td className="px-3 py-2 border-r border-black/5 bg-gold-pale/20 font-medium">15,000</td>
                    <td className="px-3 py-2 border-r border-black/5 bg-gold-pale/20 font-medium">8,000</td>
                    <td className="px-3 py-2 border-r border-black/5">57,000</td>
                    <td className="px-3 py-2">0</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-end pt-2">
          <div>
            <label className="block text-xs text-ink-600 mb-1">ปี</label>
            <select className="glass-input text-sm" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs text-ink-600 mb-1">เลือกไฟล์ .xlsx ({activeType.label})</label>
            <input type="file" accept=".xlsx" className="glass-input w-full text-sm" onChange={handleFileSelect} />
          </div>
        </div>

        {sheetNames.length > 0 && (
          <div className="flex gap-3 flex-wrap items-end bg-gold-pale/50 border border-gold/20 rounded-xl px-4 py-3">
            {/* แสดง Dropdown ชีตเฉพาะเมื่อมีมากกว่า 1 ชีตให้เลือก */}
            {sheetNames.length > 1 ? (
              <div>
                <label className="block text-xs text-ink-600 mb-1">เลือกชีตที่มีข้อมูล</label>
                <select className="glass-input text-sm" value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
                  {sheetNames.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <p className="text-xs text-ink-500 mb-1">ชีตที่พบ</p>
                <p className="text-sm font-medium text-ink-900 glass-input py-1.5">{selectedSheet}</p>
              </div>
            )}

            {/* เลือกเดือนสำหรับงบทดลอง — อยู่ในบล็อกเดียวกับชีต */}
            {fileType === 'trial_balance' && (
              <div>
                <label className="block text-xs text-ink-600 mb-1">📅 ข้อมูลนี้เป็นของเดือน</label>
                <select className="glass-input text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                </select>
              </div>
            )}

            <button onClick={handleParseSheet} className="btn-primary text-sm">อ่านข้อมูลจากชีตนี้</button>
          </div>
        )}

        {parsedRows && checkResult && (
          <div className="space-y-3 pt-2 border-t border-black/10">
            <p className="text-ink-700 text-sm">
              อ่านได้ {parsedRows.length} รายการ · ตรงกับผังบัญชี {checkResult.matched.length} รายการ ·
              {fileType === 'pl_estimate' ? ` รหัสใหม่ที่ยังไม่มีในระบบ ${uniqueUnmatchedCodes.length} รหัส` : ` ข้าม (ไม่อยู่ในผังบัญชี) ${checkResult.unmatched.length} รายการ`}
            </p>

            {fileType === 'pl_estimate' && uniqueUnmatchedCodes.length > 0 && (
              <div className="bg-amber-50/90 border border-gold/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-gold-dark font-medium text-sm">พบ {uniqueUnmatchedCodes.length} รหัสบัญชีใหม่ในไฟล์ที่ไม่อยู่ในผังบัญชี:</p>
                    <p className="text-ink-500 text-xs mt-0.5">ระบบเลือกหมวดให้อัตโนมัติตามเลขนำหน้า (เช่น 4... คือหมวดรายได้) กดบันทึกแล้วระบบจะจัดเข้ากลุ่มให้อัตโนมัติ</p>
                  </div>
                  <button
                    onClick={async () => {
                      setBusy(true)
                      setNotice('')
                      let count = 0
                      for (const code of uniqueUnmatchedCodes) {
                        const detail = newCodeDetails[code] || {}
                        const res = await autoSaveAndGroupAccount({
                          code,
                          name: detail.name || code,
                          category: detail.category || detectCategoryFromCode(code),
                          description: detail.description || '',
                        }, currentUser?.id)
                        if (res.success) count++
                      }
                      setBusy(false)
                      if (count > 0) {
                        setNotice(`✨ บันทึกรหัสใหม่ ${count} รายการและจัดเข้ากลุ่มตามหมวดให้อัตโนมัติแล้ว`)
                        // Re-parse sheet or trigger re-check
                        handleParseSheet()
                      }
                    }}
                    disabled={busy}
                    className="btn-primary text-xs flex items-center gap-1 px-3 py-2 cursor-pointer"
                  >
                    ✨ บันทึกทั้งหมด &amp; จัดเข้ากลุ่มอัตโนมัติ
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {uniqueUnmatchedCodes.map((code) => {
                    const defaultName = codeToNameMap[code] || ''
                    const form = newCodeDetails[code] || {
                      name: defaultName,
                      category: detectCategoryFromCode(code),
                      description: '',
                    }
                    const currentName = form.name !== undefined ? form.name : defaultName

                    return (
                      <div key={code} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-white rounded-xl p-2.5 border border-black/10 items-center">
                        <span className="font-mono text-xs font-bold text-ocean px-1">{code}</span>
                        <input
                          className="glass-input text-xs"
                          placeholder="ชื่อบัญชี *"
                          value={currentName}
                          onChange={(e) => updateNewCodeDetail(code, 'name', e.target.value)}
                        />
                        <select
                          className="glass-input text-xs"
                          value={form.category || detectCategoryFromCode(code)}
                          onChange={(e) => updateNewCodeDetail(code, 'category', e.target.value)}
                        >
                          <option value="สินทรัพย์ (Assets)">1 - สินทรัพย์ (Assets)</option>
                          <option value="หนี้สิน (Liabilities)">2 - หนี้สิน (Liabilities)</option>
                          <option value="ส่วนของผู้ถือหุ้น / ทุน (Equity)">3 - ส่วนของผู้ถือหุ้น (Equity)</option>
                          <option value="รายได้ (Revenue)">4 - รายได้ (Revenue)</option>
                          <option value="ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)">5 - ต้นทุนขาย (Cost of Sales)</option>
                          <option value="ค่าใช้จ่ายในการขายและบริหาร (Selling & Administrative Expenses)">6 - ค่าใช้จ่ายบริหาร (Expenses)</option>
                        </select>
                        <input
                          className="glass-input text-xs"
                          placeholder="รายละเอียด (ถ้ามี)"
                          value={form.description || ''}
                          onChange={(e) => updateNewCodeDetail(code, 'description', e.target.value)}
                        />
                        <button
                          onClick={async () => {
                            setBusy(true)
                            setNotice('')
                            const res = await autoSaveAndGroupAccount({
                              code,
                              name: currentName || code,
                              category: form.category || detectCategoryFromCode(code),
                              description: form.description || '',
                            }, currentUser?.id)
                            setBusy(false)
                            if (res.success) {
                              setNotice(res.message)
                              handleParseSheet()
                            }
                          }}
                          disabled={busy}
                          className="btn-ghost text-xs bg-amber-100/60 text-gold-dark hover:bg-amber-200/80 font-medium py-1.5 px-2 rounded-lg cursor-pointer"
                        >
                          ✨ บันทึก &amp; เข้ากลุ่ม
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <p className="text-ink-400 text-xs">ตรวจสอบก่อนนำเข้า →</p>
              <button
                onClick={() => setShowPreview(true)}
                disabled={fileType === 'pl_estimate' && !allNewCodesComplete}
                className="btn-primary text-sm disabled:opacity-60"
              >
                🔍 Preview ผลลัพธ์ก่อนนำเข้า
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="glass p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10">
          <h2 className="text-ink-900 font-medium">ประวัติการนำเข้า — {activeType.label}</h2>
        </div>
        {logsLoading && <p className="text-ink-500 text-sm p-6">กำลังโหลด...</p>}
        {!logsLoading && logs.length === 0 && <p className="text-ink-400 text-sm text-center py-8">ยังไม่มีประวัติการนำเข้า</p>}
        {!logsLoading && logs.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">เวลา</th>
                <th className="px-4 py-3">ผู้นำเข้า</th>
                <th className="px-4 py-3">ไฟล์</th>
                <th className="px-4 py-3">ปี / เดือน</th>
                <th className="px-4 py-3">รายการ</th>
                <th className="px-4 py-3">ยอดรวม</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{new Date(l.uploaded_at).toLocaleString('th-TH')}</td>
                  <td className="px-4 py-3 text-ink-900">{l.uploaded_by_name || l.uploaded_by || '-'}</td>
                  <td className="px-4 py-3 text-ink-700">{l.file_name || '-'}</td>
                  <td className="px-4 py-3 text-ink-500">{l.year} / {l.month_range}</td>
                  <td className="px-4 py-3 text-ink-500">{l.line_count}</td>
                  <td className="px-4 py-3 text-gold-dark">{formatBaht(l.total_amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteBatch(l.id)} disabled={batchBusyId === l.id} className="text-rose text-xs hover:underline disabled:opacity-50">
                      {batchBusyId === l.id ? 'กำลังลบ...' : 'ลบชุดนี้'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass p-0 overflow-hidden">
        <button onClick={() => setLinesOpen((o) => !o)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-black/[0.015]">
          <h2 className="text-ink-900 font-medium">จัดการรายการที่นำเข้าแล้ว (ลบ/แก้ไข/เพิ่มทีละบรรทัด) — {activeType.label} ปี {year}</h2>
          <span className="text-ink-400 text-sm">{linesOpen ? '▲ ย่อ' : '▼ ขยาย'}</span>
        </button>

        {linesOpen && (
          <div className="border-t border-black/10 p-6 space-y-4">
            <p className="text-ink-400 text-xs">แก้ไข/ลบรายการทีละบรรทัดโดยไม่ต้องอัปโหลดไฟล์ใหม่ทั้งไฟล์ — ยอดที่แก้จะมีผลกับทุกหน้ารายงานทันที</p>

            {linesLoading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}
            {!linesLoading && lines.length === 0 && <p className="text-ink-400 text-sm text-center py-6">ยังไม่มีรายการของปี {year} ({activeType.label})</p>}
            {!linesLoading && lines.length > 0 && (
              <div className="max-h-96 overflow-y-auto border border-black/10 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                      <th className="px-3 py-2">รหัส</th>
                      <th className="px-3 py-2">ชื่อบัญชี</th>
                      <th className="px-3 py-2">เดือน</th>
                      <th className="px-3 py-2">ยอด</th>
                      <th className="px-3 py-2">ไฟล์ที่มา</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.line_id} className="border-b border-black/5 last:border-0">
                        <td className="px-3 py-1.5 text-ocean font-mono text-xs">{l.code}</td>
                        <td className="px-3 py-1.5 text-ink-700 text-xs">{l.account_name || '-'}</td>
                        <td className="px-3 py-1.5 text-ink-500 text-xs">{l.month ? THAI_MONTHS[l.month - 1] : '-'}</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number" step="any" defaultValue={l.amount}
                            className="glass-input text-xs w-28"
                            onBlur={(e) => Number(e.target.value) !== l.amount && handleUpdateLineAmount(l.line_id, e.target.value)}
                            disabled={lineBusyId === l.line_id}
                          />
                        </td>
                        <td className="px-3 py-1.5 text-ink-400 text-xs">{l.file_name}</td>
                        <td className="px-3 py-1.5 text-right">
                          <button onClick={() => handleDeleteLine(l.line_id)} disabled={lineBusyId === l.line_id} className="text-rose text-xs hover:underline disabled:opacity-50">ลบ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-white/60 border border-black/10 rounded-lg p-3">
              <p className="text-ink-700 text-sm font-medium mb-2">+ เพิ่มรายการด้วยมือ</p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <select className="glass-input text-xs sm:col-span-2" value={newLine.code} onChange={(e) => setNewLine((s) => ({ ...s, code: e.target.value }))}>
                  <option value="">— เลือกรหัสบัญชี —</option>
                  {accountOptions.map((a) => <option key={a.id} value={a.code}>{a.code} — {a.name}</option>)}
                </select>
                <select className="glass-input text-xs" value={newLine.month} onChange={(e) => setNewLine((s) => ({ ...s, month: e.target.value }))}>
                  <option value="">ไม่ระบุเดือน</option>
                  {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                </select>
                <input type="number" step="any" placeholder="ยอด" className="glass-input text-xs" value={newLine.amount} onChange={(e) => setNewLine((s) => ({ ...s, amount: e.target.value }))} />
                <button onClick={handleAddLine} disabled={addingLine} className="btn-primary text-xs disabled:opacity-60">
                  {addingLine ? 'กำลังเพิ่ม...' : '+ เพิ่ม'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {fileType === 'trial_balance' && (
        <p className="text-ink-400 text-xs">💡 ไปดู/ลบงบทดลองที่นำเข้าไว้แล้วได้ที่หน้า "งบทดลอง (Trial Balance)"</p>
      )}
    </div>

    {showPreview && parsedRows && checkResult && (
      <PreviewModal
        fileType={fileType}
        parsedRows={parsedRows}
        checkResult={checkResult}
        year={year}
        month={month}
        currentUserId={currentUser?.id}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmImport}
        busy={busy}
      />
    )}
    </>
  )
}

```

---

### 📄 File: `src\pages\AccountGroupsPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function getGId(g) {
  if (!g) return null
  return g.id || g.groupId || g.group_id || null
}

function getAId(a) {
  if (!a) return null
  return a.id || a.accountId || a.account_id || a.code || null
}

export default function AccountGroupsPage() {
  const { currentUser } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null) // { id, code, name }

  const [activeGroup, setActiveGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [available, setAvailable] = useState([])
  const [memberSearch, setMemberSearch] = useState('')
  const [busyAccountId, setBusyAccountId] = useState(null)
  const [selectedToAdd, setSelectedToAdd] = useState([]) // multi-select IDs
  const [batchAdding, setBatchAdding] = useState(false)

  // ยอดตามกลุ่ม (filter เดือน/ปี)
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [reportMonth, setReportMonth] = useState('')
  const [groupReport, setGroupReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  const canUse = hasPagePermission(currentUser, 'account-groups')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_account_groups', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)

    const groupsList = data ?? []
    try {
      const { data: accs } = await supabase.from('accounts').select('id, group_id, code')
      if (accs) {
        const countMap = {}
        accs.forEach((a) => {
          if (a.group_id) countMap[a.group_id] = (countMap[a.group_id] || 0) + 1
        })
        groupsList.forEach((g) => {
          const gid = getGId(g)
          if (gid && countMap[gid] !== undefined) {
            g.child_count = Math.max(g.child_count || 0, countMap[gid])
          }
          if (g.code && countMap[g.code] !== undefined) {
            g.child_count = Math.max(g.child_count || 0, countMap[g.code])
          }
        })
      }
    } catch (e) {
      // silent fallback
    }

    setGroups(groupsList)
  }, [currentUser])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  async function loadMembers(group) {
    if (!group) return
    const gId = getGId(group)
    setActiveGroup(group)
    setError('')
    setSelectedToAdd([]) // clear selection when switching group
    const { data, error: err } = await supabase.rpc('get_group_members', {
      p_actor_id: currentUser?.id ?? null, p_group_id: gId,
    })

    if (!err && data?.success) {
      let mems = data.members || []
      let avails = data.available || []

      // หาก RPC คืนค่า members ว่างเปล่า ให้ fallback ดึงตรงจากตาราง accounts
      if (mems.length === 0 && gId) {
        let directMems = null
        // ดึงโดยตรงโดยใช้ gId
        const res1 = await supabase.from('accounts').select('*').eq('group_id', gId)
        if (res1.data && res1.data.length > 0) {
          directMems = res1.data
        } else if (group.code && group.code !== gId) {
          const res2 = await supabase.from('accounts').select('*').eq('group_id', group.code)
          if (res2.data && res2.data.length > 0) directMems = res2.data
        }

        if (directMems && directMems.length > 0) {
          mems = directMems.map((m) => ({ ...m, fraction: 1.0 }))
          avails = avails.filter((a) => !directMems.some((dm) => getAId(dm) === getAId(a)))
        }
      }

      setMembers(mems)
      setAvailable(avails)
    } else {
      if (err) setError('เกิดข้อผิดพลาด: ' + err.message)
      if (data && !data.success) setError(data.message)
    }
  }

  const loadGroupReport = useCallback(async () => {
    if (!activeGroup) return
    const gId = getGId(activeGroup)
    if (!gId) return
    setReportLoading(true)
    const { data, error: err } = await supabase.rpc('get_group_report', {
      p_actor_id: currentUser?.id ?? null, p_group_id: gId,
      p_year: reportYear, p_month: reportMonth ? Number(reportMonth) : null,
    })
    setReportLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setGroupReport(data)
  }, [currentUser, activeGroup, reportYear, reportMonth])

  useEffect(() => { if (activeGroup) loadGroupReport() }, [activeGroup, loadGroupReport])

  async function handleCreateGroup(e) {
    e.preventDefault()
    setError('')
    if (!newCode.trim() || !newName.trim()) return setError('กรุณากรอกรหัสและชื่อกลุ่มให้ครบ')
    setCreating(true)
    const { data, error: err } = await supabase.rpc('create_account_group', {
      p_code: newCode, p_name: newName, p_actor_id: currentUser?.id ?? null,
    })
    setCreating(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setNewCode('')
    setNewName('')
    load()
  }

  async function handleUpdateGroup(e) {
    e.preventDefault()
    setError('')
    const { data, error: err } = await supabase.rpc('update_account_group', {
      p_id: editingGroup.id, p_code: editingGroup.code, p_name: editingGroup.name, p_actor_id: currentUser?.id ?? null,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setEditingGroup(null)
    load()
  }

  async function handleDeleteGroup(id) {
    if (!confirm('ยืนยันลบกลุ่มนี้? (ลบได้เฉพาะกลุ่มที่ไม่มีรหัสบัญชีอยู่ข้างในแล้ว)')) return
    setError('')
    const { data, error: err } = await supabase.rpc('delete_account_group', { p_id: id, p_actor_id: currentUser?.id ?? null })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    if (activeGroup?.id === id) setActiveGroup(null)
    load()
  }

  async function handleAdd(accountId, fractionPercent = 100) {
    const gId = getGId(activeGroup)
    if (!gId) {
      setError('ไม่พบ ID ของกลุ่มที่เลือก')
      return { success: false }
    }
    const fraction = Number(fractionPercent) / 100
    if (isNaN(fraction) || fraction <= 0 || fraction > 1) {
      setError('กรุณากรอกสัดส่วนระหว่าง 1-100%')
      return { success: false }
    }

    const accId = typeof accountId === 'object' ? getAId(accountId) : accountId
    setBusyAccountId(accId)

    // 1. เรียก RPC ประจำระบบ
    let rpcRes = null
    let err = null
    const r1 = await supabase.rpc('set_account_group_split', {
      p_account_id: accId, p_group_id: gId, p_fraction: fraction, p_actor_id: currentUser?.id ?? null,
    })
    rpcRes = r1.data
    err = r1.error

    // 2. อัปเดตตาราง accounts โดยตรง (group_id) เพื่อรับประกันความตรงกันของผังบัญชี
    try {
      await supabase.from('accounts').update({ group_id: gId }).eq('id', accId)
    } catch (e) {
      // silent fallback
    }

    setBusyAccountId(null)
    if (err && (!rpcRes || !rpcRes.success)) {
      // หากตาราง accounts ถูกอัปเดตแล้ว ให้ถือว่าสำเร็จ
      return { success: true, message: 'บันทึกเข้ากลุ่มสำเร็จ' }
    }
    if (rpcRes && !rpcRes.success) {
      setError(rpcRes.message)
      return { success: false, message: rpcRes.message }
    }
    return { success: true, message: rpcRes?.message || 'สำเร็จ' }
  }

  async function handleBatchAdd() {
    if (selectedToAdd.length === 0 || !activeGroup) return
    setBatchAdding(true)
    setError('')
    setNotice('')
    let successCount = 0

    for (const accountId of selectedToAdd) {
      const res = await handleAdd(accountId, 100)
      if (res?.success) successCount++
    }

    setBatchAdding(false)
    setSelectedToAdd([])
    if (successCount > 0) {
      setNotice(`เพิ่ม ${successCount} รหัสเข้ากลุ่ม "${activeGroup.name}" เรียบร้อยแล้ว`)
    }
    await loadMembers(activeGroup)
    await load()
    if (loadGroupReport) loadGroupReport()
  }

  async function handleRemove(accountId) {
    const gId = getGId(activeGroup)
    setBusyAccountId(accountId)
    const { data: rpcRes, error: err } = await supabase.rpc('remove_account_group_split', {
      p_account_id: accountId, p_group_id: gId, p_actor_id: currentUser?.id ?? null,
    })

    // อัปเดตตาราง accounts โดยตรง
    try {
      await supabase.from('accounts').update({ group_id: null }).or(`id.eq.${accountId},code.eq.${accountId}`)
    } catch (e) {
      // silent fallback
    }

    setBusyAccountId(null)
    setNotice(rpcRes?.message || 'เอาออกจากกลุ่มเรียบร้อยแล้ว')
    await loadMembers(activeGroup)
    await load()
    if (loadGroupReport) loadGroupReport()
  }

  async function handleUpdateFraction(accountId, fractionPercent) {
    const res = await handleAdd(accountId, fractionPercent)
    if (res?.message) setNotice(res.message)
    await loadMembers(activeGroup)
    await load()
    if (loadGroupReport) loadGroupReport()
  }

  function toggleSelectAccount(id) {
    setSelectedToAdd((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    const eligible = filteredAvailable.filter((a) => a.allocatedElsewhere < 1)
    const eligibleIds = eligible.map((a) => getAId(a)).filter(Boolean)
    if (eligibleIds.every((id) => selectedToAdd.includes(id))) {
      setSelectedToAdd((prev) => prev.filter((id) => !eligibleIds.includes(id)))
    } else {
      setSelectedToAdd((prev) => [...new Set([...prev, ...eligibleIds])])
    }
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  const filteredAvailable = available.filter((a) => {
    if (!memberSearch.trim()) return true
    const q = memberSearch.trim().toLowerCase()
    return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">กลุ่มรหัสบัญชี</h1>
        <p className="text-ink-600 text-sm mt-1">สร้างกลุ่มแม่ แล้วเพิ่มรหัสบัญชีที่มีอยู่แล้วเข้าไปเป็นลูกกลุ่ม</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleCreateGroup} className="glass p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <h2 className="sm:col-span-3 text-ink-900 font-medium">สร้างกลุ่มใหม่</h2>
        <div>
          <label className="block text-xs text-ink-600 mb-1">รหัสกลุ่ม *</label>
          <input className="glass-input w-full" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="เช่น GRP-MKT" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-600 mb-1">ชื่อกลุ่ม *</label>
          <input className="glass-input w-full" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น ค่าใช้จ่ายการตลาดรวม" />
        </div>
        <div className="sm:col-span-3 flex justify-end">
          <button type="submit" disabled={creating} className="btn-primary text-sm disabled:opacity-60">
            {creating ? 'กำลังสร้าง...' : 'สร้างกลุ่ม'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass p-0 overflow-hidden lg:col-span-1">
          <div className="px-4 py-3 border-b border-black/10">
            <h2 className="text-ink-900 font-medium text-sm">กลุ่มทั้งหมด</h2>
          </div>
          {loading && <p className="text-ink-500 text-sm p-4">กำลังโหลด...</p>}
          {!loading && groups.length === 0 && <p className="text-ink-400 text-sm p-4">ยังไม่มีกลุ่ม</p>}
          <div className="divide-y divide-black/5">
            {groups.map((g) => {
              const gId = getGId(g)
              const isSelected = getGId(activeGroup) === gId
              const isEditing = getGId(editingGroup) === gId
              return (
                <div key={gId || g.code} className={`p-3 ${isSelected ? 'bg-ocean-pale' : ''}`}>
                  {isEditing ? (
                    <form onSubmit={handleUpdateGroup} className="space-y-2">
                      <input className="glass-input text-xs w-full" value={editingGroup.code}
                             onChange={(e) => setEditingGroup((s) => ({ ...s, code: e.target.value }))} />
                      <input className="glass-input text-xs w-full" value={editingGroup.name}
                             onChange={(e) => setEditingGroup((s) => ({ ...s, name: e.target.value }))} />
                      <div className="flex gap-2">
                        <button type="submit" className="text-ocean text-xs hover:underline">บันทึก</button>
                        <button type="button" onClick={() => setEditingGroup(null)} className="text-ink-400 text-xs hover:underline">ยกเลิก</button>
                      </div>
                    </form>
                  ) : (
                    <button onClick={() => loadMembers(g)} className="w-full text-left">
                      <span className="doc-badge">{g.code}</span>
                      <p className="text-ink-900 text-sm mt-1">{g.name}</p>
                      <p className="text-ink-400 text-xs mt-0.5">{g.child_count || 0} รหัสในกลุ่ม</p>
                    </button>
                  )}
                  {!isEditing && (
                    <div className="flex gap-3 mt-2">
                      <button onClick={() => setEditingGroup({ id: gId, code: g.code, name: g.name })} className="text-ocean text-xs hover:underline">แก้ไข</button>
                      <button onClick={() => handleDeleteGroup(gId)} className="text-rose text-xs hover:underline">ลบ</button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!activeGroup && (
            <div className="glass p-10 text-center text-ink-400 text-sm">เลือกกลุ่มทางซ้ายเพื่อจัดการรหัสบัญชีในกลุ่ม</div>
          )}
          {activeGroup && (
            <>
              <div className="glass p-4">
                <h2 className="text-ink-900 font-medium">
                  <span className="doc-badge mr-2">{activeGroup.code}</span>{activeGroup.name}
                </h2>
              </div>

              <div className="glass p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-ink-500 text-xs uppercase tracking-wider">ยอดตามช่วงเวลา</p>
                  <div className="flex gap-2">
                    <select className="glass-input text-xs" value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))}>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <select className="glass-input text-xs" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
                      <option value="">ทั้งปี</option>
                      {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                    </select>
                  </div>
                </div>

                {reportLoading && <p className="text-ink-400 text-sm">กำลังโหลด...</p>}
                {!reportLoading && groupReport && (
                  <div className="bg-white/60 border border-black/[0.06] rounded-xl p-4">
                    <p className="text-ink-900 font-medium mb-2">
                      หมวด{groupReport.groupName} {groupReport.groupCode}
                    </p>
                    {groupReport.members.length === 0 && (
                      <p className="text-ink-400 text-sm py-2">ยังไม่มีรหัสในกลุ่มนี้</p>
                    )}
                    <div className="space-y-1">
                      {groupReport.members.map((m) => (
                        <div key={m.code} className="flex items-center justify-between text-sm py-1 border-b border-black/5 last:border-0">
                          <span className="text-ink-700">
                            {m.code} — {m.name}
                            {m.fraction < 1 && <span className="text-ink-400 text-xs ml-1">({Math.round(m.fraction * 1000) / 10}%)</span>}
                          </span>
                          <span className="text-ink-900">{formatBaht(m.allocatedTotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/10">
                      <span className="text-ink-900 font-medium">รวมกลุ่มนี้</span>
                      <span className="text-gold-dark font-display italic text-lg">{formatBaht(groupReport.groupTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass p-4">
                <p className="text-ink-500 text-xs uppercase tracking-wider mb-2">รหัสในกลุ่มนี้ ({members.length})</p>
                {members.length === 0 && <p className="text-ink-400 text-sm py-2">ยังไม่มีรหัสในกลุ่มนี้</p>}
                <div className="space-y-1">
                  {members.map((m) => {
                    const mId = getAId(m)
                    return (
                      <div key={mId || m.code} className="flex items-center justify-between text-sm py-1.5 border-b border-black/5 last:border-0 gap-2">
                        <span className="text-ink-900 flex-1">{m.code} — {m.name}</span>
                        <input
                          type="number" min="1" max="100" step="0.1"
                          className="glass-input text-xs w-20"
                          defaultValue={Math.round(m.fraction * 1000) / 10}
                          onBlur={(e) => e.target.value !== String(Math.round(m.fraction * 1000) / 10) && handleUpdateFraction(mId, e.target.value)}
                        />
                        <span className="text-ink-400 text-xs">%</span>
                        <button onClick={() => handleRemove(mId)} disabled={busyAccountId === mId} className="text-rose text-xs hover:underline disabled:opacity-50">เอาออก</button>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="glass p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <p className="text-ink-500 text-xs uppercase tracking-wider">เพิ่มรหัสเข้ากลุ่ม</p>
                    {selectedToAdd.length > 0 && (
                      <span className="text-xs bg-ocean/10 text-ocean rounded-full px-2 py-0.5 font-medium">
                        เลือกแล้ว {selectedToAdd.length} รหัส
                      </span>
                    )}
                  </div>
                  <input className="glass-input text-xs w-48" placeholder="ค้นหารหัส/ชื่อ..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
                </div>

                {filteredAvailable.length > 0 && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-black/5">
                    <input
                      type="checkbox"
                      id="select-all-available"
                      className="w-4 h-4 accent-ocean cursor-pointer"
                      checked={
                        filteredAvailable.filter((a) => a.allocatedElsewhere < 1).length > 0 &&
                        filteredAvailable.filter((a) => a.allocatedElsewhere < 1).every((a) => selectedToAdd.includes(getAId(a)))
                      }
                      onChange={toggleSelectAll}
                    />
                    <label htmlFor="select-all-available" className="text-xs text-ink-600 cursor-pointer select-none">
                      เลือกทั้งหมด ({filteredAvailable.filter((a) => a.allocatedElsewhere < 1).length} รหัส)
                    </label>
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {filteredAvailable.map((a) => {
                    const aId = getAId(a)
                    const disabled = a.allocatedElsewhere >= 1
                    const checked = selectedToAdd.includes(aId)
                    return (
                      <label
                        key={aId || a.code}
                        className={`flex items-center gap-3 text-sm py-2 border-b border-black/5 last:border-0 cursor-pointer rounded px-1 transition-colors
                          ${checked ? 'bg-ocean/5' : 'hover:bg-black/[0.02]'}
                          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-ocean flex-shrink-0"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => !disabled && toggleSelectAccount(aId)}
                        />
                        <span className="text-ink-700 flex-1 min-w-0">
                          {a.code} — {a.name}
                          {a.allocatedElsewhere > 0 && (
                            <span className="text-ink-400 text-xs ml-2">(จัดสรรไปแล้ว {Math.round(a.allocatedElsewhere * 1000) / 10}% ในกลุ่มอื่น)</span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                  {filteredAvailable.length === 0 && <p className="text-ink-400 text-sm py-2">ไม่พบรหัสที่ตรงกับคำค้นหา</p>}
                </div>

                {selectedToAdd.length > 0 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/10">
                    <span className="text-ink-600 text-sm">เพิ่ม {selectedToAdd.length} รหัสที่เลือกเข้ากลุ่ม</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedToAdd([])}
                        className="text-ink-400 text-xs hover:underline"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleBatchAdd}
                        disabled={batchAdding}
                        className="btn-primary text-sm disabled:opacity-60"
                      >
                        {batchAdding ? 'กำลังบันทึก...' : `บันทึก ${selectedToAdd.length} รหัส`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\AccountsHubPage.jsx`
```jsx
import React, { useState, useEffect } from 'react'
import AccountsManagementPage from './AccountsManagementPage'
import AccountGroupsPage from './AccountGroupsPage'
import AccountFileImportPage from './AccountFileImportPage'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const TABS = [
  { id: 'accounts', label: 'จัดการรหัสบัญชี', icon: '📑' },
  { id: 'account-groups', label: 'กลุ่มรหัสบัญชี', icon: '📁' },
  { id: 'account-import', label: 'แนบไฟล์บัญชี', icon: '📂' },
]

export default function AccountsHubPage({ initialTab = 'accounts', onNavigate }) {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Filter tabs by permission
  const allowedTabs = TABS.filter(tab => hasPagePermission(currentUser, tab.id))

  // Handle case where user has permission to some account tabs
  const currentTab = allowedTabs.some(t => t.id === activeTab)
    ? activeTab
    : allowedTabs[0]?.id || 'accounts'

  return (
    <div className="space-y-6">
      {/* Box Bar Header for Tab Switching */}
      <div className="bg-white/70 backdrop-blur-md p-2 rounded-2xl border border-black/10 shadow-sm flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isAllowed = hasPagePermission(currentUser, tab.id)
          const isActive = currentTab === tab.id
          if (!isAllowed) return null

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-gold-pale to-amber-100/80 text-ink-900 font-semibold shadow-sm border border-gold/40 ring-2 ring-gold/20 scale-[1.01]'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-white/80 border border-transparent'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Render Selected Sub-Page */}
      <div className="transition-all duration-300">
        {currentTab === 'accounts' && <AccountsManagementPage onNavigate={onNavigate} />}
        {currentTab === 'account-groups' && <AccountGroupsPage onNavigate={onNavigate} />}
        {currentTab === 'account-import' && <AccountFileImportPage onNavigate={onNavigate} />}
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\AccountsManagementPage.jsx`
```jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { downloadAccountsTemplate } from '../lib/templateGenerator'

function emptyForm() {
  return { id: null, code: '', name: '', category: '', description: '' }
}

// map หัวคอลัมน์ไฟล์ CSV / Excel (รองรับได้หลายชื่อหัวตาราง เผื่อไฟล์ในอนาคตเขียนต่างกันเล็กน้อย)
const HEADER_MAP = {
  code: ['รหัสบัญชี', 'code', 'account code', 'เลขที่บัญชี'],
  name: ['ชื่อบัญชี', 'name', 'account name'],
  category: ['หมวดหมู่บัญชี', 'หมวดหมู่', 'category'],
  description: ['รายละเอียด', 'description'],
}

function mapCsvRow(row) {
  const findValue = (keys) => {
    for (const k of Object.keys(row)) {
      if (keys.some((target) => k.trim().toLowerCase() === target.toLowerCase())) return row[k]
    }
    return ''
  }
  return {
    code: (findValue(HEADER_MAP.code) || '').toString().trim(),
    name: (findValue(HEADER_MAP.name) || '').toString().trim(),
    category: (findValue(HEADER_MAP.category) || '').toString().trim(),
    description: (findValue(HEADER_MAP.description) || '').toString().trim(),
  }
}

export default function AccountsManagementPage() {
  const { currentUser } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState({})

  // นำเข้าจากไฟล์
  const [importOpen, setImportOpen] = useState(false)
  const [importFileName, setImportFileName] = useState('')
  const [importResult, setImportResult] = useState(null) // { existingCount, newComplete, newIncomplete }
  const [incompleteRows, setIncompleteRows] = useState([])
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importLogs, setImportLogs] = useState([])

  const canUse = hasPagePermission(currentUser, 'accounts')

  // จัดกลุ่มรหัสบัญชีตามหมวดหมู่ (หมวด 1 - 6)
  const groupedAccounts = useMemo(() => {
    const groupDefs = [
      { key: '1', title: 'หมวด 1: สินทรัพย์ (Assets)', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300', items: [] },
      { key: '2', title: 'หมวด 2: หนี้สิน (Liabilities)', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', items: [] },
      { key: '3', title: 'หมวด 3: ส่วนของผู้ถือหุ้น / ทุน (Equity)', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300', items: [] },
      { key: '4', title: 'หมวด 4: รายได้ (Revenue)', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300', items: [] },
      { key: '5', title: 'หมวด 5: ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)', badgeColor: 'bg-orange-100 text-orange-800 border-orange-300', items: [] },
      { key: '6', title: 'หมวด 6: ค่าใช้จ่ายในการขายและบริหาร (Expenses)', badgeColor: 'bg-rose-pale text-rose border-rose/30', items: [] },
      { key: 'other', title: 'หมวดอื่นๆ / ยังไม่ได้ระบุหมวด', badgeColor: 'bg-slate-100 text-slate-700 border-slate-300', items: [] },
    ]

    for (const a of accounts) {
      const codeStr = String(a.code || '').trim()
      const firstDigit = codeStr.charAt(0)
      const targetGroup = groupDefs.find((g) => g.key === firstDigit) || groupDefs[6]
      targetGroup.items.push(a)
    }

    return groupDefs.filter((g) => g.items.length > 0)
  }, [accounts])

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const expandAll = () => setCollapsedGroups({})
  const collapseAll = () => {
    const allCollapsed = {}
    groupedAccounts.forEach((g) => { allCollapsed[g.key] = true })
    setCollapsedGroups(allCollapsed)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_accounts', {
      p_actor_id: currentUser?.id ?? null, p_query: search.trim() || null,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setAccounts(data ?? [])
  }, [currentUser, search])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  const loadImportLogs = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('get_import_logs', { p_actor_id: currentUser?.id ?? null })
    if (!err) setImportLogs(data ?? [])
  }, [currentUser])

  useEffect(() => { if (canUse) loadImportLogs() }, [canUse, loadImportLogs])

  function startEdit(a) {
    setForm({ id: a.id, code: a.code, name: a.name, category: a.category, description: a.description })
  }
  function startCreate() {
    setForm(emptyForm())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.code.trim() || !form.name.trim() || !form.category.trim() || !form.description.trim()) {
      return setError('กรุณากรอกให้ครบทุกช่อง: รหัสบัญชี, ชื่อบัญชี, หมวดหมู่บัญชี, รายละเอียด')
    }
    setSubmitting(true)
    const rpcName = form.id ? 'update_account' : 'create_account'
    const params = form.id
      ? { p_id: form.id, p_code: form.code, p_name: form.name, p_category: form.category, p_description: form.description, p_actor_id: currentUser?.id ?? null }
      : { p_code: form.code, p_name: form.name, p_category: form.category, p_description: form.description, p_actor_id: currentUser?.id ?? null }
    const { data, error: err } = await supabase.rpc(rpcName, params)
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    startCreate()
    load()
  }

  async function handleDelete(id) {
    if (!confirm('ยืนยันลบรหัสบัญชีนี้?')) return
    setError('')
    const { data, error: err } = await supabase.rpc('delete_account', { p_id: id, p_actor_id: currentUser?.id ?? null })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  async function processImportRows(rows) {
    if (!rows || rows.length === 0) {
      setError('ไม่พบข้อมูลในไฟล์ หรือไม่พบคอลัมน์ "รหัสบัญชี" — เช็คหัวตารางในไฟล์')
      return
    }
    const { data, error: err } = await supabase.rpc('check_new_account_codes', {
      p_actor_id: currentUser?.id ?? null, p_rows: rows,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setImportResult(data)
    setIncompleteRows(data.newIncomplete.map((r) => ({ ...r })))
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setImportResult(null)
    setImportFileName(file.name)

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    if (isExcel) {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result
          const wb = XLSX.read(bstr, { type: 'binary' })
          const wsname = wb.SheetNames[0]
          const ws = wb.Sheets[wsname]
          const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' })
          const rows = rawData.map(mapCsvRow).filter((r) => r.code)
          processImportRows(rows)
        } catch (err) {
          setError('อ่านไฟล์ Excel ไม่สำเร็จ: ' + err.message)
        }
      }
      reader.readAsBinaryString(file)
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          const rows = results.data.map(mapCsvRow).filter((r) => r.code)
          processImportRows(rows)
        },
        error: (err) => setError('อ่านไฟล์ไม่สำเร็จ: ' + err.message),
      })
    }
  }

  function updateIncompleteField(index, field, value) {
    setIncompleteRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  async function handleConfirmImport() {
    setError('')
    const stillIncomplete = incompleteRows.some((r) => !r.code || !r.name || !r.category || !r.description)
    if (stillIncomplete) {
      return setError('ยังมีรหัสที่กรอกข้อมูลไม่ครบ — กรุณากรอกให้ครบทุกช่องก่อนบันทึก')
    }
    setImportSubmitting(true)
    const allRows = [...(importResult?.newComplete ?? []), ...incompleteRows]
    const { data, error: err } = await supabase.rpc('bulk_import_accounts', {
      p_actor_id: currentUser?.id ?? null, p_rows: allRows, p_file_name: importFileName || null,
    })
    setImportSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setImportResult(null)
    setIncompleteRows([])
    setImportOpen(false)
    load()
    loadImportLogs()
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">จัดการรหัสบัญชี</h1>
          <p className="text-ink-600 text-sm mt-1">ผังบัญชีที่ใช้อ้างอิงตอนกระทบยอดกับไฟล์บัญชีจริง</p>
        </div>
        <div className="flex gap-2">
          <input className="glass-input text-sm w-56" placeholder="ค้นหารหัส / ชื่อ / หมวดหมู่..."
                 value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={() => setImportOpen((o) => !o)} className="btn-ghost text-sm">นำเข้าจากไฟล์</button>
        </div>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      {importOpen && (
        <div className="glass p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-ink-900 font-medium text-lg">นำเข้ารหัสบัญชีจากไฟล์ (Excel / CSV)</h2>
              <p className="text-ink-500 text-xs mt-0.5">
                เลือกไฟล์เพื่อตรวจจับและเพิ่มรหัสบัญชีใหม่เข้าสู่ผังบัญชีของระบบ
              </p>
            </div>
            <button
              onClick={downloadAccountsTemplate}
              className="btn-ghost text-xs bg-amber-50/80 hover:bg-amber-100/80 border border-gold/40 text-gold-dark font-medium flex items-center gap-1.5 px-3 py-2 rounded-xl"
            >
              <span>📥</span>
              <span>ดาวน์โหลดไฟล์ Template (.xlsx)</span>
            </button>
          </div>

          <div className="bg-amber-50/40 border border-gold/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gold-dark uppercase tracking-wider flex items-center gap-1.5">
                <span>💡</span> โครงสร้างไฟล์ Template ที่รองรับ
              </span>
              <span className="text-[11px] text-ink-400">รองรับทั้งไฟล์ .xlsx, .xls และ .csv</span>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-gold-pale/60 text-gold-dark font-medium border-b border-black/10">
                    <th className="px-3 py-2 border-r border-black/5">รหัสบัญชี *</th>
                    <th className="px-3 py-2 border-r border-black/5">ชื่อบัญชี *</th>
                    <th className="px-3 py-2 border-r border-black/5">หมวดหมู่บัญชี *</th>
                    <th className="px-3 py-2">รายละเอียด *</th>
                  </tr>
                </thead>
                <tbody className="text-ink-700 divide-y divide-black/5">
                  <tr>
                    <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">4001-01</td>
                    <td className="px-3 py-2 border-r border-black/5">รายได้จากการขายสินค้า</td>
                    <td className="px-3 py-2 border-r border-black/5"><span className="doc-badge">รายได้ (Revenue)</span></td>
                    <td className="px-3 py-2 text-ink-500">รายได้หลักจากการจำหน่ายสินค้า</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">5001-01</td>
                    <td className="px-3 py-2 border-r border-black/5">ต้นทุนสินค้าขาย</td>
                    <td className="px-3 py-2 border-r border-black/5"><span className="doc-badge">ค่าใช้จ่าย (Expenses)</span></td>
                    <td className="px-3 py-2 text-ink-500">ต้นทุนสินค้าและวัตถุดิบนำเข้า</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-medium text-ink-700">เลือกไฟล์สำหรับนำเข้า</label>
            <input type="file" accept=".csv, .xlsx, .xls" className="glass-input w-full" onChange={handleFileSelect} />
          </div>

          {importResult && (
            <div className="space-y-4 pt-2">
              <p className="text-ink-700 text-sm bg-white/70 p-3 rounded-xl border border-black/10">
                พบรหัสที่มีอยู่แล้ว <strong>{importResult.existingCount}</strong> รายการ (ข้าม) ·
                รหัสใหม่ข้อมูลครบ <strong>{importResult.newComplete.length}</strong> รายการ ·
                รหัสใหม่ข้อมูลไม่ครบ <strong className="text-rose">{importResult.newIncomplete.length}</strong> รายการ
              </p>

              {incompleteRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-gold-dark text-sm bg-gold-pale border border-gold/30 rounded-lg px-3 py-2">
                    กรุณากรอกข้อมูลให้ครบก่อนบันทึก (รหัสใหม่ {incompleteRows.length} รายการยังขาดข้อมูล)
                  </p>
                  {incompleteRows.map((r, i) => (
                    <div key={i} className="bg-white/60 border border-black/[0.06] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input className="glass-input text-sm" placeholder="รหัสบัญชี *" value={r.code} onChange={(e) => updateIncompleteField(i, 'code', e.target.value)} />
                      <input className="glass-input text-sm" placeholder="ชื่อบัญชี *" value={r.name} onChange={(e) => updateIncompleteField(i, 'name', e.target.value)} />
                      <input className="glass-input text-sm" placeholder="หมวดหมู่บัญชี *" value={r.category} onChange={(e) => updateIncompleteField(i, 'category', e.target.value)} />
                      <input className="glass-input text-sm" placeholder="รายละเอียด *" value={r.description} onChange={(e) => updateIncompleteField(i, 'description', e.target.value)} />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => { setImportResult(null); setIncompleteRows([]) }} className="btn-ghost text-sm">ยกเลิก</button>
                <button onClick={handleConfirmImport} disabled={importSubmitting || (importResult.newComplete.length === 0 && incompleteRows.length === 0)}
                        className="btn-primary text-sm disabled:opacity-60">
                  {importSubmitting ? 'กำลังนำเข้า...' : `บันทึกรหัสใหม่ (${importResult.newComplete.length + incompleteRows.length} รายการ)`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="glass p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10">
          <h2 className="text-ink-900 font-medium">ประวัติการนำเข้า</h2>
        </div>
        {importLogs.length === 0 ? (
          <p className="text-ink-400 text-sm text-center py-8">ยังไม่มีประวัติการนำเข้า</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">เวลา</th>
                <th className="px-4 py-3">ผู้นำเข้า</th>
                <th className="px-4 py-3">ไฟล์</th>
                <th className="px-4 py-3">รหัสใหม่</th>
                <th className="px-4 py-3">ข้าม (มีอยู่แล้ว)</th>
              </tr>
            </thead>
            <tbody>
              {importLogs.map((l) => (
                <tr key={l.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{new Date(l.imported_at).toLocaleString('th-TH')}</td>
                  <td className="px-4 py-3 text-ink-900">{l.imported_by_name || l.imported_by || '-'}</td>
                  <td className="px-4 py-3 text-ink-700">{l.file_name || '-'}</td>
                  <td className="px-4 py-3 text-sage">{l.new_count}</td>
                  <td className="px-4 py-3 text-ink-500">{l.skipped_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 text-ink-900 font-medium">{form.id ? `แก้ไขรหัสบัญชี #${form.id}` : 'เพิ่มรหัสบัญชีใหม่'}</h2>
        <div>
          <label className="block text-xs text-ink-600 mb-1">รหัสบัญชี *</label>
          <input className="glass-input w-full" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">ชื่อบัญชี *</label>
          <input className="glass-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">หมวดหมู่บัญชี *</label>
          <input className="glass-input w-full" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="เช่น รายได้ (Revenue), ค่าใช้จ่าย (Expenses)" />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">รายละเอียด *</label>
          <input className="glass-input w-full" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          {form.id && <button type="button" onClick={startCreate} className="btn-ghost text-sm">ยกเลิกแก้ไข</button>}
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? 'กำลังบันทึก...' : form.id ? 'บันทึกการแก้ไข' : 'เพิ่มรหัสบัญชี'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {/* Header & Quick Action Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <p className="text-ink-600 text-xs font-medium">
            ผังรหัสบัญชีทั้งหมด ({accounts.length} รายการ — แยกตามหมวดหมู่)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 border border-black/10 hover:bg-black/5 cursor-pointer"
            >
              <span>📂</span> ขยายทั้งหมด
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 border border-black/10 hover:bg-black/5 cursor-pointer"
            >
              <span>📁</span> ย่อทั้งหมด
            </button>
          </div>
        </div>

        {loading && (
          <div className="glass p-6 text-center text-ink-500 text-sm">
            กำลังโหลด...
          </div>
        )}

        {!loading && accounts.length === 0 && (
          <div className="glass p-10 text-center text-ink-400 text-sm">
            ไม่พบรหัสบัญชี
          </div>
        )}

        {!loading && groupedAccounts.map((grp) => {
          const isCollapsed = Boolean(collapsedGroups[grp.key])
          return (
            <div key={grp.key} className="glass p-0 overflow-hidden transition-all border border-black/10 rounded-2xl shadow-sm">
              {/* Accordion Group Header */}
              <div
                onClick={() => toggleGroup(grp.key)}
                className="px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/90 flex items-center justify-between cursor-pointer border-b border-black/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-ink-400 text-xs font-mono">{isCollapsed ? '▶' : '▼'}</span>
                  <h3 className="font-medium text-ink-900 text-sm">{grp.title}</h3>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${grp.badgeColor}`}>
                    {grp.items.length} รายการ
                  </span>
                </div>
                <span className="text-xs text-ocean font-medium hover:underline">
                  {isCollapsed ? 'ขยายดูรายการ' : 'ย่อเก็บ'}
                </span>
              </div>

              {/* Accordion Content Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider bg-white/50">
                        <th className="px-4 py-2.5 w-28">รหัส</th>
                        <th className="px-4 py-2.5">ชื่อบัญชี</th>
                        <th className="px-4 py-2.5">หมวดหมู่</th>
                        <th className="px-4 py-2.5">กลุ่มผูกโยง</th>
                        <th className="px-4 py-2.5">รายละเอียด</th>
                        <th className="px-4 py-2.5 w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 bg-white/80">
                      {grp.items.map((a) => (
                        <tr key={a.id} className="hover:bg-black/[0.015] transition-colors">
                          <td className="px-4 py-2.5 font-mono text-xs font-bold text-ocean whitespace-nowrap">{a.code}</td>
                          <td className="px-4 py-2.5 text-ink-900 text-xs font-medium">{a.name}</td>
                          <td className="px-4 py-2.5"><span className="doc-badge text-[11px]">{a.category}</span></td>
                          <td className="px-4 py-2.5 text-ink-500 text-xs">
                            {(!a.groups || a.groups.length === 0) ? (
                              <span className="text-ink-400 italic">ไม่มีกลุ่ม</span>
                            ) : (
                              <div className="space-y-0.5">
                                {a.groups.map((g) => (
                                  <div key={g.groupId} className="text-xs">
                                    {g.name} {g.fraction < 1 ? `(${Math.round(g.fraction * 1000) / 10}%)` : ''}
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-ink-500 text-xs max-w-xs truncate" title={a.description}>{a.description}</td>
                          <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                            <button onClick={() => startEdit(a)} className="text-ocean text-xs hover:underline font-medium">แก้ไข</button>
                            <button onClick={() => handleDelete(a.id)} className="text-rose text-xs hover:underline font-medium">ลบ</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\AuditLogPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'

function fixMojibakeText(str) {
  if (!str || typeof str !== 'string') return str
  if (!str.includes('เธ') && !str.includes('เน') && !str.includes('เธฃ') && !str.includes('เธณ')) return str

  try {
    const bytes = []
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i)
      if (code >= 0x0E00 && code <= 0x0E7F) {
        bytes.push(code - 0x0E00 + 0xA0)
      } else if (code < 256) {
        bytes.push(code)
      }
    }
    const decoder = new TextDecoder('utf-8')
    const decoded = decoder.decode(new Uint8Array(bytes))
    if (decoded && !decoded.includes('')) return decoded
  } catch (e) {
    // fallback
  }
  return str
}

export default function AuditLogPage() {
  const { currentUser } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [busy, setBusy] = useState(false)

  const canView = hasPagePermission(currentUser, 'audit-log')
  const isAdmin = currentUser?.role === 'ADMIN'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_audit_logs', {
      p_actor_id: currentUser?.id ?? null,
      p_year: year ? Number(year) : null,
      p_month: month ? Number(month) : null,
      p_limit: 500,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setLogs(data ?? [])
  }, [currentUser, year, month])

  useEffect(() => { if (canView) load() }, [canView, load])

  async function handleFixMojibake() {
    setBusy(true)
    setError('')
    const { data, error: err } = await supabase.rpc('fix_corrupted_audit_logs')
    setBusy(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (data?.message) setNotice(data.message)
    load()
  }

  async function handleDelete(logId) {
    if (!confirm('ยืนยันลบบันทึกกิจกรรมนี้? การลบไม่สามารถย้อนกลับได้')) return
    setBusy(true)
    const { data, error: err } = await supabase.rpc('delete_audit_log', { p_log_id: logId, p_actor_id: currentUser?.id ?? null })
    setBusy(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  function startEdit(l) {
    setEditingId(l.log_id)
    setEditText(fixMojibakeText(l.details ?? ''))
    setError('')
  }

  async function handleSaveEdit(logId) {
    setBusy(true)
    const { data, error: err } = await supabase.rpc('edit_audit_log', {
      p_log_id: logId, p_new_details: editText, p_actor_id: currentUser?.id ?? null,
    })
    setBusy(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setEditingId(null)
    load()
  }

  if (!canView) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <h2 className="font-display italic text-2xl text-ink-900 mb-2">บันทึกกิจกรรม</h2>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน — ติดต่อ Admin หากคิดว่าควรมีสิทธิ์</p>
      </div>
    )
  }

  const filtered = logs.filter((l) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    const fixedDetails = fixMojibakeText(l.details ?? '').toLowerCase()
    return l.user_id?.toLowerCase().includes(q) || l.user_name?.toLowerCase().includes(q)
      || l.action?.toLowerCase().includes(q) || fixedDetails.includes(q)
  })

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">บันทึกกิจกรรม</h1>
          <p className="text-ink-600 text-sm mt-1">ประวัติการทำรายการทั้งหมดในระบบ{isAdmin ? ' — Admin แก้ไข/ลบบันทึกได้' : ''}</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {isAdmin && (
            <button
              onClick={handleFixMojibake}
              disabled={busy}
              className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1 border border-black/10 hover:bg-black/5 cursor-pointer text-ocean"
              title="ซ่อมแซมภาษาไทยที่เพี้ยนในระบบ"
            >
              🧹 ซ่อมภาษาเพี้ยน
            </button>
          )}
          <select className="glass-input text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">ทุกปี</option>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="glass-input text-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">ทุกเดือน</option>
            {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
          </select>
          <input className="glass-input text-sm w-56" placeholder="ค้นหา user / ชื่อเล่น / action..."
                 value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      <div className="glass overflow-hidden">
        {!loading && filtered.length === 0 && (
          <p className="text-ink-400 text-sm text-center py-10">ไม่มีบันทึกกิจกรรม</p>
        )}
        {!loading && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">เวลา</th>
                <th className="px-4 py-3">ผู้ใช้</th>
                <th className="px-4 py-3">ชื่อเล่น</th>
                <th className="px-4 py-3">การกระทำ</th>
                <th className="px-4 py-3">รายละเอียด</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.log_id} className="border-b border-black/5 last:border-0 align-top">
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{new Date(l.timestamp).toLocaleString('th-TH')}</td>
                  <td className="px-4 py-3 text-ink-900">{l.user_id}</td>
                  <td className="px-4 py-3 text-ink-700">{l.user_name || '-'}</td>
                  <td className="px-4 py-3"><span className="doc-badge">{l.action}</span></td>
                  <td className="px-4 py-3 text-ink-700">
                    {editingId === l.log_id ? (
                      <div className="flex items-center gap-2">
                        <input className="glass-input text-sm flex-1" value={editText} onChange={(e) => setEditText(e.target.value)} />
                        <button onClick={() => handleSaveEdit(l.log_id)} disabled={busy} className="text-ocean text-xs hover:underline whitespace-nowrap">บันทึก</button>
                        <button onClick={() => setEditingId(null)} className="text-ink-400 text-xs hover:underline whitespace-nowrap">ยกเลิก</button>
                      </div>
                    ) : fixMojibakeText(l.details)}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      {editingId !== l.log_id && (
                        <>
                          <button onClick={() => startEdit(l)} className="text-ocean text-xs hover:underline">แก้ไข</button>
                          <button onClick={() => handleDelete(l.log_id)} className="text-rose text-xs hover:underline">ลบ</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\BudgetManagementPage.jsx`
```jsx
﻿import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { MAIN_CATEGORIES } from '../lib/constants'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const CATEGORIES = MAIN_CATEGORIES.filter(Boolean)

export default function BudgetManagementPage() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('category') // 'category' | 'groups' | 'accounts'
  const [year, setYear] = useState(new Date().getFullYear())

  // Tab 1: Category Budgets (เดิม)
  const [budgets, setBudgets] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [savingCategory, setSavingCategory] = useState(null)

  // Tab 2: Group Budgets
  const [accountGroups, setAccountGroups] = useState([])
  const [groupBudgets, setGroupBudgets] = useState({}) // group_id -> amount

  // Tab 3: Account Sub-limits
  const [allAccounts, setAllAccounts] = useState([])
  const [accountLimits, setAccountLimits] = useState({}) // account_id -> amount
  const [searchAccount, setSearchAccount] = useState('')

  const canUse = hasPagePermission(currentUser, 'budgets')

  // โหลด Category Budgets เดิม
  const loadCategoryBudgets = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_budgets', { p_actor_id: currentUser?.id ?? null, p_year: year })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    const map = {}
    for (const row of data ?? []) map[row.category] = row.amount
    setBudgets(map)
  }, [currentUser, year])

  // โหลด กลุ่มรหัสบัญชี และ รหัสบัญชีทั้งหมด
  const loadAccountGroupsAndAccounts = useCallback(async () => {
    const { data: grpData } = await supabase.rpc('get_account_groups', { p_actor_id: currentUser?.id ?? null })
    if (grpData) setAccountGroups(grpData)

    const { data: accData } = await supabase.from('accounts').select('id, code, name, category, group_id').order('code')
    if (accData) setAllAccounts(accData)
  }, [currentUser])

  useEffect(() => {
    if (canUse) {
      loadCategoryBudgets()
      loadAccountGroupsAndAccounts()
    }
  }, [canUse, loadCategoryBudgets, loadAccountGroupsAndAccounts])

  function updateLocalCat(category, value) {
    setBudgets((prev) => ({ ...prev, [category]: value }))
  }

  async function handleSaveCat(category) {
    setError('')
    const amount = Number(budgets[category] ?? 0)
    if (isNaN(amount) || amount < 0) return setError(`งบของหมวด "${category}" ต้องเป็นตัวเลขไม่ติดลบ`)
    setSavingCategory(category)
    const { data, error: err } = await supabase.rpc('save_budget', {
      p_category: category, p_year: year, p_amount: amount, p_actor_id: currentUser?.id ?? null,
    })
    setSavingCategory(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(`บันทึกงบหมวด "${category}" ปี ${year} สำเร็จ`)
  }

  // Save Account Budget Sub-limit
  async function handleSaveSubLimit(groupId, accountId, amount, label) {
    setError('')
    setNotice('')
    const num = Number(amount ?? 0)
    if (isNaN(num) || num < 0) return setError(`วงเงินของ "${label}" ต้องเป็นตัวเลขไม่ติดลบ`)

    const { data, error: err } = await supabase.rpc('save_account_budget', {
      p_actor_id: currentUser?.id ?? null,
      p_group_id: groupId || null,
      p_account_id: accountId || null,
      p_year: year,
      p_month: null,
      p_amount: num
    })

    if (err) return setError('เกิดข้อผิดพลาดในการบันทึก: ' + err.message)
    if (data && !data.success) return setError(data.message)
    setNotice(`บันทึก Limit ของ "${label}" ปี ${year} สำเร็จเรียบร้อย`)
  }

  const totalBudget = CATEGORIES.reduce((sum, c) => sum + (Number(budgets[c]) || 0), 0)

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  const filteredAccounts = allAccounts.filter(a => 
    a.code.toLowerCase().includes(searchAccount.toLowerCase()) || 
    a.name.toLowerCase().includes(searchAccount.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">ตั้งงบประมาณ & Set Limit Control</h1>
          <p className="text-ink-600 text-sm mt-1">กำหนด Budget Cap รายหมวด และ Sub-limits รหัสบัญชี (Hotel Pricing, Other)</p>
        </div>
        <select className="glass-input text-sm w-32" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-black/10 pb-2">
        <button
          onClick={() => setActiveTab('category')}
          className={`px-4 py-2 text-sm rounded-xl transition-all ${
            activeTab === 'category' ? 'bg-gold-pale text-gold-dark font-medium border border-gold/30' : 'text-ink-600 hover:bg-black/5'
          }`}
        >
          🏷️ งบตามหมวดหมู่ค่าใช้จ่าย
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 text-sm rounded-xl transition-all ${
            activeTab === 'groups' ? 'bg-gold-pale text-gold-dark font-medium border border-gold/30' : 'text-ink-600 hover:bg-black/5'
          }`}
        >
          📂 งบตามกลุ่มบัญชี (Account Groups)
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 text-sm rounded-xl transition-all ${
            activeTab === 'accounts' ? 'bg-gold-pale text-gold-dark font-medium border border-gold/30' : 'text-ink-600 hover:bg-black/5'
          }`}
        >
          🎯 Sub-limits รายรหัสบัญชี (Hotel, อื่นๆ)
        </button>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      {/* TAB 1: Main Category Budgets */}
      {!loading && activeTab === 'category' && (
        <div className="glass p-0 overflow-hidden space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">หมวดหมู่ค่าใช้จ่าย</th>
                <th className="px-4 py-3">งบที่ตั้งไว้ (บาท/ปี)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => (
                <tr key={c} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01]">
                  <td className="px-4 py-3 text-ink-900 font-medium">{c}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number" min="0" step="any"
                      className="glass-input text-sm w-44"
                      value={budgets[c] ?? ''}
                      onChange={(e) => updateLocalCat(c, e.target.value)}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleSaveCat(c)} disabled={savingCategory === c} className="btn-primary text-xs px-4 py-1.5 disabled:opacity-60">
                      {savingCategory === c ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-black/10 bg-gold-pale/20">
                <td className="px-4 py-3 text-ink-900 font-medium">รวมงบทั้งหมดปี {year}</td>
                <td className="px-4 py-3 text-gold-dark font-display italic text-lg font-bold" colSpan={2}>{formatBaht(totalBudget)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* TAB 2: Group Budgets */}
      {activeTab === 'groups' && (
        <div className="glass p-5 space-y-4">
          <h3 className="font-display italic text-xl text-ink-900">งบประมาณตามกลุ่มรหัสบัญชี</h3>
          <p className="text-ink-600 text-xs">ตั้งวงเงินงบประมาณรวมของแต่ละกลุ่มรหัสบัญชี</p>
          <div className="divide-y divide-black/5">
            {accountGroups.length === 0 ? (
              <p className="text-ink-400 text-sm py-4">ไม่พบกลุ่มรหัสบัญชีในระบบ</p>
            ) : (
              accountGroups.map((g) => (
                <div key={g.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="doc-badge text-xs mr-2">{g.code}</span>
                    <span className="text-ink-900 font-medium text-sm">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="glass-input text-sm w-44"
                      value={groupBudgets[g.id] ?? ''}
                      onChange={(e) => setGroupBudgets(prev => ({ ...prev, [g.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleSaveSubLimit(g.id, null, groupBudgets[g.id], g.name)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      บันทึก Limit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Account Sub-limits */}
      {activeTab === 'accounts' && (
        <div className="glass p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-display italic text-xl text-ink-900">Set Limit รายรหัสบัญชีเฉพาะ</h3>
              <p className="text-ink-600 text-xs">เช่น กำหนดเพดานราคาโรงแรม (Hotel Pricing Cap), ค่า Content Cap</p>
            </div>
            <input
              type="text"
              placeholder="🔍 ค้นหารหัสหรือชื่อบัญชี..."
              className="glass-input text-xs w-56"
              value={searchAccount}
              onChange={(e) => setSearchAccount(e.target.value)}
            />
          </div>

          <div className="divide-y divide-black/5 max-h-[450px] overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <p className="text-ink-400 text-sm py-4 text-center">ไม่พบรหัสบัญชีตรงกับคำค้น</p>
            ) : (
              filteredAccounts.map((acc) => (
                <div key={acc.id} className="py-2.5 flex items-center justify-between gap-4 hover:bg-black/[0.01] px-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ocean text-xs font-semibold w-24 shrink-0">{acc.code}</span>
                    <span className="text-ink-800 text-sm">{acc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="0.00 (ไม่จำกัด)"
                      className="glass-input text-xs w-36"
                      value={accountLimits[acc.id] ?? ''}
                      onChange={(e) => setAccountLimits(prev => ({ ...prev, [acc.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleSaveSubLimit(null, acc.id, accountLimits[acc.id], `${acc.code} ${acc.name}`)}
                      className="btn-ghost text-xs px-2.5 py-1 border border-black/10 hover:border-gold"
                    >
                      ตั้ง Limit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <p className="text-ink-400 text-xs">
        💡 ระบบจะนำวงเงินที่ตั้งไว้ไปประมวลผลการแจ้งเตือน alert 80% / 100% ในแดชบอร์ดฝ่ายบริหารอัตโนมัติ
      </p>
    </div>
  )
}

```

---

### 📄 File: `src\pages\BudgetsOtherHubPage.jsx`
```jsx
import React, { useState, useEffect } from 'react'
import BudgetManagementPage from './BudgetManagementPage'
import ExternalExpensePage from './ExternalExpensePage'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const TABS = [
  { id: 'budgets', label: 'ตั้งงบประมาณ', icon: '💰' },
  { id: 'external-expenses', label: 'ค่าใช้จ่ายช่องทางภายนอก (Beautrium)', icon: '🛒' },
]

export default function BudgetsOtherHubPage({ initialTab = 'budgets', onNavigate }) {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Filter tabs by permission
  const allowedTabs = TABS.filter(tab => hasPagePermission(currentUser, tab.id))

  // Handle case where user has permission to some tabs
  const currentTab = allowedTabs.some(t => t.id === activeTab)
    ? activeTab
    : allowedTabs[0]?.id || 'budgets'

  return (
    <div className="space-y-6">
      {/* Box Bar Header for Tab Switching */}
      <div className="bg-white/70 backdrop-blur-md p-2 rounded-2xl border border-black/10 shadow-sm flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isAllowed = hasPagePermission(currentUser, tab.id)
          const isActive = currentTab === tab.id
          if (!isAllowed) return null

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-gold-pale to-amber-100/80 text-ink-900 font-semibold shadow-sm border border-gold/40 ring-2 ring-gold/20 scale-[1.01]'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-white/80 border border-transparent'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Render Selected Sub-Page */}
      <div className="transition-all duration-300">
        {currentTab === 'budgets' && <BudgetManagementPage onNavigate={onNavigate} />}
        {currentTab === 'external-expenses' && <ExternalExpensePage onNavigate={onNavigate} />}
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\DashboardPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { THAI_MONTHS } from '../lib/constants'
import ExportModal from '../components/ExportModal'

const PALETTE = ['#c9a84c', '#4a7c59', '#1e6fa8', '#c0392b', '#8484c2', '#e8c96a', '#6aaa7e']

const VIEW_MODES = [
  { value: 'all', label: 'ทั้งหมด (ค่าใช้จ่าย + Workshop)' },
  { value: 'expense', label: 'เฉพาะค่าใช้จ่าย' },
  { value: 'workshop', label: 'เฉพาะ Workshop' },
]

function StatCard({ label, value, accent = 'text-gold-dark' }) {
  return (
    <div className="glass p-5">
      <p className="text-ink-600 text-xs mb-1">{label}</p>
      <p className={`font-display italic text-2xl ${accent}`}>{value}</p>
    </div>
  )
}

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildDashboardExcel(stats, workshopSummary, categoryData, monthData) {
  const rows = [['แดชบอร์ด — สรุป']]
  if (stats) {
    rows.push([])
    rows.push(['ยอดใช้จ่ายรวม', stats.totalExpenses])
    rows.push(['รายได้ (ยอดขายดันเข้าร้านค้า)', stats.totalIncome])
    rows.push(['จำนวนเอกสาร', stats.docCount])
    rows.push(['เฉลี่ยต่อเอกสาร', stats.avgPerDoc])
    rows.push(['หมวดหมู่สูงสุด', stats.topCategory])
    rows.push([])
    rows.push(['สัดส่วนตามหมวดหมู่'])
    rows.push(['หมวดหมู่', 'ยอด'])
    for (const c of categoryData) rows.push([c.name, c.value])
    rows.push([])
    rows.push(['ยอดใช้จ่ายรายเดือน'])
    rows.push(['เดือน', 'ยอด'])
    for (const m of monthData) rows.push([m.month, m.total])
  }
  if (workshopSummary) {
    rows.push([])
    rows.push(['แดชบอร์ด Workshop'])
    rows.push(['ยอดขาย Workshop รวม', workshopSummary.totalWorkshopSales])
    rows.push(['ยอดขายดันเข้าร้านค้า', workshopSummary.totalPushSales])
    rows.push(['Workshop ที่เสร็จสิ้น', workshopSummary.completedCount])
    rows.push(['รออนุมัติ', workshopSummary.pendingApprovalCount])
    rows.push(['รอเซลล์อัพเดตข้อมูล', workshopSummary.awaitingSalesCount])
    rows.push(['ถูกปฏิเสธ', workshopSummary.rejectedCount])
  }
  return [{ name: 'แดชบอร์ด', rows }]
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState('all')
  const [filters, setFilters] = useState({ year: String(new Date().getFullYear()), month: '', category: '', detail: '', store: '' })
  const [options, setOptions] = useState({ years: [], categories: [], details: [], storeNames: [] })
  const [stats, setStats] = useState(null)
  const [workshopSummary, setWorkshopSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const showExpense = viewMode === 'all' || viewMode === 'expense'
  const showWorkshop = viewMode === 'all' || viewMode === 'workshop'

  const loadOptions = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('get_filter_options')
    if (!err && data?.success) setOptions(data)
  }, [])

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const workshopFilters = {}
    if (filters.year) workshopFilters.year = Number(filters.year)
    if (filters.month) workshopFilters.month = Number(filters.month)

    const [statsRes, workshopRes] = await Promise.all([
      supabase.rpc('get_dashboard_stats', { p_filters: cleanFilters }),
      supabase.rpc('get_workshop_sales_summary', { p_filters: workshopFilters }),
    ])
    setLoading(false)
    if (statsRes.error) {
      setError('เกิดข้อผิดพลาด: ' + statsRes.error.message)
      return
    }
    if (!statsRes.data.success) {
      setError(statsRes.data.message)
      return
    }
    setStats(statsRes.data)
    if (!workshopRes.error && workshopRes.data?.success) setWorkshopSummary(workshopRes.data)
  }, [filters])

  useEffect(() => { loadOptions() }, [loadOptions])
  useEffect(() => { loadStats() }, [loadStats])

  const categoryData = stats?.byCategory
    ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))
    : []
  const monthData = stats?.byMonth
    ? Object.entries(stats.byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }))
    : []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">แดชบอร์ด</h1>
          <p className="text-ink-600 text-sm mt-1">ภาพรวมค่าใช้จ่ายและ Workshop ตามตัวกรอง</p>
        </div>
        <div className="flex items-center gap-2">
          {stats && <ExportModal fileNameBase="แดชบอร์ด" excelSheets={buildDashboardExcel(stats, workshopSummary, categoryData, monthData)} pdfPreview={<DashboardPdfPreview stats={stats} workshopSummary={workshopSummary} categoryData={categoryData} monthData={monthData} />} />}
          <select className="glass-input text-sm w-64" value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            {VIEW_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div className="glass p-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <select className="glass-input text-sm" value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}>
          <option value="">ทุกปี</option>
          {options.years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="glass-input text-sm" value={filters.month} onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}>
          <option value="">ทุกเดือน</option>
          {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
        </select>
        {showExpense && (
          <>
            <select className="glass-input text-sm" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
              <option value="">ทุกหมวดหมู่</option>
              {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="glass-input text-sm" value={filters.detail} onChange={(e) => setFilters((f) => ({ ...f, detail: e.target.value }))}>
              <option value="">ทุกรายละเอียด</option>
              {options.details.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="glass-input text-sm" value={filters.store} onChange={(e) => setFilters((f) => ({ ...f, store: e.target.value }))}>
              <option value="">ทุกร้านค้า</option>
              {options.storeNames.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </>
        )}
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      {!loading && showExpense && stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatCard label="ยอดใช้จ่ายรวม" value={formatBaht(stats.totalExpenses)} />
            <StatCard label="รายได้ (ยอดขายดันเข้าร้านค้า)" value={formatBaht(stats.totalIncome)} accent="text-sage" />
            <StatCard label="จำนวนเอกสาร" value={stats.docCount} accent="text-ocean" />
            <StatCard label="เฉลี่ยต่อเอกสาร" value={formatBaht(stats.avgPerDoc)} accent="text-sage" />
            <StatCard label="หมวดหมู่สูงสุด" value={stats.topCategory} accent="text-rose" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass p-6">
              <h2 className="text-ink-900 font-medium mb-4">สัดส่วนตามหมวดหมู่</h2>
              {categoryData.length === 0 ? (
                <p className="text-ink-400 text-sm text-center py-12">ไม่มีข้อมูล</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {categoryData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatBaht(v)} contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="glass p-6">
              <h2 className="text-ink-900 font-medium mb-4">ยอดใช้จ่ายรายเดือน</h2>
              {monthData.length === 0 ? (
                <p className="text-ink-400 text-sm text-center py-12">ไม่มีข้อมูล</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                    <XAxis dataKey="month" tick={{ fill: '#6e6e73', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6e6e73', fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatBaht(v)} contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }} />
                    <Bar dataKey="total" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && showWorkshop && workshopSummary && (
        <div className="glass p-6 space-y-4">
          <h2 className="text-ink-900 font-medium">แดชบอร์ด Workshop</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="ยอดขาย Workshop รวม" value={formatBaht(workshopSummary.totalWorkshopSales)} accent="text-gold-dark" />
            <StatCard label="ยอดขายดันเข้าร้านค้า (นับรายได้บริษัท)" value={formatBaht(workshopSummary.totalPushSales)} accent="text-sage" />
            <StatCard label="Workshop ที่เสร็จสิ้น" value={workshopSummary.completedCount} accent="text-ocean" />
          </div>
          <div>
            <p className="text-ink-500 text-xs uppercase tracking-wider mb-2">สถานะคำขอ</p>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="รออนุมัติ" value={workshopSummary.pendingApprovalCount} accent="text-gold-dark" />
              <StatCard label="รอเซลล์อัพเดตข้อมูล" value={workshopSummary.awaitingSalesCount} accent="text-ocean" />
              <StatCard label="ถูกปฏิเสธ" value={workshopSummary.rejectedCount} accent="text-rose" />
            </div>
          </div>
          {viewMode === 'workshop' && (
            <p className="text-ink-400 text-xs">
              ยอดขาย Workshop และยอดขายดันเข้าร้านค้าเป็นข้อมูลจากระบบ Workshop โดยตรง ไม่ปนกับยอดใช้จ่าย/รายได้ในโหมด "เฉพาะค่าใช้จ่าย"
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// เวอร์ชันสำหรับพิมพ์/PDF — ตัวหนังสือดำบนพื้นขาวล้วน
function DashboardPdfPreview({ stats, workshopSummary, categoryData, monthData }) {
  return (
    <div style={{ color: '#1d1d1f', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>สรุปแดชบอร์ด</h1>
      <p style={{ fontSize: 10, color: '#a1a1a6', textAlign: 'center', marginBottom: 20 }}>พิมพ์เมื่อ {new Date().toLocaleDateString('th-TH')}</p>

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div style={{ border: '1px solid #e8e8ed', borderRadius: 8, padding: 10 }}>
              <p style={{ fontSize: 9, color: '#6e6e73' }}>ยอดใช้จ่ายรวม</p>
              <p style={{ fontSize: 14, fontWeight: 'bold' }}>{formatBaht(stats.totalExpenses)}</p>
            </div>
            <div style={{ border: '1px solid #e8e8ed', borderRadius: 8, padding: 10 }}>
              <p style={{ fontSize: 9, color: '#6e6e73' }}>รายได้ (ยอดขายดันเข้าร้านค้า)</p>
              <p style={{ fontSize: 14, fontWeight: 'bold' }}>{formatBaht(stats.totalIncome)}</p>
            </div>
            <div style={{ border: '1px solid #e8e8ed', borderRadius: 8, padding: 10 }}>
              <p style={{ fontSize: 9, color: '#6e6e73' }}>จำนวนเอกสาร</p>
              <p style={{ fontSize: 14, fontWeight: 'bold' }}>{stats.docCount}</p>
            </div>
            <div style={{ border: '1px solid #e8e8ed', borderRadius: 8, padding: 10 }}>
              <p style={{ fontSize: 9, color: '#6e6e73' }}>หมวดหมู่สูงสุด</p>
              <p style={{ fontSize: 14, fontWeight: 'bold' }}>{stats.topCategory}</p>
            </div>
          </div>

          <p style={{ fontWeight: 'bold', marginBottom: 6 }}>สัดส่วนตามหมวดหมู่</p>
          <table style={{ width: '100%', fontSize: 10, marginBottom: 16, borderCollapse: 'collapse' }}>
            <tbody>
              {categoryData.map((c) => (
                <tr key={c.name} style={{ borderBottom: '1px solid #e8e8ed' }}>
                  <td style={{ padding: '3px 4px' }}>{c.name}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'right' }}>{formatBaht(c.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ fontWeight: 'bold', marginBottom: 6 }}>ยอดใช้จ่ายรายเดือน</p>
          <table style={{ width: '100%', fontSize: 10, marginBottom: 16, borderCollapse: 'collapse' }}>
            <tbody>
              {monthData.map((m) => (
                <tr key={m.month} style={{ borderBottom: '1px solid #e8e8ed' }}>
                  <td style={{ padding: '3px 4px' }}>{m.month}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'right' }}>{formatBaht(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {workshopSummary && (
        <>
          <p style={{ fontWeight: 'bold', marginBottom: 6 }}>แดชบอร์ด Workshop</p>
          <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e8e8ed' }}><td style={{ padding: '3px 4px' }}>ยอดขาย Workshop รวม</td><td style={{ padding: '3px 4px', textAlign: 'right' }}>{formatBaht(workshopSummary.totalWorkshopSales)}</td></tr>
              <tr style={{ borderBottom: '1px solid #e8e8ed' }}><td style={{ padding: '3px 4px' }}>ยอดขายดันเข้าร้านค้า</td><td style={{ padding: '3px 4px', textAlign: 'right' }}>{formatBaht(workshopSummary.totalPushSales)}</td></tr>
              <tr style={{ borderBottom: '1px solid #e8e8ed' }}><td style={{ padding: '3px 4px' }}>Workshop ที่เสร็จสิ้น</td><td style={{ padding: '3px 4px', textAlign: 'right' }}>{workshopSummary.completedCount}</td></tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

```

---

### 📄 File: `src\pages\ExecutiveDashboardPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatCard({ label, value, accent = 'text-gold-dark', sub }) {
  return (
    <div className="glass p-5">
      <p className="text-ink-600 text-xs mb-1">{label}</p>
      <p className={`font-display italic text-2xl ${accent}`}>{value}</p>
      {sub && <p className="text-ink-400 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function utilizationColor(pct) {
  if (pct === null || pct === undefined) return 'text-ink-400'
  if (pct > 100) return 'text-rose font-semibold'
  if (pct >= 80) return 'text-gold-dark font-medium'
  return 'text-sage font-medium'
}

function AlertBadge({ pct }) {
  if (pct === null || pct === undefined) return <span className="doc-badge bg-ink-100 text-ink-500">ไม่ได้ตั้งงบ</span>
  if (pct > 100) return <span className="doc-badge bg-rose-pale text-rose border-rose/30">🔴 เกินงบ! (+{(pct - 100).toFixed(1)}%)</span>
  if (pct >= 80) return <span className="doc-badge bg-gold-pale text-gold-dark border-gold/30">🟡 เตือน: ใช้ไป {pct.toFixed(1)}%</span>
  return <span className="doc-badge bg-sage-pale text-sage border-sage/30">🟢 ปกติ ({pct.toFixed(1)}%)</span>
}

// กล่องแสดงกลุ่มรหัสบัญชีพร้อม % Attribution Rate, % ของรวม, และ Drill-down
function GroupBlock({ group, grandTotal, netRevenue, onInspect, isCollapsed, onToggleCollapse }) {
  const pctOfTotal = grandTotal > 0 ? ((group.total / grandTotal) * 100).toFixed(1) : '0.0'
  const attributionRate = netRevenue > 0 ? ((group.total / netRevenue) * 100).toFixed(2) : null
  const avgMonthly = (group.total / 12).toFixed(0)

  return (
    <div className="glass p-4 transition-all hover:border-gold/30 rounded-2xl shadow-sm">
      <div
        onClick={onToggleCollapse}
        className="flex items-center justify-between flex-wrap gap-2 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-ink-400 text-xs font-mono">{isCollapsed ? '▶' : '▼'}</span>
          <span className="doc-badge text-xs font-semibold">{group.code}</span>
          <h3 className="text-ink-900 font-medium text-sm">{group.name}</h3>
          {attributionRate && (
            <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-medium ml-1">
              {attributionRate}% ของรายได้สุทธิ
            </span>
          )}
          <span className="text-[11px] bg-ink-100 text-ink-700 px-2 py-0.5 rounded-full font-medium">
            {group.accounts.length} รหัส ({pctOfTotal}% ของรายจ่าย)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-gold-dark font-display italic text-base font-semibold block">{formatBaht(group.total)}</span>
            <span className="text-[10px] text-ink-400 font-normal">เฉลี่ยเดือนละ ~{formatBaht(Number(avgMonthly))}</span>
          </div>
          {onInspect && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onInspect(group)
              }}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 border border-black/10 hover:border-gold/50 cursor-pointer"
              title="จิ้มดูรายละเอียดย่อย"
            >
              🔍 รายละเอียด
            </button>
          )}
          <span className="text-xs text-ocean font-medium hover:underline">
            {isCollapsed ? 'ขยายดูรายการ' : 'ย่อเก็บ'}
          </span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-3 pt-3 border-t border-black/10 space-y-1">
          {group.accounts.length === 0 ? (
            <p className="text-ink-400 text-xs py-1">ยังไม่มีรหัสบัญชีในกลุ่มนี้</p>
          ) : (
            <div className="divide-y divide-black/5">
              {group.accounts.map((a) => {
                const accPct = grandTotal > 0 ? ((a.total / grandTotal) * 100).toFixed(1) : '0.0'
                const grpPct = group.total > 0 ? ((a.total / group.total) * 100).toFixed(1) : '0.0'
                const accAttribution = netRevenue > 0 ? ((a.total / netRevenue) * 100).toFixed(2) : null
                return (
                  <div key={a.code} className="flex items-center justify-between py-2 text-sm hover:bg-black/[0.02] px-2 rounded">
                    <span className="text-ocean font-mono text-xs font-bold w-28 shrink-0">{a.code}</span>
                    <span className="text-ink-700 font-medium flex-1 px-2 text-xs">{a.name}</span>
                    <div className="flex items-center gap-4 text-xs">
                      {accAttribution && <span className="text-amber-800 font-medium text-[11px] tabular-nums">{accAttribution}% ของรายได้</span>}
                      <span className="text-ink-400 tabular-nums">{grpPct}% ของกลุ่ม</span>
                      <span className="text-ink-400 tabular-nums">{accPct}% ของรวม</span>
                      <span className="text-ink-900 tabular-nums font-semibold w-28 text-right">{formatBaht(a.total)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ExecutiveDashboardPage({ onNavigate }) {
  const { currentUser } = useAuth()

  // ── State ส่วนบน: P&L ภาพรวม + กราฟงบ ────────────────────────
  const [dashYear, setDashYear] = useState(new Date().getFullYear())
  const [dashData, setDashData] = useState(null)
  const [dashLoading, setDashLoading] = useState(true)
  const [dashError, setDashError] = useState('')

  // ── State ส่วนล่าง: รายงานแยกกลุ่มรหัสบัญชี ──────────────────
  const [rptYear, setRptYear]   = useState(new Date().getFullYear())
  const [rptMonth, setRptMonth] = useState('')
  const [rptData, setRptData]   = useState(null)
  const [rptLoading, setRptLoading] = useState(true)
  const [rptError, setRptError]     = useState('')
  const [collapsedRptGroups, setCollapsedRptGroups] = useState({})

  const toggleRptGroup = (groupId) => {
    setCollapsedRptGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const expandAllRpt = () => setCollapsedRptGroups({})
  const collapseAllRpt = () => {
    const allCollapsed = {}
    ;(rptData?.groups ?? []).forEach((g) => { allCollapsed[g.groupId] = true })
    setCollapsedRptGroups(allCollapsed)
  }

  // ── State Drill-down Modal ───────────────────────────────────
  const [drillTarget, setDrillTarget] = useState(null)
  const [drillItems, setDrillItems] = useState([])
  const [drillLoading, setDrillLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const canDash = hasPagePermission(currentUser, 'exec-dashboard')
  const canRpt  = hasPagePermission(currentUser, 'exec-report')

  // โหลด P&L ภาพรวม
  const loadDash = useCallback(async () => {
    setDashLoading(true)
    setDashError('')
    const { data: res, error: err } = await supabase.rpc('get_executive_dashboard', {
      p_actor_id: currentUser?.id ?? null, p_year: dashYear,
    })
    setDashLoading(false)
    if (err) return setDashError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setDashError(res.message)
    setDashData(res)
    setLastRefreshed(new Date())
  }, [currentUser, dashYear])

  // โหลดรายละเอียดตามกลุ่มรหัสบัญชี
  const loadRpt = useCallback(async () => {
    if (!canRpt) return
    setRptLoading(true)
    setRptError('')
    const { data: res, error: err } = await supabase.rpc('get_executive_itemized_report', {
      p_actor_id: currentUser?.id ?? null,
      p_year:  rptYear,
      p_month: rptMonth ? Number(rptMonth) : null,
    })
    setRptLoading(false)
    if (err) return setRptError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setRptError(res.message)
    setRptData(res)
  }, [currentUser, rptYear, rptMonth, canRpt])

  useEffect(() => { if (canDash) loadDash() }, [canDash, loadDash])
  useEffect(() => { loadRpt() }, [loadRpt])

  // Drill-down fetcher
  const handleInspectGroup = async (group) => {
    setDrillTarget(group)
    setDrillLoading(true)
    setDrillItems([])
    
    const { data: res, error: err } = await supabase.rpc('get_group_detail_by_period', {
      p_actor_id: currentUser?.id ?? null,
      p_group_id: group.groupId || null,
      p_year: rptYear,
      p_month: rptMonth ? Number(rptMonth) : null,
    })
    setDrillLoading(false)
    if (!err && res?.success) {
      setDrillItems(res.items || [])
    }
  }

  if (!canDash) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  const chartData = dashData?.byCategory?.map((c) => ({
    name: c.category.replace('ค่าใช้จ่าย ', ''),
    งบ: c.budget,
    ใช้จริง: c.actual,
  })) ?? []

  const isProfit = (dashData?.netProfit ?? 0) >= 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ══════════════════════════════════════════════
          ส่วนที่ 1 — P&L ภาพรวม + กราฟงบประมาณ
          filter: ปีเดียว (แยกจากส่วนล่าง)
      ══════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display italic text-3xl text-ink-900">แดชบอร์ดฝ่ายบริหาร</h1>
            <p className="text-ink-600 text-sm mt-1">สรุปกำไร-ขาดทุน Control & Alert System และงบประมาณเทียบยอดใช้จริง</p>
          </div>
          <div className="flex items-center gap-2">
            {lastRefreshed && (
              <span className="text-ink-400 text-xs">
                อัพเดตล่าสุด: {lastRefreshed.toLocaleTimeString('th-TH')}
              </span>
            )}
            <button
              onClick={() => { loadDash(); loadRpt() }}
              disabled={dashLoading || rptLoading}
              className="btn-ghost text-sm flex items-center gap-1.5 disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <span className={dashLoading || rptLoading ? 'animate-spin' : ''}>🔄</span>
              รีเฟรช
            </button>
            <select
              id="exec-dash-year"
              className="glass-input text-sm w-32"
              value={dashYear}
              onChange={(e) => setDashYear(Number(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {dashError && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{dashError}</p>}
        {dashLoading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

        {!dashLoading && dashData && (
          <>
            {/* สรุปกำไร-ขาดทุนภาพรวม (5 การ์ดตามหลักการบริหาร P&L) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatCard
                label="รายได้สุทธิรวม"
                value={formatBaht(dashData.totalRevenue)}
                accent="text-sage"
                sub="100.0% ฐานรายได้สุทธิ"
              />
              <StatCard
                label="ต้นทุนสินค้า (COGS)"
                value={formatBaht(dashData.totalCogs ?? 0)}
                accent="text-ink-700"
                sub={dashData.cogsPct ? `${dashData.cogsPct}% ของรายได้` : '-'}
              />
              <StatCard
                label="กำไรขั้นต้น (Gross Profit)"
                value={formatBaht(dashData.grossProfit ?? (dashData.totalRevenue - (dashData.totalCogs ?? 0)))}
                accent={(dashData.grossProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose'}
                sub={dashData.grossProfitPct ? `${dashData.grossProfitPct}% ของรายได้` : '-'}
              />
              <StatCard
                label="ค่าใช้จ่ายทั้งหมด"
                value={formatBaht(dashData.totalExpenses)}
                accent="text-rose"
                sub={dashData.expensePct ? `${dashData.expensePct}% Attribution Rate` : '-'}
              />
              <StatCard
                label={isProfit ? 'กำไรสุทธิ (ประมาณการ)' : 'ขาดทุนสุทธิ (ประมาณการ)'}
                value={formatBaht(Math.abs(dashData.netProfit))}
                accent={isProfit ? 'text-sage' : 'text-rose'}
                sub={dashData.netProfitPct ? `${dashData.netProfitPct}% สัดส่วนกำไร` : (isProfit ? '▲ กำไรสุทธิ' : '▼ ขาดทุนสุทธิ')}
              />
            </div>

            {/* Guideline Banner */}
            <div className="glass p-3 bg-amber-500/5 border-amber-500/20 text-xs text-amber-900 flex items-center justify-between gap-3">
              <span>💡 <b>Control & Alert Manager:</b> ระบบแจ้งเตือนอัตโนมัติเมื่อใช้เกิน 80% (🟡 เตือน) และเกิน 100% (🔴 เกินงบ)</span>
              <button onClick={() => onNavigate && onNavigate('budgets')} className="text-amber-700 underline font-medium hover:text-amber-900 shrink-0">
                ตั้งงบประมาณ ⚙️
              </button>
            </div>

            {/* กราฟงบเทียบยอดใช้จริง */}
            <div className="glass p-6">
              <h2 className="text-ink-900 font-medium mb-4">งบประมาณเทียบยอดใช้จ่ายจริงรายหมวดหมู่</h2>
              {chartData.length === 0 ? (
                <p className="text-ink-400 text-sm text-center py-12">ยังไม่มีข้อมูลงบหรือรายจ่ายในปีนี้</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                    <XAxis dataKey="name" tick={{ fill: '#6e6e73', fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
                    <YAxis tick={{ fill: '#6e6e73', fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatBaht(v)} contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="งบ" fill="#8484c2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ใช้จริง" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ตารางแจกแจงรายหมวดหมู่ + Alert System & % */}
            <div className="glass p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">หมวดหมู่</th>
                    <th className="px-4 py-3">งบที่ตั้งไว้</th>
                    <th className="px-4 py-3">ใช้จริง</th>
                    <th className="px-4 py-3">คงเหลือ</th>
                    <th className="px-4 py-3">% ใช้ไป</th>
                    <th className="px-4 py-3">สถานะ Control Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashData.byCategory ?? []).length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-400">ยังไม่มีข้อมูล</td></tr>
                  )}
                  {(dashData.byCategory ?? []).map((c) => {
                    const totalExp = dashData.totalExpenses > 0 ? dashData.totalExpenses : 1
                    const sharePct = ((c.actual / totalExp) * 100).toFixed(1)
                    return (
                      <tr key={c.category} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01]">
                        <td className="px-4 py-3 text-ink-900 font-medium">
                          {c.category}
                          <span className="text-xs text-ink-400 font-normal block">({sharePct}% ของรายจ่ายทั้งหมด)</span>
                        </td>
                        <td className="px-4 py-3 text-ink-700">{c.budget > 0 ? formatBaht(c.budget) : <span className="text-ink-400">ยังไม่ได้ตั้งงบ</span>}</td>
                        <td className="px-4 py-3 text-ink-700 font-medium">{formatBaht(c.actual)}</td>
                        <td className={`px-4 py-3 ${c.remaining < 0 ? 'text-rose font-medium' : 'text-ink-700'}`}>{formatBaht(c.remaining)}</td>
                        <td className={`px-4 py-3 ${utilizationColor(c.pctUsed)}`}>
                          {c.pctUsed === null ? '-' : `${c.pctUsed}%`}
                        </td>
                        <td className="px-4 py-3">
                          <AlertBadge pct={c.pctUsed} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* เส้นแบ่ง 2 ส่วน */}
      <div className="border-t-2 border-dashed border-black/10" />

      {/* ══════════════════════════════════════════════
          ส่วนที่ 2 — รายละเอียดแยกตามกลุ่มรหัสบัญชี + จิ้มแล้วรู้
          filter: ปี + เดือน (แยกจากส่วนบน)
      ══════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display italic text-2xl text-ink-900">รายละเอียดตามกลุ่มรหัสบัญชี (Drill-down)</h2>
            <p className="text-ink-600 text-sm mt-0.5">
              แสดง % ของยอดรวม และสามารถกด <b>🔍 จิ้มดูรายการ</b> เพื่อเจาะลึกที่มาของยอดใช้จ่ายในเดือน/ปี ได้ทันที
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              onClick={expandAllRpt}
              className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1 border border-black/10 hover:bg-black/5 cursor-pointer"
            >
              <span>📂</span> ขยายทั้งหมด
            </button>
            <button
              type="button"
              onClick={collapseAllRpt}
              className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1 border border-black/10 hover:bg-black/5 cursor-pointer"
            >
              <span>📁</span> ย่อทั้งหมด
            </button>
            <select
              id="exec-rpt-month"
              className="glass-input text-sm w-36"
              value={rptMonth}
              onChange={(e) => setRptMonth(e.target.value)}
            >
              <option value="">ทั้งปี</option>
              {THAI_MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              id="exec-rpt-year"
              className="glass-input text-sm w-28"
              value={rptYear}
              onChange={(e) => setRptYear(Number(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {rptError && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{rptError}</p>}

        {!canRpt && (
          <p className="text-ink-400 text-sm bg-ink-50 border border-black/10 rounded-lg px-4 py-3">
            คุณไม่มีสิทธิ์ดูรายงานส่วนนี้ — ติดต่อ Admin เพื่อขอสิทธิ์ <code className="text-xs bg-black/5 rounded px-1">exec-report</code>
          </p>
        )}

        {canRpt && rptLoading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

        {canRpt && !rptLoading && rptData && (
          <>
            {/* ยอดรวมส่วนล่าง */}
            <div className="glass p-4 flex items-center justify-between">
              <div>
                <p className="text-ink-600 text-sm font-medium">
                  ยอดรวมรายจ่ายทั้งหมด{rptMonth ? ` ${THAI_MONTHS[Number(rptMonth) - 1]}` : ''} {rptYear}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">รวมทุกกลุ่มรหัสบัญชีที่มีข้อมูลในระบบ</p>
              </div>
              <p className="font-display italic text-3xl text-gold-dark font-bold">{formatBaht(rptData.grandTotal)}</p>
            </div>

            {/* กลุ่มรหัสบัญชีจากหน้า "กลุ่มรหัสบัญชี" พร้อม % รวม และ % Attribution Rate */}
            {rptData.groups?.length > 0
              ? rptData.groups.map((g) => (
                  <GroupBlock
                    key={g.groupId}
                    group={g}
                    grandTotal={rptData.grandTotal}
                    netRevenue={dashData?.totalRevenue ?? 0}
                    onInspect={handleInspectGroup}
                    isCollapsed={Boolean(collapsedRptGroups[g.groupId])}
                    onToggleCollapse={() => toggleRptGroup(g.groupId)}
                  />
                ))
              : null
            }

            {/* รหัสที่ยังไม่ได้จัดกลุ่ม — แสดงเป็น warning banner */}
            {rptData.ungroupedAccounts?.length > 0 && (() => {
              const ugTotal = rptData.ungroupedAccounts.reduce((s, a) => s + a.total, 0)
              return (
                <div className="bg-amber-50 border border-amber-300/60 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                    <div>
                      <p className="text-amber-800 font-medium text-sm">
                        มีรหัสบัญชีที่ยังไม่ได้จัดกลุ่ม {rptData.ungroupedAccounts.length} รหัส — ยอดรวม {formatBaht(ugTotal)} บาท
                      </p>
                      <p className="text-amber-600 text-xs mt-0.5">รหัสเหล่านี้ถูกแยกออกจากรายงาน กรุณาจัดกลุ่มก่อนเพื่อให้ยอดรวมถูกต้องสมบูรณ์</p>
                    </div>
                  </div>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('account-groups')}
                      className="btn-primary text-xs px-3 py-1.5 shrink-0"
                    >
                      📂 ไปจัดกลุ่มรหัสบัญชี
                    </button>
                  )}
                </div>
              )
            })()}

            {/* กรณีไม่มีข้อมูล */}
            {!rptData.groups?.length && !rptData.ungroupedAccounts?.length && (
              <p className="text-ink-400 text-sm text-center py-10 glass rounded-xl">
                ยังไม่มีข้อมูลในช่วงเวลานี้ — กรุณาแนบไฟล์ประมาณการกำไรขาดทุนก่อน
              </p>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          Modal Drill-down: "จิ้มแล้วรู้ว่าใช้จ่ายกับอะไรบ้าง"
      ══════════════════════════════════════════════ */}
      {drillTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-solid max-w-3xl w-full max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border border-black/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-gold-pale/30">
              <div>
                <span className="doc-badge text-xs mb-1">Drill-down Inspect</span>
                <h3 className="font-display italic text-xl text-ink-900">
                  รายการย่อย: {drillTarget.name} ({rptMonth ? THAI_MONTHS[Number(rptMonth) - 1] : 'ทั้งปี'} {rptYear})
                </h3>
              </div>
              <button
                onClick={() => setDrillTarget(null)}
                className="text-ink-400 hover:text-ink-900 text-xl px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {drillLoading ? (
                <p className="text-ink-500 text-sm text-center py-8">กำลังดึงที่มารายการย่อย...</p>
              ) : drillItems.length === 0 ? (
                <p className="text-ink-400 text-sm text-center py-8">ไม่พบบรรทัดรายการในไฟล์แนบ</p>
              ) : (
                <div className="glass p-0 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase">
                        <th className="px-4 py-2.5">รหัสบัญชี</th>
                        <th className="px-4 py-2.5">ชื่อบัญชี</th>
                        <th className="px-4 py-2.5">เดือน</th>
                        <th className="px-4 py-2.5">ยอดเงิน (บาท)</th>
                        <th className="px-4 py-2.5">ไฟล์ที่มา</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drillItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01]">
                          <td className="px-4 py-2.5 font-mono text-ocean text-xs">{item.accountCode}</td>
                          <td className="px-4 py-2.5 text-ink-800">{item.accountName}</td>
                          <td className="px-4 py-2.5 text-ink-600">{THAI_MONTHS[item.month - 1] || item.month}</td>
                          <td className="px-4 py-2.5 text-ink-900 font-semibold tabular-nums">{formatBaht(item.amount)}</td>
                          <td className="px-4 py-2.5 text-ink-400 text-xs truncate max-w-[150px]" title={item.fileName}>
                            📄 {item.fileName || 'ไฟล์นำเข้า'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-black/10 bg-ink-50 flex items-center justify-between">
              <span className="text-xs text-ink-500">รวมทั้งสิ้น {drillItems.length} รายการ</span>
              <button onClick={() => setDrillTarget(null)} className="btn-secondary text-xs px-4 py-1.5">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

```

---

### 📄 File: `src\pages\ExecutiveReportPage.jsx`
```jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import ExportModal from '../components/ExportModal'

function formatBaht(n) {
  if (n === null || n === undefined) return '-'
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function buildExcelSheet(data, year) {
  const header = ['รหัสบัญชี', 'ชื่อบัญชี', ...MONTH_SHORT, 'รวม']
  const rows = [header, ['', 'รายได้รวม', ...data.revenueMonthly, data.revenueTotal]]
  for (const g of data.groups) {
    rows.push([g.code, g.name, ...g.pctOfRevenueMonthly.map((p) => (p !== null ? `${p}%` : '')), g.pctOfRevenueTotal !== null ? `${g.pctOfRevenueTotal}%` : ''])
    for (const a of g.accounts) rows.push([a.code, a.name, ...a.monthly, a.total])
    rows.push(['', `รวม ${g.name}`, ...g.monthly, g.total])
  }
  if (data.ungroupedAccounts.length > 0) {
    rows.push(['', 'รหัสบัญชีที่ยังไม่มีกลุ่ม'])
    for (const a of data.ungroupedAccounts) rows.push([a.code, a.name, ...a.monthly, a.total])
  }
  return [{ name: `รายงานผู้บริหาร ${year}`, rows }]
}

export default function ExecutiveReportPage({ onNavigate }) {
  const { currentUser } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState('') // '' = ทั้งปี, '1'-'12' = เฉพาะเดือน
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canUse = hasPagePermission(currentUser, 'exec-report')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_executive_monthly_report', {
      p_actor_id: currentUser?.id ?? null, p_year: year,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setError(res.message)
    setData(res)
  }, [currentUser, year])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  const filteredData = useMemo(() => {
    if (!data) return null
    if (!month) return data

    const selectedM = Number(month) - 1
    const filterMonthlyArray = (arr) => {
      const newArr = Array(12).fill(0)
      if (Array.isArray(arr) && arr[selectedM] !== undefined) {
        newArr[selectedM] = arr[selectedM]
      }
      return newArr
    }

    const newGroups = (data.groups ?? []).map((g) => {
      const gMonthly = filterMonthlyArray(g.monthly)
      const gAccounts = (g.accounts ?? []).map((a) => {
        const aMonthly = filterMonthlyArray(a.monthly)
        return { ...a, monthly: aMonthly, total: aMonthly[selectedM] || 0 }
      })
      return {
        ...g,
        accounts: gAccounts,
        monthly: gMonthly,
        total: gMonthly[selectedM] || 0,
      }
    })

    const newRevMonthly = filterMonthlyArray(data.revenueMonthly)

    return {
      ...data,
      revenueMonthly: newRevMonthly,
      revenueTotal: newRevMonthly[selectedM] || 0,
      groups: newGroups,
    }
  }, [data, month])

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">รายงานผู้บริหาร</h1>
          <p className="text-ink-600 text-sm mt-1">ประมาณการกำไร(ขาดทุน) แยกตามกลุ่ม → รหัสบัญชี รายเดือน (ตาม template งบบริหาร)</p>
        </div>
        <div className="flex items-center gap-2">
          {filteredData && <ExportModal fileNameBase={`รายงานผู้บริหาร_${year}`} excelSheets={buildExcelSheet(filteredData, year)} pdfPreview={<ExecReportPdfPreview data={filteredData} year={year} />} />}
          <select className="glass-input text-sm w-36" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">ทุกเดือน (ทั้งปี)</option>
            {MONTH_SHORT.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select className="glass-input text-sm w-28" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      {!loading && data && (() => {
        // คำนวณ grand total ของทุกกลุ่ม
        const groupGrandMonthly = Array(12).fill(0)
        data.groups.forEach((g) => (g.monthly ?? []).forEach((v, i) => { groupGrandMonthly[i] += Number(v ?? 0) }))
        const groupGrandTotal = data.groups.reduce((s, g) => s + Number(g.total ?? 0), 0)

        // ungrouped total
        const ungroupedTotal = (data.ungroupedAccounts ?? []).reduce((s, a) => s + Number(a.total ?? 0), 0)
        const ungroupedMonthly = Array(12).fill(0)
        ;(data.ungroupedAccounts ?? []).forEach((a) => (a.monthly ?? []).forEach((v, i) => { ungroupedMonthly[i] += Number(v ?? 0) }))

        return (
          <>
            {/* Warning Banner สำหรับ ungrouped */}
            {(data.ungroupedAccounts ?? []).length > 0 && (
              <div className="bg-amber-50 border border-amber-300/60 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2">
                  <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                  <div>
                    <p className="text-amber-800 font-medium text-sm">
                      มีรหัสบัญชีที่ยังไม่ได้จัดกลุ่ม {(data.ungroupedAccounts ?? []).length} รหัส — ยอดรวม {formatBaht(ungroupedTotal)} บาท
                    </p>
                    <p className="text-amber-600 text-xs mt-0.5">
                      รหัสเหล่านี้ถูกแยกออกจากรายงาน กรุณาจัดกลุ่มก่อนเพื่อให้ยอดรวมถูกต้องสมบูรณ์
                    </p>
                  </div>
                </div>
                {onNavigate && (
                  <button
                    onClick={() => onNavigate('account-groups')}
                    className="btn-primary text-xs px-3 py-1.5 shrink-0"
                  >
                    📂 ไปจัดกลุ่มรหัสบัญชี
                  </button>
                )}
              </div>
            )}

            <div className="glass p-4 overflow-x-auto">
              <table className="w-full text-xs border-collapse min-w-[1400px]">
                <thead>
                  <tr className="border-b-2 border-black/15 text-ink-500">
                    <th className="text-left py-2 pr-2 w-24">รหัสบัญชี</th>
                    <th className="text-left py-2 pr-2 w-52">ชื่อบัญชี</th>
                    {MONTH_SHORT.map((m) => <th key={m} className="text-right py-2 px-2 w-24">{m}</th>)}
                    <th className="text-right py-2 pl-2 w-28">รวม</th>
                  </tr>
                </thead>
                <tbody>
                  {/* ─── รายได้รวม ─── */}
                  <tr className="bg-sage-pale/40 font-medium">
                    <td className="py-1.5" colSpan={2}>รายได้รวม</td>
                    {data.revenueMonthly.map((v, i) => (
                      <td key={i} className="text-right py-1.5 px-2 text-sage tabular-nums">{formatBaht(v)}</td>
                    ))}
                    <td className="text-right py-1.5 pl-2 text-sage tabular-nums">{formatBaht(data.revenueTotal)}</td>
                  </tr>

                  {/* ─── กลุ่มรหัสบัญชี ─── */}
                  {data.groups.map((g, gIdx) => (
                    <React.Fragment key={g.groupId}>
                      <tr className="bg-ink-100/60">
                        <td colSpan={2} className="py-2 px-1">
                          <span className="text-[10px] text-ink-400 mr-1">กลุ่ม {gIdx + 1}.</span>
                          <span className="doc-badge mr-2">{g.code}</span>
                          <span className="text-ink-900 font-medium">{g.name}</span>
                          {g.pctOfRevenueTotal !== null && (
                            <span className="text-ink-400 ml-2">({g.pctOfRevenueTotal}% ของรายได้)</span>
                          )}
                        </td>
                        {g.pctOfRevenueMonthly.map((p, i) => (
                          <td key={i} className="text-right py-2 px-2 text-ink-400 tabular-nums">{p !== null ? `${p}%` : ''}</td>
                        ))}
                        <td></td>
                      </tr>
                      {g.accounts.map((a) => (
                        <tr key={a.code} className="border-b border-black/5 hover:bg-black/[0.015]">
                          <td className="py-1 pr-2 pl-4 text-ocean font-mono">{a.code}</td>
                          <td className="py-1 pr-2 text-ink-700">{a.name}</td>
                          {a.monthly.map((v, i) => (
                            <td key={i} className="text-right py-1 px-2 text-ink-800 tabular-nums">{v !== 0 ? formatBaht(v) : ''}</td>
                          ))}
                          <td className="text-right py-1 pl-2 text-ink-900 font-medium tabular-nums">{formatBaht(a.total)}</td>
                        </tr>
                      ))}
                      <tr className="bg-white/40 border-b border-black/10">
                        <td colSpan={2} className="py-1 pl-4 text-ink-400 italic">รวม {g.name}</td>
                        {g.monthly.map((v, i) => (
                          <td key={i} className="text-right py-1 px-2 text-ink-600 font-medium tabular-nums">{formatBaht(v)}</td>
                        ))}
                        <td className="text-right py-1 pl-2 text-ink-600 font-medium tabular-nums">{formatBaht(g.total)}</td>
                      </tr>
                    </React.Fragment>
                  ))}

                  {/* ─── รวมทุกกลุ่ม (Grand Total) ─── */}
                  {data.groups.length > 0 && (
                    <tr className="border-t-2 border-ocean/30 bg-ocean/5">
                      <td colSpan={2} className="py-2 px-2 font-bold text-ocean text-xs">
                        รวมทั้งหมด {data.groups.length} กลุ่ม (ยอดรวมรายจ่าย)
                      </td>
                      {groupGrandMonthly.map((v, i) => (
                        <td key={i} className="text-right py-2 px-2 font-bold text-ocean tabular-nums">{v !== 0 ? formatBaht(v) : ''}</td>
                      ))}
                      <td className="text-right py-2 pl-2 font-bold text-ocean tabular-nums">{formatBaht(groupGrandTotal)}</td>
                    </tr>
                  )}

                  {/* ─── กำไร(ขาดทุน)สุทธิ ─── */}
                  {data.groups.length > 0 && (() => {
                    const netMonthly = (data.revenueMonthly ?? Array(12).fill(0)).map((r, i) => Number(r) - groupGrandMonthly[i])
                    const netTotal = Number(data.revenueTotal ?? 0) - groupGrandTotal
                    return (
                      <tr className={`border-t-2 ${netTotal >= 0 ? 'border-sage/40 bg-sage-pale/30' : 'border-rose/40 bg-rose-pale/30'}`}>
                        <td colSpan={2} className={`py-2 px-2 font-bold text-sm ${netTotal >= 0 ? 'text-sage' : 'text-rose'}`}>
                          {netTotal >= 0 ? '▲ กำไร(ขาดทุน)สุทธิประมาณการ' : '▼ กำไร(ขาดทุน)สุทธิประมาณการ'}
                        </td>
                        {netMonthly.map((v, i) => (
                          <td key={i} className={`text-right py-2 px-2 font-bold tabular-nums ${v >= 0 ? 'text-sage' : 'text-rose'}`}>
                            {v !== 0 ? formatBaht(v) : ''}
                          </td>
                        ))}
                        <td className={`text-right py-2 pl-2 font-bold tabular-nums ${netTotal >= 0 ? 'text-sage' : 'text-rose'}`}>
                          {formatBaht(netTotal)}
                        </td>
                      </tr>
                    )
                  })()}
                </tbody>
              </table>
              <p className="text-ink-400 text-xs mt-3">
                % คำนวณจากยอดของแต่ละกลุ่ม เทียบกับ "รายได้รวม" —
                รหัสที่ยังไม่ได้จัดกลุ่ม <span className="text-amber-600 font-medium">จะไม่ถูกรวม</span> ในยอดนี้
                {(data.ungroupedAccounts ?? []).length > 0 && ` (${(data.ungroupedAccounts ?? []).length} รหัส, ยอด ${formatBaht(ungroupedTotal)} บาท)`}
              </p>
            </div>
          </>
        )
      })()}
    </div>
  )
}

// เวอร์ชันสำหรับพิมพ์/PDF — ตัวหนังสือดำบนพื้นขาวล้วน ไม่มี glass effect (พิมพ์ออกมาแล้วอ่านง่าย)
function ExecReportPdfPreview({ data, year }) {
  return (
    <div style={{ color: '#1d1d1f' }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>รายงานผู้บริหาร ปี {year}</h1>
      <p style={{ fontSize: 11, textAlign: 'center', color: '#6e6e73', marginBottom: 16 }}>
        ประมาณการกำไร(ขาดทุน) แยกตามกลุ่ม → รหัสบัญชี รายเดือน — พิมพ์เมื่อ {new Date().toLocaleDateString('th-TH')}
      </p>
      <table style={{ width: '100%', fontSize: 9, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #1d1d1f' }}>
            <th style={{ textAlign: 'left', padding: 4 }}>รหัส</th>
            <th style={{ textAlign: 'left', padding: 4 }}>ชื่อบัญชี</th>
            {MONTH_SHORT.map((m) => <th key={m} style={{ textAlign: 'right', padding: 4 }}>{m}</th>)}
            <th style={{ textAlign: 'right', padding: 4 }}>รวม</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ backgroundColor: '#eaf7ef', fontWeight: 'bold' }}>
            <td style={{ padding: 4 }} colSpan={2}>รายได้รวม</td>
            {data.revenueMonthly.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: 4 }}>{formatBaht(v)}</td>)}
            <td style={{ textAlign: 'right', padding: 4 }}>{formatBaht(data.revenueTotal)}</td>
          </tr>
          {data.groups.map((g) => (
            <React.Fragment key={g.groupId}>
              <tr style={{ backgroundColor: '#f5f5f7' }}>
                <td style={{ padding: 4, fontWeight: 'bold' }} colSpan={2}>{g.code} {g.name} {g.pctOfRevenueTotal !== null ? `(${g.pctOfRevenueTotal}%)` : ''}</td>
                <td colSpan={13}></td>
              </tr>
              {g.accounts.map((a) => (
                <tr key={a.code} style={{ borderBottom: '1px solid #e8e8ed' }}>
                  <td style={{ padding: '2px 4px 2px 12px' }}>{a.code}</td>
                  <td style={{ padding: '2px 4px' }}>{a.name}</td>
                  {a.monthly.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '2px 4px' }}>{v !== 0 ? formatBaht(v) : ''}</td>)}
                  <td style={{ textAlign: 'right', padding: '2px 4px', fontWeight: 'bold' }}>{formatBaht(a.total)}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid #d2d2d7' }}>
                <td style={{ padding: '2px 4px 2px 12px', fontStyle: 'italic', color: '#6e6e73' }} colSpan={2}>รวม {g.name}</td>
                {g.monthly.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '2px 4px' }}>{formatBaht(v)}</td>)}
                <td style={{ textAlign: 'right', padding: '2px 4px', fontWeight: 'bold' }}>{formatBaht(g.total)}</td>
              </tr>
            </React.Fragment>
          ))}
          {data.ungroupedAccounts.length > 0 && (
            <>
              <tr><td style={{ padding: 4, fontWeight: 'bold' }} colSpan={15}>รหัสบัญชีที่ยังไม่มีกลุ่ม</td></tr>
              {data.ungroupedAccounts.map((a) => (
                <tr key={a.code}>
                  <td style={{ padding: '2px 4px 2px 12px' }}>{a.code}</td>
                  <td style={{ padding: '2px 4px' }}>{a.name}</td>
                  {a.monthly.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '2px 4px' }}>{v !== 0 ? formatBaht(v) : ''}</td>)}
                  <td style={{ textAlign: 'right', padding: '2px 4px', fontWeight: 'bold' }}>{formatBaht(a.total)}</td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}

```

---

### 📄 File: `src\pages\ExpenseEntryPage.jsx`
```jsx
import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { MAIN_CATEGORIES, DETAILS } from '../lib/constants'

function emptyItem() {
  return { mainCategory: '', detail: '', qty: '', unit: '', unitPrice: '', remark: '', accountId: '' }
}

export default function ExpenseEntryPage() {
  const { currentUser } = useAuth()
  const [storeName, setStoreName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [attendees, setAttendees] = useState('')
  const [workDays, setWorkDays] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [accountOptions, setAccountOptions] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.rpc('list_accounts_for_selection', { p_actor_id: currentUser?.id ?? null }).then(({ data, error: err }) => {
      if (!err) setAccountOptions(data ?? [])
    })
  }, [currentUser])

  const grandTotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = parseFloat(it.qty) || 0
      const p = parseFloat(it.unitPrice) || 0
      return sum + q * p
    }, 0)
  }, [items])

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItem(index) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  // ตรวจสอบฝั่ง client ก่อนยิง — เป็นแค่ UX feedback เร็วๆ
  // การตรวจสอบจริงที่ "บังคับใช้" คือฝั่ง RPC save_expense_record ใน Postgres เสมอ
  function validateClientSide() {
    if (!storeName.trim()) return 'กรุณากรอกชื่อร้านค้า / ชื่องาน'
    if (!eventDate) return 'กรุณาเลือกวันที่จัดงาน'
    if (items.length === 0) return 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ'
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.mainCategory.trim()) return `รายการที่ ${i + 1}: กรุณาเลือกหมวดหมู่หลัก`
      if (!it.detail.trim()) return `รายการที่ ${i + 1}: กรุณาเลือกรายละเอียด`
      if (!it.accountId) return `รายการที่ ${i + 1}: กรุณาเลือกรหัสบัญชี`
      const qty = parseFloat(it.qty)
      const unitPrice = parseFloat(it.unitPrice)
      if (isNaN(qty) || qty <= 0) return `รายการที่ ${i + 1}: จำนวนต้องมากกว่า 0`
      if (isNaN(unitPrice) || unitPrice < 0) return `รายการที่ ${i + 1}: ราคาต่อหน่วยไม่ถูกต้อง`
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(null)
    const clientError = validateClientSide()
    if (clientError) {
      setError(clientError)
      return
    }
    setSubmitting(true)
    const { data, error: rpcError } = await supabase.rpc('save_expense_record', {
      p_store_name: storeName,
      p_event_date: eventDate,
      p_attendees: attendees ? parseInt(attendees, 10) : 0,
      p_work_days: workDays ? parseInt(workDays, 10) : 0,
      p_internal_note: internalNote,
      p_created_by: currentUser?.id ?? null,
      p_items: items,
    })
    setSubmitting(false)
    if (rpcError) {
      setError('เกิดข้อผิดพลาด: ' + rpcError.message)
      return
    }
    if (!data.success) {
      setError(data.message)
      return
    }
    setSuccess(data)
    setStoreName('')
    setEventDate('')
    setAttendees('')
    setWorkDays('')
    setInternalNote('')
    setItems([emptyItem()])
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">บันทึกค่าใช้จ่าย</h1>
        <p className="text-ink-600 text-sm mt-1">เพิ่มรายการค่าใช้จ่ายสำหรับร้านค้า/งานหนึ่งครั้ง (ออกเลขที่เอกสารอัตโนมัติ)</p>
      </div>

      {success && (
        <div className="glass p-4 flex items-center gap-3 border-sage/30">
          <span className="doc-badge">{success.docNo}</span>
          <p className="text-sage text-sm">{success.message} — บันทึก {success.rowsSaved} รายการ</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-ink-600 mb-1.5">ชื่อร้านค้า / ชื่องาน *</label>
            <input className="glass-input w-full" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">วันที่จัดงาน *</label>
            <input type="date" className="glass-input w-full" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">จำนวนผู้เข้างาน</label>
            <input type="number" min="0" className="glass-input w-full" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">จำนวนวันทำงาน</label>
            <input type="number" min="0" className="glass-input w-full" value={workDays} onChange={(e) => setWorkDays(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">หมายเหตุภายใน</label>
            <input className="glass-input w-full" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
          </div>
        </div>

        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-ink-900 font-medium">รายการค่าใช้จ่าย</h2>
            <button type="button" onClick={addItem} className="btn-ghost text-sm">+ เพิ่มรายการ</button>
          </div>

          {items.map((it, i) => (
            <div key={i} className="glass-solid p-4 grid grid-cols-1 sm:grid-cols-6 gap-3 relative">
              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-600 mb-1">หมวดหมู่หลัก *</label>
                <select className="glass-input w-full" value={it.mainCategory} onChange={(e) => updateItem(i, 'mainCategory', e.target.value)}>
                  <option value="">— เลือก —</option>
                  {MAIN_CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-600 mb-1">รายละเอียด *</label>
                <select className="glass-input w-full" value={it.detail} onChange={(e) => updateItem(i, 'detail', e.target.value)}>
                  <option value="">— เลือก —</option>
                  {DETAILS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-600 mb-1">รหัสบัญชี *</label>
                <select className="glass-input w-full" value={it.accountId} onChange={(e) => updateItem(i, 'accountId', e.target.value)}>
                  <option value="">— เลือก —</option>
                  {accountOptions.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink-600 mb-1">จำนวน *</label>
                <input type="number" step="any" className="glass-input w-full" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-ink-600 mb-1">หน่วย</label>
                <input className="glass-input w-full" value={it.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-600 mb-1">ราคาต่อหน่วย *</label>
                <input type="number" step="any" min="0" className="glass-input w-full" value={it.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs text-ink-600 mb-1">หมายเหตุรายการ</label>
                <input className="glass-input w-full" value={it.remark} onChange={(e) => updateItem(i, 'remark', e.target.value)} />
              </div>
              <div className="sm:col-span-1 flex items-end justify-between">
                <span className="text-gold-dark text-sm">
                  = {((parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-rose text-xs hover:underline">ลบ</button>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2 border-t border-black/10">
            <p className="text-ink-900">
              รวมทั้งสิ้น: <span className="font-display italic text-gold-dark text-xl ml-2">
                {grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>

        {error && (
          <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </form>
    </div>
  )
}

```

---

### 📄 File: `src\pages\ExpenseHistoryPage.jsx`
```jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import ExpenseEditModal from '../components/ExpenseEditModal'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatThaiDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return isoDate
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear() + 543
  return `${day}/${month}/${year}`
}

export default function ExpenseHistoryPage() {
  const { currentUser } = useAuth()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [expandedDoc, setExpandedDoc] = useState(null)
  const [editingDoc, setEditingDoc] = useState(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_expense_history')
    setLoading(false)
    if (err) {
      setError('เกิดข้อผิดพลาด: ' + err.message)
      return
    }
    setRows(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const documents = useMemo(() => {
    const byDoc = new Map()
    for (const r of rows) {
      if (!byDoc.has(r.doc_number)) {
        byDoc.set(r.doc_number, {
          docNo: r.doc_number,
          storeName: r.store_name,
          eventDate: r.event_date,
          attendees: r.attendees,
          workDays: r.work_days,
          internalNote: r.internal_note,
          items: [],
          total: 0,
        })
      }
      const doc = byDoc.get(r.doc_number)
      doc.items.push({
        mainCategory: r.main_category, detail: r.detail, qty: r.qty,
        unit: r.unit, unitPrice: r.unit_price, remark: r.remark, total: r.total, accountId: r.account_id,
      })
      doc.total += Number(r.total) || 0
    }
    let list = Array.from(byDoc.values())
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((d) => d.docNo.toLowerCase().includes(q) || d.storeName.toLowerCase().includes(q))
    }
    return list
  }, [rows, search])

  async function handleRequestDelete(docNo) {
    if (!confirm(`ยืนยันส่งคำขอลบเอกสาร ${docNo}? (ต้องรอผู้มีสิทธิ์อนุมัติ)`)) return
    const { data, error: err } = await supabase.rpc('request_delete_record', {
      p_doc_number: docNo,
      p_requested_by: currentUser?.id ?? null,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">ประวัติรายการ</h1>
          <p className="text-ink-600 text-sm mt-1">การแก้ไข/ลบต้องส่งคำขอและรอผู้มีสิทธิ์อนุมัติ</p>
        </div>
        <input
          className="glass-input text-sm w-64"
          placeholder="ค้นหาเลขที่เอกสาร / ชื่อร้าน..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      {!loading && documents.length === 0 && (
        <div className="glass p-10 text-center text-ink-500 text-sm">ยังไม่มีรายการค่าใช้จ่าย</div>
      )}

      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.docNo} className="glass glass-card-hover p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="doc-badge">{doc.docNo}</span>
                <div>
                  <p className="text-ink-900 text-sm">{doc.storeName}</p>
                  <p className="text-ink-500 text-xs">{formatThaiDate(doc.eventDate)} · {doc.items.length} รายการ</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gold-dark font-display italic text-lg">{formatBaht(doc.total)}</span>
                <button onClick={() => setExpandedDoc(expandedDoc === doc.docNo ? null : doc.docNo)} className="btn-ghost text-xs px-3 py-1.5">
                  {expandedDoc === doc.docNo ? 'ย่อ' : 'ดูรายการ'}
                </button>
                <button onClick={() => setEditingDoc(doc)} className="btn-ghost text-xs px-3 py-1.5">ขอแก้ไข</button>
                <button onClick={() => handleRequestDelete(doc.docNo)} className="text-rose text-xs hover:underline">ขอลบ</button>
              </div>
            </div>

            {expandedDoc === doc.docNo && (
              <div className="mt-4 pt-4 border-t border-black/10 space-y-2">
                {doc.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm text-ink-700">
                    <span>{it.mainCategory} — {it.detail} {it.remark && `(${it.remark})`}</span>
                    <span>{it.qty} {it.unit} × {formatBaht(it.unitPrice)} = {formatBaht(it.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {editingDoc && (
        <ExpenseEditModal
          doc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSubmitted={(message) => { setNotice(message); setEditingDoc(null) }}
        />
      )}
    </div>
  )
}

```

---

### 📄 File: `src\pages\ExternalExpensePage.jsx`
```jsx
﻿import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

export default function ExternalExpensePage() {
  const { currentUser } = useAuth()
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canUse = hasPagePermission(currentUser, 'account-import') || hasPagePermission(currentUser, 'exec-dashboard')

  const loadSources = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_external_sources', {
      p_actor_id: currentUser?.id ?? null,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setError(res.message)
    setSources(res.sources || [])
  }, [currentUser])

  useEffect(() => {
    if (canUse) loadSources()
  }, [canUse, loadSources])

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="doc-badge bg-ocean-pale text-ocean border-ocean/30 mb-2">Ready System / External Integration</span>
          <h1 className="font-display italic text-3xl text-ink-900">ค่าใช้จ่ายช่องทางภายนอก (Beautrium / E-Commerce)</h1>
          <p className="text-ink-600 text-sm mt-1">
            ระบบเตรียมความพร้อมสำหรับรองรับข้อมูลค่าใช้จ่ายและค่าบริการจากช่องทางภายนอกองค์กร
          </p>
        </div>
      </div>

      <div className="glass p-5 bg-gradient-to-br from-white to-gold-pale/10 border-gold/20">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🔌</span>
          <div>
            <h3 className="text-ink-900 font-medium text-base">ระบบเชื่อมต่อค่าใช้จ่ายภายนอก (External Expense Adapter)</h3>
            <p className="text-ink-600 text-sm mt-1">
              รองรับการนำเข้าไฟล์ Excel/CSV หรือ API จากแพลตฟอร์มพันธมิตร เช่น บิวเทรียม (Beautrium), Shopee, Lazada และ TikTok Shop เพื่อกระทบยอดค่าใช้จ่ายและค่าธรรมเนียมภายนอกเข้ากับผังบัญชีหลัก
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลดช่องทางภายนอก...</p>}

      {!loading && (
        <div className="space-y-4">
          <h2 className="text-ink-900 font-display italic text-xl">ช่องทางภายนอกที่รองรับในระบบ (Active Adapters)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((src) => (
              <div key={src.id} className="glass p-5 border-l-4 border-ocean flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="doc-badge text-xs font-mono">{src.code}</span>
                    <span className="text-xs text-sage font-medium bg-sage-pale border border-sage/20 px-2 py-0.5 rounded-full">
                      ● พร้อมใช้งาน (Ready)
                    </span>
                  </div>
                  <h3 className="font-medium text-ink-900 text-base">{src.name}</h3>
                  <p className="text-ink-500 text-xs mt-1">{src.note}</p>
                </div>
                <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs text-ink-400">
                  <span>Channel: {src.channel}</span>
                  <button className="btn-ghost text-xs px-2 py-1 text-ocean hover:underline" onClick={() => alert(`ช่องทาง ${src.name} พร้อมสำหรับนำเข้าข้อมูล API / Import`)}>
                    ตั้งค่าการนำเข้า ⚙️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

```

---

### 📄 File: `src\pages\LoginPage.jsx`
```jsx
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result = await login(id, password)
    setSubmitting(false)
    if (!result.success) setError(result.message)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="โลโก้บริษัท" className="mx-auto mb-4 h-16 w-auto object-contain" />
          <h1 className="font-display italic text-4xl text-ink-900">GoCost</h1>
          <p className="text-ink-600 text-sm mt-1">ระบบวางแผนและติดตามงบการตลาด</p>
        </div>

        <form onSubmit={handleSubmit} className="glass p-8 space-y-5">
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">รหัสผู้ใช้งาน</label>
            <input
              className="glass-input w-full"
              value={id}
              onChange={(e) => setId(e.target.value)}
              autoComplete="username"
              placeholder="เช่น Kanok500"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">รหัสผ่าน</label>
            <input
              type="password"
              className="glass-input w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\PendingEditsPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const STATUS_LABEL = {
  pending_edit: { text: 'รออนุมัติ (แก้ไข)', className: 'text-gold-dark bg-gold-pale border-gold/30' },
  pending_delete: { text: 'รออนุมัติ (ลบ)', className: 'text-rose bg-rose-pale border-rose/30' },
  approved: { text: 'อนุมัติแล้ว', className: 'text-sage bg-sage-pale border-sage/30' },
  rejected: { text: 'ปฏิเสธแล้ว', className: 'text-ink-600 bg-ink-100 border-black/10' },
}

export default function PendingEditsPage() {
  const { currentUser } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')

  const canApprove = hasPagePermission(currentUser, 'pending-edits')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_pending_requests', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setRequests((data ?? []).sort((a, b) => new Date(b.request_timestamp) - new Date(a.request_timestamp)))
  }, [currentUser])

  useEffect(() => { load() }, [load])

  async function handleApprove(row) {
    setBusyId(row.edit_id)
    setError('')
    const rpcName = row.status === 'pending_edit' ? 'approve_edit_record' : 'approve_delete_record'
    const { data, error: err } = await supabase.rpc(rpcName, {
      p_edit_id: row.edit_id,
      p_actor_id: currentUser?.id ?? null,
    })
    setBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  async function handleReject(row) {
    setBusyId(row.edit_id)
    setError('')
    const { data, error: err } = await supabase.rpc('reject_pending_record', {
      p_edit_id: row.edit_id,
      p_admin_note: rejectNote,
      p_actor_id: currentUser?.id ?? null,
    })
    setBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setRejectingId(null)
    setRejectNote('')
    load()
  }

  if (!canApprove) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <h2 className="font-display italic text-2xl text-ink-900 mb-2">คำขออนุมัติแก้ไข/ลบ</h2>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน — ติดต่อ Admin หากคิดว่าควรมีสิทธิ์</p>
      </div>
    )
  }

  const pending = requests.filter((r) => r.status === 'pending_edit' || r.status === 'pending_delete')
  const processed = requests.filter((r) => r.status === 'approved' || r.status === 'rejected')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">คำขออนุมัติแก้ไข/ลบ</h1>
        <p className="text-ink-600 text-sm mt-1">รายการที่รอการอนุมัติจากผู้บริหาร</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      <div className="space-y-3">
        {pending.length === 0 && !loading && (
          <div className="glass p-8 text-center text-ink-500 text-sm">ไม่มีคำขอที่รออนุมัติ</div>
        )}
        {pending.map((row) => {
          const status = STATUS_LABEL[row.status]
          return (
            <div key={row.edit_id} className="glass p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="doc-badge">{row.original_row_id}</span>
                  <span className={`text-xs border rounded-full px-2.5 py-0.5 ${status.className}`}>{status.text}</span>
                </div>
                <p className="text-ink-500 text-xs">
                  ขอโดย {row.requested_by} · {new Date(row.request_timestamp).toLocaleString('th-TH')}
                </p>
              </div>

              {row.status === 'pending_edit' && row.new_data_json && (
                <div className="text-sm text-ink-700 bg-ink-100 rounded-lg p-3">
                  <p>ร้าน/งาน: {row.new_data_json.storeName}</p>
                  <p>วันที่: {row.new_data_json.eventDate}</p>
                  <p>จำนวนรายการใหม่: {row.new_data_json.items?.length ?? 0}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(row)}
                  disabled={busyId === row.edit_id}
                  className="btn-primary text-xs px-4 py-1.5 disabled:opacity-60"
                >
                  {busyId === row.edit_id ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                </button>
                <button
                  onClick={() => setRejectingId(rejectingId === row.edit_id ? null : row.edit_id)}
                  className="btn-ghost text-xs px-4 py-1.5"
                >
                  ปฏิเสธ
                </button>
              </div>

              {rejectingId === row.edit_id && (
                <div className="flex items-center gap-2 pt-2 border-t border-black/10">
                  <input
                    className="glass-input text-sm flex-1"
                    placeholder="เหตุผลการปฏิเสธ (ไม่บังคับ)"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                  <button onClick={() => handleReject(row)} disabled={busyId === row.edit_id} className="text-rose text-xs hover:underline whitespace-nowrap">
                    ยืนยันปฏิเสธ
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {processed.length > 0 && (
        <div>
          <h2 className="text-ink-500 text-xs uppercase tracking-wider mb-2">ดำเนินการแล้ว</h2>
          <div className="space-y-2">
            {processed.map((row) => {
              const status = STATUS_LABEL[row.status]
              return (
                <div key={row.edit_id} className="glass p-3 flex items-center justify-between text-sm opacity-70">
                  <div className="flex items-center gap-3">
                    <span className="doc-badge">{row.original_row_id}</span>
                    <span className={`text-xs border rounded-full px-2.5 py-0.5 ${status.className}`}>{status.text}</span>
                  </div>
                  <p className="text-ink-500 text-xs">{row.requested_by} → {row.processed_at ? new Date(row.processed_at).toLocaleString('th-TH') : ''}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

```

---

### 📄 File: `src\pages\PLReportPage.jsx`
```jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import ExportModal from '../components/ExportModal'

const MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function fmt(n) {
  if (n === null || n === undefined || n === 0) return '-'
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n) {
  if (n === null || n === undefined) return ''
  return n.toFixed(2) + '%'
}

function fmtV(n) {
  if (!n || n === 0) return ''
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildPlExcelSheet(raw, computed, year) {
  const header = ['\u0e23\u0e2b\u0e31\u0e2a\u0e1a\u0e31\u0e0d\u0e0a\u0e35', '\u0e0a\u0e37\u0e48\u0e2d\u0e1a\u0e31\u0e0d\u0e0a\u0e35', ...MONTH_SHORT, '\u0e23\u0e27\u0e21']
  if (!raw || !computed) return [{ name: `P&L ${year}`, rows: [header] }]
  const rows = [header]
  rows.push(['', 'รายได้รวม', ...computed.rev.map(v => v || ''), computed.revTotal || ''])
  ;(raw.groups ?? []).forEach(g => {
    rows.push([g.code, g.name, ...(g.monthly ?? []).map(v => Number(v) || ''), Number(g.total) || ''])
    ;(g.accounts ?? []).forEach(a => {
      rows.push([a.code, a.name, ...(a.monthly ?? []).map(v => Number(v) || ''), Number(a.total) || ''])
    })
    rows.push(['', `รวม ${g.name}`, ...(g.monthly ?? []).map(v => Number(v) || ''), Number(g.total) || ''])
  })
  rows.push(['', 'รวมค่าใช้จ่ายทั้งหมด', ...computed.totalExpMonthly.map(v => v || ''), computed.totalExpTotal || ''])
  rows.push(['', 'กำไร(ขาดทุน)สุทธิ', ...computed.netMonthly.map(v => v || ''), computed.netTotal || ''])
  return [{ name: `P&L ${year}`, rows }]
}

// Is this group a Revenue group?
function isRevenueGroup(g) {
  const n = (g.name ?? '').toLowerCase()
  return n.includes('รายได้') || n.includes('revenue') || n.includes('income')
}

// Is this group a COGS group?
function isCogsGroup(g) {
  const n = (g.name ?? '').toLowerCase()
  return n.includes('ต้นทุนสินค้า') || n.includes('ต้นทุน สินค้า') || n.includes('cogs') || n.includes('cost of goods')
}

// ─── Single expense group rows ──────────────────────────────────
function GroupSection({ group, revenueMonthly, revenueTotal }) {
  const monthly = (group.monthly ?? []).map(Number)
  const total = Number(group.total ?? 0)
  const pctMonthly = monthly.map((v, i) => (revenueMonthly[i] ?? 0) > 0 ? (v / revenueMonthly[i]) * 100 : null)
  const pctTotal = revenueTotal > 0 ? (total / revenueTotal) * 100 : null

  return (
    <>
      {/* กลุ่ม: % row */}
      <tr className="bg-[#f5f5f5] border-t-2 border-black/10">
        <td
          colSpan={2}
          className="px-2 py-1 text-[11px] font-bold text-ink-800 italic"
        >
          {group.name}
        </td>
        {pctMonthly.map((p, i) => (
          <td key={i} className="text-right px-2 py-1 text-[11px] text-ink-500 tabular-nums">{fmtPct(p)}</td>
        ))}
        <td className="text-right px-2 py-1 text-[11px] text-ink-500 tabular-nums">{fmtPct(pctTotal)}</td>
        <td className="px-2 text-right text-[10px] text-ink-400">{group.code}</td>
      </tr>

      {/* รายการรหัสบัญชีในกลุ่ม */}
      {(group.accounts ?? []).map((a) => (
        <tr key={a.code} className="border-b border-black/[0.04] hover:bg-black/[0.015]">
          <td className="px-2 py-[3px] font-mono text-[10px] text-[#0077b6] w-20 whitespace-nowrap">{a.code}</td>
          <td className="px-2 py-[3px] text-ink-700 text-[11px]">{a.name}</td>
          {(a.monthly ?? []).map((v, i) => (
            <td key={i} className="text-right px-2 py-[3px] text-[11px] text-ink-700 tabular-nums whitespace-nowrap">
              {Number(v) !== 0 ? fmtV(Number(v)) : ''}
            </td>
          ))}
          <td className="text-right px-2 py-[3px] text-[11px] font-medium text-ink-800 tabular-nums whitespace-nowrap">{fmtV(Number(a.total))}</td>
          <td />
        </tr>
      ))}

      {/* รวมกลุ่ม */}
      <tr className="border-b-2 border-black/10 bg-white/60">
        <td colSpan={2} className="px-6 py-[3px] text-[11px] italic text-ink-400">รวม {group.name}</td>
        {monthly.map((v, i) => (
          <td key={i} className="text-right px-2 py-[3px] text-[11px] font-semibold text-ink-600 tabular-nums whitespace-nowrap">{fmtV(v)}</td>
        ))}
        <td className="text-right px-2 py-[3px] text-[11px] font-bold text-ink-700 tabular-nums whitespace-nowrap">{fmtV(total)}</td>
        <td />
      </tr>
    </>
  )
}

// ─── Main Page ──────────────────────────────────────────────────
export default function PLReportPage() {
  const { currentUser } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState('') // '' = ทั้งปี, '1'-'12' = เฉพาะเดือน
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canUse = hasPagePermission(currentUser, 'pl-report')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_executive_monthly_report', {
      p_actor_id: currentUser?.id ?? null,
      p_year: year,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setError(res.message)
    setRaw(res)
  }, [currentUser, year])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  // Filter groups / monthly data by month if specified
  const filteredRaw = useMemo(() => {
    if (!raw) return null
    if (!month) return raw

    const selectedM = Number(month) - 1 // 0-indexed
    const filterMonthlyArray = (arr) => {
      const newArr = Array(12).fill(0)
      if (Array.isArray(arr) && arr[selectedM] !== undefined) {
        newArr[selectedM] = arr[selectedM]
      }
      return newArr
    }

    const newGroups = (raw.groups ?? []).map((g) => {
      const gMonthly = filterMonthlyArray(g.monthly)
      const gAccounts = (g.accounts ?? []).map((a) => {
        const aMonthly = filterMonthlyArray(a.monthly)
        return { ...a, monthly: aMonthly, total: aMonthly[selectedM] || 0 }
      })
      return {
        ...g,
        accounts: gAccounts,
        monthly: gMonthly,
        total: gMonthly[selectedM] || 0,
      }
    })

    const newRevMonthly = filterMonthlyArray(raw.revenueMonthly)

    return {
      ...raw,
      revenueMonthly: newRevMonthly,
      revenueTotal: newRevMonthly[selectedM] || 0,
      groups: newGroups,
    }
  }, [raw, month])

  // ─── คำนวณ summaries ─────────────────────────────────────────
  const computed = useMemo(() => {
    if (!filteredRaw) return null
    const rev = (filteredRaw.revenueMonthly ?? []).map(Number)
    const revTotal = Number(filteredRaw.revenueTotal ?? 0)

    const allGroups = (filteredRaw.groups ?? [])
    const cogsGroups = allGroups.filter(isCogsGroup)
    const revenueGroups = allGroups.filter(isRevenueGroup)
    const otherGroups = allGroups.filter(g => !isCogsGroup(g) && !isRevenueGroup(g))

    // รวม COGS รายเดือน
    const cogsMonthly = Array(12).fill(0)
    cogsGroups.forEach(g => (g.monthly ?? []).forEach((v, i) => { cogsMonthly[i] += Number(v ?? 0) }))
    const cogsTotal = cogsMonthly.reduce((s, v) => s + v, 0)

    // กำไรขั้นต้น
    const gpMonthly = rev.map((r, i) => r - cogsMonthly[i])
    const gpTotal = revTotal - cogsTotal
    const gpPctMonthly = rev.map((r, i) => r > 0 ? (gpMonthly[i] / r) * 100 : null)
    const gpPctTotal = revTotal > 0 ? (gpTotal / revTotal) * 100 : null

    // รวมค่าใช้จ่ายทั้งหมด (ทุกกลุ่มที่ไม่ใช่ revenue)
    const totalExpMonthly = Array(12).fill(0)
    const nonRevGroups = allGroups.filter(g => !isRevenueGroup(g))
    nonRevGroups.forEach(g => (g.monthly ?? []).forEach((v, i) => { totalExpMonthly[i] += Number(v ?? 0) }))
    const totalExpTotal = totalExpMonthly.reduce((s, v) => s + v, 0)
    const totalExpPctMonthly = rev.map((r, i) => r > 0 ? (totalExpMonthly[i] / r) * 100 : null)
    const totalExpPctTotal = revTotal > 0 ? (totalExpTotal / revTotal) * 100 : null

    // กำไร(ขาดทุน)สุทธิ
    const netMonthly = rev.map((r, i) => r - totalExpMonthly[i])
    const netTotal = revTotal - totalExpTotal
    const netPctMonthly = rev.map((r, i) => r > 0 ? (netMonthly[i] / r) * 100 : null)
    const netPctTotal = revTotal > 0 ? (netTotal / revTotal) * 100 : null

    return {
      rev, revTotal,
      allGroups, revenueGroups, cogsGroups, otherGroups,
      cogsMonthly, cogsTotal,
      gpMonthly, gpTotal, gpPctMonthly, gpPctTotal,
      totalExpMonthly, totalExpTotal, totalExpPctMonthly, totalExpPctTotal,
      netMonthly, netTotal, netPctMonthly, netPctTotal,
    }
  }, [filteredRaw])

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto space-y-4">
      {/* ─ Header ─ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">ประมาณการกำไรขาดทุน</h1>
          <p className="text-ink-500 text-sm mt-1">
            P&amp;L Report รายเดือน ปี {year} {month ? `(เดือน ${MONTH_SHORT[Number(month) - 1]})` : ''} — ข้อมูลจากไฟล์ที่นำเข้าระบบ
          </p>
        </div>
        <div className="flex items-center gap-2">
          {filteredRaw && computed && (
            <ExportModal
              fileNameBase={`P&L_ปี${year}`}
              pdfPreview={<PLReportPdfPreview raw={filteredRaw} computed={computed} year={year} />}
              excelSheets={buildPlExcelSheet(filteredRaw, computed, year)}
            />
          )}
          <select
            className="glass-input text-sm w-36"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">ทุกเดือน (ทั้งปี)</option>
            {MONTH_SHORT.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select
            className="glass-input text-sm w-28"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3">
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-ink-500 text-sm">กำลังโหลด...</p>
        </div>
      )}

      {!loading && raw && computed && (
        <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-x-auto">
          {/* Title bar */}
          <div className="px-5 py-3 border-b border-black/10 bg-[#f9f9f9] flex items-center gap-4">
            <p className="text-[11px] text-ink-500 uppercase tracking-wider font-semibold">ทับขวาง</p>
            <span className="text-black/20">|</span>
            <p className="text-[12px] text-ink-800 font-medium">
              ประมาณการกำไรขาดทุน เริ่มต้นธุรกิจตั้งแต่ตั้ง {year + 543}
            </p>
          </div>

          <table className="w-full text-[11px] border-collapse" style={{ minWidth: 1520 }}>
            {/* ─ Column headers ─ */}
            <thead>
              <tr className="border-b-2 border-black/20 bg-[#f0f0f0]">
                <th className="text-left px-2 py-1.5 font-semibold text-[10px] text-ink-500 w-20">รหัสบัญชี</th>
                <th className="text-left px-2 py-1.5 font-semibold text-[10px] text-ink-500 w-52">ชื่อบัญชี</th>
                {MONTH_SHORT.map((m) => (
                  <th key={m} className="text-right px-2 py-1.5 font-semibold text-[10px] text-ink-500 w-24">{m}</th>
                ))}
                <th className="text-right px-2 py-1.5 font-semibold text-[10px] text-ink-500 w-28">รวม</th>
                <th className="w-12" />
              </tr>
            </thead>

            <tbody>
              {/* ══════════ รายได้รวม (Total Revenue Banner) ══════════ */}
              <tr className="bg-[#e8f5e9] border-b border-[#a5d6a7]">
                <td colSpan={2} className="px-2 py-1 font-bold text-[#1b5e20] text-[11px]">รายได้รวม</td>
                {computed.rev.map((v, i) => (
                  <td key={i} className="text-right px-2 py-1 font-bold text-[#1b5e20] tabular-nums whitespace-nowrap">{fmtV(v)}</td>
                ))}
                <td className="text-right px-2 py-1 font-bold text-[#1b5e20] tabular-nums whitespace-nowrap">{fmtV(computed.revTotal)}</td>
                <td />
              </tr>

              {/* ══════════ กลุ่มรหัสบัญชีหมวด 1 - 6 เรียงตามลำดับ ══════════ */}
              {computed.allGroups.map((g) => (
                <GroupSection
                  key={g.groupId || g.code}
                  group={g}
                  revenueMonthly={computed.rev}
                  revenueTotal={computed.revTotal}
                />
              ))}

              {/* รวมค่าใช้จ่าย % */}
              <tr className="bg-[#e3f2fd] border-t-2 border-[#1565c0]">
                <td colSpan={2} className="px-2 py-1 font-bold text-[#0d47a1] text-[11px]">
                  รวมค่าใช้จ่ายทั้งหมดของกิจการ
                </td>
                {computed.totalExpPctMonthly.map((p, i) => (
                  <td key={i} className="text-right px-2 py-1 font-bold text-[#0d47a1] tabular-nums text-[10px]">{fmtPct(p)}</td>
                ))}
                <td className="text-right px-2 py-1 font-bold text-[#0d47a1] tabular-nums text-[10px]">{fmtPct(computed.totalExpPctTotal)}</td>
                <td />
              </tr>
              <tr className="bg-[#e3f2fd] border-b border-[#1565c0]">
                <td colSpan={2} className="px-2 py-[3px]" />
                {computed.totalExpMonthly.map((v, i) => (
                  <td key={i} className="text-right px-2 py-[3px] font-bold text-[#0d47a1] tabular-nums">{fmtV(v)}</td>
                ))}
                <td className="text-right px-2 py-[3px] font-bold text-[#0d47a1] tabular-nums">{fmtV(computed.totalExpTotal)}</td>
                <td />
              </tr>

              {/* DIF */}
              <tr className="border-b border-black/5">
                <td colSpan={2} className="px-2 py-[3px] text-ink-400 text-[11px]">DIF -</td>
                {Array(12).fill(null).map((_, i) => (
                  <td key={i} className="text-right px-2 py-[3px] text-ink-300 tabular-nums">-</td>
                ))}
                <td className="text-right px-2 py-[3px] text-ink-300 tabular-nums">-</td>
                <td />
              </tr>

              {/* ประมาณการกำไร(ขาดทุน)สุทธิ */}
              <tr className="bg-[#fce4ec] border-y-2 border-[#c62828]">
                <td colSpan={2} className="px-2 py-1.5 font-bold text-[#b71c1c] text-[11px]">
                  ประมาณการกำไร(ขาดทุน)สุทธิ
                </td>
                {computed.netMonthly.map((v, i) => (
                  <td
                    key={i}
                    className={`text-right px-2 py-1.5 font-bold tabular-nums ${v >= 0 ? 'text-[#1b5e20]' : 'text-[#b71c1c]'}`}
                  >
                    {fmtV(v)}
                  </td>
                ))}
                <td
                  className={`text-right px-2 py-1.5 font-bold tabular-nums ${computed.netTotal >= 0 ? 'text-[#1b5e20]' : 'text-[#b71c1c]'}`}
                >
                  {fmtV(computed.netTotal)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-5 py-2 border-t border-black/5 bg-[#fafafa] flex items-center gap-4 text-[10px] text-ink-400">
            <span>% คำนวณเทียบรายได้รวม</span>
            <span>·</span>
            <span>กลุ่มที่ชื่อขึ้นต้น "ต้นทุนสินค้า" = COGS แยกคำนวณกำไรขั้นต้น</span>
            <span>·</span>
            <span>ข้อมูลจากไฟล์ที่นำเข้าหน้า "แนบไฟล์บัญชี"</span>
          </div>
        </div>
      )}

      {!loading && raw && computed && computed.revTotal === 0 && (raw.groups ?? []).length === 0 && (
        <div className="glass p-12 text-center space-y-3">
          <p className="text-4xl">📊</p>
          <p className="text-ink-700 font-medium">ยังไม่มีข้อมูลปี {year}</p>
          <p className="text-ink-400 text-sm">
            ไปที่ "แนบไฟล์บัญชี" เพื่ออัปโหลดไฟล์ประมาณการกำไรขาดทุน (.xlsx) ก่อน
          </p>
        </div>
      )}
    </div>
  )
}

// ─── PDF Preview Component (ใช้ใน ExportModal) ─────────────────────────────
function PLReportPdfPreview({ raw, computed, year }) {
  if (!raw || !computed) return null
  const fmtNum = (n) => (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtV2 = (n) => (!n || n === 0) ? '' : fmtNum(n)
  const MONTHS_PDF = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
  return (
    <div style={{ color: '#1d1d1f', fontFamily: "'Sarabun', sans-serif", fontSize: 9 }}>
      <h1 style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>ประมาณการกำไรขาดทุน (P&L Statement)</h1>
      <p style={{ textAlign: 'center', color: '#6e6e73', fontSize: 10, marginBottom: 16 }}>ปี {year} (พ.ศ. {year + 543}) — สร้างเมื่อ {new Date().toLocaleDateString('th-TH')}</p>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 8 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #1d1d1f', backgroundColor: '#f0f0f0' }}>
            <th style={{ textAlign: 'left', padding: '3px 4px', width: 70 }}>รหัส</th>
            <th style={{ textAlign: 'left', padding: '3px 4px', width: 160 }}>ชื่อบัญชี</th>
            {MONTHS_PDF.map((m) => <th key={m} style={{ textAlign: 'right', padding: '3px 4px', width: 70 }}>{m}</th>)}
            <th style={{ textAlign: 'right', padding: '3px 4px', width: 80 }}>รวม</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ backgroundColor: '#e8f5e9', fontWeight: 'bold' }}>
            <td style={{ padding: '3px 4px' }} colSpan={2}>รายได้รวม</td>
            {computed.rev.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '3px 4px' }}>{fmtV2(v)}</td>)}
            <td style={{ textAlign: 'right', padding: '3px 4px' }}>{fmtNum(computed.revTotal)}</td>
          </tr>
          {(raw.groups ?? []).map((g, gIdx) => (
            <React.Fragment key={g.groupId || gIdx}>
              <tr style={{ backgroundColor: '#f5f5f7', borderTop: '1px solid #d2d2d7' }}>
                <td style={{ padding: '3px 4px', fontWeight: 'bold' }} colSpan={2}>กลุ่ม {gIdx + 1}. {g.code} — {g.name}</td>
                <td colSpan={13}></td>
              </tr>
              {(g.accounts ?? []).map((a) => (
                <tr key={a.code} style={{ borderBottom: '1px solid #e8e8ed' }}>
                  <td style={{ padding: '2px 4px 2px 10px', fontFamily: 'monospace', color: '#0077b6' }}>{a.code}</td>
                  <td style={{ padding: '2px 4px' }}>{a.name}</td>
                  {(a.monthly ?? []).map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '2px 4px' }}>{Number(v) !== 0 ? fmtV2(Number(v)) : ''}</td>)}
                  <td style={{ textAlign: 'right', padding: '2px 4px', fontWeight: 'bold' }}>{fmtV2(Number(a.total))}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid #d2d2d7' }}>
                <td style={{ padding: '2px 4px 2px 10px', fontStyle: 'italic', color: '#6e6e73' }} colSpan={2}>รวม {g.name}</td>
                {(g.monthly ?? []).map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '2px 4px', fontWeight: 'bold' }}>{fmtV2(Number(v))}</td>)}
                <td style={{ textAlign: 'right', padding: '2px 4px', fontWeight: 'bold' }}>{fmtV2(Number(g.total))}</td>
              </tr>
            </React.Fragment>
          ))}
          <tr style={{ backgroundColor: '#e3f2fd', borderTop: '2px solid #1565c0', fontWeight: 'bold' }}>
            <td style={{ padding: '3px 4px' }} colSpan={2}>รวมค่าใช้จ่ายทั้งหมด</td>
            {computed.totalExpMonthly.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '3px 4px', color: '#0d47a1' }}>{fmtV2(v)}</td>)}
            <td style={{ textAlign: 'right', padding: '3px 4px', color: '#0d47a1' }}>{fmtNum(computed.totalExpTotal)}</td>
          </tr>
          <tr style={{ backgroundColor: computed.netTotal >= 0 ? '#e8f5e9' : '#fce4ec', borderTop: '2px solid #c62828', fontWeight: 'bold' }}>
            <td style={{ padding: '4px', fontSize: 10 }} colSpan={2}>ประมาณการกำไร(ขาดทุน)สุทธิ</td>
            {computed.netMonthly.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '4px', color: v >= 0 ? '#1b5e20' : '#b71c1c' }}>{fmtV2(v)}</td>)}
            <td style={{ textAlign: 'right', padding: '4px', color: computed.netTotal >= 0 ? '#1b5e20' : '#b71c1c', fontSize: 10 }}>{fmtNum(computed.netTotal)}</td>
          </tr>
        </tbody>
      </table>
      <p style={{ fontSize: 8, color: '#a1a1a6', textAlign: 'center', marginTop: 12, borderTop: '1px solid #e8e8ed', paddingTop: 8 }}>
        ข้อมูลจากไฟล์ที่นำเข้าระบบ GoCost — {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
      </p>
    </div>
  )
}

```

---

### 📄 File: `src\pages\ReconciliationPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ReconciliationPage() {
  const { currentUser } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canUse = hasPagePermission(currentUser, 'reconciliation')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_reconciliation_report', {
      p_actor_id: currentUser?.id ?? null, p_year: year, p_month: month ? Number(month) : null,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setError(res.message)
    setData(res)
  }, [currentUser, year, month])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  const rows = data?.rows ?? []
  const totalStaff = rows.reduce((s, r) => s + r.staffAmount, 0)
  const totalFile = rows.reduce((s, r) => s + r.fileAmount, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">เทียบยอด (Reconciliation)</h1>
          <p className="text-ink-600 text-sm mt-1">เปรียบเทียบยอดที่พนักงานกรอกเอง กับยอดจากไฟล์รายจ่ายจริงที่แนบไว้</p>
        </div>
        <div className="flex gap-2">
          <select className="glass-input text-sm w-28" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select className="glass-input text-sm w-32" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">ทั้งปี</option>
            {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="glass p-5">
              <p className="text-ink-600 text-xs mb-1">ยอดที่พนักงานกรอก</p>
              <p className="font-display italic text-xl text-ocean">{formatBaht(totalStaff)}</p>
            </div>
            <div className="glass p-5">
              <p className="text-ink-600 text-xs mb-1">ยอดจากไฟล์ที่แนบ</p>
              <p className="font-display italic text-xl text-gold-dark">{formatBaht(totalFile)}</p>
            </div>
            <div className="glass p-5">
              <p className="text-ink-600 text-xs mb-1">ผลต่างรวม</p>
              <p className={`font-display italic text-xl ${totalFile - totalStaff === 0 ? 'text-sage' : 'text-rose'}`}>
                {formatBaht(totalFile - totalStaff)}
              </p>
            </div>
          </div>

          <div className="glass p-0 overflow-hidden">
            {rows.length === 0 ? (
              <p className="text-ink-400 text-sm text-center py-10">ไม่มีข้อมูลให้เทียบในช่วงเวลานี้ (ต้องมีทั้งข้อมูลที่พนักงานกรอกและ/หรือไฟล์ที่แนบ)</p>
            ) : (() => {
              // จัดกลุ่มรายการตามหมวดหมู่ / กลุ่มบัญชี
              const categoryMap = new Map()
              for (const r of rows) {
                const cat = r.category || r.groupName || 'หมวดหมู่ทั่วไป'
                if (!categoryMap.has(cat)) categoryMap.set(cat, [])
                categoryMap.get(cat).push(r)
              }
              const categories = Array.from(categoryMap.entries())

              return (
                <div className="divide-y divide-black/10">
                  {categories.map(([catName, items]) => {
                    const catStaff = items.reduce((s, r) => s + r.staffAmount, 0)
                    const catFile = items.reduce((s, r) => s + r.fileAmount, 0)
                    const catDiff = catFile - catStaff

                    return (
                      <div key={catName} className="p-4 space-y-2">
                        <div className="flex items-center justify-between bg-ink-100/60 rounded-lg px-3 py-1.5 font-medium text-xs text-ink-800">
                          <span className="flex items-center gap-2">
                            <span className="doc-badge bg-gold-pale text-gold-dark border-gold/30">📂 {catName}</span>
                            <span>({items.length} รายการ)</span>
                          </span>
                          <span className="flex items-center gap-4 text-xs">
                            <span>พนักงาน: {formatBaht(catStaff)}</span>
                            <span>ไฟล์: {formatBaht(catFile)}</span>
                            <span className={catDiff === 0 ? 'text-sage' : 'text-rose font-semibold'}>
                              ผลต่าง: {formatBaht(catDiff)} {catDiff !== 0 && '⚠️'}
                            </span>
                          </span>
                        </div>

                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-black/10 text-left text-ink-500 uppercase tracking-wider">
                              <th className="px-3 py-1.5 w-28">รหัสบัญชี</th>
                              <th className="px-3 py-1.5">ชื่อบัญชี</th>
                              <th className="px-3 py-1.5 text-right">ยอดพนักงานกรอก</th>
                              <th className="px-3 py-1.5 text-right">ยอดจากไฟล์</th>
                              <th className="px-3 py-1.5 text-right">ผลต่าง</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((r) => (
                              <tr key={r.code} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01]">
                                <td className="px-3 py-1.5 text-ocean font-mono">{r.code}</td>
                                <td className="px-3 py-1.5 text-ink-700">{r.name}</td>
                                <td className="px-3 py-1.5 text-right text-ink-700 tabular-nums">{formatBaht(r.staffAmount)}</td>
                                <td className="px-3 py-1.5 text-right text-ink-700 tabular-nums">{formatBaht(r.fileAmount)}</td>
                                <td className={`px-3 py-1.5 text-right font-medium tabular-nums ${r.diff === 0 ? 'text-sage' : 'text-rose'}`}>
                                  {formatBaht(r.diff)} {r.diff !== 0 && '⚠️'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </>
      )}
    </div>
  )
}

```

---

### 📄 File: `src\pages\ReconTrialHubPage.jsx`
```jsx
import React, { useState, useEffect } from 'react'
import ReconciliationPage from './ReconciliationPage'
import TrialBalancePage from './TrialBalancePage'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const TABS = [
  { id: 'reconciliation', label: 'เทียบยอด (Reconciliation)', icon: '⚖️' },
  { id: 'trial-balance', label: 'งบทดลอง (Trial Balance)', icon: '📊' },
]

export default function ReconTrialHubPage({ initialTab = 'reconciliation', onNavigate }) {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Filter tabs by permission
  const allowedTabs = TABS.filter(tab => hasPagePermission(currentUser, tab.id))

  // Handle case where user has permission to some tabs
  const currentTab = allowedTabs.some(t => t.id === activeTab)
    ? activeTab
    : allowedTabs[0]?.id || 'reconciliation'

  return (
    <div className="space-y-6">
      {/* Box Bar Header for Tab Switching */}
      <div className="bg-white/70 backdrop-blur-md p-2 rounded-2xl border border-black/10 shadow-sm flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isAllowed = hasPagePermission(currentUser, tab.id)
          const isActive = currentTab === tab.id
          if (!isAllowed) return null

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-gold-pale to-amber-100/80 text-ink-900 font-semibold shadow-sm border border-gold/40 ring-2 ring-gold/20 scale-[1.01]'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-white/80 border border-transparent'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Render Selected Sub-Page */}
      <div className="transition-all duration-300">
        {currentTab === 'reconciliation' && <ReconciliationPage onNavigate={onNavigate} />}
        {currentTab === 'trial-balance' && <TrialBalancePage onNavigate={onNavigate} />}
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\ReportsHubPage.jsx`
```jsx
import React, { useState, useEffect } from 'react'
import ExecutiveReportPage from './ExecutiveReportPage'
import PLReportPage from './PLReportPage'
import TaxReportPage from './TaxReportPage'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const TABS = [
  { id: 'exec-report', label: 'รายงานผู้บริหาร', icon: '📊' },
  { id: 'pl-report', label: 'รายงาน P&L (ประมาณการกำไรขาดทุน)', icon: '📈' },
  { id: 'tax-report', label: 'รายงานสำหรับกรมสรรพากร', icon: '🧾' },
]

export default function ReportsHubPage({ initialTab = 'exec-report', onNavigate }) {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Filter tabs by permission
  const allowedTabs = TABS.filter(tab => hasPagePermission(currentUser, tab.id))

  // Handle case where user has permission to some report tabs
  const currentTab = allowedTabs.some(t => t.id === activeTab)
    ? activeTab
    : allowedTabs[0]?.id || 'exec-report'

  return (
    <div className="space-y-6">
      {/* Box Bar Header for Tab Switching */}
      <div className="bg-white/70 backdrop-blur-md p-2 rounded-2xl border border-black/10 shadow-sm flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isAllowed = hasPagePermission(currentUser, tab.id)
          const isActive = currentTab === tab.id
          if (!isAllowed) return null

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-gold-pale to-amber-100/80 text-ink-900 font-semibold shadow-sm border border-gold/40 ring-2 ring-gold/20 scale-[1.01]'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-white/80 border border-transparent'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Render Selected Sub-Page */}
      <div className="transition-all duration-300">
        {currentTab === 'exec-report' && <ExecutiveReportPage onNavigate={onNavigate} />}
        {currentTab === 'pl-report' && <PLReportPage onNavigate={onNavigate} />}
        {currentTab === 'tax-report' && <TaxReportPage onNavigate={onNavigate} />}
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\StoresManagementPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

function emptyForm() {
  return { id: null, customerCode: '', name: '', region: '', province: '', assignedSalesName: '' }
}

export default function StoresManagementPage() {
  const { currentUser } = useAuth()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const canUse = hasPagePermission(currentUser, 'stores')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_stores', {
      p_actor_id: currentUser?.id ?? null,
      p_query: search.trim() || null,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setStores(data ?? [])
  }, [currentUser, search])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  function startEdit(s) {
    setForm({
      id: s.id, customerCode: s.customer_code || '', name: s.name,
      region: s.region || '', province: s.province || '', assignedSalesName: s.assigned_sales_name || '',
    })
  }

  function startCreate() {
    setForm(emptyForm())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('กรุณากรอกชื่อร้านค้า')

    setSubmitting(true)
    const rpcName = form.id ? 'update_store' : 'create_store'
    const params = form.id
      ? {
          p_id: form.id, p_customer_code: form.customerCode, p_name: form.name,
          p_region: form.region, p_province: form.province,
          p_assigned_sales_name: form.assignedSalesName, p_actor_id: currentUser?.id ?? null,
        }
      : {
          p_customer_code: form.customerCode, p_name: form.name,
          p_region: form.region, p_province: form.province,
          p_assigned_sales_name: form.assignedSalesName, p_actor_id: currentUser?.id ?? null,
        }
    const { data, error: err } = await supabase.rpc(rpcName, params)
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    startCreate()
    load()
  }

  async function handleDelete(id) {
    if (!confirm('ยืนยันลบร้านค้านี้?')) return
    setError('')
    const { data, error: err } = await supabase.rpc('delete_store', { p_id: id, p_actor_id: currentUser?.id ?? null })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">จัดการร้านค้า</h1>
          <p className="text-ink-600 text-sm mt-1">ข้อมูลร้านค้า/ลูกค้าที่ใช้ใน dropdown ตอนสร้างคำขอ Workshop</p>
        </div>
        <input className="glass-input text-sm w-64" placeholder="ค้นหาชื่อร้าน / รหัส / จังหวัด..."
               value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleSubmit} className="glass p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <h2 className="sm:col-span-3 text-ink-900 font-medium">{form.id ? `แก้ไขร้านค้า #${form.id}` : 'เพิ่มร้านค้าใหม่'}</h2>
        <div>
          <label className="block text-xs text-ink-600 mb-1">รหัสลูกค้า</label>
          <input className="glass-input w-full" value={form.customerCode} onChange={(e) => setForm((f) => ({ ...f, customerCode: e.target.value }))} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-600 mb-1">ชื่อร้านค้า *</label>
          <input className="glass-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">ภาค</label>
          <input className="glass-input w-full" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">จังหวัด</label>
          <input className="glass-input w-full" value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">เซลล์ที่สังกัด (ข้อความ)</label>
          <input className="glass-input w-full" value={form.assignedSalesName} onChange={(e) => setForm((f) => ({ ...f, assignedSalesName: e.target.value }))} />
        </div>
        <div className="sm:col-span-3 flex justify-end gap-2">
          {form.id && <button type="button" onClick={startCreate} className="btn-ghost text-sm">ยกเลิกแก้ไข</button>}
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? 'กำลังบันทึก...' : form.id ? 'บันทึกการแก้ไข' : 'เพิ่มร้านค้า'}
          </button>
        </div>
      </form>

      <div className="glass p-0 overflow-hidden">
        {loading && <p className="text-ink-500 text-sm p-6">กำลังโหลด...</p>}
        {!loading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">รหัส</th>
                <th className="px-4 py-3">ชื่อร้านค้า</th>
                <th className="px-4 py-3">ภาค / จังหวัด</th>
                <th className="px-4 py-3">เซลล์ที่สังกัด</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-ink-500">{s.customer_code || '-'}</td>
                  <td className="px-4 py-3 text-ink-900">{s.name}</td>
                  <td className="px-4 py-3 text-ink-700">{s.province || '-'} / {s.region || '-'}</td>
                  <td className="px-4 py-3 text-ink-700">{s.assigned_sales_name || <span className="text-ink-400">ยังไม่ได้กำหนด</span>}</td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => startEdit(s)} className="text-ocean text-xs hover:underline">แก้ไข</button>
                    <button onClick={() => handleDelete(s.id)} className="text-rose text-xs hover:underline">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && stores.length === 0 && (
          <p className="text-ink-400 text-sm text-center py-10">ไม่พบร้านค้า</p>
        )}
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\TaxReportPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import ExportModal from '../components/ExportModal'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildExcelSheet(data, year) {
  const rows = [
    ['งบกำไรขาดทุน ปี', year],
    ['รายได้รวม', '', '', data.totalRevenue],
    [],
    ['หมวดหมู่', 'รหัส', 'ชื่อบัญชี', 'ยอด'],
  ]
  for (const cat of data.byCategory ?? []) {
    rows.push([cat.category, '', '', cat.total])
    for (const l of cat.lines) {
      rows.push(['', l.code, l.name, l.total])
      for (const it of l.items) rows.push(['', '', `${it.docNumber} · ${it.eventDate} · ${it.storeName} · ${it.detail}`, it.total])
    }
  }
  rows.push([])
  rows.push(['รายจ่ายรวม', '', '', data.totalExpenses])
  rows.push([data.netIncome >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ', '', '', Math.abs(data.netIncome)])
  return [{ name: `งบกำไรขาดทุน ${year}`, rows }]
}

const MOCK_TB_SUMMARY = {
  label: 'งบทดลอง มิถุนายน 2568 (ตัวอย่าง)',
  totalDebit: 552000,
  totalCredit: 552000,
  groups: [
    { code: 'GRP-MKT', name: 'ค่าใช้จ่ายการตลาด', debit: 403500, credit: 0 },
    { code: 'GRP-WS',  name: 'ค่าใช้จ่าย Workshop', debit: 101500, credit: 0 },
    { code: 'GRP-OPS', name: 'ค่าใช้จ่ายปฏิบัติการ', debit: 47000, credit: 0 },
    { code: 'GRP-REV', name: 'รายได้', debit: 0, credit: 552000 },
  ],
}

export default function TaxReportPage() {
  const { currentUser } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState('') // '' = ทั้งปี, '1'-'12' = เฉพาะเดือน
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canUse = hasPagePermission(currentUser, 'tax-report')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_tax_filing_report', {
      p_actor_id: currentUser?.id ?? null,
      p_year: year,
      p_month: month ? Number(month) : null,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setError(res.message)
    setData(res)
  }, [currentUser, year, month])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">รายงานสำหรับกรมสรรพากร</h1>
          <p className="text-ink-600 text-sm mt-1">สรุปรายได้-รายจ่ายบริษัท แยกตามหมวดหมู่บัญชี สำหรับใช้อ้างอิงยื่นภาษี</p>
        </div>
        <div className="flex gap-2 items-center">
          <select className="glass-input text-sm w-36" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">ทุกเดือน (ทั้งปี)</option>
            {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>{m}</option>
            ))}
          </select>
          <select className="glass-input text-sm w-28" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={() => window.print()} className="btn-ghost text-sm">พิมพ์หน้าเว็บ</button>
          {data && <ExportModal fileNameBase={`รายงานสรรพากร_${year}`} excelSheets={buildExcelSheet(data, year)} pdfPreview={<TaxReportPdfPreview data={data} year={year} />} />}
        </div>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2 print:hidden">{error}</p>}
      {loading && <p className="text-ink-500 text-sm print:hidden">กำลังโหลด...</p>}

      {!loading && data && (
        <div className="glass p-8 space-y-6">
          <div className="text-center border-b border-black/10 pb-4">
            <h2 className="font-display italic text-2xl text-ink-900">งบกำไรขาดทุน (Profit &amp; Loss Statement)</h2>
            <p className="text-ink-500 text-sm mt-1">สำหรับปี พ.ศ. {year + 543} (ค.ศ. {year})</p>
            <p className="text-ink-400 text-xs mt-1">จัดทำสำหรับอ้างอิงประกอบการยื่นแบบต่อกรมสรรพากร — ไม่ใช่เอกสารทางบัญชีที่ผ่านการรับรองจากผู้สอบบัญชี</p>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-black/5">
            <span className="text-ink-900 font-medium">รายได้รวม (Total Revenue)</span>
            <span className="text-sage font-display italic text-xl">{formatBaht(data.totalRevenue)}</span>
          </div>

          <div>
            <p className="text-ink-900 font-medium mb-2">รายจ่าย (Expenses) แยกตามหมวดหมู่บัญชี</p>
            {(data.byCategory ?? []).length === 0 && (
              <p className="text-ink-400 text-sm py-4 text-center">ไม่มีรายจ่ายที่ระบุรหัสบัญชีในปีนี้</p>
            )}
            <div className="space-y-4">
              {(data.byCategory ?? []).map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm font-medium text-ink-800 border-b border-black/10 pb-1 mb-1">
                    <span>{cat.category}</span>
                    <span>{formatBaht(cat.total)}</span>
                  </div>
                  {cat.lines.map((l) => (
                    <div key={l.code} className="mb-3 pl-2">
                      <div className="flex items-center justify-between text-xs font-medium text-ink-700 py-1">
                        <span>{l.code} — {l.name}</span>
                        <span>{formatBaht(l.total)}</span>
                      </div>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-ink-400">
                            <th className="text-left font-normal py-0.5 pl-4">เอกสาร</th>
                            <th className="text-left font-normal py-0.5">วันที่</th>
                            <th className="text-left font-normal py-0.5">ร้าน/งาน</th>
                            <th className="text-left font-normal py-0.5">รายละเอียด</th>
                            <th className="text-right font-normal py-0.5">ยอด</th>
                          </tr>
                        </thead>
                        <tbody>
                          {l.items.map((it, i) => (
                            <tr key={i} className="border-t border-black/5">
                              <td className="py-0.5 pl-4 text-ocean">{it.docNumber}</td>
                              <td className="py-0.5 text-ink-500">{it.eventDate}</td>
                              <td className="py-0.5 text-ink-600">{it.storeName}</td>
                              <td className="py-0.5 text-ink-600">{it.detail}</td>
                              <td className="py-0.5 text-right text-ink-800">{formatBaht(it.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-black/10">
            <span className="text-ink-900 font-medium">รายจ่ายรวม (Total Expenses)</span>
            <span className="text-rose font-display italic text-xl">{formatBaht(data.totalExpenses)}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-t-2 border-black/20">
            <span className="text-ink-900 font-medium text-lg">{data.netIncome >= 0 ? 'กำไรสุทธิ (Net Income)' : 'ขาดทุนสุทธิ (Net Loss)'}</span>
            <span className={`font-display italic text-2xl ${data.netIncome >= 0 ? 'text-sage' : 'text-rose'}`}>
              {formatBaht(Math.abs(data.netIncome))}
            </span>
          </div>

          <p className="text-ink-400 text-xs text-center pt-4 border-t border-black/5">
            รายงานนี้สร้างจากข้อมูลในระบบ GoCost ณ วันที่ {new Date().toLocaleDateString('th-TH')} —
            รายจ่ายที่ไม่ได้ระบุรหัสบัญชียังไม่ถูกรวมในรายงานนี้ กรุณาตรวจสอบที่หน้า "รายงานผู้บริหาร (แยกรายการ)" ก่อนใช้งานจริง
          </p>
        </div>
      )}

      {/* งบทดลองคร่าวๆ (Mock) — สำหรับอ้างอิงประกอบการยื่นภาษี */}
      <div className="glass p-5 space-y-3 border border-amber-200/60 print:hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-ink-900 font-medium">งบทดลอง (Trial Balance) อ้างอิง</h3>
          <span className="text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5">ข้อมูลตัวอย่าง</span>
        </div>
        <p className="text-ink-400 text-xs">{MOCK_TB_SUMMARY.label} — ใช้อ้างอิงหยอดคู่กับงบ P&amp;L ด้านบน</p>
        <div className="space-y-1">
          {MOCK_TB_SUMMARY.groups.map((g) => (
            <div key={g.code} className="flex items-center justify-between text-sm py-1.5 border-b border-black/5 last:border-0">
              <span className="text-ink-700">
                <span className="doc-badge mr-2">{g.code}</span>{g.name}
              </span>
              <div className="flex gap-6 text-xs tabular-nums">
                <span className="text-rose w-28 text-right">{g.debit > 0 ? formatBaht(g.debit) : '—'}</span>
                <span className="text-sage w-28 text-right">{g.credit > 0 ? formatBaht(g.credit) : '—'}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-black/10">
          <span className="text-ink-900 font-medium text-sm">ยอดรวม Debit / Credit</span>
          <div className="flex gap-6 text-sm tabular-nums">
            <span className="text-rose font-display italic">{formatBaht(MOCK_TB_SUMMARY.totalDebit)}</span>
            <span className="text-sage font-display italic">{formatBaht(MOCK_TB_SUMMARY.totalCredit)}</span>
          </div>
        </div>
        <p className="text-sage text-xs">✅ Debit = Credit — งบสมดุล</p>
      </div>
    </div>
  )
}

// เวอร์ชันสำหรับพิมพ์/PDF — ตัวหนังสือดำบนพื้นขาวล้วน
function TaxReportPdfPreview({ data, year }) {
  return (
    <div style={{ color: '#1d1d1f', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>งบกำไรขาดทุน (Profit &amp; Loss Statement)</h1>
      <p style={{ fontSize: 12, textAlign: 'center', color: '#6e6e73' }}>สำหรับปี พ.ศ. {year + 543} (ค.ศ. {year})</p>
      <p style={{ fontSize: 10, textAlign: 'center', color: '#a1a1a6', marginBottom: 20 }}>
        จัดทำสำหรับอ้างอิงประกอบการยื่นแบบต่อกรมสรรพากร — ไม่ใช่เอกสารทางบัญชีที่ผ่านการรับรองจากผู้สอบบัญชี
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e8e8ed' }}>
        <span style={{ fontWeight: 'bold' }}>รายได้รวม (Total Revenue)</span>
        <span style={{ fontWeight: 'bold' }}>{formatBaht(data.totalRevenue)}</span>
      </div>

      <p style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>รายจ่าย (Expenses) แยกตามหมวดหมู่บัญชี</p>
      {(data.byCategory ?? []).map((cat) => (
        <div key={cat.category} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #d2d2d7', paddingBottom: 4 }}>
            <span>{cat.category}</span><span>{formatBaht(cat.total)}</span>
          </div>
          {cat.lines.map((l) => (
            <div key={l.code} style={{ marginTop: 4, paddingLeft: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span>{l.code} — {l.name}</span><span>{formatBaht(l.total)}</span>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #d2d2d7' }}>
        <span style={{ fontWeight: 'bold' }}>รายจ่ายรวม (Total Expenses)</span>
        <span style={{ fontWeight: 'bold' }}>{formatBaht(data.totalExpenses)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #1d1d1f' }}>
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>{data.netIncome >= 0 ? 'กำไรสุทธิ (Net Income)' : 'ขาดทุนสุทธิ (Net Loss)'}</span>
        <span style={{ fontWeight: 'bold', fontSize: 16 }}>{formatBaht(Math.abs(data.netIncome))}</span>
      </div>

      <p style={{ fontSize: 9, color: '#a1a1a6', textAlign: 'center', marginTop: 16, borderTop: '1px solid #e8e8ed', paddingTop: 12 }}>
        รายงานนี้สร้างจากข้อมูลในระบบ GoCost ณ วันที่ {new Date().toLocaleDateString('th-TH')}
      </p>
    </div>
  )
}

```

---

### 📄 File: `src\pages\TrialBalancePage.jsx`
```jsx
import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'
import { downloadTrialBalanceTemplate } from '../lib/templateGenerator'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function DeleteModal({ period, onCancel, onConfirm, busy }) {
  const [step, setStep] = useState(1)
  const [confirmText, setConfirmText] = useState('')
  const CONFIRM_WORD = 'ยืนยันลบ'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="glass w-full max-w-md p-6 space-y-4 shadow-2xl">
        {step === 1 ? (
          <>
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-ink-900 font-medium">ยืนยันการลบงบทดลอง</h3>
                <p className="text-ink-600 text-sm mt-1">
                  คุณกำลังจะลบ <span className="font-medium text-rose">{THAI_MONTHS[period.month - 1]} {period.year}</span>
                </p>
                <p className="text-ink-400 text-xs mt-1">การดำเนินการนี้ไม่สามารถยกเลิกได้</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onCancel} className="btn-ghost text-sm">ยกเลิก</button>
              <button onClick={() => setStep(2)} className="bg-rose text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity">
                ดำเนินการต่อ →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔐</span>
              <div>
                <h3 className="text-ink-900 font-medium">ยืนยันขั้นสุดท้าย</h3>
                <p className="text-ink-600 text-sm mt-1">
                  พิมพ์ <span className="font-mono font-bold text-rose bg-rose-pale px-1.5 py-0.5 rounded">{CONFIRM_WORD}</span> เพื่อยืนยันการลบ
                </p>
              </div>
            </div>
            <input className="glass-input w-full" placeholder={`พิมพ์ "${CONFIRM_WORD}" เพื่อยืนยัน`}
                   value={confirmText} onChange={(e) => setConfirmText(e.target.value)} autoFocus />
            <div className="flex justify-end gap-3">
              <button onClick={onCancel} className="btn-ghost text-sm">ยกเลิก</button>
              <button onClick={onConfirm} disabled={confirmText !== CONFIRM_WORD || busy}
                      className="bg-rose text-white text-sm px-4 py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed">
                {busy ? 'กำลังลบ...' : '🗑️ ลบถาวร'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function TrialBalancePage({ onNavigate }) {
  const { currentUser } = useAuth()
  const canUse = hasPagePermission(currentUser, 'trial-balance')

  const [periods, setPeriods] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState(null) // {year, month}
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [deletingPeriod, setDeletingPeriod] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [uploadHintOpen, setUploadHintOpen] = useState(false)

  const loadPeriods = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_trial_balance_periods', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setPeriods(data ?? [])
    if (!selectedPeriod && data && data.length > 0) setSelectedPeriod({ year: data[0].year, month: data[0].month })
  }, [currentUser, selectedPeriod])

  useEffect(() => { if (canUse) loadPeriods() }, [canUse]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadReport = useCallback(async () => {
    if (!selectedPeriod) { setReport(null); return }
    setReportLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_trial_balance_report', {
      p_actor_id: currentUser?.id ?? null, p_year: selectedPeriod.year, p_month: selectedPeriod.month,
    })
    setReportLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setReport(data)
  }, [currentUser, selectedPeriod])

  useEffect(() => { if (canUse && selectedPeriod) loadReport() }, [canUse, selectedPeriod, loadReport])

  async function handleDeleteConfirm() {
    if (!deletingPeriod) return
    setDeleteBusy(true)
    setError('')
    const { data, error: err } = await supabase.rpc('delete_trial_balance_period', {
      p_actor_id: currentUser?.id ?? null, p_year: deletingPeriod.year, p_month: deletingPeriod.month,
    })
    setDeleteBusy(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setDeletingPeriod(null)
    if (selectedPeriod?.year === deletingPeriod.year && selectedPeriod?.month === deletingPeriod.month) {
      setSelectedPeriod(null)
    }
    loadPeriods()
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {deletingPeriod && (
        <DeleteModal period={deletingPeriod} busy={deleteBusy} onCancel={() => setDeletingPeriod(null)} onConfirm={handleDeleteConfirm} />
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">งบทดลอง (Trial Balance)</h1>
          <p className="text-ink-600 text-sm mt-1">แสดงยอด Debit / Credit แยกตามกลุ่มรหัสบัญชี — นำเข้าจากไฟล์ Express จริง</p>
        </div>
        <button onClick={() => setUploadHintOpen((o) => !o)} className="btn-ghost text-sm">+ นำเข้างบทดลองใหม่</button>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      {uploadHintOpen && (
        <div className="glass p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-ink-900 font-medium text-sm">💡 โครงสร้างไฟล์สำหรับนำเข้างบทดลอง</p>
              <p className="text-ink-500 text-xs mt-0.5">
                นำเข้างบทดลองใหม่ได้ที่หน้า <b>"ศูนย์จัดการทางบัญชี &gt; แนบไฟล์บัญชี"</b> (เลือกประเภท "งบทดลอง")
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadTrialBalanceTemplate}
                className="btn-ghost text-xs bg-amber-50/80 hover:bg-amber-100/80 border border-gold/40 text-gold-dark font-medium flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer"
              >
                <span>📥</span>
                <span>ดาวน์โหลดไฟล์ Template งบทดลอง (.xlsx)</span>
              </button>
              {onNavigate && (
                <button
                  onClick={() => onNavigate('account-import')}
                  className="btn-primary text-xs flex items-center gap-1 px-3 py-2 cursor-pointer"
                >
                  <span>ไปหน้าแนบไฟล์บัญชี</span>
                  <span>→</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
            <table className="w-full text-xs text-left whitespace-nowrap">
              <thead>
                <tr className="bg-gold-pale/40 text-ink-500 border-b border-black/5">
                  <th colSpan="2" className="px-3 py-1 text-center border-r border-black/5">ข้อมูลบัญชี</th>
                  <th colSpan="2" className="px-3 py-1 text-center border-r border-black/5">ยอดยกมา</th>
                  <th colSpan="2" className="px-3 py-1 text-center border-r border-black/5 bg-gold-pale/70 text-gold-dark font-semibold">ยอดเคลื่อนไหว (ระบบใช้อ่านคอลัมน์นี้)</th>
                  <th colSpan="2" className="px-3 py-1 text-center">ยอดคงเหลือ</th>
                </tr>
                <tr className="bg-gold-pale/60 text-gold-dark font-medium border-b border-black/10">
                  <th className="px-3 py-2 border-r border-black/5">เลขที่บัญชี</th>
                  <th className="px-3 py-2 border-r border-black/5">ชื่อบัญชี</th>
                  <th className="px-3 py-2 border-r border-black/5">เดบิต</th>
                  <th className="px-3 py-2 border-r border-black/5">เครดิต</th>
                  <th className="px-3 py-2 border-r border-black/5 bg-gold-pale/90 font-bold">เดบิต</th>
                  <th className="px-3 py-2 border-r border-black/5 bg-gold-pale/90 font-bold">เครดิต</th>
                  <th className="px-3 py-2 border-r border-black/5">เดบิต</th>
                  <th className="px-3 py-2">เครดิต</th>
                </tr>
              </thead>
              <tbody className="text-ink-700 divide-y divide-black/5">
                <tr>
                  <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">1110-01</td>
                  <td className="px-3 py-2 border-r border-black/5">เงินสดในมือ</td>
                  <td className="px-3 py-2 border-r border-black/5">50,000</td>
                  <td className="px-3 py-2 border-r border-black/5">0</td>
                  <td className="px-3 py-2 border-r border-black/5 bg-gold-pale/20 font-medium">15,000</td>
                  <td className="px-3 py-2 border-r border-black/5 bg-gold-pale/20 font-medium">8,000</td>
                  <td className="px-3 py-2 border-r border-black/5">57,000</td>
                  <td className="px-3 py-2">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 glass p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-black/10">
            <p className="text-ink-900 font-medium text-sm">งบทดลองทั้งหมด</p>
          </div>
          {loading && <p className="text-ink-500 text-sm p-4">กำลังโหลด...</p>}
          {!loading && periods.length === 0 && <p className="text-ink-400 text-sm p-4 text-center">ยังไม่มีงบทดลอง</p>}
          <div className="divide-y divide-black/5">
            {periods.map((p) => {
              const isSelected = selectedPeriod?.year === p.year && selectedPeriod?.month === p.month
              return (
                <div key={`${p.year}-${p.month}`} className={`p-3 cursor-pointer transition-colors ${isSelected ? 'bg-ocean-pale' : 'hover:bg-black/[0.02]'}`}>
                  <button onClick={() => setSelectedPeriod({ year: p.year, month: p.month })} className="w-full text-left">
                    <p className="text-ink-900 text-sm font-medium">งบทดลอง {THAI_MONTHS[p.month - 1]} {p.year}</p>
                    <p className="text-ink-400 text-xs mt-0.5">{p.line_count} รายการ · {p.uploaded_by_name || '-'}</p>
                  </button>
                  <button onClick={() => setDeletingPeriod(p)} className="text-rose text-xs hover:underline mt-1.5">🗑️ ลบงบนี้</button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="lg:col-span-3">
          {reportLoading && <div className="glass p-10 text-center text-ink-400 text-sm">กำลังโหลด...</div>}
          {!reportLoading && !selectedPeriod && (
            <div className="glass p-10 text-center text-ink-400 text-sm">เลือกงบทดลองทางซ้าย หรือกด "นำเข้างบทดลองใหม่"</div>
          )}
          {!reportLoading && selectedPeriod && report && (
            <div className="glass p-6 space-y-5">
              <div className="text-center border-b border-black/10 pb-4">
                <h2 className="font-display italic text-2xl text-ink-900">งบทดลอง {THAI_MONTHS[selectedPeriod.month - 1]} {selectedPeriod.year}</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-black/15">
                      <th className="text-left py-2 pr-3 text-ink-500 font-medium text-xs w-28">รหัสบัญชี</th>
                      <th className="text-left py-2 pr-3 text-ink-500 font-medium text-xs">ชื่อบัญชี</th>
                      <th className="text-right py-2 pr-3 text-ink-500 font-medium text-xs w-36">เดบิต (฿)</th>
                      <th className="text-right py-2 text-ink-500 font-medium text-xs w-36">เครดิต (฿)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...report.groups, ...(report.ungroupedAccounts.length > 0 ? [{ groupId: 'ungrouped', code: '-', name: 'ยังไม่มีกลุ่ม', accounts: report.ungroupedAccounts }] : [])].map((group) => {
                      const gDebit = group.accounts.reduce((s, a) => s + a.debit, 0)
                      const gCredit = group.accounts.reduce((s, a) => s + a.credit, 0)
                      return (
                        <React.Fragment key={group.groupId}>
                          <tr className="bg-ink-100/60">
                            <td colSpan={4} className="py-2 px-2">
                              <span className="doc-badge mr-2">{group.code}</span>
                              <span className="text-ink-800 font-medium text-xs">{group.name}</span>
                            </td>
                          </tr>
                          {group.accounts.map((acc) => (
                            <tr key={acc.code} className="border-b border-black/5 hover:bg-black/[0.015] transition-colors">
                              <td className="py-2 pr-3 text-ocean font-mono text-xs pl-4">{acc.code}</td>
                              <td className="py-2 pr-3 text-ink-700">{acc.name}</td>
                              <td className="py-2 pr-3 text-right text-ink-900 tabular-nums">{acc.debit > 0 ? formatBaht(acc.debit) : '—'}</td>
                              <td className="py-2 text-right text-ink-900 tabular-nums">{acc.credit > 0 ? formatBaht(acc.credit) : '—'}</td>
                            </tr>
                          ))}
                          <tr className="border-b border-black/10 bg-white/40">
                            <td colSpan={2} className="py-1.5 pl-4 text-ink-400 text-xs italic">รวม {group.name}</td>
                            <td className="py-1.5 pr-3 text-right text-ink-600 text-xs font-medium tabular-nums">{gDebit > 0 ? formatBaht(gDebit) : ''}</td>
                            <td className="py-1.5 text-right text-ink-600 text-xs font-medium tabular-nums">{gCredit > 0 ? formatBaht(gCredit) : ''}</td>
                          </tr>
                        </React.Fragment>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black/20">
                      <td colSpan={2} className="py-3 text-ink-900 font-bold">ยอดรวมทั้งสิ้น</td>
                      <td className="py-3 pr-3 text-right font-display italic text-lg text-rose tabular-nums">{formatBaht(report.totalDebit)}</td>
                      <td className="py-3 text-right font-display italic text-lg text-sage tabular-nums">{formatBaht(report.totalCredit)}</td>
                    </tr>
                    <tr>
                      <td colSpan={4} className="pb-2 text-xs">
                        {Math.abs(report.totalDebit - report.totalCredit) < 0.01 ? (
                          <span className="text-sage">✅ Debit = Credit — งบสมดุล</span>
                        ) : (
                          <span className="text-gold-dark">
                            ℹ️ ผลต่าง: {formatBaht(Math.abs(report.totalDebit - report.totalCredit))} บาท — ปกติถ้ายังไม่ได้นำเข้าครบทุกรหัสในระบบ (งบทดลองเต็มบริษัทมีบัญชีสินทรัพย์/หนี้สินด้วย ซึ่งไม่อยู่ในผังบัญชีนี้)
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\UsersManagementPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ROLE_OPTIONS, PERMISSION_GROUPS } from '../lib/constants'
import { hasPagePermission } from '../lib/permissions'

function emptyForm() {
  return { id: '', password: '', role: ROLE_OPTIONS[0], name: '', fullName: '', email: '' }
}

export default function UsersManagementPage() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // แผงสิทธิ์การเข้าถึงหน้า/ฟีเจอร์ — เลือก user ที่จะแก้ไขสิทธิ์
  const [permTargetId, setPermTargetId] = useState('')
  const [permKeys, setPermKeys] = useState([])
  const [permSubmitting, setPermSubmitting] = useState(false)

  const isAdmin = hasPagePermission(currentUser, 'users')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_users')
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setUsers(data ?? [])
  }, [])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  function startEdit(u) {
    setEditingId(u.id)
    setForm({ id: u.id, password: '', role: u.role, name: u.name, fullName: u.full_name ?? '', email: u.email ?? '' })
  }

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.id.trim()) return setError('กรุณากรอกรหัสผู้ใช้ (id)')
    if (!form.name.trim()) return setError('กรุณากรอกชื่อเล่น')
    if (!form.fullName.trim()) return setError('กรุณากรอกชื่อ-นามสกุลจริง')
    if (!editingId && !form.password.trim()) return setError('กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่')

    setSubmitting(true)
    const { data, error: err } = await supabase.rpc('save_user', {
      p_id: form.id.trim(),
      p_password: form.password.trim() || null,
      p_role: form.role,
      p_name: form.name.trim(),
      p_full_name: form.fullName.trim(),
      p_email: form.email.trim(),
      p_actor_id: currentUser?.id ?? null,
    })
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    startCreate()
    load()
  }

  async function handleDelete(userId) {
    if (!confirm(`ยืนยันลบผู้ใช้ ${userId}?`)) return
    const { data, error: err } = await supabase.rpc('delete_user', {
      p_user_id: userId,
      p_actor_id: currentUser?.id ?? null,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  function openPermissionPanel(u) {
    setPermTargetId(u.id)
    setPermKeys(Array.isArray(u.page_permissions) ? u.page_permissions : [])
    setNotice('')
    setError('')
  }

  function togglePermKey(key) {
    setPermKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  async function handleSavePermissions() {
    if (!permTargetId) return
    setPermSubmitting(true)
    setError('')
    const { data, error: err } = await supabase.rpc('update_user_permissions', {
      p_target_user_id: permTargetId,
      p_new_page_keys: permKeys,
      p_actor_id: currentUser?.id ?? null,
    })
    setPermSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message + ' — ผู้ใช้จะได้รับแจ้งเตือนทางกระดิ่งว่าได้/เสียสิทธิ์อะไรไปบ้าง')
    setPermTargetId('')
    load()
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <h2 className="font-display italic text-2xl text-ink-900 mb-2">จัดการผู้ใช้งาน</h2>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน — ติดต่อ Admin หากคิดว่าควรมีสิทธิ์</p>
      </div>
    )
  }

  const permTargetUser = users.find((u) => u.id === permTargetId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">จัดการผู้ใช้งาน</h1>
        <p className="text-ink-600 text-sm mt-1">รหัสผ่านจะถูกเข้ารหัส (bcrypt) ก่อนบันทึกเสมอ</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleSubmit} className="glass p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 text-ink-900 font-medium">{editingId ? `แก้ไขผู้ใช้: ${editingId}` : 'เพิ่มผู้ใช้ใหม่'}</h2>
        <div>
          <label className="block text-xs text-ink-600 mb-1">รหัสผู้ใช้ (id) *</label>
          <input className="glass-input w-full" value={form.id} disabled={!!editingId}
                 onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">{editingId ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}</label>
          <input type="password" className="glass-input w-full" value={form.password}
                 onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">บทบาท (role)</label>
          <select className="glass-input w-full" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">ชื่อเล่น *</label>
          <input className="glass-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">ชื่อ-นามสกุลจริง *</label>
          <input className="glass-input w-full" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <p className="text-ink-400 text-xs mt-1">ใช้เก็บเป็นหลักฐานว่าใครบันทึกรายการอะไรตอนดึงข้อมูลออกไปใช้งานจริง</p>
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">อีเมล</label>
          <input type="email" className="glass-input w-full" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          {editingId && <button type="button" onClick={startCreate} className="btn-ghost text-sm">ยกเลิกแก้ไข</button>}
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
          </button>
        </div>
      </form>

      <div className="glass p-0 overflow-hidden">
        {loading && <p className="text-ink-500 text-sm p-6">กำลังโหลด...</p>}
        {!loading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">รหัส</th>
                <th className="px-4 py-3">ชื่อเล่น / ชื่อจริง</th>
                <th className="px-4 py-3">บทบาท</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-b border-black/5 last:border-0 ${permTargetId === u.id ? 'bg-ocean-pale' : ''}`}>
                  <td className="px-4 py-3 text-ink-900">{u.id}</td>
                  <td className="px-4 py-3 text-ink-700">{u.name} <span className="text-ink-400">/ {u.full_name}</span></td>
                  <td className="px-4 py-3"><span className="doc-badge">{u.role}</span></td>
                  <td className="px-4 py-3 text-ink-600">{u.email || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => openPermissionPanel(u)} className="text-ocean text-xs hover:underline">สิทธิ์การเข้าถึง</button>
                    <button onClick={() => startEdit(u)} className="text-ocean text-xs hover:underline">แก้ไข</button>
                    <button onClick={() => handleDelete(u.id)} disabled={u.id === currentUser?.id} className="text-rose text-xs hover:underline disabled:opacity-30 disabled:cursor-not-allowed">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {permTargetUser && (
        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-ink-900 font-medium">
              สิทธิ์การเข้าถึงของ <span className="doc-badge ml-1">{permTargetUser.id}</span>
              <span className="text-ink-500 text-sm ml-2">({permTargetUser.name})</span>
            </h2>
            <button onClick={() => setPermTargetId('')} className="text-ink-400 hover:text-ink-900 text-sm">✕</button>
          </div>

          {permTargetUser.role === 'ADMIN' && (
            <p className="text-ocean text-sm bg-ocean-pale border border-ocean/20 rounded-lg px-3 py-2">
              ผู้ใช้นี้มี role "ADMIN" ซึ่งเข้าถึงได้ทุกหน้าโดยอัตโนมัติเสมอ ไม่ว่าจะติ๊กอะไรไว้ด้านล่างหรือไม่
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label} className="bg-white/60 border border-black/[0.06] rounded-xl p-4">
                <p className="text-ink-500 text-xs uppercase tracking-wider mb-2">{group.label}</p>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <label key={item.key} className="flex items-center gap-2 text-sm text-ink-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permKeys.includes(item.key)}
                        onChange={() => togglePermKey(item.key)}
                        className="accent-ocean"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button onClick={handleSavePermissions} disabled={permSubmitting} className="btn-primary text-sm disabled:opacity-60">
              {permSubmitting ? 'กำลังบันทึก...' : 'บันทึกสิทธิ์การเข้าถึง'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

```

---

### 📄 File: `src\pages\WorkshopAccountingPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { MAIN_CATEGORIES, DETAILS } from '../lib/constants'

function emptyItem() {
  return { mainCategory: '', detail: '', qty: '', unit: '', unitPrice: '', remark: '' }
}

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function WorkshopAccountingPage() {
  const { currentUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [activePlan, setActivePlan] = useState(null)
  const [items, setItems] = useState([emptyItem()])
  const [submitting, setSubmitting] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState(null)

  const canUse = hasPagePermission(currentUser, 'workshop-accounting')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_workshop_plans', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setPlans((data ?? []).filter((p) => p.status === 'pending_accounting'))
  }, [currentUser])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  async function openPlan(p) {
    setActivePlan(p)
    setItems([emptyItem()])
    setError('')
    setAttachmentUrl(null)
    if (p.attachment_path) {
      const { data } = await supabase.storage.from('workshop-attachments').createSignedUrl(p.attachment_path, 3600)
      if (data?.signedUrl) setAttachmentUrl(data.signedUrl)
    }
  }

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }
  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }
  function removeItem(index) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const itemsTotal = items.reduce((sum, it) => sum + (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.mainCategory.trim()) return setError(`รายการที่ ${i + 1}: กรุณาเลือกหมวดหมู่หลัก`)
      if (!it.detail.trim()) return setError(`รายการที่ ${i + 1}: กรุณาเลือกรายละเอียด`)
      const qty = parseFloat(it.qty)
      const unitPrice = parseFloat(it.unitPrice)
      if (isNaN(qty) || qty <= 0) return setError(`รายการที่ ${i + 1}: จำนวนต้องมากกว่า 0`)
      if (isNaN(unitPrice) || unitPrice < 0) return setError(`รายการที่ ${i + 1}: ราคาต่อหน่วยไม่ถูกต้อง`)
    }

    setSubmitting(true)
    const { data, error: err } = await supabase.rpc('complete_workshop_accounting', {
      p_plan_id: activePlan.id,
      p_items: items,
      p_actor_id: currentUser?.id ?? null,
    })
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(`${data.message} (เอกสารเลขที่ ${data.docNo})`)
    setActivePlan(null)
    load()
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">บัญชี Workshop รอลงข้อมูล</h1>
        <p className="text-ink-600 text-sm mt-1">ลงรายการค่าใช้จ่ายจริงของงาน — ระบบเติมยอดขายดันเข้าร้านค้าให้อัตโนมัติ</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && !activePlan && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      <div className="space-y-3">
        {!loading && plans.length === 0 && (
          <div className="glass p-8 text-center text-ink-400 text-sm">ไม่มีรายการรอลงบัญชี</div>
        )}
        {plans.map((p) => (
          <div key={p.id} className="glass glass-card-hover p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <span className="doc-badge">{p.id}</span>
              <p className="text-ink-900 text-sm mt-1">{p.store_name} — {p.province}</p>
              <p className="text-ink-500 text-xs">
                จำนวนคนเข้างาน: {p.attendees} · ยอดขายดันเข้าร้านค้า: {formatBaht(p.sales_push_amount)} · ยอดขาย Workshop: {formatBaht(p.workshop_sales_amount)}
              </p>
            </div>
            <button onClick={() => openPlan(p)} className="btn-primary text-xs px-4 py-2">ลงข้อมูลบัญชี</button>
          </div>
        ))}
      </div>

      {activePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setActivePlan(null)}>
          <div className="glass-solid max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-xl text-ink-900">ลงบัญชี <span className="doc-badge ml-2">{activePlan.id}</span></h2>
              <button onClick={() => setActivePlan(null)} className="text-ink-400 hover:text-ink-900">✕</button>
            </div>

            <div className="bg-ocean-pale border border-ocean/20 rounded-lg p-3 text-sm mb-4">
              <p className="text-ink-900">ร้านค้า: {activePlan.store_name} — จำนวนคนเข้างาน: {activePlan.attendees}</p>
              <p className="text-ink-700 mt-1">
                รายได้ที่จะเติมให้อัตโนมัติ: <b>ยอดขายดันเข้าร้านค้า {formatBaht(activePlan.sales_push_amount)}</b> (หมวด "รายได้")
              </p>
              <p className="text-ink-500 text-xs mt-1">ยอดขาย Workshop {formatBaht(activePlan.workshop_sales_amount)} — ไม่นับเป็นรายได้บริษัท แสดงแยกในแดชบอร์ดเท่านั้น</p>
              {attachmentUrl && (
                <a href={attachmentUrl} target="_blank" rel="noreferrer" className="text-ocean text-xs underline mt-2 inline-block">ดู/ดาวน์โหลดไฟล์แนบจากเซลล์</a>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-ink-900 text-sm font-medium">รายการค่าใช้จ่ายจริง</h3>
                <button type="button" onClick={addItem} className="btn-ghost text-xs px-3 py-1.5">+ เพิ่มรายการ</button>
              </div>
              {items.map((it, i) => (
                <div key={i} className="bg-white/60 border border-black/[0.06] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <select className="glass-input text-sm sm:col-span-2" value={it.mainCategory} onChange={(e) => updateItem(i, 'mainCategory', e.target.value)}>
                    <option value="">— หมวดหมู่ —</option>
                    {MAIN_CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="glass-input text-sm sm:col-span-2" value={it.detail} onChange={(e) => updateItem(i, 'detail', e.target.value)}>
                    <option value="">— รายละเอียด —</option>
                    {DETAILS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="number" step="any" placeholder="จำนวน" className="glass-input text-sm" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
                  <input type="number" step="any" placeholder="ราคา/หน่วย" className="glass-input text-sm" value={it.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-rose text-xs text-left sm:col-span-6">ลบรายการนี้</button>
                  )}
                </div>
              ))}
              <p className="text-right text-gold-dark text-sm">รวมรายจ่าย: {formatBaht(itemsTotal)}</p>

              {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setActivePlan(null)} className="btn-ghost text-sm">ยกเลิก</button>
                <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกและจบกระบวนการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

```

---

### 📄 File: `src\pages\WorkshopApprovalPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

export default function WorkshopApprovalPage() {
  const { currentUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')

  const canApprove = hasPagePermission(currentUser, 'workshop-approve')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_workshop_plans', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setPlans((data ?? []).filter((p) => p.status === 'pending_approval'))
  }, [currentUser])

  useEffect(() => { if (canApprove) load() }, [canApprove, load])

  async function handleApprove(id) {
    setBusyId(id)
    setError('')
    const { data, error: err } = await supabase.rpc('approve_workshop_plan', { p_plan_id: id, p_actor_id: currentUser?.id ?? null })
    setBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  async function handleReject(id) {
    setBusyId(id)
    setError('')
    const { data, error: err } = await supabase.rpc('reject_workshop_plan', {
      p_plan_id: id, p_admin_note: rejectNote, p_actor_id: currentUser?.id ?? null,
    })
    setBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setRejectingId(null)
    setRejectNote('')
    load()
  }

  if (!canApprove) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">อนุมัติ Workshop</h1>
        <p className="text-ink-600 text-sm mt-1">คำขอ Workshop ที่รอการอนุมัติ</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      <div className="space-y-3">
        {!loading && plans.length === 0 && (
          <div className="glass p-8 text-center text-ink-400 text-sm">ไม่มีคำขอที่รออนุมัติ</div>
        )}
        {plans.map((p) => (
          <div key={p.id} className="glass p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="doc-badge">{p.id}</span>
                <p className="text-ink-900 text-sm mt-1">{p.store_name} — {p.province} ({p.region})</p>
                <p className="text-ink-500 text-xs">วันที่วางแผน: {p.planned_date} · เซลล์ที่สังกัด: {p.assigned_sales_name || 'ยังไม่ได้กำหนด'}</p>
              </div>
              <p className="text-ink-400 text-xs">ขอโดย {p.created_by} · {new Date(p.created_at).toLocaleString('th-TH')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleApprove(p.id)} disabled={busyId === p.id} className="btn-primary text-xs px-4 py-1.5 disabled:opacity-60">
                {busyId === p.id ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
              </button>
              <button onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)} className="btn-ghost text-xs px-4 py-1.5">ปฏิเสธ</button>
            </div>
            {rejectingId === p.id && (
              <div className="flex items-center gap-2 pt-2 border-t border-black/10">
                <input className="glass-input text-sm flex-1" placeholder="เหตุผลการปฏิเสธ (ไม่บังคับ)"
                       value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
                <button onClick={() => handleReject(p.id)} disabled={busyId === p.id} className="text-rose text-xs hover:underline whitespace-nowrap">ยืนยันปฏิเสธ</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

```

---

### 📄 File: `src\pages\WorkshopCreatePage.jsx`
```jsx
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import StoreSearchDropdown from '../components/StoreSearchDropdown'

export default function WorkshopCreatePage() {
  const { currentUser } = useAuth()
  const [selectedStore, setSelectedStore] = useState(null)
  const [plannedDate, setPlannedDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const canCreate = hasPagePermission(currentUser, 'workshop-plan-create')

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!selectedStore) return setError('กรุณาเลือกร้านค้า')
    if (!plannedDate) return setError('กรุณาเลือกวันที่วางแผนจัดงาน')

    setSubmitting(true)
    const { data, error: err } = await supabase.rpc('create_workshop_plan', {
      p_store_id: selectedStore.id,
      p_planned_date: plannedDate,
      p_created_by: currentUser?.id ?? null,
    })
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(`${data.message} (เลขที่เอกสาร ${data.planId})`)
    setSelectedStore(null)
    setPlannedDate('')
  }

  if (!canCreate) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">สร้างคำขอ Workshop ใหม่</h1>
        <p className="text-ink-600 text-sm mt-1">เลือกร้านค้าและวันที่วางแผนจัดงาน ส่งให้ผู้บริหารอนุมัติ</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleCreate} className="glass p-6 space-y-4">
        <div>
          <label className="block text-xs text-ink-600 mb-1">ร้านค้า *</label>
          <StoreSearchDropdown selectedStore={selectedStore} onSelect={setSelectedStore} />
        </div>
        <div className="max-w-xs">
          <label className="block text-xs text-ink-600 mb-1">วันที่วางแผนจัดงาน *</label>
          <input type="date" className="glass-input w-full" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { setSelectedStore(null); setPlannedDate('') }} className="btn-ghost text-sm">ยกเลิก</button>
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? 'กำลังส่ง...' : 'บันทึกคำขอ'}
          </button>
        </div>
      </form>
    </div>
  )
}

```

---

### 📄 File: `src\pages\WorkshopHistoryPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import StoreSearchDropdown from '../components/StoreSearchDropdown'

const STATUS_LABEL = {
  pending_approval: { text: 'รออนุมัติ', className: 'text-gold-dark bg-gold-pale border-gold/30' },
  rejected: { text: 'ถูกปฏิเสธ', className: 'text-rose bg-rose-pale border-rose/30' },
  awaiting_sales_data: { text: 'รอเซลล์อัพเดตข้อมูล', className: 'text-ocean bg-ocean-pale border-ocean/30' },
  completed: { text: 'เสร็จสิ้น', className: 'text-sage bg-sage-pale border-sage/30' },
}
const UNKNOWN_STATUS = { text: 'ไม่ทราบสถานะ', className: 'text-ink-500 bg-ink-100 border-black/10' }

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB

function formatBaht(n) {
  return n === null || n === undefined ? '-' : n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function WorkshopHistoryPage() {
  const { currentUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // ฟอร์มกรอก/แก้ไขข้อมูลหลังงาน
  const [fillingPlan, setFillingPlan] = useState(null)
  const [fillMode, setFillMode] = useState('submit') // 'submit' | 'edit'
  const [fillStep, setFillStep] = useState('form') // 'form' | 'confirm'
  const [attendees, setAttendees] = useState('')
  const [salesPush, setSalesPush] = useState('')
  const [workshopSales, setWorkshopSales] = useState('')
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [fillSubmitting, setFillSubmitting] = useState(false)

  // ฟอร์มแก้ไขคำขอ (ร้าน/วันที่)
  const [editingRequest, setEditingRequest] = useState(null)
  const [editStep, setEditStep] = useState('form') // 'form' | 'confirm'
  const [editStore, setEditStore] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // ยืนยันลบ (double confirm แบบ inline)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const canView = hasPagePermission(currentUser, 'workshop-plan-view')
  const canEdit = hasPagePermission(currentUser, 'workshop-plan-edit')
  const canDelete = hasPagePermission(currentUser, 'workshop-plan-delete')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_workshop_plans', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setPlans((data ?? []).filter((p) => p.created_by === currentUser?.id))
  }, [currentUser])

  useEffect(() => { if (canView) load() }, [canView, load])

  // ── กรอก/แก้ไขข้อมูลหลังงาน ──────────────────────────
  function openFillForm(plan) {
    setFillingPlan(plan)
    setFillMode('submit')
    setFillStep('form')
    setAttendees('')
    setSalesPush('')
    setWorkshopSales('')
    setFile(null)
    setFileError('')
    setError('')
  }

  function openEditSalesForm(plan) {
    setFillingPlan(plan)
    setFillMode('edit')
    setFillStep('form')
    setAttendees(plan.attendees === null || plan.attendees === undefined ? '' : String(plan.attendees))
    setSalesPush(plan.sales_push_amount === null || plan.sales_push_amount === undefined ? '' : String(plan.sales_push_amount))
    setWorkshopSales(plan.workshop_sales_amount === null || plan.workshop_sales_amount === undefined ? '' : String(plan.workshop_sales_amount))
    setFile(null)
    setFileError('')
    setError('')
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    setFileError('')
    if (f && f.size > MAX_FILE_BYTES) {
      setFileError('ไฟล์ใหญ่เกิน 10MB กรุณาเลือกไฟล์ใหม่')
      setFile(null)
      return
    }
    setFile(f ?? null)
  }

  function goToFillConfirm(e) {
    e.preventDefault()
    setError('')
    // ไม่บังคับกรอกแล้ว แค่กันค่าติดลบถ้ามีการกรอกมา
    if (attendees !== '' && Number(attendees) < 0) return setError('จำนวนคนเข้างานต้องไม่ติดลบ')
    if (salesPush !== '' && Number(salesPush) < 0) return setError('ยอดขายดันเข้าร้านค้าต้องไม่ติดลบ')
    if (workshopSales !== '' && Number(workshopSales) < 0) return setError('ยอดขาย Workshop ต้องไม่ติดลบ')
    setFillStep('confirm')
  }

  async function handleConfirmFill() {
    setFillSubmitting(true)
    setError('')
    let attachmentPath = null

    if (file) {
      const path = `${fillingPlan.id}/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage.from('workshop-attachments').upload(path, file)
      if (uploadErr) {
        setFillSubmitting(false)
        return setError('อัปโหลดไฟล์ไม่สำเร็จ: ' + uploadErr.message)
      }
      attachmentPath = path
    }

    const rpcName = fillMode === 'edit' ? 'update_workshop_sales_data' : 'submit_workshop_sales_data'
    const { data, error: err } = await supabase.rpc(rpcName, {
      p_plan_id: fillingPlan.id,
      p_attendees: attendees === '' ? null : Number(attendees),
      p_sales_push_amount: salesPush === '' ? null : Number(salesPush),
      p_workshop_sales_amount: workshopSales === '' ? null : Number(workshopSales),
      p_attachment_path: attachmentPath,
      p_actor_id: currentUser?.id ?? null,
    })
    setFillSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setFillingPlan(null)
    load()
  }

  // ── แก้ไขคำขอ (ร้าน/วันที่) ──────────────────────────
  function openEditRequest(plan) {
    setEditingRequest(plan)
    setEditStep('form')
    setEditStore({ id: plan.store_id, name: plan.store_name, province: plan.province, region: plan.region, assigned_sales_name: plan.assigned_sales_name })
    setEditDate(plan.planned_date)
    setError('')
  }

  function goToEditConfirm(e) {
    e.preventDefault()
    setError('')
    if (!editStore) return setError('กรุณาเลือกร้านค้า')
    if (!editDate) return setError('กรุณาเลือกวันที่วางแผนจัดงาน')
    setEditStep('confirm')
  }

  async function handleConfirmEditRequest() {
    setEditSubmitting(true)
    setError('')
    const { data, error: err } = await supabase.rpc('update_workshop_plan_request', {
      p_plan_id: editingRequest.id,
      p_store_id: editStore.id,
      p_planned_date: editDate,
      p_actor_id: currentUser?.id ?? null,
    })
    setEditSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setEditingRequest(null)
    load()
  }

  // ── ลบ (double confirm inline) ──────────────────────────
  async function handleConfirmDelete(plan) {
    setDeleteSubmitting(true)
    setError('')
    const { data, error: err } = await supabase.rpc('delete_workshop_plan', {
      p_plan_id: plan.id, p_actor_id: currentUser?.id ?? null,
    })
    setDeleteSubmitting(false)
    setConfirmingDeleteId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  if (!canView) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">ประวัติเสนอ Workshop</h1>
        <p className="text-ink-600 text-sm mt-1">ติดตามสถานะแผน Workshop ของคุณทั้งหมด</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && !fillingPlan && !editingRequest && (
        <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="space-y-3">
        {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}
        {!loading && plans.length === 0 && (
          <div className="glass p-8 text-center text-ink-400 text-sm">ยังไม่มีคำขอ Workshop</div>
        )}
        {plans.map((p) => {
          const status = STATUS_LABEL[p.status] || UNKNOWN_STATUS
          const hasSalesData = p.sales_data_submitted_at != null
          return (
            <div key={p.id} className="glass p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="doc-badge">{p.id}</span>
                    <span className={`text-xs border rounded-full px-2.5 py-0.5 ${status.className}`}>{status.text}</span>
                  </div>
                  <p className="text-ink-900 text-sm mt-1">{p.store_name} — {p.province}</p>
                  <p className="text-ink-500 text-xs">วันที่วางแผน: {p.planned_date}</p>
                  {p.status === 'rejected' && p.admin_note && (
                    <p className="text-rose text-xs mt-1">เหตุผล: {p.admin_note}</p>
                  )}
                  {hasSalesData && (
                    <p className="text-ink-500 text-xs mt-1">
                      คนเข้างาน: {p.attendees ?? '-'} · ยอดขายดันเข้าร้านค้า: {formatBaht(p.sales_push_amount)} · ยอดขาย Workshop: {formatBaht(p.workshop_sales_amount)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {p.status === 'awaiting_sales_data' && (
                    <button onClick={() => openFillForm(p)} className="btn-primary text-xs px-4 py-2">กรอกข้อมูลหลังงาน</button>
                  )}
                  {canEdit && (
                    <button onClick={() => openEditRequest(p)} className="btn-ghost text-xs px-3 py-1.5">แก้ไขคำขอ</button>
                  )}
                  {canEdit && (
                    <button onClick={() => openEditSalesForm(p)} className="btn-ghost text-xs px-3 py-1.5">แก้ไขข้อมูลหลังงาน</button>
                  )}
                  {canDelete && (
                    <button onClick={() => setConfirmingDeleteId(p.id)} className="text-rose text-xs hover:underline px-1">ลบ</button>
                  )}
                </div>
              </div>

              {confirmingDeleteId === p.id && (
                <div className="bg-rose-pale border border-rose/30 rounded-lg p-3 flex items-center justify-between gap-3">
                  <p className="text-rose text-sm">ยืนยันลบคำขอ {p.id} ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setConfirmingDeleteId(null)} className="btn-ghost text-xs px-3 py-1.5">ยกเลิก</button>
                    <button onClick={() => handleConfirmDelete(p)} disabled={deleteSubmitting}
                            className="bg-rose text-white text-xs px-3 py-1.5 rounded-xl disabled:opacity-60">
                      {deleteSubmitting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Modal: กรอก/แก้ไขข้อมูลหลังงาน ── */}
      {fillingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setFillingPlan(null)}>
          <div className="glass-solid max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-xl text-ink-900">
                {fillMode === 'edit' ? 'แก้ไขข้อมูลหลังงาน' : 'กรอกข้อมูลหลังงาน'} <span className="doc-badge ml-2">{fillingPlan.id}</span>
              </h2>
              <button onClick={() => setFillingPlan(null)} className="text-ink-400 hover:text-ink-900">✕</button>
            </div>

            {fillStep === 'form' && (
              <form onSubmit={goToFillConfirm} className="space-y-4">
                <p className="text-ink-400 text-xs">ทุกช่องไม่บังคับกรอก — เว้นว่างไว้ได้ถ้ายังไม่มีข้อมูล</p>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">จำนวนคนเข้างาน</label>
                  <input type="number" min="0" className="glass-input w-full" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">ยอดขายดันเข้าร้านค้า (นับเป็นรายได้บริษัท)</label>
                  <input type="number" min="0" step="any" className="glass-input w-full" value={salesPush} onChange={(e) => setSalesPush(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">ยอดขาย Workshop (ยอดขายของร้าน ไม่นับรายได้บริษัท)</label>
                  <input type="number" min="0" step="any" className="glass-input w-full" value={workshopSales} onChange={(e) => setWorkshopSales(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">
                    แนบไฟล์ (ไม่เกิน 10MB){fillMode === 'edit' ? ' — เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยนไฟล์เดิม' : ''}
                  </label>
                  <input type="file" className="glass-input w-full" onChange={handleFileChange} />
                  {fileError && <p className="text-rose text-xs mt-1">{fileError}</p>}
                  {file && <p className="text-ink-500 text-xs mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
                </div>
                {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setFillingPlan(null)} className="btn-ghost text-sm">ยกเลิก</button>
                  <button type="submit" className="btn-primary text-sm">ตรวจสอบก่อนบันทึก</button>
                </div>
              </form>
            )}

            {fillStep === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-white/60 border border-black/[0.06] rounded-xl p-4 space-y-2 text-sm">
                  <p><span className="text-ink-500">ร้านค้า:</span> {fillingPlan.store_name}</p>
                  <p><span className="text-ink-500">จำนวนคนเข้างาน:</span> {attendees || '-'}</p>
                  <p><span className="text-ink-500">ยอดขายดันเข้าร้านค้า:</span> {salesPush ? formatBaht(Number(salesPush)) : '-'}</p>
                  <p><span className="text-ink-500">ยอดขาย Workshop:</span> {workshopSales ? formatBaht(Number(workshopSales)) : '-'}</p>
                  <p><span className="text-ink-500">ไฟล์แนบ:</span> {file ? file.name : (fillMode === 'edit' ? 'ไม่เปลี่ยนไฟล์เดิม' : 'ไม่มี')}</p>
                </div>
                {fillMode === 'submit' && (
                  <p className="text-gold-dark text-sm bg-gold-pale border border-gold/30 rounded-lg px-3 py-2">
                    ยืนยันแล้ว Workshop นี้จะถูกปิดเป็น "เสร็จสิ้น" ทันที
                  </p>
                )}
                {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setFillStep('form')} className="btn-ghost text-sm">แก้ไข</button>
                  <button onClick={handleConfirmFill} disabled={fillSubmitting} className="btn-primary text-sm disabled:opacity-60">
                    {fillSubmitting ? 'กำลังบันทึก...' : 'ยืนยันบันทึก'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modal: แก้ไขคำขอ (ร้าน/วันที่) ── */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingRequest(null)}>
          <div className="glass-solid max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-xl text-ink-900">
                แก้ไขคำขอ <span className="doc-badge ml-2">{editingRequest.id}</span>
              </h2>
              <button onClick={() => setEditingRequest(null)} className="text-ink-400 hover:text-ink-900">✕</button>
            </div>

            {editStep === 'form' && (
              <form onSubmit={goToEditConfirm} className="space-y-4">
                <div>
                  <label className="block text-xs text-ink-600 mb-1">ร้านค้า *</label>
                  <StoreSearchDropdown selectedStore={editStore} onSelect={setEditStore} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">วันที่วางแผนจัดงาน *</label>
                  <input type="date" className="glass-input w-full" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingRequest(null)} className="btn-ghost text-sm">ยกเลิก</button>
                  <button type="submit" className="btn-primary text-sm">ตรวจสอบก่อนบันทึก</button>
                </div>
              </form>
            )}

            {editStep === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-white/60 border border-black/[0.06] rounded-xl p-4 space-y-2 text-sm">
                  <p><span className="text-ink-500">ร้านค้าใหม่:</span> {editStore?.name}</p>
                  <p><span className="text-ink-500">วันที่ใหม่:</span> {editDate}</p>
                </div>
                {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditStep('form')} className="btn-ghost text-sm">แก้ไข</button>
                  <button onClick={handleConfirmEditRequest} disabled={editSubmitting} className="btn-primary text-sm disabled:opacity-60">
                    {editSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการแก้ไข'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

```

---

### 📄 File: `src\pages\WorkshopPlanPage.jsx`
```jsx
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import StoreSearchDropdown from '../components/StoreSearchDropdown'

const STATUS_LABEL = {
  pending_approval: { text: 'รออนุมัติ', className: 'text-gold-dark bg-gold-pale border-gold/30' },
  rejected: { text: 'ถูกปฏิเสธ', className: 'text-rose bg-rose-pale border-rose/30' },
  awaiting_sales_data: { text: 'รอกรอกข้อมูลหลังงาน', className: 'text-ocean bg-ocean-pale border-ocean/30' },
  pending_accounting: { text: 'รอบัญชีลงข้อมูล', className: 'text-gold-dark bg-gold-pale border-gold/30' },
  completed: { text: 'เสร็จสิ้น', className: 'text-sage bg-sage-pale border-sage/30' },
}

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function WorkshopPlanPage() {
  const { currentUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // ฟอร์มสร้างคำขอใหม่
  const [selectedStore, setSelectedStore] = useState(null)
  const [plannedDate, setPlannedDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // ฟอร์มกรอกข้อมูลหลังงาน (เปิดต่อ plan) — ใช้ร่วมกันทั้งตอน "กรอกครั้งแรก" (submit)
  // และ "แก้ไขทีหลัง" (edit) ก่อนบัญชีลงบัญชีเสร็จ
  const [fillingPlan, setFillingPlan] = useState(null)
  const [fillMode, setFillMode] = useState('submit') // 'submit' | 'edit'
  const [fillStep, setFillStep] = useState('form') // 'form' | 'preview'
  const [attendees, setAttendees] = useState('')
  const [salesPush, setSalesPush] = useState('')
  const [workshopSales, setWorkshopSales] = useState('')
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [fillSubmitting, setFillSubmitting] = useState(false)

  // ฟอร์มแก้ไขคำขอ (ร้าน/วันที่) — เฉพาะสถานะรออนุมัติ
  const [editingRequest, setEditingRequest] = useState(null)
  const [editStore, setEditStore] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const canUse = hasPagePermission(currentUser, 'workshop-plan')
  const canEdit = hasPagePermission(currentUser, 'workshop-plan-edit')
  const canDelete = hasPagePermission(currentUser, 'workshop-plan-delete')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_workshop_plans', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setPlans((data ?? []).filter((p) => p.created_by === currentUser?.id))
  }, [currentUser])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!selectedStore) return setError('กรุณาเลือกร้านค้า')
    if (!plannedDate) return setError('กรุณาเลือกวันที่วางแผนจัดงาน')

    setSubmitting(true)
    const { data, error: err } = await supabase.rpc('create_workshop_plan', {
      p_store_id: selectedStore.id,
      p_planned_date: plannedDate,
      p_created_by: currentUser?.id ?? null,
    })
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setSelectedStore(null)
    setPlannedDate('')
    load()
  }

  function openFillForm(plan) {
    setFillingPlan(plan)
    setFillMode('submit')
    setFillStep('form')
    setAttendees('')
    setSalesPush('')
    setWorkshopSales('')
    setFile(null)
    setFileError('')
    setError('')
  }

  function openEditSalesForm(plan) {
    setFillingPlan(plan)
    setFillMode('edit')
    setFillStep('form')
    setAttendees(String(plan.attendees ?? ''))
    setSalesPush(String(plan.sales_push_amount ?? ''))
    setWorkshopSales(String(plan.workshop_sales_amount ?? ''))
    setFile(null)
    setFileError('')
    setError('')
  }

  function openEditRequest(plan) {
    setEditingRequest(plan)
    setEditStore({ id: plan.store_id, name: plan.store_name, province: plan.province, region: plan.region, assigned_sales_name: plan.assigned_sales_name })
    setEditDate(plan.planned_date)
    setError('')
  }

  async function handleUpdateRequest(e) {
    e.preventDefault()
    setError('')
    if (!editStore) return setError('กรุณาเลือกร้านค้า')
    if (!editDate) return setError('กรุณาเลือกวันที่วางแผนจัดงาน')

    setEditSubmitting(true)
    const { data, error: err } = await supabase.rpc('update_workshop_plan_request', {
      p_plan_id: editingRequest.id,
      p_store_id: editStore.id,
      p_planned_date: editDate,
      p_actor_id: currentUser?.id ?? null,
    })
    setEditSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setEditingRequest(null)
    load()
  }

  async function handleDeleteRequest(plan) {
    if (!confirm(`ยืนยันลบคำขอ Workshop ${plan.id}? การลบไม่สามารถย้อนกลับได้`)) return
    setError('')
    const { data, error: err } = await supabase.rpc('delete_workshop_plan', {
      p_plan_id: plan.id, p_actor_id: currentUser?.id ?? null,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    setFileError('')
    if (f && f.size > MAX_FILE_BYTES) {
      setFileError('ไฟล์ใหญ่เกิน 10MB กรุณาเลือกไฟล์ใหม่')
      setFile(null)
      return
    }
    setFile(f ?? null)
  }

  function goToPreview(e) {
    e.preventDefault()
    setError('')
    if (attendees === '' || Number(attendees) < 0) return setError('กรุณากรอกจำนวนคนเข้างานให้ถูกต้อง')
    if (salesPush === '' || Number(salesPush) < 0) return setError('กรุณากรอกยอดขายดันเข้าร้านค้าให้ถูกต้อง')
    if (workshopSales === '' || Number(workshopSales) < 0) return setError('กรุณากรอกยอดขาย Workshop ให้ถูกต้อง')
    setFillStep('preview')
  }

  async function handleConfirmSubmit() {
    setFillSubmitting(true)
    setError('')
    let attachmentPath = null // ไม่มีไฟล์ใหม่ → ตอน submit แปลว่า "ไม่มีไฟล์แนบ", ตอน edit แปลว่า "คงไฟล์เดิมไว้" (ดู logic ใน update_workshop_sales_data)

    if (file) {
      const path = `${fillingPlan.id}/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage.from('workshop-attachments').upload(path, file)
      if (uploadErr) {
        setFillSubmitting(false)
        return setError('อัปโหลดไฟล์ไม่สำเร็จ: ' + uploadErr.message)
      }
      attachmentPath = path
    }

    const rpcName = fillMode === 'edit' ? 'update_workshop_sales_data' : 'submit_workshop_sales_data'
    const { data, error: err } = await supabase.rpc(rpcName, {
      p_plan_id: fillingPlan.id,
      p_attendees: Number(attendees),
      p_sales_push_amount: Number(salesPush),
      p_workshop_sales_amount: Number(workshopSales),
      p_attachment_path: attachmentPath,
      p_actor_id: currentUser?.id ?? null,
    })
    setFillSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setFillingPlan(null)
    load()
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">ขอ Workshop / ประวัติของฉัน</h1>
        <p className="text-ink-600 text-sm mt-1">สร้างคำขอใหม่ และติดตามสถานะแผน Workshop ของคุณ</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleCreate} className="glass p-6 space-y-4">
        <h2 className="text-ink-900 font-medium">สร้างคำขอ Workshop ใหม่</h2>
        <div>
          <label className="block text-xs text-ink-600 mb-1">ร้านค้า *</label>
          <StoreSearchDropdown selectedStore={selectedStore} onSelect={setSelectedStore} />
        </div>
        <div className="max-w-xs">
          <label className="block text-xs text-ink-600 mb-1">วันที่วางแผนจัดงาน *</label>
          <input type="date" className="glass-input w-full" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { setSelectedStore(null); setPlannedDate('') }} className="btn-ghost text-sm">ยกเลิก</button>
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? 'กำลังส่ง...' : 'บันทึกคำขอ'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}
        {!loading && plans.length === 0 && (
          <div className="glass p-8 text-center text-ink-400 text-sm">ยังไม่มีคำขอ Workshop</div>
        )}
        {plans.map((p) => {
          const status = STATUS_LABEL[p.status]
          return (
            <div key={p.id} className="glass p-4 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2">
                  <span className="doc-badge">{p.id}</span>
                  <span className={`text-xs border rounded-full px-2.5 py-0.5 ${status.className}`}>{status.text}</span>
                </div>
                <p className="text-ink-900 text-sm mt-1">{p.store_name} — {p.province}</p>
                <p className="text-ink-500 text-xs">วันที่วางแผน: {p.planned_date}</p>
                {p.status === 'rejected' && p.admin_note && (
                  <p className="text-rose text-xs mt-1">เหตุผล: {p.admin_note}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {p.status === 'pending_approval' && canEdit && (
                  <button onClick={() => openEditRequest(p)} className="btn-ghost text-xs px-3 py-1.5">แก้ไข</button>
                )}
                {p.status === 'awaiting_sales_data' && (
                  <button onClick={() => openFillForm(p)} className="btn-primary text-xs px-4 py-2">กรอกข้อมูลหลังงาน</button>
                )}
                {p.status === 'pending_accounting' && canEdit && (
                  <button onClick={() => openEditSalesForm(p)} className="btn-ghost text-xs px-3 py-1.5">แก้ไขข้อมูลหลังงาน</button>
                )}
                {['pending_approval', 'rejected', 'awaiting_sales_data'].includes(p.status) && canDelete && (
                  <button onClick={() => handleDeleteRequest(p)} className="text-rose text-xs hover:underline px-1">ลบ</button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {fillingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setFillingPlan(null)}>
          <div className="glass-solid max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-xl text-ink-900">
                {fillMode === 'edit' ? 'แก้ไขข้อมูลหลังงาน' : 'กรอกข้อมูลหลังงาน'} <span className="doc-badge ml-2">{fillingPlan.id}</span>
              </h2>
              <button onClick={() => setFillingPlan(null)} className="text-ink-400 hover:text-ink-900">✕</button>
            </div>

            {fillStep === 'form' && (
              <form onSubmit={goToPreview} className="space-y-4">
                <div>
                  <label className="block text-xs text-ink-600 mb-1">จำนวนคนเข้างาน *</label>
                  <input type="number" min="0" className="glass-input w-full" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">ยอดขายดันเข้าร้านค้า (นับเป็นรายได้บริษัท) *</label>
                  <input type="number" min="0" step="any" className="glass-input w-full" value={salesPush} onChange={(e) => setSalesPush(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">ยอดขาย Workshop (ยอดขายของร้าน ไม่นับรายได้บริษัท) *</label>
                  <input type="number" min="0" step="any" className="glass-input w-full" value={workshopSales} onChange={(e) => setWorkshopSales(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">
                    แนบไฟล์ (ไม่เกิน 10MB){fillMode === 'edit' ? ' — เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยนไฟล์เดิม' : ''}
                  </label>
                  <input type="file" className="glass-input w-full" onChange={handleFileChange} />
                  {fileError && <p className="text-rose text-xs mt-1">{fileError}</p>}
                  {file && <p className="text-ink-500 text-xs mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
                </div>
                {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setFillingPlan(null)} className="btn-ghost text-sm">ยกเลิก</button>
                  <button type="submit" className="btn-primary text-sm">ดูตัวอย่างก่อนบันทึก</button>
                </div>
              </form>
            )}

            {fillStep === 'preview' && (
              <div className="space-y-4">
                <div className="bg-white/60 border border-black/[0.06] rounded-xl p-4 space-y-2 text-sm">
                  <p><span className="text-ink-500">ร้านค้า:</span> {fillingPlan.store_name}</p>
                  <p><span className="text-ink-500">จำนวนคนเข้างาน:</span> {attendees}</p>
                  <p><span className="text-ink-500">ยอดขายดันเข้าร้านค้า:</span> {formatBaht(Number(salesPush))}</p>
                  <p><span className="text-ink-500">ยอดขาย Workshop:</span> {formatBaht(Number(workshopSales))}</p>
                  <p><span className="text-ink-500">ไฟล์แนบ:</span> {file ? file.name : (fillMode === 'edit' ? 'ไม่เปลี่ยนไฟล์เดิม' : 'ไม่มี')}</p>
                </div>
                {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setFillStep('form')} className="btn-ghost text-sm">แก้ไข</button>
                  <button onClick={handleConfirmSubmit} disabled={fillSubmitting} className="btn-primary text-sm disabled:opacity-60">
                    {fillSubmitting ? 'กำลังบันทึก...' : 'ยืนยันบันทึก'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingRequest(null)}>
          <div className="glass-solid max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-xl text-ink-900">
                แก้ไขคำขอ <span className="doc-badge ml-2">{editingRequest.id}</span>
              </h2>
              <button onClick={() => setEditingRequest(null)} className="text-ink-400 hover:text-ink-900">✕</button>
            </div>
            <form onSubmit={handleUpdateRequest} className="space-y-4">
              <div>
                <label className="block text-xs text-ink-600 mb-1">ร้านค้า *</label>
                <StoreSearchDropdown selectedStore={editStore} onSelect={setEditStore} />
              </div>
              <div>
                <label className="block text-xs text-ink-600 mb-1">วันที่วางแผนจัดงาน *</label>
                <input type="date" className="glass-input w-full" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
              </div>
              {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingRequest(null)} className="btn-ghost text-sm">ยกเลิก</button>
                <button type="submit" disabled={editSubmitting} className="btn-primary text-sm disabled:opacity-60">
                  {editSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

```

---


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

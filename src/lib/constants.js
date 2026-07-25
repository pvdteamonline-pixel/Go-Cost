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
      { key: 'tax-report', label: 'รายงานสำหรับกรมสรรพากร', icon: 'file' },
      { key: 'budgets', label: 'ตั้งงบประมาณ', icon: 'cash' },
      { key: 'accounts', label: 'จัดการรหัสบัญชี', icon: 'list' },
      { key: 'account-groups', label: 'กลุ่มรหัสบัญชี', icon: 'folder' },
      { key: 'account-import', label: 'แนบไฟล์บัญชี', icon: 'upload' },
      { key: 'reconciliation', label: 'เทียบยอด (Reconciliation)', icon: 'scale' },
      { key: 'external-expenses', label: 'ค่าใช้จ่ายช่องทางภายนอก (Beautrium)', icon: 'upload' },
      { key: 'trial-balance', label: 'งบทดลอง (Trial Balance)', icon: 'file' },
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

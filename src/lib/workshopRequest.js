import { THAI_MONTHS } from './constants.js'

export const WORKSHOP_TYPES = ['Workshop', 'ตั้งกอง', 'Training Partner', 'Training ศูนย์ฝึกอาชีพ']
export const PRODUCT_ESTIMATES = [
  { key: 'expected_product_order_value', label: 'ยอดดันเข้าสินค้าที่คาดการณ์', tone: 'blue' },
  { key: 'estimated_store_stock_value', label: 'มูลค่าสต็อกสินค้าคงร้านโดยประมาณ', tone: 'mint' },
]
export const validMoney = value => /^\d{1,9}(\.\d{1,2})?$/.test(String(value)) && Number.isFinite(Number(value))
export const WORKSHOP_GROUPS = [
  { key: 'pending', label: 'รออนุมัติ' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'other', label: 'สถานะอื่น ๆ' },
]
export const WORKSHOP_STATUS = {
  pending_approval: 'รออนุมัติ', awaiting_sales_data: 'อนุมัติแล้ว · รอข้อมูลหลังงาน',
  pending_accounting: 'อนุมัติแล้ว · รอบัญชี', completed: 'อนุมัติแล้ว · เสร็จสิ้น',
  rejected: 'ถูกปฏิเสธ', approved: 'อนุมัติแล้ว',
}
export function approvalGroup(status) {
  if (status === 'pending_approval') return 'pending'
  if (['awaiting_sales_data', 'pending_accounting', 'completed', 'approved'].includes(status)) return 'approved'
  return 'other'
}
export function monthLabel(key) {
  const [year, month] = key.split('-').map(Number)
  return year && month >= 1 && month <= 12 ? THAI_MONTHS[month - 1] + ' ' + (year + 543) : 'ยังไม่ระบุเดือน'
}
export function formatMoney(value) {
  return value == null || value === '' ? '—' : Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
export function expenseTotal(items = []) {
  return items.reduce((sum, item) => sum + Math.round((Number(item.amount) || 0) * 100), 0) / 100
}
export function requestDefaults(plan, initialDate = '') {
  const d = plan?.request_details || {}
  return {
    event_type: d.event_type || 'Workshop', party_name: d.party_name || plan?.store_name || '',
    planned_date: plan?.planned_date || initialDate, start_time: d.start_time || '', end_time: d.end_time || '',
    venue: d.venue || '', topic: d.topic || '', expected_attendees: d.expected_attendees ?? '',
    estimated_cost: d.estimated_cost ?? '', expense_items: d.expense_items?.map(item => ({ ...item })) || [],
    equipment: d.equipment || '',
    expected_product_order_value: d.expected_product_order_value ?? '',
    estimated_store_stock_value: d.estimated_store_stock_value ?? '',
  }
}
export function validateRequest(d) {
  if (!WORKSHOP_TYPES.includes(d.event_type)) return 'กรุณาเลือกประเภทงาน'
  if (!d.party_name.trim() || d.party_name.length > 300) return 'กรุณาระบุชื่อร้าน / ลูกค้า / สถาบัน ไม่เกิน 300 ตัวอักษร'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.planned_date) || Number.isNaN(Date.parse(d.planned_date)) || new Date(d.planned_date).toISOString().slice(0, 10) !== d.planned_date) return 'กรุณาระบุวันที่จัดงานให้ถูกต้อง'
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.start_time) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.end_time) || d.end_time <= d.start_time) return 'กรุณาระบุเวลาเริ่มและเวลาสิ้นสุด โดยเวลาสิ้นสุดต้องหลังเวลาเริ่มในวันเดียวกัน'
  if (!d.venue.trim() || d.venue.length > 1000) return 'กรุณาระบุสถานที่จัด ไม่เกิน 1,000 ตัวอักษร'
  if (!d.topic.trim() || d.topic.length > 1000) return 'กรุณาระบุหัวข้ออบรม ไม่เกิน 1,000 ตัวอักษร'
  if (String(d.expected_attendees) === '' || !Number.isInteger(Number(d.expected_attendees)) || Number(d.expected_attendees) < 1 || Number(d.expected_attendees) > 1000000) return 'จำนวนคนที่คาดหวังต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 1,000,000 คน'
  if (!validMoney(d.estimated_cost)) return 'กรุณาระบุค่าใช้จ่ายที่คาดการณ์เป็นจำนวนเงินตั้งแต่ 0 และทศนิยมไม่เกิน 2 ตำแหน่ง'
  for (const { key, label } of PRODUCT_ESTIMATES) {
    if (d[key] != null && d[key] !== '' && !validMoney(d[key])) return label + ' ต้องเป็นจำนวนเงินตั้งแต่ 0 ถึง 999,999,999.99 บาท และทศนิยมไม่เกิน 2 ตำแหน่ง'
  }
  if (d.expense_items.length > 100) return 'ระบุค่าเบิกได้ไม่เกิน 100 รายการ'
  for (const item of d.expense_items) {
    if (!item.description.trim() || item.description.length > 500 || !validMoney(item.amount) || Number(item.amount) <= 0) return 'กรุณาระบุชื่อรายการค่าเบิกและจำนวนเงินมากกว่า 0 ให้ครบทุกแถว'
  }
  if (Math.round(expenseTotal(d.expense_items) * 100) > Math.round(Number(d.estimated_cost) * 100)) return 'ยอดรวมที่ขอเบิกต้องไม่เกินค่าใช้จ่ายที่คาดการณ์ในข้อ 6'
  if (d.equipment.length > 2000) return 'รายละเอียดอุปกรณ์ต้องไม่เกิน 2,000 ตัวอักษร'
  return ''
}
export function requestPayload(d) {
  return {
    event_type: d.event_type, party_name: d.party_name.trim(), start_time: d.start_time, end_time: d.end_time,
    venue: d.venue.trim(), topic: d.topic.trim(), expected_attendees: Number(d.expected_attendees),
    estimated_cost: Number(d.estimated_cost),
    expense_items: d.expense_items.map(item => ({ description: item.description.trim(), amount: Number(item.amount) })),
    equipment: d.equipment.trim(),
    ...Object.fromEntries(PRODUCT_ESTIMATES.map(({ key }) => [key, d[key] == null || d[key] === '' ? null : Number(d[key])])),
  }
}
export function groupWorkshopPlans(plans, { search = '', type = '', month = '' } = {}) {
  const query = search.trim().toLocaleLowerCase('th-TH')
  const groups = new Map()
  for (const plan of plans) {
    const d = plan.request_details || {}
    const key = plan.planned_date?.slice(0, 7) || 'unknown'
    if (month && key !== month || type && (d.event_type || 'Workshop') !== type) continue
    if (query && ![plan.id, plan.store_name, d.party_name, d.topic, d.venue].some(s => String(s || '').toLocaleLowerCase('th-TH').includes(query))) continue
    if (!groups.has(key)) groups.set(key, { month: key, pending: [], approved: [], other: [], count: 0 })
    const group = groups.get(key)
    group[approvalGroup(plan.status)].push(plan)
    group.count++
  }
  return [...groups.values()].sort((a, b) => a.month.localeCompare(b.month)).map(group => {
    for (const { key } of WORKSHOP_GROUPS) group[key].sort((a, b) => (a.planned_date || '').localeCompare(b.planned_date || '') || (a.request_details?.start_time || '').localeCompare(b.request_details?.start_time || '') || a.id.localeCompare(b.id))
    return group
  })
}

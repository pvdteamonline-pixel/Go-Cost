// A document belongs to exactly one group, even if its lines span categories.
// Grouping must never split a document or count its recorded totals twice.
const GROUPS = [
  ['ค่าใช้จ่าย Workshop', 'Workshop'], ['ค่าใช้จ่าย Partner', 'Partner'],
  ['ค่าใช้จ่าย งาน Event', 'Event'], ['ค่าใช้จ่าย สินค้าตั้งกอง (Sell-Out)', 'สินค้าตั้งกอง'],
  ['ค่าใช้จ่าย งานแฟร์', 'งานแฟร์'], ['ค่าใช้จ่าย ถ่าย Content', 'ถ่าย Content'],
  ['ค่าโปรโมท', 'ค่าโปรโมท'], ['mixed', 'หลายหมวด'], ['income', 'รายได้'],
  ['unknown', 'ไม่ระบุหมวด'], ['workshop-plan', 'คำขอ Workshop'], ['deleted', 'เอกสารที่ลบแล้ว'],
]
const labels = new Map(GROUPS)
const rank = new Map(GROUPS.map(([key], index) => [key, index]))
export function documentGroupKey(doc) {
  if (doc.status === 'deleted') return 'deleted'
  if (doc.type === 'Workshop') return 'workshop-plan'
  const categories = new Set((doc.items ?? []).map(item => String(item.mainCategory ?? item.main_category ?? '').trim()).filter(category => category !== 'รายได้').map(category => category || 'unknown'))
  if (categories.size > 1) return 'mixed'
  if (categories.size === 1) return [...categories][0]
  return (doc.items ?? []).some(item => (item.mainCategory ?? item.main_category) === 'รายได้') ? 'income' : 'unknown'
}
export function groupDocuments(documents) {
  const groups = new Map()
  for (const doc of documents) {
    const key = documentGroupKey(doc)
    if (!groups.has(key)) groups.set(key, { key, label: labels.get(key) ?? key, documents: [] })
    groups.get(key).documents.push(doc)
  }
  return [...groups.values()].sort((a, b) => (rank.get(a.key) ?? 9) - (rank.get(b.key) ?? 9) || a.label.localeCompare(b.label, 'th'))
}

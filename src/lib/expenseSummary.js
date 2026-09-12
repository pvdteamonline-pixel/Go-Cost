// Match Postgres numeric arithmetic: round each line to satang before summing.
export function lineSatang(qty, price) {
  function decimal(value) {
    const text = String(value ?? '').trim()
    if (!/^\d+(\.\d+)?$/.test(text)) return [0n, 0]
    const [a, b = ''] = text.split('.')
    return [BigInt(a + b), b.length]
  }
  const [q, qs] = decimal(qty), [p, ps] = decimal(price)
  const numerator = q * p * 100n, divisor = 10n ** BigInt(qs + ps)
  return Number((numerator + divisor / 2n) / divisor)
}
export const baht = n => Number(n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export function lineKind(item) {
  const category = item.main_category ?? item.mainCategory
  const detail = item.detail ?? ''
  if (category !== 'รายได้') return 'expense'
  if (detail === 'รายได้จาก Workshop') return 'storeSales'
  if (detail === 'ยอดของคืน') return 'returns'
  return 'income'
}
export function expenseSummary(items) {
  let expense = 0, income = 0, storeSales = 0, returns = 0
  const categories = {}, months = {}
  for (const item of items) {
    const cents = item.total != null ? Math.round(Number(item.total) * 100) : lineSatang(item.qty, item.unit_price ?? item.unitPrice)
    const kind = lineKind(item)
    if (kind === 'expense') {
      expense += cents
      const category = item.main_category ?? item.mainCategory
      categories[category] = (categories[category] ?? 0) + cents
      const month = item.event_date?.slice(0, 7)
      if (month) months[month] = (months[month] ?? 0) + cents
    } else if (kind === 'income') income += cents
    else if (kind === 'returns') returns += cents
    else storeSales += cents
  }
  // Legacy records classify positive return entries as income. Preserve that
  // recorded sign and expose returns separately instead of silently reversing it.
  return { expense: expense / 100, income: (income + returns) / 100, returns: returns / 100,
    storeSales: storeSales / 100, net: (income + returns - expense) / 100,
    categories: Object.entries(categories).map(([name, cents]) => ({ name, amount: cents / 100, percent: expense ? cents / expense * 100 : null })).sort((a,b) => b.amount-a.amount),
    months: Object.entries(months).sort().map(([month, cents]) => ({month, amount: cents / 100})) }
}
export function groupExpenseDocuments(rows, requests = []) {
  const docs = new Map()
  for (const row of rows) {
    if (!docs.has(row.doc_number)) docs.set(row.doc_number, { docNo: row.doc_number, type: 'PV', storeName: row.store_name,
      eventDate: row.event_date, attendees: row.attendees, workDays: row.work_days, internalNote: row.internal_note,
      status: 'saved', items: [] })
    docs.get(row.doc_number).items.push({...row, mainCategory: row.main_category, unitPrice: row.unit_price, accountId: row.account_id, attachmentUrl: row.attachment_url})
  }
  for (const request of requests) {
    if (docs.has(request.original_row_id) && ['pending_edit', 'pending_delete'].includes(request.status)) docs.get(request.original_row_id).status = request.status
  }
  return [...docs.values()].map(doc => ({...doc, ...expenseSummary(doc.items)}))
}
export const DOCUMENT_STATUS = { saved:'บันทึกแล้ว', pending_edit:'รออนุมัติแก้ไข', pending_delete:'รออนุมัติลบ', pending_approval:'เสนอ Workshop / รออนุมัติ', awaiting_sales_data:'อนุมัติแล้ว / รอข้อมูลหลังงาน', pending_accounting:'รอบัญชีลงยอด', completed:'เสร็จสิ้น', rejected:'ปฏิเสธ', deleted:'ลบแล้ว' }

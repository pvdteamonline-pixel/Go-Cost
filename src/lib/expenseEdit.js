export function createExpenseEditDraft(doc) {
  return {
    storeName: doc.storeName ?? '', eventDate: doc.eventDate?.slice(0, 10) ?? '',
    attendees: String(doc.attendees ?? ''), workDays: String(doc.workDays ?? ''), internalNote: doc.internalNote ?? '',
    items: (doc.items ?? []).map((item, index) => {
      const accountId = item.accountId ?? item.account_id
      return { clientId: `item-${index}`, mainCategory: item.mainCategory ?? item.main_category ?? '', detail: item.detail ?? '',
        qty: String(item.qty ?? ''), unit: item.unit ?? '', unitPrice: String(item.unitPrice ?? item.unit_price ?? ''), remark: item.remark ?? '',
        accountId: accountId == null ? '' : String(accountId), allowUnmapped: accountId == null || accountId === '',
        attachmentUrl: item.attachmentUrl ?? item.attachment_url ?? null }
    }),
  }
}

export function validateExpenseEdit(draft) {
  if (!draft.storeName.trim()) return 'กรุณากรอกชื่อร้านค้า / ชื่องาน'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.eventDate)) return 'กรุณาเลือกวันที่จัดงาน'
  for (const [label, value] of [['จำนวนผู้เข้างาน', draft.attendees], ['จำนวนวันทำงาน', draft.workDays]]) {
    const number = Number(value || 0)
    if (!Number.isInteger(number) || number < 0 || number > 2147483647) return `${label}ต้องเป็นจำนวนเต็มไม่ติดลบ`
  }
  if (!draft.items.length) return 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ'
  for (const [index, item] of draft.items.entries()) {
    const prefix = `รายการที่ ${index + 1}: `
    if (!item.mainCategory.trim()) return prefix + 'กรุณาเลือกหมวดหมู่หลัก'
    if (!item.detail.trim()) return prefix + 'กรุณาเลือกรายละเอียด'
    if (!item.accountId && !item.allowUnmapped) return prefix + 'กรุณาเลือกรหัสบัญชี'
    if (!/^\d+(\.\d+)?$/.test(item.qty) || !Number.isFinite(Number(item.qty)) || Number(item.qty) <= 0) return prefix + 'จำนวนต้องมากกว่า 0 และใช้รูปแบบตัวเลขปกติ'
    if (!/^\d+(\.\d+)?$/.test(item.unitPrice) || !Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0) return prefix + 'ราคาต่อหน่วยต้องเป็นตัวเลขไม่ติดลบ'
  }
  return ''
}

export function expenseEditPayload(draft) {
  return { storeName: draft.storeName.trim(), eventDate: draft.eventDate, attendees: Number(draft.attendees || 0), workDays: Number(draft.workDays || 0), internalNote: draft.internalNote,
    items: draft.items.map(({ mainCategory, detail, qty, unit, unitPrice, remark, accountId, allowUnmapped, attachmentUrl }) =>
      ({ mainCategory, detail, qty, unit, unitPrice, remark, accountId, allowUnmapped, attachmentUrl })) }
}

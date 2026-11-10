import { baht, expenseSummary, lineSatang, DOCUMENT_STATUS } from './expenseSummary.js'

export function documentDate(value) {
  if (!value) return '—'
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return match ? `${match[3]}/${match[2]}/${Number(match[1]) + 543}` : String(value)
}

export const documentMoney = value => value == null || !Number.isFinite(Number(value)) ? '—' : baht(Number(value))
export const documentText = value => value == null || value === '' ? '—' : String(value)

// A single, immutable snapshot supplies both Insight and the PDF. Preserve recorded
// totals (including returns); only calculate a line when its total is absent.
export function expenseDocument(doc) {
  const items = (doc.items ?? []).map((item, index) => ({
    ...item,
    seq: item.seq ?? index + 1,
    mainCategory: item.mainCategory ?? item.main_category ?? '',
    unitPrice: item.unitPrice ?? item.unit_price,
    total: item.total == null ? lineSatang(item.qty, item.unitPrice ?? item.unit_price) / 100 : Number(item.total),
    attachmentUrl: item.attachmentUrl ?? item.attachment_url,
  })).sort((a, b) => Number(a.seq) - Number(b.seq))
  const files = [...new Set(items.map(item => item.attachmentUrl).filter(Boolean).concat(doc.attachment_path ? [doc.attachment_path] : []))]
  return {
    ...doc,
    ...(doc.type === 'Workshop' ? {} : expenseSummary(items)),
    items, files,
    statusLabel: DOCUMENT_STATUS[doc.status] ?? documentText(doc.status),
    dateLabel: documentDate(doc.eventDate),
  }
}

export function attachmentName(path, index = 0) {
  const name = String(path).split('?')[0].split('/').pop()
  try { return decodeURIComponent(name) || `ไฟล์แนบ ${index + 1}` } catch { return name || `ไฟล์แนบ ${index + 1}` }
}

export function documentFilename(docNo) {
  const safe = Array.from(String(docNo ?? 'document'), char => char.codePointAt(0) < 32 || /[<>:"/\\|?*]/.test(char) ? '_' : char).join('')
  return `GoCost_${safe.slice(0, 100)}.pdf`
}

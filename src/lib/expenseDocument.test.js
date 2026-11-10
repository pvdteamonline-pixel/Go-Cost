import test from 'node:test'
import assert from 'node:assert/strict'
import { expenseDocument, documentDate, documentFilename } from './expenseDocument.js'

test('document snapshot preserves recorded amounts, returns and separate store sales', () => {
  const source = { docNo: 'PV1', type: 'PV', status: 'pending_edit', eventDate: '2026-11-09', items: [
    { seq: 4, main_category: 'รายได้', detail: 'รายได้จาก Workshop', qty: 20, unit_price: 100, total: '2000', attachment_url: 'a.pdf' },
    { seq: 2, main_category: 'ค่าใช้จ่าย Workshop', qty: 1, unit_price: 500, total: '500' },
    { seq: 1, main_category: 'ค่าใช้จ่าย Workshop', qty: 2, unit_price: 1500, total: '3000', attachment_url: 'a.pdf' },
    { seq: 3, main_category: 'รายได้', detail: 'ยอดขายดันเข้าสินค้า', qty: 1, unit_price: 9999, total: '5000' },
    { seq: 5, main_category: 'รายได้', detail: 'ยอดของคืน', total: '20' },
  ] }
  const before = JSON.stringify(source)
  const doc = expenseDocument(source)
  assert.equal(doc.expense, 3500)
  assert.equal(doc.income, 5020)
  assert.equal(doc.net, 1520)
  assert.equal(doc.storeSales, 2000)
  assert.equal(doc.returns, 20)
  assert.equal(doc.statusLabel, 'รออนุมัติแก้ไข')
  assert.equal(doc.dateLabel, '09/11/2569')
  assert.deepEqual(doc.items.map(item => item.seq), [1, 2, 3, 4, 5])
  assert.deepEqual(doc.files, ['a.pdf'])
  assert.equal(JSON.stringify(source), before)
})

test('missing totals use the same satang rounding as summary, explicit zero is retained', () => {
  const doc = expenseDocument({ items: [
    { mainCategory: 'ค่าใช้จ่าย', qty: '3', unitPrice: '0.335' },
    { mainCategory: 'ค่าใช้จ่าย', qty: 10, unitPrice: 100, total: 0 },
  ] })
  assert.equal(doc.items[0].total, 1.01)
  assert.equal(doc.items[1].total, 0)
  assert.equal(doc.expense, 1.01)
})

test('Workshop documents retain supplied summary and request details', () => {
  const doc = expenseDocument({ type: 'Workshop', income: 90, storeSales: 300, request_details: { topic: 'ทดสอบ' } })
  assert.equal(doc.expense, undefined)
  assert.equal(doc.income, 90)
  assert.equal(doc.request_details.topic, 'ทดสอบ')
})

test('date-only values do not shift with timezone, and filenames are safe', () => {
  assert.equal(documentDate('2026-11-09T00:00:00Z'), '09/11/2569')
  assert.equal(documentDate(null), '—')
  assert.equal(documentFilename('PV/2026:001'), 'GoCost_PV_2026_001.pdf')
})

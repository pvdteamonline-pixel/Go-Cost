import test from 'node:test'
import assert from 'node:assert/strict'
import { createExpenseEditDraft, expenseEditPayload, validateExpenseEdit } from './expenseEdit.js'
import { expenseSummary } from './expenseSummary.js'

const source = { docNo: 'PV-001', storeName: 'ร้านเดิม', eventDate: '2026-11-09', attendees: 0, workDays: 1, internalNote: 'หมายเหตุเดิม', items: [
  { main_category: 'ค่าใช้จ่าย Workshop', detail: 'ค่าอุปกรณ์', qty: 2, unit: 'ชุด', unit_price: 100, remark: 'รายละเอียดเดิม', account_id: 7, attachment_url: 'expenses/original.pdf' },
] }
test('edit round trip preserves identifiers, notes, units, attachments and zero metadata', () => {
  const before = JSON.stringify(source)
  const draft = createExpenseEditDraft(source)
  assert.equal(validateExpenseEdit(draft), '')
  const payload = expenseEditPayload(draft)
  assert.equal(payload.attendees, 0)
  assert.equal(payload.internalNote, 'หมายเหตุเดิม')
  assert.equal(payload.items[0].accountId, '7')
  assert.equal(payload.items[0].attachmentUrl, 'expenses/original.pdf')
  assert.equal(payload.items[0].unit, 'ชุด')
  assert.equal(payload.items[0].remark, 'รายละเอียดเดิม')
  assert.ok(!('clientId' in payload.items[0]))
  assert.equal(JSON.stringify(source), before)
})
test('editing quantity recalculates expense and keeps Workshop sales separate', () => {
  const draft = createExpenseEditDraft(source)
  draft.items[0].qty = '3'
  draft.items.push({ mainCategory: 'รายได้', detail: 'รายได้จาก Workshop', qty: '20', unitPrice: '100' })
  const totals = expenseSummary(draft.items)
  assert.equal(totals.expense, 300); assert.equal(totals.income, 0); assert.equal(totals.storeSales, 2000); assert.equal(totals.net, -300)
})
test('invalid decimals, fractional attendees and missing new accounts are rejected', () => {
  const draft = createExpenseEditDraft(source)
  draft.attendees = '1.5'; assert.match(validateExpenseEdit(draft), /จำนวนเต็ม/)
  draft.attendees = '0'; draft.items[0].qty = '1e2'; assert.match(validateExpenseEdit(draft), /จำนวนต้อง/)
  draft.items[0].qty = '1'; draft.items[0].unitPrice = '-1'; assert.match(validateExpenseEdit(draft), /ราคา/)
  draft.items[0].unitPrice = '0'; draft.items[0].accountId = ''; assert.match(validateExpenseEdit(draft), /รหัสบัญชี/)
})
test('legacy unmapped accounts and unknown labels survive editing unchanged', () => {
  const draft = createExpenseEditDraft({ ...source, items: [{ ...source.items[0], account_id: null, detail: 'รายละเอียดเดิมนอกตัวเลือก' }] })
  assert.equal(validateExpenseEdit(draft), '')
  assert.equal(expenseEditPayload(draft).items[0].detail, 'รายละเอียดเดิมนอกตัวเลือก')
  assert.equal(expenseEditPayload(draft).items[0].allowUnmapped, true)
})

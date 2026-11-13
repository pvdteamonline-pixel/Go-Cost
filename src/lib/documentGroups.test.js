import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupDocuments, documentGroupKey } from './documentGroups.js'
import { expenseSummary } from './expenseSummary.js'

test('grouping preserves each document once, including mixed categories, income-only and unknown records', () => {
  const docs = [
    { docNo: 'A', items: [{ main_category: 'ค่าใช้จ่าย Workshop', total: 3500 }, { main_category: 'รายได้', total: 5000 }] },
    { docNo: 'B', items: [{ mainCategory: 'ค่าใช้จ่าย Partner', total: 1200 }] },
    { docNo: 'C', items: [{ mainCategory: 'ค่าใช้จ่าย Workshop', total: 200 }, { mainCategory: 'ค่าใช้จ่าย Partner', total: 300 }] },
    { docNo: 'D', items: [{ mainCategory: 'รายได้', total: 500 }] },
    { docNo: 'E', items: [] },
  ]
  const original = structuredClone(docs), groups = groupDocuments(docs), flat = groups.flatMap(group => group.documents)
  assert.equal(documentGroupKey(docs[2]), 'mixed')
  assert.equal(documentGroupKey(docs[3]), 'income')
  assert.equal(new Set(flat.map(doc => doc.docNo)).size, 5)
  assert.equal(flat.length, 5)
  assert.deepEqual(expenseSummary(flat.flatMap(doc => doc.items)), expenseSummary(docs.flatMap(doc => doc.items)))
  assert.deepEqual(docs, original)
  assert.equal(documentGroupKey({ items: [{ mainCategory: '', total: 100 }, { mainCategory: 'รายได้', total: 500 }] }), 'unknown')
})
test('deleted documents and Workshop requests have explicit groups separate from PV financial records', () => {
  const docs = [{ docNo: 'PV1', items: [{ mainCategory: 'ค่าใช้จ่าย Workshop' }] }, { docNo: 'WS1', type: 'Workshop' }, { docNo: 'PV2', status: 'deleted' }]
  assert.deepEqual(groupDocuments(docs).map(group => group.label), ['Workshop', 'คำขอ Workshop', 'เอกสารที่ลบแล้ว'])
  assert.deepEqual(groupDocuments([]), [])
})

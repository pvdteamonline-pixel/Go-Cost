import { test } from 'node:test'
import assert from 'node:assert/strict'
import { groupWorkshopHistory, workshopStoreSummary } from './workshopHistory.js'
const plan = (id, store_id, planned_date, status, extra={}) => ({ id, store_id, planned_date, status, store_name:`ร้าน ${store_id}`, ...extra })

test('year/month hierarchy sorts by event date newest first and preserves all requests', () => {
  const input=[plan('a',1,'2025-12-31','completed'),plan('b',2,'2026-10-02','pending_approval'),plan('c',3,'2026-11-01','awaiting_sales_data')]
  const original=structuredClone(input), result=groupWorkshopHistory(input)
  assert.deepEqual(result.years.map(y=>y.label),['พ.ศ. 2569','พ.ศ. 2568'])
  assert.deepEqual(result.years[0].months.map(m=>m.label),['พฤศจิกายน','ตุลาคม'])
  assert.equal(result.summary.requests,3);assert.equal(result.summary.stores,3)
  assert.deepEqual(input,original)
})
test('duplicate stores count once per period and status, across months and mixed approval states', () => {
  const result=groupWorkshopHistory([plan('a',1,'2026-11-01','approved'),plan('b',1,'2026-11-02','completed'),plan('c',1,'2026-11-03','pending_approval'),plan('d',1,'2026-10-01','pending_accounting')])
  assert.equal(result.summary.stores,1);assert.equal(result.summary.requests,4)
  assert.equal(result.years[0].summary.stores,1)
  assert.equal(result.years[0].months[0].summary.stores,1)
  assert.equal(result.years[0].months[0].summary.approved,1)
  assert.equal(result.years[0].months[0].summary.pending,1)
  assert.equal(result.years[0].summary.overlapping,true)
})
test('stable IDs distinguish same-name branches; manual names normalize spaces without counting unnamed requests as stores', () => {
  const result=workshopStoreSummary([plan('a',1,'2026-11-01','completed',{store_name:'สาขา'}),plan('b',2,'2026-11-01','completed',{store_name:'สาขา'}),plan('c',null,'2026-11-01','pending_approval',{store_name:' ร้าน   ก ' }),plan('d',null,'2026-11-01','pending_approval',{store_name:'ร้าน ก'}),{id:'e',status:'rejected'}])
  assert.equal(result.stores,3);assert.equal(result.pending,1);assert.equal(result.approved,2);assert.equal(result.unknownStores,1);assert.equal(result.otherRequests,1)
})
test('rejected/unknown states and undated records stay visible outside approved and pending', () => {
  const result=groupWorkshopHistory([plan('a',1,'2026-11-01','rejected'),plan('b',2,null,'mystery'),plan('c',3,'bad-date','pending_approval')])
  assert.equal(result.summary.other,2);assert.equal(result.summary.approved,0);assert.equal(result.summary.pending,1)
  assert.equal(result.years.at(-1).key,'unknown');assert.equal(result.years.at(-1).months.length,1)
  assert.equal(result.years.at(-1).summary.requests,2)
})
test('search and type filters update year and month totals together; empty filters produce no invented year', () => {
  const data=[plan('a',1,'2026-11-01','completed',{request_details:{event_type:'Training Partner',topic:'หัวข้อทดสอบ'}}),plan('b',2,'2025-11-01','pending_approval')]
  const result=groupWorkshopHistory(data,{search:'หัวข้อ',type:'Training Partner'})
  assert.equal(result.summary.stores,1);assert.equal(result.years.length,1);assert.equal(result.years[0].months[0].summary.approved,1)
  assert.deepEqual(groupWorkshopHistory(data,{search:'ไม่มี'}).years,[])
})

test('approval counts every request, including repeated stores and unnamed requests, once in its status', () => {
  const data=[plan('a',1,'2026-11-01','pending_approval'),plan('b',1,'2026-11-02','pending_approval'),plan('c',1,'2026-11-03','awaiting_sales_data'),plan('d',1,'2026-10-01','completed'),{id:'e',status:'rejected'}]
  const result=groupWorkshopHistory(data)
  assert.deepEqual(result.summary.requestCounts,{pending:2,approved:2,other:1})
  assert.deepEqual(result.years[0].summary.requestCounts,{pending:2,approved:2,other:0})
  assert.deepEqual(result.years[0].months[0].summary.requestCounts,{pending:2,approved:1,other:0})
  assert.equal(result.summary.stores,1)
  assert.equal(Object.values(result.summary.requestCounts).reduce((sum,value)=>sum+value,0),result.summary.requests)
})

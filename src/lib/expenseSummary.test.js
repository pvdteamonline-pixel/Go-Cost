import test from 'node:test'
import assert from 'node:assert/strict'
import {lineSatang,expenseSummary,groupExpenseDocuments} from './expenseSummary.js'
test('decimal line rounding matches Postgres half-up before summing',()=>{
 assert.equal(lineSatang('3','0.335'),101)
 assert.equal(lineSatang('1','1.005'),101)
 assert.equal(expenseSummary([{mainCategory:'ค่าใช้จ่าย',qty:'1',unitPrice:'0.005'},{mainCategory:'ค่าใช้จ่าย',qty:'1',unitPrice:'0.005'}]).expense,0.02)
})
test('income, returns and shop Workshop sales are separated from expenses',()=>{
 const s=expenseSummary([{main_category:'ค่าใช้จ่าย Workshop',total:100,event_date:'2026-09-12'}, {main_category:'รายได้',detail:'ยอดขายดันเข้าสินค้า',total:250},{main_category:'รายได้',detail:'ยอดของคืน',total:20},{main_category:'รายได้',detail:'รายได้จาก Workshop',total:999}])
 assert.equal(s.expense,100);assert.equal(s.income,270);assert.equal(s.net,170);assert.equal(s.returns,20);assert.equal(s.storeSales,999);assert.equal(s.categories[0].percent,100)
})
test('multiple lines count as one document and use pending status without changing totals',()=>{
 const rows=[1,2].map(seq=>({doc_number:'PV1',seq,store_name:'Test',event_date:'2026-09-12',main_category:'ค่าใช้จ่าย',total:10}))
 const before=JSON.stringify(rows)
 const docs=groupExpenseDocuments(rows,[{original_row_id:'PV1',status:'pending_delete'}])
 assert.equal(docs.length,1);assert.equal(docs[0].expense,20);assert.equal(docs[0].status,'pending_delete');assert.equal(JSON.stringify(rows),before)
})
test('empty reports do not invent percentages',()=>{assert.deepEqual(expenseSummary([]).categories,[]);assert.equal(expenseSummary([]).net,0)})

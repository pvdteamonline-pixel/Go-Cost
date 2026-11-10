import { test } from 'node:test'
import assert from 'node:assert/strict'
import { WORKSHOP_TYPES, approvalGroup, expenseTotal, groupWorkshopPlans, requestDefaults, requestPayload, validateRequest } from '../src/lib/workshopRequest.js'
const valid = () => ({ ...requestDefaults(), planned_date:'2026-11-12', party_name:'ร้านทดสอบ', start_time:'09:00',end_time:'16:00',venue:'กรุงเทพ',topic:'ระบบ POS',expected_attendees:'30',estimated_cost:'8500',expense_items:[{description:'อาหาร',amount:'3000'},{description:'เดินทาง',amount:'1500'},{description:'วัสดุ',amount:'4000'}],equipment:'POS 2 ชุด' })

test('product estimates round trip without changing reimbursement totals', () => {
 const input={...valid(),expected_product_order_value:'50000.25',estimated_store_stock_value:'120000.50'}
 assert.equal(validateRequest(input),'')
 const payload=requestPayload(input)
 assert.equal(payload.expected_product_order_value,50000.25)
 assert.equal(payload.estimated_store_stock_value,120000.5)
 assert.equal(expenseTotal(payload.expense_items),8500)
 const restored=requestDefaults({request_details:payload})
 assert.equal(restored.expected_product_order_value,50000.25)
 assert.equal(restored.estimated_store_stock_value,120000.5)
})
test('blank/legacy estimates remain unspecified while zero remains an explicit zero', () => {
 for(const key of ['expected_product_order_value','estimated_store_stock_value']) {
  assert.equal(requestDefaults()[key],'')
  assert.equal(requestPayload(valid())[key],null)
  assert.equal(requestDefaults({request_details:{[key]:0}})[key],0)
  assert.equal(requestPayload({...valid(),[key]:'0'})[key],0)
  assert.equal(validateRequest({...valid(),[key]:''}),'')
  assert.equal(validateRequest({...valid(),[key]:'999999999.99'}),'')
  for(const value of ['-1','1.123','NaN','Infinity','1e3','1000000000','abc',' ']) assert.notEqual(validateRequest({...valid(),[key]:value}),'',key+': '+value)
 }
})
test('all 4 event types retain all 8 fields and exact total', () => {
 for(const event_type of WORKSHOP_TYPES) { const input={...valid(),event_type}; assert.equal(validateRequest(input),''); const payload=requestPayload(input); assert.equal(payload.event_type,event_type); assert.equal(payload.expected_attendees,30); assert.equal(payload.equipment,'POS 2 ชุด'); assert.equal(expenseTotal(payload.expense_items),8500) }
})
test('reject invalid dates, times, budget, fractional attendees and incomplete expense lines',()=>{
 for(const patch of [{planned_date:'2026-02-30'},{start_time:''},{end_time:'08:00'},{expected_attendees:'1.5'},{expected_attendees:''},{estimated_cost:'-1'},{estimated_cost:'1.123'},{estimated_cost:'8000'},{venue:''},{topic:''},{party_name:' '},{expense_items:[{description:'',amount:100}]},{expense_items:[{description:'x',amount:0}]}]) assert.notEqual(validateRequest({...valid(),...patch}),'',JSON.stringify(patch))
})
test('zero budget/no reimbursement is valid and cents do not accumulate float errors',()=>{assert.equal(validateRequest({...valid(),estimated_cost:'0',expense_items:[],equipment:''}),'');assert.equal(expenseTotal([{amount:0.1},{amount:0.2}]),0.3)})
test('legacy editing loads available values, preserves details for v2',()=>{assert.equal(requestDefaults({store_name:'เดิม',planned_date:'2026-10-05'}).party_name,'เดิม');const input=valid();const restored=requestDefaults({planned_date:input.planned_date,request_details:requestPayload(input)});assert.equal(restored.topic,input.topic);assert.equal(restored.expense_items.length,3)})
test('month grouping crosses years and uses event date, approved substatuses remain approved',()=>{
 const plans=[{id:'a',planned_date:'2027-01-12',created_at:'2026-10-01',status:'completed'},{id:'b',planned_date:'2026-12-20',status:'pending_approval'},{id:'c',planned_date:'2026-12-05',status:'awaiting_sales_data'},{id:'d',planned_date:'2026-12-02',status:'rejected'}]
 const groups=groupWorkshopPlans(plans);assert.deepEqual(groups.map(g=>g.month),['2026-12','2027-01']);assert.equal(groups[0].count,3);assert.equal(groups[0].approved[0].id,'c');assert.equal(groups[0].other[0].id,'d');assert.equal(approvalGroup('pending_accounting'),'approved');assert.equal(approvalGroup('unknown'),'other')
})
test('search, month and type filters compose without changing original plans',()=>{
 const plans=[{id:'1',store_name:'ศูนย์ฝึกอาชีพ',planned_date:'2026-11-12',status:'pending_approval',request_details:{event_type:'Training ศูนย์ฝึกอาชีพ'}},{id:'2',store_name:'ร้านกาแฟ',planned_date:'2026-12-12',status:'completed'}]
 assert.equal(groupWorkshopPlans(plans,{search:'ศูนย์',month:'2026-11',type:'Training ศูนย์ฝึกอาชีพ'})[0].count,1);assert.equal(groupWorkshopPlans(plans,{month:'2025-11'}).length,0);assert.equal(plans.length,2)
})

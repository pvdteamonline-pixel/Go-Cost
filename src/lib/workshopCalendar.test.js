import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dateNumber, calendarWeeks, plansOnDate, changeMonth, planRange } from './workshopCalendar.js'
import { requestDefaults, requestPayload, validateRequest } from './workshopRequest.js'
const plan = (id, start, end) => ({ id, planned_date: start, request_details: end ? { end_date: end } : {} })
test('inclusive 27-28 occupies Friday and Saturday exactly once', () => {
  const p=plan('a','2026-11-27','2026-11-28'), weeks=calendarWeeks('2026-11',[p])
  assert.equal(weeks.length,5);assert.equal(weeks[0].days[0],'2026-11-01')
  assert.deepEqual(weeks[3].segments.map(s=>[s.from,s.span,s.lane]),[[5,2,0]])
  assert.equal(plansOnDate([p],'2026-11-28').length,1);assert.equal(plansOnDate([p],'2026-11-29').length,0)
})
test('cross-week/month/year spans clip to each week without duplicating a day', () => {
  const p=plan('a','2026-12-30','2027-01-05'), weeks=calendarWeeks('2027-01',[p])
  assert.deepEqual(weeks.flatMap(w=>w.segments.map(s=>[s.from,s.span,s.before,s.after])),[[3,4,false,true],[0,3,true,false]])
  assert.equal(changeMonth('2026-12',1),'2027-01');assert.equal(changeMonth('2027-01',-1),'2026-12')
})
test('overlapping ranges get separate lanes; neighboring ranges reuse lanes', () => {
  const p=[plan('a','2026-11-16','2026-11-18'),plan('b','2026-11-17','2026-11-19'),plan('c','2026-11-19','2026-11-20')]
  const original=structuredClone(p), s=calendarWeeks('2026-11',p)[2].segments
  assert.deepEqual(s.map(x=>[x.plan.id,x.lane]),[['a',0],['b',1],['c',0]]);assert.deepEqual(p,original)
})
test('legacy dates stay single-day; invalid dates never get invented placements', () => {
  assert.deepEqual(planRange(plan('a','2026-11-01')), {start:dateNumber('2026-11-01'),end:dateNumber('2026-11-01')})
  for(const value of ['2026-02-30','2026-13-01','bad','',null])assert.equal(dateNumber(value),null)
  assert.equal(planRange(plan('a','2026-11-28','2026-11-27')),null)
  assert.equal(calendarWeeks('2028-02',[]).flatMap(w=>w.days).includes('2028-02-29'),true)
})
test('all eight fields and product estimates survive date range editing with daily times', () => {
  const input={...requestDefaults(null,'2026-11-27'),end_date:'2026-11-28',party_name:'ร้าน ก',start_time:'09:00',end_time:'17:00',venue:'สถานที่',topic:'หัวข้อ',expected_attendees:20,estimated_cost:1500,expense_items:[{description:'ค่าเดินทาง',amount:500}],equipment:'POS',expected_product_order_value:10000,estimated_store_stock_value:20000}
  assert.equal(validateRequest(input),'')
  const payload=requestPayload(input), restored=requestDefaults({planned_date:input.planned_date,request_details:payload})
  assert.deepEqual(restored,input)
  for(const end_date of ['2026-11-26','2026-02-30'])assert.notEqual(validateRequest({...input,end_date}),'')
  assert.notEqual(validateRequest({...input,end_time:'08:00'}),'')
})

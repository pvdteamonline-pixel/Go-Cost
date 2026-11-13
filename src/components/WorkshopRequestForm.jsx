import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import StoreSearchDropdown from './StoreSearchDropdown'
import ThaiDateInput from './ThaiDateInput'
import WorkshopProductEstimates from './WorkshopProductEstimates'
import { WORKSHOP_TYPES, expenseTotal, formatMoney, requestDefaults, requestPayload, validateRequest } from '../lib/workshopRequest'
import './WorkshopRequest.css'

export default function WorkshopRequestForm({ initialDate = '', plan = null, onCreated, onCancel, onDirtyChange, onBusyChange, embedded = false }) {
  const { currentUser } = useAuth()
  const [values, setValues] = useState(() => requestDefaults(plan, initialDate))
  const initialValues = useRef(JSON.stringify(requestDefaults(plan, initialDate)))
  const [selectedStore, setSelectedStore] = useState(() => plan?.store_id ? { id: plan.store_id, name: plan.store_name, province: plan.province, region: plan.region, assigned_sales_name: plan.assigned_sales_name } : null)
  const [manualName, setManualName] = useState(() => !!plan && !plan.store_id)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formKey, setFormKey] = useState(0)
  const requestId = useRef(crypto.randomUUID())
  const busy = useRef(false)
  const formRef = useRef(null)
  const canUse = hasPagePermission(currentUser, plan ? 'workshop-plan-edit' : 'workshop-plan-create')
    && (!plan || currentUser?.role === 'ADMIN' || plan.created_by === currentUser?.id)
  const update = (key, value) => setValues(previous => ({ ...previous, [key]: value }))
  useEffect(() => { if (embedded) formRef.current?.scrollIntoView({ block: 'nearest' }) }, [embedded])
  useEffect(() => { onDirtyChange?.(JSON.stringify(values) !== initialValues.current) }, [values, onDirtyChange])
  useEffect(() => { onBusyChange?.(submitting) }, [submitting, onBusyChange])
  function reset() {
    setValues(requestDefaults(plan, initialDate)); setSelectedStore(null); setManualName(false)
    setError(''); setFormKey(key => key + 1); requestId.current = crypto.randomUUID()
  }
  async function handleSave(e) {
    e.preventDefault()
    if (busy.current || !canUse) return
    setError('')
    if (!manualName && !selectedStore) return setError('กรุณาค้นหาเลือกร้านค้า หรือเลือกกรอกชื่อเอง')
    if (!values.end_date) return setError('กรุณาระบุวันที่สิ้นสุด')
    const validation = validateRequest(values)
    if (validation) return setError(validation)
    busy.current = true
    setSubmitting(true)
    try {
      const { data, error: err } = await supabase.rpc('save_workshop_request_v2', {
        p_plan_id: plan?.id || null, p_store_id: manualName ? null : selectedStore.id,
        p_planned_date: values.planned_date, p_details: requestPayload(values),
        p_actor_id: currentUser.id, p_request_id: requestId.current,
      })
      if (err) throw new Error(err.code === 'PGRST202' ? 'ยังไม่ได้ติดตั้งส่วนฐานข้อมูลสำหรับแบบฟอร์มใหม่ กรุณาติดต่อผู้ดูแลระบบ' : err.message)
      if (!data?.success) throw new Error(data?.message || 'ไม่ได้รับผลยืนยันการบันทึกคำขอ')
      const savedDate = values.planned_date
      if (!plan) reset()
      onCreated?.({ ...data, plannedDate: savedDate })
    } catch (err) { setError('บันทึกคำขอไม่สำเร็จ: ' + err.message) }
    finally { busy.current = false; setSubmitting(false) }
  }
  if (!canUse) return <p className="text-ink-600 text-sm">คุณไม่มีสิทธิ์{plan ? 'แก้ไข' : 'สร้าง'}คำขอนี้</p>
  return <form ref={formRef} onSubmit={handleSave} className="workshop-request glass wr-form" noValidate>
    {embedded && <h2>{plan ? 'แก้ไขคำขอ ' + plan.id : 'สร้างคำขอ Workshop ใหม่'}</h2>}
    <fieldset disabled={submitting} key={formKey}>
      <legend className="sr-only">ข้อมูลคำขอจัดงาน</legend>
      <div className="wr-type-label">ประเภทงาน</div>
      <div className="wr-types" role="group" aria-label="ประเภทงาน">{WORKSHOP_TYPES.map(type => <button key={type} type="button" aria-pressed={values.event_type === type} onClick={() => update('event_type', type)}>{type}{values.event_type === type && <span aria-hidden="true"> ✓</span>}</button>)}</div>
      <div className="wr-grid">
        <div><div className="wr-label">1. ชื่อร้าน / ชื่อลูกค้า / ชื่อสถาบัน *</div>
          <div className="wr-name-mode"><button type="button" aria-pressed={!manualName} onClick={() => { setManualName(false); update('party_name', selectedStore?.name || '') }}>ค้นหารายชื่อเดิม</button><button type="button" aria-pressed={manualName} onClick={() => { setManualName(true); update('party_name', selectedStore?.name || values.party_name) }}>กรอกชื่อเอง</button></div>
          {manualName ? <input aria-label="ชื่อร้าน / ลูกค้า / สถาบัน" className="glass-input" maxLength={300} value={values.party_name} onChange={e => update('party_name', e.target.value)} placeholder="ระบุชื่อร้าน ลูกค้า หรือสถาบัน" /> : <StoreSearchDropdown selectedStore={selectedStore} onSelect={store => { setSelectedStore(store); update('party_name', store?.name || '') }} />}
        </div>
        <div><ThaiDateInput label="2. วันที่เริ่มจัดงาน" value={values.planned_date} required onChange={date => setValues(previous => ({ ...previous, planned_date: date, end_date: !previous.end_date || previous.end_date === previous.planned_date ? date : previous.end_date }))} />
          <ThaiDateInput label="วันที่สิ้นสุด" value={values.end_date} required onChange={date => update('end_date', date)} />
          <div className="wr-times"><label>เวลาเริ่ม *<input className="glass-input" type="time" value={values.start_time} onChange={e => update('start_time', e.target.value)} /></label><span>–</span><label>เวลาสิ้นสุด *<input className="glass-input" type="time" value={values.end_time} onChange={e => update('end_time', e.target.value)} /></label></div>
          <p className="wr-hint">ใช้ช่วงเวลาเดียวกันทุกวัน ตั้งแต่วันเริ่มต้นถึงวันสิ้นสุด</p>
        </div>
        <label>3. สถานที่จัด *<input className="glass-input" maxLength={1000} value={values.venue} onChange={e => update('venue', e.target.value)} placeholder="สถานที่ / ที่อยู่จัดงาน" /></label>
        <label>4. หัวข้ออบรม *<input className="glass-input" maxLength={1000} value={values.topic} onChange={e => update('topic', e.target.value)} placeholder="ระบุหัวข้ออบรม" /></label>
        <label>5. จำนวนคนที่คาดหวังภายในงาน (คน) *<input className="glass-input" type="number" min="1" max="1000000" step="1" value={values.expected_attendees} onChange={e => update('expected_attendees', e.target.value)} /></label>
        <label>6. ค่าใช้จ่ายที่คาดการณ์ (บาท) *<input className="glass-input" type="number" min="0" max="999999999.99" step="0.01" value={values.estimated_cost} onChange={e => update('estimated_cost', e.target.value)} /></label>
        <div className="wr-full wr-expenses"><h3>7. รายละเอียดค่าใช้จ่ายที่ต้องการเบิก</h3>
          <div className="wr-expense-heading"><span>รายการ</span><span>จำนวนเงิน (บาท)</span><span /></div>
          {values.expense_items.map((item, i) => <div className="wr-expense-row" key={i}>
            <input className="glass-input" aria-label={'รายการค่าเบิก ' + (i + 1)} maxLength={500} value={item.description} onChange={e => update('expense_items', values.expense_items.map((row, index) => index === i ? { ...row, description: e.target.value } : row))} placeholder="เช่น ค่าอาหารและเครื่องดื่ม" />
            <input className="glass-input" aria-label={'จำนวนเงินรายการ ' + (i + 1)} type="number" min="0.01" max="999999999.99" step="0.01" value={item.amount} onChange={e => update('expense_items', values.expense_items.map((row, index) => index === i ? { ...row, amount: e.target.value } : row))} />
            <button className="btn-ghost" type="button" aria-label={'ลบรายการค่าเบิก ' + (i + 1)} onClick={() => update('expense_items', values.expense_items.filter((_, index) => index !== i))}>×</button>
          </div>)}
          <div className="wr-expense-footer"><button className="btn-ghost" type="button" disabled={values.expense_items.length >= 100} onClick={() => update('expense_items', [...values.expense_items, { description: '', amount: '' }])}>+ เพิ่มรายการ</button><p>รวมขอเบิก <strong>{formatMoney(expenseTotal(values.expense_items))} บาท</strong></p></div>
          <p className="wr-hint">ระบุรายการที่ต้องการเบิกจากงบในข้อ 6 หากไม่ขอเบิกให้เว้นรายการว่าง</p>
        </div>
        <WorkshopProductEstimates values={values} onChange={update} />
        <label className="wr-full">8. อุปกรณ์ที่ต้องการสนับสนุน<textarea className="glass-input" rows={3} maxLength={2000} value={values.equipment} onChange={e => update('equipment', e.target.value)} placeholder="เช่น ระบบคิดเงิน POS 2 ชุด หรือเว้นว่างหากไม่ขอสนับสนุน" /></label>
      </div>
      {error && <p role="alert" className="wr-error">{error}</p>}
      <div className="wr-actions"><button type="button" className="btn-ghost" onClick={() => onCancel ? onCancel() : reset()}>ยกเลิก</button><button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'กำลังบันทึก...' : plan ? 'บันทึกการแก้ไข' : 'ส่งคำขออนุมัติ'}</button></div>
    </fieldset>
  </form>
}

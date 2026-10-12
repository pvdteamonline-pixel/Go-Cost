import { useState, useMemo, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { expenseSummary, baht, lineSatang } from '../lib/expenseSummary'
import { uploadExpenseAttachment } from '../lib/expenseAttachments'
import { MAIN_CATEGORIES, DETAILS } from '../lib/constants'

import './ExpenseEntryPage.css'

function Field({ id, label, className = '', children }) {
  return <div className={`ee-field ${className}`}><label htmlFor={id}>{label}</label>{children}</div>
}

function emptyItem() {
  return { mainCategory: '', detail: '', qty: '', unit: '', unitPrice: '', remark: '', accountId: '' }
}

export default function ExpenseEntryPage({onNavigate}) {
  const { currentUser } = useAuth()
  const [openIndex, setOpenIndex] = useState(0)
  const [basicOpen, setBasicOpen] = useState(true)
  const errorRef = useRef(null)
  const [storeName, setStoreName] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [attendees, setAttendees] = useState('')
  const [workDays, setWorkDays] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [accountOptions, setAccountOptions] = useState([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.rpc('list_accounts_for_selection', { p_actor_id: currentUser?.id ?? null }).then(({ data, error: err }) => {
      if (err) setError('โหลดรหัสบัญชีไม่สำเร็จ: ' + err.message)
      else setAccountOptions(data ?? [])
    })
  }, [currentUser])

  const totals = useMemo(() => expenseSummary(items), [items])
  const [file, setFile] = useState(null)
  const [attachmentPath, setAttachmentPath] = useState(null)
  const [formKey, setFormKey] = useState(0)
  const [requestId, setRequestId] = useState(() => crypto.randomUUID())

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }

  function addItem() {
    setOpenIndex(items.length)
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItem(index) {
    if (items.length === 1) return
    setOpenIndex(current => current == null ? null : current === index ? Math.max(0, index - 1) : current > index ? current - 1 : current)
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  // ตรวจสอบฝั่ง client ก่อนยิง — เป็นแค่ UX feedback เร็วๆ
  // การตรวจสอบจริงที่ "บังคับใช้" คือฝั่ง RPC save_expense_record ใน Postgres เสมอ
  function validateClientSide() {
    if (!storeName.trim()) return 'กรุณากรอกชื่อร้านค้า / ชื่องาน'
    if (![attendees || '0', workDays || '0'].every(v => Number.isInteger(Number(v)) && Number(v) >= 0)) return 'จำนวนผู้เข้างานและวันทำงานต้องเป็นจำนวนเต็มไม่ติดลบ'
    if (!eventDate) return 'กรุณาเลือกวันที่จัดงาน'
    if (items.length === 0) return 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ'
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.mainCategory.trim()) return `รายการที่ ${i + 1}: กรุณาเลือกหมวดหมู่หลัก`
      if (!it.detail.trim()) return `รายการที่ ${i + 1}: กรุณาเลือกรายละเอียด`
      if (!it.accountId) return `รายการที่ ${i + 1}: กรุณาเลือกรหัสบัญชี`
      const qty = parseFloat(it.qty)
      const unitPrice = parseFloat(it.unitPrice)
      if (!Number.isFinite(qty) || qty <= 0 || !/^\d+(\.\d+)?$/.test(it.qty)) return `รายการที่ ${i + 1}: จำนวนต้องมากกว่า 0 และใช้รูปแบบตัวเลขปกติ`
      if (!Number.isFinite(unitPrice) || unitPrice < 0 || !/^\d+(\.\d+)?$/.test(it.unitPrice)) return `รายการที่ ${i + 1}: ราคาต่อหน่วยไม่ถูกต้อง`
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess(null)
    const clientError = validateClientSide()
    if (clientError) {
      setError(clientError)
      setBasicOpen(true)
      const invalidIndex = items.findIndex(it => !it.mainCategory.trim() || !it.detail.trim() || !it.accountId || !/^\d+(\.\d+)?$/.test(it.qty) || Number(it.qty) <= 0 || !/^\d+(\.\d+)?$/.test(it.unitPrice))
      if (invalidIndex >= 0) setOpenIndex(invalidIndex)
      requestAnimationFrame(() => errorRef.current?.focus())
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
    const path = attachmentPath || await uploadExpenseAttachment(file)
    if (path) setAttachmentPath(path)
    const { data, error: rpcError } = await supabase.rpc('save_expense_document_v2', {
      p_store_name: storeName,
      p_event_date: eventDate,
      p_attendees: attendees ? parseInt(attendees, 10) : 0,
      p_work_days: workDays ? parseInt(workDays, 10) : 0,
      p_internal_note: internalNote,
      p_created_by: currentUser?.id ?? null,
      p_items: items.map(it => ({...it, attachmentUrl: path})),
      p_request_id: requestId,
    })
    setSubmitting(false)
    if (rpcError) {
      setError('เกิดข้อผิดพลาด: ' + rpcError.message)
      return
    }
    if (!data?.success) {
      setError(data?.message || 'ไม่ได้รับผลยืนยันการบันทึก กรุณาลองอีกครั้ง')
      return
    }
    setSuccess(data)
    setStoreName('')
    setEventDate('')
    setAttendees('')
    setWorkDays('')
    setInternalNote('')
    setItems([emptyItem()])
    setOpenIndex(0)
    setBasicOpen(true)
    setFile(null); setAttachmentPath(null); setFormKey(k=>k+1); setRequestId(crypto.randomUUID())
    } catch (err) { setError('บันทึกไม่สำเร็จ: ' + err.message) } finally { setSubmitting(false) }
  }

  return (
    <div className="expense-entry">
      <header className="ee-heading">
        <h1>บันทึกค่าใช้จ่าย</h1>
        <p>เพิ่มรายการค่าใช้จ่ายสำหรับร้านค้า / งานหนึ่งครั้ง</p>
      </header>

      {success && (
        <div className="ee-success" role="status">
          <strong>{success.docNo}</strong>
          <span>{success.message} — บันทึก {success.rowsSaved} รายการ</span>
          <button type="button" onClick={() => onNavigate('expense-report')}>ดูรายงาน</button>
          <button type="button" onClick={() => onNavigate('expense-history')}>ดูประวัติ</button>
        </div>
      )}

      <form key={formKey} id="expense-entry-form" onSubmit={handleSubmit} noValidate>
        <fieldset disabled={submitting} className="ee-layout">
          <div className="ee-editor">
            <section className="ee-panel" aria-labelledby="ee-basic-title">
              <div className="ee-section-heading">
                <h2 id="ee-basic-title">ข้อมูลพื้นฐาน</h2>
                <button type="button" className="ee-text-button ee-basic-toggle" aria-expanded={basicOpen} aria-controls="ee-basic-fields" onClick={() => setBasicOpen(v => !v)}>{basicOpen ? 'ย่อข้อมูล' : 'แก้ไขข้อมูล'} <span aria-hidden="true">{basicOpen ? '⌃' : '⌄'}</span></button>
              </div>
              {!basicOpen && <p className="ee-basic-preview">{storeName || 'ยังไม่ได้ระบุร้านค้า / งาน'}{eventDate && ` · ${eventDate}`}<br />ผู้เข้างาน {attendees || '0'} คน · {workDays || '0'} วัน</p>}
              <div id="ee-basic-fields" className="ee-basic-grid" hidden={!basicOpen}>
                <Field id="ee-store" label="ชื่อร้านค้า / ชื่องาน *" className="ee-store"><input id="ee-store" aria-required="true" value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="ระบุชื่อร้านค้า / ชื่องาน" /></Field>
                <Field id="ee-date" label="วันที่จัดงาน *" className="ee-date"><input id="ee-date" type="date" aria-required="true" value={eventDate} onChange={e => setEventDate(e.target.value)} /></Field>
                <Field id="ee-attendees" label="จำนวนผู้เข้างาน"><input id="ee-attendees" type="number" inputMode="numeric" min="0" value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="0" /></Field>
                <Field id="ee-days" label="จำนวนวันทำงาน"><input id="ee-days" type="number" inputMode="numeric" min="0" value={workDays} onChange={e => setWorkDays(e.target.value)} placeholder="0" /></Field>
                <Field id="ee-note" label="หมายเหตุภายใน" className="ee-note"><input id="ee-note" value={internalNote} onChange={e => setInternalNote(e.target.value)} placeholder="ระบุหมายเหตุ (ถ้ามี)" /></Field>
              </div>
            </section>

            <section className="ee-panel" aria-labelledby="ee-items-title">
              <div className="ee-section-heading">
                <h2 id="ee-items-title">รายการค่าใช้จ่าย <span className="ee-count">{items.length}</span></h2>
                <button type="button" className="ee-add" onClick={addItem}>+ เพิ่มรายการ</button>
              </div>
              <div className="ee-items">
                {items.map((it, i) => (
                  <section className={`ee-item ${openIndex === i ? 'is-open' : ''}`} key={i}>
                    <button type="button" className="ee-item-toggle" aria-expanded={openIndex === i} aria-controls={`ee-item-${i}`} onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                      <span className="ee-item-number">{String(i + 1).padStart(2, '0')}</span>
                      <span className="ee-item-name">{it.detail || it.mainCategory || `รายการที่ ${i + 1}`}</span>
                      <span className="ee-item-amount">{baht(lineSatang(it.qty, it.unitPrice) / 100)} <small>บาท</small></span>
                      <span className="ee-chevron" aria-hidden="true">{openIndex === i ? '⌃' : '⌄'}</span>
                    </button>
                    <div id={`ee-item-${i}`} hidden={openIndex !== i}>
                      <div className="ee-item-fields">
                        <Field id={`ee-category-${i}`} label="หมวดหมู่หลัก *" className="ee-wide"><select id={`ee-category-${i}`} aria-required="true" value={it.mainCategory} onChange={e => updateItem(i, 'mainCategory', e.target.value)}><option value="">เลือกหมวดหมู่</option>{MAIN_CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c}</option>)}</select></Field>
                        <Field id={`ee-detail-${i}`} label="รายละเอียด *" className="ee-wide"><select id={`ee-detail-${i}`} aria-required="true" value={it.detail} onChange={e => updateItem(i, 'detail', e.target.value)}><option value="">เลือกรายละเอียด</option>{DETAILS.map(d => <option key={d} value={d}>{d}</option>)}</select></Field>
                        <Field id={`ee-account-${i}`} label="รหัสบัญชี *" className="ee-wide"><select id={`ee-account-${i}`} aria-required="true" value={it.accountId} onChange={e => updateItem(i, 'accountId', e.target.value)}><option value="">เลือกรหัสบัญชี</option>{accountOptions.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}</select></Field>
                        <Field id={`ee-qty-${i}`} label="จำนวน *"><input id={`ee-qty-${i}`} type="number" inputMode="decimal" step="any" aria-required="true" value={it.qty} onChange={e => updateItem(i, 'qty', e.target.value)} placeholder="0" /></Field>
                        <Field id={`ee-unit-${i}`} label="หน่วย"><input id={`ee-unit-${i}`} value={it.unit} onChange={e => updateItem(i, 'unit', e.target.value)} placeholder="เช่น ครั้ง / ชิ้น" /></Field>
                        <Field id={`ee-price-${i}`} label="ราคาต่อหน่วย *" className="ee-wide"><input id={`ee-price-${i}`} type="number" inputMode="decimal" step="any" min="0" aria-required="true" value={it.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} placeholder="0.00" /></Field>
                        <Field id={`ee-remark-${i}`} label="หมายเหตุรายการ" className="ee-full"><input id={`ee-remark-${i}`} value={it.remark} onChange={e => updateItem(i, 'remark', e.target.value)} placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)" /></Field>
                      </div>
                      <div className="ee-item-footer">
                        <button type="button" className="ee-remove" disabled={items.length === 1} aria-label={`ลบรายการที่ ${i + 1}`} onClick={() => removeItem(i)}>ลบรายการ</button>
                        <span>ยอดรายการ <strong>{baht(lineSatang(it.qty, it.unitPrice) / 100)} บาท</strong></span>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
              <div className="ee-attachment">
                <label htmlFor="ee-file">ไฟล์แนบ <span>(ไม่เกิน 10 MB · ใช้กับเอกสารนี้)</span></label>
                <input id="ee-file" type="file" aria-label="ไฟล์แนบค่าใช้จ่าย" onChange={e => { const f = e.target.files?.[0]; if (f?.size > 10 * 1024 * 1024) { setError('ไฟล์แนบต้องไม่เกิน 10 MB'); e.target.value = ''; setFile(null) } else { setFile(f ?? null); setError('') } setAttachmentPath(null) }} />
              </div>
            </section>
          </div>

          <aside className="ee-panel ee-summary" aria-labelledby="ee-summary-title">
            <h2 id="ee-summary-title">สรุปค่าใช้จ่าย</h2>
            <p className="ee-summary-count">{items.length} รายการ</p>
            <p className="ee-total-label">ยอดค่าใช้จ่ายรวม</p>
            <p className="ee-total">{baht(totals.expense)} <small>บาท</small></p>
            <dl className="ee-breakdown">{[['รายได้บริษัท', totals.income], ['ส่วนต่างสุทธิ', totals.net], ['ยอดขาย Workshop ของร้าน', totals.storeSales]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{baht(value)} <small>บาท</small></dd></div>)}</dl>
            <button type="submit" className="ee-save">{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
          </aside>
        </fieldset>
        {error && <p ref={errorRef} tabIndex={-1} role="alert" className="ee-error">{error}</p>}
        <div className="ee-mobile-save">
          <div><span>ค่าใช้จ่ายรวม</span><strong>{baht(totals.expense)} <small>บาท</small></strong></div>
          <button type="submit" disabled={submitting} className="ee-save">{submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
        </div>
      </form>
    </div>
  )
}


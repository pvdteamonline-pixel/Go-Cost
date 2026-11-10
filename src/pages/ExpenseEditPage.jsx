import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { expenseSummary, lineSatang } from '../lib/expenseSummary'
import { documentMoney, attachmentName } from '../lib/expenseDocument'
import { createExpenseEditDraft, validateExpenseEdit, expenseEditPayload } from '../lib/expenseEdit'
import { openAttachment } from '../lib/expenseAttachments'
import { MAIN_CATEGORIES, DETAILS } from '../lib/constants'
import { DocumentStatus } from '../components/ExpenseDocument'
import Icon from '../components/Icon'
import '../components/ExpenseDocument.css'
import './ExpenseEditPage.css'

function Field({ id, label, className = '', required = false, children }) {
  return <div className={`edit-field ${className}`}><label htmlFor={id}>{label}{required && <span className="edit-required"> *</span>}</label>{children}</div>
}
function ExistingOption({ value, options }) {
  return value && !options.includes(value) ? <option value={value}>{value} (ค่าเดิม)</option> : null
}

export default function ExpenseEditPage({ doc, onClose, onSubmitted }) {
  const { currentUser } = useAuth()
  const [draft, setDraft] = useState(() => createExpenseEditDraft(doc))
  const initial = useRef(JSON.stringify(draft))
  const nextId = useRef(draft.items.length)
  const [accounts, setAccounts] = useState([])
  const [accountError, setAccountError] = useState('')
  const [loadingAccounts, setLoadingAccounts] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const locked = useRef(false)
  const headingRef = useRef(null)
  const errorRef = useRef(null)
  const dirty = JSON.stringify(draft) !== initial.current
  const totals = useMemo(() => expenseSummary(draft.items), [draft.items])
  const loadAccounts = useCallback(async () => {
    setLoadingAccounts(true); setAccountError('')
    try {
      const { data, error: err } = await supabase.rpc('list_accounts_for_selection', { p_actor_id: currentUser.id })
      if (err) throw err
      setAccounts(data ?? [])
    } catch (err) { setAccountError('โหลดรหัสบัญชีไม่สำเร็จ: ' + err.message) }
    finally { setLoadingAccounts(false) }
  }, [currentUser.id])
  useEffect(() => { loadAccounts() }, [loadAccounts])
  useEffect(() => { window.scrollTo(0, 0); headingRef.current?.focus({ preventScroll: true }) }, [])
  useEffect(() => {
    if (!dirty) return
    const preventLoss = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', preventLoss)
    return () => window.removeEventListener('beforeunload', preventLoss)
  }, [dirty])
  useEffect(() => { if (error) errorRef.current?.focus() }, [error])

  function update(field, value) { setDraft(previous => ({ ...previous, [field]: value })) }
  function updateItem(index, field, value) {
    setDraft(previous => ({ ...previous, items: previous.items.map((item, i) => i === index ? { ...item, [field]: value } : item) }))
  }
  function addItem() {
    const clientId = `item-${nextId.current++}`
    setDraft(previous => ({ ...previous, items: [...previous.items, { clientId, mainCategory: '', detail: '', qty: '', unit: '', unitPrice: '', remark: '', accountId: '', allowUnmapped: false, attachmentUrl: null }] }))
    requestAnimationFrame(() => document.getElementById(`${clientId}-category`)?.focus())
  }
  function removeItem(index) {
    const item = draft.items[index]
    if (draft.items.length <= 1) return
    if ((item.mainCategory || item.detail || item.qty || item.attachmentUrl) && !confirm(`นำรายการที่ ${index + 1} ออกจากคำขอแก้ไขนี้?`)) return
    setDraft(previous => ({ ...previous, items: previous.items.filter((_, i) => i !== index) }))
  }
  function cancel() {
    if (locked.current) return
    if (dirty && !confirm('มีข้อมูลที่แก้ไขแต่ยังไม่ได้ส่งคำขอ ต้องการออกจากหน้านี้และทิ้งการแก้ไขหรือไม่?')) return
    onClose()
  }
  async function submit(event) {
    event.preventDefault()
    if (locked.current) return
    const invalid = validateExpenseEdit(draft)
    if (invalid) { setError(invalid); errorRef.current?.focus(); return }
    locked.current = true; setSubmitting(true); setError('')
    try {
      const { data, error: err } = await supabase.rpc('request_edit_record', {
        p_old_doc_number: doc.docNo, p_new_payload: expenseEditPayload(draft), p_requested_by: currentUser.id,
      })
      if (err) throw err
      if (!data?.success) throw new Error(data?.message || 'ส่งคำขอแก้ไขไม่สำเร็จ')
      onSubmitted(data.message || 'ส่งคำขอแก้ไขแล้ว รอผู้มีสิทธิ์อนุมัติ')
    } catch (err) { setError('เกิดข้อผิดพลาด: ' + err.message) }
    finally { locked.current = false; setSubmitting(false) }
  }

  return <div className="expense-edit-page">
    <header className="edit-page-heading"><div><p className="expense-breadcrumb">ประวัติรายการ / แก้ไขเอกสาร</p><h1 tabIndex={-1} ref={headingRef}>แก้ไขเอกสาร <span>{doc.docNo}</span></h1><p className="edit-subtitle">ตรวจสอบข้อมูลและส่งคำขอแก้ไข เอกสารเดิมจะเปลี่ยนหลังได้รับอนุมัติ</p></div>
      <button type="button" className="expense-button" disabled={submitting} onClick={cancel}>กลับประวัติรายการ</button></header>
    <form id="expense-edit-form" onSubmit={submit} noValidate>
      {error && <p className="expense-alert" role="alert" tabIndex={-1} ref={errorRef}>{error}</p>}
      <div className="edit-layout"><div className="edit-main">
        <section className="edit-section" aria-labelledby="edit-basic-title"><div className="edit-section-heading"><h2 id="edit-basic-title">ข้อมูลเอกสาร</h2><DocumentStatus doc={doc} /></div>
          <fieldset disabled={submitting} className="edit-basic-grid"><legend className="expense-sr-only">ข้อมูลทั่วไปของเอกสาร</legend>
            <Field id="edit-doc-number" label="เลขที่เอกสาร"><input id="edit-doc-number" value={doc.docNo} readOnly /></Field>
            <Field id="edit-store" label="ชื่อร้านค้า / ชื่องาน" required className="edit-span-2"><input id="edit-store" required value={draft.storeName} onChange={e => update('storeName', e.target.value)} /></Field>
            <Field id="edit-date" label="วันที่จัดงาน" required><input id="edit-date" type="date" required value={draft.eventDate} onChange={e => update('eventDate', e.target.value)} /></Field>
            <Field id="edit-attendees" label="จำนวนผู้เข้างาน (คน)"><input id="edit-attendees" type="number" min="0" step="1" value={draft.attendees} onChange={e => update('attendees', e.target.value)} /></Field>
            <Field id="edit-days" label="จำนวนวันทำงาน (วัน)"><input id="edit-days" type="number" min="0" step="1" value={draft.workDays} onChange={e => update('workDays', e.target.value)} /></Field>
            <Field id="edit-note" label="หมายเหตุเอกสาร" className="edit-full"><textarea id="edit-note" rows={2} value={draft.internalNote} onChange={e => update('internalNote', e.target.value)} /></Field>
          </fieldset>
        </section>
        <section className="edit-section" aria-labelledby="edit-items-title"><div className="edit-section-heading"><div><h2 id="edit-items-title">รายละเอียดรายการ</h2><p>{draft.items.length} รายการ · ช่องที่มี * จำเป็นต้องระบุ</p></div><button type="button" className="expense-button" disabled={submitting} onClick={addItem}><Icon name="plus" size={16} />เพิ่มรายการ</button></div>
          {accountError && <div className="edit-account-warning" role="status">{accountError}<button type="button" className="expense-text-button" onClick={loadAccounts} disabled={loadingAccounts}>ลองโหลดอีกครั้ง</button></div>}
          <div className="edit-items">{draft.items.map((item, index) => <fieldset key={item.clientId} disabled={submitting} className="edit-item" aria-label={`รายการที่ ${index + 1}`}>
            <legend>รายการที่ {index + 1}</legend>
            <div className="edit-item-heading"><span>{item.detail || 'รายการใหม่'}</span><button type="button" className="expense-text-button expense-negative" disabled={submitting || draft.items.length === 1} aria-label={`ลบรายการที่ ${index + 1}`} onClick={() => removeItem(index)}><Icon name="trash" size={15} />ลบรายการ</button></div>
            <div className="edit-item-grid">
              <Field id={`${item.clientId}-category`} label="หมวดหมู่หลัก" required className="edit-col-4"><select id={`${item.clientId}-category`} required value={item.mainCategory} onChange={e => updateItem(index, 'mainCategory', e.target.value)}><option value="">เลือกหมวดหมู่</option><ExistingOption value={item.mainCategory} options={MAIN_CATEGORIES} />{MAIN_CATEGORIES.filter(Boolean).map(value => <option key={value}>{value}</option>)}</select></Field>
              <Field id={`${item.clientId}-detail`} label="รายละเอียด" required className="edit-col-4"><select id={`${item.clientId}-detail`} required value={item.detail} onChange={e => updateItem(index, 'detail', e.target.value)}><option value="">เลือกรายละเอียด</option><ExistingOption value={item.detail} options={DETAILS} />{DETAILS.map(value => <option key={value}>{value}</option>)}</select></Field>
              <Field id={`${item.clientId}-account`} label="รหัสบัญชี" required={!item.allowUnmapped} className="edit-col-4"><select id={`${item.clientId}-account`} aria-describedby={item.allowUnmapped ? `${item.clientId}-account-hint` : undefined} value={item.accountId} onChange={e => updateItem(index, 'accountId', e.target.value)}><option value="">{loadingAccounts ? 'กำลังโหลดรหัสบัญชี…' : item.allowUnmapped ? 'ยังไม่ระบุ (ตามเอกสารเดิม)' : 'เลือกรหัสบัญชี'}</option>{item.accountId && !accounts.some(account => String(account.id) === item.accountId) && <option value={item.accountId}>รหัสบัญชีเดิม: {item.accountId}</option>}{accounts.map(account => <option key={account.id} value={String(account.id)}>{account.code} — {account.name}</option>)}</select>{item.allowUnmapped && <small id={`${item.clientId}-account-hint`}>รายการเดิมไม่มีรหัสบัญชี สามารถเก็บค่าเดิมได้</small>}</Field>
              <Field id={`${item.clientId}-qty`} label="จำนวน" required className="edit-col-3"><input id={`${item.clientId}-qty`} type="number" min="0" step="any" required value={item.qty} onChange={e => updateItem(index, 'qty', e.target.value)} /></Field>
              <Field id={`${item.clientId}-unit`} label="หน่วย" className="edit-col-3"><input id={`${item.clientId}-unit`} value={item.unit} onChange={e => updateItem(index, 'unit', e.target.value)} /></Field>
              <Field id={`${item.clientId}-price`} label="ราคาต่อหน่วย (บาท)" required className="edit-col-3"><input id={`${item.clientId}-price`} type="number" min="0" step="any" required value={item.unitPrice} onChange={e => updateItem(index, 'unitPrice', e.target.value)} /></Field>
              <Field id={`${item.clientId}-total`} label="รวมรายการ (บาท)" className="edit-col-3"><output id={`${item.clientId}-total`} htmlFor={`${item.clientId}-qty ${item.clientId}-price`}>{documentMoney(lineSatang(item.qty, item.unitPrice) / 100)}</output></Field>
              <Field id={`${item.clientId}-remark`} label="หมายเหตุรายการ" className="edit-full"><textarea id={`${item.clientId}-remark`} rows={2} value={item.remark} onChange={e => updateItem(index, 'remark', e.target.value)} /></Field>
            </div>
            {item.attachmentUrl && <div className="edit-attachment"><span>ไฟล์แนบเดิม</span><button type="button" className="expense-text-button" onClick={() => openAttachment(item.attachmentUrl).catch(err => setError(err.message))}><Icon name="file" size={16} />{attachmentName(item.attachmentUrl)}</button><small>ไฟล์แนบนี้จะคงอยู่ในคำขอแก้ไข</small></div>}
          </fieldset>)}</div>
        </section>
      </div><aside className="edit-summary" aria-labelledby="edit-summary-title"><h2 id="edit-summary-title">สรุปคำขอแก้ไข</h2><p>{draft.items.length} รายการ · หน่วย: บาท</p>
        <dl><div><dt>ค่าใช้จ่าย</dt><dd>{documentMoney(totals.expense)}</dd></div><div><dt>รายได้บริษัท</dt><dd>{documentMoney(totals.income)}</dd></div><div className="edit-net"><dt>ส่วนต่างสุทธิ</dt><dd className={totals.net < 0 ? 'expense-negative' : totals.net > 0 ? 'expense-positive' : ''}>{totals.net > 0 ? '+' : ''}{documentMoney(totals.net)}</dd></div><div className="edit-store-sales"><dt>ยอดขาย Workshop ของร้าน<small>ไม่รวมในรายได้บริษัท</small></dt><dd>{documentMoney(totals.storeSales)}</dd></div></dl>
        {!!totals.returns && <p className="edit-summary-note">รายได้บริษัทรวมยอดของคืน {documentMoney(totals.returns)} บาท ตามเครื่องหมายที่บันทึก</p>}
        <p className="edit-summary-note"><Icon name="info" size={16} />คำขอนี้ต้องรอผู้มีสิทธิ์อนุมัติ จึงจะเปลี่ยนข้อมูลเอกสาร</p>
        <button type="submit" className="expense-button expense-button-primary" disabled={submitting} aria-busy={submitting}>{submitting ? 'กำลังส่งคำขอ…' : 'ส่งคำขอแก้ไข'}</button>
        <button type="button" className="expense-text-button" disabled={submitting} onClick={cancel}>ยกเลิกการแก้ไข</button>
      </aside></div>
    </form>
  </div>
}

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import WorkshopRequestDetails from './WorkshopRequestDetails'
import Icon from './Icon'
import { WORKSHOP_STATUS, approvalGroup } from '../lib/workshopRequest'
import { documentDate } from '../lib/expenseDocument'
import { openAttachment } from '../lib/expenseAttachments'
import './ExpenseDocument.css'

export default function WorkshopApprovalDialog({ plan, busy, error, onClose, onDecision }) {
  const dialog = useRef(null), titleId = useId(), noteId = useId()
  const [rejecting, setRejecting] = useState(false), [note, setNote] = useState(''), [fileError, setFileError] = useState('')
  useEffect(() => {
    const previous = document.activeElement, element = dialog.current, overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element.showModal()
    element.querySelector('[aria-label="ปิดรายละเอียดคำขอ"]')?.focus()
    return () => { document.body.style.overflow = overflow; element.close(); if (previous?.isConnected) previous.focus() }
  }, [])
  const pending = plan.status === 'pending_approval'
  return createPortal(<dialog ref={dialog} className="expense-dialog workshop-approval-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onClose() }}>
    <header className="expense-dialog-header"><div><h2 id={titleId}>รายละเอียดคำขอ <span>{plan.id}</span></h2><div className="expense-document-meta"><span>{plan.store_name || plan.request_details?.party_name || 'ไม่ระบุร้าน'}</span><span>วันที่ {documentDate(plan.planned_date)}</span><span className={`whc-status ${plan.status === 'rejected' ? 'rejected' : approvalGroup(plan.status)}`}>{WORKSHOP_STATUS[plan.status] || 'ไม่ทราบสถานะ'}</span></div></div><button className="expense-close" aria-label="ปิดรายละเอียดคำขอ" disabled={busy} onClick={onClose}><Icon name="close" size={22}/></button></header>
    <div className="expense-dialog-body">
      <dl className="wac-request-meta"><div><dt>จังหวัด / ภูมิภาค</dt><dd>{plan.province || '—'} / {plan.region || '—'}</dd></div><div><dt>เซลล์ที่สังกัด</dt><dd>{plan.assigned_sales_name || 'ยังไม่ได้กำหนด'}</dd></div><div><dt>ผู้ขอ</dt><dd>{plan.created_by || '—'}</dd></div><div><dt>วันที่สร้างคำขอ</dt><dd>{plan.created_at ? new Date(plan.created_at).toLocaleString('th-TH') : '—'}</dd></div></dl>
      <WorkshopRequestDetails plan={plan}/>
      {plan.attachment_path && <button className="expense-button wac-attachment" onClick={() => openAttachment(plan.attachment_path).catch(err => setFileError(err.message))}><Icon name="file" size={16}/>เปิดไฟล์แนบ</button>}
      {plan.admin_note && <p className="wac-admin-note"><strong>หมายเหตุผู้อนุมัติ</strong><span>{plan.admin_note}</span></p>}
      {rejecting && pending && <div className="wac-reject-form"><label htmlFor={noteId}>เหตุผลการปฏิเสธ (ไม่บังคับ)</label><textarea id={noteId} value={note} disabled={busy} onChange={event => setNote(event.target.value)} rows={3}/></div>}
      {(error || fileError) && <p role="alert" className="expense-alert">{error || fileError}</p>}
    </div>
    <footer className="expense-dialog-footer"><p>{pending ? 'ตรวจสอบรายละเอียดก่อนอนุมัติหรือปฏิเสธคำขอ' : approvalGroup(plan.status) === 'approved' || plan.status === 'rejected' ? 'รายการนี้ผ่านการพิจารณาแล้ว' : 'รายละเอียดคำขอ'}</p><div>
      {pending ? rejecting ? <><button className="expense-button" disabled={busy} onClick={() => setRejecting(false)}>ยกเลิกการปฏิเสธ</button><button className="expense-button expense-button-danger" disabled={busy} onClick={() => onDecision(plan.id, 'reject', note)}>{busy ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}</button></> : <><button className="expense-button expense-button-danger" disabled={busy} onClick={() => setRejecting(true)}>ปฏิเสธ</button><button className="expense-button wac-approve" disabled={busy} onClick={() => onDecision(plan.id, 'approve')}>{busy ? 'กำลังดำเนินการ...' : 'อนุมัติคำขอ'}</button></> : <button className="expense-button" onClick={onClose}>ปิด</button>}
    </div></footer>
  </dialog>, document.body)
}

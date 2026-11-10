import { useState, useEffect, useRef, useMemo, useId } from 'react'
import { createPortal } from 'react-dom'
import WorkshopRequestDetails from './WorkshopRequestDetails'
import { openAttachment } from '../lib/expenseAttachments'
import { expenseDocument, attachmentName } from '../lib/expenseDocument'
import { DocumentMetadata, DocumentSummary, DocumentItems } from './ExpenseDocument'
import ExpensePdfButton from './ExpensePdfButton'
import Icon from './Icon'
import './ExpenseDocument.css'

export default function ExpenseInsight({ doc, onClose, onEdit, onRequestDelete }) {
  const [error, setError] = useState('')
  const dialog = useRef(null)
  const closeRef = useRef(onClose)
  const titleId = useId()
  const model = useMemo(() => expenseDocument(doc), [doc])
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement
    const element = dialog.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    element?.showModal()
    element?.querySelector('[aria-label="ปิด Insight"]')?.focus()
    return () => {
      document.body.style.overflow = previousOverflow
      element?.close()
      if (previous?.isConnected) previous.focus()
    }
  }, [])
  return createPortal(<dialog ref={dialog} className="expense-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); event.stopPropagation(); closeRef.current() }} onClick={event => {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRef.current()
  }}>
    <header className="expense-dialog-header">
      <div><h2 id={titleId}><span>Insight</span><span className="expense-heading-divider" aria-hidden="true">|</span><span>{model.docNo}</span></h2><p>{model.storeName || '—'}</p></div>
      <div className="expense-header-actions">{model.type !== 'Workshop' && <ExpensePdfButton doc={doc} onError={setError} />}<button className="expense-close" aria-label="ปิด Insight" onClick={onClose}><Icon name="close" size={22} /></button></div>
    </header>
    <div className="expense-dialog-body">
      {error && <p role="alert" className="expense-alert">{error}</p>}
      <DocumentMetadata doc={model} />
      {model.type === 'Workshop' && <WorkshopRequestDetails plan={doc} />}
      <DocumentSummary doc={model} />
      <DocumentItems doc={model} />
      {!!model.files.length && <section className="expense-attachments" aria-label="ไฟล์แนบ"><h3>ไฟล์แนบ ({model.files.length})</h3>{model.files.map((file, index) => <button key={file} className="expense-text-button" onClick={() => openAttachment(file).catch(err => setError(err.message))}><Icon name="file" size={16} /><span>{attachmentName(file, index)}</span></button>)}</section>}
    </div>
    <footer className="expense-dialog-footer"><p><Icon name="info" size={16} />การแก้ไข/ลบต้องรออนุมัติ</p><div>{onEdit && <button className="expense-button" onClick={() => onEdit(doc)}><Icon name="edit" size={16} />ขอแก้ไข</button>}{onRequestDelete && <button className="expense-button expense-button-danger" onClick={() => onRequestDelete(doc.docNo)}><Icon name="trash" size={16} />ขอลบ</button>}</div></footer>
  </dialog>, document.body)
}

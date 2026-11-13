import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import ExpenseInsight from '../components/ExpenseInsight'
import ExpenseEditPage from './ExpenseEditPage'
import ExpensePdfButton from '../components/ExpensePdfButton'
import { DocumentStatus } from '../components/ExpenseDocument'
import Icon from '../components/Icon'
import { groupExpenseDocuments, expenseSummary, DOCUMENT_STATUS } from '../lib/expenseSummary'
import ThaiMonthSelect from '../components/ThaiMonthSelect'
import DocumentGroupHeader from '../components/DocumentGroupHeader'
import DocumentNavigation from '../components/DocumentNavigation'
import { groupDocuments } from '../lib/documentGroups'
import { hasPagePermission } from '../lib/permissions'
import { expenseDocument, documentMoney } from '../lib/expenseDocument'
import '../components/ExpenseDocument.css'

export default function ExpenseHistoryPage({ onNavigate }) {
  const { currentUser } = useAuth()
  const [requests, setRequests] = useState([])
  const [month, setMonth] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [expandedDoc, setExpandedDoc] = useState(null)
  const [editingDoc, setEditingDoc] = useState(null)
  const [notice, setNotice] = useState('')
  const [openMenu, setOpenMenu] = useState(null)
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [closedGroups, setClosedGroups] = useState({})
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase.rpc('get_operational_report', { p_actor_id: currentUser.id })
      if (err) throw err
      setRows(data?.expenses ?? [])
      setRequests(data?.requests ?? [])
    } catch (err) {
      setError('เกิดข้อผิดพลาด: ' + err.message)
      setRows([])
      setRequests([])
    } finally { setLoading(false) }
  }, [currentUser.id])
  useEffect(() => { load() }, [load])
  useEffect(() => {
    if (!openMenu) return
    const close = event => { if (event.key === 'Escape' || (event.type === 'pointerdown' && !event.target.closest('.expense-row-menu'))) setOpenMenu(null) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', close) }
  }, [openMenu])
  const documents = useMemo(() => {
    const query = search.trim().toLowerCase()
    return groupExpenseDocuments(rows, requests).map(expenseDocument)
      .filter(doc => (!month || doc.eventDate?.startsWith(month)) && (!status || doc.status === status) && (!query || String(doc.docNo ?? '').toLowerCase().includes(query) || String(doc.storeName ?? '').toLowerCase().includes(query)))
      .sort((a, b) => String(b.eventDate ?? '').localeCompare(String(a.eventDate ?? '')) || String(b.docNo).localeCompare(String(a.docNo), undefined, { numeric: true }))
  }, [rows, requests, month, search, status])
  const selected = documents.find(doc => doc.docNo === expandedDoc)
  const totals = useMemo(() => expenseSummary(documents.flatMap(doc => doc.items)), [documents])
  const pages = Math.max(1, Math.ceil(documents.length / 25))
  const currentPage = Math.min(page, pages)
  const orderedDocuments = useMemo(() => groupDocuments(documents).flatMap(group => group.documents), [documents])
  const visibleGroups = groupDocuments(orderedDocuments.slice((currentPage - 1) * 25, currentPage * 25))
  const summaryMoney = value => loading || error ? '—' : documentMoney(value)

  function edit(doc) { setExpandedDoc(null); setOpenMenu(null); setEditingDoc(doc) }
  async function requestDelete(docNo) {
    setOpenMenu(null)
    if (!confirm(`ยืนยันส่งคำขอลบเอกสาร ${docNo}? (ต้องรอผู้มีสิทธิ์อนุมัติ)`)) return
    try {
      const { data, error: err } = await supabase.rpc('request_delete_record', { p_doc_number: docNo, p_requested_by: currentUser.id })
      if (err) throw err
      if (!data?.success) throw new Error(data?.message || 'ส่งคำขอไม่สำเร็จ')
      setExpandedDoc(null)
      setNotice(data.message)
      await load()
    } catch (err) { setError('เกิดข้อผิดพลาด: ' + err.message); setExpandedDoc(null) }
  }
  if (editingDoc) return <ExpenseEditPage key={editingDoc.docNo} doc={editingDoc} onClose={() => setEditingDoc(null)} onSubmitted={message => { setNotice(message); setEditingDoc(null); load() }} />
  return <div className="expense-history document-workspace">
    <div className="expense-page-heading"><h1>เอกสารและรายงาน</h1><div className="history-heading-actions">{hasPagePermission(currentUser, 'expense-entry') && <button className="expense-button expense-button-primary expense-create" onClick={() => onNavigate('expense-entry')}><Icon name="plus" size={17} />สร้างเอกสาร</button>}</div></div>
    <section className="history-summary" aria-label="สรุปเอกสารตามตัวกรอง" aria-busy={loading}>
      <div><Icon name="file" size={27} /><strong className="summary-count">{loading || error ? '—' : documents.length} เอกสาร</strong></div>
      <div><span>ค่าใช้จ่าย</span><strong>{summaryMoney(totals.expense)}</strong></div>
      <div><span>รายได้บริษัท</span><strong>{summaryMoney(totals.income)}</strong></div>
      <div><span>ส่วนต่างสุทธิ</span><strong className={totals.net > 0 ? 'expense-positive' : totals.net < 0 ? 'expense-negative' : ''}>{!loading && !error && totals.net > 0 ? '+' : ''}{summaryMoney(totals.net)}</strong></div>
    </section>
    <DocumentNavigation active="expense-history" onNavigate={onNavigate} />
    {notice && <p role="status" className="expense-notice">{notice}</p>}
    {error && <p role="alert" className="expense-alert">{error}</p>}
    <section className="expense-history-panel" aria-label="รายการเอกสาร" aria-busy={loading}>
      <div className="expense-toolbar">
        <label className="expense-search"><Icon name="search" size={18} /><input aria-label="ค้นหาเลขที่เอกสาร / ชื่อร้าน" placeholder="ค้นหาเลขที่เอกสาร / ชื่อร้าน" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} /></label>
        <ThaiMonthSelect className="expense-month" label="เดือนประวัติรายการ" value={month} dates={rows.map(row => row.event_date)} onChange={value => { setMonth(value); setPage(1) }} />
        <select aria-label="สถานะประวัติรายการ" className="expense-status-filter" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="">ทุกสถานะ</option>{['saved', 'pending_edit', 'pending_delete'].map(key => <option key={key} value={key}>{DOCUMENT_STATUS[key]}</option>)}</select>
        <button className="expense-button expense-refresh" aria-label="รีเฟรชประวัติรายการ" title="รีเฟรช" disabled={loading} onClick={load}><Icon name="refresh" size={18} /></button>
      </div>
      <div className="expense-table-caption"><span>{loading ? 'กำลังโหลด…' : `${documents.length} เอกสาร`}</span><span>หน่วย: บาท</span></div>
      {!loading && !!documents.length && <div className="expense-table-scroll"><table className="expense-history-table">
        <thead><tr><th scope="col">เลขที่เอกสาร / ร้านค้า</th><th scope="col">วันที่</th><th scope="col">สถานะ</th><th scope="col" className="expense-number">ค่าใช้จ่าย</th><th scope="col" className="expense-number">รายได้บริษัท</th><th scope="col"><span className="expense-sr-only">การดำเนินการ</span></th></tr></thead>
        {visibleGroups.map(group => <tbody key={group.key}>
          <DocumentGroupHeader label={group.label} count={group.documents.length} colSpan={6} open={!closedGroups[group.key]} onToggle={() => setClosedGroups(previous => ({ ...previous, [group.key]: !previous[group.key] }))} />
          {!closedGroups[group.key] && group.documents.map(doc => <tr key={doc.docNo} className={`document-data-row ${expandedDoc === doc.docNo ? 'is-selected' : ''}`}>
          <td><div className="expense-document-cell"><button className="expense-text-button expense-row-open" aria-label={`เปิดเอกสาร ${doc.docNo}`} onClick={() => setExpandedDoc(doc.docNo)}><Icon name="chevronRight" size={18} /></button><div><button className="expense-document-link" onClick={() => setExpandedDoc(doc.docNo)}>{doc.docNo}</button><small>{doc.storeName || '—'}</small></div></div></td><td>{doc.dateLabel}</td><td><DocumentStatus doc={doc} /></td>
          <td className="expense-number">{documentMoney(doc.expense)}</td><td className="expense-number">{documentMoney(doc.income)}</td>
          <td><div className="expense-row-actions"><button className="expense-text-button" aria-label={`Insight ${doc.docNo}`} onClick={() => setExpandedDoc(doc.docNo)}><Icon name="eye" size={17} />Insight</button><ExpensePdfButton doc={doc} compact onError={setError} />
            <div className="expense-row-menu"><button className="expense-text-button" aria-label={`ตัวเลือก ${doc.docNo}`} aria-expanded={openMenu === doc.docNo} onClick={() => setOpenMenu(openMenu === doc.docNo ? null : doc.docNo)}><Icon name="more" size={18} /></button>{openMenu === doc.docNo && <div className="expense-menu-options"><button onClick={() => edit(doc)}>ขอแก้ไข</button><button className="expense-negative" onClick={() => requestDelete(doc.docNo)}>ขอลบ</button></div>}</div>
          </div></td>
        </tr>)}</tbody>)}
      </table></div>}
      {!loading && !documents.length && <p className="expense-empty">{error ? 'ไม่สามารถโหลดรายการได้ กรุณารีเฟรชอีกครั้ง' : search || month || status ? 'ไม่พบเอกสารตามตัวกรอง' : 'ยังไม่มีรายการค่าใช้จ่าย'}</p>}
      {!loading && documents.length > 0 && <div className="history-pagination"><span>แสดง {(currentPage - 1) * 25 + 1}–{Math.min(currentPage * 25, documents.length)} จาก {documents.length} รายการ · หน่วย: บาท</span><div><button className="expense-button previous-page" aria-label="หน้าก่อนหน้า" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><Icon name="chevronRight" size={17} /></button><span className="history-page-number" aria-current="page">{currentPage}</span><button className="expense-button" aria-label="หน้าถัดไป" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}><Icon name="chevronRight" size={17} /></button></div></div>}
    </section>
    <p className="expense-history-footnote"><Icon name="info" size={15} />การแก้ไข/ลบต้องส่งคำขอและรอผู้มีสิทธิ์อนุมัติ</p>
    {selected && <ExpenseInsight doc={selected} onClose={() => setExpandedDoc(null)} onEdit={edit} onRequestDelete={requestDelete} />}
  </div>
}

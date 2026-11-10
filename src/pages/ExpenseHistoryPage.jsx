import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import ExpenseInsight from '../components/ExpenseInsight'
import ExpenseEditPage from './ExpenseEditPage'
import ExpensePdfButton from '../components/ExpensePdfButton'
import { DocumentStatus } from '../components/ExpenseDocument'
import Icon from '../components/Icon'
import { groupExpenseDocuments } from '../lib/expenseSummary'
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
      .filter(doc => (!month || doc.eventDate?.startsWith(month)) && (!query || String(doc.docNo ?? '').toLowerCase().includes(query) || String(doc.storeName ?? '').toLowerCase().includes(query)))
      .sort((a, b) => String(b.eventDate ?? '').localeCompare(String(a.eventDate ?? '')) || String(b.docNo).localeCompare(String(a.docNo), undefined, { numeric: true }))
  }, [rows, requests, month, search])
  const selected = documents.find(doc => doc.docNo === expandedDoc)

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
  return <div className="expense-history">
    <div className="expense-page-heading"><div><p className="expense-breadcrumb">ค่าใช้จ่าย / ประวัติรายการ</p><h1>ประวัติรายการ</h1></div><button className="expense-button expense-button-primary" onClick={() => onNavigate('expense-entry')}><Icon name="plus" size={17} />สร้างเอกสาร</button></div>
    <div className="expense-toolbar">
      <label className="expense-search"><Icon name="search" size={18} /><input aria-label="ค้นหาเลขที่เอกสาร / ชื่อร้าน" placeholder="ค้นหาเลขที่เอกสาร / ชื่อร้าน" value={search} onChange={event => setSearch(event.target.value)} /></label>
      <input className="expense-month" type="month" aria-label="เดือนประวัติรายการ" value={month} onChange={event => setMonth(event.target.value)} />
      <button className="expense-button" onClick={() => setMonth('')} aria-pressed={!month}>ทุกเดือน</button>
      <button className="expense-button expense-refresh" aria-label="รีเฟรชประวัติรายการ" title="รีเฟรช" disabled={loading} onClick={load}><Icon name="refresh" size={18} /></button>
      <button className="expense-button expense-report-link" onClick={() => onNavigate('expense-report')}><Icon name="calendar" size={17} />รายงาน / ปฏิทิน</button>
    </div>
    {notice && <p role="status" className="expense-notice">{notice}</p>}
    {error && <p role="alert" className="expense-alert">{error}</p>}
    <section className="expense-history-panel" aria-label="รายการเอกสาร" aria-busy={loading}>
      <div className="expense-table-caption"><span>{loading ? 'กำลังโหลด…' : `${documents.length} เอกสาร`}</span><span>หน่วย: บาท</span></div>
      {!loading && !!documents.length && <div className="expense-table-scroll"><table className="expense-history-table">
        <thead><tr><th scope="col">เลขที่เอกสาร / ร้านค้า</th><th scope="col">วันที่</th><th scope="col">สถานะ</th><th scope="col" className="expense-number">ค่าใช้จ่าย</th><th scope="col" className="expense-number">รายได้บริษัท</th><th scope="col"><span className="expense-sr-only">การดำเนินการ</span></th></tr></thead>
        <tbody>{documents.map(doc => <tr key={doc.docNo} className={expandedDoc === doc.docNo ? 'is-selected' : ''}>
          <td><button className="expense-document-link" onClick={() => setExpandedDoc(doc.docNo)}>{doc.docNo}</button><small>{doc.storeName || '—'}</small></td><td>{doc.dateLabel}</td><td><DocumentStatus doc={doc} /></td>
          <td className="expense-number">{documentMoney(doc.expense)}</td><td className="expense-number">{documentMoney(doc.income)}</td>
          <td><div className="expense-row-actions"><button className="expense-text-button" aria-label={`Insight ${doc.docNo}`} onClick={() => setExpandedDoc(doc.docNo)}><Icon name="eye" size={17} />Insight</button><ExpensePdfButton doc={doc} compact onError={setError} />
            <div className="expense-row-menu"><button className="expense-text-button" aria-label={`ตัวเลือก ${doc.docNo}`} aria-expanded={openMenu === doc.docNo} onClick={() => setOpenMenu(openMenu === doc.docNo ? null : doc.docNo)}><Icon name="more" size={18} /></button>{openMenu === doc.docNo && <div className="expense-menu-options"><button onClick={() => edit(doc)}>ขอแก้ไข</button><button className="expense-negative" onClick={() => requestDelete(doc.docNo)}>ขอลบ</button></div>}</div>
          </div></td>
        </tr>)}</tbody>
      </table></div>}
      {!loading && !documents.length && <p className="expense-empty">{error ? 'ไม่สามารถโหลดรายการได้ กรุณารีเฟรชอีกครั้ง' : search || month ? 'ไม่พบเอกสารตามตัวกรอง' : 'ยังไม่มีรายการค่าใช้จ่าย'}</p>}
    </section>
    <p className="expense-history-footnote"><Icon name="info" size={15} />การแก้ไข/ลบต้องส่งคำขอและรอผู้มีสิทธิ์อนุมัติ</p>
    {selected && <ExpenseInsight doc={selected} onClose={() => setExpandedDoc(null)} onEdit={edit} onRequestDelete={requestDelete} />}
  </div>
}

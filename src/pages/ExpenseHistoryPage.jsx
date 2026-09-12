import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import ExpenseInsight from '../components/ExpenseInsight'
import { groupExpenseDocuments, DOCUMENT_STATUS } from '../lib/expenseSummary'
import ExpenseEditModal from '../components/ExpenseEditModal'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatThaiDate(isoDate) {
  if (!isoDate) return ''
  const d = new Date(isoDate)
  if (isNaN(d.getTime())) return isoDate
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear() + 543
  return `${day}/${month}/${year}`
}

export default function ExpenseHistoryPage({onNavigate}) {
  const { currentUser } = useAuth()
  const [requests,setRequests]=useState([])
  const [month,setMonth]=useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [expandedDoc, setExpandedDoc] = useState(null)
  const [editingDoc, setEditingDoc] = useState(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_operational_report', {p_actor_id:currentUser.id})
    setLoading(false)
    if (err) {
      setError('เกิดข้อผิดพลาด: ' + err.message)
      return
    }
    setRows(data?.expenses ?? []); setRequests(data?.requests ?? [])
  }, [currentUser.id])

  useEffect(() => { load() }, [load])

  const documents = useMemo(() => {
    let list = groupExpenseDocuments(rows,requests).filter(d=>!month||d.eventDate?.startsWith(month))
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((d) => d.docNo.toLowerCase().includes(q) || d.storeName.toLowerCase().includes(q))
    }
    return list
  }, [rows, search, requests, month])

  async function handleRequestDelete(docNo) {
    if (!confirm(`ยืนยันส่งคำขอลบเอกสาร ${docNo}? (ต้องรอผู้มีสิทธิ์อนุมัติ)`)) return
    const { data, error: err } = await supabase.rpc('request_delete_record', {
      p_doc_number: docNo,
      p_requested_by: currentUser?.id ?? null,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message);load()
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">ประวัติรายการ</h1>
          <p className="text-ink-600 text-sm mt-1">การแก้ไข/ลบต้องส่งคำขอและรอผู้มีสิทธิ์อนุมัติ</p>
        </div>
        <input
          className="glass-input text-sm w-64"
          placeholder="ค้นหาเลขที่เอกสาร / ชื่อร้าน..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-3"><input aria-label="เดือนประวัติรายการ" type="month" value={month} onChange={e=>setMonth(e.target.value)} className="glass-input"/><button className="btn-ghost" onClick={()=>setMonth('')}>ทุกเดือน</button><button className="btn-ghost" onClick={load}>รีเฟรช</button><button className="btn-ghost" onClick={()=>onNavigate('expense-report')}>รายงาน / ปฏิทิน</button><button className="btn-primary" onClick={()=>onNavigate('expense-entry')}>+ สร้างเอกสาร</button></div>
      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      {!loading && documents.length === 0 && (
        <div className="glass p-10 text-center text-ink-500 text-sm">ยังไม่มีรายการค่าใช้จ่าย</div>
      )}

      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.docNo} className="glass glass-card-hover p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="doc-badge">{doc.docNo}</span>
                <div>
                  <p className="text-ink-900 text-sm">{doc.storeName}</p>
                  <p className="text-ink-500 text-xs">{formatThaiDate(doc.eventDate)} · {doc.items.length} รายการ · {DOCUMENT_STATUS[doc.status]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gold-dark font-display italic text-lg">ค่าใช้จ่าย {formatBaht(doc.expense)} · รายได้ {formatBaht(doc.income)}</span>
                <button onClick={() => setExpandedDoc(expandedDoc === doc.docNo ? null : doc.docNo)} className="btn-ghost text-xs px-3 py-1.5">
                  Insight
                </button>
                <button onClick={() => setEditingDoc(doc)} className="btn-ghost text-xs px-3 py-1.5">ขอแก้ไข</button>
                <button onClick={() => handleRequestDelete(doc.docNo)} className="text-rose text-xs hover:underline">ขอลบ</button>
              </div>
            </div>


          </div>
        ))}
      </div>

      {expandedDoc && documents.find(d=>d.docNo===expandedDoc)&&<ExpenseInsight doc={documents.find(d=>d.docNo===expandedDoc)} onClose={()=>setExpandedDoc(null)}/>}
      {editingDoc && (
        <ExpenseEditModal
          doc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSubmitted={(message) => { setNotice(message); setEditingDoc(null); load() }}
        />
      )}
    </div>
  )
}

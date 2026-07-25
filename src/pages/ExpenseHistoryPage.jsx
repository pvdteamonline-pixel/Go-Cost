import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
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

export default function ExpenseHistoryPage() {
  const { currentUser } = useAuth()
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
    const { data, error: err } = await supabase.rpc('get_expense_history')
    setLoading(false)
    if (err) {
      setError('เกิดข้อผิดพลาด: ' + err.message)
      return
    }
    setRows(data ?? [])
  }, [])

  useEffect(() => { load() }, [load])

  const documents = useMemo(() => {
    const byDoc = new Map()
    for (const r of rows) {
      if (!byDoc.has(r.doc_number)) {
        byDoc.set(r.doc_number, {
          docNo: r.doc_number,
          storeName: r.store_name,
          eventDate: r.event_date,
          attendees: r.attendees,
          workDays: r.work_days,
          internalNote: r.internal_note,
          items: [],
          total: 0,
        })
      }
      const doc = byDoc.get(r.doc_number)
      doc.items.push({
        mainCategory: r.main_category, detail: r.detail, qty: r.qty,
        unit: r.unit, unitPrice: r.unit_price, remark: r.remark, total: r.total, accountId: r.account_id,
      })
      doc.total += Number(r.total) || 0
    }
    let list = Array.from(byDoc.values())
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((d) => d.docNo.toLowerCase().includes(q) || d.storeName.toLowerCase().includes(q))
    }
    return list
  }, [rows, search])

  async function handleRequestDelete(docNo) {
    if (!confirm(`ยืนยันส่งคำขอลบเอกสาร ${docNo}? (ต้องรอผู้มีสิทธิ์อนุมัติ)`)) return
    const { data, error: err } = await supabase.rpc('request_delete_record', {
      p_doc_number: docNo,
      p_requested_by: currentUser?.id ?? null,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
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
                  <p className="text-ink-500 text-xs">{formatThaiDate(doc.eventDate)} · {doc.items.length} รายการ</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gold-dark font-display italic text-lg">{formatBaht(doc.total)}</span>
                <button onClick={() => setExpandedDoc(expandedDoc === doc.docNo ? null : doc.docNo)} className="btn-ghost text-xs px-3 py-1.5">
                  {expandedDoc === doc.docNo ? 'ย่อ' : 'ดูรายการ'}
                </button>
                <button onClick={() => setEditingDoc(doc)} className="btn-ghost text-xs px-3 py-1.5">ขอแก้ไข</button>
                <button onClick={() => handleRequestDelete(doc.docNo)} className="text-rose text-xs hover:underline">ขอลบ</button>
              </div>
            </div>

            {expandedDoc === doc.docNo && (
              <div className="mt-4 pt-4 border-t border-black/10 space-y-2">
                {doc.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm text-ink-700">
                    <span>{it.mainCategory} — {it.detail} {it.remark && `(${it.remark})`}</span>
                    <span>{it.qty} {it.unit} × {formatBaht(it.unitPrice)} = {formatBaht(it.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {editingDoc && (
        <ExpenseEditModal
          doc={editingDoc}
          onClose={() => setEditingDoc(null)}
          onSubmitted={(message) => { setNotice(message); setEditingDoc(null) }}
        />
      )}
    </div>
  )
}

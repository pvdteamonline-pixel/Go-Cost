import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { MAIN_CATEGORIES, DETAILS } from '../lib/constants'

export default function ExpenseEditModal({ doc, onClose, onSubmitted }) {
  const { currentUser } = useAuth()
  const [storeName, setStoreName] = useState(doc.storeName)
  const [eventDate, setEventDate] = useState(doc.eventDate)
  const [attendees, setAttendees] = useState(String(doc.attendees ?? ''))
  const [workDays, setWorkDays] = useState(String(doc.workDays ?? ''))
  const [internalNote, setInternalNote] = useState(doc.internalNote ?? '')
  const [items, setItems] = useState(doc.items.map((it) => ({
    mainCategory: it.mainCategory, detail: it.detail,
    qty: String(it.qty), unit: it.unit ?? '', unitPrice: String(it.unitPrice), remark: it.remark ?? '',
    accountId: it.accountId ? String(it.accountId) : '',
  })))
  const [accountOptions, setAccountOptions] = useState([])
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    supabase.rpc('list_accounts_for_selection', { p_actor_id: currentUser?.id ?? null }).then(({ data, error: err }) => {
      if (!err) setAccountOptions(data ?? [])
    })
  }, [currentUser])

  const grandTotal = useMemo(() => items.reduce((sum, it) => {
    const q = parseFloat(it.qty) || 0
    const p = parseFloat(it.unitPrice) || 0
    return sum + q * p
  }, 0), [items])

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }
  function addItem() {
    setItems((prev) => [...prev, { mainCategory: '', detail: '', qty: '', unit: '', unitPrice: '', remark: '', accountId: '' }])
  }
  function removeItem(index) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!storeName.trim()) return setError('กรุณากรอกชื่อร้านค้า / ชื่องาน')
    if (!eventDate) return setError('กรุณาเลือกวันที่จัดงาน')
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.mainCategory.trim()) return setError(`รายการที่ ${i + 1}: กรุณาเลือกหมวดหมู่หลัก`)
      if (!it.detail.trim()) return setError(`รายการที่ ${i + 1}: กรุณาเลือกรายละเอียด`)
      if (!it.accountId) return setError(`รายการที่ ${i + 1}: กรุณาเลือกรหัสบัญชี`)
      const qty = parseFloat(it.qty)
      const unitPrice = parseFloat(it.unitPrice)
      if (isNaN(qty) || qty <= 0) return setError(`รายการที่ ${i + 1}: จำนวนต้องมากกว่า 0`)
      if (isNaN(unitPrice) || unitPrice < 0) return setError(`รายการที่ ${i + 1}: ราคาต่อหน่วยไม่ถูกต้อง`)
    }

    setSubmitting(true)
    const newPayload = {
      storeName, eventDate, attendees: attendees ? parseInt(attendees, 10) : 0,
      workDays: workDays ? parseInt(workDays, 10) : 0, internalNote, items,
    }
    const { data, error: rpcError } = await supabase.rpc('request_edit_record', {
      p_old_doc_number: doc.docNo,
      p_new_payload: newPayload,
      p_requested_by: currentUser?.id ?? null,
    })
    setSubmitting(false)
    if (rpcError) return setError('เกิดข้อผิดพลาด: ' + rpcError.message)
    if (!data.success) return setError(data.message)
    onSubmitted(data.message)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="glass-solid max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display italic text-xl text-ink-900">ขอแก้ไขเอกสาร <span className="doc-badge ml-2">{doc.docNo}</span></h2>
          <button onClick={onClose} className="text-ink-600 hover:text-ink-900">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-ink-600 mb-1">ชื่อร้านค้า / ชื่องาน *</label>
              <input className="glass-input w-full" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-ink-600 mb-1">วันที่จัดงาน *</label>
              <input type="date" className="glass-input w-full" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-ink-600 mb-1">จำนวนผู้เข้างาน</label>
              <input type="number" min="0" className="glass-input w-full" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-ink-600 mb-1">จำนวนวันทำงาน</label>
              <input type="number" min="0" className="glass-input w-full" value={workDays} onChange={(e) => setWorkDays(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs text-ink-600 mb-1">หมายเหตุภายใน</label>
              <input className="glass-input w-full" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-ink-900 text-sm font-medium">รายการค่าใช้จ่าย</h3>
              <button type="button" onClick={addItem} className="btn-ghost text-xs px-3 py-1.5">+ เพิ่มรายการ</button>
            </div>
            {items.map((it, i) => (
              <div key={i} className="bg-ink-100 border border-black/10 rounded-xl p-3 grid grid-cols-1 sm:grid-cols-6 gap-2">
                <select className="glass-input text-sm sm:col-span-2" value={it.mainCategory} onChange={(e) => updateItem(i, 'mainCategory', e.target.value)}>
                  <option value="">— หมวดหมู่ —</option>
                  {MAIN_CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select className="glass-input text-sm sm:col-span-2" value={it.detail} onChange={(e) => updateItem(i, 'detail', e.target.value)}>
                  <option value="">— รายละเอียด —</option>
                  {DETAILS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <select className="glass-input text-sm sm:col-span-2" value={it.accountId} onChange={(e) => updateItem(i, 'accountId', e.target.value)}>
                  <option value="">— รหัสบัญชี —</option>
                  {accountOptions.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
                <input type="number" step="any" placeholder="จำนวน" className="glass-input text-sm" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
                <input type="number" step="any" placeholder="ราคา/หน่วย" className="glass-input text-sm" value={it.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} />
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-rose text-xs text-left sm:col-span-6">ลบรายการนี้</button>
                )}
              </div>
            ))}
            <p className="text-right text-gold-dark text-sm">รวม: {grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</p>
          </div>

          {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost text-sm">ยกเลิก</button>
            <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
              {submitting ? 'กำลังส่งคำขอ...' : 'ส่งคำขอแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

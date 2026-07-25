import { useState, useMemo, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { MAIN_CATEGORIES, DETAILS } from '../lib/constants'

function emptyItem() {
  return { mainCategory: '', detail: '', qty: '', unit: '', unitPrice: '', remark: '', accountId: '' }
}

export default function ExpenseEntryPage() {
  const { currentUser } = useAuth()
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
      if (!err) setAccountOptions(data ?? [])
    })
  }, [currentUser])

  const grandTotal = useMemo(() => {
    return items.reduce((sum, it) => {
      const q = parseFloat(it.qty) || 0
      const p = parseFloat(it.unitPrice) || 0
      return sum + q * p
    }, 0)
  }, [items])

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }

  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }

  function removeItem(index) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  // ตรวจสอบฝั่ง client ก่อนยิง — เป็นแค่ UX feedback เร็วๆ
  // การตรวจสอบจริงที่ "บังคับใช้" คือฝั่ง RPC save_expense_record ใน Postgres เสมอ
  function validateClientSide() {
    if (!storeName.trim()) return 'กรุณากรอกชื่อร้านค้า / ชื่องาน'
    if (!eventDate) return 'กรุณาเลือกวันที่จัดงาน'
    if (items.length === 0) return 'กรุณาเพิ่มรายการอย่างน้อย 1 รายการ'
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.mainCategory.trim()) return `รายการที่ ${i + 1}: กรุณาเลือกหมวดหมู่หลัก`
      if (!it.detail.trim()) return `รายการที่ ${i + 1}: กรุณาเลือกรายละเอียด`
      if (!it.accountId) return `รายการที่ ${i + 1}: กรุณาเลือกรหัสบัญชี`
      const qty = parseFloat(it.qty)
      const unitPrice = parseFloat(it.unitPrice)
      if (isNaN(qty) || qty <= 0) return `รายการที่ ${i + 1}: จำนวนต้องมากกว่า 0`
      if (isNaN(unitPrice) || unitPrice < 0) return `รายการที่ ${i + 1}: ราคาต่อหน่วยไม่ถูกต้อง`
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
      return
    }
    setSubmitting(true)
    const { data, error: rpcError } = await supabase.rpc('save_expense_record', {
      p_store_name: storeName,
      p_event_date: eventDate,
      p_attendees: attendees ? parseInt(attendees, 10) : 0,
      p_work_days: workDays ? parseInt(workDays, 10) : 0,
      p_internal_note: internalNote,
      p_created_by: currentUser?.id ?? null,
      p_items: items,
    })
    setSubmitting(false)
    if (rpcError) {
      setError('เกิดข้อผิดพลาด: ' + rpcError.message)
      return
    }
    if (!data.success) {
      setError(data.message)
      return
    }
    setSuccess(data)
    setStoreName('')
    setEventDate('')
    setAttendees('')
    setWorkDays('')
    setInternalNote('')
    setItems([emptyItem()])
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">บันทึกค่าใช้จ่าย</h1>
        <p className="text-ink-600 text-sm mt-1">เพิ่มรายการค่าใช้จ่ายสำหรับร้านค้า/งานหนึ่งครั้ง (ออกเลขที่เอกสารอัตโนมัติ)</p>
      </div>

      {success && (
        <div className="glass p-4 flex items-center gap-3 border-sage/30">
          <span className="doc-badge">{success.docNo}</span>
          <p className="text-sage text-sm">{success.message} — บันทึก {success.rowsSaved} รายการ</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="glass p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs text-ink-600 mb-1.5">ชื่อร้านค้า / ชื่องาน *</label>
            <input className="glass-input w-full" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">วันที่จัดงาน *</label>
            <input type="date" className="glass-input w-full" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">จำนวนผู้เข้างาน</label>
            <input type="number" min="0" className="glass-input w-full" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">จำนวนวันทำงาน</label>
            <input type="number" min="0" className="glass-input w-full" value={workDays} onChange={(e) => setWorkDays(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-ink-600 mb-1.5">หมายเหตุภายใน</label>
            <input className="glass-input w-full" value={internalNote} onChange={(e) => setInternalNote(e.target.value)} />
          </div>
        </div>

        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-ink-900 font-medium">รายการค่าใช้จ่าย</h2>
            <button type="button" onClick={addItem} className="btn-ghost text-sm">+ เพิ่มรายการ</button>
          </div>

          {items.map((it, i) => (
            <div key={i} className="glass-solid p-4 grid grid-cols-1 sm:grid-cols-6 gap-3 relative">
              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-600 mb-1">หมวดหมู่หลัก *</label>
                <select className="glass-input w-full" value={it.mainCategory} onChange={(e) => updateItem(i, 'mainCategory', e.target.value)}>
                  <option value="">— เลือก —</option>
                  {MAIN_CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-600 mb-1">รายละเอียด *</label>
                <select className="glass-input w-full" value={it.detail} onChange={(e) => updateItem(i, 'detail', e.target.value)}>
                  <option value="">— เลือก —</option>
                  {DETAILS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-600 mb-1">รหัสบัญชี *</label>
                <select className="glass-input w-full" value={it.accountId} onChange={(e) => updateItem(i, 'accountId', e.target.value)}>
                  <option value="">— เลือก —</option>
                  {accountOptions.map((a) => <option key={a.id} value={a.id}>{a.code} — {a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-ink-600 mb-1">จำนวน *</label>
                <input type="number" step="any" className="glass-input w-full" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-ink-600 mb-1">หน่วย</label>
                <input className="glass-input w-full" value={it.unit} onChange={(e) => updateItem(i, 'unit', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs text-ink-600 mb-1">ราคาต่อหน่วย *</label>
                <input type="number" step="any" min="0" className="glass-input w-full" value={it.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} />
              </div>
              <div className="sm:col-span-3">
                <label className="block text-xs text-ink-600 mb-1">หมายเหตุรายการ</label>
                <input className="glass-input w-full" value={it.remark} onChange={(e) => updateItem(i, 'remark', e.target.value)} />
              </div>
              <div className="sm:col-span-1 flex items-end justify-between">
                <span className="text-gold-dark text-sm">
                  = {((parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0)).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(i)} className="text-rose text-xs hover:underline">ลบ</button>
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-2 border-t border-black/10">
            <p className="text-ink-900">
              รวมทั้งสิ้น: <span className="font-display italic text-gold-dark text-xl ml-2">
                {grandTotal.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
              </span>
            </p>
          </div>
        </div>

        {error && (
          <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
            {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
          </button>
        </div>
      </form>
    </div>
  )
}

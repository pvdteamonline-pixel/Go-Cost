import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { MAIN_CATEGORIES, DETAILS } from '../lib/constants'

function emptyItem() {
  return { mainCategory: '', detail: '', qty: '', unit: '', unitPrice: '', remark: '' }
}

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function WorkshopAccountingPage() {
  const { currentUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [activePlan, setActivePlan] = useState(null)
  const [items, setItems] = useState([emptyItem()])
  const [submitting, setSubmitting] = useState(false)
  const [attachmentUrl, setAttachmentUrl] = useState(null)

  const canUse = hasPagePermission(currentUser, 'workshop-accounting')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_workshop_plans', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setPlans((data ?? []).filter((p) => p.status === 'pending_accounting'))
  }, [currentUser])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  async function openPlan(p) {
    setActivePlan(p)
    setItems([emptyItem()])
    setError('')
    setAttachmentUrl(null)
    if (p.attachment_path) {
      const { data } = await supabase.storage.from('workshop-attachments').createSignedUrl(p.attachment_path, 3600)
      if (data?.signedUrl) setAttachmentUrl(data.signedUrl)
    }
  }

  function updateItem(index, field, value) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)))
  }
  function addItem() {
    setItems((prev) => [...prev, emptyItem()])
  }
  function removeItem(index) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)))
  }

  const itemsTotal = items.reduce((sum, it) => sum + (parseFloat(it.qty) || 0) * (parseFloat(it.unitPrice) || 0), 0)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      if (!it.mainCategory.trim()) return setError(`รายการที่ ${i + 1}: กรุณาเลือกหมวดหมู่หลัก`)
      if (!it.detail.trim()) return setError(`รายการที่ ${i + 1}: กรุณาเลือกรายละเอียด`)
      const qty = parseFloat(it.qty)
      const unitPrice = parseFloat(it.unitPrice)
      if (isNaN(qty) || qty <= 0) return setError(`รายการที่ ${i + 1}: จำนวนต้องมากกว่า 0`)
      if (isNaN(unitPrice) || unitPrice < 0) return setError(`รายการที่ ${i + 1}: ราคาต่อหน่วยไม่ถูกต้อง`)
    }

    setSubmitting(true)
    const { data, error: err } = await supabase.rpc('complete_workshop_accounting', {
      p_plan_id: activePlan.id,
      p_items: items,
      p_actor_id: currentUser?.id ?? null,
    })
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(`${data.message} (เอกสารเลขที่ ${data.docNo})`)
    setActivePlan(null)
    load()
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">บัญชี Workshop รอลงข้อมูล</h1>
        <p className="text-ink-600 text-sm mt-1">ลงรายการค่าใช้จ่ายจริงของงาน — ระบบเติมยอดขายดันเข้าร้านค้าให้อัตโนมัติ</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && !activePlan && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      <div className="space-y-3">
        {!loading && plans.length === 0 && (
          <div className="glass p-8 text-center text-ink-400 text-sm">ไม่มีรายการรอลงบัญชี</div>
        )}
        {plans.map((p) => (
          <div key={p.id} className="glass glass-card-hover p-4 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <span className="doc-badge">{p.id}</span>
              <p className="text-ink-900 text-sm mt-1">{p.store_name} — {p.province}</p>
              <p className="text-ink-500 text-xs">
                จำนวนคนเข้างาน: {p.attendees} · ยอดขายดันเข้าร้านค้า: {formatBaht(p.sales_push_amount)} · ยอดขาย Workshop: {formatBaht(p.workshop_sales_amount)}
              </p>
            </div>
            <button onClick={() => openPlan(p)} className="btn-primary text-xs px-4 py-2">ลงข้อมูลบัญชี</button>
          </div>
        ))}
      </div>

      {activePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setActivePlan(null)}>
          <div className="glass-solid max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-xl text-ink-900">ลงบัญชี <span className="doc-badge ml-2">{activePlan.id}</span></h2>
              <button onClick={() => setActivePlan(null)} className="text-ink-400 hover:text-ink-900">✕</button>
            </div>

            <div className="bg-ocean-pale border border-ocean/20 rounded-lg p-3 text-sm mb-4">
              <p className="text-ink-900">ร้านค้า: {activePlan.store_name} — จำนวนคนเข้างาน: {activePlan.attendees}</p>
              <p className="text-ink-700 mt-1">
                รายได้ที่จะเติมให้อัตโนมัติ: <b>ยอดขายดันเข้าร้านค้า {formatBaht(activePlan.sales_push_amount)}</b> (หมวด "รายได้")
              </p>
              <p className="text-ink-500 text-xs mt-1">ยอดขาย Workshop {formatBaht(activePlan.workshop_sales_amount)} — ไม่นับเป็นรายได้บริษัท แสดงแยกในแดชบอร์ดเท่านั้น</p>
              {attachmentUrl && (
                <a href={attachmentUrl} target="_blank" rel="noreferrer" className="text-ocean text-xs underline mt-2 inline-block">ดู/ดาวน์โหลดไฟล์แนบจากเซลล์</a>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-ink-900 text-sm font-medium">รายการค่าใช้จ่ายจริง</h3>
                <button type="button" onClick={addItem} className="btn-ghost text-xs px-3 py-1.5">+ เพิ่มรายการ</button>
              </div>
              {items.map((it, i) => (
                <div key={i} className="bg-white/60 border border-black/[0.06] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-6 gap-2">
                  <select className="glass-input text-sm sm:col-span-2" value={it.mainCategory} onChange={(e) => updateItem(i, 'mainCategory', e.target.value)}>
                    <option value="">— หมวดหมู่ —</option>
                    {MAIN_CATEGORIES.filter(Boolean).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select className="glass-input text-sm sm:col-span-2" value={it.detail} onChange={(e) => updateItem(i, 'detail', e.target.value)}>
                    <option value="">— รายละเอียด —</option>
                    {DETAILS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <input type="number" step="any" placeholder="จำนวน" className="glass-input text-sm" value={it.qty} onChange={(e) => updateItem(i, 'qty', e.target.value)} />
                  <input type="number" step="any" placeholder="ราคา/หน่วย" className="glass-input text-sm" value={it.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', e.target.value)} />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-rose text-xs text-left sm:col-span-6">ลบรายการนี้</button>
                  )}
                </div>
              ))}
              <p className="text-right text-gold-dark text-sm">รวมรายจ่าย: {formatBaht(itemsTotal)}</p>

              {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setActivePlan(null)} className="btn-ghost text-sm">ยกเลิก</button>
                <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกและจบกระบวนการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import StoreSearchDropdown from './StoreSearchDropdown'
import ThaiDateInput from './ThaiDateInput'

export default function WorkshopRequestForm({ initialDate = '', onCreated, onCancel, embedded = false }) {
  const { currentUser } = useAuth()
  const [selectedStore, setSelectedStore] = useState(null)
  const [plannedDate, setPlannedDate] = useState(initialDate)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formKey, setFormKey] = useState(0)
  const busy = useRef(false)
  const formRef = useRef(null)
  const canCreate = hasPagePermission(currentUser, 'workshop-plan-create')

  useEffect(() => {
    if (embedded) {
      formRef.current?.scrollIntoView({ block: 'nearest' })
      formRef.current?.querySelector('input')?.focus({ preventScroll: true })
    }
  }, [embedded])

  async function handleCreate(e) {
    e.preventDefault()
    if (busy.current || !canCreate) return
    setError('')
    if (!selectedStore) return setError('กรุณาเลือกร้านค้า')
    if (!plannedDate) return setError('กรุณาเลือกวันที่วางแผนจัดงาน')
    busy.current = true
    setSubmitting(true)
    try {
      const { data, error: err } = await supabase.rpc('create_workshop_plan', {
        p_store_id: selectedStore.id,
        p_planned_date: plannedDate,
        p_created_by: currentUser?.id ?? null,
      })
      if (err) throw new Error(err.message)
      if (!data?.success) throw new Error(data?.message || 'ไม่ได้รับผลยืนยันการบันทึกคำขอ')
      onCreated?.({ ...data, plannedDate })
      setSelectedStore(null)
      setPlannedDate('')
      setFormKey(key => key + 1)
    } catch (err) {
      setError('บันทึกคำขอไม่สำเร็จ: ' + err.message)
    } finally {
      busy.current = false
      setSubmitting(false)
    }
  }

  if (!canCreate) return <p className="text-ink-600 text-sm">คุณไม่มีสิทธิ์สร้างคำขอ Workshop — ติดต่อผู้ดูแลระบบ</p>

  return <form ref={formRef} onSubmit={handleCreate} className="workshop-request glass p-5 sm:p-6 space-y-4" noValidate>
    {embedded && <div><h2 className="text-lg font-semibold">สร้างคำขอ Workshop ใหม่</h2><p className="text-sm text-ink-500 mt-1">เลือกร้านค้าและตรวจสอบวันที่ก่อนส่งอนุมัติ</p></div>}
    <fieldset disabled={submitting} className="min-w-0 space-y-4" key={formKey}>
      <div><p className="block text-xs text-ink-600 mb-1">ร้านค้า *</p><StoreSearchDropdown selectedStore={selectedStore} onSelect={setSelectedStore} /></div>
      <ThaiDateInput value={plannedDate} onChange={setPlannedDate} required />
      {error && <p role="alert" className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex justify-end gap-2 flex-wrap">
        <button type="button" className="btn-ghost text-sm" onClick={() => { setSelectedStore(null); setPlannedDate(initialDate); setError(''); setFormKey(key => key + 1); onCancel?.() }}>ยกเลิก</button>
        <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">{submitting ? 'กำลังส่ง...' : 'บันทึกคำขอ'}</button>
      </div>
    </fieldset>
  </form>
}

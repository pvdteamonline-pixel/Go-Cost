import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import StoreSearchDropdown from '../components/StoreSearchDropdown'

export default function WorkshopCreatePage() {
  const { currentUser } = useAuth()
  const [selectedStore, setSelectedStore] = useState(null)
  const [plannedDate, setPlannedDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const canCreate = hasPagePermission(currentUser, 'workshop-plan-create')

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!selectedStore) return setError('กรุณาเลือกร้านค้า')
    if (!plannedDate) return setError('กรุณาเลือกวันที่วางแผนจัดงาน')

    setSubmitting(true)
    const { data, error: err } = await supabase.rpc('create_workshop_plan', {
      p_store_id: selectedStore.id,
      p_planned_date: plannedDate,
      p_created_by: currentUser?.id ?? null,
    })
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(`${data.message} (เลขที่เอกสาร ${data.planId})`)
    setSelectedStore(null)
    setPlannedDate('')
  }

  if (!canCreate) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">สร้างคำขอ Workshop ใหม่</h1>
        <p className="text-ink-600 text-sm mt-1">เลือกร้านค้าและวันที่วางแผนจัดงาน ส่งให้ผู้บริหารอนุมัติ</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleCreate} className="glass p-6 space-y-4">
        <div>
          <label className="block text-xs text-ink-600 mb-1">ร้านค้า *</label>
          <StoreSearchDropdown selectedStore={selectedStore} onSelect={setSelectedStore} />
        </div>
        <div className="max-w-xs">
          <label className="block text-xs text-ink-600 mb-1">วันที่วางแผนจัดงาน *</label>
          <input type="date" className="glass-input w-full" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => { setSelectedStore(null); setPlannedDate('') }} className="btn-ghost text-sm">ยกเลิก</button>
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? 'กำลังส่ง...' : 'บันทึกคำขอ'}
          </button>
        </div>
      </form>
    </div>
  )
}

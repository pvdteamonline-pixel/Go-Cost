import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

export default function WorkshopApprovalPage() {
  const { currentUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')

  const canApprove = hasPagePermission(currentUser, 'workshop-approve')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_workshop_plans', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setPlans((data ?? []).filter((p) => p.status === 'pending_approval'))
  }, [currentUser])

  useEffect(() => { if (canApprove) load() }, [canApprove, load])

  async function handleApprove(id) {
    setBusyId(id)
    setError('')
    const { data, error: err } = await supabase.rpc('approve_workshop_plan', { p_plan_id: id, p_actor_id: currentUser?.id ?? null })
    setBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  async function handleReject(id) {
    setBusyId(id)
    setError('')
    const { data, error: err } = await supabase.rpc('reject_workshop_plan', {
      p_plan_id: id, p_admin_note: rejectNote, p_actor_id: currentUser?.id ?? null,
    })
    setBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setRejectingId(null)
    setRejectNote('')
    load()
  }

  if (!canApprove) {
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
        <h1 className="font-display italic text-3xl text-ink-900">อนุมัติ Workshop</h1>
        <p className="text-ink-600 text-sm mt-1">คำขอ Workshop ที่รอการอนุมัติ</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      <div className="space-y-3">
        {!loading && plans.length === 0 && (
          <div className="glass p-8 text-center text-ink-400 text-sm">ไม่มีคำขอที่รออนุมัติ</div>
        )}
        {plans.map((p) => (
          <div key={p.id} className="glass p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="doc-badge">{p.id}</span>
                <p className="text-ink-900 text-sm mt-1">{p.store_name} — {p.province} ({p.region})</p>
                <p className="text-ink-500 text-xs">วันที่วางแผน: {p.planned_date} · เซลล์ที่สังกัด: {p.assigned_sales_name || 'ยังไม่ได้กำหนด'}</p>
              </div>
              <p className="text-ink-400 text-xs">ขอโดย {p.created_by} · {new Date(p.created_at).toLocaleString('th-TH')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleApprove(p.id)} disabled={busyId === p.id} className="btn-primary text-xs px-4 py-1.5 disabled:opacity-60">
                {busyId === p.id ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
              </button>
              <button onClick={() => setRejectingId(rejectingId === p.id ? null : p.id)} className="btn-ghost text-xs px-4 py-1.5">ปฏิเสธ</button>
            </div>
            {rejectingId === p.id && (
              <div className="flex items-center gap-2 pt-2 border-t border-black/10">
                <input className="glass-input text-sm flex-1" placeholder="เหตุผลการปฏิเสธ (ไม่บังคับ)"
                       value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} />
                <button onClick={() => handleReject(p.id)} disabled={busyId === p.id} className="text-rose text-xs hover:underline whitespace-nowrap">ยืนยันปฏิเสธ</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

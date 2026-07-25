import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const STATUS_LABEL = {
  pending_edit: { text: 'รออนุมัติ (แก้ไข)', className: 'text-gold-dark bg-gold-pale border-gold/30' },
  pending_delete: { text: 'รออนุมัติ (ลบ)', className: 'text-rose bg-rose-pale border-rose/30' },
  approved: { text: 'อนุมัติแล้ว', className: 'text-sage bg-sage-pale border-sage/30' },
  rejected: { text: 'ปฏิเสธแล้ว', className: 'text-ink-600 bg-ink-100 border-black/10' },
}

export default function PendingEditsPage() {
  const { currentUser } = useAuth()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [rejectingId, setRejectingId] = useState(null)
  const [rejectNote, setRejectNote] = useState('')

  const canApprove = hasPagePermission(currentUser, 'pending-edits')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_pending_requests', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setRequests((data ?? []).sort((a, b) => new Date(b.request_timestamp) - new Date(a.request_timestamp)))
  }, [currentUser])

  useEffect(() => { load() }, [load])

  async function handleApprove(row) {
    setBusyId(row.edit_id)
    setError('')
    const rpcName = row.status === 'pending_edit' ? 'approve_edit_record' : 'approve_delete_record'
    const { data, error: err } = await supabase.rpc(rpcName, {
      p_edit_id: row.edit_id,
      p_actor_id: currentUser?.id ?? null,
    })
    setBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  async function handleReject(row) {
    setBusyId(row.edit_id)
    setError('')
    const { data, error: err } = await supabase.rpc('reject_pending_record', {
      p_edit_id: row.edit_id,
      p_admin_note: rejectNote,
      p_actor_id: currentUser?.id ?? null,
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
        <h2 className="font-display italic text-2xl text-ink-900 mb-2">คำขออนุมัติแก้ไข/ลบ</h2>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน — ติดต่อ Admin หากคิดว่าควรมีสิทธิ์</p>
      </div>
    )
  }

  const pending = requests.filter((r) => r.status === 'pending_edit' || r.status === 'pending_delete')
  const processed = requests.filter((r) => r.status === 'approved' || r.status === 'rejected')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">คำขออนุมัติแก้ไข/ลบ</h1>
        <p className="text-ink-600 text-sm mt-1">รายการที่รอการอนุมัติจากผู้บริหาร</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      <div className="space-y-3">
        {pending.length === 0 && !loading && (
          <div className="glass p-8 text-center text-ink-500 text-sm">ไม่มีคำขอที่รออนุมัติ</div>
        )}
        {pending.map((row) => {
          const status = STATUS_LABEL[row.status]
          return (
            <div key={row.edit_id} className="glass p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="doc-badge">{row.original_row_id}</span>
                  <span className={`text-xs border rounded-full px-2.5 py-0.5 ${status.className}`}>{status.text}</span>
                </div>
                <p className="text-ink-500 text-xs">
                  ขอโดย {row.requested_by} · {new Date(row.request_timestamp).toLocaleString('th-TH')}
                </p>
              </div>

              {row.status === 'pending_edit' && row.new_data_json && (
                <div className="text-sm text-ink-700 bg-ink-100 rounded-lg p-3">
                  <p>ร้าน/งาน: {row.new_data_json.storeName}</p>
                  <p>วันที่: {row.new_data_json.eventDate}</p>
                  <p>จำนวนรายการใหม่: {row.new_data_json.items?.length ?? 0}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleApprove(row)}
                  disabled={busyId === row.edit_id}
                  className="btn-primary text-xs px-4 py-1.5 disabled:opacity-60"
                >
                  {busyId === row.edit_id ? 'กำลังดำเนินการ...' : 'อนุมัติ'}
                </button>
                <button
                  onClick={() => setRejectingId(rejectingId === row.edit_id ? null : row.edit_id)}
                  className="btn-ghost text-xs px-4 py-1.5"
                >
                  ปฏิเสธ
                </button>
              </div>

              {rejectingId === row.edit_id && (
                <div className="flex items-center gap-2 pt-2 border-t border-black/10">
                  <input
                    className="glass-input text-sm flex-1"
                    placeholder="เหตุผลการปฏิเสธ (ไม่บังคับ)"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                  />
                  <button onClick={() => handleReject(row)} disabled={busyId === row.edit_id} className="text-rose text-xs hover:underline whitespace-nowrap">
                    ยืนยันปฏิเสธ
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {processed.length > 0 && (
        <div>
          <h2 className="text-ink-500 text-xs uppercase tracking-wider mb-2">ดำเนินการแล้ว</h2>
          <div className="space-y-2">
            {processed.map((row) => {
              const status = STATUS_LABEL[row.status]
              return (
                <div key={row.edit_id} className="glass p-3 flex items-center justify-between text-sm opacity-70">
                  <div className="flex items-center gap-3">
                    <span className="doc-badge">{row.original_row_id}</span>
                    <span className={`text-xs border rounded-full px-2.5 py-0.5 ${status.className}`}>{status.text}</span>
                  </div>
                  <p className="text-ink-500 text-xs">{row.requested_by} → {row.processed_at ? new Date(row.processed_at).toLocaleString('th-TH') : ''}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'

export default function AuditLogPage() {
  const { currentUser } = useAuth()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [busy, setBusy] = useState(false)

  const canView = hasPagePermission(currentUser, 'audit-log')
  const isAdmin = currentUser?.role === 'ADMIN'

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_audit_logs', {
      p_actor_id: currentUser?.id ?? null,
      p_year: year ? Number(year) : null,
      p_month: month ? Number(month) : null,
      p_limit: 500,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setLogs(data ?? [])
  }, [currentUser, year, month])

  useEffect(() => { if (canView) load() }, [canView, load])

  async function handleDelete(logId) {
    if (!confirm('ยืนยันลบบันทึกกิจกรรมนี้? การลบไม่สามารถย้อนกลับได้')) return
    setBusy(true)
    const { data, error: err } = await supabase.rpc('delete_audit_log', { p_log_id: logId, p_actor_id: currentUser?.id ?? null })
    setBusy(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  function startEdit(l) {
    setEditingId(l.log_id)
    setEditText(l.details ?? '')
    setError('')
  }

  async function handleSaveEdit(logId) {
    setBusy(true)
    const { data, error: err } = await supabase.rpc('edit_audit_log', {
      p_log_id: logId, p_new_details: editText, p_actor_id: currentUser?.id ?? null,
    })
    setBusy(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setEditingId(null)
    load()
  }

  if (!canView) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <h2 className="font-display italic text-2xl text-ink-900 mb-2">บันทึกกิจกรรม</h2>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน — ติดต่อ Admin หากคิดว่าควรมีสิทธิ์</p>
      </div>
    )
  }

  const filtered = logs.filter((l) => {
    if (!search.trim()) return true
    const q = search.trim().toLowerCase()
    return l.user_id?.toLowerCase().includes(q) || l.user_name?.toLowerCase().includes(q)
      || l.action?.toLowerCase().includes(q) || l.details?.toLowerCase().includes(q)
  })

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">บันทึกกิจกรรม</h1>
          <p className="text-ink-600 text-sm mt-1">ประวัติการทำรายการทั้งหมดในระบบ{isAdmin ? ' — Admin แก้ไข/ลบบันทึกได้' : ''}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select className="glass-input text-sm" value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">ทุกปี</option>
            {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="glass-input text-sm" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">ทุกเดือน</option>
            {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
          </select>
          <input className="glass-input text-sm w-56" placeholder="ค้นหา user / ชื่อเล่น / action..."
                 value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      <div className="glass overflow-hidden">
        {!loading && filtered.length === 0 && (
          <p className="text-ink-400 text-sm text-center py-10">ไม่มีบันทึกกิจกรรม</p>
        )}
        {!loading && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">เวลา</th>
                <th className="px-4 py-3">ผู้ใช้</th>
                <th className="px-4 py-3">ชื่อเล่น</th>
                <th className="px-4 py-3">การกระทำ</th>
                <th className="px-4 py-3">รายละเอียด</th>
                {isAdmin && <th className="px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.log_id} className="border-b border-black/5 last:border-0 align-top">
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{new Date(l.timestamp).toLocaleString('th-TH')}</td>
                  <td className="px-4 py-3 text-ink-900">{l.user_id}</td>
                  <td className="px-4 py-3 text-ink-700">{l.user_name || '-'}</td>
                  <td className="px-4 py-3"><span className="doc-badge">{l.action}</span></td>
                  <td className="px-4 py-3 text-ink-700">
                    {editingId === l.log_id ? (
                      <div className="flex items-center gap-2">
                        <input className="glass-input text-sm flex-1" value={editText} onChange={(e) => setEditText(e.target.value)} />
                        <button onClick={() => handleSaveEdit(l.log_id)} disabled={busy} className="text-ocean text-xs hover:underline whitespace-nowrap">บันทึก</button>
                        <button onClick={() => setEditingId(null)} className="text-ink-400 text-xs hover:underline whitespace-nowrap">ยกเลิก</button>
                      </div>
                    ) : l.details}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      {editingId !== l.log_id && (
                        <>
                          <button onClick={() => startEdit(l)} className="text-ocean text-xs hover:underline">แก้ไข</button>
                          <button onClick={() => handleDelete(l.log_id)} className="text-rose text-xs hover:underline">ลบ</button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

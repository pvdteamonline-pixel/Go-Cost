import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ROLE_OPTIONS, PERMISSION_GROUPS } from '../lib/constants'
import { hasPagePermission } from '../lib/permissions'

function emptyForm() {
  return { id: '', password: '', role: ROLE_OPTIONS[0], name: '', fullName: '', email: '' }
}

export default function UsersManagementPage() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // แผงสิทธิ์การเข้าถึงหน้า/ฟีเจอร์ — เลือก user ที่จะแก้ไขสิทธิ์
  const [permTargetId, setPermTargetId] = useState('')
  const [permKeys, setPermKeys] = useState([])
  const [permSubmitting, setPermSubmitting] = useState(false)

  const isAdmin = hasPagePermission(currentUser, 'users')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_users')
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setUsers(data ?? [])
  }, [])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  function startEdit(u) {
    setEditingId(u.id)
    setForm({ id: u.id, password: '', role: u.role, name: u.name, fullName: u.full_name ?? '', email: u.email ?? '' })
  }

  function startCreate() {
    setEditingId(null)
    setForm(emptyForm())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.id.trim()) return setError('กรุณากรอกรหัสผู้ใช้ (id)')
    if (!form.name.trim()) return setError('กรุณากรอกชื่อเล่น')
    if (!form.fullName.trim()) return setError('กรุณากรอกชื่อ-นามสกุลจริง')
    if (!editingId && !form.password.trim()) return setError('กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่')

    setSubmitting(true)
    const { data, error: err } = await supabase.rpc('save_user', {
      p_id: form.id.trim(),
      p_password: form.password.trim() || null,
      p_role: form.role,
      p_name: form.name.trim(),
      p_full_name: form.fullName.trim(),
      p_email: form.email.trim(),
      p_actor_id: currentUser?.id ?? null,
    })
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    startCreate()
    load()
  }

  async function handleDelete(userId) {
    if (!confirm(`ยืนยันลบผู้ใช้ ${userId}?`)) return
    const { data, error: err } = await supabase.rpc('delete_user', {
      p_user_id: userId,
      p_actor_id: currentUser?.id ?? null,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  function openPermissionPanel(u) {
    setPermTargetId(u.id)
    setPermKeys(Array.isArray(u.page_permissions) ? u.page_permissions : [])
    setNotice('')
    setError('')
  }

  function togglePermKey(key) {
    setPermKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  async function handleSavePermissions() {
    if (!permTargetId) return
    setPermSubmitting(true)
    setError('')
    const { data, error: err } = await supabase.rpc('update_user_permissions', {
      p_target_user_id: permTargetId,
      p_new_page_keys: permKeys,
      p_actor_id: currentUser?.id ?? null,
    })
    setPermSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message + ' — ผู้ใช้จะได้รับแจ้งเตือนทางกระดิ่งว่าได้/เสียสิทธิ์อะไรไปบ้าง')
    setPermTargetId('')
    load()
  }

  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <h2 className="font-display italic text-2xl text-ink-900 mb-2">จัดการผู้ใช้งาน</h2>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน — ติดต่อ Admin หากคิดว่าควรมีสิทธิ์</p>
      </div>
    )
  }

  const permTargetUser = users.find((u) => u.id === permTargetId)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">จัดการผู้ใช้งาน</h1>
        <p className="text-ink-600 text-sm mt-1">รหัสผ่านจะถูกเข้ารหัส (bcrypt) ก่อนบันทึกเสมอ</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleSubmit} className="glass p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 text-ink-900 font-medium">{editingId ? `แก้ไขผู้ใช้: ${editingId}` : 'เพิ่มผู้ใช้ใหม่'}</h2>
        <div>
          <label className="block text-xs text-ink-600 mb-1">รหัสผู้ใช้ (id) *</label>
          <input className="glass-input w-full" value={form.id} disabled={!!editingId}
                 onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">{editingId ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}</label>
          <input type="password" className="glass-input w-full" value={form.password}
                 onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">บทบาท (role)</label>
          <select className="glass-input w-full" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">ชื่อเล่น *</label>
          <input className="glass-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">ชื่อ-นามสกุลจริง *</label>
          <input className="glass-input w-full" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <p className="text-ink-400 text-xs mt-1">ใช้เก็บเป็นหลักฐานว่าใครบันทึกรายการอะไรตอนดึงข้อมูลออกไปใช้งานจริง</p>
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">อีเมล</label>
          <input type="email" className="glass-input w-full" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          {editingId && <button type="button" onClick={startCreate} className="btn-ghost text-sm">ยกเลิกแก้ไข</button>}
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
          </button>
        </div>
      </form>

      <div className="glass p-0 overflow-hidden">
        {loading && <p className="text-ink-500 text-sm p-6">กำลังโหลด...</p>}
        {!loading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">รหัส</th>
                <th className="px-4 py-3">ชื่อเล่น / ชื่อจริง</th>
                <th className="px-4 py-3">บทบาท</th>
                <th className="px-4 py-3">อีเมล</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-b border-black/5 last:border-0 ${permTargetId === u.id ? 'bg-ocean-pale' : ''}`}>
                  <td className="px-4 py-3 text-ink-900">{u.id}</td>
                  <td className="px-4 py-3 text-ink-700">{u.name} <span className="text-ink-400">/ {u.full_name}</span></td>
                  <td className="px-4 py-3"><span className="doc-badge">{u.role}</span></td>
                  <td className="px-4 py-3 text-ink-600">{u.email || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => openPermissionPanel(u)} className="text-ocean text-xs hover:underline">สิทธิ์การเข้าถึง</button>
                    <button onClick={() => startEdit(u)} className="text-ocean text-xs hover:underline">แก้ไข</button>
                    <button onClick={() => handleDelete(u.id)} disabled={u.id === currentUser?.id} className="text-rose text-xs hover:underline disabled:opacity-30 disabled:cursor-not-allowed">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {permTargetUser && (
        <div className="glass p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-ink-900 font-medium">
              สิทธิ์การเข้าถึงของ <span className="doc-badge ml-1">{permTargetUser.id}</span>
              <span className="text-ink-500 text-sm ml-2">({permTargetUser.name})</span>
            </h2>
            <button onClick={() => setPermTargetId('')} className="text-ink-400 hover:text-ink-900 text-sm">✕</button>
          </div>

          {permTargetUser.role === 'ADMIN' && (
            <p className="text-ocean text-sm bg-ocean-pale border border-ocean/20 rounded-lg px-3 py-2">
              ผู้ใช้นี้มี role "ADMIN" ซึ่งเข้าถึงได้ทุกหน้าโดยอัตโนมัติเสมอ ไม่ว่าจะติ๊กอะไรไว้ด้านล่างหรือไม่
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label} className="bg-white/60 border border-black/[0.06] rounded-xl p-4">
                <p className="text-ink-500 text-xs uppercase tracking-wider mb-2">{group.label}</p>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <label key={item.key} className="flex items-center gap-2 text-sm text-ink-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permKeys.includes(item.key)}
                        onChange={() => togglePermKey(item.key)}
                        className="accent-ocean"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button onClick={handleSavePermissions} disabled={permSubmitting} className="btn-primary text-sm disabled:opacity-60">
              {permSubmitting ? 'กำลังบันทึก...' : 'บันทึกสิทธิ์การเข้าถึง'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

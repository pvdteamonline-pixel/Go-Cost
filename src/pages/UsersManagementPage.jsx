import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ROLE_OPTIONS, PERMISSION_GROUPS } from '../lib/constants'
import { hasPagePermission } from '../lib/permissions'
import './UsersManagementPage.css'

function emptyForm() {
  return { id: '', password: '', role: 'เซลล์', name: '', fullName: '', email: '' }
}

function MyCredentials({ user, ready, onSaved }) {
  const [username, setUsername] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const busy = useRef(false)
  useEffect(() => { setUsername(user?.login_name || user?.id || '') }, [user?.id, user?.login_name])

  async function save(e) {
    e.preventDefault()
    if (busy.current || !ready || !user) return
    setMessage(''); setError('')
    if (!username.trim()) return setError('กรุณากรอกชื่อผู้ใช้สำหรับเข้าสู่ระบบ')
    if (!currentPassword) return setError('กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยัน')
    if (newPassword !== confirmation) return setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน')
    if (newPassword && (!newPassword.trim() || new TextEncoder().encode(newPassword).length > 72)) return setError('รหัสผ่านใหม่ต้องไม่ว่างและมีขนาดไม่เกิน 72 ไบต์')
    busy.current = true; setSaving(true)
    try {
      const { data, error: err } = await supabase.rpc('update_my_credentials', {
        p_user_id: user.id, p_current_password: currentPassword,
        p_login_name: username.trim(), p_new_password: newPassword || null,
      })
      if (err) throw new Error(err.message)
      if (!data?.success) throw new Error(data?.message || 'ไม่ได้รับผลยืนยันการบันทึก')
      setCurrentPassword(''); setNewPassword(''); setConfirmation('')
      setMessage(`บันทึกแล้ว ครั้งต่อไปเข้าสู่ระบบด้วยชื่อผู้ใช้ ${data.login_name}`)
      await onSaved()
    } catch (err) { setError('บันทึกไม่สำเร็จ: ' + err.message) }
    finally { busy.current = false; setSaving(false) }
  }

  return <form onSubmit={save} className="glass p-6 space-y-4" aria-label="บัญชีเข้าสู่ระบบของฉัน">
    <div><h2 className="text-ink-900 font-medium">บัญชีเข้าสู่ระบบของฉัน</h2><p className="text-xs text-ink-500 mt-1">เปลี่ยนชื่อผู้ใช้หรือรหัสผ่านได้ โดยประวัติและบทบาทของบัญชียังคงเดิม</p></div>
    {!ready && <p role="status" className="text-sm text-ink-600">ต้องติดตั้งส่วนปรับปรุงบัญชีในฐานข้อมูลก่อน จึงจะเปลี่ยนชื่อเข้าสู่ระบบได้</p>}
    {message && <p role="status" className="text-sm text-sage break-words">{message}</p>}
    {error && <p role="alert" className="text-sm text-rose">{error}</p>}
    <fieldset disabled={!ready || saving || !user} className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0 disabled:opacity-60">
      <div><label htmlFor="my-login-name" className="block text-xs text-ink-600 mb-1">ชื่อผู้ใช้สำหรับเข้าสู่ระบบ</label><input id="my-login-name" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={100} className="glass-input w-full" value={username} onChange={e => setUsername(e.target.value)} required /></div>
      <div><label htmlFor="my-current-password" className="block text-xs text-ink-600 mb-1">รหัสผ่านปัจจุบัน</label><input id="my-current-password" type="password" autoComplete="current-password" className="glass-input w-full" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
      <div><label htmlFor="my-new-password" className="block text-xs text-ink-600 mb-1">รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)</label><input id="my-new-password" type="password" autoComplete="new-password" className="glass-input w-full" value={newPassword} onChange={e => setNewPassword(e.target.value)} /></div>
      <div><label htmlFor="my-confirm-password" className="block text-xs text-ink-600 mb-1">ยืนยันรหัสผ่านใหม่</label><input id="my-confirm-password" type="password" autoComplete="new-password" className="glass-input w-full" value={confirmation} onChange={e => setConfirmation(e.target.value)} /></div>
      <div className="sm:col-span-2 flex justify-end"><button type="submit" className="btn-primary text-sm">{saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลเข้าสู่ระบบ'}</button></div>
    </fieldset>
  </form>
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
  const [deleting, setDeleting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [usersReady, setUsersReady] = useState(false)
  const [accountFeaturesReady, setAccountFeaturesReady] = useState(false)
  const busy = useRef(false)
  const formRef = useRef(null)
  const isSuperAdmin = currentUser?.role === 'ADMIN'
  const adminCount = users.filter(user => user.role === 'ADMIN').length
  const lockedAccount = user => user?.role_locked || (user?.id === 'ADMIN' && user?.role === 'ADMIN')
  const protectedAdmin = user => lockedAccount(user) || (user.role === 'ADMIN' && (!isSuperAdmin || adminCount <= 1))
  const editingUser = users.find(user => user.id === editingId)
  const selfEdit = !!editingId && editingId === currentUser?.id
  const roleLocked = lockedAccount(editingUser) || (selfEdit && editingUser?.role === 'ADMIN')

  // แผงสิทธิ์การเข้าถึงหน้า/ฟีเจอร์ — เลือก user ที่จะแก้ไขสิทธิ์
  const [permTargetId, setPermTargetId] = useState('')
  const [permKeys, setPermKeys] = useState([])
  const [permSubmitting, setPermSubmitting] = useState(false)

  const isAdmin = hasPagePermission(currentUser, 'users')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    setUsersReady(false)
    setAccountFeaturesReady(false)
    try {
      let { data, error: err } = await supabase.rpc('get_users_for_management_v2', { p_actor_id: currentUser?.id })
      if (err?.code === 'PGRST202' || err?.code === '42883') {
        const legacy = await supabase.rpc('get_users')
        data = legacy.data; err = legacy.error
      } else if (!err) setAccountFeaturesReady(true)
      if (err) throw new Error(err.message)
      setUsers(data ?? [])
      setUsersReady(true)
    } catch (err) { setError('โหลดรายชื่อผู้ใช้ไม่สำเร็จ: ' + err.message) }
    finally { setLoading(false) }
  }, [currentUser?.id])

  useEffect(() => { if (isAdmin) load() }, [isAdmin, load])

  function startEdit(u) {
    if (busy.current) return
    setError(''); setNotice('')
    requestAnimationFrame(() => { formRef.current?.scrollIntoView({block:'start'}); formRef.current?.querySelector('#user-name')?.focus({preventScroll:true}) })
    setEditingId(u.id)
    setForm({ id: u.id, password: '', role: u.role, name: u.name, fullName: u.full_name ?? '', email: u.email ?? '' })
  }

  function startCreate() {
    setError('')
    setEditingId(null)
    setForm(emptyForm())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy.current || !usersReady) return
    setError(''); setNotice('')
    const id = form.id.trim()
    if (!id) return setError('กรุณากรอกรหัสผู้ใช้')
    if (!editingId && users.some(user => user.id.toLowerCase() === id.toLowerCase())) return setError('รหัสผู้ใช้นี้มีอยู่แล้ว กรุณากดแก้ไขที่บัญชีเดิม หรือใช้รหัสใหม่')
    if (!form.name.trim()) return setError('กรุณากรอกชื่อเล่น')
    if (!form.fullName.trim()) return setError('กรุณากรอกชื่อ-นามสกุลจริง')
    if (!editingId && !form.password.trim()) return setError('กรุณากำหนดรหัสผ่านสำหรับผู้ใช้ใหม่')
    const existing = users.find(user => user.id === editingId)
    if (lockedAccount(existing) && form.role !== 'ADMIN') return setError('บัญชีนี้ล็อกบทบาท ADMIN ไว้ ไม่สามารถเปลี่ยนบทบาทได้')
    if (existing?.role === 'ADMIN' && form.role !== 'ADMIN' && (adminCount <= 1 || existing.id === currentUser?.id)) return setError('ไม่สามารถลดสิทธิ์บัญชีที่กำลังใช้งานหรือผู้ดูแลระบบคนสุดท้ายได้')
    busy.current = true; setSubmitting(true)
    try {
      const { data, error: err } = await supabase.rpc('save_user', {
        p_id: editingId || id, p_password: selfEdit && accountFeaturesReady ? null : form.password.trim() || null, p_role: roleLocked ? 'ADMIN' : form.role,
        p_name: form.name.trim(), p_full_name: form.fullName.trim(), p_email: form.email.trim(),
        p_actor_id: currentUser?.id ?? null,
      })
      if (err) throw new Error(err.message)
      if (!data?.success) throw new Error(data?.message || 'ไม่ได้รับผลยืนยันการบันทึก')
      setNotice(data.message)
      startCreate()
      await load()
    } catch (err) { setError('บันทึกไม่สำเร็จ: ' + err.message) }
    finally { busy.current = false; setSubmitting(false) }
  }

  async function handleDelete() {
    if (!deleteTarget || busy.current) return
    if (deleteTarget.id === currentUser?.id || protectedAdmin(deleteTarget)) return setError('ไม่สามารถลบบัญชีนี้ได้ เพื่อรักษาการเข้าถึงระบบ')
    busy.current = true; setDeleting(true); setError(''); setNotice('')
    try {
      const { data, error: err } = await supabase.rpc('delete_user', {p_user_id:deleteTarget.id,p_actor_id:currentUser?.id ?? null})
      if (err) throw new Error(err.message)
      if (!data?.success) throw new Error(data?.message || 'ไม่ได้รับผลยืนยันการลบ')
      if (editingId === deleteTarget.id) startCreate()
      if (permTargetId === deleteTarget.id) setPermTargetId('')
      setNotice(data.message); setDeleteTarget(null)
      await load()
    } catch (err) { setError('ลบผู้ใช้ไม่สำเร็จ: ' + err.message) }
    finally { busy.current = false; setDeleting(false) }
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
    if (!permTargetId || permSubmitting || !isSuperAdmin) return
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
    <div className="users-management max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">จัดการผู้ใช้งาน</h1>
        <p className="text-ink-600 text-sm mt-1">เพิ่ม แก้ไข และจัดการบัญชีผู้ใช้งานขององค์กร</p>
      </div>

      {notice && <p role="status" className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p role="alert" className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      {!loading && !usersReady && <button type="button" className="btn-ghost" onClick={load}>โหลดรายชื่ออีกครั้ง</button>}
      {users.some(user => user.id === currentUser?.id) && <MyCredentials user={users.find(user => user.id === currentUser?.id)} ready={accountFeaturesReady && usersReady} onSaved={load} />}
      <form ref={formRef} onSubmit={handleSubmit} autoComplete="off" className="glass p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 text-ink-900 font-medium">{editingId ? `แก้ไขผู้ใช้: ${editingId}` : 'เพิ่มผู้ใช้ใหม่'}</h2>
        <div>
          <label htmlFor="user-id" className="block text-xs text-ink-600 mb-1">รหัสผู้ใช้ (id) *</label>
          <input id="user-id" autoComplete="off" autoCapitalize="none" spellCheck={false} className="glass-input w-full" value={form.id} disabled={!!editingId}
                 onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))} />
          {selfEdit && <p className="text-xs text-ink-500 mt-1">เปลี่ยนชื่อเข้าสู่ระบบได้ที่ “บัญชีเข้าสู่ระบบของฉัน” ด้านบน</p>}
        </div>
        <div>
          <label htmlFor="user-password" className="block text-xs text-ink-600 mb-1">{editingId ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'}</label>
          <input id="user-password" disabled={selfEdit && accountFeaturesReady} autoComplete="new-password" type="password" className="glass-input w-full" value={form.password}
                 onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          {selfEdit && accountFeaturesReady && <p className="text-xs text-ink-500 mt-1">เปลี่ยนรหัสผ่านได้ที่ “บัญชีเข้าสู่ระบบของฉัน” ด้านบน</p>}
        </div>
        <div>
          <label htmlFor="user-role" className="block text-xs text-ink-600 mb-1">บทบาท</label>
          <select id="user-role" disabled={roleLocked} aria-describedby={roleLocked ? 'role-lock-note' : undefined} className="glass-input w-full" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
            {ROLE_OPTIONS.filter(r => isSuperAdmin || r !== 'ADMIN').map(r => <option key={r} value={r}>{r === 'ADMIN' ? 'ผู้ดูแลระบบ (ADMIN)' : r}</option>)}
          </select>
          {roleLocked && <p id="role-lock-note" className="text-xs text-ocean mt-1">ล็อกบทบาท ADMIN — ไม่สามารถเปลี่ยนบทบาทบัญชีนี้ได้</p>}
        </div>
        <div>
          <label htmlFor="user-name" className="block text-xs text-ink-600 mb-1">ชื่อเล่น *</label>
          <input id="user-name" autoComplete="off" className="glass-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label htmlFor="user-full-name" className="block text-xs text-ink-600 mb-1">ชื่อ-นามสกุลจริง *</label>
          <input id="user-full-name" autoComplete="off" className="glass-input w-full" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
          <p className="text-ink-400 text-xs mt-1">ใช้เก็บเป็นหลักฐานว่าใครบันทึกรายการอะไรตอนดึงข้อมูลออกไปใช้งานจริง</p>
        </div>
        <div>
          <label htmlFor="user-email" className="block text-xs text-ink-600 mb-1">อีเมล</label>
          <input id="user-email" autoComplete="off" type="email" className="glass-input w-full" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          {editingId && <button type="button" disabled={submitting} onClick={startCreate} className="btn-ghost text-sm">ยกเลิกแก้ไข</button>}
          <button type="submit" disabled={submitting || deleting || loading || !usersReady} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? 'กำลังบันทึก...' : editingId ? 'บันทึกการแก้ไข' : 'เพิ่มผู้ใช้'}
          </button>
        </div>
      </form>

      {deleteTarget && <div className="um-delete-confirm" role="alert">
        <p>ยืนยันลบผู้ใช้ <strong>{deleteTarget.id} — {deleteTarget.name}</strong> หรือไม่? การลบนี้ย้อนกลับไม่ได้</p>
        <div className="flex gap-2"><button className="btn-ghost text-sm" disabled={deleting} onClick={() => setDeleteTarget(null)}>ยกเลิกลบ</button><button className="btn-primary text-sm" disabled={deleting} onClick={handleDelete}>{deleting ? 'กำลังลบ...' : 'ยืนยันลบผู้ใช้'}</button></div>
      </div>}
      <div className="glass p-0 overflow-hidden">
        {loading && <p className="text-ink-500 text-sm p-6">กำลังโหลด...</p>}
        {!loading && usersReady && (
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
                  <td data-label="รหัส" className="px-4 py-3 text-ink-900">{u.id}{u.login_name && u.login_name !== u.id && <span className="block text-xs text-ink-500 break-all">ชื่อเข้าสู่ระบบ: {u.login_name}</span>}</td>
                  <td data-label="ชื่อ" className="px-4 py-3 text-ink-700">{u.name} <span className="text-ink-400">/ {u.full_name}</span></td>
                  <td data-label="บทบาท" className="px-4 py-3"><span className="doc-badge">{u.role}</span></td>
                  <td data-label="อีเมล" className="px-4 py-3 text-ink-600">{u.email || '-'}</td>
                  <td className="um-actions px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button disabled={!isSuperAdmin || submitting || deleting} onClick={() => openPermissionPanel(u)} className="text-ocean text-xs hover:underline">สิทธิ์การเข้าถึง</button>
                    <button disabled={submitting || deleting || (u.role === 'ADMIN' && !isSuperAdmin)} onClick={() => startEdit(u)} className="text-ocean text-xs hover:underline">แก้ไข</button>
                    <button onClick={() => { setDeleteTarget(u); setError('') }} disabled={submitting || deleting || u.id === currentUser?.id || protectedAdmin(u)} title={u.id === currentUser?.id ? 'ไม่สามารถลบบัญชีที่กำลังใช้งาน' : protectedAdmin(u) ? 'บัญชีผู้ดูแลระบบที่ได้รับการป้องกัน' : 'ลบผู้ใช้'} className="text-rose text-xs hover:underline disabled:opacity-30 disabled:cursor-not-allowed">ลบ</button>
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

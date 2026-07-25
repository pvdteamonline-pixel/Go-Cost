import { useState, useEffect, useCallback } from 'react'
import Papa from 'papaparse'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

function emptyForm() {
  return { id: null, code: '', name: '', category: '', description: '' }
}

// map หัวคอลัมน์ไฟล์ CSV (รองรับได้หลายชื่อหัวตาราง เผื่อไฟล์ในอนาคตเขียนต่างกันเล็กน้อย)
const HEADER_MAP = {
  code: ['รหัสบัญชี', 'code', 'account code'],
  name: ['ชื่อบัญชี', 'name', 'account name'],
  category: ['หมวดหมู่บัญชี', 'category'],
  description: ['รายละเอียด', 'description'],
}

function mapCsvRow(row) {
  const findValue = (keys) => {
    for (const k of Object.keys(row)) {
      if (keys.some((target) => k.trim().toLowerCase() === target.toLowerCase())) return row[k]
    }
    return ''
  }
  return {
    code: (findValue(HEADER_MAP.code) || '').toString().trim(),
    name: (findValue(HEADER_MAP.name) || '').toString().trim(),
    category: (findValue(HEADER_MAP.category) || '').toString().trim(),
    description: (findValue(HEADER_MAP.description) || '').toString().trim(),
  }
}

export default function AccountsManagementPage() {
  const { currentUser } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  // นำเข้าจากไฟล์
  const [importOpen, setImportOpen] = useState(false)
  const [importFileName, setImportFileName] = useState('')
  const [importResult, setImportResult] = useState(null) // { existingCount, newComplete, newIncomplete }
  const [incompleteRows, setIncompleteRows] = useState([])
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importLogs, setImportLogs] = useState([])

  const canUse = hasPagePermission(currentUser, 'accounts')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_accounts', {
      p_actor_id: currentUser?.id ?? null, p_query: search.trim() || null,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setAccounts(data ?? [])
  }, [currentUser, search])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  const loadImportLogs = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('get_import_logs', { p_actor_id: currentUser?.id ?? null })
    if (!err) setImportLogs(data ?? [])
  }, [currentUser])

  useEffect(() => { if (canUse) loadImportLogs() }, [canUse, loadImportLogs])

  function startEdit(a) {
    setForm({ id: a.id, code: a.code, name: a.name, category: a.category, description: a.description })
  }
  function startCreate() {
    setForm(emptyForm())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.code.trim() || !form.name.trim() || !form.category.trim() || !form.description.trim()) {
      return setError('กรุณากรอกให้ครบทุกช่อง: รหัสบัญชี, ชื่อบัญชี, หมวดหมู่บัญชี, รายละเอียด')
    }
    setSubmitting(true)
    const rpcName = form.id ? 'update_account' : 'create_account'
    const params = form.id
      ? { p_id: form.id, p_code: form.code, p_name: form.name, p_category: form.category, p_description: form.description, p_actor_id: currentUser?.id ?? null }
      : { p_code: form.code, p_name: form.name, p_category: form.category, p_description: form.description, p_actor_id: currentUser?.id ?? null }
    const { data, error: err } = await supabase.rpc(rpcName, params)
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    startCreate()
    load()
  }

  async function handleDelete(id) {
    if (!confirm('ยืนยันลบรหัสบัญชีนี้?')) return
    setError('')
    const { data, error: err } = await supabase.rpc('delete_account', { p_id: id, p_actor_id: currentUser?.id ?? null })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setImportResult(null)
    setImportFileName(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      encoding: 'UTF-8',
      complete: async (results) => {
        const rows = results.data.map(mapCsvRow).filter((r) => r.code)
        if (rows.length === 0) {
          setError('ไม่พบข้อมูลในไฟล์ หรือไม่พบคอลัมน์ "รหัสบัญชี" — เช็คหัวตารางในไฟล์')
          return
        }
        const { data, error: err } = await supabase.rpc('check_new_account_codes', {
          p_actor_id: currentUser?.id ?? null, p_rows: rows,
        })
        if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
        if (!data.success) return setError(data.message)
        setImportResult(data)
        setIncompleteRows(data.newIncomplete.map((r) => ({ ...r })))
      },
      error: (err) => setError('อ่านไฟล์ไม่สำเร็จ: ' + err.message),
    })
  }

  function updateIncompleteField(index, field, value) {
    setIncompleteRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  async function handleConfirmImport() {
    setError('')
    const stillIncomplete = incompleteRows.some((r) => !r.code || !r.name || !r.category || !r.description)
    if (stillIncomplete) {
      return setError('ยังมีรหัสที่กรอกข้อมูลไม่ครบ — กรุณากรอกให้ครบทุกช่องก่อนบันทึก')
    }
    setImportSubmitting(true)
    const allRows = [...(importResult?.newComplete ?? []), ...incompleteRows]
    const { data, error: err } = await supabase.rpc('bulk_import_accounts', {
      p_actor_id: currentUser?.id ?? null, p_rows: allRows, p_file_name: importFileName || null,
    })
    setImportSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setImportResult(null)
    setIncompleteRows([])
    setImportOpen(false)
    load()
    loadImportLogs()
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">จัดการรหัสบัญชี</h1>
          <p className="text-ink-600 text-sm mt-1">ผังบัญชีที่ใช้อ้างอิงตอนกระทบยอดกับไฟล์บัญชีจริง</p>
        </div>
        <div className="flex gap-2">
          <input className="glass-input text-sm w-56" placeholder="ค้นหารหัส / ชื่อ / หมวดหมู่..."
                 value={search} onChange={(e) => setSearch(e.target.value)} />
          <button onClick={() => setImportOpen((o) => !o)} className="btn-ghost text-sm">นำเข้าจากไฟล์</button>
        </div>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      {importOpen && (
        <div className="glass p-6 space-y-4">
          <h2 className="text-ink-900 font-medium">นำเข้ารหัสบัญชีจากไฟล์ (CSV)</h2>
          <p className="text-ink-500 text-xs">
            ไฟล์ต้องมีหัวตาราง: รหัสบัญชี, ชื่อบัญชี, หมวดหมู่บัญชี, รายละเอียด — ระบบจะตรวจอัตโนมัติว่ารหัสไหนใหม่
            (ยังไม่มีในระบบ) แล้วเพิ่มให้เอง ถ้ารหัสใหม่ข้อมูลไม่ครบจะให้กรอกเพิ่มก่อนบันทึก
          </p>
          <input type="file" accept=".csv" className="glass-input w-full" onChange={handleFileSelect} />

          {importResult && (
            <div className="space-y-4">
              <p className="text-ink-700 text-sm">
                พบรหัสที่มีอยู่แล้ว {importResult.existingCount} รายการ (ข้าม) ·
                รหัสใหม่ข้อมูลครบ {importResult.newComplete.length} รายการ ·
                รหัสใหม่ข้อมูลไม่ครบ {importResult.newIncomplete.length} รายการ
              </p>

              {incompleteRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-gold-dark text-sm bg-gold-pale border border-gold/30 rounded-lg px-3 py-2">
                    กรุณากรอกข้อมูลให้ครบก่อนบันทึก (รหัสใหม่ {incompleteRows.length} รายการยังขาดข้อมูล)
                  </p>
                  {incompleteRows.map((r, i) => (
                    <div key={i} className="bg-white/60 border border-black/[0.06] rounded-xl p-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input className="glass-input text-sm" placeholder="รหัสบัญชี *" value={r.code} onChange={(e) => updateIncompleteField(i, 'code', e.target.value)} />
                      <input className="glass-input text-sm" placeholder="ชื่อบัญชี *" value={r.name} onChange={(e) => updateIncompleteField(i, 'name', e.target.value)} />
                      <input className="glass-input text-sm" placeholder="หมวดหมู่บัญชี *" value={r.category} onChange={(e) => updateIncompleteField(i, 'category', e.target.value)} />
                      <input className="glass-input text-sm" placeholder="รายละเอียด *" value={r.description} onChange={(e) => updateIncompleteField(i, 'description', e.target.value)} />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button onClick={() => { setImportResult(null); setIncompleteRows([]) }} className="btn-ghost text-sm">ยกเลิก</button>
                <button onClick={handleConfirmImport} disabled={importSubmitting || (importResult.newComplete.length === 0 && incompleteRows.length === 0)}
                        className="btn-primary text-sm disabled:opacity-60">
                  {importSubmitting ? 'กำลังนำเข้า...' : `บันทึกรหัสใหม่ (${importResult.newComplete.length + incompleteRows.length} รายการ)`}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="glass p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10">
          <h2 className="text-ink-900 font-medium">ประวัติการนำเข้า</h2>
        </div>
        {importLogs.length === 0 ? (
          <p className="text-ink-400 text-sm text-center py-8">ยังไม่มีประวัติการนำเข้า</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">เวลา</th>
                <th className="px-4 py-3">ผู้นำเข้า</th>
                <th className="px-4 py-3">ไฟล์</th>
                <th className="px-4 py-3">รหัสใหม่</th>
                <th className="px-4 py-3">ข้าม (มีอยู่แล้ว)</th>
              </tr>
            </thead>
            <tbody>
              {importLogs.map((l) => (
                <tr key={l.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{new Date(l.imported_at).toLocaleString('th-TH')}</td>
                  <td className="px-4 py-3 text-ink-900">{l.imported_by_name || l.imported_by || '-'}</td>
                  <td className="px-4 py-3 text-ink-700">{l.file_name || '-'}</td>
                  <td className="px-4 py-3 text-sage">{l.new_count}</td>
                  <td className="px-4 py-3 text-ink-500">{l.skipped_count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <form onSubmit={handleSubmit} className="glass p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <h2 className="sm:col-span-2 text-ink-900 font-medium">{form.id ? `แก้ไขรหัสบัญชี #${form.id}` : 'เพิ่มรหัสบัญชีใหม่'}</h2>
        <div>
          <label className="block text-xs text-ink-600 mb-1">รหัสบัญชี *</label>
          <input className="glass-input w-full" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">ชื่อบัญชี *</label>
          <input className="glass-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">หมวดหมู่บัญชี *</label>
          <input className="glass-input w-full" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="เช่น รายได้ (Revenue), ค่าใช้จ่าย (Expenses)" />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">รายละเอียด *</label>
          <input className="glass-input w-full" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
        </div>
        <div className="sm:col-span-2 flex justify-end gap-2">
          {form.id && <button type="button" onClick={startCreate} className="btn-ghost text-sm">ยกเลิกแก้ไข</button>}
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? 'กำลังบันทึก...' : form.id ? 'บันทึกการแก้ไข' : 'เพิ่มรหัสบัญชี'}
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
                <th className="px-4 py-3">ชื่อบัญชี</th>
                <th className="px-4 py-3">หมวดหมู่</th>
                <th className="px-4 py-3">กลุ่ม</th>
                <th className="px-4 py-3">รายละเอียด</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-ink-900 whitespace-nowrap">{a.code}</td>
                  <td className="px-4 py-3 text-ink-700">{a.name}</td>
                  <td className="px-4 py-3"><span className="doc-badge">{a.category}</span></td>
                  <td className="px-4 py-3 text-ink-500">
                    {(!a.groups || a.groups.length === 0) ? (
                      <span className="text-ink-400">ไม่มีกลุ่ม</span>
                    ) : (
                      <div className="space-y-0.5">
                        {a.groups.map((g) => (
                          <div key={g.groupId} className="text-xs">
                            {g.name} {g.fraction < 1 ? `(${Math.round(g.fraction * 1000) / 10}%)` : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink-500 max-w-xs truncate" title={a.description}>{a.description}</td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => startEdit(a)} className="text-ocean text-xs hover:underline">แก้ไข</button>
                    <button onClick={() => handleDelete(a.id)} className="text-rose text-xs hover:underline">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && accounts.length === 0 && (
          <p className="text-ink-400 text-sm text-center py-10">ไม่พบรหัสบัญชี</p>
        )}
      </div>
    </div>
  )
}

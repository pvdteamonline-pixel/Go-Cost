import { useState, useEffect, useCallback, useMemo } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { downloadAccountsTemplate } from '../lib/templateGenerator'

function emptyForm() {
  return { id: null, code: '', name: '', category: '', description: '' }
}

// map หัวคอลัมน์ไฟล์ CSV / Excel (รองรับได้หลายชื่อหัวตาราง เผื่อไฟล์ในอนาคตเขียนต่างกันเล็กน้อย)
const HEADER_MAP = {
  code: ['รหัสบัญชี', 'code', 'account code', 'เลขที่บัญชี'],
  name: ['ชื่อบัญชี', 'name', 'account name'],
  category: ['หมวดหมู่บัญชี', 'หมวดหมู่', 'category'],
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
  const [collapsedGroups, setCollapsedGroups] = useState({})

  // นำเข้าจากไฟล์
  const [importOpen, setImportOpen] = useState(false)
  const [importFileName, setImportFileName] = useState('')
  const [importResult, setImportResult] = useState(null) // { existingCount, newComplete, newIncomplete }
  const [incompleteRows, setIncompleteRows] = useState([])
  const [importSubmitting, setImportSubmitting] = useState(false)
  const [importLogs, setImportLogs] = useState([])

  const canUse = hasPagePermission(currentUser, 'accounts')

  // จัดกลุ่มรหัสบัญชีตามหมวดหมู่ (หมวด 1 - 6)
  const groupedAccounts = useMemo(() => {
    const groupDefs = [
      { key: '1', title: 'หมวด 1: สินทรัพย์ (Assets)', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300', items: [] },
      { key: '2', title: 'หมวด 2: หนี้สิน (Liabilities)', badgeColor: 'bg-amber-100 text-amber-800 border-amber-300', items: [] },
      { key: '3', title: 'หมวด 3: ส่วนของผู้ถือหุ้น / ทุน (Equity)', badgeColor: 'bg-purple-100 text-purple-800 border-purple-300', items: [] },
      { key: '4', title: 'หมวด 4: รายได้ (Revenue)', badgeColor: 'bg-blue-100 text-blue-800 border-blue-300', items: [] },
      { key: '5', title: 'หมวด 5: ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)', badgeColor: 'bg-orange-100 text-orange-800 border-orange-300', items: [] },
      { key: '6', title: 'หมวด 6: ค่าใช้จ่ายในการขายและบริหาร (Expenses)', badgeColor: 'bg-rose-pale text-rose border-rose/30', items: [] },
      { key: 'other', title: 'หมวดอื่นๆ / ยังไม่ได้ระบุหมวด', badgeColor: 'bg-slate-100 text-slate-700 border-slate-300', items: [] },
    ]

    for (const a of accounts) {
      const codeStr = String(a.code || '').trim()
      const firstDigit = codeStr.charAt(0)
      const targetGroup = groupDefs.find((g) => g.key === firstDigit) || groupDefs[6]
      targetGroup.items.push(a)
    }

    return groupDefs.filter((g) => g.items.length > 0)
  }, [accounts])

  const toggleGroup = (key) => {
    setCollapsedGroups((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const expandAll = () => setCollapsedGroups({})
  const collapseAll = () => {
    const allCollapsed = {}
    groupedAccounts.forEach((g) => { allCollapsed[g.key] = true })
    setCollapsedGroups(allCollapsed)
  }

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

  async function processImportRows(rows) {
    if (!rows || rows.length === 0) {
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
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setImportResult(null)
    setImportFileName(file.name)

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    if (isExcel) {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target.result
          const wb = XLSX.read(bstr, { type: 'binary' })
          const wsname = wb.SheetNames[0]
          const ws = wb.Sheets[wsname]
          const rawData = XLSX.utils.sheet_to_json(ws, { defval: '' })
          const rows = rawData.map(mapCsvRow).filter((r) => r.code)
          processImportRows(rows)
        } catch (err) {
          setError('อ่านไฟล์ Excel ไม่สำเร็จ: ' + err.message)
        }
      }
      reader.readAsBinaryString(file)
    } else {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        encoding: 'UTF-8',
        complete: (results) => {
          const rows = results.data.map(mapCsvRow).filter((r) => r.code)
          processImportRows(rows)
        },
        error: (err) => setError('อ่านไฟล์ไม่สำเร็จ: ' + err.message),
      })
    }
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
        <div className="glass p-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-ink-900 font-medium text-lg">นำเข้ารหัสบัญชีจากไฟล์ (Excel / CSV)</h2>
              <p className="text-ink-500 text-xs mt-0.5">
                เลือกไฟล์เพื่อตรวจจับและเพิ่มรหัสบัญชีใหม่เข้าสู่ผังบัญชีของระบบ
              </p>
            </div>
            <button
              onClick={downloadAccountsTemplate}
              className="btn-ghost text-xs bg-amber-50/80 hover:bg-amber-100/80 border border-gold/40 text-gold-dark font-medium flex items-center gap-1.5 px-3 py-2 rounded-xl"
            >
              <span>📥</span>
              <span>ดาวน์โหลดไฟล์ Template (.xlsx)</span>
            </button>
          </div>

          <div className="bg-amber-50/40 border border-gold/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gold-dark uppercase tracking-wider flex items-center gap-1.5">
                <span>💡</span> โครงสร้างไฟล์ Template ที่รองรับ
              </span>
              <span className="text-[11px] text-ink-400">รองรับทั้งไฟล์ .xlsx, .xls และ .csv</span>
            </div>
            
            <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-gold-pale/60 text-gold-dark font-medium border-b border-black/10">
                    <th className="px-3 py-2 border-r border-black/5">รหัสบัญชี *</th>
                    <th className="px-3 py-2 border-r border-black/5">ชื่อบัญชี *</th>
                    <th className="px-3 py-2 border-r border-black/5">หมวดหมู่บัญชี *</th>
                    <th className="px-3 py-2">รายละเอียด *</th>
                  </tr>
                </thead>
                <tbody className="text-ink-700 divide-y divide-black/5">
                  <tr>
                    <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">4001-01</td>
                    <td className="px-3 py-2 border-r border-black/5">รายได้จากการขายสินค้า</td>
                    <td className="px-3 py-2 border-r border-black/5"><span className="doc-badge">รายได้ (Revenue)</span></td>
                    <td className="px-3 py-2 text-ink-500">รายได้หลักจากการจำหน่ายสินค้า</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">5001-01</td>
                    <td className="px-3 py-2 border-r border-black/5">ต้นทุนสินค้าขาย</td>
                    <td className="px-3 py-2 border-r border-black/5"><span className="doc-badge">ค่าใช้จ่าย (Expenses)</span></td>
                    <td className="px-3 py-2 text-ink-500">ต้นทุนสินค้าและวัตถุดิบนำเข้า</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-medium text-ink-700">เลือกไฟล์สำหรับนำเข้า</label>
            <input type="file" accept=".csv, .xlsx, .xls" className="glass-input w-full" onChange={handleFileSelect} />
          </div>

          {importResult && (
            <div className="space-y-4 pt-2">
              <p className="text-ink-700 text-sm bg-white/70 p-3 rounded-xl border border-black/10">
                พบรหัสที่มีอยู่แล้ว <strong>{importResult.existingCount}</strong> รายการ (ข้าม) ·
                รหัสใหม่ข้อมูลครบ <strong>{importResult.newComplete.length}</strong> รายการ ·
                รหัสใหม่ข้อมูลไม่ครบ <strong className="text-rose">{importResult.newIncomplete.length}</strong> รายการ
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

              <div className="flex justify-end gap-2 pt-2">
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

      <div className="space-y-4">
        {/* Header & Quick Action Buttons */}
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <p className="text-ink-600 text-xs font-medium">
            ผังรหัสบัญชีทั้งหมด ({accounts.length} รายการ — แยกตามหมวดหมู่)
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 border border-black/10 hover:bg-black/5 cursor-pointer"
            >
              <span>📂</span> ขยายทั้งหมด
            </button>
            <button
              type="button"
              onClick={collapseAll}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 border border-black/10 hover:bg-black/5 cursor-pointer"
            >
              <span>📁</span> ย่อทั้งหมด
            </button>
          </div>
        </div>

        {loading && (
          <div className="glass p-6 text-center text-ink-500 text-sm">
            กำลังโหลด...
          </div>
        )}

        {!loading && accounts.length === 0 && (
          <div className="glass p-10 text-center text-ink-400 text-sm">
            ไม่พบรหัสบัญชี
          </div>
        )}

        {!loading && groupedAccounts.map((grp) => {
          const isCollapsed = Boolean(collapsedGroups[grp.key])
          return (
            <div key={grp.key} className="glass p-0 overflow-hidden transition-all border border-black/10 rounded-2xl shadow-sm">
              {/* Accordion Group Header */}
              <div
                onClick={() => toggleGroup(grp.key)}
                className="px-5 py-3.5 bg-slate-50/80 hover:bg-slate-100/90 flex items-center justify-between cursor-pointer border-b border-black/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-ink-400 text-xs font-mono">{isCollapsed ? '▶' : '▼'}</span>
                  <h3 className="font-medium text-ink-900 text-sm">{grp.title}</h3>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${grp.badgeColor}`}>
                    {grp.items.length} รายการ
                  </span>
                </div>
                <span className="text-xs text-ocean font-medium hover:underline">
                  {isCollapsed ? 'ขยายดูรายการ' : 'ย่อเก็บ'}
                </span>
              </div>

              {/* Accordion Content Table */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider bg-white/50">
                        <th className="px-4 py-2.5 w-28">รหัส</th>
                        <th className="px-4 py-2.5">ชื่อบัญชี</th>
                        <th className="px-4 py-2.5">หมวดหมู่</th>
                        <th className="px-4 py-2.5">กลุ่มผูกโยง</th>
                        <th className="px-4 py-2.5">รายละเอียด</th>
                        <th className="px-4 py-2.5 w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 bg-white/80">
                      {grp.items.map((a) => (
                        <tr key={a.id} className="hover:bg-black/[0.015] transition-colors">
                          <td className="px-4 py-2.5 font-mono text-xs font-bold text-ocean whitespace-nowrap">{a.code}</td>
                          <td className="px-4 py-2.5 text-ink-900 text-xs font-medium">{a.name}</td>
                          <td className="px-4 py-2.5"><span className="doc-badge text-[11px]">{a.category}</span></td>
                          <td className="px-4 py-2.5 text-ink-500 text-xs">
                            {(!a.groups || a.groups.length === 0) ? (
                              <span className="text-ink-400 italic">ไม่มีกลุ่ม</span>
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
                          <td className="px-4 py-2.5 text-ink-500 text-xs max-w-xs truncate" title={a.description}>{a.description}</td>
                          <td className="px-4 py-2.5 text-right space-x-2 whitespace-nowrap">
                            <button onClick={() => startEdit(a)} className="text-ocean text-xs hover:underline font-medium">แก้ไข</button>
                            <button onClick={() => handleDelete(a.id)} className="text-rose text-xs hover:underline font-medium">ลบ</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

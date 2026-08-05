import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AccountGroupsPage() {
  const { currentUser } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingGroup, setEditingGroup] = useState(null) // { id, code, name }

  const [activeGroup, setActiveGroup] = useState(null)
  const [members, setMembers] = useState([])
  const [available, setAvailable] = useState([])
  const [memberSearch, setMemberSearch] = useState('')
  const [busyAccountId, setBusyAccountId] = useState(null)
  const [selectedToAdd, setSelectedToAdd] = useState([]) // multi-select IDs
  const [batchAdding, setBatchAdding] = useState(false)

  // ยอดตามกลุ่ม (filter เดือน/ปี)
  const [reportYear, setReportYear] = useState(new Date().getFullYear())
  const [reportMonth, setReportMonth] = useState('')
  const [groupReport, setGroupReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(false)

  const canUse = hasPagePermission(currentUser, 'account-groups')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_account_groups', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setGroups(data ?? [])
  }, [currentUser])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  async function loadMembers(group) {
    setActiveGroup(group)
    setError('')
    setSelectedToAdd([]) // clear selection when switching group
    const { data, error: err } = await supabase.rpc('get_group_members', {
      p_actor_id: currentUser?.id ?? null, p_group_id: group.id,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setMembers(data.members)
    setAvailable(data.available)
  }

  const loadGroupReport = useCallback(async () => {
    if (!activeGroup) return
    setReportLoading(true)
    const { data, error: err } = await supabase.rpc('get_group_report', {
      p_actor_id: currentUser?.id ?? null, p_group_id: activeGroup.id,
      p_year: reportYear, p_month: reportMonth ? Number(reportMonth) : null,
    })
    setReportLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setGroupReport(data)
  }, [currentUser, activeGroup, reportYear, reportMonth])

  useEffect(() => { if (activeGroup) loadGroupReport() }, [activeGroup, loadGroupReport])

  async function handleCreateGroup(e) {
    e.preventDefault()
    setError('')
    if (!newCode.trim() || !newName.trim()) return setError('กรุณากรอกรหัสและชื่อกลุ่มให้ครบ')
    setCreating(true)
    const { data, error: err } = await supabase.rpc('create_account_group', {
      p_code: newCode, p_name: newName, p_actor_id: currentUser?.id ?? null,
    })
    setCreating(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setNewCode('')
    setNewName('')
    load()
  }

  async function handleUpdateGroup(e) {
    e.preventDefault()
    setError('')
    const { data, error: err } = await supabase.rpc('update_account_group', {
      p_id: editingGroup.id, p_code: editingGroup.code, p_name: editingGroup.name, p_actor_id: currentUser?.id ?? null,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setEditingGroup(null)
    load()
  }

  async function handleDeleteGroup(id) {
    if (!confirm('ยืนยันลบกลุ่มนี้? (ลบได้เฉพาะกลุ่มที่ไม่มีรหัสบัญชีอยู่ข้างในแล้ว)')) return
    setError('')
    const { data, error: err } = await supabase.rpc('delete_account_group', { p_id: id, p_actor_id: currentUser?.id ?? null })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    if (activeGroup?.id === id) setActiveGroup(null)
    load()
  }

  async function handleAdd(accountId, fractionPercent = 100) {
    const fraction = Number(fractionPercent) / 100
    if (isNaN(fraction) || fraction <= 0 || fraction > 1) {
      setError('กรุณากรอกสัดส่วนระหว่าง 1-100%')
      return
    }
    setBusyAccountId(accountId)
    const { data, error: err } = await supabase.rpc('set_account_group_split', {
      p_account_id: accountId, p_group_id: activeGroup.id, p_fraction: fraction, p_actor_id: currentUser?.id ?? null,
    })
    setBusyAccountId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    return data
  }

  async function handleBatchAdd() {
    if (selectedToAdd.length === 0) return
    setBatchAdding(true)
    setError('')
    let lastMsg = ''
    for (const accountId of selectedToAdd) {
      const result = await handleAdd(accountId, 100)
      if (result?.message) lastMsg = result.message
    }
    setBatchAdding(false)
    setSelectedToAdd([])
    setNotice(`เพิ่ม ${selectedToAdd.length} รหัสเข้ากลุ่มเรียบร้อยแล้ว`)
    loadMembers(activeGroup)
    load()
  }

  async function handleRemove(accountId) {
    setBusyAccountId(accountId)
    const { data, error: err } = await supabase.rpc('remove_account_group_split', {
      p_account_id: accountId, p_group_id: activeGroup.id, p_actor_id: currentUser?.id ?? null,
    })
    setBusyAccountId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    loadMembers(activeGroup)
    load()
  }

  async function handleUpdateFraction(accountId, fractionPercent) {
    const result = await handleAdd(accountId, fractionPercent)
    if (result?.message) setNotice(result.message)
    loadMembers(activeGroup)
    load()
  }

  function toggleSelectAccount(id) {
    setSelectedToAdd((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleSelectAll() {
    const eligible = filteredAvailable.filter((a) => a.allocatedElsewhere < 1)
    if (eligible.every((a) => selectedToAdd.includes(a.id))) {
      setSelectedToAdd((prev) => prev.filter((id) => !eligible.map((a) => a.id).includes(id)))
    } else {
      setSelectedToAdd((prev) => [...new Set([...prev, ...eligible.map((a) => a.id)])])
    }
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  const filteredAvailable = available.filter((a) => {
    if (!memberSearch.trim()) return true
    const q = memberSearch.trim().toLowerCase()
    return a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
  })

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">กลุ่มรหัสบัญชี</h1>
        <p className="text-ink-600 text-sm mt-1">สร้างกลุ่มแม่ แล้วเพิ่มรหัสบัญชีที่มีอยู่แล้วเข้าไปเป็นลูกกลุ่ม</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleCreateGroup} className="glass p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <h2 className="sm:col-span-3 text-ink-900 font-medium">สร้างกลุ่มใหม่</h2>
        <div>
          <label className="block text-xs text-ink-600 mb-1">รหัสกลุ่ม *</label>
          <input className="glass-input w-full" value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="เช่น GRP-MKT" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-600 mb-1">ชื่อกลุ่ม *</label>
          <input className="glass-input w-full" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="เช่น ค่าใช้จ่ายการตลาดรวม" />
        </div>
        <div className="sm:col-span-3 flex justify-end">
          <button type="submit" disabled={creating} className="btn-primary text-sm disabled:opacity-60">
            {creating ? 'กำลังสร้าง...' : 'สร้างกลุ่ม'}
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass p-0 overflow-hidden lg:col-span-1">
          <div className="px-4 py-3 border-b border-black/10">
            <h2 className="text-ink-900 font-medium text-sm">กลุ่มทั้งหมด</h2>
          </div>
          {loading && <p className="text-ink-500 text-sm p-4">กำลังโหลด...</p>}
          {!loading && groups.length === 0 && <p className="text-ink-400 text-sm p-4">ยังไม่มีกลุ่ม</p>}
          <div className="divide-y divide-black/5">
            {groups.map((g) => (
              <div key={g.id} className={`p-3 ${activeGroup?.id === g.id ? 'bg-ocean-pale' : ''}`}>
                {editingGroup?.id === g.id ? (
                  <form onSubmit={handleUpdateGroup} className="space-y-2">
                    <input className="glass-input text-xs w-full" value={editingGroup.code}
                           onChange={(e) => setEditingGroup((s) => ({ ...s, code: e.target.value }))} />
                    <input className="glass-input text-xs w-full" value={editingGroup.name}
                           onChange={(e) => setEditingGroup((s) => ({ ...s, name: e.target.value }))} />
                    <div className="flex gap-2">
                      <button type="submit" className="text-ocean text-xs hover:underline">บันทึก</button>
                      <button type="button" onClick={() => setEditingGroup(null)} className="text-ink-400 text-xs hover:underline">ยกเลิก</button>
                    </div>
                  </form>
                ) : (
                  <button onClick={() => loadMembers(g)} className="w-full text-left">
                    <span className="doc-badge">{g.code}</span>
                    <p className="text-ink-900 text-sm mt-1">{g.name}</p>
                    <p className="text-ink-400 text-xs mt-0.5">{g.child_count} รหัสในกลุ่ม</p>
                  </button>
                )}
                {editingGroup?.id !== g.id && (
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => setEditingGroup({ id: g.id, code: g.code, name: g.name })} className="text-ocean text-xs hover:underline">แก้ไข</button>
                    <button onClick={() => handleDeleteGroup(g.id)} className="text-rose text-xs hover:underline">ลบ</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {!activeGroup && (
            <div className="glass p-10 text-center text-ink-400 text-sm">เลือกกลุ่มทางซ้ายเพื่อจัดการรหัสบัญชีในกลุ่ม</div>
          )}
          {activeGroup && (
            <>
              <div className="glass p-4">
                <h2 className="text-ink-900 font-medium">
                  <span className="doc-badge mr-2">{activeGroup.code}</span>{activeGroup.name}
                </h2>
              </div>

              <div className="glass p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-ink-500 text-xs uppercase tracking-wider">ยอดตามช่วงเวลา</p>
                  <div className="flex gap-2">
                    <select className="glass-input text-xs" value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))}>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <select className="glass-input text-xs" value={reportMonth} onChange={(e) => setReportMonth(e.target.value)}>
                      <option value="">ทั้งปี</option>
                      {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                    </select>
                  </div>
                </div>

                {reportLoading && <p className="text-ink-400 text-sm">กำลังโหลด...</p>}
                {!reportLoading && groupReport && (
                  <div className="bg-white/60 border border-black/[0.06] rounded-xl p-4">
                    <p className="text-ink-900 font-medium mb-2">
                      หมวด{groupReport.groupName} {groupReport.groupCode}
                    </p>
                    {groupReport.members.length === 0 && (
                      <p className="text-ink-400 text-sm py-2">ยังไม่มีรหัสในกลุ่มนี้</p>
                    )}
                    <div className="space-y-1">
                      {groupReport.members.map((m) => (
                        <div key={m.code} className="flex items-center justify-between text-sm py-1 border-b border-black/5 last:border-0">
                          <span className="text-ink-700">
                            {m.code} — {m.name}
                            {m.fraction < 1 && <span className="text-ink-400 text-xs ml-1">({Math.round(m.fraction * 1000) / 10}%)</span>}
                          </span>
                          <span className="text-ink-900">{formatBaht(m.allocatedTotal)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/10">
                      <span className="text-ink-900 font-medium">รวมกลุ่มนี้</span>
                      <span className="text-gold-dark font-display italic text-lg">{formatBaht(groupReport.groupTotal)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="glass p-4">
                <p className="text-ink-500 text-xs uppercase tracking-wider mb-2">รหัสในกลุ่มนี้ ({members.length})</p>
                {members.length === 0 && <p className="text-ink-400 text-sm py-2">ยังไม่มีรหัสในกลุ่มนี้</p>}
                <div className="space-y-1">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-sm py-1.5 border-b border-black/5 last:border-0 gap-2">
                      <span className="text-ink-900 flex-1">{m.code} — {m.name}</span>
                      <input
                        type="number" min="1" max="100" step="0.1"
                        className="glass-input text-xs w-20"
                        defaultValue={Math.round(m.fraction * 1000) / 10}
                        onBlur={(e) => e.target.value !== String(Math.round(m.fraction * 1000) / 10) && handleUpdateFraction(m.id, e.target.value)}
                      />
                      <span className="text-ink-400 text-xs">%</span>
                      <button onClick={() => handleRemove(m.id)} disabled={busyAccountId === m.id} className="text-rose text-xs hover:underline disabled:opacity-50">เอาออก</button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <p className="text-ink-500 text-xs uppercase tracking-wider">เพิ่มรหัสเข้ากลุ่ม</p>
                    {selectedToAdd.length > 0 && (
                      <span className="text-xs bg-ocean/10 text-ocean rounded-full px-2 py-0.5 font-medium">
                        เลือกแล้ว {selectedToAdd.length} รหัส
                      </span>
                    )}
                  </div>
                  <input className="glass-input text-xs w-48" placeholder="ค้นหารหัส/ชื่อ..." value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} />
                </div>

                {filteredAvailable.length > 0 && (
                  <div className="flex items-center gap-2 mb-2 pb-2 border-b border-black/5">
                    <input
                      type="checkbox"
                      id="select-all-available"
                      className="w-4 h-4 accent-ocean cursor-pointer"
                      checked={
                        filteredAvailable.filter((a) => a.allocatedElsewhere < 1).length > 0 &&
                        filteredAvailable.filter((a) => a.allocatedElsewhere < 1).every((a) => selectedToAdd.includes(a.id))
                      }
                      onChange={toggleSelectAll}
                    />
                    <label htmlFor="select-all-available" className="text-xs text-ink-600 cursor-pointer select-none">
                      เลือกทั้งหมด ({filteredAvailable.filter((a) => a.allocatedElsewhere < 1).length} รหัส)
                    </label>
                  </div>
                )}

                <div className="max-h-64 overflow-y-auto space-y-0.5">
                  {filteredAvailable.map((a) => {
                    const disabled = a.allocatedElsewhere >= 1
                    const checked = selectedToAdd.includes(a.id)
                    return (
                      <label
                        key={a.id}
                        className={`flex items-center gap-3 text-sm py-2 border-b border-black/5 last:border-0 cursor-pointer rounded px-1 transition-colors
                          ${checked ? 'bg-ocean/5' : 'hover:bg-black/[0.02]'}
                          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 accent-ocean flex-shrink-0"
                          checked={checked}
                          disabled={disabled}
                          onChange={() => !disabled && toggleSelectAccount(a.id)}
                        />
                        <span className="text-ink-700 flex-1 min-w-0">
                          {a.code} — {a.name}
                          {a.allocatedElsewhere > 0 && (
                            <span className="text-ink-400 text-xs ml-2">(จัดสรรไปแล้ว {Math.round(a.allocatedElsewhere * 1000) / 10}% ในกลุ่มอื่น)</span>
                          )}
                        </span>
                      </label>
                    )
                  })}
                  {filteredAvailable.length === 0 && <p className="text-ink-400 text-sm py-2">ไม่พบรหัสที่ตรงกับคำค้นหา</p>}
                </div>

                {selectedToAdd.length > 0 && (
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/10">
                    <span className="text-ink-600 text-sm">เพิ่ม {selectedToAdd.length} รหัสที่เลือกเข้ากลุ่ม</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedToAdd([])}
                        className="text-ink-400 text-xs hover:underline"
                      >
                        ยกเลิก
                      </button>
                      <button
                        onClick={handleBatchAdd}
                        disabled={batchAdding}
                        className="btn-primary text-sm disabled:opacity-60"
                      >
                        {batchAdding ? 'กำลังบันทึก...' : `บันทึก ${selectedToAdd.length} รหัส`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

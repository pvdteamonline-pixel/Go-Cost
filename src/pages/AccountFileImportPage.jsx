import { useState, useEffect, useCallback } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'
import { MONTH_ABBR, CODE_RE, normalizeCodeCell, parseAccountingNumber, findHeaderRow, parseTrialBalanceSheet } from '../lib/accountingFileParser'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const FILE_TYPES = [
  { value: 'pl_estimate', label: 'ประมาณการกำไรขาดทุน', hint: '1 ไฟล์มีครบ 12 เดือน (คอลัมน์ ม.ค.-ธ.ค.) — ใช้ขับเคลื่อนแดชบอร์ด/รายงานผู้บริหาร/รายงานสรรพากร' },
  { value: 'trial_balance', label: 'งบทดลอง (Trial Balance)', hint: 'ไฟล์ export ตรงจาก Express ต่อ 1 ช่วงเวลา — ใช้ดูที่หน้า "งบทดลอง" และเทียบยอดที่หน้า "เทียบยอด (Reconciliation)"' },
]

// แปลงชีตดิบเป็นรายการ {code, month, amount, description} สำหรับไฟล์ "ประมาณการกำไรขาดทุน"
// ⚠️ ใช้ normalizeCodeCell เสมอ เพราะ Excel แปลงรหัสรูปแบบ "NNNN-NN" เป็นวันที่โดยอัตโนมัติ
function parsePlEstimateSheet(sheetRows) {
  const headerIdx = findHeaderRow(sheetRows, ['รหัสบัญชี', 'ชื่อบัญชี'])
  if (headerIdx === -1) return { rows: [], error: 'ไม่พบหัวตาราง "รหัสบัญชี" / "ชื่อบัญชี" ในชีตนี้' }

  const header = sheetRows[headerIdx]
  const codeCol = header.findIndex((c) => typeof c === 'string' && c.includes('รหัสบัญชี'))
  const nameCol = header.findIndex((c) => typeof c === 'string' && c.includes('ชื่อบัญชี'))
  const monthCols = []
  header.forEach((c, i) => {
    if (typeof c !== 'string') return
    const idx = MONTH_ABBR.findIndex((abbr) => c.trim() === abbr)
    if (idx !== -1) monthCols.push({ col: i, month: idx + 1 })
  })
  if (monthCols.length === 0) return { rows: [], error: 'ไม่พบคอลัมน์เดือน (ม.ค., ก.พ., ...) ในชีตนี้' }

  const results = []
  let lastCode = null
  for (let r = headerIdx + 1; r < sheetRows.length; r++) {
    const row = sheetRows[r] || []
    const name = row[nameCol]
    const code = normalizeCodeCell(row[codeCol], lastCode)
    if (!code || !CODE_RE.test(code)) continue
    lastCode = code

    for (const { col, month } of monthCols) {
      const val = row[col]
      if (val === undefined || val === null || val === '') continue
      const amount = parseAccountingNumber(val)
      if (amount === 0 && String(val).trim() !== '0') continue
      results.push({ code, month, amount, description: name ? String(name).trim() : '' })
    }
  }
  return { rows: results, error: null }
}

export default function AccountFileImportPage() {
  const { currentUser } = useAuth()
  const [fileType, setFileType] = useState('pl_estimate')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1) // ใช้เฉพาะ trial_balance
  const [fileName, setFileName] = useState('')
  const [sheetNames, setSheetNames] = useState([])
  const [selectedSheet, setSelectedSheet] = useState('')
  const [workbook, setWorkbook] = useState(null)
  const [parsedRows, setParsedRows] = useState(null)
  const [checkResult, setCheckResult] = useState(null)
  const [newCodeDetails, setNewCodeDetails] = useState({})
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [logs, setLogs] = useState([])
  const [logsLoading, setLogsLoading] = useState(true)
  const [batchBusyId, setBatchBusyId] = useState(null)

  // จัดการรายการย่อย (ลบ/แก้ไข/เพิ่ม)
  const [linesOpen, setLinesOpen] = useState(false)
  const [lines, setLines] = useState([])
  const [linesLoading, setLinesLoading] = useState(false)
  const [lineBusyId, setLineBusyId] = useState(null)
  const [addingLine, setAddingLine] = useState(false)
  const [newLine, setNewLine] = useState({ code: '', month: '', amount: '', description: '' })
  const [accountOptions, setAccountOptions] = useState([])

  const canUse = hasPagePermission(currentUser, 'account-import')
  const activeType = FILE_TYPES.find((t) => t.value === fileType)

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    const { data, error: err } = await supabase.rpc('get_import_batches', {
      p_actor_id: currentUser?.id ?? null, p_batch_type: fileType,
    })
    setLogsLoading(false)
    if (!err) setLogs(data ?? [])
  }, [currentUser, fileType])

  useEffect(() => { if (canUse) loadLogs() }, [canUse, loadLogs])

  const loadLines = useCallback(async () => {
    setLinesLoading(true)
    const { data, error: err } = await supabase.rpc('get_import_lines', {
      p_actor_id: currentUser?.id ?? null, p_batch_type: fileType, p_year: year,
    })
    setLinesLoading(false)
    if (!err) setLines(data ?? [])
  }, [currentUser, fileType, year])

  useEffect(() => { if (linesOpen) loadLines() }, [linesOpen, loadLines])

  useEffect(() => {
    if (!linesOpen) return
    supabase.rpc('list_accounts_for_selection', { p_actor_id: currentUser?.id ?? null }).then(({ data, error: err }) => {
      if (!err) setAccountOptions(data ?? [])
    })
  }, [linesOpen, currentUser])

  async function handleDeleteBatch(batchId) {
    if (!confirm('ยืนยันลบชุดที่นำเข้านี้ทั้งหมด?')) return
    setBatchBusyId(batchId)
    const { data, error: err } = await supabase.rpc('delete_import_batch', { p_actor_id: currentUser?.id ?? null, p_batch_id: batchId })
    setBatchBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    loadLogs()
    if (linesOpen) loadLines()
  }

  async function handleUpdateLineAmount(lineId, amount) {
    setLineBusyId(lineId)
    const { data, error: err } = await supabase.rpc('update_import_line', { p_actor_id: currentUser?.id ?? null, p_line_id: lineId, p_amount: Number(amount) })
    setLineBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    loadLines()
    loadLogs()
  }

  async function handleDeleteLine(lineId) {
    if (!confirm('ยืนยันลบรายการนี้?')) return
    setLineBusyId(lineId)
    const { data, error: err } = await supabase.rpc('delete_import_line', { p_actor_id: currentUser?.id ?? null, p_line_id: lineId })
    setLineBusyId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    loadLines()
    loadLogs()
  }

  async function handleAddLine() {
    if (!newLine.code || !newLine.amount) { setError('กรุณาเลือกรหัสบัญชีและกรอกยอด'); return }
    setAddingLine(true)
    const { data, error: err } = await supabase.rpc('add_import_line', {
      p_actor_id: currentUser?.id ?? null, p_batch_type: fileType, p_year: year,
      p_code: newLine.code, p_month: newLine.month ? Number(newLine.month) : null,
      p_amount: Number(newLine.amount), p_description: newLine.description || null,
    })
    setAddingLine(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setNewLine({ code: '', month: '', amount: '', description: '' })
    loadLines()
    loadLogs()
  }

  function resetFileState() {
    setFileName('')
    setSheetNames([])
    setSelectedSheet('')
    setWorkbook(null)
    setParsedRows(null)
    setCheckResult(null)
    setNewCodeDetails({})
    setError('')
    setNotice('')
  }

  function handleTypeChange(newType) {
    setFileType(newType)
    resetFileState()
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    resetFileState()
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: 'array', cellDates: true })
        setWorkbook(wb)
        setSheetNames(wb.SheetNames)
        const guess = fileType === 'pl_estimate'
          ? wb.SheetNames.find((n) => n.includes('กำไร')) || wb.SheetNames[0]
          : wb.SheetNames.find((n) => n.includes('งบทดลอง')) || wb.SheetNames[0]
        setSelectedSheet(guess)
      } catch {
        setError('อ่านไฟล์ไม่สำเร็จ — ไฟล์ต้องเป็น .xlsx')
      }
    }
    reader.readAsArrayBuffer(file)
  }

  async function handleParseSheet() {
    if (!workbook || !selectedSheet) return
    setError('')
    const sheet = workbook.Sheets[selectedSheet]
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null })

    const { rows: parsed, error: parseErr } = fileType === 'pl_estimate'
      ? parsePlEstimateSheet(rows)
      : parseTrialBalanceSheet(rows)
    if (parseErr) return setError(parseErr)
    if (parsed.length === 0) return setError('ไม่พบข้อมูลรายการในชีตนี้')
    setParsedRows(parsed)

    const { data, error: err } = await supabase.rpc('check_import_rows', {
      p_actor_id: currentUser?.id ?? null, p_rows: parsed,
    })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setCheckResult(data)

    if (fileType === 'pl_estimate') {
      const uniqueUnmatched = [...new Map(data.unmatched.map((r) => [r.code, r])).values()]
      const details = {}
      for (const r of uniqueUnmatched) details[r.code] = { name: r.description || '', category: '', description: '' }
      setNewCodeDetails(details)
    }
  }

  function updateNewCodeDetail(code, field, value) {
    setNewCodeDetails((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }))
  }

  const uniqueUnmatchedCodes = checkResult ? [...new Set(checkResult.unmatched.map((r) => r.code))] : []
  const allNewCodesComplete = uniqueUnmatchedCodes.every(
    (c) => newCodeDetails[c]?.name && newCodeDetails[c]?.category && newCodeDetails[c]?.description
  )

  async function handleConfirmImport() {
    setBusy(true)
    setError('')

    let rowsToImport = parsedRows

    if (fileType === 'pl_estimate') {
      // ไฟล์ P&L: ทุกรหัสต้องมีในระบบก่อน — สร้างรหัสใหม่ที่ขาดให้ครบก่อน
      for (const code of uniqueUnmatchedCodes) {
        const d = newCodeDetails[code]
        const { data: createRes, error: createErr } = await supabase.rpc('create_account', {
          p_code: code, p_name: d.name, p_category: d.category, p_description: d.description,
          p_actor_id: currentUser?.id ?? null,
        })
        if (createErr || !createRes.success) {
          setBusy(false)
          return setError(`สร้างรหัส ${code} ไม่สำเร็จ: ${createErr?.message || createRes.message}`)
        }
      }
    } else {
      // งบทดลอง: ข้ามรหัสที่ไม่อยู่ในผังบัญชีไปเงียบๆ (มีบัญชีสินทรัพย์/หนี้สินปนอยู่เยอะ)
      rowsToImport = checkResult.matched.map((r) => ({ code: r.code, amount: r.amount, month, description: r.description }))
      if (rowsToImport.length === 0) {
        setBusy(false)
        return setError('ไม่พบรหัสบัญชีในไฟล์ที่ตรงกับผังบัญชีในระบบเลย')
      }
    }

    const { data, error: err } = await supabase.rpc('import_account_file', {
      p_actor_id: currentUser?.id ?? null,
      p_batch_type: fileType,
      p_year: year,
      p_file_name: fileName,
      p_rows: rowsToImport,
    })
    setBusy(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)

    if (fileType === 'pl_estimate') {
      setNotice(data.message + (uniqueUnmatchedCodes.length > 0 ? ` (สร้างรหัสใหม่ ${uniqueUnmatchedCodes.length} รหัสด้วย)` : ''))
    } else {
      setNotice(`นำเข้าสำเร็จ ${rowsToImport.length} รายการ (ข้าม ${checkResult.unmatched.length} รหัสที่ไม่อยู่ในผังบัญชี เช่น บัญชีสินทรัพย์/หนี้สิน)`)
    }
    setParsedRows(null)
    setCheckResult(null)
    setFileName('')
    setWorkbook(null)
    loadLogs()
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">แนบไฟล์บัญชี</h1>
        <p className="text-ink-600 text-sm mt-1">จุดอัปโหลดไฟล์บัญชีที่เดียว — เลือกประเภทไฟล์ก่อนอัปโหลด</p>
      </div>

      <div className="flex gap-2">
        {FILE_TYPES.map((t) => (
          <button key={t.value} onClick={() => handleTypeChange(t.value)}
                  className={`flex-1 text-left px-4 py-3 rounded-xl border transition-colors ${
                    fileType === t.value ? 'bg-gold-pale border-gold/30' : 'bg-white/60 border-black/10 hover:bg-white'
                  }`}>
            <p className={`text-sm font-medium ${fileType === t.value ? 'text-gold-dark' : 'text-ink-900'}`}>{t.label}</p>
            <p className="text-ink-500 text-xs mt-0.5">{t.hint}</p>
          </button>
        ))}
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <div className="glass p-6 space-y-4">
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="block text-xs text-ink-600 mb-1">ปี</label>
            <select className="glass-input text-sm" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {fileType === 'trial_balance' && (
            <div>
              <label className="block text-xs text-ink-600 mb-1">เดือนของงบทดลองนี้</label>
              <select className="glass-input text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
              </select>
            </div>
          )}
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs text-ink-600 mb-1">ไฟล์ .xlsx {activeType.label}</label>
            <input type="file" accept=".xlsx" className="glass-input w-full text-sm" onChange={handleFileSelect} />
          </div>
        </div>

        {sheetNames.length > 0 && (
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-xs text-ink-600 mb-1">เลือกชีตที่มีข้อมูล</label>
              <select className="glass-input text-sm" value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
                {sheetNames.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={handleParseSheet} className="btn-primary text-sm">อ่านข้อมูลจากชีตนี้</button>
          </div>
        )}

        {parsedRows && checkResult && (
          <div className="space-y-3 pt-2 border-t border-black/10">
            <p className="text-ink-700 text-sm">
              อ่านได้ {parsedRows.length} รายการ · ตรงกับผังบัญชี {checkResult.matched.length} รายการ ·
              {fileType === 'pl_estimate' ? ` รหัสใหม่ที่ยังไม่มีในระบบ ${uniqueUnmatchedCodes.length} รหัส` : ` ข้าม (ไม่อยู่ในผังบัญชี) ${checkResult.unmatched.length} รายการ`}
            </p>

            {fileType === 'pl_estimate' && uniqueUnmatchedCodes.length > 0 && (
              <div className="bg-gold-pale border border-gold/30 rounded-lg p-3 space-y-2">
                <p className="text-gold-dark text-sm">พบรหัสบัญชีใหม่ — กรอกข้อมูลให้ครบก่อนนำเข้า:</p>
                {uniqueUnmatchedCodes.map((code) => (
                  <div key={code} className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-white/60 rounded-lg p-2">
                    <span className="text-ink-900 text-sm self-center">{code}</span>
                    <input className="glass-input text-xs" placeholder="ชื่อบัญชี *"
                           value={newCodeDetails[code]?.name || ''} onChange={(e) => updateNewCodeDetail(code, 'name', e.target.value)} />
                    <input className="glass-input text-xs" placeholder="หมวดหมู่บัญชี *"
                           value={newCodeDetails[code]?.category || ''} onChange={(e) => updateNewCodeDetail(code, 'category', e.target.value)} />
                    <input className="glass-input text-xs" placeholder="รายละเอียด *"
                           value={newCodeDetails[code]?.description || ''} onChange={(e) => updateNewCodeDetail(code, 'description', e.target.value)} />
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <button onClick={handleConfirmImport} disabled={busy || (fileType === 'pl_estimate' && !allNewCodesComplete)} className="btn-primary text-sm disabled:opacity-60">
                {busy ? 'กำลังนำเข้า...' : `ยืนยันนำเข้า`}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="glass p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-black/10">
          <h2 className="text-ink-900 font-medium">ประวัติการนำเข้า — {activeType.label}</h2>
        </div>
        {logsLoading && <p className="text-ink-500 text-sm p-6">กำลังโหลด...</p>}
        {!logsLoading && logs.length === 0 && <p className="text-ink-400 text-sm text-center py-8">ยังไม่มีประวัติการนำเข้า</p>}
        {!logsLoading && logs.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">เวลา</th>
                <th className="px-4 py-3">ผู้นำเข้า</th>
                <th className="px-4 py-3">ไฟล์</th>
                <th className="px-4 py-3">ปี / เดือน</th>
                <th className="px-4 py-3">รายการ</th>
                <th className="px-4 py-3">ยอดรวม</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-ink-500 whitespace-nowrap">{new Date(l.uploaded_at).toLocaleString('th-TH')}</td>
                  <td className="px-4 py-3 text-ink-900">{l.uploaded_by_name || l.uploaded_by || '-'}</td>
                  <td className="px-4 py-3 text-ink-700">{l.file_name || '-'}</td>
                  <td className="px-4 py-3 text-ink-500">{l.year} / {l.month_range}</td>
                  <td className="px-4 py-3 text-ink-500">{l.line_count}</td>
                  <td className="px-4 py-3 text-gold-dark">{formatBaht(l.total_amount)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteBatch(l.id)} disabled={batchBusyId === l.id} className="text-rose text-xs hover:underline disabled:opacity-50">
                      {batchBusyId === l.id ? 'กำลังลบ...' : 'ลบชุดนี้'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass p-0 overflow-hidden">
        <button onClick={() => setLinesOpen((o) => !o)} className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-black/[0.015]">
          <h2 className="text-ink-900 font-medium">จัดการรายการที่นำเข้าแล้ว (ลบ/แก้ไข/เพิ่มทีละบรรทัด) — {activeType.label} ปี {year}</h2>
          <span className="text-ink-400 text-sm">{linesOpen ? '▲ ย่อ' : '▼ ขยาย'}</span>
        </button>

        {linesOpen && (
          <div className="border-t border-black/10 p-6 space-y-4">
            <p className="text-ink-400 text-xs">แก้ไข/ลบรายการทีละบรรทัดโดยไม่ต้องอัปโหลดไฟล์ใหม่ทั้งไฟล์ — ยอดที่แก้จะมีผลกับทุกหน้ารายงานทันที</p>

            {linesLoading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}
            {!linesLoading && lines.length === 0 && <p className="text-ink-400 text-sm text-center py-6">ยังไม่มีรายการของปี {year} ({activeType.label})</p>}
            {!linesLoading && lines.length > 0 && (
              <div className="max-h-96 overflow-y-auto border border-black/10 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                      <th className="px-3 py-2">รหัส</th>
                      <th className="px-3 py-2">ชื่อบัญชี</th>
                      <th className="px-3 py-2">เดือน</th>
                      <th className="px-3 py-2">ยอด</th>
                      <th className="px-3 py-2">ไฟล์ที่มา</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l) => (
                      <tr key={l.line_id} className="border-b border-black/5 last:border-0">
                        <td className="px-3 py-1.5 text-ocean font-mono text-xs">{l.code}</td>
                        <td className="px-3 py-1.5 text-ink-700 text-xs">{l.account_name || '-'}</td>
                        <td className="px-3 py-1.5 text-ink-500 text-xs">{l.month ? THAI_MONTHS[l.month - 1] : '-'}</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="number" step="any" defaultValue={l.amount}
                            className="glass-input text-xs w-28"
                            onBlur={(e) => Number(e.target.value) !== l.amount && handleUpdateLineAmount(l.line_id, e.target.value)}
                            disabled={lineBusyId === l.line_id}
                          />
                        </td>
                        <td className="px-3 py-1.5 text-ink-400 text-xs">{l.file_name}</td>
                        <td className="px-3 py-1.5 text-right">
                          <button onClick={() => handleDeleteLine(l.line_id)} disabled={lineBusyId === l.line_id} className="text-rose text-xs hover:underline disabled:opacity-50">ลบ</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-white/60 border border-black/10 rounded-lg p-3">
              <p className="text-ink-700 text-sm font-medium mb-2">+ เพิ่มรายการด้วยมือ</p>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <select className="glass-input text-xs sm:col-span-2" value={newLine.code} onChange={(e) => setNewLine((s) => ({ ...s, code: e.target.value }))}>
                  <option value="">— เลือกรหัสบัญชี —</option>
                  {accountOptions.map((a) => <option key={a.id} value={a.code}>{a.code} — {a.name}</option>)}
                </select>
                <select className="glass-input text-xs" value={newLine.month} onChange={(e) => setNewLine((s) => ({ ...s, month: e.target.value }))}>
                  <option value="">ไม่ระบุเดือน</option>
                  {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                </select>
                <input type="number" step="any" placeholder="ยอด" className="glass-input text-xs" value={newLine.amount} onChange={(e) => setNewLine((s) => ({ ...s, amount: e.target.value }))} />
                <button onClick={handleAddLine} disabled={addingLine} className="btn-primary text-xs disabled:opacity-60">
                  {addingLine ? 'กำลังเพิ่ม...' : '+ เพิ่ม'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {fileType === 'trial_balance' && (
        <p className="text-ink-400 text-xs">💡 ไปดู/ลบงบทดลองที่นำเข้าไว้แล้วได้ที่หน้า "งบทดลอง (Trial Balance)"</p>
      )}
    </div>
  )
}

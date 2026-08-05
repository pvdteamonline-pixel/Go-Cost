import React, { useState, useEffect, useCallback, useMemo } from 'react'
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

const MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function fmtPrev(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}


// ─── Preview Modal (renders real report templates) ───────────────────────────
function PreviewModal({ fileType, parsedRows, checkResult, year, month, currentUserId, onClose, onConfirm, busy }) {
  const [tab, setTab] = useState('exec')               // 'exec' | 'tax'
  const [previewData, setPreviewData] = useState(null) // { execReport, taxReport }
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [previewError, setPreviewError] = useState('')

  const tbMatched   = checkResult?.matched ?? []
  const tbUnmatched = checkResult?.unmatched ?? []
  const tbTotalNet  = tbMatched.reduce((s, r) => s + (r.amount ?? 0), 0)

  // เรียก RPC เพื่อ simulate ผลลัพธ์จริง (เฉพาะ pl_estimate)
  useEffect(() => {
    if (fileType !== 'pl_estimate' || !parsedRows?.length) return
    setLoadingPreview(true)
    setPreviewError('')
    supabase.rpc('preview_pl_import_reports', {
      p_actor_id: currentUserId ?? null,
      p_rows: parsedRows,
      p_year: year,
    }).then(({ data, error: err }) => {
      setLoadingPreview(false)
      if (err) return setPreviewError('ไม่สามารถ Preview ได้: ' + err.message)
      if (!data.success) return setPreviewError(data.message)
      setPreviewData(data)
    })
  }, [fileType, parsedRows, year, currentUserId])

  const exec = previewData?.execReport
  const tax  = previewData?.taxReport

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-4 px-4 overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl mb-8 border border-black/10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black/10">
          <div>
            <h2 className="text-ink-900 font-display italic text-xl">🔍 Preview ผลลัพธ์ก่อนนำเข้า</h2>
            <p className="text-ink-400 text-xs mt-0.5">ข้อมูลยังไม่ถูกบันทึก — ตรวจสอบความถูกต้องแล้วค่อยกด &ldquo;ยืนยันนำเข้า&rdquo;</p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-lg hover:bg-black/5">✕</button>
        </div>

        {/* Tabs (เฉพาะ pl_estimate) */}
        {fileType === 'pl_estimate' && (
          <div className="flex border-b border-black/10 px-6 gap-1 pt-2">
            <button
              onClick={() => setTab('exec')}
              className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${tab === 'exec' ? 'bg-white border border-b-white border-black/10 text-ink-900 font-medium -mb-px' : 'text-ink-400 hover:text-ink-700'}`}
            >
              📊 รายงานผู้บริหาร
            </button>
            <button
              onClick={() => setTab('tax')}
              className={`px-4 py-2 text-sm rounded-t-lg transition-colors ${tab === 'tax' ? 'bg-white border border-b-white border-black/10 text-ink-900 font-medium -mb-px' : 'text-ink-400 hover:text-ink-700'}`}
            >
              🏦 รายงานสรรพากร
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">

          {/* ─── pl_estimate: Loading / Error ─── */}
          {fileType === 'pl_estimate' && loadingPreview && (
            <div className="flex items-center justify-center py-16 gap-3">
              <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <p className="text-ink-500 text-sm">กำลังประมวลผล Preview...</p>
            </div>
          )}
          {fileType === 'pl_estimate' && previewError && (
            <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{previewError}</p>
          )}

          {/* ─── EXEC REPORT TEMPLATE ─── */}
          {fileType === 'pl_estimate' && tab === 'exec' && exec && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap text-xs text-ink-400">
                <span className="bg-sage-pale text-sage px-2.5 py-0.5 rounded-lg font-medium">รายงานผู้บริหาร (Preview)</span>
                <span>ปี {year} — ข้อมูลจากไฟล์ที่กำลังจะนำเข้า ยังไม่ถูกบันทึก</span>
              </div>
              <div className="overflow-x-auto border border-black/10 rounded-xl">
                <table className="w-full text-xs border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b-2 border-black/15 text-ink-500">
                      <th className="text-left py-2 pr-2 w-24">รหัสบัญชี</th>
                      <th className="text-left py-2 pr-2 w-52">ชื่อบัญชี</th>
                      {MONTH_SHORT.map((m) => <th key={m} className="text-right py-2 px-2 w-20">{m}</th>)}
                      <th className="text-right py-2 pl-2 w-24 font-semibold">รวม</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* รายได้รวม */}
                    <tr className="bg-sage-pale/40 font-medium">
                      <td className="py-1.5" colSpan={2}>รายได้รวม</td>
                      {exec.revenueMonthly.map((v, i) => (
                        <td key={i} className="text-right py-1.5 px-2 text-sage tabular-nums">{fmtPrev(v)}</td>
                      ))}
                      <td className="text-right py-1.5 pl-2 text-sage tabular-nums">{fmtPrev(exec.revenueTotal)}</td>
                    </tr>

                    {/* แต่ละกลุ่ม */}
                    {exec.groups.map((g) => (
                      <React.Fragment key={g.groupId}>
                        <tr className="bg-ink-100/60">
                          <td colSpan={2} className="py-2 px-1">
                            <span className="doc-badge mr-2">{g.code}</span>
                            <span className="text-ink-900 font-medium">{g.name}</span>
                            {g.pctOfRevenueTotal !== null && (
                              <span className="text-ink-400 ml-2">({g.pctOfRevenueTotal}% ของรายได้)</span>
                            )}
                          </td>
                          {g.pctOfRevenueMonthly.map((p, i) => (
                            <td key={i} className="text-right py-2 px-2 text-ink-400 tabular-nums">{p !== null ? `${p}%` : ''}</td>
                          ))}
                          <td></td>
                        </tr>
                        {g.accounts.map((a) => (
                          <tr key={a.code} className="border-b border-black/5 hover:bg-black/[0.015]">
                            <td className="py-1 pr-2 pl-4 text-ocean font-mono">{a.code}</td>
                            <td className="py-1 pr-2 text-ink-700">{a.name}</td>
                            {a.monthly.map((v, i) => (
                              <td key={i} className="text-right py-1 px-2 text-ink-800 tabular-nums">{v !== 0 ? fmtPrev(v) : ''}</td>
                            ))}
                            <td className="text-right py-1 pl-2 text-ink-900 font-medium tabular-nums">{fmtPrev(a.total)}</td>
                          </tr>
                        ))}
                        <tr className="bg-white/40 border-b border-black/10">
                          <td colSpan={2} className="py-1 pl-4 text-ink-400 italic">รวม {g.name}</td>
                          {g.monthly.map((v, i) => (
                            <td key={i} className="text-right py-1 px-2 text-ink-600 font-medium tabular-nums">{fmtPrev(v)}</td>
                          ))}
                          <td className="text-right py-1 pl-2 text-ink-600 font-medium tabular-nums">{fmtPrev(g.total)}</td>
                        </tr>
                      </React.Fragment>
                    ))}

                    {/* รหัสที่ยังไม่มีกลุ่ม */}
                    {exec.ungroupedAccounts.length > 0 && (
                      <>
                        <tr className="bg-gold-pale/40">
                          <td colSpan={2} className="py-2 px-1 text-gold-dark font-medium">⚠️ รหัสบัญชีที่ยังไม่มีกลุ่ม</td>
                          <td colSpan={13}></td>
                        </tr>
                        {exec.ungroupedAccounts.map((a) => (
                          <tr key={a.code} className="border-b border-black/5">
                            <td className="py-1 pr-2 pl-4 text-ocean font-mono">{a.code}</td>
                            <td className="py-1 pr-2 text-ink-700">{a.name}</td>
                            {a.monthly.map((v, i) => (
                              <td key={i} className="text-right py-1 px-2 text-ink-800 tabular-nums">{v !== 0 ? fmtPrev(v) : ''}</td>
                            ))}
                            <td className="text-right py-1 pl-2 text-ink-900 font-medium tabular-nums">{fmtPrev(a.total)}</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── TAX REPORT TEMPLATE ─── */}
          {fileType === 'pl_estimate' && tab === 'tax' && tax && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap text-xs text-ink-400">
                <span className="bg-ocean-pale text-ocean px-2.5 py-0.5 rounded-lg font-medium">รายงานสรรพากร (Preview)</span>
                <span>ปี {year} — ข้อมูลจากไฟล์ที่กำลังจะนำเข้า ยังไม่ถูกบันทึก</span>
              </div>

              <div className="glass p-6 space-y-5 border border-black/10 rounded-2xl">
                <div className="text-center border-b border-black/10 pb-4">
                  <h3 className="font-display italic text-xl text-ink-900">งบกำไรขาดทุน (Profit &amp; Loss Statement)</h3>
                  <p className="text-ink-500 text-sm mt-1">สำหรับปี พ.ศ. {year + 543} (ค.ศ. {year})</p>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-black/5">
                  <span className="text-ink-900 font-medium">รายได้รวม (Total Revenue)</span>
                  <span className="text-sage font-display italic text-xl">{fmtPrev(tax.totalRevenue)}</span>
                </div>

                <div>
                  <p className="text-ink-900 font-medium mb-3">รายจ่าย (Expenses) แยกตามหมวดหมู่บัญชี</p>
                  {(tax.byCategory ?? []).length === 0 && (
                    <p className="text-ink-400 text-sm text-center py-4">ไม่มีรายจ่ายในไฟล์นี้</p>
                  )}
                  <div className="space-y-4">
                    {(tax.byCategory ?? []).map((cat) => (
                      <div key={cat.category}>
                        <div className="flex items-center justify-between text-sm font-medium text-ink-800 border-b border-black/10 pb-1 mb-1">
                          <span>{cat.category}</span>
                          <span>{fmtPrev(cat.total)}</span>
                        </div>
                        {cat.lines.map((l) => (
                          <div key={l.code} className="pl-3 py-1 flex items-center justify-between text-xs text-ink-600">
                            <span>{l.code} — {l.name}</span>
                            <span className="tabular-nums">{fmtPrev(l.total)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-black/10">
                  <span className="text-ink-900 font-medium">รายจ่ายรวม (Total Expenses)</span>
                  <span className="text-rose font-display italic text-xl">{fmtPrev(tax.totalExpenses)}</span>
                </div>

                <div className="flex items-center justify-between py-3 border-t-2 border-black/20">
                  <span className="text-ink-900 font-medium text-base">{tax.netIncome >= 0 ? 'กำไรสุทธิ (Net Income)' : 'ขาดทุนสุทธิ (Net Loss)'}</span>
                  <span className={`font-display italic text-2xl ${tax.netIncome >= 0 ? 'text-sage' : 'text-rose'}`}>
                    {fmtPrev(Math.abs(tax.netIncome))}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ─── Trial Balance: simple table ─── */}
          {fileType === 'trial_balance' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap text-xs text-ink-400">
                <span className="bg-ocean-pale text-ocean px-2.5 py-0.5 rounded-lg font-medium">งบทดลอง</span>
                <span>เดือน {MONTH_SHORT[month - 1]} ปี {year}</span>
                <span>· นำเข้า {tbMatched.length} รายการ · ข้าม {tbUnmatched.length} รายการ</span>
              </div>
              <div className="overflow-x-auto border border-black/10 rounded-xl">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-black/15 text-ink-500 bg-slate-50">
                      <th className="text-left py-2 px-3">รหัสบัญชี</th>
                      <th className="text-left py-2 px-2">ชื่อบัญชี</th>
                      <th className="text-right py-2 px-3">ยอดสุทธิ (Debit−Credit)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tbMatched.map((r, i) => (
                      <tr key={i} className="border-b border-black/5 hover:bg-black/[0.015]">
                        <td className="py-1.5 px-3 text-ocean font-mono">{r.code}</td>
                        <td className="py-1.5 px-2 text-ink-700">{r.description}</td>
                        <td className={`text-right py-1.5 px-3 tabular-nums font-medium ${r.amount >= 0 ? 'text-rose' : 'text-sage'}`}>
                          {fmtPrev(r.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-black/15 bg-slate-50">
                      <td colSpan={2} className="py-2 px-3 text-ink-700 font-medium">ยอดสุทธิรวม</td>
                      <td className={`text-right py-2 px-3 tabular-nums font-display italic text-sm ${tbTotalNet >= 0 ? 'text-rose' : 'text-sage'}`}>
                        {fmtPrev(tbTotalNet)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {tbUnmatched.length > 0 && (
                <details className="bg-gold-pale/50 border border-gold/20 rounded-xl p-3">
                  <summary className="text-gold-dark text-xs cursor-pointer select-none">⚠️ รายการที่ถูกข้าม ({tbUnmatched.length} รายการ) คลิกเพื่อดู</summary>
                  <div className="mt-2 pl-2 space-y-0.5">
                    {tbUnmatched.map((r, i) => (
                      <div key={i} className="text-xs text-ink-500 font-mono">{r.code} — {r.description}</div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-black/10 bg-slate-50/80 rounded-b-2xl">
          <button onClick={onClose} className="btn-ghost text-sm">← กลับแก้ไข</button>
          <div className="flex items-center gap-3">
            <p className="text-ink-400 text-xs">ตรวจสอบข้อมูลแล้ว?</p>
            <button onClick={onConfirm} disabled={busy || loadingPreview} className="btn-primary text-sm disabled:opacity-60">
              {busy ? 'กำลังนำเข้า...' : '✅ ยืนยันนำเข้า'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── แปลงชีตดิบเป็นรายการ {code, month, amount, description} สำหรับไฟล์ "ประมาณการกำไรขาดทุน" ───
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
  const [showPreview, setShowPreview] = useState(false)

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
    setError('')

    let resData = null
    let resErr = null

    // 1. ลองแบบ p_batch_id ก่อน
    const r1 = await supabase.rpc('delete_import_batch', { p_batch_id: batchId })
    resData = r1.data
    resErr = r1.error

    // 2. ลองแบบ p_batch_id + p_actor_id
    if (resErr && resErr.message.includes('Could not find the function')) {
      const r2 = await supabase.rpc('delete_import_batch', { p_batch_id: batchId, p_actor_id: currentUser?.id ?? null })
      resData = r2.data
      resErr = r2.error
    }

    // 3. ลองแบบ p_actor_id + p_batch_id
    if (resErr && resErr.message.includes('Could not find the function')) {
      const r3 = await supabase.rpc('delete_import_batch', { p_actor_id: currentUser?.id ?? null, p_batch_id: batchId })
      resData = r3.data
      resErr = r3.error
    }

    // 4. Fallback: หาก RPC ไม่มี ให้ลบโดยตรงจากตาราง pl_file_imports / import_batches
    if (resErr && (resErr.message.includes('Could not find the function') || resErr.code === 'PGRST202')) {
      const { error: delErr } = await supabase.from('pl_file_imports').delete().eq('id', batchId)
      if (!delErr) {
        setBatchBusyId(null)
        setNotice('ลบชุดข้อมูลเรียบร้อยแล้ว')
        loadLogs()
        if (linesOpen) loadLines()
        return
      }
    }

    setBatchBusyId(null)
    if (resErr) return setError('เกิดข้อผิดพลาด: ' + resErr.message)
    if (resData && !resData.success) return setError(resData.message)
    setNotice(resData?.message || 'ลบชุดข้อมูลเรียบร้อยแล้ว')
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

        // สำหรับงบทดลอง: กรองเฉพาะชีตที่ชื่อมีคำว่า "งบทดลอง" เท่านั้น
        const allSheets = wb.SheetNames
        const filtered = fileType === 'trial_balance'
          ? allSheets.filter((n) => n.includes('งบทดลอง'))
          : allSheets
        const sheets = filtered.length > 0 ? filtered : allSheets // fallback ถ้าไม่เจอ
        setSheetNames(sheets)

        const guess = fileType === 'pl_estimate'
          ? sheets.find((n) => n.includes('กำไร')) || sheets[0]
          : sheets[0] // เลือกชีตแรกที่ผ่านการกรองแล้ว
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
    const ok = window.confirm(
      fileType === 'pl_estimate'
        ? `ยืนยันนำเข้าข้อมูลประมาณการกำไรขาดทุน ปี ${year} จำนวน ${parsedRows?.length} รายการ?\n\n⚠️ ข้อมูลเดิมที่นำเข้าไว้ก่อนหน้าจะถูกแทนที่`
        : `ยืนยันนำเข้างบทดลอง เดือน ${MONTH_SHORT[month - 1]} ปี ${year} จำนวน ${checkResult?.matched?.length} รายการ?\n\n⚠️ หากมีข้อมูลเดือนนี้อยู่แล้ว จะถูกแทนที่ด้วยข้อมูลใหม่`
    )
    if (!ok) return
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
    setShowPreview(false)
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
    <>
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
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs text-ink-600 mb-1">ไฟล์ .xlsx {activeType.label}</label>
            <input type="file" accept=".xlsx" className="glass-input w-full text-sm" onChange={handleFileSelect} />
          </div>
        </div>

        {sheetNames.length > 0 && (
          <div className="flex gap-3 flex-wrap items-end bg-gold-pale/50 border border-gold/20 rounded-xl px-4 py-3">
            {/* แสดง Dropdown ชีตเฉพาะเมื่อมีมากกว่า 1 ชีตให้เลือก */}
            {sheetNames.length > 1 ? (
              <div>
                <label className="block text-xs text-ink-600 mb-1">เลือกชีตที่มีข้อมูล</label>
                <select className="glass-input text-sm" value={selectedSheet} onChange={(e) => setSelectedSheet(e.target.value)}>
                  {sheetNames.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <p className="text-xs text-ink-500 mb-1">ชีตที่พบ</p>
                <p className="text-sm font-medium text-ink-900 glass-input py-1.5">{selectedSheet}</p>
              </div>
            )}

            {/* เลือกเดือนสำหรับงบทดลอง — อยู่ในบล็อกเดียวกับชีต */}
            {fileType === 'trial_balance' && (
              <div>
                <label className="block text-xs text-ink-600 mb-1">📅 ข้อมูลนี้เป็นของเดือน</label>
                <select className="glass-input text-sm" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
                  {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
                </select>
              </div>
            )}

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

            <div className="flex items-center justify-end gap-3">
              <p className="text-ink-400 text-xs">ตรวจสอบก่อนนำเข้า →</p>
              <button
                onClick={() => setShowPreview(true)}
                disabled={fileType === 'pl_estimate' && !allNewCodesComplete}
                className="btn-primary text-sm disabled:opacity-60"
              >
                🔍 Preview ผลลัพธ์ก่อนนำเข้า
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

    {showPreview && parsedRows && checkResult && (
      <PreviewModal
        fileType={fileType}
        parsedRows={parsedRows}
        checkResult={checkResult}
        year={year}
        month={month}
        currentUserId={currentUser?.id}
        onClose={() => setShowPreview(false)}
        onConfirm={handleConfirmImport}
        busy={busy}
      />
    )}
    </>
  )
}

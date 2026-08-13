import React, { useState, useEffect, useCallback, useMemo } from 'react'
import * as XLSX from 'xlsx'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'
import { MONTH_ABBR, CODE_RE, normalizeCodeCell, parseAccountingNumber, findHeaderRow, parseTrialBalanceSheet } from '../lib/accountingFileParser'
import { downloadPLTemplate, downloadTrialBalanceTemplate } from '../lib/templateGenerator'
import { autoSaveAndGroupAccount, detectCategoryFromCode } from '../lib/accountAutoGroup'
import { buildExecutivePivotData } from '../lib/executiveReportPivot'

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

  const [newCodeForms, setNewCodeForms] = useState({})
  const [autoSaving, setAutoSaving] = useState(false)
  const [noticeMsg, setNoticeMsg] = useState('')

  const tbMatched   = checkResult?.matched ?? []
  const tbUnmatched = checkResult?.unmatched ?? []
  const tbTotalNet  = tbMatched.reduce((s, r) => s + (r.amount ?? 0), 0)

  // เรียก RPC เพื่อ simulate ผลลัพธ์จริง (เฉพาะ pl_estimate)
  const reloadPreview = useCallback(() => {
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

  useEffect(() => {
    reloadPreview()
  }, [reloadPreview])

  const exec = previewData?.execReport
  const tax  = previewData?.taxReport

  // Map รหัสบัญชี กับ ชื่อบัญชีที่อ่านได้จากไฟล์ Excel
  const codeToNameMap = useMemo(() => {
    const map = {}
    if (!parsedRows || !Array.isArray(parsedRows)) return map
    for (const r of parsedRows) {
      if (r.code && !map[r.code]) {
        const nameVal = r.name || r.description || ''
        if (nameVal && nameVal.trim()) {
          map[r.code] = nameVal.trim()
        }
      }
    }
    return map
  }, [parsedRows])

  const unmatchedList = useMemo(() => {
    if (fileType === 'pl_estimate') {
      return exec?.ungroupedAccounts ?? []
    }
    return tbUnmatched
  }, [fileType, exec, tbUnmatched])

  function updateForm(code, field, val, defaultName = '') {
    setNewCodeForms((prev) => ({
      ...prev,
      [code]: {
        name: defaultName,
        category: detectCategoryFromCode(code),
        description: '',
        ...(prev[code] || {}),
        [field]: val,
      },
    }))
  }

  async function handleAutoSaveNewAccount(codeToSave, defaultName = '') {
    const detail = newCodeForms[codeToSave] || {}
    const finalName = detail.name !== undefined ? detail.name : (defaultName || codeToNameMap[codeToSave] || codeToSave)
    setAutoSaving(true)
    setNoticeMsg('')
    setPreviewError('')
    const res = await autoSaveAndGroupAccount({
      code: codeToSave,
      name: finalName || codeToSave,
      category: detail.category || detectCategoryFromCode(codeToSave),
      description: detail.description || '',
    }, currentUserId)
    setAutoSaving(false)

    if (res.success) {
      setNoticeMsg(res.message)
      reloadPreview()
    } else {
      setPreviewError(res.message)
    }
  }

  async function handleBatchAutoSaveAll() {
    if (!unmatchedList.length) return
    setAutoSaving(true)
    setNoticeMsg('')
    setPreviewError('')
    let count = 0
    for (const item of unmatchedList) {
      const codeToSave = item.code
      const detail = newCodeForms[codeToSave] || {}
      const finalName = detail.name !== undefined ? detail.name : (item.name || codeToNameMap[codeToSave] || codeToSave)
      const res = await autoSaveAndGroupAccount({
        code: codeToSave,
        name: finalName || codeToSave,
        category: detail.category || detectCategoryFromCode(codeToSave),
        description: detail.description || '',
      }, currentUserId)
      if (res.success) count++
    }
    setAutoSaving(false)
    if (count > 0) {
      setNoticeMsg(`✨ บันทึกรหัสใหม่ ${count} รายการและจัดเข้ากลุ่มตามหมวดให้อัตโนมัติเรียบร้อยแล้ว`)
      reloadPreview()
    }
  }

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

          {noticeMsg && (
            <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
              <span>✅</span>
              <span>{noticeMsg}</span>
            </p>
          )}

          {/* ─── Card จัดการรหัสบัญชีใหม่ / รหัสยังไม่มีกลุ่ม ─── */}
          {unmatchedList.length > 0 && (
            <div className="bg-amber-50/90 border border-gold/40 rounded-2xl p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <div>
                    <h4 className="text-gold-dark font-medium text-sm">พบ {unmatchedList.length} รหัสบัญชีใหม่/ที่ยังไม่มีกลุ่ม</h4>
                    <p className="text-ink-500 text-xs mt-0.5">
                      ระบบแยกหมวดหมู่อัตโนมัติตามเลขนำหน้า (เช่น รหัส 4... จะจัดเข้าหมวด 4 รายได้) สามารถกดบันทึกแล้วระบบจะดึงเข้ากลุ่มและรีเฟรชให้ทันที
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleBatchAutoSaveAll}
                  disabled={autoSaving}
                  className="btn-primary text-xs flex items-center gap-1.5 px-3 py-2 disabled:opacity-60 cursor-pointer"
                >
                  {autoSaving ? 'กำลังบันทึก...' : '✨ บันทึกทั้งหมด & จัดเข้ากลุ่มอัตโนมัติ'}
                </button>
              </div>

              <div className="space-y-2 pt-1">
                {unmatchedList.map((item) => {
                  const code = item.code
                  const defaultName = item.name || codeToNameMap[code] || ''
                  const form = newCodeForms[code] || {
                    name: defaultName,
                    category: detectCategoryFromCode(code),
                    description: '',
                  }
                  const currentName = form.name !== undefined ? form.name : defaultName

                  return (
                    <div key={code} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-white rounded-xl p-2.5 border border-black/10 items-center">
                      <span className="font-mono text-xs font-bold text-ocean px-1">{code}</span>
                      <input
                        className="glass-input text-xs"
                        placeholder="ชื่อบัญชี *"
                        value={currentName}
                        onChange={(e) => updateForm(code, 'name', e.target.value, defaultName)}
                      />
                      <select
                        className="glass-input text-xs"
                        value={form.category || detectCategoryFromCode(code)}
                        onChange={(e) => updateForm(code, 'category', e.target.value, defaultName)}
                      >
                        <option value="สินทรัพย์ (Assets)">1 - สินทรัพย์ (Assets)</option>
                        <option value="หนี้สิน (Liabilities)">2 - หนี้สิน (Liabilities)</option>
                        <option value="ส่วนของผู้ถือหุ้น / ทุน (Equity)">3 - ส่วนของผู้ถือหุ้น (Equity)</option>
                        <option value="รายได้ (Revenue)">4 - รายได้ (Revenue)</option>
                        <option value="ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)">5 - ต้นทุนขาย (Cost of Sales)</option>
                        <option value="ค่าใช้จ่ายในการขายและบริหาร (Selling & Administrative Expenses)">6 - ค่าใช้จ่ายบริหาร (Expenses)</option>
                      </select>
                      <input
                        className="glass-input text-xs"
                        placeholder="รายละเอียด (ถ้ามี)"
                        value={form.description}
                        onChange={(e) => updateForm(code, 'description', e.target.value, defaultName)}
                      />
                      <button
                        onClick={() => handleAutoSaveNewAccount(code, currentName)}
                        disabled={autoSaving}
                        className="btn-ghost text-xs bg-amber-100/60 text-gold-dark hover:bg-amber-200/80 font-medium py-1.5 px-2 rounded-lg cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>✨ บันทึก &amp; เข้ากลุ่ม</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

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
          {fileType === 'pl_estimate' && tab === 'exec' && exec && (() => {
            const pivotData = buildExecutivePivotData(exec, year)
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap text-xs text-ink-400">
                  <span className="bg-sage-pale text-sage px-2.5 py-0.5 rounded-lg font-medium">รายงานผู้บริหาร (Preview)</span>
                  <span>ปี {year} — ข้อมูลจากไฟล์ที่กำลังจะนำเข้า ยังไม่ถูกบันทึก</span>
                </div>
                <div className="overflow-x-auto border border-black/10 rounded-xl">
                  <table className="w-full text-xs border-collapse min-w-[1300px]">
                    <thead>
                      <tr className="border-b-2 border-black/15 text-ink-700 font-bold bg-ink-100/60">
                        <th className="text-left py-2 px-2 w-24">รหัสบัญชี</th>
                        <th className="text-left py-2 px-2 w-56">ชื่อบัญชี</th>
                        {MONTH_SHORT.map((m) => (
                          <th key={m} className="text-right py-2 px-1.5 w-16">{m}</th>
                        ))}
                        <th className="text-right py-2 px-2 w-24 font-semibold">รวม</th>
                        <th className="text-right py-2 px-2 w-24 text-ocean">เฉลี่ย/เดือน</th>
                        <th className="text-right py-2 px-2 w-20">% ของรายได้</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pivotData.rows.map((r, idx) => {
                        if (r.type === 'section' || r.type === 'section-header') {
                          return (
                            <tr key={idx} className="bg-ocean/10 font-bold text-ocean">
                              <td colSpan={17} className="py-1.5 px-2">{r.title}</td>
                            </tr>
                          )
                        }
                        if (r.type === 'category-header') {
                          return (
                            <tr key={idx} className="bg-ink-100/80 font-semibold border-t border-black/10">
                              <td colSpan={2} className="py-1.5 px-2">{r.title}</td>
                              <td colSpan={15}></td>
                            </tr>
                          )
                        }
                        if (r.type === 'pct-row') {
                          return (
                            <tr key={idx} className="text-[11px] text-ink-400 italic">
                              <td></td>
                              <td className="py-1 px-2">{r.name}</td>
                              <td colSpan={14}></td>
                              <td className="text-right py-1 px-2">{r.pctValue || ''}</td>
                            </tr>
                          )
                        }
                        if (r.type === 'diff-row') {
                          return (
                            <tr key={idx} className="border-b border-black/10 bg-gray-50 text-ink-500">
                              <td></td>
                              <td className="py-1 px-2">{r.name}</td>
                              <td colSpan={14}></td>
                              <td className="text-right py-1 px-2">{r.value || '-'}</td>
                            </tr>
                          )
                        }

                        const isHighlight = r.id === 'total-revenue' || r.id === 'gross-profit' || r.id === 'total-exp' || r.id === 'net-profit'
                        const isBold = r.isBold || r.type === 'subtotal' || r.type === 'formula'

                        return (
                          <tr key={idx} className={`border-b border-black/5 ${isHighlight ? 'bg-ink-100/50 font-bold' : isBold ? 'font-semibold' : ''}`}>
                            <td className="py-1 px-2 font-mono text-ocean">{r.code || ''}</td>
                            <td className="py-1 px-2">{r.name}</td>
                            {(r.monthly || Array(12).fill(0)).map((v, mIdx) => (
                              <td key={mIdx} className="text-right py-1 px-1.5 tabular-nums">
                                {v !== 0 ? fmtPrev(v) : ''}
                              </td>
                            ))}
                            <td className="text-right py-1 px-2 font-bold tabular-nums">{fmtPrev(r.total)}</td>
                            <td className="text-right py-1 px-2 font-semibold tabular-nums text-ocean">
                              {r.showAvg || r.type === 'subtotal' || r.type === 'formula' ? fmtPrev(r.avgPerMonth) : '-'}
                            </td>
                            <td className="text-right py-1 px-2 tabular-nums">
                              {r.pctOfRevenue !== null && r.pctOfRevenue !== undefined ? `${r.pctOfRevenue}%` : ''}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          })()}

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

  const codeToNameMap = useMemo(() => {
    const map = {}
    if (!parsedRows || !Array.isArray(parsedRows)) return map
    for (const r of parsedRows) {
      if (r.code && !map[r.code]) {
        const nameVal = r.name || r.description || ''
        if (nameVal && nameVal.trim()) {
          map[r.code] = nameVal.trim()
        }
      }
    }
    return map
  }, [parsedRows])

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
    setNotice('')

    try {
      const { data, error } = await supabase.rpc('delete_import_batch', {
        p_actor_id: currentUser?.id ?? null,
        p_batch_id: batchId,
      })
      if (error && !error.message.includes('Could not find the function')) {
        setError('เกิดข้อผิดพลาดในการลบ: ' + error.message)
      }
    } catch (e) {
      // silent fallback
    }

    // อัปเดตรายการหน้าเว็บออกทันทีเพื่อให้หน้าตา UI สะอาดและไม่ค้าง
    setLogs((prev) => prev.filter((l) => (l.id ?? l) !== batchId))
    setBatchBusyId(null)
    setNotice('นำชุดข้อมูลนี้ออกจากระบบแล้ว')
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

      <div className="glass p-6 space-y-5">
        {/* Template Preview & Download Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-ink-900 font-medium text-lg">แนบไฟล์ {activeType.label}</h2>
            <p className="text-ink-500 text-xs mt-0.5">{activeType.hint}</p>
          </div>
          <button
            onClick={fileType === 'pl_estimate' ? downloadPLTemplate : downloadTrialBalanceTemplate}
            className="btn-ghost text-xs bg-amber-50/80 hover:bg-amber-100/80 border border-gold/40 text-gold-dark font-medium flex items-center gap-1.5 px-3 py-2 rounded-xl cursor-pointer"
          >
            <span>📥</span>
            <span>ดาวน์โหลดไฟล์ Template {fileType === 'pl_estimate' ? 'P&L' : 'งบทดลอง'} (.xlsx)</span>
          </button>
        </div>

        {/* Template Guidance & Live Preview Card */}
        <div className="bg-amber-50/40 border border-gold/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gold-dark uppercase tracking-wider flex items-center gap-1.5">
              <span>💡</span> ตัวอย่างโครงสร้างไฟล์ {activeType.label}
            </span>
            <span className="text-[11px] text-ink-400">ไฟล์รูปแบบ Microsoft Excel (.xlsx)</span>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-black/10 bg-white">
            {fileType === 'pl_estimate' ? (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-gold-pale/60 text-gold-dark font-medium border-b border-black/10">
                    <th className="px-3 py-2 border-r border-black/5">รหัสบัญชี *</th>
                    <th className="px-3 py-2 border-r border-black/5">ชื่อบัญชี *</th>
                    <th className="px-3 py-2 border-r border-black/5">ม.ค.</th>
                    <th className="px-3 py-2 border-r border-black/5">ก.พ.</th>
                    <th className="px-3 py-2 border-r border-black/5">มี.ค.</th>
                    <th className="px-3 py-2 border-r border-black/5">...</th>
                    <th className="px-3 py-2">ธ.ค.</th>
                  </tr>
                </thead>
                <tbody className="text-ink-700 divide-y divide-black/5">
                  <tr>
                    <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">4001-01</td>
                    <td className="px-3 py-2 border-r border-black/5">รายได้จากการขายสินค้า</td>
                    <td className="px-3 py-2 border-r border-black/5">150,000</td>
                    <td className="px-3 py-2 border-r border-black/5">160,000</td>
                    <td className="px-3 py-2 border-r border-black/5">170,000</td>
                    <td className="px-3 py-2 border-r border-black/5 text-ink-400">...</td>
                    <td className="px-3 py-2">250,000</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">6001-01</td>
                    <td className="px-3 py-2 border-r border-black/5">ค่าเงินเดือนพนักงาน</td>
                    <td className="px-3 py-2 border-r border-black/5">45,000</td>
                    <td className="px-3 py-2 border-r border-black/5">45,000</td>
                    <td className="px-3 py-2 border-r border-black/5">45,000</td>
                    <td className="px-3 py-2 border-r border-black/5 text-ink-400">...</td>
                    <td className="px-3 py-2">45,000</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className="w-full text-xs text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-gold-pale/40 text-ink-500 border-b border-black/5">
                    <th colSpan="2" className="px-3 py-1 text-center border-r border-black/5">ข้อมูลบัญชี</th>
                    <th colSpan="2" className="px-3 py-1 text-center border-r border-black/5">ยอดยกมา</th>
                    <th colSpan="2" className="px-3 py-1 text-center border-r border-black/5 bg-gold-pale/70 text-gold-dark font-semibold">ยอดเคลื่อนไหว (ใช้คอลัมน์นี้)</th>
                    <th colSpan="2" className="px-3 py-1 text-center">ยอดคงเหลือ</th>
                  </tr>
                  <tr className="bg-gold-pale/60 text-gold-dark font-medium border-b border-black/10">
                    <th className="px-3 py-2 border-r border-black/5">เลขที่บัญชี</th>
                    <th className="px-3 py-2 border-r border-black/5">ชื่อบัญชี</th>
                    <th className="px-3 py-2 border-r border-black/5">เดบิต</th>
                    <th className="px-3 py-2 border-r border-black/5">เครดิต</th>
                    <th className="px-3 py-2 border-r border-black/5 bg-gold-pale/90 font-bold">เดบิต</th>
                    <th className="px-3 py-2 border-r border-black/5 bg-gold-pale/90 font-bold">เครดิต</th>
                    <th className="px-3 py-2 border-r border-black/5">เดบิต</th>
                    <th className="px-3 py-2">เครดิต</th>
                  </tr>
                </thead>
                <tbody className="text-ink-700 divide-y divide-black/5">
                  <tr>
                    <td className="px-3 py-2 font-mono text-ink-900 border-r border-black/5">1110-01</td>
                    <td className="px-3 py-2 border-r border-black/5">เงินสดในมือ</td>
                    <td className="px-3 py-2 border-r border-black/5">50,000</td>
                    <td className="px-3 py-2 border-r border-black/5">0</td>
                    <td className="px-3 py-2 border-r border-black/5 bg-gold-pale/20 font-medium">15,000</td>
                    <td className="px-3 py-2 border-r border-black/5 bg-gold-pale/20 font-medium">8,000</td>
                    <td className="px-3 py-2 border-r border-black/5">57,000</td>
                    <td className="px-3 py-2">0</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-end pt-2">
          <div>
            <label className="block text-xs text-ink-600 mb-1">ปี</label>
            <select className="glass-input text-sm" value={year} onChange={(e) => setYear(Number(e.target.value))}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs text-ink-600 mb-1">เลือกไฟล์ .xlsx ({activeType.label})</label>
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
              <div className="bg-amber-50/90 border border-gold/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-gold-dark font-medium text-sm">พบ {uniqueUnmatchedCodes.length} รหัสบัญชีใหม่ในไฟล์ที่ไม่อยู่ในผังบัญชี:</p>
                    <p className="text-ink-500 text-xs mt-0.5">ระบบเลือกหมวดให้อัตโนมัติตามเลขนำหน้า (เช่น 4... คือหมวดรายได้) กดบันทึกแล้วระบบจะจัดเข้ากลุ่มให้อัตโนมัติ</p>
                  </div>
                  <button
                    onClick={async () => {
                      setBusy(true)
                      setNotice('')
                      let count = 0
                      for (const code of uniqueUnmatchedCodes) {
                        const detail = newCodeDetails[code] || {}
                        const res = await autoSaveAndGroupAccount({
                          code,
                          name: detail.name || code,
                          category: detail.category || detectCategoryFromCode(code),
                          description: detail.description || '',
                        }, currentUser?.id)
                        if (res.success) count++
                      }
                      setBusy(false)
                      if (count > 0) {
                        setNotice(`✨ บันทึกรหัสใหม่ ${count} รายการและจัดเข้ากลุ่มตามหมวดให้อัตโนมัติแล้ว`)
                        // Re-parse sheet or trigger re-check
                        handleParseSheet()
                      }
                    }}
                    disabled={busy}
                    className="btn-primary text-xs flex items-center gap-1 px-3 py-2 cursor-pointer"
                  >
                    ✨ บันทึกทั้งหมด &amp; จัดเข้ากลุ่มอัตโนมัติ
                  </button>
                </div>

                <div className="space-y-2 pt-1">
                  {uniqueUnmatchedCodes.map((code) => {
                    const defaultName = codeToNameMap[code] || ''
                    const form = newCodeDetails[code] || {
                      name: defaultName,
                      category: detectCategoryFromCode(code),
                      description: '',
                    }
                    const currentName = form.name !== undefined ? form.name : defaultName

                    return (
                      <div key={code} className="grid grid-cols-1 sm:grid-cols-5 gap-2 bg-white rounded-xl p-2.5 border border-black/10 items-center">
                        <span className="font-mono text-xs font-bold text-ocean px-1">{code}</span>
                        <input
                          className="glass-input text-xs"
                          placeholder="ชื่อบัญชี *"
                          value={currentName}
                          onChange={(e) => updateNewCodeDetail(code, 'name', e.target.value)}
                        />
                        <select
                          className="glass-input text-xs"
                          value={form.category || detectCategoryFromCode(code)}
                          onChange={(e) => updateNewCodeDetail(code, 'category', e.target.value)}
                        >
                          <option value="สินทรัพย์ (Assets)">1 - สินทรัพย์ (Assets)</option>
                          <option value="หนี้สิน (Liabilities)">2 - หนี้สิน (Liabilities)</option>
                          <option value="ส่วนของผู้ถือหุ้น / ทุน (Equity)">3 - ส่วนของผู้ถือหุ้น (Equity)</option>
                          <option value="รายได้ (Revenue)">4 - รายได้ (Revenue)</option>
                          <option value="ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)">5 - ต้นทุนขาย (Cost of Sales)</option>
                          <option value="ค่าใช้จ่ายในการขายและบริหาร (Selling & Administrative Expenses)">6 - ค่าใช้จ่ายบริหาร (Expenses)</option>
                        </select>
                        <input
                          className="glass-input text-xs"
                          placeholder="รายละเอียด (ถ้ามี)"
                          value={form.description || ''}
                          onChange={(e) => updateNewCodeDetail(code, 'description', e.target.value)}
                        />
                        <button
                          onClick={async () => {
                            setBusy(true)
                            setNotice('')
                            const res = await autoSaveAndGroupAccount({
                              code,
                              name: currentName || code,
                              category: form.category || detectCategoryFromCode(code),
                              description: form.description || '',
                            }, currentUser?.id)
                            setBusy(false)
                            if (res.success) {
                              setNotice(res.message)
                              handleParseSheet()
                            }
                          }}
                          disabled={busy}
                          className="btn-ghost text-xs bg-amber-100/60 text-gold-dark hover:bg-amber-200/80 font-medium py-1.5 px-2 rounded-lg cursor-pointer"
                        >
                          ✨ บันทึก &amp; เข้ากลุ่ม
                        </button>
                      </div>
                    )
                  })}
                </div>
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

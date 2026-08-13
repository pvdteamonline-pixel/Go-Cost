import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import ExportModal from '../components/ExportModal'
import {
  MONTH_SHORT,
  PIVOT_CATEGORY_OPTIONS,
  buildExecutivePivotData,
} from '../lib/executiveReportPivot'

function formatBaht(n) {
  if (n === null || n === undefined || isNaN(n)) return '-'
  if (n === 0) return '-'
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function formatAvg(n) {
  if (n === null || n === undefined || isNaN(n)) return '-'
  return Math.round(n).toLocaleString('th-TH')
}

function buildExcelSheet(pivotData, year) {
  const header = ['รหัสบัญชี', 'ชื่อบัญชี', ...MONTH_SHORT, 'รวม', 'เฉลี่ย/เดือน', '% ของรวมรายได้']
  const rows = [header]

  if (pivotData && pivotData.rows) {
    for (const r of pivotData.rows) {
      if (r.type === 'section') {
        rows.push(['', `=== ${r.title} ===`, ...Array(15).fill('')])
      } else if (r.type === 'section-header') {
        rows.push(['', `--- ${r.title} ---`, ...Array(15).fill('')])
      } else if (r.type === 'category-header') {
        rows.push(['', r.title, ...Array(15).fill('')])
      } else if (r.type === 'pct-row') {
        rows.push(['', r.name, ...Array(14).fill(''), r.pctValue || ''])
      } else if (r.type === 'diff-row') {
        rows.push(['', r.name, ...Array(14).fill(''), r.value || '-'])
      } else {
        rows.push([
          r.code || '',
          r.name || '',
          ...(r.monthly || Array(12).fill(0)).map((v) => (v !== 0 ? v : '')),
          r.total !== undefined ? r.total : '',
          r.showAvg ? Math.round(r.avgPerMonth || 0) : '',
          r.pctOfRevenue !== null && r.pctOfRevenue !== undefined ? `${r.pctOfRevenue}%` : '',
        ])
      }
    }
  }

  return [{ name: `ประมาณการกำไรขาดทุน ${year}`, rows }]
}

export default function ExecutiveReportPage({ onNavigate }) {
  const { currentUser } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState('') // '' = ทั้งปี, '1'-'12' = เฉพาะเดือน
  const [rawData, setRawData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // State for Custom Mapping Overrides per year
  const [customMappings, setCustomMappings] = useState({})
  const [showAuditModal, setShowAuditModal] = useState(false)

  const canUse = hasPagePermission(currentUser, 'exec-report')

  // Load custom mappings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`gocost_pivot_custom_mappings_${year}`)
      if (saved) {
        setCustomMappings(JSON.parse(saved))
      } else {
        setCustomMappings({})
      }
    } catch {
      setCustomMappings({})
    }
  }, [year])

  // Save custom mappings to localStorage
  const handleUpdateMapping = (code, targetCategory) => {
    setCustomMappings((prev) => {
      const updated = { ...prev, [code]: targetCategory }
      try {
        localStorage.setItem(`gocost_pivot_custom_mappings_${year}`, JSON.stringify(updated))
      } catch (err) {
        console.error('Failed to save custom mappings:', err)
      }
      return updated
    })
  }

  const handleResetMappings = () => {
    setCustomMappings({})
    try {
      localStorage.removeItem(`gocost_pivot_custom_mappings_${year}`)
    } catch (err) {
      console.error('Failed to reset custom mappings:', err)
    }
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_executive_monthly_report', {
      p_actor_id: currentUser?.id ?? null,
      p_year: year,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setError(res.message)
    setRawData(res)
  }, [currentUser, year])

  useEffect(() => {
    if (canUse) load()
  }, [canUse, load])

  const pivotData = useMemo(() => {
    if (!rawData) return null
    return buildExecutivePivotData(rawData, year, month, customMappings)
  }, [rawData, year, month, customMappings])

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">รายงานผู้บริหาร</h1>
          <p className="text-ink-600 text-sm mt-1">
            ประมาณการกำไร(ขาดทุน)เบื้องต้น สรุปรายรับ-รายจ่าย (ตาราง Pivot ตาม Template Excel)
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAuditModal(true)}
            className="px-3 py-2 bg-gradient-to-r from-ocean to-indigo-600 text-white font-medium text-xs rounded-xl shadow-sm hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <span>🛡️ ด่านตรวจสอบและปรับแต่งรหัสบัญชี</span>
            {pivotData?.unmatchedAccounts?.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {pivotData.unmatchedAccounts.length}
              </span>
            )}
          </button>

          {pivotData && (
            <ExportModal
              fileNameBase={`ประมาณการกำไร(ขาดทุน)_ผู้บริหาร_${year}`}
              excelSheets={buildExcelSheet(pivotData, year)}
              pdfPreview={<ExecReportPdfPreview pivotData={pivotData} year={year} month={month} />}
            />
          )}
          <select className="glass-input text-sm w-36" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">ทุกเดือน (ทั้งปี)</option>
            {MONTH_SHORT.map((m, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>
          <select className="glass-input text-sm w-28" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลดข้อมูลรายงาน...</p>}

      {!loading && pivotData && (
        <>
          {/* Data Audit & Validation Status Banner */}
          <div
            className={`border rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap ${
              pivotData.unmatchedAccounts?.length > 0
                ? 'bg-amber-50/90 border-amber-300/70'
                : 'bg-emerald-50/80 border-emerald-300/60'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <span className="text-xl mt-0.5">
                {pivotData.unmatchedAccounts?.length > 0 ? '⚠️' : '✅'}
              </span>
              <div>
                <p className="font-semibold text-sm text-ink-900">
                  {pivotData.unmatchedAccounts?.length > 0
                    ? `พบรหัสบัญชี ${pivotData.unmatchedAccounts.length} รหัส ที่ไม่อยู่ใน Template Standard`
                    : 'ตรวจสอบข้อมูลสมบูรณ์ 100%: ทุกรหัสบัญชีถูกจัดหมวดหมู่อย่างถูกต้อง'}
                </p>
                <p className="text-xs text-ink-600 mt-0.5">
                  พบข้อมูลรหัสบัญชีทั้งหมด {pivotData.allDetectedAccounts?.length || 0} รหัส | รวมยอดต้นทุนสินค้า COGS ={' '}
                  <span className="font-bold text-amber-900">{formatBaht(pivotData.cogsTotal)}</span> บาท |
                  รวมค่าใช้จ่าย = <span className="font-bold text-amber-900">{formatBaht(pivotData.grandTotalExpSum)}</span> บาท
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAuditModal(true)}
              className={`text-xs font-semibold px-3.5 py-2 rounded-lg transition-all shadow-sm ${
                pivotData.unmatchedAccounts?.length > 0
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-emerald-700 text-white hover:bg-emerald-800'
              }`}
            >
              {pivotData.unmatchedAccounts?.length > 0 ? '🛠️ แก้ไขและระบุหมวดหมู่เรียลไทม์' : '⚙️ ปรับแต่งหมวดหมู่รหัสบัญชี'}
            </button>
          </div>

          {/* Pivot Table Container */}
          <div className="glass p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-3 text-xs text-ink-500 flex-wrap gap-2">
              <div>
                <span>ฐานข้อมูลมีข้อมูลจริง </span>
                <span className="font-semibold text-ocean">{pivotData.activeMonthsCount} เดือน</span>
                <span> (ใช้คำนวณคอลัมน์ เฉลี่ย/เดือน)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-sage inline-block"></span> รายได้
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> ต้นทุน & ค่าใช้จ่าย
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block"></span> กำไรสุทธิ
                </span>
              </div>
            </div>

            <table className="w-full text-xs border-collapse min-w-[1500px]">
              <thead>
                <tr className="border-b-2 border-ink-900/20 bg-ink-100/80 text-ink-700 font-bold">
                  <th className="text-left py-2.5 px-2 w-24">รหัสบัญชี</th>
                  <th className="text-left py-2.5 px-2 w-64">ชื่อบัญชี</th>
                  {MONTH_SHORT.map((m) => (
                    <th key={m} className="text-right py-2.5 px-1.5 w-20">
                      {m}
                    </th>
                  ))}
                  <th className="text-right py-2.5 px-2 w-28 bg-ink-200/50">รวม</th>
                  <th className="text-right py-2.5 px-2 w-28 bg-ocean/10 text-ocean">เฉลี่ย/เดือน</th>
                  <th className="text-right py-2.5 px-2 w-24 bg-ink-200/30">% ของรวมรายได้</th>
                </tr>
              </thead>
              <tbody>
                {pivotData.rows.map((r, idx) => {
                  if (r.type === 'section') {
                    return (
                      <tr key={idx} className="bg-ocean/10 border-y border-ocean/30">
                        <td colSpan={17} className="py-2 px-3 font-bold text-ocean text-sm">
                          {r.title}
                        </td>
                      </tr>
                    )
                  }

                  if (r.type === 'section-header') {
                    return (
                      <tr key={idx} className="bg-rose-50/90 border-y border-rose-200">
                        <td colSpan={17} className="py-2 px-3 font-bold text-rose-900 text-xs">
                          {r.title}
                        </td>
                      </tr>
                    )
                  }

                  if (r.type === 'category-header') {
                    return (
                      <tr key={idx} className="bg-ink-100/70 border-t border-black/10">
                        <td colSpan={2} className="py-1.5 px-2 font-bold text-ink-900">
                          {r.title}
                        </td>
                        <td colSpan={15}></td>
                      </tr>
                    )
                  }

                  if (r.type === 'pct-row') {
                    return (
                      <tr key={idx} className="border-b border-black/5 text-[11px] text-ink-400 italic">
                        <td></td>
                        <td className="py-1 px-2">{r.name}</td>
                        {Array(12).fill(0).map((_, i) => (
                          <td key={i}></td>
                        ))}
                        <td></td>
                        <td></td>
                        <td className="text-right py-1 px-2 font-medium text-ink-500 tabular-nums">{r.pctValue || ''}</td>
                      </tr>
                    )
                  }

                  if (r.type === 'diff-row') {
                    return (
                      <tr key={idx} className="border-b border-black/10 bg-gray-50/80 text-ink-500">
                        <td></td>
                        <td className="py-1.5 px-2 font-medium">{r.name}</td>
                        {Array(12).fill(0).map((_, i) => (
                          <td key={i}></td>
                        ))}
                        <td></td>
                        <td></td>
                        <td className="text-right py-1.5 px-2 font-medium text-ink-400">{r.value || '-'}</td>
                      </tr>
                    )
                  }

                  // Standard Data & Formula Rows
                  const isFormula = r.type === 'formula'
                  const isSubtotal = r.type === 'subtotal'
                  const isCogs = r.type === 'cogs-row'
                  const isTotalRev = r.id === 'total-revenue'
                  const isGrossProf = r.id === 'gross-profit'
                  const isTotalExp = r.id === 'total-exp'
                  const isNetProf = r.id === 'net-profit'

                  let rowStyle = 'border-b border-black/5 hover:bg-black/[0.015]'
                  if (isTotalRev) rowStyle = 'bg-sage-pale/60 font-bold border-y-2 border-sage/40 text-sage-dark'
                  else if (isGrossProf) rowStyle = 'bg-emerald-50/90 font-bold border-y-2 border-emerald-300 text-emerald-900'
                  else if (isTotalExp) rowStyle = 'bg-amber-50/90 font-bold border-y-2 border-amber-300 text-amber-900'
                  else if (isNetProf)
                    rowStyle = `font-bold text-sm border-y-2 ${
                      r.total >= 0 ? 'bg-blue-50/90 text-blue-900 border-blue-400' : 'bg-rose-50/90 text-rose-900 border-rose-400'
                    }`
                  else if (isSubtotal) rowStyle = 'bg-white/70 font-semibold border-b border-black/15 text-ink-900'
                  else if (isCogs) rowStyle = 'bg-amber-100/60 font-bold border-y-2 border-amber-300 text-amber-950'
                  else if (isFormula) rowStyle = 'bg-ink-50/60 font-semibold text-ink-800'

                  return (
                    <tr key={idx} className={rowStyle}>
                      <td className="py-1 px-2 font-mono text-ocean">{r.code || ''}</td>
                      <td className={`py-1 px-2 ${r.deduct ? 'pl-4 text-rose-700' : r.add ? 'pl-4 text-emerald-700' : ''}`}>
                        {r.name}
                      </td>
                      {(r.monthly || Array(12).fill(0)).map((v, mIdx) => (
                        <td key={mIdx} className="text-right py-1 px-1.5 tabular-nums text-ink-800">
                          {formatBaht(v)}
                        </td>
                      ))}
                      <td className="text-right py-1 px-2 font-bold tabular-nums bg-ink-100/30 text-ink-900">
                        {formatBaht(r.total)}
                      </td>
                      <td className="text-right py-1 px-2 font-semibold tabular-nums bg-ocean/5 text-ocean">
                        {r.showAvg || isSubtotal || isFormula ? formatAvg(r.avgPerMonth) : '-'}
                      </td>
                      <td className="text-right py-1 px-2 tabular-nums text-ink-600 font-medium">
                        {r.pctOfRevenue !== null && r.pctOfRevenue !== undefined ? `${r.pctOfRevenue}%` : ''}
                      </td>
                    </tr>
                  )
                })}

                {/* Render Unmatched Accounts if any */}
                {pivotData.unmatchedAccounts && pivotData.unmatchedAccounts.length > 0 && (
                  <>
                    <tr className="bg-amber-100/80 border-t-2 border-amber-400">
                      <td colSpan={2} className="py-2 px-3 font-bold text-amber-900 text-xs flex items-center justify-between">
                        <span>⚠️ รหัสบัญชีอื่นๆ (ไม่อยู่ใน Template Standard)</span>
                        <button
                          onClick={() => setShowAuditModal(true)}
                          className="text-[11px] underline text-amber-950 font-normal"
                        >
                          คลิกเพื่อระบุหมวดหมู่เรียลไทม์
                        </button>
                      </td>
                      <td colSpan={15}></td>
                    </tr>
                    {pivotData.unmatchedAccounts.map((a) => (
                      <tr key={a.code} className="border-b border-black/5 bg-amber-50/30">
                        <td className="py-1 px-2 font-mono text-ocean">{a.code}</td>
                        <td className="py-1 px-2 text-ink-700">{a.name}</td>
                        {a.monthly.map((v, mIdx) => (
                          <td key={mIdx} className="text-right py-1 px-1.5 tabular-nums text-ink-800">
                            {formatBaht(v)}
                          </td>
                        ))}
                        <td className="text-right py-1 px-2 font-bold tabular-nums">{formatBaht(a.total)}</td>
                        <td className="text-right py-1 px-2 font-semibold tabular-nums text-ocean">
                          {formatAvg(a.total / pivotData.activeMonthsCount)}
                        </td>
                        <td className="text-right py-1 px-2"></td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Real-time Data Audit & Mapping Modal */}
      {showAuditModal && pivotData && (
        <AccountMappingAuditModal
          pivotData={pivotData}
          year={year}
          customMappings={customMappings}
          onUpdateMapping={handleUpdateMapping}
          onResetMappings={handleResetMappings}
          onClose={() => setShowAuditModal(false)}
        />
      )}
    </div>
  )
}

// ─── Real-time Data Audit & Custom Mapping Modal ───
function AccountMappingAuditModal({
  pivotData,
  year,
  customMappings,
  onUpdateMapping,
  onResetMappings,
  onClose,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // 'all' | 'unmapped' | 'cogs'

  const filteredAccounts = useMemo(() => {
    const list = pivotData.allDetectedAccounts || []
    return list.filter((acc) => {
      if (filterType === 'unmapped' && acc.isMapped) return false
      if (filterType === 'cogs' && !acc.isCogs) return false
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      return acc.code.toLowerCase().includes(term) || (acc.name && acc.name.toLowerCase().includes(term))
    })
  }, [pivotData, filterType, searchTerm])

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass bg-white max-w-4xl w-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-black/10">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-gradient-to-r from-ocean/10 to-indigo-50">
          <div>
            <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
              <span>🛡️ ด่านตรวจสอบความถูกต้องและจัดหมวดหมู่รหัสบัญชี (ปี {year})</span>
            </h2>
            <p className="text-xs text-ink-600 mt-0.5">
              ตรวจพบรหัสบัญชีทั้งหมด {pivotData.allDetectedAccounts?.length || 0} รหัส — คุณสามารถปรับเปลี่ยนหมวดหมู่ได้แบบเรียลไทม์เพื่อความแม่นยำ 100%
            </p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-900 text-xl font-bold p-1">
            ✕
          </button>
        </div>

        {/* Modal Controls */}
        <div className="p-4 border-b border-black/10 bg-ink-50/50 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === 'all' ? 'bg-ocean text-white shadow-sm' : 'bg-white text-ink-700 hover:bg-black/5 border border-black/10'
              }`}
            >
              ทั้งหมด ({pivotData.allDetectedAccounts?.length || 0})
            </button>
            <button
              onClick={() => setFilterType('unmapped')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === 'unmapped' ? 'bg-amber-600 text-white shadow-sm' : 'bg-white text-ink-700 hover:bg-black/5 border border-black/10'
              }`}
            >
              ⚠️ ยังไม่อยู่ใน Template ({pivotData.unmatchedAccounts?.length || 0})
            </button>
            <button
              onClick={() => setFilterType('cogs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterType === 'cogs' ? 'bg-amber-900 text-white shadow-sm' : 'bg-white text-ink-700 hover:bg-black/5 border border-black/10'
              }`}
            >
              📦 ต้นทุนสินค้า ({pivotData.cogsCodes?.length || 0})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="ค้นหารหัส หรือ ชื่อบัญชี..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input text-xs w-56 px-3 py-1.5"
            />
            {Object.keys(customMappings).length > 0 && (
              <button
                onClick={onResetMappings}
                className="text-xs text-rose-600 hover:underline px-2 py-1"
              >
                คืนค่าเริ่มต้น
              </button>
            )}
          </div>
        </div>

        {/* Modal Body Table */}
        <div className="p-4 overflow-y-auto flex-1">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-black/10 text-ink-700 font-bold bg-ink-100/60">
                <th className="text-left py-2 px-2 w-28">รหัสบัญชี</th>
                <th className="text-left py-2 px-2">ชื่อบัญชี</th>
                <th className="text-right py-2 px-2 w-32">ยอดรวมทั้งปี</th>
                <th className="text-left py-2 px-2 w-72">จัดเข้าหมวดหมู่ (เรียลไทม์)</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-ink-400">
                    ไม่พบรหัสบัญชีที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((acc) => {
                  const currentCategory = acc.userMapping || 'auto'
                  return (
                    <tr key={acc.code} className="border-b border-black/5 hover:bg-black/[0.015]">
                      <td className="py-2 px-2 font-mono font-semibold text-ocean">{acc.code}</td>
                      <td className="py-2 px-2 font-medium text-ink-800">
                        {acc.name}
                        {acc.isCogs && (
                          <span className="ml-2 bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            COGS
                          </span>
                        )}
                        {!acc.isMapped && currentCategory === 'auto' && (
                          <span className="ml-2 bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            ยังไม่อยู่ใน Template
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-ink-900 tabular-nums">
                        {formatBaht(acc.total)}
                      </td>
                      <td className="py-2 px-2">
                        <select
                          value={currentCategory}
                          onChange={(e) => onUpdateMapping(acc.code, e.target.value)}
                          className="w-full text-xs border border-black/20 rounded-lg px-2 py-1 bg-white font-medium text-ink-900 focus:border-ocean"
                        >
                          {PIVOT_CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-black/10 bg-ink-50 flex items-center justify-between">
          <p className="text-xs text-ink-500">
            การปรับแต่งทุกรายการจะบันทึกและคำนวณสูตรตาราง Pivot ใหม่ทันที
          </p>
          <button
            onClick={onClose}
            className="btn-primary text-xs px-5 py-2"
          >
            ตกลงและปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  )
}

// Printable PDF Preview Component (Black and White layout for printing)
function ExecReportPdfPreview({ pivotData, year, month }) {
  if (!pivotData) return null

  return (
    <div style={{ color: '#1d1d1f', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 }}>
        ประมาณการกำไร(ขาดทุน)เบื้องต้น ปี {year} {month ? `(เดือน ${MONTH_SHORT[Number(month) - 1]})` : ''}
      </h1>
      <p style={{ fontSize: 10, textAlign: 'center', color: '#6e6e73', marginBottom: 12 }}>
        ตารางสรุปรายรับ-รายจ่าย บริษัท — ข้อมูลพิมพ์เมื่อ {new Date().toLocaleDateString('th-TH')}
      </p>

      <table style={{ width: '100%', fontSize: 8, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #1d1d1f', backgroundColor: '#f2f2f7' }}>
            <th style={{ textAlign: 'left', padding: '4px 2px' }}>รหัส</th>
            <th style={{ textAlign: 'left', padding: '4px 2px', width: '22%' }}>ชื่อบัญชี</th>
            {MONTH_SHORT.map((m) => (
              <th key={m} style={{ textAlign: 'right', padding: '4px 2px' }}>
                {m}
              </th>
            ))}
            <th style={{ textAlign: 'right', padding: '4px 2px', fontWeight: 'bold' }}>รวม</th>
            <th style={{ textAlign: 'right', padding: '4px 2px', fontWeight: 'bold' }}>เฉลี่ย/เดือน</th>
            <th style={{ textAlign: 'right', padding: '4px 2px' }}>% ของรายได้</th>
          </tr>
        </thead>
        <tbody>
          {pivotData.rows.map((r, idx) => {
            if (r.type === 'section' || r.type === 'section-header') {
              return (
                <tr key={idx} style={{ backgroundColor: '#e5e5ea', fontWeight: 'bold' }}>
                  <td colSpan={17} style={{ padding: 4 }}>
                    {r.title}
                  </td>
                </tr>
              )
            }
            if (r.type === 'category-header') {
              return (
                <tr key={idx} style={{ backgroundColor: '#f2f2f7', fontWeight: 'bold' }}>
                  <td colSpan={2} style={{ padding: 4 }}>
                    {r.title}
                  </td>
                  <td colSpan={15}></td>
                </tr>
              )
            }
            if (r.type === 'pct-row') {
              return (
                <tr key={idx} style={{ fontStyle: 'italic', color: '#6e6e73' }}>
                  <td></td>
                  <td style={{ padding: '2px 4px' }}>{r.name}</td>
                  <td colSpan={14}></td>
                  <td style={{ textAlign: 'right', padding: '2px 4px' }}>{r.pctValue || ''}</td>
                </tr>
              )
            }
            if (r.type === 'diff-row') {
              return (
                <tr key={idx} style={{ borderBottom: '1px solid #d2d2d7' }}>
                  <td></td>
                  <td style={{ padding: '2px 4px' }}>{r.name}</td>
                  <td colSpan={14}></td>
                  <td style={{ textAlign: 'right', padding: '2px 4px' }}>{r.value || '-'}</td>
                </tr>
              )
            }

            const isBold = r.isBold || r.type === 'subtotal' || r.type === 'formula'
            const isHighlight = r.id === 'total-revenue' || r.id === 'gross-profit' || r.id === 'total-exp' || r.id === 'net-profit'

            return (
              <tr
                key={idx}
                style={{
                  borderBottom: '1px solid #e8e8ed',
                  fontWeight: isBold ? 'bold' : 'normal',
                  backgroundColor: isHighlight ? '#f2f2f7' : 'transparent',
                }}
              >
                <td style={{ padding: '2px 4px' }}>{r.code || ''}</td>
                <td style={{ padding: '2px 4px' }}>{r.name}</td>
                {(r.monthly || Array(12).fill(0)).map((v, mIdx) => (
                  <td key={mIdx} style={{ textAlign: 'right', padding: '2px 2px' }}>
                    {formatBaht(v)}
                  </td>
                ))}
                <td style={{ textAlign: 'right', padding: '2px 4px', fontWeight: 'bold' }}>{formatBaht(r.total)}</td>
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>
                  {r.showAvg || r.type === 'subtotal' || r.type === 'formula' ? formatAvg(r.avgPerMonth) : '-'}
                </td>
                <td style={{ textAlign: 'right', padding: '2px 4px' }}>
                  {r.pctOfRevenue !== null && r.pctOfRevenue !== undefined ? `${r.pctOfRevenue}%` : ''}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

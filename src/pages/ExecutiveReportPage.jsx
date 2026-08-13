import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import ExportModal from '../components/ExportModal'
import { MONTH_SHORT, buildExecutivePivotData } from '../lib/executiveReportPivot'

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

  const canUse = hasPagePermission(currentUser, 'exec-report')

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
    return buildExecutivePivotData(rawData, year, month)
  }, [rawData, year, month])

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">รายงานผู้บริหาร</h1>
          <p className="text-ink-600 text-sm mt-1">
            ประมาณการกำไร(ขาดทุน)เบื้องต้น สรุปรายรับ-รายจ่าย (ตาราง Pivot ตาม Template Excel)
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          {/* Warning Banner สำหรับรหัสบัญชีที่ไม่ได้อยู่ใน Template */}
          {pivotData.unmatchedAccounts && pivotData.unmatchedAccounts.length > 0 && (
            <div className="bg-amber-50 border border-amber-300/60 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                <div>
                  <p className="text-amber-800 font-medium text-sm">
                    พบรหัสบัญชีเพิ่มเติมในระบบที่ไม่อยู่ใน Template Standard จำนวน {pivotData.unmatchedAccounts.length} รหัส
                  </p>
                  <p className="text-amber-600 text-xs mt-0.5">
                    รหัสเหล่านี้ถูกแสดงไว้ในส่วน "รหัสบัญชีอื่นๆ" ท้ายตาราง
                  </p>
                </div>
              </div>
              {onNavigate && (
                <button onClick={() => onNavigate('account-groups')} className="btn-primary text-xs px-3 py-1.5 shrink-0">
                  📂 ไปผังบัญชี / จัดกลุ่ม
                </button>
              )}
            </div>
          )}

          {/* Pivot Table Container */}
          <div className="glass p-4 overflow-x-auto">
            <div className="flex items-center justify-between mb-3 text-xs text-ink-500 flex-wrap gap-2">
              <div>
                <span>ฐานข้อมูลมีข้อมูลจริง </span>
                <span className="font-semibold text-ocean">{pivotData.activeMonthsCount} เดือน</span>
                <span> (ใช้คำนวณคอลัมน์ เฉลี่ย/เดือน)</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-sage inline-block"></span> รายได้</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500 inline-block"></span> ค่าใช้จ่าย</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600 inline-block"></span> กำไรสุทธิ</span>
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
                  else if (isCogs) rowStyle = 'bg-amber-50/40 font-semibold border-b border-black/10'
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
                      <td colSpan={2} className="py-2 px-3 font-bold text-amber-900 text-xs">
                        ⚠️ รหัสบัญชีอื่นๆ (ไม่ได้ระบุใน Template Standard)
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

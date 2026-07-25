import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import ExportModal from '../components/ExportModal'

function formatBaht(n) {
  if (n === null || n === undefined) return '-'
  return n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function buildExcelSheet(data, year) {
  const header = ['รหัสบัญชี', 'ชื่อบัญชี', ...MONTH_SHORT, 'รวม']
  const rows = [header, ['', 'รายได้รวม', ...data.revenueMonthly, data.revenueTotal]]
  for (const g of data.groups) {
    rows.push([g.code, g.name, ...g.pctOfRevenueMonthly.map((p) => (p !== null ? `${p}%` : '')), g.pctOfRevenueTotal !== null ? `${g.pctOfRevenueTotal}%` : ''])
    for (const a of g.accounts) rows.push([a.code, a.name, ...a.monthly, a.total])
    rows.push(['', `รวม ${g.name}`, ...g.monthly, g.total])
  }
  if (data.ungroupedAccounts.length > 0) {
    rows.push(['', 'รหัสบัญชีที่ยังไม่มีกลุ่ม'])
    for (const a of data.ungroupedAccounts) rows.push([a.code, a.name, ...a.monthly, a.total])
  }
  return [{ name: `รายงานผู้บริหาร ${year}`, rows }]
}

export default function ExecutiveReportPage() {
  const { currentUser } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canUse = hasPagePermission(currentUser, 'exec-report')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_executive_monthly_report', {
      p_actor_id: currentUser?.id ?? null, p_year: year,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setError(res.message)
    setData(res)
  }, [currentUser, year])

  useEffect(() => { if (canUse) load() }, [canUse, load])

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
          <p className="text-ink-600 text-sm mt-1">ประมาณการกำไร(ขาดทุน) แยกตามกลุ่ม → รหัสบัญชี รายเดือน (ตาม template งบบริหาร)</p>
        </div>
        <div className="flex items-center gap-2">
          {data && <ExportModal fileNameBase={`รายงานผู้บริหาร_${year}`} excelSheets={buildExcelSheet(data, year)} pdfPreview={<ExecReportPdfPreview data={data} year={year} />} />}
          <select className="glass-input text-sm w-28" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      {!loading && data && (
        <div className="glass p-4 overflow-x-auto">
          <table className="w-full text-xs border-collapse min-w-[1400px]">
            <thead>
              <tr className="border-b-2 border-black/15 text-ink-500">
                <th className="text-left py-2 pr-2 w-24">รหัสบัญชี</th>
                <th className="text-left py-2 pr-2 w-52">ชื่อบัญชี</th>
                {MONTH_SHORT.map((m) => <th key={m} className="text-right py-2 px-2 w-24">{m}</th>)}
                <th className="text-right py-2 pl-2 w-28">รวม</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-sage-pale/40 font-medium">
                <td className="py-1.5" colSpan={2}>รายได้รวม</td>
                {data.revenueMonthly.map((v, i) => (
                  <td key={i} className="text-right py-1.5 px-2 text-sage tabular-nums">{formatBaht(v)}</td>
                ))}
                <td className="text-right py-1.5 pl-2 text-sage tabular-nums">{formatBaht(data.revenueTotal)}</td>
              </tr>

              {data.groups.map((g) => (
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
                        <td key={i} className="text-right py-1 px-2 text-ink-800 tabular-nums">{v !== 0 ? formatBaht(v) : ''}</td>
                      ))}
                      <td className="text-right py-1 pl-2 text-ink-900 font-medium tabular-nums">{formatBaht(a.total)}</td>
                    </tr>
                  ))}
                  <tr className="bg-white/40 border-b border-black/10">
                    <td colSpan={2} className="py-1 pl-4 text-ink-400 italic">รวม {g.name}</td>
                    {g.monthly.map((v, i) => (
                      <td key={i} className="text-right py-1 px-2 text-ink-600 font-medium tabular-nums">{formatBaht(v)}</td>
                    ))}
                    <td className="text-right py-1 pl-2 text-ink-600 font-medium tabular-nums">{formatBaht(g.total)}</td>
                  </tr>
                </React.Fragment>
              ))}

              {data.ungroupedAccounts.length > 0 && (
                <>
                  <tr className="bg-gold-pale/40">
                    <td colSpan={2} className="py-2 px-1 text-gold-dark font-medium">⚠️ รหัสบัญชีที่ยังไม่มีกลุ่ม</td>
                    <td colSpan={13}></td>
                  </tr>
                  {data.ungroupedAccounts.map((a) => (
                    <tr key={a.code} className="border-b border-black/5">
                      <td className="py-1 pr-2 pl-4 text-ocean font-mono">{a.code}</td>
                      <td className="py-1 pr-2 text-ink-700">{a.name}</td>
                      {a.monthly.map((v, i) => (
                        <td key={i} className="text-right py-1 px-2 text-ink-800 tabular-nums">{v !== 0 ? formatBaht(v) : ''}</td>
                      ))}
                      <td className="text-right py-1 pl-2 text-ink-900 font-medium tabular-nums">{formatBaht(a.total)}</td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
          <p className="text-ink-400 text-xs mt-3">
            % คำนวณจากยอดของแต่ละกลุ่ม เทียบกับ "รายได้รวม" (รหัสบัญชีที่ตั้งหมวดหมู่เป็น "รายได้ (Revenue)") —
            รหัสที่ยังไม่ได้จัดกลุ่มจะไม่ถูกนับใน % ไปหน้า "กลุ่มรหัสบัญชี" เพื่อจัดกลุ่มให้ครบ
          </p>
        </div>
      )}
    </div>
  )
}

// เวอร์ชันสำหรับพิมพ์/PDF — ตัวหนังสือดำบนพื้นขาวล้วน ไม่มี glass effect (พิมพ์ออกมาแล้วอ่านง่าย)
function ExecReportPdfPreview({ data, year }) {
  return (
    <div style={{ color: '#1d1d1f' }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>รายงานผู้บริหาร ปี {year}</h1>
      <p style={{ fontSize: 11, textAlign: 'center', color: '#6e6e73', marginBottom: 16 }}>
        ประมาณการกำไร(ขาดทุน) แยกตามกลุ่ม → รหัสบัญชี รายเดือน — พิมพ์เมื่อ {new Date().toLocaleDateString('th-TH')}
      </p>
      <table style={{ width: '100%', fontSize: 9, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #1d1d1f' }}>
            <th style={{ textAlign: 'left', padding: 4 }}>รหัส</th>
            <th style={{ textAlign: 'left', padding: 4 }}>ชื่อบัญชี</th>
            {MONTH_SHORT.map((m) => <th key={m} style={{ textAlign: 'right', padding: 4 }}>{m}</th>)}
            <th style={{ textAlign: 'right', padding: 4 }}>รวม</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ backgroundColor: '#eaf7ef', fontWeight: 'bold' }}>
            <td style={{ padding: 4 }} colSpan={2}>รายได้รวม</td>
            {data.revenueMonthly.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: 4 }}>{formatBaht(v)}</td>)}
            <td style={{ textAlign: 'right', padding: 4 }}>{formatBaht(data.revenueTotal)}</td>
          </tr>
          {data.groups.map((g) => (
            <React.Fragment key={g.groupId}>
              <tr style={{ backgroundColor: '#f5f5f7' }}>
                <td style={{ padding: 4, fontWeight: 'bold' }} colSpan={2}>{g.code} {g.name} {g.pctOfRevenueTotal !== null ? `(${g.pctOfRevenueTotal}%)` : ''}</td>
                <td colSpan={13}></td>
              </tr>
              {g.accounts.map((a) => (
                <tr key={a.code} style={{ borderBottom: '1px solid #e8e8ed' }}>
                  <td style={{ padding: '2px 4px 2px 12px' }}>{a.code}</td>
                  <td style={{ padding: '2px 4px' }}>{a.name}</td>
                  {a.monthly.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '2px 4px' }}>{v !== 0 ? formatBaht(v) : ''}</td>)}
                  <td style={{ textAlign: 'right', padding: '2px 4px', fontWeight: 'bold' }}>{formatBaht(a.total)}</td>
                </tr>
              ))}
              <tr style={{ borderBottom: '1px solid #d2d2d7' }}>
                <td style={{ padding: '2px 4px 2px 12px', fontStyle: 'italic', color: '#6e6e73' }} colSpan={2}>รวม {g.name}</td>
                {g.monthly.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '2px 4px' }}>{formatBaht(v)}</td>)}
                <td style={{ textAlign: 'right', padding: '2px 4px', fontWeight: 'bold' }}>{formatBaht(g.total)}</td>
              </tr>
            </React.Fragment>
          ))}
          {data.ungroupedAccounts.length > 0 && (
            <>
              <tr><td style={{ padding: 4, fontWeight: 'bold' }} colSpan={15}>รหัสบัญชีที่ยังไม่มีกลุ่ม</td></tr>
              {data.ungroupedAccounts.map((a) => (
                <tr key={a.code}>
                  <td style={{ padding: '2px 4px 2px 12px' }}>{a.code}</td>
                  <td style={{ padding: '2px 4px' }}>{a.name}</td>
                  {a.monthly.map((v, i) => <td key={i} style={{ textAlign: 'right', padding: '2px 4px' }}>{v !== 0 ? formatBaht(v) : ''}</td>)}
                  <td style={{ textAlign: 'right', padding: '2px 4px', fontWeight: 'bold' }}>{formatBaht(a.total)}</td>
                </tr>
              ))}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}

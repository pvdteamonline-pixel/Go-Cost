import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import ExportModal from '../components/ExportModal'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildExcelSheet(data, year) {
  const rows = [
    ['งบกำไรขาดทุน ปี', year],
    ['รายได้รวม', '', '', data.totalRevenue],
    [],
    ['หมวดหมู่', 'รหัส', 'ชื่อบัญชี', 'ยอด'],
  ]
  for (const cat of data.byCategory ?? []) {
    rows.push([cat.category, '', '', cat.total])
    for (const l of cat.lines) {
      rows.push(['', l.code, l.name, l.total])
      for (const it of l.items) rows.push(['', '', `${it.docNumber} · ${it.eventDate} · ${it.storeName} · ${it.detail}`, it.total])
    }
  }
  rows.push([])
  rows.push(['รายจ่ายรวม', '', '', data.totalExpenses])
  rows.push([data.netIncome >= 0 ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ', '', '', Math.abs(data.netIncome)])
  return [{ name: `งบกำไรขาดทุน ${year}`, rows }]
}

const MOCK_TB_SUMMARY = {
  label: 'งบทดลอง มิถุนายน 2568 (ตัวอย่าง)',
  totalDebit: 552000,
  totalCredit: 552000,
  groups: [
    { code: 'GRP-MKT', name: 'ค่าใช้จ่ายการตลาด', debit: 403500, credit: 0 },
    { code: 'GRP-WS',  name: 'ค่าใช้จ่าย Workshop', debit: 101500, credit: 0 },
    { code: 'GRP-OPS', name: 'ค่าใช้จ่ายปฏิบัติการ', debit: 47000, credit: 0 },
    { code: 'GRP-REV', name: 'รายได้', debit: 0, credit: 552000 },
  ],
}

export default function TaxReportPage() {
  const { currentUser } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canUse = hasPagePermission(currentUser, 'tax-report')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_tax_filing_report', {
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
    <div className="max-w-4xl mx-auto space-y-6 print:max-w-full">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">รายงานสำหรับกรมสรรพากร</h1>
          <p className="text-ink-600 text-sm mt-1">สรุปรายได้-รายจ่ายบริษัท แยกตามหมวดหมู่บัญชี สำหรับใช้อ้างอิงยื่นภาษี</p>
        </div>
        <div className="flex gap-2">
          <select className="glass-input text-sm w-32" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={() => window.print()} className="btn-ghost text-sm">พิมพ์หน้าเว็บ</button>
          {data && <ExportModal fileNameBase={`รายงานสรรพากร_${year}`} excelSheets={buildExcelSheet(data, year)} pdfPreview={<TaxReportPdfPreview data={data} year={year} />} />}
        </div>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2 print:hidden">{error}</p>}
      {loading && <p className="text-ink-500 text-sm print:hidden">กำลังโหลด...</p>}

      {!loading && data && (
        <div className="glass p-8 space-y-6">
          <div className="text-center border-b border-black/10 pb-4">
            <h2 className="font-display italic text-2xl text-ink-900">งบกำไรขาดทุน (Profit &amp; Loss Statement)</h2>
            <p className="text-ink-500 text-sm mt-1">สำหรับปี พ.ศ. {year + 543} (ค.ศ. {year})</p>
            <p className="text-ink-400 text-xs mt-1">จัดทำสำหรับอ้างอิงประกอบการยื่นแบบต่อกรมสรรพากร — ไม่ใช่เอกสารทางบัญชีที่ผ่านการรับรองจากผู้สอบบัญชี</p>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-black/5">
            <span className="text-ink-900 font-medium">รายได้รวม (Total Revenue)</span>
            <span className="text-sage font-display italic text-xl">{formatBaht(data.totalRevenue)}</span>
          </div>

          <div>
            <p className="text-ink-900 font-medium mb-2">รายจ่าย (Expenses) แยกตามหมวดหมู่บัญชี</p>
            {(data.byCategory ?? []).length === 0 && (
              <p className="text-ink-400 text-sm py-4 text-center">ไม่มีรายจ่ายที่ระบุรหัสบัญชีในปีนี้</p>
            )}
            <div className="space-y-4">
              {(data.byCategory ?? []).map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm font-medium text-ink-800 border-b border-black/10 pb-1 mb-1">
                    <span>{cat.category}</span>
                    <span>{formatBaht(cat.total)}</span>
                  </div>
                  {cat.lines.map((l) => (
                    <div key={l.code} className="mb-3 pl-2">
                      <div className="flex items-center justify-between text-xs font-medium text-ink-700 py-1">
                        <span>{l.code} — {l.name}</span>
                        <span>{formatBaht(l.total)}</span>
                      </div>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="text-ink-400">
                            <th className="text-left font-normal py-0.5 pl-4">เอกสาร</th>
                            <th className="text-left font-normal py-0.5">วันที่</th>
                            <th className="text-left font-normal py-0.5">ร้าน/งาน</th>
                            <th className="text-left font-normal py-0.5">รายละเอียด</th>
                            <th className="text-right font-normal py-0.5">ยอด</th>
                          </tr>
                        </thead>
                        <tbody>
                          {l.items.map((it, i) => (
                            <tr key={i} className="border-t border-black/5">
                              <td className="py-0.5 pl-4 text-ocean">{it.docNumber}</td>
                              <td className="py-0.5 text-ink-500">{it.eventDate}</td>
                              <td className="py-0.5 text-ink-600">{it.storeName}</td>
                              <td className="py-0.5 text-ink-600">{it.detail}</td>
                              <td className="py-0.5 text-right text-ink-800">{formatBaht(it.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-black/10">
            <span className="text-ink-900 font-medium">รายจ่ายรวม (Total Expenses)</span>
            <span className="text-rose font-display italic text-xl">{formatBaht(data.totalExpenses)}</span>
          </div>

          <div className="flex items-center justify-between py-3 border-t-2 border-black/20">
            <span className="text-ink-900 font-medium text-lg">{data.netIncome >= 0 ? 'กำไรสุทธิ (Net Income)' : 'ขาดทุนสุทธิ (Net Loss)'}</span>
            <span className={`font-display italic text-2xl ${data.netIncome >= 0 ? 'text-sage' : 'text-rose'}`}>
              {formatBaht(Math.abs(data.netIncome))}
            </span>
          </div>

          <p className="text-ink-400 text-xs text-center pt-4 border-t border-black/5">
            รายงานนี้สร้างจากข้อมูลในระบบ GoCost ณ วันที่ {new Date().toLocaleDateString('th-TH')} —
            รายจ่ายที่ไม่ได้ระบุรหัสบัญชียังไม่ถูกรวมในรายงานนี้ กรุณาตรวจสอบที่หน้า "รายงานผู้บริหาร (แยกรายการ)" ก่อนใช้งานจริง
          </p>
        </div>
      )}

      {/* งบทดลองคร่าวๆ (Mock) — สำหรับอ้างอิงประกอบการยื่นภาษี */}
      <div className="glass p-5 space-y-3 border border-amber-200/60 print:hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-ink-900 font-medium">งบทดลอง (Trial Balance) อ้างอิง</h3>
          <span className="text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg px-2 py-0.5">ข้อมูลตัวอย่าง</span>
        </div>
        <p className="text-ink-400 text-xs">{MOCK_TB_SUMMARY.label} — ใช้อ้างอิงหยอดคู่กับงบ P&amp;L ด้านบน</p>
        <div className="space-y-1">
          {MOCK_TB_SUMMARY.groups.map((g) => (
            <div key={g.code} className="flex items-center justify-between text-sm py-1.5 border-b border-black/5 last:border-0">
              <span className="text-ink-700">
                <span className="doc-badge mr-2">{g.code}</span>{g.name}
              </span>
              <div className="flex gap-6 text-xs tabular-nums">
                <span className="text-rose w-28 text-right">{g.debit > 0 ? formatBaht(g.debit) : '—'}</span>
                <span className="text-sage w-28 text-right">{g.credit > 0 ? formatBaht(g.credit) : '—'}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-black/10">
          <span className="text-ink-900 font-medium text-sm">ยอดรวม Debit / Credit</span>
          <div className="flex gap-6 text-sm tabular-nums">
            <span className="text-rose font-display italic">{formatBaht(MOCK_TB_SUMMARY.totalDebit)}</span>
            <span className="text-sage font-display italic">{formatBaht(MOCK_TB_SUMMARY.totalCredit)}</span>
          </div>
        </div>
        <p className="text-sage text-xs">✅ Debit = Credit — งบสมดุล</p>
      </div>
    </div>
  )
}

// เวอร์ชันสำหรับพิมพ์/PDF — ตัวหนังสือดำบนพื้นขาวล้วน
function TaxReportPdfPreview({ data, year }) {
  return (
    <div style={{ color: '#1d1d1f', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>งบกำไรขาดทุน (Profit &amp; Loss Statement)</h1>
      <p style={{ fontSize: 12, textAlign: 'center', color: '#6e6e73' }}>สำหรับปี พ.ศ. {year + 543} (ค.ศ. {year})</p>
      <p style={{ fontSize: 10, textAlign: 'center', color: '#a1a1a6', marginBottom: 20 }}>
        จัดทำสำหรับอ้างอิงประกอบการยื่นแบบต่อกรมสรรพากร — ไม่ใช่เอกสารทางบัญชีที่ผ่านการรับรองจากผู้สอบบัญชี
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e8e8ed' }}>
        <span style={{ fontWeight: 'bold' }}>รายได้รวม (Total Revenue)</span>
        <span style={{ fontWeight: 'bold' }}>{formatBaht(data.totalRevenue)}</span>
      </div>

      <p style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>รายจ่าย (Expenses) แยกตามหมวดหมู่บัญชี</p>
      {(data.byCategory ?? []).map((cat) => (
        <div key={cat.category} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 'bold', borderBottom: '1px solid #d2d2d7', paddingBottom: 4 }}>
            <span>{cat.category}</span><span>{formatBaht(cat.total)}</span>
          </div>
          {cat.lines.map((l) => (
            <div key={l.code} style={{ marginTop: 4, paddingLeft: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                <span>{l.code} — {l.name}</span><span>{formatBaht(l.total)}</span>
              </div>
            </div>
          ))}
        </div>
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid #d2d2d7' }}>
        <span style={{ fontWeight: 'bold' }}>รายจ่ายรวม (Total Expenses)</span>
        <span style={{ fontWeight: 'bold' }}>{formatBaht(data.totalExpenses)}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #1d1d1f' }}>
        <span style={{ fontWeight: 'bold', fontSize: 14 }}>{data.netIncome >= 0 ? 'กำไรสุทธิ (Net Income)' : 'ขาดทุนสุทธิ (Net Loss)'}</span>
        <span style={{ fontWeight: 'bold', fontSize: 16 }}>{formatBaht(Math.abs(data.netIncome))}</span>
      </div>

      <p style={{ fontSize: 9, color: '#a1a1a6', textAlign: 'center', marginTop: 16, borderTop: '1px solid #e8e8ed', paddingTop: 12 }}>
        รายงานนี้สร้างจากข้อมูลในระบบ GoCost ณ วันที่ {new Date().toLocaleDateString('th-TH')}
      </p>
    </div>
  )
}

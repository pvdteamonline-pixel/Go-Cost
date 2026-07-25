import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ReconciliationPage() {
  const { currentUser } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canUse = hasPagePermission(currentUser, 'reconciliation')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_reconciliation_report', {
      p_actor_id: currentUser?.id ?? null, p_year: year, p_month: month ? Number(month) : null,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setError(res.message)
    setData(res)
  }, [currentUser, year, month])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  const rows = data?.rows ?? []
  const totalStaff = rows.reduce((s, r) => s + r.staffAmount, 0)
  const totalFile = rows.reduce((s, r) => s + r.fileAmount, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">เทียบยอด (Reconciliation)</h1>
          <p className="text-ink-600 text-sm mt-1">เปรียบเทียบยอดที่พนักงานกรอกเอง กับยอดจากไฟล์รายจ่ายจริงที่แนบไว้</p>
        </div>
        <div className="flex gap-2">
          <select className="glass-input text-sm w-28" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select className="glass-input text-sm w-32" value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">ทั้งปี</option>
            {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
          </select>
        </div>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      {!loading && data && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="glass p-5">
              <p className="text-ink-600 text-xs mb-1">ยอดที่พนักงานกรอก</p>
              <p className="font-display italic text-xl text-ocean">{formatBaht(totalStaff)}</p>
            </div>
            <div className="glass p-5">
              <p className="text-ink-600 text-xs mb-1">ยอดจากไฟล์ที่แนบ</p>
              <p className="font-display italic text-xl text-gold-dark">{formatBaht(totalFile)}</p>
            </div>
            <div className="glass p-5">
              <p className="text-ink-600 text-xs mb-1">ผลต่างรวม</p>
              <p className={`font-display italic text-xl ${totalFile - totalStaff === 0 ? 'text-sage' : 'text-rose'}`}>
                {formatBaht(totalFile - totalStaff)}
              </p>
            </div>
          </div>

          <div className="glass p-0 overflow-hidden">
            {rows.length === 0 ? (
              <p className="text-ink-400 text-sm text-center py-10">ไม่มีข้อมูลให้เทียบในช่วงเวลานี้ (ต้องมีทั้งข้อมูลที่พนักงานกรอกและ/หรือไฟล์ที่แนบ)</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">รหัสบัญชี</th>
                    <th className="px-4 py-3">ชื่อบัญชี</th>
                    <th className="px-4 py-3">ยอดที่พนักงานกรอก</th>
                    <th className="px-4 py-3">ยอดจากไฟล์</th>
                    <th className="px-4 py-3">ผลต่าง</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.code} className="border-b border-black/5 last:border-0">
                      <td className="px-4 py-3 text-ink-900 whitespace-nowrap">{r.code}</td>
                      <td className="px-4 py-3 text-ink-700">{r.name}</td>
                      <td className="px-4 py-3 text-ink-700">{formatBaht(r.staffAmount)}</td>
                      <td className="px-4 py-3 text-ink-700">{formatBaht(r.fileAmount)}</td>
                      <td className={`px-4 py-3 font-medium ${r.diff === 0 ? 'text-sage' : 'text-rose'}`}>
                        {formatBaht(r.diff)} {r.diff !== 0 && '⚠️'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

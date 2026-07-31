import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const MONTH_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function fmt(n) {
  if (n === null || n === undefined || n === 0) return '-'
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtPct(n) {
  if (n === null || n === undefined) return ''
  return n.toFixed(2) + '%'
}

function fmtV(n) {
  if (!n || n === 0) return ''
  return n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Is this group a Revenue group?
function isRevenueGroup(g) {
  const n = (g.name ?? '').toLowerCase()
  return n.includes('รายได้') || n.includes('revenue') || n.includes('income')
}

// Is this group a COGS group?
function isCogsGroup(g) {
  const n = (g.name ?? '').toLowerCase()
  return n.includes('ต้นทุนสินค้า') || n.includes('ต้นทุน สินค้า') || n.includes('cogs') || n.includes('cost of goods')
}

// ─── Single expense group rows ──────────────────────────────────
function GroupSection({ group, revenueMonthly, revenueTotal }) {
  const monthly = (group.monthly ?? []).map(Number)
  const total = Number(group.total ?? 0)
  const pctMonthly = monthly.map((v, i) => (revenueMonthly[i] ?? 0) > 0 ? (v / revenueMonthly[i]) * 100 : null)
  const pctTotal = revenueTotal > 0 ? (total / revenueTotal) * 100 : null

  return (
    <>
      {/* กลุ่ม: % row */}
      <tr className="bg-[#f5f5f5] border-t-2 border-black/10">
        <td
          colSpan={2}
          className="px-2 py-1 text-[11px] font-bold text-ink-800 italic"
        >
          {group.name}
        </td>
        {pctMonthly.map((p, i) => (
          <td key={i} className="text-right px-2 py-1 text-[11px] text-ink-500 tabular-nums">{fmtPct(p)}</td>
        ))}
        <td className="text-right px-2 py-1 text-[11px] text-ink-500 tabular-nums">{fmtPct(pctTotal)}</td>
        <td className="px-2 text-right text-[10px] text-ink-400">{group.code}</td>
      </tr>

      {/* รายการรหัสบัญชีในกลุ่ม */}
      {(group.accounts ?? []).map((a) => (
        <tr key={a.code} className="border-b border-black/[0.04] hover:bg-black/[0.015]">
          <td className="px-2 py-[3px] font-mono text-[10px] text-[#0077b6] w-20 whitespace-nowrap">{a.code}</td>
          <td className="px-2 py-[3px] text-ink-700 text-[11px]">{a.name}</td>
          {(a.monthly ?? []).map((v, i) => (
            <td key={i} className="text-right px-2 py-[3px] text-[11px] text-ink-700 tabular-nums whitespace-nowrap">
              {Number(v) !== 0 ? fmtV(Number(v)) : ''}
            </td>
          ))}
          <td className="text-right px-2 py-[3px] text-[11px] font-medium text-ink-800 tabular-nums whitespace-nowrap">{fmtV(Number(a.total))}</td>
          <td />
        </tr>
      ))}

      {/* รวมกลุ่ม */}
      <tr className="border-b-2 border-black/10 bg-white/60">
        <td colSpan={2} className="px-6 py-[3px] text-[11px] italic text-ink-400">รวม {group.name}</td>
        {monthly.map((v, i) => (
          <td key={i} className="text-right px-2 py-[3px] text-[11px] font-semibold text-ink-600 tabular-nums whitespace-nowrap">{fmtV(v)}</td>
        ))}
        <td className="text-right px-2 py-[3px] text-[11px] font-bold text-ink-700 tabular-nums whitespace-nowrap">{fmtV(total)}</td>
        <td />
      </tr>
    </>
  )
}

// ─── Main Page ──────────────────────────────────────────────────
export default function PLReportPage() {
  const { currentUser } = useAuth()
  const [year, setYear] = useState(new Date().getFullYear())
  const [raw, setRaw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canUse = hasPagePermission(currentUser, 'pl-report')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_executive_monthly_report', {
      p_actor_id: currentUser?.id ?? null, p_year: year,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setError(res.message)
    setRaw(res)
  }, [currentUser, year])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  // ─── คำนวณ summaries ─────────────────────────────────────────
  const computed = useMemo(() => {
    if (!raw) return null
    const rev = (raw.revenueMonthly ?? []).map(Number)
    const revTotal = Number(raw.revenueTotal ?? 0)

    const cogsGroups = (raw.groups ?? []).filter(isCogsGroup)
    const revenueGroups = (raw.groups ?? []).filter(isRevenueGroup)
    const otherGroups = (raw.groups ?? []).filter(g => !isCogsGroup(g) && !isRevenueGroup(g))

    // รวม COGS รายเดือน
    const cogsMonthly = Array(12).fill(0)
    cogsGroups.forEach(g => (g.monthly ?? []).forEach((v, i) => { cogsMonthly[i] += Number(v ?? 0) }))
    const cogsTotal = cogsMonthly.reduce((s, v) => s + v, 0)

    // กำไรขั้นต้น
    const gpMonthly = rev.map((r, i) => r - cogsMonthly[i])
    const gpTotal = revTotal - cogsTotal
    const gpPctMonthly = rev.map((r, i) => r > 0 ? (gpMonthly[i] / r) * 100 : null)
    const gpPctTotal = revTotal > 0 ? (gpTotal / revTotal) * 100 : null

    // รวมค่าใช้จ่ายทั้งหมด (ทุกกลุ่มที่ไม่ใช่ revenue)
    const totalExpMonthly = Array(12).fill(0)
    const nonRevGroups = (raw.groups ?? []).filter(g => !isRevenueGroup(g))
    nonRevGroups.forEach(g => (g.monthly ?? []).forEach((v, i) => { totalExpMonthly[i] += Number(v ?? 0) }))
    const totalExpTotal = totalExpMonthly.reduce((s, v) => s + v, 0)
    const totalExpPctMonthly = rev.map((r, i) => r > 0 ? (totalExpMonthly[i] / r) * 100 : null)
    const totalExpPctTotal = revTotal > 0 ? (totalExpTotal / revTotal) * 100 : null

    // กำไร(ขาดทุน)สุทธิ
    const netMonthly = rev.map((r, i) => r - totalExpMonthly[i])
    const netTotal = revTotal - totalExpTotal
    const netPctMonthly = rev.map((r, i) => r > 0 ? (netMonthly[i] / r) * 100 : null)
    const netPctTotal = revTotal > 0 ? (netTotal / revTotal) * 100 : null

    return {
      rev, revTotal,
      revenueGroups, cogsGroups, otherGroups,
      cogsMonthly, cogsTotal,
      gpMonthly, gpTotal, gpPctMonthly, gpPctTotal,
      totalExpMonthly, totalExpTotal, totalExpPctMonthly, totalExpPctTotal,
      netMonthly, netTotal, netPctMonthly, netPctTotal,
    }
  }, [raw])

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-full mx-auto space-y-4">
      {/* ─ Header ─ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">ประมาณการกำไรขาดทุน</h1>
          <p className="text-ink-500 text-sm mt-1">
            P&amp;L Report รายเดือน ปี {year} — ข้อมูลจากไฟล์ที่นำเข้าระบบ
          </p>
        </div>
        <select
          className="glass-input text-sm w-28"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center py-20 gap-3">
          <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-ink-500 text-sm">กำลังโหลด...</p>
        </div>
      )}

      {!loading && raw && computed && (
        <div className="bg-white rounded-2xl border border-black/10 shadow-sm overflow-x-auto">
          {/* Title bar */}
          <div className="px-5 py-3 border-b border-black/10 bg-[#f9f9f9] flex items-center gap-4">
            <p className="text-[11px] text-ink-500 uppercase tracking-wider font-semibold">ทับขวาง</p>
            <span className="text-black/20">|</span>
            <p className="text-[12px] text-ink-800 font-medium">
              ประมาณการกำไรขาดทุน เริ่มต้นธุรกิจตั้งแต่ตั้ง {year + 543}
            </p>
          </div>

          <table className="w-full text-[11px] border-collapse" style={{ minWidth: 1520 }}>
            {/* ─ Column headers ─ */}
            <thead>
              <tr className="border-b-2 border-black/20 bg-[#f0f0f0]">
                <th className="text-left px-2 py-1.5 font-semibold text-[10px] text-ink-500 w-20">รหัสบัญชี</th>
                <th className="text-left px-2 py-1.5 font-semibold text-[10px] text-ink-500 w-52">ชื่อบัญชี</th>
                {MONTH_SHORT.map((m) => (
                  <th key={m} className="text-right px-2 py-1.5 font-semibold text-[10px] text-ink-500 w-24">{m}</th>
                ))}
                <th className="text-right px-2 py-1.5 font-semibold text-[10px] text-ink-500 w-28">รวม</th>
                <th className="w-12" />
              </tr>
            </thead>

            <tbody>
              {/* ══════════ รายได้ ══════════ */}
              <tr className="bg-[#e8f5e9] border-b border-[#a5d6a7]">
                <td colSpan={2} className="px-2 py-1 font-bold text-[#1b5e20] text-[11px]">รายได้รวม</td>
                {computed.rev.map((v, i) => (
                  <td key={i} className="text-right px-2 py-1 font-bold text-[#1b5e20] tabular-nums whitespace-nowrap">{fmtV(v)}</td>
                ))}
                <td className="text-right px-2 py-1 font-bold text-[#1b5e20] tabular-nums whitespace-nowrap">{fmtV(computed.revTotal)}</td>
                <td />
              </tr>

              {/* รายได้ย่อย — Revenue groups */}
              {computed.revenueGroups.map(g =>
                (g.accounts ?? []).map(a => (
                  <tr key={a.code} className="border-b border-black/[0.04] hover:bg-[#f1f8e9]">
                    <td className="px-2 py-[3px] font-mono text-[10px] text-[#0077b6]">{a.code}</td>
                    <td className="px-2 py-[3px] text-ink-700 text-[11px]">{a.name}</td>
                    {(a.monthly ?? []).map((v, i) => (
                      <td key={i} className="text-right px-2 py-[3px] text-[11px] text-ink-700 tabular-nums">{Number(v) !== 0 ? fmtV(Number(v)) : ''}</td>
                    ))}
                    <td className="text-right px-2 py-[3px] text-[11px] font-medium text-ink-800 tabular-nums">{fmtV(Number(a.total))}</td>
                    <td />
                  </tr>
                ))
              )}

              {/* รายได้ชันกัน row */}
              {computed.revenueGroups.length > 0 && (() => {
                const rg = computed.revenueGroups
                const subMonthly = Array(12).fill(0)
                rg.forEach(g => (g.monthly ?? []).forEach((v, i) => { subMonthly[i] += Number(v ?? 0) }))
                const subTotal = subMonthly.reduce((s, v) => s + v, 0)
                return (
                  <tr className="bg-[#c8e6c9]/60 border-b-2 border-[#388e3c]">
                    <td colSpan={2} className="px-2 py-1 font-bold text-[#1b5e20] text-[11px] italic pl-4">รายได้ชันกัน</td>
                    {subMonthly.map((v, i) => (
                      <td key={i} className="text-right px-2 py-1 font-semibold text-[#1b5e20] tabular-nums">{fmtV(v)}</td>
                    ))}
                    <td className="text-right px-2 py-1 font-bold text-[#1b5e20] tabular-nums">{fmtV(subTotal)}</td>
                    <td />
                  </tr>
                )
              })()}

              {/* ══════════ ต้นทุนสินค้า (COGS) ══════════ */}
              {computed.cogsGroups.map((g) => (
                <GroupSection
                  key={g.groupId}
                  group={g}
                  revenueMonthly={computed.rev}
                  revenueTotal={computed.revTotal}
                />
              ))}

              {/* กำไรขั้นต้น */}
              {computed.cogsGroups.length > 0 && (
                <>
                  <tr className="bg-[#fff8e1] border-t-2 border-[#f9a825]">
                    <td colSpan={2} className="px-2 py-1 font-bold text-[#e65100] text-[11px] italic">% กำไรขั้นต้น</td>
                    {computed.gpPctMonthly.map((p, i) => (
                      <td key={i} className="text-right px-2 py-1 font-bold text-[#e65100] tabular-nums">{fmtPct(p)}</td>
                    ))}
                    <td className="text-right px-2 py-1 font-bold text-[#e65100] tabular-nums">{fmtPct(computed.gpPctTotal)}</td>
                    <td />
                  </tr>
                  <tr className="bg-[#fff8e1] border-b-2 border-[#f9a825]">
                    <td colSpan={2} className="px-2 py-1 font-bold text-[#e65100] text-[11px] pl-4">ต้นทุนสินค้า</td>
                    {computed.gpMonthly.map((v, i) => (
                      <td key={i} className="text-right px-2 py-1 font-bold text-[#e65100] tabular-nums">{fmtV(v)}</td>
                    ))}
                    <td className="text-right px-2 py-1 font-bold text-[#e65100] tabular-nums">{fmtV(computed.gpTotal)}</td>
                    <td />
                  </tr>
                </>
              )}

              {/* ══════════ ค่าใช้จ่ายอื่น ══════════ */}
              {computed.otherGroups.map((g) => (
                <GroupSection
                  key={g.groupId}
                  group={g}
                  revenueMonthly={computed.rev}
                  revenueTotal={computed.revTotal}
                />
              ))}

              {/* รวมค่าใช้จ่าย % */}
              <tr className="bg-[#e3f2fd] border-t-2 border-[#1565c0]">
                <td colSpan={2} className="px-2 py-1 font-bold text-[#0d47a1] text-[11px]">
                  รวมค่าใช้จ่ายทั้งหมดของกิจการ
                </td>
                {computed.totalExpPctMonthly.map((p, i) => (
                  <td key={i} className="text-right px-2 py-1 font-bold text-[#0d47a1] tabular-nums text-[10px]">{fmtPct(p)}</td>
                ))}
                <td className="text-right px-2 py-1 font-bold text-[#0d47a1] tabular-nums text-[10px]">{fmtPct(computed.totalExpPctTotal)}</td>
                <td />
              </tr>
              <tr className="bg-[#e3f2fd] border-b border-[#1565c0]">
                <td colSpan={2} className="px-2 py-[3px]" />
                {computed.totalExpMonthly.map((v, i) => (
                  <td key={i} className="text-right px-2 py-[3px] font-bold text-[#0d47a1] tabular-nums">{fmtV(v)}</td>
                ))}
                <td className="text-right px-2 py-[3px] font-bold text-[#0d47a1] tabular-nums">{fmtV(computed.totalExpTotal)}</td>
                <td />
              </tr>

              {/* DIF */}
              <tr className="border-b border-black/5">
                <td colSpan={2} className="px-2 py-[3px] text-ink-400 text-[11px]">DIF -</td>
                {Array(12).fill(null).map((_, i) => (
                  <td key={i} className="text-right px-2 py-[3px] text-ink-300 tabular-nums">-</td>
                ))}
                <td className="text-right px-2 py-[3px] text-ink-300 tabular-nums">-</td>
                <td />
              </tr>

              {/* ประมาณการกำไร(ขาดทุน)สุทธิ */}
              <tr className="bg-[#fce4ec] border-y-2 border-[#c62828]">
                <td colSpan={2} className="px-2 py-1.5 font-bold text-[#b71c1c] text-[11px]">
                  ประมาณการกำไร(ขาดทุน)สุทธิ
                </td>
                {computed.netMonthly.map((v, i) => (
                  <td
                    key={i}
                    className={`text-right px-2 py-1.5 font-bold tabular-nums ${v >= 0 ? 'text-[#1b5e20]' : 'text-[#b71c1c]'}`}
                  >
                    {fmtV(v)}
                  </td>
                ))}
                <td
                  className={`text-right px-2 py-1.5 font-bold tabular-nums ${computed.netTotal >= 0 ? 'text-[#1b5e20]' : 'text-[#b71c1c]'}`}
                >
                  {fmtV(computed.netTotal)}
                </td>
                <td />
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className="px-5 py-2 border-t border-black/5 bg-[#fafafa] flex items-center gap-4 text-[10px] text-ink-400">
            <span>% คำนวณเทียบรายได้รวม</span>
            <span>·</span>
            <span>กลุ่มที่ชื่อขึ้นต้น "ต้นทุนสินค้า" = COGS แยกคำนวณกำไรขั้นต้น</span>
            <span>·</span>
            <span>ข้อมูลจากไฟล์ที่นำเข้าหน้า "แนบไฟล์บัญชี"</span>
          </div>
        </div>
      )}

      {!loading && raw && computed && computed.revTotal === 0 && (raw.groups ?? []).length === 0 && (
        <div className="glass p-12 text-center space-y-3">
          <p className="text-4xl">📊</p>
          <p className="text-ink-700 font-medium">ยังไม่มีข้อมูลปี {year}</p>
          <p className="text-ink-400 text-sm">
            ไปที่ "แนบไฟล์บัญชี" เพื่ออัปโหลดไฟล์ประมาณการกำไรขาดทุน (.xlsx) ก่อน
          </p>
        </div>
      )}
    </div>
  )
}

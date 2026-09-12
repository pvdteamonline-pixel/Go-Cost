import { useState, useEffect, useCallback, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'
import { buildExecutivePivotData } from '../lib/executiveReportPivot'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function StatCard({ label, value, accent = 'text-gold-dark', sub }) {
  return (
    <div className="glass p-5">
      <p className="text-ink-600 text-xs mb-1">{label}</p>
      <p className={`font-display italic text-2xl ${accent}`}>{value}</p>
      {sub && <p className="text-ink-400 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function utilizationColor(pct) {
  if (pct === null || pct === undefined) return 'text-ink-400'
  if (pct > 100) return 'text-rose font-semibold'
  if (pct >= 80) return 'text-gold-dark font-medium'
  return 'text-sage font-medium'
}

function AlertBadge({ pct }) {
  if (pct === null || pct === undefined) return <span className="doc-badge bg-ink-100 text-ink-500">ไม่ได้ตั้งงบ</span>
  if (pct > 100) return <span className="doc-badge bg-rose-pale text-rose border-rose/30">🔴 เกินงบ! (+{(pct - 100).toFixed(1)}%)</span>
  if (pct >= 80) return <span className="doc-badge bg-gold-pale text-gold-dark border-gold/30">🟡 เตือน: ใช้ไป {pct.toFixed(1)}%</span>
  return <span className="doc-badge bg-sage-pale text-sage border-sage/30">🟢 ปกติ ({pct.toFixed(1)}%)</span>
}

// กล่องแสดงกลุ่มรหัสบัญชีพร้อม % ของรายได้สุทธิ, % ของรวม, และ Drill-down
function GroupBlock({ group, grandTotal, netRevenue, onInspect, isCollapsed, onToggleCollapse, selectedMonth }) {
  const pctOfTotal = grandTotal > 0 ? ((group.total / grandTotal) * 100).toFixed(1) : '0.0'
  const attributionRate = netRevenue > 0 ? ((group.total / netRevenue) * 100).toFixed(2) : null
  const avgMonthly = group.total / (selectedMonth ? 1 : 12)

  return (
    <div className="glass p-4 transition-all hover:border-gold/30 rounded-2xl shadow-sm">
      <div
        onClick={onToggleCollapse}
        className="flex items-center justify-between flex-wrap gap-2 cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <span className="text-ink-400 text-xs font-mono">{isCollapsed ? '▶' : '▼'}</span>
          <span className="doc-badge text-xs font-semibold">{group.code}</span>
          <h3 className="text-ink-900 font-medium text-sm">{group.name}</h3>
          {attributionRate && (
            <span className="text-[11px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-medium ml-1">
              {attributionRate}% ของรายได้สุทธิ
            </span>
          )}
          <span className="text-[11px] bg-ink-100 text-ink-700 px-2 py-0.5 rounded-full font-medium">
            {group.accounts.length} รหัส ({pctOfTotal}% ของยอดรวมกลุ่ม)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-gold-dark font-display italic text-base font-semibold block">{formatBaht(group.total)}</span>
            <span className="text-[10px] text-ink-400 font-normal">{selectedMonth ? 'ยอดเดือนที่เลือก' : 'เฉลี่ยต่อเดือน (หาร 12)'} {formatBaht(avgMonthly)}</span>
          </div>
          {onInspect && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onInspect(group)
              }}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 border border-black/10 hover:border-gold/50 cursor-pointer"
              title="จิ้มดูรายละเอียดย่อย"
            >
              🔍 รายละเอียด
            </button>
          )}
          <span className="text-xs text-ocean font-medium hover:underline">
            {isCollapsed ? 'ขยายดูรายการ' : 'ย่อเก็บ'}
          </span>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-3 pt-3 border-t border-black/10 space-y-1">
          {group.accounts.length === 0 ? (
            <p className="text-ink-400 text-xs py-1">ยังไม่มีรหัสบัญชีในกลุ่มนี้</p>
          ) : (
            <div className="divide-y divide-black/5">
              {group.accounts.map((a) => {
                const accPct = grandTotal > 0 ? ((a.total / grandTotal) * 100).toFixed(1) : '0.0'
                const grpPct = group.total > 0 ? ((a.total / group.total) * 100).toFixed(1) : '0.0'
                const accAttribution = netRevenue > 0 ? ((a.total / netRevenue) * 100).toFixed(2) : null
                return (
                  <div key={a.code} className="flex items-center justify-between py-2 text-sm hover:bg-black/[0.02] px-2 rounded">
                    <span className="text-ocean font-mono text-xs font-bold w-28 shrink-0">{a.code}</span>
                    <span className="text-ink-700 font-medium flex-1 px-2 text-xs">{a.name}</span>
                    <div className="flex items-center gap-4 text-xs">
                      {accAttribution && <span className="text-amber-800 font-medium text-[11px] tabular-nums">{accAttribution}% ของรายได้</span>}
                      <span className="text-ink-400 tabular-nums">{grpPct}% ของกลุ่ม</span>
                      <span className="text-ink-400 tabular-nums">{accPct}% ของรวม</span>
                      <span className="text-ink-900 tabular-nums font-semibold w-28 text-right">{formatBaht(a.total)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ExecutiveDashboardPage({ onNavigate }) {
  const { currentUser } = useAuth()

  // ── State ส่วนบน: P&L ภาพรวม + กราฟงบ ────────────────────────
  const [dashYear, setDashYear] = useState(new Date().getFullYear())
  const [dashData, setDashData] = useState(null)
  const [dashLoading, setDashLoading] = useState(true)
  const [dashError, setDashError] = useState('')

  // ── State ส่วนล่าง: รายงานแยกกลุ่มรหัสบัญชี ──────────────────
  const [rptYear, setRptYear]   = useState(new Date().getFullYear())
  const [rptMonth, setRptMonth] = useState('')
  const [rptData, setRptData]   = useState(null)
  const [rptLoading, setRptLoading] = useState(true)
  const [rptError, setRptError]     = useState('')
  const [collapsedRptGroups, setCollapsedRptGroups] = useState({})

  const toggleRptGroup = (groupId) => {
    setCollapsedRptGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }))
  }

  const expandAllRpt = () => setCollapsedRptGroups({})
  const collapseAllRpt = () => {
    const allCollapsed = {}
    ;(rptData?.groups ?? []).forEach((g) => { allCollapsed[g.groupId] = true })
    setCollapsedRptGroups(allCollapsed)
  }

  // ── State Drill-down Modal ───────────────────────────────────
  const [drillTarget, setDrillTarget] = useState(null)
  const [drillItems, setDrillItems] = useState([])
  const [drillLoading, setDrillLoading] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState(null)

  const dashRequest = useRef(0)
  const canDash = hasPagePermission(currentUser, 'exec-dashboard')
  const canRpt  = hasPagePermission(currentUser, 'exec-report')

  // โหลด P&L ภาพรวม
  const loadDash = useCallback(async () => {
    const version = ++dashRequest.current
    setDashLoading(true)
    setDashData(null)
    setDashError('')
    try {
      const [dashboard, report] = await Promise.all([
        supabase.rpc('get_executive_dashboard', { p_actor_id: currentUser?.id ?? null, p_year: dashYear }),
        canRpt ? supabase.rpc('get_executive_monthly_report', { p_actor_id: currentUser?.id ?? null, p_year: dashYear }) : Promise.resolve(null),
      ])
      if (version !== dashRequest.current) return
      if (dashboard.error || !dashboard.data?.success) throw new Error(dashboard.error?.message || dashboard.data?.message || 'โหลดข้อมูลไม่สำเร็จ')
      const res = dashboard.data
      let corrected
      if (canRpt) {
        if (report.error || !report.data?.success) throw new Error('ไม่สามารถตรวจสอบยอดกับรายงานผู้บริหารได้ กรุณารีเฟรช')
        let mappings = {}
        try { mappings = JSON.parse(localStorage.getItem(`gocost_pivot_custom_mappings_${dashYear}`) || '{}') } catch { /* Use the standard mapping. */ }
        const pivot = buildExecutivePivotData(report.data, dashYear, '', mappings)
        corrected = { ...res, totalRevenue: pivot.totalRevSum, totalCogs: pivot.cogsTotal, grossProfit: pivot.grossProfitTotal, totalExpenses: pivot.grandTotalExpSum, netProfit: pivot.netProfitTotal }
      } else {
        const costs = (res.byCategory || []).filter(row => /ต้นทุนขาย|ต้นทุนผลิต|ต้นทุนสินค้า/.test(row.category))
        const cogs = costs.reduce((sum, row) => sum + Number(row.actual || 0), 0)
        corrected = { ...res, totalCogs: cogs, grossProfit: res.totalRevenue - cogs, totalExpenses: res.totalExpenses - cogs, netProfit: res.totalRevenue - res.totalExpenses }
      }
      for (const [key, value] of [['cogsPct', corrected.totalCogs], ['grossProfitPct', corrected.grossProfit], ['expensePct', corrected.totalExpenses], ['netProfitPct', corrected.netProfit]]) {
        corrected[key] = corrected.totalRevenue !== 0 ? (value / corrected.totalRevenue * 100).toFixed(2) : null
      }
      setDashData(corrected)
      setLastRefreshed(new Date())
    } catch (error) {
      if (version === dashRequest.current) setDashError(error.message)
    } finally {
      if (version === dashRequest.current) setDashLoading(false)
    }
  }, [currentUser?.id, dashYear, canRpt])

  // โหลดรายละเอียดตามกลุ่มรหัสบัญชี
  const loadRpt = useCallback(async () => {
    if (!canRpt) return
    setRptLoading(true)
    setRptError('')
    const [itemized, monthly] = await Promise.all([
      supabase.rpc('get_executive_itemized_report', {
        p_actor_id: currentUser?.id ?? null,
        p_year: rptYear,
        p_month: rptMonth ? Number(rptMonth) : null,
      }),
      supabase.rpc('get_executive_monthly_report', { p_actor_id: currentUser?.id ?? null, p_year: rptYear }),
    ])
    const { data: res, error: err } = itemized
    setRptLoading(false)
    if (err) return setRptError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setRptError(res.message)
    let mappings = {}
    try { mappings = JSON.parse(localStorage.getItem(`gocost_pivot_custom_mappings_${rptYear}`) || '{}') } catch { /* Use standard mapping. */ }
    const netRevenue = !monthly.error && monthly.data?.success ? buildExecutivePivotData(monthly.data, rptYear, rptMonth, mappings).totalRevSum : null
    setRptData({ ...res, netRevenue })
  }, [currentUser, rptYear, rptMonth, canRpt])

  useEffect(() => { if (canDash) loadDash() }, [canDash, loadDash])
  useEffect(() => { loadRpt() }, [loadRpt])

  // Drill-down fetcher
  const handleInspectGroup = async (group) => {
    setDrillTarget(group)
    setDrillLoading(true)
    setDrillItems([])
    
    const { data: res, error: err } = await supabase.rpc('get_group_detail_by_period', {
      p_actor_id: currentUser?.id ?? null,
      p_group_id: group.groupId || null,
      p_year: rptYear,
      p_month: rptMonth ? Number(rptMonth) : null,
    })
    setDrillLoading(false)
    if (!err && res?.success) {
      setDrillItems(res.items || [])
    }
  }

  if (!canDash) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  const chartData = dashData?.byCategory?.map((c) => ({
    name: c.category.replace('ค่าใช้จ่าย ', ''),
    งบ: c.budget,
    ใช้จริง: c.actual,
  })) ?? []

  const isProfit = (dashData?.netProfit ?? 0) >= 0

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* ══════════════════════════════════════════════
          ส่วนที่ 1 — P&L ภาพรวม + กราฟงบประมาณ
          filter: ปีเดียว (แยกจากส่วนล่าง)
      ══════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display italic text-3xl text-ink-900">แดชบอร์ดฝ่ายบริหาร</h1>
            <p className="text-ink-600 text-sm mt-1">สรุปกำไร-ขาดทุน Control & Alert System และงบประมาณเทียบยอดใช้จริง</p>
          </div>
          <div className="flex items-center gap-2">
            {lastRefreshed && (
              <span className="text-ink-400 text-xs">
                อัพเดตล่าสุด: {lastRefreshed.toLocaleTimeString('th-TH')}
              </span>
            )}
            <button
              onClick={() => { loadDash(); loadRpt() }}
              disabled={dashLoading || rptLoading}
              className="btn-ghost text-sm flex items-center gap-1.5 disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <span className={dashLoading || rptLoading ? 'animate-spin' : ''}>🔄</span>
              รีเฟรช
            </button>
            <select
              id="exec-dash-year"
              className="glass-input text-sm w-32"
              value={dashYear}
              onChange={(e) => setDashYear(Number(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {dashError && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{dashError}</p>}
        {dashLoading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

        {!dashLoading && dashData && (
          <>
            {/* สรุปกำไร-ขาดทุนภาพรวม (5 การ์ดตามหลักการบริหาร P&L) */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatCard
                label="รายได้สุทธิรวม"
                value={formatBaht(dashData.totalRevenue)}
                accent="text-sage"
                sub="100.0% ฐานรายได้สุทธิ"
              />
              <StatCard
                label="ต้นทุนสินค้า (COGS)"
                value={formatBaht(dashData.totalCogs ?? 0)}
                accent="text-ink-700"
                sub={dashData.cogsPct ? `${dashData.cogsPct}% ของรายได้` : '-'}
              />
              <StatCard
                label="กำไรขั้นต้น (Gross Profit)"
                value={formatBaht(dashData.grossProfit ?? (dashData.totalRevenue - (dashData.totalCogs ?? 0)))}
                accent={(dashData.grossProfit ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose'}
                sub={dashData.grossProfitPct ? `${dashData.grossProfitPct}% ของรายได้` : '-'}
              />
              <StatCard
                label="ค่าใช้จ่ายดำเนินงาน (ไม่รวม COGS)"
                value={formatBaht(dashData.totalExpenses)}
                accent="text-rose"
                sub={dashData.expensePct ? `${dashData.expensePct}% ของรายได้สุทธิ` : '-'}
              />
              <StatCard
                label={isProfit ? 'กำไรสุทธิ (ประมาณการ)' : 'ขาดทุนสุทธิ (ประมาณการ)'}
                value={formatBaht(Math.abs(dashData.netProfit))}
                accent={isProfit ? 'text-sage' : 'text-rose'}
                sub={dashData.netProfitPct ? `${dashData.netProfitPct}% สัดส่วนกำไร` : (isProfit ? '▲ กำไรสุทธิ' : '▼ ขาดทุนสุทธิ')}
              />
            </div>

            {/* Guideline Banner */}
            <div className="glass p-3 bg-amber-500/5 border-amber-500/20 text-xs text-amber-900 flex items-center justify-between gap-3">
              <span>💡 <b>Control & Alert Manager:</b> ระบบแจ้งเตือนอัตโนมัติเมื่อใช้เกิน 80% (🟡 เตือน) และเกิน 100% (🔴 เกินงบ)</span>
              <button onClick={() => onNavigate && onNavigate('budgets')} className="text-amber-700 underline font-medium hover:text-amber-900 shrink-0">
                ตั้งงบประมาณ ⚙️
              </button>
            </div>

            {/* กราฟงบเทียบยอดใช้จริง */}
            <div className="glass p-6">
              <h2 className="text-ink-900 font-medium mb-4">งบประมาณเทียบยอดใช้จ่ายจริงรายหมวดหมู่</h2>
              {chartData.length === 0 ? (
                <p className="text-ink-400 text-sm text-center py-12">ยังไม่มีข้อมูลงบหรือรายจ่ายในปีนี้</p>
              ) : (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                    <XAxis dataKey="name" tick={{ fill: '#6e6e73', fontSize: 10 }} angle={-15} textAnchor="end" height={70} />
                    <YAxis tick={{ fill: '#6e6e73', fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatBaht(v)} contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="งบ" fill="#8484c2" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ใช้จริง" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* ตารางแจกแจงรายหมวดหมู่ + Alert System & % */}
            <div className="glass p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">หมวดหมู่</th>
                    <th className="px-4 py-3">งบที่ตั้งไว้</th>
                    <th className="px-4 py-3">ใช้จริง</th>
                    <th className="px-4 py-3">คงเหลือ</th>
                    <th className="px-4 py-3">% ใช้ไป</th>
                    <th className="px-4 py-3">สถานะ Control Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {(dashData.byCategory ?? []).length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-400">ยังไม่มีข้อมูล</td></tr>
                  )}
                  {(dashData.byCategory ?? []).map((c) => {
                    const totalExp = (dashData.byCategory || []).reduce((sum, row) => sum + Number(row.actual || 0), 0)
                    const sharePct = totalExp !== 0 ? ((c.actual / totalExp) * 100).toFixed(1) : '—'
                    return (
                      <tr key={c.category} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01]">
                        <td className="px-4 py-3 text-ink-900 font-medium">
                          {c.category}
                          <span className="text-xs text-ink-400 font-normal block">({sharePct}% ของรายจ่ายทั้งหมด)</span>
                        </td>
                        <td className="px-4 py-3 text-ink-700">{c.budget > 0 ? formatBaht(c.budget) : <span className="text-ink-400">ยังไม่ได้ตั้งงบ</span>}</td>
                        <td className="px-4 py-3 text-ink-700 font-medium">{formatBaht(c.actual)}</td>
                        <td className={`px-4 py-3 ${c.remaining < 0 ? 'text-rose font-medium' : 'text-ink-700'}`}>{c.budget > 0 ? formatBaht(c.remaining) : '—'}</td>
                        <td className={`px-4 py-3 ${utilizationColor(c.pctUsed)}`}>
                          {c.pctUsed === null ? '-' : `${c.pctUsed}%`}
                        </td>
                        <td className="px-4 py-3">
                          <AlertBadge pct={c.pctUsed} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* เส้นแบ่ง 2 ส่วน */}
      <div className="border-t-2 border-dashed border-black/10" />

      {/* ══════════════════════════════════════════════
          ส่วนที่ 2 — รายละเอียดแยกตามกลุ่มรหัสบัญชี + จิ้มแล้วรู้
          filter: ปี + เดือน (แยกจากส่วนบน)
      ══════════════════════════════════════════════ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display italic text-2xl text-ink-900">รายละเอียดตามกลุ่มรหัสบัญชี (Drill-down)</h2>
            <p className="text-ink-600 text-sm mt-0.5">
              แสดง % ของยอดรวม และสามารถกด <b>🔍 จิ้มดูรายการ</b> เพื่อเจาะลึกที่มาของยอดใช้จ่ายในเดือน/ปี ได้ทันที
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <button
              type="button"
              onClick={expandAllRpt}
              className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1 border border-black/10 hover:bg-black/5 cursor-pointer"
            >
              <span>📂</span> ขยายทั้งหมด
            </button>
            <button
              type="button"
              onClick={collapseAllRpt}
              className="btn-ghost text-xs px-2.5 py-1.5 flex items-center gap-1 border border-black/10 hover:bg-black/5 cursor-pointer"
            >
              <span>📁</span> ย่อทั้งหมด
            </button>
            <select
              id="exec-rpt-month"
              className="glass-input text-sm w-36"
              value={rptMonth}
              onChange={(e) => setRptMonth(e.target.value)}
            >
              <option value="">ทั้งปี</option>
              {THAI_MONTHS.map((name, i) => (
                <option key={i + 1} value={i + 1}>{name}</option>
              ))}
            </select>
            <select
              id="exec-rpt-year"
              className="glass-input text-sm w-28"
              value={rptYear}
              onChange={(e) => setRptYear(Number(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {rptError && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{rptError}</p>}

        {!canRpt && (
          <p className="text-ink-400 text-sm bg-ink-50 border border-black/10 rounded-lg px-4 py-3">
            คุณไม่มีสิทธิ์ดูรายงานส่วนนี้ — ติดต่อ Admin เพื่อขอสิทธิ์ <code className="text-xs bg-black/5 rounded px-1">exec-report</code>
          </p>
        )}

        {canRpt && rptLoading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

        {canRpt && !rptLoading && rptData && (
          <>
            {/* ยอดรวมส่วนล่าง */}
            <div className="glass p-4 flex items-center justify-between">
              <div>
                <p className="text-ink-600 text-sm font-medium">
                  ยอดรวมทุกกลุ่มรหัสบัญชี{rptMonth ? ` ${THAI_MONTHS[Number(rptMonth) - 1]}` : ''} {rptYear}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">รวมทุกกลุ่มรหัสบัญชีที่มีข้อมูลในระบบ</p>
              </div>
              <p className="font-display italic text-3xl text-gold-dark font-bold">{formatBaht(rptData.grandTotal)}</p>
            </div>

            {/* กลุ่มรหัสบัญชีจากหน้า "กลุ่มรหัสบัญชี" พร้อม % รวม และ % ของรายได้สุทธิ */}
            {rptData.groups?.length > 0
              ? rptData.groups.map((g) => (
                  <GroupBlock
                    key={g.groupId}
                    group={g}
                    grandTotal={rptData.grandTotal}
                    selectedMonth={rptMonth}
                    netRevenue={rptData.netRevenue}
                    onInspect={handleInspectGroup}
                    isCollapsed={Boolean(collapsedRptGroups[g.groupId])}
                    onToggleCollapse={() => toggleRptGroup(g.groupId)}
                  />
                ))
              : null
            }

            {/* รหัสที่ยังไม่ได้จัดกลุ่ม — แสดงเป็น warning banner */}
            {rptData.ungroupedAccounts?.length > 0 && (() => {
              const ugTotal = rptData.ungroupedAccounts.reduce((s, a) => s + a.total, 0)
              return (
                <div className="bg-amber-50 border border-amber-300/60 rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                    <div>
                      <p className="text-amber-800 font-medium text-sm">
                        มีรหัสบัญชีที่ยังไม่ได้จัดกลุ่ม {rptData.ungroupedAccounts.length} รหัส — ยอดรวม {formatBaht(ugTotal)} บาท
                      </p>
                      <p className="text-amber-600 text-xs mt-0.5">รหัสเหล่านี้ถูกแยกออกจากรายงาน กรุณาจัดกลุ่มก่อนเพื่อให้ยอดรวมถูกต้องสมบูรณ์</p>
                    </div>
                  </div>
                  {onNavigate && (
                    <button
                      onClick={() => onNavigate('account-groups')}
                      className="btn-primary text-xs px-3 py-1.5 shrink-0"
                    >
                      📂 ไปจัดกลุ่มรหัสบัญชี
                    </button>
                  )}
                </div>
              )
            })()}

            {/* กรณีไม่มีข้อมูล */}
            {!rptData.groups?.length && !rptData.ungroupedAccounts?.length && (
              <p className="text-ink-400 text-sm text-center py-10 glass rounded-xl">
                ยังไม่มีข้อมูลในช่วงเวลานี้ — กรุณาแนบไฟล์ประมาณการกำไรขาดทุนก่อน
              </p>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════
          Modal Drill-down: "จิ้มแล้วรู้ว่าใช้จ่ายกับอะไรบ้าง"
      ══════════════════════════════════════════════ */}
      {drillTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-solid max-w-3xl w-full max-h-[85vh] flex flex-col rounded-2xl shadow-2xl border border-black/10 overflow-hidden">
            <div className="px-6 py-4 border-b border-black/10 flex items-center justify-between bg-gold-pale/30">
              <div>
                <span className="doc-badge text-xs mb-1">Drill-down Inspect</span>
                <h3 className="font-display italic text-xl text-ink-900">
                  รายการย่อย: {drillTarget.name} ({rptMonth ? THAI_MONTHS[Number(rptMonth) - 1] : 'ทั้งปี'} {rptYear})
                </h3>
              </div>
              <button
                onClick={() => setDrillTarget(null)}
                className="text-ink-400 hover:text-ink-900 text-xl px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              {drillLoading ? (
                <p className="text-ink-500 text-sm text-center py-8">กำลังดึงที่มารายการย่อย...</p>
              ) : drillItems.length === 0 ? (
                <p className="text-ink-400 text-sm text-center py-8">ไม่พบบรรทัดรายการในไฟล์แนบ</p>
              ) : (
                <div className="glass p-0 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase">
                        <th className="px-4 py-2.5">รหัสบัญชี</th>
                        <th className="px-4 py-2.5">ชื่อบัญชี</th>
                        <th className="px-4 py-2.5">เดือน</th>
                        <th className="px-4 py-2.5">ยอดเงิน (บาท)</th>
                        <th className="px-4 py-2.5">ไฟล์ที่มา</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drillItems.map((item, idx) => (
                        <tr key={idx} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01]">
                          <td className="px-4 py-2.5 font-mono text-ocean text-xs">{item.accountCode}</td>
                          <td className="px-4 py-2.5 text-ink-800">{item.accountName}</td>
                          <td className="px-4 py-2.5 text-ink-600">{THAI_MONTHS[item.month - 1] || item.month}</td>
                          <td className="px-4 py-2.5 text-ink-900 font-semibold tabular-nums">{formatBaht(item.amount)}</td>
                          <td className="px-4 py-2.5 text-ink-400 text-xs truncate max-w-[150px]" title={item.fileName}>
                            📄 {item.fileName || 'ไฟล์นำเข้า'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-black/10 bg-ink-50 flex items-center justify-between">
              <span className="text-xs text-ink-500">รวมทั้งสิ้น {drillItems.length} รายการ</span>
              <button onClick={() => setDrillTarget(null)} className="btn-secondary text-xs px-4 py-1.5">
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

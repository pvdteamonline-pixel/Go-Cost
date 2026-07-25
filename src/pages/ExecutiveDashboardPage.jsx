import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { THAI_MONTHS } from '../lib/constants'

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

// กล่องแสดงกลุ่มรหัสบัญชีพร้อม % รวม และ Drill-down
function GroupBlock({ group, grandTotal, onInspect }) {
  const pctOfTotal = grandTotal > 0 ? ((group.total / grandTotal) * 100).toFixed(1) : '0.0'

  return (
    <div className="glass p-4 transition-all hover:border-gold/30">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="doc-badge text-xs">{group.code}</span>
          <h3 className="text-ink-900 font-medium text-sm">{group.name}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-ink-100 text-ink-700 px-2 py-0.5 rounded-full font-medium">
            คิดเป็น {pctOfTotal}% ของยอดรวม
          </span>
          <span className="text-gold-dark font-display italic text-base font-semibold">{formatBaht(group.total)}</span>
          {onInspect && (
            <button
              onClick={() => onInspect(group)}
              className="btn-ghost text-xs px-2.5 py-1 flex items-center gap-1 border border-black/10 hover:border-gold/50"
              title="จิ้มดูรายละเอียดย่อย"
            >
              🔍 จิ้มดูรายการ
            </button>
          )}
        </div>
      </div>

      {group.accounts.length === 0 ? (
        <p className="text-ink-400 text-xs py-1">ยังไม่มีรหัสบัญชีในกลุ่มนี้</p>
      ) : (
        <div className="divide-y divide-black/5">
          {group.accounts.map((a) => {
            const accPct = grandTotal > 0 ? ((a.total / grandTotal) * 100).toFixed(1) : '0.0'
            return (
              <div key={a.code} className="flex items-center justify-between py-1.5 text-sm hover:bg-black/[0.02] px-1 rounded">
                <span className="text-ocean font-mono text-xs w-28 shrink-0">{a.code}</span>
                <span className="text-ink-600 flex-1 px-2">{a.name}</span>
                <span className="text-xs text-ink-400 mr-4 tabular-nums">{accPct}% ของรวม</span>
                <span className="text-ink-900 tabular-nums font-medium">{formatBaht(a.total)}</span>
              </div>
            )
          })}
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

  // ── State Drill-down Modal ───────────────────────────────────
  const [drillTarget, setDrillTarget] = useState(null)
  const [drillItems, setDrillItems] = useState([])
  const [drillLoading, setDrillLoading] = useState(false)

  const canDash = hasPagePermission(currentUser, 'exec-dashboard')
  const canRpt  = hasPagePermission(currentUser, 'exec-report')

  // โหลด P&L ภาพรวม
  const loadDash = useCallback(async () => {
    setDashLoading(true)
    setDashError('')
    const { data: res, error: err } = await supabase.rpc('get_executive_dashboard', {
      p_actor_id: currentUser?.id ?? null, p_year: dashYear,
    })
    setDashLoading(false)
    if (err) return setDashError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setDashError(res.message)
    setDashData(res)
  }, [currentUser, dashYear])

  // โหลดรายละเอียดตามกลุ่มรหัสบัญชี
  const loadRpt = useCallback(async () => {
    if (!canRpt) return
    setRptLoading(true)
    setRptError('')
    const { data: res, error: err } = await supabase.rpc('get_executive_itemized_report', {
      p_actor_id: currentUser?.id ?? null,
      p_year:  rptYear,
      p_month: rptMonth ? Number(rptMonth) : null,
    })
    setRptLoading(false)
    if (err) return setRptError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setRptError(res.message)
    setRptData(res)
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

        {dashError && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{dashError}</p>}
        {dashLoading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

        {!dashLoading && dashData && (
          <>
            {/* สรุปกำไร-ขาดทุนภาพรวม */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard label="รายได้รวม (ยอดขายดันเข้าร้านค้าจาก Workshop)" value={formatBaht(dashData.totalRevenue)} accent="text-sage" />
              <StatCard label="รายจ่ายรวม" value={formatBaht(dashData.totalExpenses)} accent="text-rose" />
              <StatCard
                label={isProfit ? 'กำไรสุทธิ' : 'ขาดทุนสุทธิ'}
                value={formatBaht(Math.abs(dashData.netProfit))}
                accent={isProfit ? 'text-sage' : 'text-rose'}
                sub={isProfit ? '▲ รายได้มากกว่ารายจ่าย' : '▼ รายจ่ายมากกว่ารายได้'}
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
                    const totalExp = dashData.totalExpenses > 0 ? dashData.totalExpenses : 1
                    const sharePct = ((c.actual / totalExp) * 100).toFixed(1)
                    return (
                      <tr key={c.category} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01]">
                        <td className="px-4 py-3 text-ink-900 font-medium">
                          {c.category}
                          <span className="text-xs text-ink-400 font-normal block">({sharePct}% ของรายจ่ายทั้งหมด)</span>
                        </td>
                        <td className="px-4 py-3 text-ink-700">{c.budget > 0 ? formatBaht(c.budget) : <span className="text-ink-400">ยังไม่ได้ตั้งงบ</span>}</td>
                        <td className="px-4 py-3 text-ink-700 font-medium">{formatBaht(c.actual)}</td>
                        <td className={`px-4 py-3 ${c.remaining < 0 ? 'text-rose font-medium' : 'text-ink-700'}`}>{formatBaht(c.remaining)}</td>
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
          <div className="flex gap-2 items-center">
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
                  ยอดรวมรายจ่ายทั้งหมด{rptMonth ? ` ${THAI_MONTHS[Number(rptMonth) - 1]}` : ''} {rptYear}
                </p>
                <p className="text-xs text-ink-400 mt-0.5">รวมทุกกลุ่มรหัสบัญชีที่มีข้อมูลในระบบ</p>
              </div>
              <p className="font-display italic text-3xl text-gold-dark font-bold">{formatBaht(rptData.grandTotal)}</p>
            </div>

            {/* กลุ่มรหัสบัญชีจากหน้า "กลุ่มรหัสบัญชี" พร้อม % รวม */}
            {rptData.groups?.length > 0
              ? rptData.groups.map((g) => (
                  <GroupBlock
                    key={g.groupId}
                    group={g}
                    grandTotal={rptData.grandTotal}
                    onInspect={handleInspectGroup}
                  />
                ))
              : null
            }

            {/* รหัสที่ยังไม่ได้จัดกลุ่ม */}
            {rptData.ungroupedAccounts?.length > 0 && (
              <GroupBlock
                group={{
                  code: '—',
                  name: 'รหัสบัญชีที่ยังไม่มีกลุ่ม',
                  total: rptData.ungroupedAccounts.reduce((s, a) => s + a.total, 0),
                  accounts: rptData.ungroupedAccounts,
                }}
                grandTotal={rptData.grandTotal}
                onInspect={handleInspectGroup}
              />
            )}

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

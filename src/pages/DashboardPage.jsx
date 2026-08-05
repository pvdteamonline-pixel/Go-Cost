import { useState, useEffect, useCallback } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { THAI_MONTHS } from '../lib/constants'
import ExportModal from '../components/ExportModal'

const PALETTE = ['#c9a84c', '#4a7c59', '#1e6fa8', '#c0392b', '#8484c2', '#e8c96a', '#6aaa7e']

const VIEW_MODES = [
  { value: 'all', label: 'ทั้งหมด (ค่าใช้จ่าย + Workshop)' },
  { value: 'expense', label: 'เฉพาะค่าใช้จ่าย' },
  { value: 'workshop', label: 'เฉพาะ Workshop' },
]

function StatCard({ label, value, accent = 'text-gold-dark' }) {
  return (
    <div className="glass p-5">
      <p className="text-ink-600 text-xs mb-1">{label}</p>
      <p className={`font-display italic text-2xl ${accent}`}>{value}</p>
    </div>
  )
}

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function buildDashboardExcel(stats, workshopSummary, categoryData, monthData) {
  const rows = [['แดชบอร์ด — สรุป']]
  if (stats) {
    rows.push([])
    rows.push(['ยอดใช้จ่ายรวม', stats.totalExpenses])
    rows.push(['รายได้ (ยอดขายดันเข้าร้านค้า)', stats.totalIncome])
    rows.push(['จำนวนเอกสาร', stats.docCount])
    rows.push(['เฉลี่ยต่อเอกสาร', stats.avgPerDoc])
    rows.push(['หมวดหมู่สูงสุด', stats.topCategory])
    rows.push([])
    rows.push(['สัดส่วนตามหมวดหมู่'])
    rows.push(['หมวดหมู่', 'ยอด'])
    for (const c of categoryData) rows.push([c.name, c.value])
    rows.push([])
    rows.push(['ยอดใช้จ่ายรายเดือน'])
    rows.push(['เดือน', 'ยอด'])
    for (const m of monthData) rows.push([m.month, m.total])
  }
  if (workshopSummary) {
    rows.push([])
    rows.push(['แดชบอร์ด Workshop'])
    rows.push(['ยอดขาย Workshop รวม', workshopSummary.totalWorkshopSales])
    rows.push(['ยอดขายดันเข้าร้านค้า', workshopSummary.totalPushSales])
    rows.push(['Workshop ที่เสร็จสิ้น', workshopSummary.completedCount])
    rows.push(['รออนุมัติ', workshopSummary.pendingApprovalCount])
    rows.push(['รอเซลล์อัพเดตข้อมูล', workshopSummary.awaitingSalesCount])
    rows.push(['ถูกปฏิเสธ', workshopSummary.rejectedCount])
  }
  return [{ name: 'แดชบอร์ด', rows }]
}

export default function DashboardPage() {
  const [viewMode, setViewMode] = useState('all')
  const [filters, setFilters] = useState({ year: '', month: '', category: '', detail: '', store: '' })
  const [options, setOptions] = useState({ years: [], categories: [], details: [], storeNames: [] })
  const [stats, setStats] = useState(null)
  const [workshopSummary, setWorkshopSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const showExpense = viewMode === 'all' || viewMode === 'expense'
  const showWorkshop = viewMode === 'all' || viewMode === 'workshop'

  const loadOptions = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('get_filter_options')
    if (!err && data?.success) setOptions(data)
  }, [])

  const loadStats = useCallback(async () => {
    setLoading(true)
    setError('')
    const cleanFilters = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''))
    const workshopFilters = {}
    if (filters.year) workshopFilters.year = Number(filters.year)
    if (filters.month) workshopFilters.month = Number(filters.month)

    const [statsRes, workshopRes] = await Promise.all([
      supabase.rpc('get_dashboard_stats', { p_filters: cleanFilters }),
      supabase.rpc('get_workshop_sales_summary', { p_filters: workshopFilters }),
    ])
    setLoading(false)
    if (statsRes.error) {
      setError('เกิดข้อผิดพลาด: ' + statsRes.error.message)
      return
    }
    if (!statsRes.data.success) {
      setError(statsRes.data.message)
      return
    }
    setStats(statsRes.data)
    if (!workshopRes.error && workshopRes.data?.success) setWorkshopSummary(workshopRes.data)
  }, [filters])

  useEffect(() => { loadOptions() }, [loadOptions])
  useEffect(() => { loadStats() }, [loadStats])

  const categoryData = stats?.byCategory
    ? Object.entries(stats.byCategory).map(([name, value]) => ({ name, value }))
    : []
  const monthData = stats?.byMonth
    ? Object.entries(stats.byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }))
    : []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">แดชบอร์ด</h1>
          <p className="text-ink-600 text-sm mt-1">ภาพรวมค่าใช้จ่ายและ Workshop ตามตัวกรอง</p>
        </div>
        <div className="flex items-center gap-2">
          {stats && <ExportModal fileNameBase="แดชบอร์ด" excelSheets={buildDashboardExcel(stats, workshopSummary, categoryData, monthData)} pdfPreview={<DashboardPdfPreview stats={stats} workshopSummary={workshopSummary} categoryData={categoryData} monthData={monthData} />} />}
          <select className="glass-input text-sm w-64" value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
            {VIEW_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
      </div>

      <div className="glass p-5 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <select className="glass-input text-sm" value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}>
          <option value="">ทุกปี</option>
          {options.years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="glass-input text-sm" value={filters.month} onChange={(e) => setFilters((f) => ({ ...f, month: e.target.value }))}>
          <option value="">ทุกเดือน</option>
          {THAI_MONTHS.map((name, i) => <option key={i + 1} value={i + 1}>{name}</option>)}
        </select>
        {showExpense && (
          <>
            <select className="glass-input text-sm" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))}>
              <option value="">ทุกหมวดหมู่</option>
              {options.categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="glass-input text-sm" value={filters.detail} onChange={(e) => setFilters((f) => ({ ...f, detail: e.target.value }))}>
              <option value="">ทุกรายละเอียด</option>
              {options.details.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select className="glass-input text-sm" value={filters.store} onChange={(e) => setFilters((f) => ({ ...f, store: e.target.value }))}>
              <option value="">ทุกร้านค้า</option>
              {options.storeNames.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </>
        )}
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      {!loading && showExpense && stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <StatCard label="ยอดใช้จ่ายรวม" value={formatBaht(stats.totalExpenses)} />
            <StatCard label="รายได้ (ยอดขายดันเข้าร้านค้า)" value={formatBaht(stats.totalIncome)} accent="text-sage" />
            <StatCard label="จำนวนเอกสาร" value={stats.docCount} accent="text-ocean" />
            <StatCard label="เฉลี่ยต่อเอกสาร" value={formatBaht(stats.avgPerDoc)} accent="text-sage" />
            <StatCard label="หมวดหมู่สูงสุด" value={stats.topCategory} accent="text-rose" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass p-6">
              <h2 className="text-ink-900 font-medium mb-4">สัดส่วนตามหมวดหมู่</h2>
              {categoryData.length === 0 ? (
                <p className="text-ink-400 text-sm text-center py-12">ไม่มีข้อมูล</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} paddingAngle={2}>
                      {categoryData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatBaht(v)} contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="glass p-6">
              <h2 className="text-ink-900 font-medium mb-4">ยอดใช้จ่ายรายเดือน</h2>
              {monthData.length === 0 ? (
                <p className="text-ink-400 text-sm text-center py-12">ไม่มีข้อมูล</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={monthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.08)" />
                    <XAxis dataKey="month" tick={{ fill: '#6e6e73', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6e6e73', fontSize: 11 }} />
                    <Tooltip formatter={(v) => formatBaht(v)} contentStyle={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }} />
                    <Bar dataKey="total" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && showWorkshop && workshopSummary && (
        <div className="glass p-6 space-y-4">
          <h2 className="text-ink-900 font-medium">แดชบอร์ด Workshop</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard label="ยอดขาย Workshop รวม" value={formatBaht(workshopSummary.totalWorkshopSales)} accent="text-gold-dark" />
            <StatCard label="ยอดขายดันเข้าร้านค้า (นับรายได้บริษัท)" value={formatBaht(workshopSummary.totalPushSales)} accent="text-sage" />
            <StatCard label="Workshop ที่เสร็จสิ้น" value={workshopSummary.completedCount} accent="text-ocean" />
          </div>
          <div>
            <p className="text-ink-500 text-xs uppercase tracking-wider mb-2">สถานะคำขอ</p>
            <div className="grid grid-cols-3 gap-4">
              <StatCard label="รออนุมัติ" value={workshopSummary.pendingApprovalCount} accent="text-gold-dark" />
              <StatCard label="รอเซลล์อัพเดตข้อมูล" value={workshopSummary.awaitingSalesCount} accent="text-ocean" />
              <StatCard label="ถูกปฏิเสธ" value={workshopSummary.rejectedCount} accent="text-rose" />
            </div>
          </div>
          {viewMode === 'workshop' && (
            <p className="text-ink-400 text-xs">
              ยอดขาย Workshop และยอดขายดันเข้าร้านค้าเป็นข้อมูลจากระบบ Workshop โดยตรง ไม่ปนกับยอดใช้จ่าย/รายได้ในโหมด "เฉพาะค่าใช้จ่าย"
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// เวอร์ชันสำหรับพิมพ์/PDF — ตัวหนังสือดำบนพื้นขาวล้วน
function DashboardPdfPreview({ stats, workshopSummary, categoryData, monthData }) {
  return (
    <div style={{ color: '#1d1d1f', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 }}>สรุปแดชบอร์ด</h1>
      <p style={{ fontSize: 10, color: '#a1a1a6', textAlign: 'center', marginBottom: 20 }}>พิมพ์เมื่อ {new Date().toLocaleDateString('th-TH')}</p>

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
            <div style={{ border: '1px solid #e8e8ed', borderRadius: 8, padding: 10 }}>
              <p style={{ fontSize: 9, color: '#6e6e73' }}>ยอดใช้จ่ายรวม</p>
              <p style={{ fontSize: 14, fontWeight: 'bold' }}>{formatBaht(stats.totalExpenses)}</p>
            </div>
            <div style={{ border: '1px solid #e8e8ed', borderRadius: 8, padding: 10 }}>
              <p style={{ fontSize: 9, color: '#6e6e73' }}>รายได้ (ยอดขายดันเข้าร้านค้า)</p>
              <p style={{ fontSize: 14, fontWeight: 'bold' }}>{formatBaht(stats.totalIncome)}</p>
            </div>
            <div style={{ border: '1px solid #e8e8ed', borderRadius: 8, padding: 10 }}>
              <p style={{ fontSize: 9, color: '#6e6e73' }}>จำนวนเอกสาร</p>
              <p style={{ fontSize: 14, fontWeight: 'bold' }}>{stats.docCount}</p>
            </div>
            <div style={{ border: '1px solid #e8e8ed', borderRadius: 8, padding: 10 }}>
              <p style={{ fontSize: 9, color: '#6e6e73' }}>หมวดหมู่สูงสุด</p>
              <p style={{ fontSize: 14, fontWeight: 'bold' }}>{stats.topCategory}</p>
            </div>
          </div>

          <p style={{ fontWeight: 'bold', marginBottom: 6 }}>สัดส่วนตามหมวดหมู่</p>
          <table style={{ width: '100%', fontSize: 10, marginBottom: 16, borderCollapse: 'collapse' }}>
            <tbody>
              {categoryData.map((c) => (
                <tr key={c.name} style={{ borderBottom: '1px solid #e8e8ed' }}>
                  <td style={{ padding: '3px 4px' }}>{c.name}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'right' }}>{formatBaht(c.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p style={{ fontWeight: 'bold', marginBottom: 6 }}>ยอดใช้จ่ายรายเดือน</p>
          <table style={{ width: '100%', fontSize: 10, marginBottom: 16, borderCollapse: 'collapse' }}>
            <tbody>
              {monthData.map((m) => (
                <tr key={m.month} style={{ borderBottom: '1px solid #e8e8ed' }}>
                  <td style={{ padding: '3px 4px' }}>{m.month}</td>
                  <td style={{ padding: '3px 4px', textAlign: 'right' }}>{formatBaht(m.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {workshopSummary && (
        <>
          <p style={{ fontWeight: 'bold', marginBottom: 6 }}>แดชบอร์ด Workshop</p>
          <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
            <tbody>
              <tr style={{ borderBottom: '1px solid #e8e8ed' }}><td style={{ padding: '3px 4px' }}>ยอดขาย Workshop รวม</td><td style={{ padding: '3px 4px', textAlign: 'right' }}>{formatBaht(workshopSummary.totalWorkshopSales)}</td></tr>
              <tr style={{ borderBottom: '1px solid #e8e8ed' }}><td style={{ padding: '3px 4px' }}>ยอดขายดันเข้าร้านค้า</td><td style={{ padding: '3px 4px', textAlign: 'right' }}>{formatBaht(workshopSummary.totalPushSales)}</td></tr>
              <tr style={{ borderBottom: '1px solid #e8e8ed' }}><td style={{ padding: '3px 4px' }}>Workshop ที่เสร็จสิ้น</td><td style={{ padding: '3px 4px', textAlign: 'right' }}>{workshopSummary.completedCount}</td></tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  )
}

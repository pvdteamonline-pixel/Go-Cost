import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts'
import { buildReportSummary, ratio } from '../lib/reportSummary'
import Icon from './Icon'

const COLORS = ['#147ba8', '#17364b', '#71abc2', '#438e87', '#9baec7', '#7095ad']
const money = value => value === null || value === undefined || !Number.isFinite(value) ? '—' : value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const percent = value => value === null ? '—' : `${value.toFixed(2)}%`
const compact = value => Math.abs(value) >= 1e6 ? `${(value / 1e6).toFixed(1)} ล้าน` : Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(0)} พัน` : value
const tooltipStyle = { borderRadius: 14, border: '1px solid #d5e5ed', boxShadow: '0 10px 30px #17364b15', fontSize: 12 }

function Stat({ label, value, sub, icon = 'chart', tone = '' }) {
  return <article className={`report-stat ${tone}`}><div className="stat-label"><span className="stat-icon"><Icon name={icon} size={18} /></span>{label}</div><p className="stat-value">{value}</p><p className="stat-sub">{sub}</p></article>
}

export default function ExecutiveReportDashboard({ pivot, accounts, budgets, budgetError, documents, month, year, onNavigate, canSetBudget }) {
  const summary = useMemo(() => buildReportSummary(pivot, accounts, budgets, month), [pivot, accounts, budgets, month])
  const { categoryRows, monthly, totalSpend, topCategory } = summary
  const documentCount = documents ? (month ? documents.months[Number(month) - 1] : documents.total) : null
  const verifiedDocumentCount = documentCount === 0 && pivot.allDetectedAccounts.length > 0 ? null : documentCount
  const distributionAvailable = totalSpend > 0 && categoryRows.every(row => row.actual >= 0)
  const period = month ? `${monthly[0]?.name} ${year}` : `ทั้งปี ${year}`
  const countStatus = key => categoryRows.filter(row => row.key === key).length
  return <div className="report-dashboard" aria-label="สรุปรายงานตามตัวกรอง">
    <section className="report-kpis" aria-label="ภาพรวมผลประกอบการ">
      <Stat label="รายได้สุทธิรวม" value={money(pivot.totalRevSum)} sub="หลังปรับคืนสินค้าและส่วนลด" icon="cash" />
      <Stat label="ต้นทุนสินค้า (COGS)" value={money(pivot.cogsTotal)} sub={`${percent(ratio(pivot.cogsTotal, pivot.totalRevSum))} ของรายได้สุทธิ`} icon="store" />
      <Stat label="กำไรขั้นต้น" value={money(pivot.grossProfitTotal)} sub={`${percent(ratio(pivot.grossProfitTotal, pivot.totalRevSum))} ของรายได้สุทธิ`} tone={pivot.grossProfitTotal < 0 ? 'negative' : 'positive'} />
      <Stat label="ค่าใช้จ่ายดำเนินงาน" value={money(pivot.grandTotalExpSum)} sub="ค่าใช้จ่ายส่วนที่ 3 • ไม่รวม COGS" icon="file" />
      <Stat label="กำไร (ขาดทุน) สุทธิ" value={money(pivot.netProfitTotal)} sub={`${percent(ratio(pivot.netProfitTotal, pivot.totalRevSum))} ของรายได้สุทธิ • ประมาณการ`} tone={pivot.netProfitTotal < 0 ? 'negative' : 'positive'} />
    </section>

    <section className="budget-layout" aria-label="ติดตามงบประมาณ">
      <div className="glass report-panel">
        <div className="panel-heading"><h2>งบประมาณเทียบยอดใช้จริง</h2><span>{period} • บาท</span></div>
        <p className="panel-description">ยอดใช้จริงตามตัวกรอง เทียบกับงบทั้งปี {year}</p>
        {categoryRows.some(row => row.actual !== 0 || row.budget > 0) ? <div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryRows.map((row, i) => ({ ...row, shortName: `หมวด ${i + 1}` }))} layout="vertical" margin={{ left: 0, right: 22, top: 14, bottom: 0 }}><CartesianGrid strokeDasharray="3 5" horizontal={false} stroke="#dce7ed" /><XAxis type="number" tickFormatter={compact} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="shortName" width={56} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip formatter={(value, name) => [money(Number(value)), name]} labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''} contentStyle={tooltipStyle} /><Legend wrapperStyle={{ fontSize: 12 }} /><Bar dataKey="budget" name="งบทั้งปี" fill="#bfd9e6" radius={[0, 5, 5, 0]} barSize={18} /><Bar dataKey="actual" name="ใช้จริง" fill="#147ba8" radius={[0, 5, 5, 0]} barSize={18} /></BarChart></ResponsiveContainer></div> : <div className="chart-empty">ไม่มีรายการในช่วงเวลาที่เลือก</div>}
      </div>
      <aside className="glass report-panel budget-alerts">
        <h2>สรุปการใช้งบประมาณ</h2>
        <div className="alert-summary normal"><span>อยู่ในงบ</span><strong>{countStatus('normal')} หมวด</strong></div>
        <div className="alert-summary warning"><span>ใกล้เต็มงบ ≥ 80%</span><strong>{countStatus('warning')} หมวด</strong></div>
        <div className="alert-summary over"><span>เกินงบ &gt; 100%</span><strong>{countStatus('over')} หมวด</strong></div>
        <p className="budget-note">{budgetError || `${countStatus('unset')} หมวดยังไม่ได้ตั้งงบ${month ? ' • ไม่มีการเฉลี่ยงบปีเป็นงบเดือน' : ''}`}</p>
        {canSetBudget && <button className="btn-ghost" onClick={() => onNavigate?.('budgets')}>จัดการงบประมาณ <Icon name="cash" size={16} /></button>}
      </aside>
    </section>

    <section className="glass report-panel" aria-label="งบประมาณตามหมวดหมู่">
      <div className="panel-heading"><h2>รายละเอียดงบประมาณตามหมวดหมู่</h2><span>อ้างอิงรายการในตารางรายงาน</span></div>
      <div className="report-table-scroll"><table className="budget-table"><thead><tr><th>หมวดหมู่</th><th>งบทั้งปี</th><th>ใช้จริง</th><th>คงเหลือจากงบปี</th><th>% ใช้ไป</th><th>สถานะ</th></tr></thead><tbody>{categoryRows.map((row, i) => <tr key={row.name}><td><span className="category-index">{i + 1}</span>{row.name}<small>{percent(row.share)} ของรายจ่ายรวม</small></td><td>{row.budget > 0 ? money(row.budget) : '—'}</td><td>{money(row.actual)}</td><td className={row.remaining < 0 ? 'text-rose' : ''}>{money(row.remaining)}</td><td>{percent(row.pct)}</td><td><span className={`budget-status ${row.key}`}>{row.label}</span></td></tr>)}</tbody><tfoot><tr><td>รวมยอดใช้จริง</td><td></td><td>{money(totalSpend)}</td><td colSpan={3}>ต้นทุนสินค้า + ค่าใช้จ่ายดำเนินงาน</td></tr></tfoot></table></div>
    </section>

    <section className="glass report-panel" aria-label="ภาพรวมค่าใช้จ่าย">
      <div className="panel-heading"><h2>ภาพรวมค่าใช้จ่าย</h2><span>{period}</span></div>
      <div className="expense-metrics">
        <Stat label="ยอดใช้จ่ายรวม" value={money(totalSpend)} sub="รวม COGS และค่าใช้จ่ายดำเนินงาน" icon="cash" />
        <Stat label="รายได้สุทธิ" value={money(pivot.totalRevSum)} sub="ฐานเดียวกับตารางรายงาน" icon="chart" />
        <Stat label="จำนวนไฟล์นำเข้าบัญชี" value={verifiedDocumentCount === null ? '—' : verifiedDocumentCount.toLocaleString('th-TH')} sub={verifiedDocumentCount === null ? 'ข้อมูลที่ได้รับยังระบุจำนวนไฟล์ช่วงนี้ไม่ได้' : 'นับไฟล์ที่มีรายการในช่วงที่เลือก'} icon="file" />
        <Stat label="เฉลี่ยต่อไฟล์นำเข้า" value={money(verifiedDocumentCount > 0 ? totalSpend / verifiedDocumentCount : null)} sub="ยอดใช้จ่ายรวม ÷ จำนวนไฟล์" icon="calendar" />
        <Stat label="หมวดหมู่ใช้จ่ายสูงสุด" value={topCategory} sub="เปรียบเทียบตามยอดใช้จริง" icon="store" tone="category-stat" />
      </div>
      <div className="expense-charts">
        <div><h3>สัดส่วนตามหมวดหมู่</h3>{distributionAvailable ? <div className="donut-layout"><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryRows.filter(row => row.actual > 0)} dataKey="actual" nameKey="name" innerRadius="60%" outerRadius="85%" paddingAngle={2}>{categoryRows.filter(row => row.actual > 0).map((row, i) => <Cell key={row.name} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={value => money(Number(value))} contentStyle={tooltipStyle} /></PieChart></ResponsiveContainer></div><ul className="chart-legend">{categoryRows.map((row, i) => <li key={row.name}><i style={{ background: COLORS[i % COLORS.length] }} /><span>{row.name}</span><strong>{percent(row.share)}</strong></li>)}</ul></div> : <div className="chart-empty">{totalSpend === 0 ? 'ไม่มีรายจ่ายในช่วงเวลาที่เลือก' : 'มีรายการปรับลดติดลบ กรุณาดูยอดและสัดส่วนในตาราง'}</div>}</div>
        <div><h3>ยอดใช้จ่ายรายเดือน</h3><p className="panel-description">รวมต้นทุนสินค้าและค่าใช้จ่ายดำเนินงาน • บาท</p><div className="report-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} margin={{ top: 12, right: 8, bottom: 0, left: 2 }}><CartesianGrid strokeDasharray="3 5" vertical={false} stroke="#dce7ed" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} /><YAxis tickFormatter={compact} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={66} /><Tooltip formatter={value => [money(Number(value)), 'ยอดใช้จ่าย']} contentStyle={tooltipStyle} /><Bar dataKey="amount" fill="#147ba8" radius={[5, 5, 0, 0]} maxBarSize={40} /></BarChart></ResponsiveContainer></div></div>
      </div>
    </section>
  </div>
}

import { useEffect, useState, useMemo, useCallback } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { baht, expenseSummary, groupExpenseDocuments, DOCUMENT_STATUS } from '../lib/expenseSummary'
import ThaiMonthSelect from '../components/ThaiMonthSelect'
import ExpenseInsight from '../components/ExpenseInsight'
import { hasPagePermission } from '../lib/permissions'
import DocumentNavigation from '../components/DocumentNavigation'
import DocumentGroupHeader from '../components/DocumentGroupHeader'
import ExpensePdfButton from '../components/ExpensePdfButton'
import { DocumentStatus } from '../components/ExpenseDocument'
import { expenseDocument, documentDate, documentMoney } from '../lib/expenseDocument'
import { groupDocuments } from '../lib/documentGroups'
import Icon from '../components/Icon'
import { THAI_MONTHS } from '../lib/constants'

function reportMonthLabel(value) {
  const [year, month] = String(value).split('-').map(Number)
  return year && month >= 1 && month <= 12 ? `${THAI_MONTHS[month - 1]} ${year + 543}` : 'ไม่ระบุเดือน'
}

export default function ExpenseReportsPage({onNavigate}) {
  const {currentUser}=useAuth()
  const [data,setData]=useState(null), [error,setError]=useState(''), [loading,setLoading]=useState(true)
  const load=useCallback(async()=>{
    setLoading(true);setError('')
    try {const {data:result,error:err}=await supabase.rpc('get_operational_report',{p_actor_id:currentUser.id});if(err)throw err;setData(result)}
    catch(e){setError(e.message);setData(null)}finally{setLoading(false)}
  },[currentUser.id])
  useEffect(()=>{load()},[load])
  return <ExpenseReportsView data={data} error={error} loading={loading} onRefresh={load} onNavigate={onNavigate} canCreate={hasPagePermission(currentUser,'expense-entry')}/>
}

export function ExpenseReportsView({data,error='',loading=false,onRefresh,onNavigate,canCreate=false}) {
  const [month,setMonth]=useState(''), [search,setSearch]=useState(''), [status,setStatus]=useState(''), [selected,setSelected]=useState(null)
  const [closedGroups,setClosedGroups]=useState({}), [pdfError,setPdfError]=useState('')
  const documents=useMemo(()=>{
    if(!data)return []
    const expense=groupExpenseDocuments(data.expenses??[],data.requests??[])
    const workshops=(data.workshops??[]).map(p=>({...p,docNo:p.id,type:'Workshop',storeName:p.store_name,eventDate:p.planned_date,
      income:p.sales_push_amount,storeSales:p.workshop_sales_amount,expense:null,net:null}))
    const archived=(data.archived??[]).map(d=>({...d.payload,
      ...(d.document_type==='PV'?expenseSummary(d.payload.items??[]):{income:d.payload.sales_push_amount,storeSales:d.payload.workshop_sales_amount}),
      docNo:d.doc_number,type:d.document_type,status:'deleted',storeName:d.store_name,eventDate:d.event_date}))
    return [...expense,...workshops,...archived]
  },[data])
  const filtered=documents.filter(d=>(!month||d.eventDate?.startsWith(month))&&(!search||`${d.docNo} ${d.storeName}`.toLowerCase().includes(search.toLowerCase())))
  const visible=filtered.filter(d=>!status||d.status===status)
  const totals=expenseSummary(visible.filter(d=>d.type==='PV'&&d.status!=='deleted').flatMap(d=>d.items))
  const pvCount=visible.filter(d=>d.type==='PV'&&d.status!=='deleted').length
  return <div className="document-workspace space-y-5">
    <div className="wh-heading"><h1>เอกสารและรายงาน</h1>{canCreate && <button className="btn-primary" onClick={() => onNavigate('expense-entry')}>+ สร้างเอกสาร</button>}</div>
    <DocumentNavigation active="expense-report" onNavigate={onNavigate} />
    {error && <p role="alert" className="expense-alert">โหลดรายงานไม่สำเร็จ: {error}</p>}
    {pdfError && <p role="alert" className="expense-alert">{pdfError}</p>}
    <div className="reports-filter">
      <input aria-label="ค้นหาเอกสาร" placeholder="ค้นหาเลขที่เอกสาร / ร้านค้า" className="glass-input" value={search} onChange={e => setSearch(e.target.value)} />
      <ThaiMonthSelect label="เดือนรายงานค่าใช้จ่าย" value={month} dates={documents.map(doc => doc.eventDate)} onChange={setMonth} />
      <select aria-label="สถานะเอกสารในรายงาน" className="glass-input" value={status} onChange={e => setStatus(e.target.value)}><option value="">ทุกสถานะ</option>{Object.entries(DOCUMENT_STATUS).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
      <button className="icon-button" aria-label="รีเฟรชรายงาน" disabled={loading} onClick={onRefresh}><Icon name="refresh" size={18} /></button>
      {(search || month || status) && <button className="btn-ghost" onClick={() => { setMonth('');setSearch('');setStatus('') }}>ล้างตัวกรอง</button>}
    </div>
    <section className="history-summary" aria-label="สรุปรายงานตามตัวกรอง">
      <div><Icon name="file" size={26}/><strong className="summary-count">{loading || error ? '—' : visible.length} เอกสาร</strong></div>
      <div><span>ค่าใช้จ่ายจาก PV</span><strong>{loading || error ? '—' : baht(totals.expense)}</strong></div>
      <div><span>รายได้บริษัทจาก PV</span><strong>{loading || error ? '—' : baht(totals.income)}</strong></div>
      <div><span>ส่วนต่างสุทธิจาก PV</span><strong className={totals.net > 0 ? 'expense-positive' : totals.net < 0 ? 'expense-negative' : ''}>{loading || error ? '—' : `${totals.net > 0 ? '+' : ''}${baht(totals.net)}`}</strong></div>
    </section>
    {!loading && data && <details className="document-section report-charts" open><summary>สรุปกราฟค่าใช้จ่าย · แยกตามประเภทและเดือน</summary><div className="document-section-content grid lg:grid-cols-2 gap-5">
        <section><h2 className="text-base font-medium">สัดส่วนค่าใช้จ่ายตามประเภท</h2>{totals.categories.length ? <><div style={{height:230}}><ResponsiveContainer><PieChart><Pie data={totals.categories} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={90}>{totals.categories.map((c,i) => <Cell key={c.name} fill={['#147ba8','#17364b','#79b6ce','#8faaa8','#aac8dc'][i%5]}/>)}</Pie><Tooltip formatter={value => baht(value)}/></PieChart></ResponsiveContainer></div>{totals.categories.map(c => <div key={c.name} className="flex justify-between text-sm py-1 gap-2"><span>{c.name}</span><span>{baht(c.amount)} · {c.percent?.toFixed(1)}%</span></div>)}</> : <p className="document-empty">ไม่มีค่าใช้จ่ายตามตัวกรอง</p>}</section>
        <section><h2 className="text-base font-medium">ยอดใช้จ่ายรายเดือน</h2><div style={{height:300}}><ResponsiveContainer><BarChart data={totals.months}><XAxis dataKey="month" tickFormatter={reportMonthLabel}/><YAxis width={75}/><Tooltip labelFormatter={reportMonthLabel} formatter={value => baht(value)}/><Bar dataKey="amount" name="ค่าใช้จ่าย" fill="#147ba8" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section>
      </div></details>}
    <section className="grouped-table-panel reports-document-list" aria-label="รายการเอกสารในรายงาน" aria-busy={loading}>
      {loading ? <p role="status" className="document-empty">กำลังโหลดข้อมูล…</p> : !!visible.length && <div className="grouped-table-scroll"><table className="grouped-table">
        <thead><tr><th>เลขที่เอกสาร / ร้านค้า</th><th>วันที่</th><th>สถานะ</th><th className="number">ค่าใช้จ่าย</th><th className="number">รายได้บริษัท</th><th><span className="expense-sr-only">การดำเนินการ</span></th></tr></thead>
        {groupDocuments(visible).map(group => <tbody key={group.key}>
          <DocumentGroupHeader label={group.label} count={group.documents.length} colSpan={6} open={!closedGroups[group.key]} onToggle={() => setClosedGroups(previous => ({ ...previous, [group.key]: !previous[group.key] }))}/>
          {!closedGroups[group.key] && group.documents.map(raw => {
            const doc = expenseDocument(raw)
            return <tr className="document-data-row" key={`${doc.type}-${doc.docNo}`}>
              <td><button className="row-title" onClick={() => setSelected(doc)}>{doc.docNo}</button><small>{doc.storeName || '—'}</small></td>
              <td className="whitespace-nowrap">{documentDate(doc.eventDate)}</td><td><DocumentStatus doc={doc}/></td>
              <td className="number">{documentMoney(doc.expense)}</td><td className="number">{documentMoney(doc.income)}</td>
              <td><div className="grouped-row-actions"><button aria-label={`Insight ${doc.docNo}`} onClick={() => setSelected(doc)}><Icon name="eye" size={16}/>Insight</button>{doc.type !== 'Workshop' && <ExpensePdfButton doc={doc} compact onError={setPdfError}/>}</div></td>
            </tr>
          })}
        </tbody>)}
      </table></div>}
      {!loading && !visible.length && <p className="document-empty">{error ? 'ไม่สามารถโหลดรายงานได้ กรุณารีเฟรชอีกครั้ง' : 'ไม่พบเอกสารตามตัวกรอง'}</p>}
      {!loading && !!visible.length && <p className="grouped-table-footer">{visible.length} เอกสารตามตัวกรอง · หน่วย: บาท</p>}
    </section>
    {!loading && data && <>
      <p className="report-context">ยอดสรุปคำนวณจากเอกสาร PV {pvCount} ใบตามตัวกรอง · ไม่รวมเอกสารที่ลบแล้ว · ยอดจากคำขอ Workshop แสดงแยกเพื่อป้องกันการนับซ้ำ</p>
      {totals.returns > 0 && <p className="report-context">รายได้ตามเอกสารรวม “ยอดของคืน” {baht(totals.returns)} บาท ตามประเภทและเครื่องหมายที่บันทึกไว้</p>}
    </>}
    {selected && <ExpenseInsight doc={selected} onClose={() => setSelected(null)}/>}
  </div>
}

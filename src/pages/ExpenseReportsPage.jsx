import { useEffect, useState, useMemo, useCallback } from 'react'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { baht, expenseSummary, groupExpenseDocuments, DOCUMENT_STATUS } from '../lib/expenseSummary'
import DocumentCalendar from '../components/DocumentCalendar'
import ExpenseInsight from '../components/ExpenseInsight'
import { hasPagePermission } from '../lib/permissions'

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
  return <div className="max-w-7xl mx-auto space-y-5">
    <div className="flex justify-between flex-wrap gap-3"><div><h1 className="text-3xl font-medium">รายงานค่าใช้จ่าย</h1><p className="text-sm text-ink-500 mt-1">ติดตามเอกสาร ค่าใช้จ่าย และแผน Workshop</p></div><div className="flex gap-2"><button className="btn-ghost" disabled={loading} onClick={onRefresh}>รีเฟรช</button>{canCreate&&<button className="btn-primary" onClick={()=>onNavigate('expense-entry')}>+ สร้างเอกสาร</button>}</div></div>
    {error&&<p role="alert" className="glass p-4 text-rose">โหลดรายงานไม่สำเร็จ: {error}</p>}
    {loading?<p>กำลังโหลดข้อมูล…</p>:data&&<>
      <DocumentCalendar documents={documents} onSelect={setSelected}/>
      <section className="glass p-5 space-y-4"><h2 className="text-lg font-medium">สถานะเอกสารทั้งหมด · {documents.length} ใบ</h2>
        <div className="flex flex-wrap gap-3"><input aria-label="ค้นหาเอกสาร" placeholder="เลขเอกสาร / ร้านค้า" className="glass-input" value={search} onChange={e=>setSearch(e.target.value)}/><input aria-label="เดือนรายงานค่าใช้จ่าย" type="month" className="glass-input" value={month} onChange={e=>setMonth(e.target.value)}/><button className="btn-ghost" onClick={()=>{setMonth('');setSearch('');setStatus('')}}>ล้างตัวกรอง</button></div>
        <div className="status-cards"><button aria-pressed={!status} className="glass p-3 text-left" onClick={()=>setStatus('')}><strong>{filtered.length}</strong><span>ทั้งหมดตามตัวกรอง</span></button>{Object.entries(DOCUMENT_STATUS).map(([key,label])=><button key={key} aria-pressed={status===key} className="glass p-3 text-left" onClick={()=>setStatus(status===key?'':key)}><strong>{filtered.filter(d=>d.status===key).length}</strong><span>{label}</span></button>)}</div>
      </section>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[['ค่าใช้จ่ายรวม',baht(totals.expense)],['รายได้ตามเอกสาร',baht(totals.income)],['เอกสารค่าใช้จ่าย',`${pvCount} ใบ`],['เฉลี่ยต่อเอกสาร',pvCount?baht(totals.expense/pvCount):'—'],['ส่วนต่างสุทธิ',baht(totals.net)]].map(([label,value])=><div className="glass p-4" key={label}><p className="text-xs text-ink-500">{label}</p><strong className="text-xl text-ocean">{value}</strong></div>)}</div>
      <p className="text-xs text-ink-500">ยอดสรุปมาจากเอกสาร PV ตามตัวกรอง · รายการลบแล้วไม่รวมยอด · ยอด Workshop แสดงใน Insight แยกจาก PV เพื่อป้องกันนับซ้ำ</p>
      {totals.returns>0&&<p className="text-xs text-ink-500">รายได้ตามเอกสารรวม “ยอดของคืน” {baht(totals.returns)} บาท ตามประเภทและเครื่องหมายที่บันทึกไว้ในต้นทาง</p>}
      <div className="grid lg:grid-cols-2 gap-4"><section className="glass p-5"><h2>สัดส่วนค่าใช้จ่ายตามประเภท</h2>{totals.categories.length?<><div style={{height:230}}><ResponsiveContainer><PieChart><Pie data={totals.categories} dataKey="amount" nameKey="name" innerRadius={60} outerRadius={90}>{totals.categories.map((c,i)=><Cell key={c.name} fill={['#147ba8','#17364b','#79b6ce','#8faaa8','#aac8dc'][i%5]}/>)}</Pie><Tooltip formatter={value=>baht(value)}/></PieChart></ResponsiveContainer></div>{totals.categories.map(c=><div key={c.name} className="flex justify-between text-sm py-1 gap-2"><span>{c.name}</span><span>{baht(c.amount)} · {c.percent?.toFixed(1)}%</span></div>)}</>:<p className="py-12 text-center text-ink-500">ไม่มีค่าใช้จ่ายตามตัวกรอง</p>}</section>
      <section className="glass p-5"><h2>ยอดใช้จ่ายรายเดือน</h2><div style={{height:300}}><ResponsiveContainer><BarChart data={totals.months}><XAxis dataKey="month"/><YAxis width={75}/><Tooltip formatter={value=>baht(value)}/><Bar dataKey="amount" name="ค่าใช้จ่าย" fill="#147ba8" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></section></div>
      <section className="glass p-5 overflow-x-auto"><h2 className="mb-3">รายการเอกสาร · {visible.length} ใบ</h2><table className="w-full text-sm"><thead><tr>{['เอกสาร','ร้านค้า / งาน','วันที่','สถานะ','ค่าใช้จ่าย','รายได้บริษัท',''].map((h,i)=><th className="text-left p-2" key={i}>{h}</th>)}</tr></thead><tbody>{visible.map(d=><tr className="border-t border-black/10" key={`${d.type}-${d.docNo}`}><td className="p-2">{d.docNo}</td><td className="p-2">{d.storeName}</td><td className="p-2 whitespace-nowrap">{d.eventDate}</td><td className="p-2">{DOCUMENT_STATUS[d.status]??d.status}</td><td className="p-2">{d.expense==null?'—':baht(d.expense)}</td><td className="p-2">{d.income==null?'—':baht(d.income)}</td><td className="p-2"><button className="btn-ghost" onClick={()=>setSelected(d)}>Insight</button></td></tr>)}</tbody></table>{!visible.length&&<p className="py-6 text-center text-ink-500">ไม่พบเอกสารตามตัวกรอง</p>}</section>
    </>}
    {selected&&<ExpenseInsight doc={selected} onClose={()=>setSelected(null)}/>}
  </div>
}

import { useState } from 'react'
import { DOCUMENT_STATUS } from '../lib/expenseSummary'

export default function DocumentCalendar({ documents, onSelect }) {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0,7))
  const [year, number] = month.split('-').map(Number)
  const first = new Date(year, number-1, 1).getDay()
  const days = new Date(year, number, 0).getDate()
  const [selected, setSelected] = useState('')
  const visible = documents.filter(d => d.eventDate?.startsWith(month) && d.status !== 'deleted')
  return <section className="glass p-5 space-y-4">
    <div className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="text-lg font-medium">ปฏิทินเอกสารและ Workshop</h2><p className="text-xs text-ink-500">{visible.length} เอกสารในเดือนนี้ · กดวันที่เพื่อดูรายการ</p></div><input aria-label="เดือนปฏิทิน" type="month" className="glass-input" value={month} onChange={e => {if(e.target.value) {setMonth(e.target.value);setSelected('')}}}/></div>
    <div className="document-calendar">{['อา.','จ.','อ.','พ.','พฤ.','ศ.','ส.'].map(day => <div key={day} className="calendar-weekday">{day}</div>)}
      {Array.from({length:first},(_,i)=><div key={`blank-${i}`} />)}
      {Array.from({length:days},(_,i)=>{
        const date = `${month}-${String(i+1).padStart(2,'0')}`, docs = visible.filter(d=>d.eventDate===date)
        return <button key={date} className={`calendar-day ${selected===date?'selected':''}`} onClick={()=>setSelected(date)} aria-label={`${date} ${docs.length} เอกสาร`}><span>{i+1}</span>{docs.length>0&&<><strong>{docs.length} ใบ</strong><span className="calendar-dots">{[...new Set(docs.map(d=>d.status))].map(status=><i key={status} title={DOCUMENT_STATUS[status]??status} className={`status-dot status-${status}`}/>)}</span></>}</button>
      })}
    </div>
    {selected&&<div className="space-y-2"><p className="text-sm text-ink-500">รายการวันที่ {selected}</p>{visible.filter(d=>d.eventDate===selected).length===0?<p className="text-sm">ไม่มีเอกสารในวันนี้</p>:visible.filter(d=>d.eventDate===selected).map(d=><button key={`${d.type}-${d.docNo}`} className="calendar-document" onClick={()=>onSelect(d)}><span>{d.docNo} · {d.storeName}</span><span className="doc-badge">{DOCUMENT_STATUS[d.status]??d.status}</span></button>)}</div>}
  </section>
}

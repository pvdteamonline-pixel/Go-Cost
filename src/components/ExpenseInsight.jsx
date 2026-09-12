import { baht, DOCUMENT_STATUS } from '../lib/expenseSummary'
import { openAttachment } from '../lib/expenseAttachments'
import { useState, useEffect, useRef } from 'react'
export default function ExpenseInsight({doc,onClose}) {
  const [error,setError]=useState('')
  const dialog=useRef(null)
  useEffect(()=>{
    const previous=document.activeElement
    const element=dialog.current
    element?.querySelector('button')?.focus()
    const handle=event=>{
      if(event.key==='Escape'){event.stopPropagation();onClose()}
      if(event.key==='Tab'){
        const focusable=element?.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')
        if(!focusable?.length)return
        const first=focusable[0],last=focusable[focusable.length-1]
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
      }
    }
    document.addEventListener('keydown',handle,true)
    return ()=>{document.removeEventListener('keydown',handle,true);previous?.focus()}
  },[onClose])
  const files=[...new Set((doc.items??[]).map(it=>it.attachment_url??it.attachmentUrl).filter(Boolean).concat(doc.attachment_path?[doc.attachment_path]:[]))]
  return <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}><section ref={dialog} role="dialog" aria-modal="true" aria-label={`Insight ${doc.docNo}`} className="glass-solid p-6 w-full max-w-4xl max-h-[90vh] overflow-auto space-y-4" onClick={e=>e.stopPropagation()}>
    <div className="flex justify-between gap-3"><div><span className="doc-badge">{doc.docNo}</span><h2 className="text-xl mt-2">{doc.storeName}</h2><p className="text-sm text-ink-500">{doc.eventDate} · {DOCUMENT_STATUS[doc.status]??doc.status}</p></div><button className="btn-ghost" onClick={onClose} aria-label="ปิด Insight">ปิด</button></div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">{[['ค่าใช้จ่าย',doc.expense],['รายได้บริษัท',doc.income],['ส่วนต่างสุทธิ',doc.net],['ยอดขาย Workshop ของร้าน',doc.storeSales]].map(([title,n])=><div key={title} className="glass p-3"><p className="text-xs text-ink-500">{title}</p><strong>{n==null?'—':baht(n)}</strong></div>)}</div>
    <p className="text-sm">ผู้เข้างาน {doc.attendees??'—'} คน · วันทำงาน {doc.workDays??'—'} · {doc.internalNote||'ไม่มีหมายเหตุ'}</p>
    {doc.type==='Workshop'&&<p className="text-sm">ยอดขาย Workshop เป็นยอดของร้าน แสดงแยกจากรายได้บริษัท และไม่บวกรวมซ้ำกับเอกสาร PV</p>}
    {!!doc.items?.length&&<div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{['ลำดับ','ประเภท / รายละเอียด','จำนวน','หน่วย','ราคา/หน่วย','รวม','หมายเหตุ'].map(h=><th className="p-2 text-left" key={h}>{h}</th>)}</tr></thead><tbody>{doc.items.map((it,i)=><tr key={i} className="border-t border-black/10"><td className="p-2">{it.seq??i+1}</td><td className="p-2">{it.mainCategory??it.main_category}<br/>{it.detail}</td><td className="p-2">{it.qty}</td><td className="p-2">{it.unit}</td><td className="p-2">{baht(it.unitPrice??it.unit_price)}</td><td className="p-2">{baht(it.total)}</td><td className="p-2">{it.remark}</td></tr>)}</tbody></table></div>}
    {files.map((file,i)=><button key={file} className="btn-ghost mr-2" onClick={()=>openAttachment(file).catch(e=>setError(e.message))}>เปิดไฟล์แนบ {i+1}</button>)}{error&&<p role="alert" className="text-rose">{error}</p>}
  </section></div>
}

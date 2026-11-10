import { useRef, useState } from 'react'
import Icon from './Icon'

export default function ExpensePdfButton({ doc, compact = false, onError }) {
  const [busy, setBusy] = useState(false)
  const locked = useRef(false)
  async function download() {
    if (locked.current) return
    locked.current = true
    setBusy(true)
    onError?.('')
    try {
      const { downloadExpensePdf } = await import('../lib/expensePdf')
      await downloadExpensePdf(doc)
    } catch (error) {
      onError?.(`สร้าง PDF ไม่สำเร็จ: ${error.message}`)
    } finally {
      locked.current = false
      setBusy(false)
    }
  }
  return <button type="button" className={compact ? 'expense-text-button' : 'expense-button expense-button-primary'} disabled={busy} aria-busy={busy} aria-label={`ดาวน์โหลด PDF ${doc.docNo}`} onClick={download}>
    <Icon name="download" size={17} /><span>{busy ? 'กำลังสร้าง…' : compact ? 'PDF' : 'ดาวน์โหลด PDF'}</span>
  </button>
}

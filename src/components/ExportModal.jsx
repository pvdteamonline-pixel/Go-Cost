import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// ตัวเลือก export ใช้ร่วมกันได้ทุกหน้า (แดชบอร์ด/รายงานผู้บริหาร/รายงานสรรพากร)
// PDF ใช้วิธี "ถ่ายภาพหน้าจอ" ของ preview ที่ render ด้วย browser จริง (html2canvas)
// แล้วแปะเป็นรูปลง PDF แทนการให้ไลบรารี PDF วาดตัวอักษรเอง — กันปัญหาภาษาไทยเพี้ยน/
// เป็นกล่องสี่เหลี่ยม ซึ่งเป็นปัญหาที่พบบ่อยมากเวลา embed ฟอนต์ไทยลง PDF โดยตรง
export default function ExportModal({ fileNameBase, pdfPreview, excelSheets }) {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState('pdf') // 'pdf' | 'excel'
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const pdfRef = useRef(null)

  async function handleDownloadPdf() {
    if (!pdfRef.current) return
    setBusy(true)
    setError('')
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, backgroundColor: '#ffffff', useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: canvas.width > canvas.height ? 'landscape' : 'portrait', unit: 'px', format: [canvas.width, canvas.height] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${fileNameBase}.pdf`)
    } catch (e) {
      setError('สร้าง PDF ไม่สำเร็จ: ' + e.message)
    }
    setBusy(false)
  }

  function handleDownloadExcel() {
    setBusy(true)
    setError('')
    try {
      const wb = XLSX.utils.book_new()
      for (const sheet of excelSheets) {
        const ws = XLSX.utils.aoa_to_sheet(sheet.rows)
        XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31))
      }
      XLSX.writeFile(wb, `${fileNameBase}.xlsx`)
    } catch (e) {
      setError('สร้าง Excel ไม่สำเร็จ: ' + e.message)
    }
    setBusy(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-ghost text-sm">📤 ส่งออกรายงาน</button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setOpen(false)}>
          <div className="glass-solid max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button onClick={() => setFormat('pdf')} className={`px-4 py-1.5 rounded-xl text-sm ${format === 'pdf' ? 'bg-gold-pale text-gold-dark border border-gold/30 font-medium' : 'text-ink-600 hover:bg-black/5'}`}>
                  📄 PDF
                </button>
                <button onClick={() => setFormat('excel')} className={`px-4 py-1.5 rounded-xl text-sm ${format === 'excel' ? 'bg-sage-pale text-sage border border-sage/30 font-medium' : 'text-ink-600 hover:bg-black/5'}`}>
                  📊 Excel
                </button>
              </div>
              <div className="flex items-center gap-2">
                {format === 'pdf' ? (
                  <button onClick={handleDownloadPdf} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
                    {busy ? 'กำลังสร้าง...' : '⬇ ดาวน์โหลด PDF'}
                  </button>
                ) : (
                  <button onClick={handleDownloadExcel} disabled={busy} className="btn-primary text-sm disabled:opacity-60">
                    {busy ? 'กำลังสร้าง...' : '⬇ ดาวน์โหลด Excel'}
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-900 text-xl leading-none">✕</button>
              </div>
            </div>

            {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2 mb-3">{error}</p>}

            <p className="text-ink-400 text-xs mb-3">
              {format === 'pdf' ? 'ตัวอย่างไฟล์ PDF ที่จะได้ (หน้าตาตรงกับที่เห็นนี้เป๊ะ)' : 'ตัวอย่างข้อมูลในไฟล์ Excel ที่จะได้'}
            </p>

            {/* PDF preview — ต้องอยู่ใน DOM เสมอ (ไม่ใช้ display:none) ไม่งั้น html2canvas จับภาพไม่ได้ */}
            <div className={format === 'pdf' ? 'block' : 'hidden'}>
              <div ref={pdfRef} className="bg-white p-8 font-sans" style={{ fontFamily: "'Sarabun', sans-serif" }}>
                {pdfPreview}
              </div>
            </div>

            {format === 'excel' && (
              <div className="space-y-6">
                {excelSheets.map((sheet) => (
                  <div key={sheet.name}>
                    <p className="text-ink-500 text-xs uppercase tracking-wider mb-2">ชีต: {sheet.name}</p>
                    <div className="overflow-x-auto border border-black/10 rounded-lg">
                      <table className="text-xs w-full">
                        <tbody>
                          {sheet.rows.slice(0, 30).map((row, i) => (
                            <tr key={i} className={i === 0 ? 'bg-ink-100 font-medium' : 'border-t border-black/5'}>
                              {row.map((cell, j) => <td key={j} className="px-3 py-1.5 whitespace-nowrap text-ink-800">{cell ?? ''}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {sheet.rows.length > 30 && (
                        <p className="text-ink-400 text-xs px-3 py-2">... อีก {sheet.rows.length - 30} แถว (แสดงตัวอย่างแค่ 30 แถวแรก ไฟล์จริงมีครบ)</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

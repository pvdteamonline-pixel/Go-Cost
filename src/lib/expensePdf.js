import { expenseDocument, documentFilename, documentMoney, documentText, attachmentName } from './expenseDocument'

// Render in an isolated document: no Tailwind/OKLCH styles, viewport clipping or
// modal scroll position can leak into the report. Browser text shaping preserves
// Thai vowels/marks. Pages are laid out before rasterizing, never sliced mid-row.
const PAGE_WIDTH = 1122
const PAGE_HEIGHT = 793
const css = `
*{box-sizing:border-box}body{margin:0;background:#fff;color:#233b4e;font:14px/1.55 ReportThai,sans-serif}
.page{position:relative;width:1122px;height:793px;padding:32px 36px;background:#fff;overflow:hidden}
.header{display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #147ba8;padding-bottom:12px;margin-bottom:16px;gap:24px}
.header strong{font-size:21px;color:#147ba8}.header span{font-size:17px;font-weight:600;overflow-wrap:anywhere}
.meta{margin:0 0 7px;white-space:pre-wrap;overflow-wrap:anywhere}
.summary{display:flex;gap:24px;padding:15px 0;margin:8px 0;border-top:1px solid #dce5eb;border-bottom:1px solid #dce5eb}
.summary>div{width:33.333%}.summary strong{display:block;font-size:24px;color:#147ba8}.summary div:last-child strong{color:#2d7a46}
.shop{padding:9px 12px;background:#f0f5f9;border-radius:5px;margin:8px 0 14px;white-space:pre-wrap}
table{width:100%;table-layout:fixed;border-collapse:collapse;margin:12px 0}
th{background:#edf2f6;font-weight:600;text-align:left;font-size:13px;padding:8px}
td{padding:9px 8px;vertical-align:top;border-bottom:1px solid #dce5eb;white-space:pre-wrap;overflow-wrap:anywhere}
tbody tr:nth-child(even){background:#f7f9fb}th:nth-child(3),th:nth-child(5),th:nth-child(6),td:nth-child(3),td:nth-child(5),td:nth-child(6){text-align:right}
.footer{position:absolute;bottom:20px;left:36px;right:36px;border-top:1px solid #dce5eb;padding-top:9px;display:flex;justify-content:space-between;font-size:11px;color:#72808d}
`

function makeElement(root, tag, text, className) {
  const node = root.createElement(tag)
  if (text != null) node.textContent = text
  if (className) node.className = className
  return node
}

export async function downloadExpensePdf(source) {
  const doc = expenseDocument(source)
  if (doc.type === 'Workshop') throw new Error('PDF นี้รองรับเอกสารค่าใช้จ่าย PV')
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')])
  const frame = document.createElement('iframe')
  frame.title = 'กำลังสร้างรายงาน PDF'
  frame.setAttribute('aria-hidden', 'true')
  frame.tabIndex = -1
  frame.style.cssText = `position:fixed;left:-20000px;top:0;width:${PAGE_WIDTH}px;height:${PAGE_HEIGHT}px;border:0;pointer-events:none;`
  document.body.appendChild(frame)
  try {
    const root = frame.contentDocument
    root.open()
    root.write('<!doctype html><html lang="th"><head><meta charset="utf-8"></head><body></body></html>')
    root.close()
    root.head.appendChild(makeElement(root, 'style', css))
    const fontBase = new URL(`${import.meta.env.BASE_URL}fonts/`, window.location.origin)
    await Promise.all([['Regular', '400'], ['SemiBold', '600']].map(async ([file, weight]) => {
      const font = new FontFace('ReportThai', `url("${new URL(`Sarabun-${file}.ttf`, fontBase).href}")`, { weight })
      await font.load()
      root.fonts.add(font)
    }))
    await root.fonts.ready
    const pages = []
    let page, content, tbody
    const addPage = () => {
      page = makeElement(root, 'section', null, 'page')
      const header = makeElement(root, 'header', null, 'header')
      header.append(makeElement(root, 'strong', 'GoCost'), makeElement(root, 'span', `รายงานเอกสาร ${documentText(doc.docNo)}`))
      content = makeElement(root, 'div')
      page.append(header, content, makeElement(root, 'footer', null, 'footer'))
      root.body.append(page)
      pages.push(page)
      tbody = null
    }
    const fits = () => content.getBoundingClientRect().bottom - page.getBoundingClientRect().top <= PAGE_HEIGHT - 70
    const segments = text => Array.from(new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(text), part => part.segment)
    // Fit the largest grapheme-safe prefix, including unusually long notes or
    // a single line item taller than a page. No characters are discarded.
    const fitPrefix = (parts, create) => {
      let low = 1, high = Math.max(...parts.map(part => part.length)), best = 0
      while (low <= high) {
        const middle = Math.floor((low + high) / 2)
        const node = create(parts.map(part => part.slice(0, middle).join('')))
        if (fits()) { best = middle; low = middle + 1 } else high = middle - 1
        node.remove()
      }
      if (!best) throw new Error('ข้อมูลไม่สามารถจัดลงหน้ากระดาษได้')
      create(parts.map(part => part.slice(0, best).join('')))
      return parts.map(part => part.slice(best))
    }
    const appendText = text => {
      tbody = null
      const create = ([value]) => { const node = makeElement(root, 'p', value, 'meta'); content.append(node); return node }
      let parts = [segments(text)]
      let node = create([text])
      if (fits()) return
      node.remove()
      addPage()
      while (parts.some(part => part.length)) {
        parts = fitPrefix(parts, create)
        if (parts.some(part => part.length)) addPage()
      }
    }
    const ensureTable = () => {
      if (tbody) return
      const table = makeElement(root, 'table')
      const cols = makeElement(root, 'colgroup')
      for (const width of [5, 31, 7, 8, 14, 14, 21]) {
        const col = makeElement(root, 'col'); col.style.width = `${width}%`; cols.append(col)
      }
      const head = makeElement(root, 'thead'), row = makeElement(root, 'tr')
      for (const label of ['ลำดับ', 'ประเภท / รายละเอียด', 'จำนวน', 'หน่วย', 'ราคา/หน่วย', 'รวม', 'หมายเหตุ']) row.append(makeElement(root, 'th', label))
      head.append(row)
      tbody = makeElement(root, 'tbody')
      table.append(cols, head, tbody)
      content.append(table)
    }
    const appendRow = cells => {
      ensureTable()
      const create = values => {
        const row = makeElement(root, 'tr')
        values.forEach(value => row.append(makeElement(root, 'td', value)))
        if (!values[0]) row.firstElementChild.textContent = `${cells[0]} (ต่อ)`
        tbody.append(row)
        return row
      }
      let row = create(cells)
      if (fits()) return
      row.remove()
      // Remove an orphan table header before moving the row to a fresh page.
      if (!tbody.children.length) tbody.closest('table').remove()
      addPage(); ensureTable()
      row = create(cells)
      if (fits()) return
      row.remove()
      let parts = cells.map(segments)
      while (parts.some(part => part.length)) {
        parts = fitPrefix(parts, create)
        if (parts.some(part => part.length)) { addPage(); ensureTable() }
      }
    }
    addPage()
    appendText(`ร้านค้า / งาน: ${documentText(doc.storeName)}`)
    appendText(`วันที่: ${doc.dateLabel}    สถานะ: ${doc.statusLabel}    ผู้เข้างาน: ${documentText(doc.attendees)} คน    วันทำงาน: ${documentText(doc.workDays)} วัน`)
    const summary = makeElement(root, 'div', null, 'summary')
    for (const [label, amount] of [['ค่าใช้จ่าย', doc.expense], ['รายได้บริษัท', doc.income], ['ส่วนต่างสุทธิ', doc.net]]) {
      const block = makeElement(root, 'div', label)
      const value = makeElement(root, 'strong', `${label === 'ส่วนต่างสุทธิ' && amount > 0 ? '+' : ''}${documentMoney(amount)} บาท`)
      if (label === 'ส่วนต่างสุทธิ' && amount < 0) value.style.color = '#b23d3d'
      block.append(value); summary.append(block)
    }
    content.append(summary)
    if (!fits()) { summary.remove(); addPage(); content.append(summary) }
    appendText(`ยอดขาย Workshop ของร้าน: ${documentMoney(doc.storeSales)} บาท — ไม่รวมในรายได้บริษัท`)
    if (doc.returns) appendText(`รายได้บริษัทรวมยอดของคืน ${documentMoney(doc.returns)} บาท ตามเครื่องหมายที่บันทึกในระบบ`)
    appendText(`หมายเหตุเอกสาร: ${documentText(doc.internalNote)}`)
    for (const item of doc.items) appendRow([
      String(item.seq), `${documentText(item.detail)}\n${documentText(item.mainCategory)}${item.mainCategory === 'รายได้' && item.detail === 'รายได้จาก Workshop' ? ' · ยอดขายของร้าน' : ''}`,
      documentText(item.qty), documentText(item.unit), documentMoney(item.unitPrice), documentMoney(item.total), documentText(item.remark),
    ])
    if (!doc.items.length) appendText('ไม่มีรายการย่อยในเอกสารนี้')
    if (doc.files.length) {
      appendText(`ไฟล์แนบ ${doc.files.length} ไฟล์ (เปิดไฟล์ต้นฉบับได้จาก Insight)`)
      doc.files.forEach((file, index) => appendText(`${index + 1}. ${attachmentName(file, index)}`))
    }
    pages.forEach((element, index) => element.querySelector('.footer').append(
      makeElement(root, 'span', `GoCost · ${doc.docNo} · ${doc.items.length} รายการ`),
      makeElement(root, 'span', `หน้า ${index + 1} / ${pages.length}`),
    ))
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true })
    pdf.setProperties({ title: `GoCost ${doc.docNo}`, subject: 'รายงานเอกสารค่าใช้จ่าย', creator: 'GoCost' })
    for (let index = 0; index < pages.length; index++) {
      const canvas = await html2canvas(pages[index], { scale: 2, backgroundColor: '#ffffff', logging: false, windowWidth: PAGE_WIDTH, windowHeight: PAGE_HEIGHT })
      if (index) pdf.addPage('a4', 'landscape')
      pdf.addImage(canvas, 'PNG', 0, 0, 297, 210, undefined, 'FAST')
      canvas.width = 0; canvas.height = 0
    }
    await pdf.save(documentFilename(doc.docNo), { returnPromise: true })
  } finally { frame.remove() }
}

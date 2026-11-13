import { expenseDocument, documentFilename, documentMoney, documentText, attachmentName } from './expenseDocument'

// Isolated print layout keeps Thai shaping and page breaks independent of the
// screen's styles, scroll position and viewport. A4 landscape, rendered at 2x.
const PAGE_WIDTH = 1122
const PAGE_HEIGHT = 793
const css = `
*{box-sizing:border-box}body{margin:0;background:#fff;color:#233b4e;font:14px/1.55 ReportThai,sans-serif;font-variant-numeric:tabular-nums}
.page{position:relative;width:1122px;height:793px;padding:30px 36px;background:#fff;overflow:hidden}
.header{border-bottom:1px solid #cedbe5;padding-bottom:14px;margin-bottom:0}
.heading{display:flex;align-items:center;justify-content:space-between;gap:20px}.heading h1{font-size:24px;line-height:1.35;font-weight:600;margin:0;border-left:5px solid #147ba8;padding-left:14px;overflow-wrap:anywhere}.brand{font-size:17px;font-weight:600;color:#147ba8;white-space:nowrap}
.document-meta{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 16px;margin:9px 0 0 19px;font-size:13px;overflow-wrap:anywhere}.document-meta>span+span{padding-left:16px;border-left:1px solid #cedbe5}.status i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#718695;margin-right:6px}.status.saved i{background:#4eaa64}.status.pending_edit i{background:#dba537}.status.pending_delete i{background:#db7272}
.report-grid{display:grid;grid-template-columns:minmax(0,2.12fr) minmax(0,1fr)}.report-details{min-width:0;padding:0 18px 0 0}.report-continuation{padding-top:16px}
.metadata{display:flex;gap:18px;flex-wrap:wrap;border-bottom:1px solid #dce5eb;padding:12px 0;font-size:13px}.metadata>span+span{border-left:1px solid #cedbe5;padding-left:18px}
.summary{align-self:start;background:#f3f6f9;border-left:1px solid #dce5eb;padding:18px 20px 22px;min-width:0}.summary h2{font-size:18px;font-weight:600;margin:0 0 20px}.summary-row{display:flex;align-items:baseline;justify-content:space-between;gap:6px 12px;flex-wrap:wrap;margin:14px 0}.summary-row p{margin:0 0 0 auto;text-align:right}.summary-row strong{font-size:21px;font-weight:600}.summary-row small{font-size:11px}.summary .net{border-top:1px solid #cedbe5;border-bottom:1px solid #cedbe5;padding:18px 0;margin:20px 0 14px}.net strong{font-size:24px}.positive{color:#2d8a49}.negative{color:#b23d3d}.net-caption,.shop-caption{flex-basis:100%;font-size:11px;color:#6c7b88}.shop{font-size:12px;margin-bottom:0}.shop strong{font-size:19px;color:#146c94}.return-note{font-size:11px;color:#6c7b88;white-space:pre-wrap;margin:14px 0 0}
.text-block{padding:10px 12px;margin:12px 0;background:#f5f8fb;border-left:3px solid #c0d9e6;overflow-wrap:anywhere}.text-block h3{font-size:12px;font-weight:600;color:#285371;margin:0 0 4px}.text-block p{margin:0;white-space:pre-wrap;font-size:14px;line-height:1.65}
.items-section{margin:14px 0 0}.items-section h2{font-size:17px;font-weight:600;margin:0 0 10px}.items-section h2 small{font-size:11px;color:#6c7b88;font-weight:400;margin-left:12px}
table{width:100%;table-layout:fixed;border-collapse:collapse}th{background:#edf2f6;text-align:left;font-size:12px;font-weight:600;padding:8px 7px;border-bottom:1px solid #cedbe5}td{padding:9px 7px;vertical-align:top;border-bottom:1px solid #dce5eb;white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px}tbody tr:nth-child(even){background:#fafbfd}th:nth-child(2),th:nth-child(4),th:nth-child(5),td:nth-child(2),td:nth-child(4),td:nth-child(5){text-align:right}td:nth-child(6){font-size:13px;line-height:1.65;border-left:1px solid #e0e7ed;color:#536572}.item-detail{margin:0}.item-category{display:block;font-size:11px;color:#6c7b88;margin-top:2px}.continued{display:block;font-size:11px;color:#147ba8;margin-bottom:4px}
.footer{position:absolute;bottom:22px;left:36px;right:36px;border-top:1px solid #dce5eb;padding-top:9px;display:flex;justify-content:space-between;gap:18px;font-size:10px;color:#72808d}.footer>span:last-child{white-space:nowrap}
`

function makeElement(root, tag, text, className) {
  const node = root.createElement(tag)
  if (text != null) node.textContent = text
  if (className) node.className = className
  return node
}

const hasText = value => value != null && String(value).trim() !== ''

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
    let page, content, flow, tbody
    const summary = () => {
      const aside = makeElement(root, 'aside', null, 'summary')
      aside.append(makeElement(root, 'h2', 'สรุปเอกสาร'))
      for (const [label, amount, kind] of [['ค่าใช้จ่าย', doc.expense, ''], ['รายได้บริษัท', doc.income, ''], ['ส่วนต่างสุทธิ', doc.net, 'net'], ['ยอดขาย Workshop ของร้าน', doc.storeSales, 'shop']]) {
        const row = makeElement(root, 'div', null, `summary-row ${kind}`)
        const value = makeElement(root, 'p')
        value.append(makeElement(root, 'strong', `${kind === 'net' && amount > 0 ? '+' : ''}${documentMoney(amount)}`, kind === 'net' ? amount > 0 ? 'positive' : amount < 0 ? 'negative' : '' : ''), makeElement(root, 'small', ' บาท'))
        row.append(makeElement(root, 'span', label), value)
        if (kind === 'net') row.append(makeElement(root, 'span', 'รายได้บริษัท - ค่าใช้จ่าย', 'net-caption'))
        if (kind === 'shop') row.append(makeElement(root, 'span', 'ไม่รวมในรายได้บริษัท', 'shop-caption'))
        aside.append(row)
      }
      if (doc.returns) aside.append(makeElement(root, 'p', `รายได้บริษัทรวมยอดของคืน ${documentMoney(doc.returns)} บาท ตามเครื่องหมายที่บันทึกในระบบ`, 'return-note'))
      return aside
    }
    const addPage = () => {
      page = makeElement(root, 'section', null, 'page')
      const header = makeElement(root, 'header', null, 'header')
      const heading = makeElement(root, 'div', null, 'heading')
      heading.append(makeElement(root, 'h1', `รายงานเอกสาร | ${documentText(doc.docNo)}`), makeElement(root, 'span', 'GoCost', 'brand'))
      const meta = makeElement(root, 'div', null, 'document-meta')
      const status = makeElement(root, 'span', null, `status ${doc.status}`)
      status.append(makeElement(root, 'i'), root.createTextNode(doc.statusLabel))
      meta.append(makeElement(root, 'span', documentText(doc.storeName)), makeElement(root, 'span', `วันที่ ${doc.dateLabel}`), status)
      header.append(heading, meta)
      content = makeElement(root, 'div', null, pages.length ? 'report-continuation' : 'report-grid')
      if (!pages.length) {
        flow = makeElement(root, 'main', null, 'report-details')
        content.append(flow, summary())
      } else flow = content
      page.append(header, content, makeElement(root, 'footer', null, 'footer'))
      root.body.append(page)
      pages.push(page)
      tbody = null
    }
    const fits = () => content.getBoundingClientRect().bottom - page.getBoundingClientRect().top <= PAGE_HEIGHT - 72
    const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' })
    const segments = text => Array.from(segmenter.segment(text), part => part.segment)
    // Measure the final font/layout, then split only at grapheme boundaries.
    // Every source character is consumed exactly once, including line breaks.
    const largestPrefix = (parts, create) => {
      let low = 1, high = Math.max(...parts.map(part => part.length)), best = 0
      while (low <= high) {
        const middle = Math.floor((low + high) / 2)
        const node = create(parts.map(part => part.slice(0, middle).join('')))
        if (fits()) { best = middle; low = middle + 1 } else high = middle - 1
        node.remove()
      }
      return best
    }
    const appendText = (text, label, kind = 'document-note') => {
      tbody = null
      let parts = [segments(text)], continued = false, retried = false
      const create = ([value]) => {
        const block = makeElement(root, 'section', null, 'text-block')
        block.dataset.kind = kind
        block.append(makeElement(root, 'h3', `${label}${continued ? ' (ต่อ)' : ''}`), makeElement(root, 'p', value))
        flow.append(block)
        return block
      }
      while (parts[0].length) {
        const count = largestPrefix(parts, create)
        if (!count) {
          if (retried) throw new Error('ข้อมูลไม่สามารถจัดลงหน้ากระดาษได้')
          addPage(); retried = true; continue
        }
        create(parts.map(part => part.slice(0, count).join('')))
        parts = parts.map(part => part.slice(count))
        if (parts[0].length) { continued = true; addPage(); retried = true }
      }
    }
    const ensureTable = () => {
      if (tbody) return
      const section = makeElement(root, 'section', null, 'items-section')
      const title = makeElement(root, 'h2', 'รายละเอียดเอกสาร')
      title.append(makeElement(root, 'small', 'หน่วย: บาท'))
      const table = makeElement(root, 'table'), cols = makeElement(root, 'colgroup')
      for (const width of [28, 8, 9, 16, 16, 23]) {
        const col = makeElement(root, 'col'); col.style.width = `${width}%`; cols.append(col)
      }
      const head = makeElement(root, 'thead'), row = makeElement(root, 'tr')
      for (const label of ['รายการ', 'จำนวน', 'หน่วย', 'ราคา/หน่วย', 'รวม', 'หมายเหตุ']) row.append(makeElement(root, 'th', label))
      head.append(row)
      tbody = makeElement(root, 'tbody')
      table.append(cols, head, tbody)
      section.append(title, table); flow.append(section)
    }
    const removeEmptyTable = () => {
      if (tbody && !tbody.children.length) { tbody.closest('.items-section').remove(); tbody = null }
    }
    const appendItem = (item, index) => {
      ensureTable()
      const category = item.mainCategory === 'รายได้' ? item.detail === 'รายได้จาก Workshop' ? 'ยอดขายของร้าน' : 'รายได้บริษัท' : documentText(item.mainCategory)
      const cells = [documentText(item.detail), category, documentText(item.unit), hasText(item.remark) ? String(item.remark) : '—']
      let continued = false
      const create = values => {
        const row = makeElement(root, 'tr')
        row.dataset.itemIndex = String(index)
        row.dataset.continued = String(continued)
        const description = makeElement(root, 'td')
        if (continued) description.append(makeElement(root, 'span', `รายการที่ ${item.seq} (ต่อ)`, 'continued'))
        description.append(makeElement(root, 'p', values[0], 'item-detail'), makeElement(root, 'span', values[1], 'item-category'))
        row.append(description, makeElement(root, 'td', continued ? '' : documentText(item.qty)), makeElement(root, 'td', values[2], 'item-unit'), makeElement(root, 'td', continued ? '' : documentMoney(item.unitPrice)), makeElement(root, 'td', continued ? '' : documentMoney(item.total)), makeElement(root, 'td', values[3], 'item-remark'))
        tbody.append(row)
        return row
      }
      let row = create(cells)
      if (fits()) return
      row.remove(); removeEmptyTable()
      addPage(); ensureTable()
      row = create(cells)
      if (fits()) return
      row.remove()
      let parts = cells.map(segments)
      while (parts.some(part => part.length)) {
        const count = largestPrefix(parts, create)
        if (!count) throw new Error('รายการไม่สามารถจัดลงหน้ากระดาษได้')
        create(parts.map(part => part.slice(0, count).join('')))
        parts = parts.map(part => part.slice(count))
        if (parts.some(part => part.length)) { continued = true; addPage(); ensureTable() }
      }
    }
    addPage()
    const metadata = makeElement(root, 'div', null, 'metadata')
    metadata.append(makeElement(root, 'span', `ผู้เข้างาน ${documentText(doc.attendees)} คน`), makeElement(root, 'span', `วันทำงาน ${documentText(doc.workDays)} วัน`))
    if (!hasText(doc.internalNote)) metadata.append(makeElement(root, 'span', 'หมายเหตุ —'))
    flow.append(metadata)
    if (hasText(doc.internalNote)) appendText(String(doc.internalNote), 'หมายเหตุเอกสาร')
    doc.items.forEach(appendItem)
    if (!doc.items.length) appendText('ไม่มีรายการย่อยในเอกสารนี้', 'รายละเอียดเอกสาร', 'empty-items')
    if (doc.files.length) appendText(doc.files.map((file, index) => `${index + 1}. ${attachmentName(file, index)}`).join('\n'), `ไฟล์แนบ ${doc.files.length} ไฟล์ (เปิดต้นฉบับได้จาก Insight)`, 'attachments')
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

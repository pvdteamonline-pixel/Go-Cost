import { documentMoney, documentText } from '../lib/expenseDocument'
import Icon from './Icon'

export function DocumentStatus({ doc }) {
  return <span className={`expense-status expense-status--${doc.status}`}><i aria-hidden="true" />{doc.statusLabel}</span>
}

export function DocumentMetadata({ doc }) {
  const hasNote = doc.internalNote != null && String(doc.internalNote).trim() !== ''
  return <div className="expense-metadata">
    <span><Icon name="users" size={20} />ผู้เข้างาน {documentText(doc.attendees)} คน</span>
    <span><Icon name="calendar" size={20} />วันทำงาน {documentText(doc.workDays)} วัน</span>
    {!hasNote && <span className="expense-note"><Icon name="file" size={20} />หมายเหตุ —</span>}
    {hasNote && <div className="expense-document-note"><Icon name="file" size={18} /><div><strong>หมายเหตุเอกสาร</strong><p className="expense-preserve">{doc.internalNote}</p></div></div>}
  </div>
}

export function DocumentSummary({ doc }) {
  return <>
    <div className="expense-totals">
      <div><span>ค่าใช้จ่าย</span><p><strong>{documentMoney(doc.expense)}</strong> <small>บาท</small></p></div>
      <div><span>รายได้บริษัท</span><p><strong>{documentMoney(doc.income)}</strong> <small>บาท</small></p></div>
      <div className="expense-net"><span>ส่วนต่างสุทธิ</span><p className={doc.net > 0 ? 'expense-positive' : doc.net < 0 ? 'expense-negative' : ''}><strong>{doc.net > 0 ? '+' : ''}{documentMoney(doc.net)}</strong> <small>บาท</small></p><small className="expense-net-caption">รายได้บริษัท − ค่าใช้จ่าย</small></div>
    </div>
    <div className="expense-shop-sales"><span>ยอดขาย Workshop ของร้าน</span><strong>{documentMoney(doc.storeSales)} <small>บาท</small></strong><span className="expense-muted">ไม่รวมในรายได้บริษัท</span></div>
    {!!doc.returns && <p className="expense-return-note">รายได้บริษัทรวมยอดของคืน {documentMoney(doc.returns)} บาท ตามเครื่องหมายที่บันทึกในระบบ</p>}
  </>
}

export function DocumentItems({ doc }) {
  return <div className="expense-table-scroll" tabIndex={0} role="region" aria-label="รายละเอียดรายการเอกสาร">
    <table className="expense-detail-table">
      <colgroup>{[28, 8, 9, 16, 16, 23].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
      <thead><tr>{['รายการ', 'จำนวน', 'หน่วย', 'ราคา/หน่วย', 'รวม', 'หมายเหตุ'].map((heading, index) => <th scope="col" className={[1, 3, 4].includes(index) ? 'expense-number' : ''} key={heading}>{heading}</th>)}</tr></thead>
      <tbody>{doc.items.map((item, index) => <tr key={index}>
        <td><span className="expense-preserve">{documentText(item.detail)}</span><small>{item.mainCategory === 'รายได้' ? item.detail === 'รายได้จาก Workshop' ? 'ยอดขายของร้าน' : 'รายได้บริษัท' : documentText(item.mainCategory)}</small></td>
        <td className="expense-number">{documentText(item.qty)}</td><td>{documentText(item.unit)}</td>
        <td className="expense-number">{documentMoney(item.unitPrice)}</td><td className="expense-number">{documentMoney(item.total)}</td>
        <td className="expense-item-remark expense-preserve">{item.remark != null && String(item.remark).trim() !== '' ? item.remark : '—'}</td>
      </tr>)}</tbody>
    </table>
    {!doc.items.length && <p className="expense-empty">ไม่มีรายการย่อยในเอกสารนี้</p>}
  </div>
}

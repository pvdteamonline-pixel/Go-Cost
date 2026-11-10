import { documentMoney, documentText } from '../lib/expenseDocument'
import Icon from './Icon'

export function DocumentStatus({ doc }) {
  return <span className={`expense-status expense-status--${doc.status}`}><i aria-hidden="true" />{doc.statusLabel}</span>
}

export function DocumentMetadata({ doc }) {
  return <div className="expense-metadata">
    <span><Icon name="calendar" size={17} />วันที่ {doc.dateLabel}</span>
    <DocumentStatus doc={doc} />
    <span><Icon name="users" size={17} />ผู้เข้างาน {documentText(doc.attendees)} คน</span>
    <span><Icon name="calendar" size={17} />วันทำงาน {documentText(doc.workDays)} วัน</span>
    <span className="expense-note"><Icon name="file" size={17} /><span>หมายเหตุ <span className="expense-preserve">{documentText(doc.internalNote)}</span></span></span>
  </div>
}

export function DocumentSummary({ doc }) {
  return <>
    <div className="expense-totals">
      <div><span>ค่าใช้จ่าย</span><p><strong>{documentMoney(doc.expense)}</strong> <small>บาท</small></p></div>
      <div><span>รายได้บริษัท</span><p><strong>{documentMoney(doc.income)}</strong> <small>บาท</small></p></div>
      <div><span>ส่วนต่างสุทธิ</span><p className={doc.net > 0 ? 'expense-positive' : doc.net < 0 ? 'expense-negative' : ''}><strong>{doc.net > 0 ? '+' : ''}{documentMoney(doc.net)}</strong> <small>บาท</small></p></div>
    </div>
    <div className="expense-shop-sales"><span>ยอดขาย Workshop ของร้าน</span><strong>{documentMoney(doc.storeSales)} <small>บาท</small></strong><span className="expense-muted">ไม่รวมในรายได้บริษัท</span></div>
    {!!doc.returns && <p className="expense-return-note">รายได้บริษัทรวมยอดของคืน {documentMoney(doc.returns)} บาท ตามเครื่องหมายที่บันทึกในระบบ</p>}
  </>
}

export function DocumentItems({ doc }) {
  return <div className="expense-table-scroll" tabIndex={0} role="region" aria-label="รายละเอียดรายการเอกสาร">
    <table className="expense-detail-table">
      <colgroup>{[5, 31, 7, 8, 14, 14, 21].map((width, index) => <col key={index} style={{ width: `${width}%` }} />)}</colgroup>
      <thead><tr>{['ลำดับ', 'ประเภท / รายละเอียด', 'จำนวน', 'หน่วย', 'ราคา/หน่วย', 'รวม', 'หมายเหตุ'].map((heading, index) => <th scope="col" className={[2, 4, 5].includes(index) ? 'expense-number' : ''} key={heading}>{heading}</th>)}</tr></thead>
      <tbody>{doc.items.map((item, index) => <tr key={index}>
        <td>{item.seq}</td><td><span className="expense-preserve">{documentText(item.detail)}</span><small>{documentText(item.mainCategory)}{item.mainCategory === 'รายได้' && item.detail === 'รายได้จาก Workshop' ? ' · ยอดขายของร้าน' : ''}</small></td>
        <td className="expense-number">{documentText(item.qty)}</td><td>{documentText(item.unit)}</td>
        <td className="expense-number">{documentMoney(item.unitPrice)}</td><td className="expense-number">{documentMoney(item.total)}</td><td className="expense-preserve">{documentText(item.remark)}</td>
      </tr>)}</tbody>
    </table>
    {!doc.items.length && <p className="expense-empty">ไม่มีรายการย่อยในเอกสารนี้</p>}
  </div>
}

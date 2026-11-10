import { expenseTotal, formatMoney } from '../lib/workshopRequest'
import { thaiDate } from '../lib/thaiDates'
import './WorkshopRequest.css'
import WorkshopProductEstimates from './WorkshopProductEstimates'

export default function WorkshopRequestDetails({ plan }) {
  const d = plan.request_details
  return <section className="wr-details" aria-label="รายละเอียดคำขอจัดงาน">
    <h3>รายละเอียดคำขอจัดงาน</h3>
    <dl className="wr-detail-grid">
      <div><dt>ประเภทงาน</dt><dd>{d?.event_type || 'Workshop'}</dd></div>
      <div><dt>ชื่อร้าน / ลูกค้า / สถาบัน</dt><dd>{d?.party_name || plan.store_name || plan.storeName || '—'}</dd></div>
      <div><dt>วันที่–เวลาจัด</dt><dd>{thaiDate(plan.planned_date || plan.eventDate)}{d?.start_time ? ' · ' + d.start_time + '–' + d.end_time : ''}</dd></div>
      <div><dt>สถานที่จัด</dt><dd>{d?.venue || '—'}</dd></div>
      <div><dt>หัวข้ออบรม</dt><dd>{d?.topic || '—'}</dd></div>
      <div><dt>จำนวนคนที่คาดหวัง</dt><dd>{d?.expected_attendees == null ? '—' : d.expected_attendees.toLocaleString('th-TH') + ' คน'}</dd></div>
      <div><dt>ค่าใช้จ่ายที่คาดการณ์</dt><dd>{formatMoney(d?.estimated_cost)} บาท</dd></div>
      <div><dt>อุปกรณ์ที่ต้องการสนับสนุน</dt><dd>{d ? d.equipment || 'ไม่ขออุปกรณ์สนับสนุน' : '—'}</dd></div>
    </dl>
    {!d && <p className="wr-hint">คำขอเดิมยังไม่มีข้อมูลเพิ่มเติม สามารถเพิ่มได้ที่ “แก้ไขคำขอ”</p>}
    {d && <div className="wr-expenses"><h4>รายละเอียดค่าใช้จ่ายที่ต้องการเบิก</h4>
      {d.expense_items?.length ? <><table><thead><tr><th>รายการ</th><th>จำนวนเงิน (บาท)</th></tr></thead><tbody>{d.expense_items.map((item, i) => <tr key={i}><td>{item.description}</td><td>{formatMoney(item.amount)}</td></tr>)}</tbody></table><p className="wr-total">รวมขอเบิก <strong>{formatMoney(expenseTotal(d.expense_items))} บาท</strong></p></> : <p className="wr-hint">ไม่ขอเบิกค่าใช้จ่าย</p>}
    </div>}
    <WorkshopProductEstimates values={d} />
  </section>
}

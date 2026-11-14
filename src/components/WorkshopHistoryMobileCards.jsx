import { useId, useState } from 'react'
import Icon from './Icon'
import { documentDate } from '../lib/expenseDocument'
import { planRange } from '../lib/workshopCalendar'
import { approvalGroup, WORKSHOP_STATUS } from '../lib/workshopRequest'

function HistoryCard({ plan, onSelect, hasActions, renderActions, confirmingDeleteId, renderConfirmation }) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const actionsId = useId()
  const group = approvalGroup(plan.status)
  const status = WORKSHOP_STATUS[plan.status] || 'ไม่ทราบสถานะ'
  const tone = plan.status === 'rejected' ? 'rejected' : group
  const label = group === 'approved' ? 'อนุมัติแล้ว' : plan.status === 'rejected' ? 'ปฏิเสธ' : status
  const substatus = group === 'approved' ? status.split(' · ')[1] : null
  const range = planRange(plan), endDate = plan.request_details?.end_date
  let date = documentDate(plan.planned_date)
  if (range && range.end > range.start) {
    date = plan.planned_date.slice(0, 7) === endDate.slice(0, 7)
      ? `${plan.planned_date.slice(8)}–${documentDate(endDate)}`
      : `${date} – ${documentDate(endDate)}`
  }
  return <li className="whc-history-card" data-mobile-plan={plan.id}>
    <div className="whc-mobile-identity">
      <strong className="whc-mobile-store">{plan.store_name || plan.request_details?.party_name || 'ไม่ระบุร้าน'}</strong>
      <span className="whc-mobile-id">{plan.id}</span>
    </div>
    <span className={`whc-status ${tone}`}>{label}</span>
    {substatus && <small className="whc-mobile-substatus">{substatus}</small>}
    <div className="whc-mobile-bottom">
      <span className="whc-mobile-date" aria-label={`วันจัดงาน ${date}`}><Icon name="calendar" size={17}/><span>{date}</span></span>
      <div className="whc-mobile-buttons">
        <button className="whc-mobile-insight" aria-label={`Insight ${plan.id}`} onClick={() => onSelect(plan)}><Icon name="eye" size={17}/>Insight</button>
        {hasActions(plan) && <button className="whc-mobile-more" aria-label={`การดำเนินการ ${plan.id}`} aria-expanded={actionsOpen} aria-controls={actionsId} onClick={() => setActionsOpen(value => !value)}><Icon name="more" size={18}/></button>}
      </div>
    </div>
    {plan.status === 'rejected' && plan.admin_note && <p className="whc-mobile-note">{plan.admin_note}</p>}
    {hasActions(plan) && <div id={actionsId} hidden={!actionsOpen} className="whc-mobile-actions"><div className="whc-extra-actions" aria-label={`การดำเนินการคำขอ ${plan.id}`}>{actionsOpen && renderActions(plan)}</div></div>}
    {confirmingDeleteId === plan.id && <div className="whc-mobile-confirm">{renderConfirmation(plan)}</div>}
  </li>
}

export default function WorkshopHistoryMobileCards({ month, ...rowProps }) {
  // Match the existing history table order and reuse its permission-controlled actions.
  const plans = [...month.approved, ...month.pending, ...month.other]
  return <ul className="whc-mobile-history" aria-label={`ประวัติรายการเดือน${month.label}`}>
    {plans.map(plan => <HistoryCard key={plan.id} plan={plan} {...rowProps}/>)}
  </ul>
}

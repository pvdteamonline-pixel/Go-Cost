import { useId, useState } from 'react'
import Icon from './Icon'
import WorkshopHistoryMobileCards from './WorkshopHistoryMobileCards'
import { documentDate } from '../lib/expenseDocument'
import { planRange } from '../lib/workshopCalendar'
import { approvalGroup, WORKSHOP_STATUS } from '../lib/workshopRequest'
import { workshopStoreSummary } from '../lib/workshopHistory'

const GROUPS = [{ key: 'approved', label: 'อนุมัติแล้ว' }, { key: 'pending', label: 'รออนุมัติ' }, { key: 'other', label: 'สถานะอื่น ๆ' }]

function StatusMark({ kind }) {
  return <span className={`whc-mark ${kind}`} aria-hidden="true">{kind === 'approved' ? <Icon name="check" size={13} /> : kind === 'pending' ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg> : <Icon name="info" size={17} />}</span>
}

function Period({ label, summary, level, open, onToggle, children, countMode, rejectedCount = 0 }) {
  const id = useId()
  const unit = countMode === 'requests' ? 'รายการ' : 'ร้าน'
  const counts = countMode === 'requests' ? summary.requestCounts : summary
  const total = countMode === 'requests' ? summary.requests : summary.stores
  const otherCount = counts.other - rejectedCount
  const countsId = `${id}-counts`
  const Heading = level === 'year' ? 'h2' : 'h3'
  return <section className={`whc-period whc-${level}`} aria-label={label}>
    <Heading className="whc-period-title"><button className="whc-period-toggle" aria-label={`${open ? 'พับ' : 'ขยาย'}${level === 'year' ? 'ปี' : 'เดือน'} ${label}`} aria-expanded={open} aria-controls={id} aria-describedby={countsId} onClick={onToggle}>
      <Icon name={open ? 'chevronDown' : 'chevronRight'} size={20} /><span className="whc-period-label">{label}</span>
      <span id={countsId} className="whc-period-counts"><strong title={countMode === 'requests' ? 'จำนวนคำขอในกลุ่มนี้' : 'จำนวนร้านไม่ซ้ำในกลุ่มนี้'}>{total} {unit}</strong><span className="approved"><StatusMark kind="approved"/>อนุมัติแล้ว {counts.approved} {unit}</span><span className="pending"><StatusMark kind="pending"/>รออนุมัติ {counts.pending} {unit}</span>{rejectedCount > 0 && <span className="rejected"><span className="whc-mark rejected" aria-hidden="true"><Icon name="close" size={13}/></span>ปฏิเสธ {rejectedCount} {unit}</span>}{(countMode === 'requests' ? otherCount > 0 : summary.otherRequests > 0) && <span className="other"><StatusMark kind="other"/>สถานะอื่น {otherCount} {unit}</span>}</span>
    </button></Heading>
    <div id={id} hidden={!open} className={level === 'year' ? 'whc-months' : 'whc-month-body'}>{open && children}</div>
  </section>
}

function PlanRow({ plan, onSelect, hasActions, renderActions, confirmingDeleteId, renderConfirmation, approvalColors = false }) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const id = useId(), group = approvalGroup(plan.status), status = WORKSHOP_STATUS[plan.status] || 'ไม่ทราบสถานะ'
  const substatus = group === 'approved' ? status.split(' · ')[1] : null
  return <>
    <tr className="whc-document-row document-data-row" data-document={plan.id}>
      <td><button className="whc-document-link" onClick={() => onSelect(plan)}>{plan.id}</button><span className="whc-store-name">{plan.store_name || plan.request_details?.party_name || 'ไม่ระบุร้าน'}</span></td>
      <td className="whc-date">{documentDate(plan.planned_date)}</td>
      <td><span className={`whc-status ${approvalColors && plan.status === 'rejected' ? 'rejected' : group}`}>{group === 'approved' ? 'อนุมัติแล้ว' : approvalColors && plan.status === 'rejected' ? 'ปฏิเสธ' : status}</span>{substatus && <small>{substatus}</small>}{plan.status === 'rejected' && plan.admin_note && <small>{plan.admin_note}</small>}</td>
      <td><div className="whc-row-actions"><button aria-label={`Insight ${plan.id}`} onClick={() => onSelect(plan)}><Icon name="eye" size={16}/>Insight</button>{hasActions(plan) && <button aria-label={`การดำเนินการ ${plan.id}`} aria-expanded={actionsOpen} aria-controls={id} onClick={() => setActionsOpen(value => !value)}><Icon name="more" size={18}/></button>}</div></td>
    </tr>
    {actionsOpen && <tr><td colSpan={4} id={id} className="whc-actions-cell"><div className="whc-extra-actions" aria-label={`การดำเนินการคำขอ ${plan.id}`}>{renderActions(plan)}</div></td></tr>}
    {confirmingDeleteId === plan.id && <tr><td colSpan={4} className="whc-actions-cell">{renderConfirmation(plan)}</td></tr>}
  </>
}

function ApprovalMobileCards({ month, onSelect }) {
  const plans = [...month.pending, ...month.approved, ...month.other]
  return <ul className="whc-mobile-approval" aria-label={`รายการอนุมัติเดือน${month.label}`}>
    {plans.map(plan => {
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
      return <li className="whc-approval-card" key={plan.id}>
        <div className="whc-mobile-identity">
          <strong className="whc-mobile-store">{plan.store_name || plan.request_details?.party_name || 'ไม่ระบุร้าน'}</strong>
          <span className="whc-mobile-id">{plan.id}</span>
        </div>
        <span className={`whc-status ${tone}`}>{label}</span>
        {substatus && <small className="whc-mobile-substatus">{substatus}</small>}
        <div className="whc-mobile-bottom">
          <span className="whc-mobile-date" aria-label={`วันจัดงาน ${date}`}><Icon name="calendar" size={17}/><span>{date}</span></span>
          <button className="whc-mobile-insight" aria-label={`Insight ${plan.id}`} onClick={() => onSelect(plan)}><Icon name="eye" size={17}/>Insight</button>
        </div>
        {plan.status === 'rejected' && plan.admin_note && <p className="whc-mobile-note">{plan.admin_note}</p>}
      </li>
    })}
  </ul>
}
function MonthTable({ month, countMode, ...rowProps }) {
  const groups = countMode === 'requests' ? [GROUPS[1], GROUPS[0], GROUPS[2]] : GROUPS
  return <>{countMode === 'requests' && <ApprovalMobileCards month={month} onSelect={rowProps.onSelect}/>}{countMode === 'stores' && <WorkshopHistoryMobileCards month={month} {...rowProps}/>}<div className="whc-table-scroll" role="region" aria-label={`รายการเดือน${month.label}`} tabIndex={0}><table className="whc-table workshop-history-table">
    <colgroup><col style={{width:'41%'}}/><col style={{width:'20%'}}/><col style={{width:'24%'}}/><col style={{width:'15%'}}/></colgroup>
    <thead><tr><th scope="col">เลขที่คำขอ / ร้านค้า</th><th scope="col">วันจัดงาน</th><th scope="col">สถานะ</th><th scope="col"><span className="expense-sr-only">การดำเนินการ</span></th></tr></thead>
    {groups.filter(group => month[group.key].length).map(group => {
      const rows = month[group.key], summary = workshopStoreSummary(rows)
      return <tbody key={group.key}>
        <tr className={`whc-status-band ${group.key}`}><th scope="rowgroup" colSpan={4}><span><StatusMark kind={group.key}/>{group.label} · {countMode === 'requests' ? `${summary.requests} รายการ` : <>{summary.stores} ร้าน{summary.requests !== summary.stores && <small>· {summary.requests} คำขอ</small>}</>}</span></th></tr>
        {rows.map(plan => <PlanRow key={plan.id} plan={plan} approvalColors={countMode === 'requests'} {...rowProps}/>) }
      </tbody>
    })}
  </table></div></>
}

export default function WorkshopHistoryTree({ years, countMode = 'stores', ...rowProps }) {
  const [expandedYears, setExpandedYears] = useState({}), [collapsedMonths, setCollapsedMonths] = useState({})
  return <div className="whc-years">{years.map((year, index) => <Period key={year.key} countMode={countMode} level="year" label={year.label} summary={year.summary} rejectedCount={countMode === 'requests' ? year.months.reduce((sum, month) => sum + month.other.filter(plan => plan.status === 'rejected').length, 0) : 0} open={expandedYears[year.key] ?? index === 0} onToggle={() => setExpandedYears(previous => ({ ...previous, [year.key]: !(previous[year.key] ?? index === 0) }))}>
    {year.months.map(month => <Period key={month.key} countMode={countMode} level="month" label={month.label} summary={month.summary} rejectedCount={countMode === 'requests' ? month.other.filter(plan => plan.status === 'rejected').length : 0} open={!collapsedMonths[month.key]} onToggle={() => setCollapsedMonths(previous => ({ ...previous, [month.key]: !previous[month.key] }))}>
      <MonthTable month={month} countMode={countMode} {...rowProps}/>
    </Period>)}
  </Period>)}</div>
}

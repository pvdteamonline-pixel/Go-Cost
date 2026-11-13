import { useId, useState } from 'react'
import Icon from './Icon'
import { documentDate } from '../lib/expenseDocument'
import { approvalGroup, WORKSHOP_STATUS } from '../lib/workshopRequest'
import { workshopStoreSummary } from '../lib/workshopHistory'

const GROUPS = [{ key: 'approved', label: 'อนุมัติแล้ว' }, { key: 'pending', label: 'รออนุมัติ' }, { key: 'other', label: 'สถานะอื่น ๆ' }]

function StatusMark({ kind }) {
  return <span className={`whc-mark ${kind}`} aria-hidden="true">{kind === 'approved' ? <Icon name="check" size={13} /> : kind === 'pending' ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/></svg> : <Icon name="info" size={17} />}</span>
}

function Period({ label, summary, level, open, onToggle, children }) {
  const id = useId()
  const countsId = `${id}-counts`
  const Heading = level === 'year' ? 'h2' : 'h3'
  return <section className={`whc-period whc-${level}`} aria-label={label}>
    <Heading className="whc-period-title"><button className="whc-period-toggle" aria-label={`${open ? 'พับ' : 'ขยาย'}${level === 'year' ? 'ปี' : 'เดือน'} ${label}`} aria-expanded={open} aria-controls={id} aria-describedby={countsId} onClick={onToggle}>
      <Icon name={open ? 'chevronDown' : 'chevronRight'} size={20} /><span className="whc-period-label">{label}</span>
      <span id={countsId} className="whc-period-counts"><strong title="จำนวนร้านไม่ซ้ำในกลุ่มนี้">{summary.stores} ร้าน</strong><span className="approved"><StatusMark kind="approved"/>อนุมัติแล้ว {summary.approved} ร้าน</span><span className="pending"><StatusMark kind="pending"/>รออนุมัติ {summary.pending} ร้าน</span>{summary.otherRequests > 0 && <span className="other"><StatusMark kind="other"/>สถานะอื่น {summary.other} ร้าน</span>}</span>
    </button></Heading>
    <div id={id} hidden={!open} className={level === 'year' ? 'whc-months' : 'whc-month-body'}>{open && children}</div>
  </section>
}

function PlanRow({ plan, onSelect, hasActions, renderActions, confirmingDeleteId, renderConfirmation }) {
  const [actionsOpen, setActionsOpen] = useState(false)
  const id = useId(), group = approvalGroup(plan.status), status = WORKSHOP_STATUS[plan.status] || 'ไม่ทราบสถานะ'
  const substatus = group === 'approved' ? status.split(' · ')[1] : null
  return <>
    <tr className="whc-document-row document-data-row" data-document={plan.id}>
      <td><button className="whc-document-link" onClick={() => onSelect(plan)}>{plan.id}</button><span className="whc-store-name">{plan.store_name || plan.request_details?.party_name || 'ไม่ระบุร้าน'}</span></td>
      <td className="whc-date">{documentDate(plan.planned_date)}</td>
      <td><span className={`whc-status ${group}`}>{group === 'approved' ? 'อนุมัติแล้ว' : status}</span>{substatus && <small>{substatus}</small>}{plan.status === 'rejected' && plan.admin_note && <small>{plan.admin_note}</small>}</td>
      <td><div className="whc-row-actions"><button aria-label={`Insight ${plan.id}`} onClick={() => onSelect(plan)}><Icon name="eye" size={16}/>Insight</button>{hasActions(plan) && <button aria-label={`การดำเนินการ ${plan.id}`} aria-expanded={actionsOpen} aria-controls={id} onClick={() => setActionsOpen(value => !value)}><Icon name="more" size={18}/></button>}</div></td>
    </tr>
    {actionsOpen && <tr><td colSpan={4} id={id} className="whc-actions-cell"><div className="whc-extra-actions" aria-label={`การดำเนินการคำขอ ${plan.id}`}>{renderActions(plan)}</div></td></tr>}
    {confirmingDeleteId === plan.id && <tr><td colSpan={4} className="whc-actions-cell">{renderConfirmation(plan)}</td></tr>}
  </>
}

function MonthTable({ month, ...rowProps }) {
  return <div className="whc-table-scroll" role="region" aria-label={`รายการเดือน${month.label}`} tabIndex={0}><table className="whc-table workshop-history-table">
    <colgroup><col style={{width:'41%'}}/><col style={{width:'20%'}}/><col style={{width:'24%'}}/><col style={{width:'15%'}}/></colgroup>
    <thead><tr><th scope="col">เลขที่คำขอ / ร้านค้า</th><th scope="col">วันจัดงาน</th><th scope="col">สถานะ</th><th scope="col"><span className="expense-sr-only">การดำเนินการ</span></th></tr></thead>
    {GROUPS.filter(group => month[group.key].length).map(group => {
      const rows = month[group.key], summary = workshopStoreSummary(rows)
      return <tbody key={group.key}>
        <tr className={`whc-status-band ${group.key}`}><th scope="rowgroup" colSpan={4}><span><StatusMark kind={group.key}/>{group.label} · {summary.stores} ร้าน{summary.requests !== summary.stores && <small>· {summary.requests} คำขอ</small>}</span></th></tr>
        {rows.map(plan => <PlanRow key={plan.id} plan={plan} {...rowProps}/>) }
      </tbody>
    })}
  </table></div>
}

export default function WorkshopHistoryTree({ years, ...rowProps }) {
  const [expandedYears, setExpandedYears] = useState({}), [collapsedMonths, setCollapsedMonths] = useState({})
  return <div className="whc-years">{years.map((year, index) => <Period key={year.key} level="year" label={year.label} summary={year.summary} open={expandedYears[year.key] ?? index === 0} onToggle={() => setExpandedYears(previous => ({ ...previous, [year.key]: !(previous[year.key] ?? index === 0) }))}>
    {year.months.map(month => <Period key={month.key} level="month" label={month.label} summary={month.summary} open={!collapsedMonths[month.key]} onToggle={() => setCollapsedMonths(previous => ({ ...previous, [month.key]: !previous[month.key] }))}>
      <MonthTable month={month} {...rowProps}/>
    </Period>)}
  </Period>)}</div>
}

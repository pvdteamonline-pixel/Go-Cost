import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import ThaiMonthSelect from './ThaiMonthSelect'
import ExpenseInsight from './ExpenseInsight'
import { WORKSHOP_TYPES, WORKSHOP_STATUS, monthLabel } from '../lib/workshopRequest'
import { calendarWeeks, changeMonth, planRange, plansOnDate, todayInBangkok } from '../lib/workshopCalendar'
import { thaiDate } from '../lib/thaiDates'
import './WorkshopCalendar.css'

const typeTone = type => ['blue', 'purple', 'green', 'teal'][WORKSHOP_TYPES.indexOf(type)] || 'gray'
const party = plan => plan.request_details?.party_name || plan.store_name || 'ไม่ระบุร้าน'
const eventType = plan => plan.request_details?.event_type || 'Workshop'
const planTitle = plan => `${party(plan)} · ${eventType(plan)}`
function planTime(plan) {
  const details = plan.request_details
  if (!details?.start_time || !details?.end_time) return 'ไม่ระบุเวลา'
  const daily = details.end_date && details.end_date > plan.planned_date
  return `${details.start_time}–${details.end_time}${daily ? ' ทุกวัน' : ''}`
}
const shortMonth = new Intl.DateTimeFormat('th-TH', { month: 'short', timeZone: 'UTC' })
function barDates(plan) {
  const start = plan.planned_date, end = plan.request_details?.end_date
  if (!end || end === start) return ''
  return start.slice(0, 7) === end.slice(0, 7)
    ? ` · ${Number(start.slice(-2))}–${Number(end.slice(-2))} ${shortMonth.format(new Date(`${start}T00:00:00Z`))}`
    : ` · ${thaiDate(start)}–${thaiDate(end)}`
}
const document = plan => ({ ...plan, type: 'Workshop', docNo: plan.id, storeName: party(plan), eventDate: plan.planned_date, income: plan.sales_push_amount, storeSales: plan.workshop_sales_amount })

export default function WorkshopCalendar({ plans, people, loading, error, peopleError, month, onMonthChange, selectedDate, onDateChange, onCreate, onRefresh }) {
  const [search, setSearch] = useState(''), [proposer, setProposer] = useState(''), [role, setRole] = useState(''), [type, setType] = useState('')
  const [insight, setInsight] = useState(null)
  const gridRef = useRef(null), legendRef = useRef(null)
  const [scheduleHeight, setScheduleHeight] = useState(480)
  useLayoutEffect(() => {
    const grid = gridRef.current
    const measure = () => {
      // Document position stays stable while scrolling. Data never determines row height.
      const top = grid.getBoundingClientRect().top + window.scrollY
      const viewport = window.visualViewport?.height || window.innerHeight
      const legend = legendRef.current?.offsetHeight || 24
      setScheduleHeight(Math.max(180, Math.floor(viewport - top - legend - 40)))
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(grid.parentElement)
    observer.observe(legendRef.current)
    window.addEventListener('resize', measure)
    window.visualViewport?.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.visualViewport?.removeEventListener('resize', measure)
    }
  }, [])
  const peopleById = useMemo(() => new Map(people.map(person => [person.id, person])), [people])
  const proposers = useMemo(() => [...new Set(plans.map(plan => plan.created_by).filter(Boolean))].map(id => ({ id, name: peopleById.get(id)?.name || id, role: peopleById.get(id)?.role || '' })).sort((a, b) => a.name.localeCompare(b.name, 'th')), [plans, peopleById])
  const roles = [...new Set(proposers.map(person => person.role).filter(Boolean))]
  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('th-TH')
    return plans.filter(plan => (!proposer || plan.created_by === proposer) && (!role || peopleById.get(plan.created_by)?.role === role) && (!type || eventType(plan) === type) && (!query || [plan.id, party(plan), eventType(plan), plan.request_details?.topic, peopleById.get(plan.created_by)?.name].some(value => String(value || '').toLocaleLowerCase('th-TH').includes(query))))
  }, [plans, proposer, role, type, search, peopleById])
  const weeks = useMemo(() => calendarWeeks(month, visible), [month, visible])
  const dayPlans = plansOnDate(visible, selectedDate)
  const invalidCount = visible.filter(plan => !planRange(plan)).length
  const rowHeight = Math.max(74, (scheduleHeight - 38) / weeks.length)
  const compact = rowHeight < 104
  const eventTop = compact ? 28 : 32, eventHeight = compact ? 24 : 48
  const maxLanes = Math.max(1, Math.min(3, Math.floor((rowHeight - eventTop - 22 + 7) / (eventHeight + 7))))
  const today = todayInBangkok()
  const openDate = date => { onDateChange(date); if (!date.startsWith(month)) onMonthChange(date.slice(0, 7)) }
  const selectMonth = value => { onMonthChange(value); onDateChange('') }
  const creator = plan => peopleById.get(plan.created_by)?.name || plan.created_by || 'ไม่ระบุผู้เสนอ'
  const describe = plan => `${planTitle(plan)} · ${thaiDate(plan.planned_date)}${plan.request_details?.end_date && plan.request_details.end_date !== plan.planned_date ? ' ถึง ' + thaiDate(plan.request_details.end_date) : ''} · ${planTime(plan)} · ${WORKSHOP_STATUS[plan.status] || plan.status} · ผู้เสนอ ${creator(plan)}`

  return <section className="gc-calendar" aria-label="ปฏิทินแผนงาน Workshop" aria-busy={loading}>
    <div className="gc-toolbar">
      <button className="gc-control" onClick={() => { onMonthChange(today.slice(0, 7)); onDateChange(today) }}>วันนี้</button>
      <div className="gc-month-arrows"><button className="gc-icon" aria-label="เดือนก่อนหน้า" onClick={() => selectMonth(changeMonth(month, -1))}><Icon name="chevronLeft" size={18}/></button><button className="gc-icon" aria-label="เดือนถัดไป" onClick={() => selectMonth(changeMonth(month, 1))}><Icon name="chevronRight" size={18}/></button></div>
      <ThaiMonthSelect className="gc-month" label="เดือนปฏิทินแผนงาน" value={month} allowAll={false} dates={plans.flatMap(plan => [plan.planned_date, plan.request_details?.end_date])} onChange={selectMonth}/>
      <label className="gc-search"><Icon name="search" size={17}/><input aria-label="ค้นหาแผนงาน" placeholder="ค้นหาชื่อร้าน / รายการงาน / ผู้เสนอ" value={search} onChange={e => setSearch(e.target.value)}/></label>
      <span className="gc-view">เดือน</span>
      <button className="gc-create" onClick={() => onCreate('')}><Icon name="plus" size={18}/>สร้างคำขอ</button>
    </div>
    <div className="gc-filters">
      <label>ผู้เสนอ<select aria-label="กรองผู้เสนอแผนงาน" value={proposer} onChange={e => setProposer(e.target.value)}><option value="">ทุกคน</option>{proposers.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
      <label>บทบาท<select aria-label="กรองบทบาทผู้เสนอ" value={role} onChange={e => setRole(e.target.value)} disabled={!!peopleError}><option value="">ทุกบทบาท</option>{roles.map(value => <option key={value}>{value}</option>)}</select></label>
      <label>ประเภทงาน<select aria-label="กรองประเภทแผนงาน" value={type} onChange={e => setType(e.target.value)}><option value="">ทั้งหมด</option>{WORKSHOP_TYPES.map(value => <option key={value}>{value}</option>)}</select></label>
      <button className="gc-icon" aria-label="รีเฟรชปฏิทิน" disabled={loading} onClick={onRefresh}><Icon name="refresh" size={18}/></button>
      {(search || proposer || role || type) && <button className="gc-clear" onClick={() => { setSearch(''); setProposer(''); setRole(''); setType('') }}>ล้างตัวกรอง</button>}
    </div>
    {error && <p role="alert" className="expense-alert">{error}</p>}
    {peopleError && <p role="alert" className="expense-alert">{peopleError} · แสดงรหัสผู้เสนอแทนชื่อชั่วคราว</p>}
    {invalidCount > 0 && <p role="alert" className="expense-alert">มี {invalidCount} คำขอที่วันที่ไม่ถูกต้อง จึงไม่วางบนปฏิทิน กรุณาตรวจในประวัติ Workshop</p>}
    {loading && <p role="status" className="gc-load">กำลังโหลดแผนงาน…</p>}
    <div ref={gridRef} className={`gc-grid gc-fit ${compact ? 'gc-compact' : ''}`} aria-label={monthLabel(month)} style={{ '--week-count': weeks.length, '--schedule-height': `${scheduleHeight}px`, '--event-top': `${eventTop}px`, '--event-height': `${eventHeight}px` }}>
      <div className="gc-weekdays">{['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(day => <div key={day}>{day}</div>)}</div>
      {weeks.map(week => <div key={week.start} className="gc-week" style={{ '--event-lanes': maxLanes }}>
        <div className="gc-days">{week.days.map(date => <div key={date} className={`gc-day ${date.startsWith(month) ? '' : 'outside'} ${selectedDate === date ? 'selected' : ''}`} data-date={date} onClick={event => { if (event.target === event.currentTarget) openDate(date) }}>
          <button className="gc-day-target" aria-label={`เลือกวันที่ ${thaiDate(date)}`} aria-pressed={selectedDate === date} onClick={() => openDate(date)}><span className={date === today ? 'gc-today' : ''}>{Number(date.slice(-2))}</span></button>
          {selectedDate === date && <button className="gc-day-create" aria-label={`สร้างแผนงานวันที่ ${thaiDate(date)}`} onClick={() => onCreate(date)}><Icon name="plus" size={14}/><span>สร้างแผนงาน</span></button>}
        </div>)}</div>
        <div className="gc-events">{week.segments.filter(segment => segment.lane < maxLanes).map(segment => <button key={segment.plan.id} className={`gc-event ${typeTone(eventType(segment.plan))} ${segment.before ? 'continues-before' : ''} ${segment.after ? 'continues-after' : ''}`} style={{ gridColumn: `${segment.from + 1} / span ${segment.span}`, gridRow: segment.lane + 1 }} title={describe(segment.plan)} aria-label={describe(segment.plan)} data-plan={segment.plan.id} onClick={() => setInsight(document(segment.plan))}><span>{segment.before ? '‹ ' : ''}{planTitle(segment.plan)}{barDates(segment.plan)}{segment.after ? ' ›' : ''}</span><span className="gc-event-time">{planTime(segment.plan)}</span></button>)}</div>
        <div className="gc-more-row">{week.days.map((date, index) => {
          const extra = week.segments.filter(segment => segment.lane >= maxLanes && segment.from <= index && segment.from + segment.span > index).length
          return <div key={date}>{extra > 0 && <button aria-label={`ดูอีก ${extra} แผนงาน วันที่ ${thaiDate(date)}`} onClick={() => openDate(date)}>อีก {extra}<span> แผนงาน</span></button>}</div>
        })}</div>
      </div>)}
    </div>
    <div ref={legendRef} className="gc-legend">{WORKSHOP_TYPES.map(value => <span key={value}><i className={typeTone(value)}/>{value}</span>)}</div>
    {!loading && !error && !weeks.some(week => week.segments.length) && <p className="gc-empty">ไม่พบแผนงานในเดือนนี้ตามตัวกรอง</p>}
    {selectedDate && <section className="gc-selected" aria-label="แผนงานวันที่เลือก"><h2>{thaiDate(selectedDate)} <small>{dayPlans.length} แผนงาน</small></h2>
      {dayPlans.map(plan => <button key={plan.id} className="gc-plan-row" onClick={() => setInsight(document(plan))}><strong>{planTitle(plan)}</strong><span>{plan.request_details?.start_time ? `${plan.request_details.start_time}–${plan.request_details.end_time}` : 'ไม่ระบุเวลา'} · {creator(plan)}</span><small>{WORKSHOP_STATUS[plan.status] || plan.status}</small></button>)}
      {!dayPlans.length && <p>ไม่มีแผนงานในวันนี้</p>}
    </section>}
    {insight && <ExpenseInsight doc={insight} onClose={() => setInsight(null)}/>}
  </section>
}

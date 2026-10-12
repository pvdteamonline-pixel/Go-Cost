import { THAI_MONTHS } from '../lib/constants'
import { DOCUMENT_STATUS } from '../lib/expenseSummary'
import { daysInMonth, localDateISO, thaiDate } from '../lib/thaiDates'
import './WorkshopSchedule.css'

export default function WorkshopSchedule({ plans, month, onMonthChange, selectedDate, onDateChange, onSelect, onCreate, canCreate, loading }) {
  const [year, number] = month.split('-').map(Number)
  const first = new Date(year, number - 1, 1).getDay()
  const days = daysInMonth(year, number)
  const today = localDateISO()
  const currentYear = Number(today.slice(0, 4))
  const storedYears = plans.map(plan => Number(plan.planned_date?.slice(0, 4))).filter(Number.isFinite)
  const start = Math.min(currentYear - 10, year, ...storedYears)
  const end = Math.max(currentYear + 10, year, ...storedYears)
  const visible = plans.filter(plan => plan.planned_date?.startsWith(month) && plan.status !== 'deleted')
  const selectedPlans = visible.filter(plan => plan.planned_date === selectedDate)
  function moveMonth(offset) {
    const next = new Date(year, number - 1 + offset, 1)
    onMonthChange(localDateISO(next).slice(0, 7))
  }

  return <section className="workshop-schedule glass" aria-label="ตารางนัดหมาย Workshop" aria-busy={loading}>
    <div className="ws-toolbar"><div><h2>ตารางนัดหมาย Workshop</h2><p>{loading ? 'กำลังโหลดคำขอ...' : `${visible.length} คำขอในเดือนนี้ · กดวันที่เพื่อดูรายการ${canCreate ? 'หรือสร้างคำขอ' : ''}`}</p></div>
      <div className="ws-month-controls">
        <button type="button" aria-label="เดือนก่อนหน้า" onClick={() => moveMonth(-1)}>‹</button>
        <select aria-label="เดือนปฏิทิน" value={number} onChange={e => onMonthChange(`${year}-${String(e.target.value).padStart(2, '0')}`)}>{THAI_MONTHS.map((name, i) => <option value={i + 1} key={name}>{name}</option>)}</select>
        <select aria-label="ปีปฏิทิน พ.ศ." value={year} onChange={e => onMonthChange(`${e.target.value}-${String(number).padStart(2, '0')}`)}>{Array.from({ length: end - start + 1 }, (_, i) => start + i).map(y => <option key={y} value={y}>{y + 543}</option>)}</select>
        <button type="button" aria-label="เดือนถัดไป" onClick={() => moveMonth(1)}>›</button>
      </div>
    </div>
    <div className="ws-calendar">{['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map(day => <div className="ws-weekday" key={day}>{day}</div>)}
      {Array.from({ length: first }, (_, i) => <div key={`blank-${i}`} />)}
      {Array.from({ length: days }, (_, i) => {
        const date = `${month}-${String(i + 1).padStart(2, '0')}`
        const count = visible.filter(plan => plan.planned_date === date).length
        return <button type="button" key={date} className="ws-day" aria-pressed={date === selectedDate} aria-current={date === today ? 'date' : undefined} aria-label={`${thaiDate(date)} · ${count} คำขอ`} onClick={() => onDateChange(date)}><span>{i + 1}</span>{count > 0 && <strong>{count} <span>คำขอ</span></strong>}</button>
      })}
    </div>
    {selectedDate && <div className="ws-day-detail">
      <div className="ws-day-heading"><h3>{thaiDate(selectedDate)}</h3>{canCreate && <button type="button" className="btn-primary text-sm" onClick={() => onCreate(selectedDate)}>+ สร้างคำขอ Workshop ใหม่</button>}</div>
      {!selectedPlans.length && !loading && <p className="text-sm text-ink-500">ยังไม่มีคำขอในวันนี้</p>}
      {selectedPlans.map(plan => <button type="button" key={plan.id} className="ws-plan" onClick={() => onSelect(plan)}><span><strong>{plan.store_name}</strong><small>{plan.id}</small></span><span className="ws-status">{DOCUMENT_STATUS[plan.status] || 'ไม่ทราบสถานะ'}</span></button>)}
    </div>}
  </section>
}

import { useEffect, useId, useState } from 'react'
import { THAI_MONTHS } from '../lib/constants'
import { dateFromParts, daysInMonth } from '../lib/thaiDates'
import './WorkshopSchedule.css'

function splitDate(value) {
  const [year = '', month = '', day = ''] = (value || '').split('-')
  return { year, month: month ? String(Number(month)) : '', day: day ? String(Number(day)) : '' }
}

export default function ThaiDateInput({ value, onChange, label = 'วันที่วางแผนจัดงาน', required = false }) {
  const id = useId()
  const [parts, setParts] = useState(() => splitDate(value))
  useEffect(() => { setParts(splitDate(value)) }, [value])
  const currentYear = new Date().getFullYear()
  const selectedYear = Number(parts.year) || currentYear
  const startYear = Math.min(currentYear - 10, selectedYear)
  const endYear = Math.max(currentYear + 10, selectedYear)
  const maxDay = parts.month && parts.year ? daysInMonth(parts.year, parts.month) : 31

  function change(field, nextValue) {
    const next = { ...parts, [field]: nextValue }
    if (next.day && next.month && next.year) next.day = String(Math.min(Number(next.day), daysInMonth(next.year, next.month)))
    setParts(next)
    onChange(dateFromParts(next))
  }

  return <fieldset className="ws-date-input">
    <legend>{label}{required ? ' *' : ''}</legend>
    <div className="ws-date-parts">
      <select id={`${id}-day`} aria-label={`${label}: วัน`} required={required} value={parts.day} onChange={e => change('day', e.target.value)}><option value="">วัน</option>{Array.from({ length: maxDay }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select>
      <select aria-label={`${label}: เดือน`} required={required} value={parts.month} onChange={e => change('month', e.target.value)}><option value="">เดือน</option>{THAI_MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}</select>
      <select aria-label={`${label}: ปี พ.ศ.`} required={required} value={parts.year} onChange={e => change('year', e.target.value)}><option value="">ปี พ.ศ.</option>{Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i).map(year => <option key={year} value={year}>{year + 543}</option>)}</select>
    </div>
  </fieldset>
}

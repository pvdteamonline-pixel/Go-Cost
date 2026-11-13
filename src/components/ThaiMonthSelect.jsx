import { THAI_MONTHS } from '../lib/constants'

// Keep the stored/filter value ISO; only the visible labels use the Thai calendar.
export default function ThaiMonthSelect({ value, onChange, label = 'เลือกเดือน', className = 'glass-input', allowAll = true, dates = [] }) {
  const currentYear = Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Bangkok', year: 'numeric' }).format(new Date()))
  const years = [...new Set([
    ...Array.from({ length: 15 }, (_, i) => currentYear + 2 - i),
    Number(value?.slice(0, 4)), ...dates.map(date => Number(String(date ?? '').slice(0, 4))),
  ])].filter(year => Number.isInteger(year) && year >= 1900 && year <= 9999).sort((a, b) => b - a)
  return <select aria-label={label} className={`${className} thai-month-select`} value={value} onChange={event => onChange(event.target.value)}>
    {allowAll && <option value="">ทุกเดือน</option>}
    {years.map(year => <optgroup key={year} label={`พ.ศ. ${year + 543}`}>
      {THAI_MONTHS.map((month, index) => <option key={month} value={`${year}-${String(index + 1).padStart(2, '0')}`}>{month} {year + 543}</option>)}
    </optgroup>)}
  </select>
}

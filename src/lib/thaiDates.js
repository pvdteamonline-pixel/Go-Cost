import { THAI_MONTHS } from './constants.js'

export function localDateISO(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function thaiDate(value) {
  if (!value) return 'ยังไม่ระบุวันที่'
  const [year, month, day] = value.slice(0, 10).split('-').map(Number)
  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`
}

export function daysInMonth(year, month) {
  return new Date(Number(year), Number(month), 0).getDate()
}

export function dateFromParts({ year, month, day }) {
  if (!year || !month || !day) return ''
  return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(Number(day), daysInMonth(year, month))).padStart(2, '0')}`
}

const DAY = 86400000
export function dateNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
  const n = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(n) && new Date(n).toISOString().slice(0, 10) === value ? n / DAY : null
}
export const dateISO = number => new Date(number * DAY).toISOString().slice(0, 10)
export function todayInBangkok() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(p => [p.type, p.value]))
  return `${parts.year}-${parts.month}-${parts.day}`
}
export function planRange(plan) {
  const start = dateNumber(plan.planned_date)
  const end = dateNumber(plan.request_details?.end_date || plan.planned_date)
  return start != null && end != null && end >= start ? { start, end } : null
}
export function changeMonth(month, delta) {
  const [y, m] = month.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7)
}
export function calendarWeeks(month, plans) {
  const first = dateNumber(`${month}-01`)
  if (first == null) return []
  const last = dateNumber(`${changeMonth(month, 1)}-01`) - 1
  const gridStart = first - new Date(first * DAY).getUTCDay()
  const count = Math.ceil((last - gridStart + 1) / 7)
  const valid = plans.map(plan => ({ plan, range: planRange(plan) })).filter(item => item.range)
    .sort((a, b) => a.range.start - b.range.start || b.range.end - a.range.end || String(a.plan.id).localeCompare(String(b.plan.id)))
  return Array.from({ length: count }, (_, index) => {
    const start = gridStart + index * 7, end = start + 6, lanes = []
    const segments = valid.filter(item => item.range.start <= end && item.range.end >= start).map(({ plan, range }) => {
      const from = Math.max(start, range.start) - start, to = Math.min(end, range.end) - start
      let lane = lanes.findIndex(until => until < from)
      if (lane < 0) lane = lanes.length
      lanes[lane] = to
      return { plan, from, span: to - from + 1, lane, before: range.start < start, after: range.end > end }
    })
    return { start: dateISO(start), days: Array.from({ length: 7 }, (_, day) => dateISO(start + day)), segments }
  })
}
export function plansOnDate(plans, date) {
  const day = dateNumber(date)
  return day == null ? [] : plans.filter(plan => { const range = planRange(plan); return range && range.start <= day && range.end >= day })
}

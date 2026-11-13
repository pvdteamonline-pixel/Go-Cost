import { THAI_MONTHS } from './constants.js'
import { approvalGroup, groupWorkshopPlans } from './workshopRequest.js'

// Use the stable store ID when available. Manual requests fall back to the
// normalized party name; unnamed requests stay visible but are not invented stores.
export function workshopStoreKey(plan) {
  if (plan.store_id != null && String(plan.store_id).trim() !== '') return `id:${plan.store_id}`
  const normalize = value => String(value || '').normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('th-TH')
  const name = normalize(plan.request_details?.party_name) || normalize(plan.store_name)
  return name ? `name:${name}` : null
}

export function workshopStoreSummary(plans) {
  const stores = new Set(), groups = { approved: new Set(), pending: new Set(), other: new Set() }
  const requestCounts = { approved: 0, pending: 0, other: 0 }
  let unknownStores = 0, otherRequests = 0
  for (const plan of plans) {
    const key = workshopStoreKey(plan), group = approvalGroup(plan.status)
    requestCounts[group]++
    if (group === 'other') otherRequests++
    if (key) { stores.add(key); groups[group].add(key) } else unknownStores++
  }
  const counts = Object.fromEntries(Object.entries(groups).map(([key, values]) => [key, values.size]))
  return { stores: stores.size, ...counts, requests: plans.length, requestCounts, unknownStores, otherRequests, overlapping: counts.approved + counts.pending + counts.other > stores.size }
}

export function groupWorkshopHistory(plans, filters = {}) {
  const years = new Map(), filtered = []
  for (const source of groupWorkshopPlans(plans, filters)) {
    const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(source.month) && Number(source.month.slice(0, 4)) > 0
    const yearKey = valid ? source.month.slice(0, 4) : 'unknown'
    const monthKey = valid ? source.month : 'unknown'
    if (!years.has(yearKey)) years.set(yearKey, { key: yearKey, label: valid ? `พ.ศ. ${Number(yearKey) + 543}` : 'ไม่ระบุปี', months: new Map(), plans: [] })
    const year = years.get(yearKey)
    if (!year.months.has(monthKey)) year.months.set(monthKey, { key: monthKey, label: valid ? THAI_MONTHS[Number(source.month.slice(5)) - 1] : 'ไม่ระบุเดือน', approved: [], pending: [], other: [] })
    const month = year.months.get(monthKey)
    for (const key of ['approved', 'pending', 'other']) {
      month[key].push(...source[key]); year.plans.push(...source[key]); filtered.push(...source[key])
    }
  }
  const newestFirst = (a, b) => a.key === b.key ? 0 : a.key === 'unknown' ? 1 : b.key === 'unknown' ? -1 : b.key.localeCompare(a.key)
  return {
    summary: workshopStoreSummary(filtered),
    years: [...years.values()].sort(newestFirst).map(year => ({
      key: year.key, label: year.label, summary: workshopStoreSummary(year.plans),
      months: [...year.months.values()].sort(newestFirst).map(month => ({ ...month, summary: workshopStoreSummary([...month.approved, ...month.pending, ...month.other]) })),
    })),
  }
}

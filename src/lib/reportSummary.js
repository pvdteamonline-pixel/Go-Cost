import { MONTH_SHORT, EXEC_REPORT_PIVOT_STRUCTURE } from './executiveReportPivot.js'

export const ratio = (value, base) => Number.isFinite(value) && Number.isFinite(base) && base !== 0 ? value / base * 100 : null
export const budgetStatus = (actual, budget) => {
  if (budget === null || budget === undefined) return { key: 'unknown', label: 'ยังไม่มีข้อมูลงบ', pct: null, remaining: null }
  if (budget <= 0) return { key: 'unset', label: 'ยังไม่ได้ตั้งงบ', pct: null, remaining: null }
  const pct = ratio(actual, budget)
  return { key: pct > 100 ? 'over' : pct >= 80 ? 'warning' : 'normal', label: pct > 100 ? 'เกินงบ' : pct >= 80 ? 'ใกล้เต็มงบ' : 'อยู่ในงบ', pct, remaining: budget - actual }
}

const aliases = new Map(EXEC_REPORT_PIVOT_STRUCTURE.flatMap(block => block.items || block.fallbackItems || block.subGroups?.flatMap(g => g.items) || []).filter(item => item.matchCodes).map(item => [item.code, item.matchCodes]))

// Every amount comes from a rendered leaf row. Never sum subtotals with their items.
export function buildReportSummary(pivot, accounts = [], budgets = null, month = '') {
  const metadata = new Map(accounts.map(account => [account.code, account]))
  const byCategory = new Map()
  const add = (name, value) => byCategory.set(name, (byCategory.get(name) || 0) + value)
  for (const row of budgets || []) add(row.category, 0)
  const cogsCategory = pivot.cogsCodes.map(code => metadata.get(code)?.category).find(Boolean) || 'ต้นทุนขาย / ต้นทุนผลิต (Cost of Sales)'
  add(cogsCategory, pivot.cogsTotal)
  let expenses = false
  for (const row of pivot.rows) {
    if (row.id === 'gross-profit') expenses = true
    if (row.id === 'sec-4-summary') expenses = false
    if (!expenses || row.type !== 'item' || row.total === 0) continue
    const names = [...new Set((aliases.get(row.code) || [row.code]).map(code => metadata.get(code)?.category).filter(Boolean))]
    add(names.length === 1 ? names[0] : 'ค่าใช้จ่ายดำเนินงาน (ตามรายงาน)', row.total)
  }
  const totalSpend = pivot.cogsTotal + pivot.grandTotalExpSum
  const categoryRows = [...byCategory].map(([name, actual]) => {
    const budget = budgets === null ? null : Number(budgets.find(b => b.category === name)?.budget ?? 0)
    return { name, actual, budget, share: ratio(actual, totalSpend), ...budgetStatus(actual, budget) }
  }).sort((a, b) => b.actual - a.actual)
  const monthly = MONTH_SHORT.map((name, i) => ({ name, month: i + 1, amount: pivot.cogsMonthly[i] + pivot.grandTotalExpMonthly[i] })).filter(row => !month || row.month === Number(month))
  return { categoryRows, monthly, totalSpend, average: pivot.activeMonthsCount ? totalSpend / pivot.activeMonthsCount : null, topCategory: categoryRows.find(row => row.actual > 0)?.name || '—' }
}

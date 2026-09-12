import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildExecutivePivotData } from './executiveReportPivot.js'
import { buildReportSummary, budgetStatus } from './reportSummary.js'
import { loadReportDocuments } from './reportDocuments.js'

const account = (code, values, name = code) => ({ code, name, monthly: Array.from({ length: 12 }, (_, i) => values[i] || 0), total: values.reduce((a, b) => a + b, 0) })
const fixture = { rawAccounts: [account('4100-01', [1000, 3000]), account('4100-03', [100, 200]), account('4100-04', [10, 20]), account('5130-02', [5, 10]), account('5100-01', [300, 800]), account('6000-02', [40, 100]), account('6110-01', [60, 200])] }
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} != ${expected}`)

test('revenue adjustments, COGS and expenses are counted exactly once', () => {
  const p = buildExecutivePivotData(fixture, 2026)
  near(p.totalRevSum, 3685)
  near(p.cogsTotal, 1100)
  near(p.grandTotalExpSum, 400)
  near(p.grossProfitTotal, 2585)
  near(p.netProfitTotal, 2185)
  assert.equal(p.activeMonthsCount, 2)
  assert.equal(p.rows.find(r => r.id === 'total-revenue').total, p.totalRevSum)
})

test('all summaries, percentages, audit totals and charts obey the month filter', () => {
  const p = buildExecutivePivotData(fixture, 2026, '1')
  near(p.totalRevSum, 895)
  near(p.cogsTotal, 300)
  near(p.grandTotalExpSum, 100)
  near(p.netProfitTotal, 495)
  assert.equal(p.activeMonthsCount, 1)
  assert.equal(p.rows.find(r => r.id === 'cogs-pct').pctValue, '33.52%')
  assert.equal(p.rows.find(r => r.id === 'cogs-pct-check').pctValue, '66.48%')
  assert.equal(p.rows.find(r => r.id === 'total-exp-pct').pctValue, '11.17%')
  assert.equal(p.allDetectedAccounts.find(a => a.code === '4100-01').total, 1000)
  const summary = buildReportSummary(p, [], [], '1')
  assert.equal(summary.monthly.length, 1)
  near(summary.monthly[0].amount, 400)
  near(summary.categoryRows.reduce((sum, row) => sum + row.actual, 0), summary.totalSpend)
  near(summary.average, 400)
})

test('month totals add to the full year and never mutate source values', () => {
  const original = structuredClone(fixture)
  const year = buildExecutivePivotData(fixture, 2026)
  const months = Array.from({ length: 12 }, (_, i) => buildExecutivePivotData(fixture, 2026, String(i + 1)))
  for (const key of ['totalRevSum', 'cogsTotal', 'grandTotalExpSum', 'netProfitTotal']) near(months.reduce((sum, p) => sum + p[key], 0), year[key])
  assert.deepEqual(fixture, original)
})

test('empty period and zero revenue have no invented profit margin or active month', () => {
  const p = buildExecutivePivotData(fixture, 2026, '12')
  assert.equal(p.activeMonthsCount, 0)
  assert.equal(p.allDetectedAccounts.length, 0)
  assert.equal(p.rows.find(r => r.id === 'cogs-pct-check').pctValue, '—')
  assert.equal(p.rows.find(r => r.id === 'total-exp').pctOfRevenue, null)
  assert.equal(buildReportSummary(p).average, null)
  assert.ok(p.rows.every(r => r.avgPerMonth === undefined || Number.isFinite(r.avgPerMonth)))
})

test('explicit COGS accounts at zero do not resurrect annual fallback totals', () => {
  const p = buildExecutivePivotData({ ...fixture, cogsMonthly: [900, ...Array(11).fill(0)] }, 2026, '12')
  assert.equal(p.cogsTotal, 0)
})

test('mapping an expense to COGS does not subtract it twice', () => {
  const p = buildExecutivePivotData(fixture, 2026, '', { '6000-02': 'cogs' })
  near(p.cogsTotal, 1240)
  near(p.grandTotalExpSum, 260)
  near(p.netProfitTotal, 2185)
})

test('rawAccounts and repeated group copies are deduplicated', () => {
  const p = buildExecutivePivotData({ ...fixture, groups: [{ accounts: fixture.rawAccounts }, { accounts: fixture.rawAccounts }] }, 2026)
  near(p.totalRevSum, 3685)
  near(p.netProfitTotal, 2185)
})

test('budget boundaries distinguish missing, unset, warning and exceeded', () => {
  assert.equal(budgetStatus(100, null).key, 'unknown')
  assert.equal(budgetStatus(100, 0).remaining, null)
  assert.equal(budgetStatus(79.99, 100).key, 'normal')
  assert.equal(budgetStatus(80, 100).key, 'warning')
  assert.equal(budgetStatus(100, 100).key, 'warning')
  assert.equal(budgetStatus(100.01, 100).key, 'over')
})

test('credit amounts keep their sign and percentages use the signed revenue', () => {
  const p = buildExecutivePivotData({ rawAccounts: [account('4100-01', [-100]), account('6000-02', [-20])] }, 2026)
  assert.equal(p.netProfitTotal, -80)
  assert.equal(p.rows.find(r => r.id === 'total-exp').pctOfRevenue, 20)
})

test('file counts do not mistake an annual import range for verified monthly files', async () => {
  const client = { rpc: async () => ({ data: [{ id: 1, year: 2026, month_range: '1-7' }, { id: 2, year: 2025, month_range: '1' }] }) }
  const counts = await loadReportDocuments(client, 2026, 'test-actor')
  assert.equal(counts.total, 1)
  assert.equal(counts.months[0], null)
  assert.equal(counts.months[11], 0)
})

test('single-month import counts and unavailable/truncated metadata remain explicit', async () => {
  const client = data => ({ rpc: async () => ({ data }) })
  const counts = await loadReportDocuments(client([{ id: 1, year: 2026, month_range: '2' }]), 2026, 'test-actor')
  assert.equal(counts.months[0], 0)
  assert.equal(counts.months[1], 1)
  assert.equal(await loadReportDocuments(client(Array(100).fill({})), 2026, 'test-actor'), null)
  assert.equal(await loadReportDocuments({ rpc: async () => ({ error: { message: 'denied' } }) }, 2026, 'test-actor'), null)
})

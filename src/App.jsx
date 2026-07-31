import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ExpenseEntryPage from './pages/ExpenseEntryPage'
import ExpenseHistoryPage from './pages/ExpenseHistoryPage'
import PendingEditsPage from './pages/PendingEditsPage'
import UsersManagementPage from './pages/UsersManagementPage'
import StoresManagementPage from './pages/StoresManagementPage'
import AccountsManagementPage from './pages/AccountsManagementPage'
import AccountGroupsPage from './pages/AccountGroupsPage'
import AccountFileImportPage from './pages/AccountFileImportPage'
import ReconciliationPage from './pages/ReconciliationPage'
import BudgetManagementPage from './pages/BudgetManagementPage'
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage'
import ExecutiveReportPage from './pages/ExecutiveReportPage'
import TaxReportPage from './pages/TaxReportPage'
import AuditLogPage from './pages/AuditLogPage'
import WorkshopCreatePage from './pages/WorkshopCreatePage'
import WorkshopHistoryPage from './pages/WorkshopHistoryPage'
import WorkshopApprovalPage from './pages/WorkshopApprovalPage'
import TrialBalancePage from './pages/TrialBalancePage'
import ExternalExpensePage from './pages/ExternalExpensePage'
import PLReportPage from './pages/PLReportPage'
import NotificationsBell from './components/NotificationsBell'
import { NAV_GROUPS } from './lib/constants'
import { hasPagePermission } from './lib/permissions'

const IMPLEMENTED_PAGES = {
  dashboard: DashboardPage,
  'expense-entry': ExpenseEntryPage,
  'expense-history': ExpenseHistoryPage,
  'pending-edits': PendingEditsPage,
  users: UsersManagementPage,
  stores: StoresManagementPage,
  accounts: AccountsManagementPage,
  'account-groups': AccountGroupsPage,
  'account-import': AccountFileImportPage,
  reconciliation: ReconciliationPage,
  budgets: BudgetManagementPage,
  'exec-dashboard': ExecutiveDashboardPage,
  'exec-report': ExecutiveReportPage,
  'tax-report': TaxReportPage,
  'audit-log': AuditLogPage,
  'workshop-plan-create': WorkshopCreatePage,
  'workshop-plan-view': WorkshopHistoryPage,
  'workshop-approve': WorkshopApprovalPage,
  'trial-balance': TrialBalancePage,
  'external-expenses': ExternalExpensePage,
  'pl-report': PLReportPage,
}

function ComingSoon({ label }) {
  return (
    <div className="max-w-2xl mx-auto glass p-10 text-center">
      <p className="doc-badge mb-4">กำลังพัฒนา</p>
      <h2 className="font-display italic text-2xl text-ink-900 mb-2">{label}</h2>
      <p className="text-ink-600 text-sm">
        หน้านี้อยู่ในแผนเฟสถัดไป — ตอนนี้เปิดใช้งานได้เฉพาะ "บันทึกค่าใช้จ่าย" ซึ่งเป็นฟีเจอร์หลักของระบบก่อน
      </p>
    </div>
  )
}

function Sidebar({ active, onNavigate }) {
  const { currentUser, logout } = useAuth()
  const visibleGroups = NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((item) => hasPagePermission(currentUser, item.key)) }))
    .filter((group) => group.items.length > 0)

  return (
    <aside className="w-64 shrink-0 glass-solid m-4 mr-0 p-5 flex flex-col">
      <div className="mb-8">
        <h1 className="font-display italic text-2xl text-ink-900">GoCost</h1>
        <p className="text-ink-500 text-xs mt-0.5">คุมค่าใช้จ่าย</p>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] uppercase tracking-wider text-ink-400 mb-2 px-2">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${
                    active === item.key
                      ? 'bg-gold-pale text-gold-dark border border-gold/30'
                      : 'text-ink-700 hover:bg-ink-100 border border-transparent'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="pt-4 border-t border-black/10">
        <p className="text-ink-900 text-sm">{currentUser?.full_name || currentUser?.name}</p>
        <p className="text-ink-500 text-xs mb-3">{currentUser?.role}</p>
        <button onClick={logout} className="btn-ghost w-full text-sm">ออกจากระบบ</button>
      </div>
    </aside>
  )
}

function Shell() {
  const { currentUser } = useAuth()
  const firstPermitted = NAV_GROUPS.flatMap((g) => g.items).find((i) => hasPagePermission(currentUser, i.key))?.key ?? 'dashboard'
  const [active, setActive] = useState(firstPermitted)
  const ActivePage = IMPLEMENTED_PAGES[active]
  const activeLabel = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === active)?.label ?? ''
  const allowed = hasPagePermission(currentUser, active)

  return (
    <div className="min-h-screen flex">
      <Sidebar active={active} onNavigate={setActive} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-8 py-4">
          <h2 className="text-ink-600 text-sm">{activeLabel}</h2>
          <NotificationsBell />
        </header>
        <main className="flex-1 px-8 pb-8 overflow-y-auto">
          {!allowed && (
            <div className="max-w-2xl mx-auto glass p-10 text-center">
              <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
              <p className="text-ink-600 text-sm">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ — ติดต่อ Admin หากคิดว่าควรมีสิทธิ์</p>
            </div>
          )}
          {allowed && (ActivePage ? <ActivePage onNavigate={setActive} /> : <ComingSoon label={activeLabel} />)}
        </main>
      </div>
    </div>
  )
}

function Gate() {
  const { currentUser, loading } = useAuth()
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-ink-500">กำลังโหลด...</div>
  }
  return currentUser ? <Shell /> : <LoginPage />
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

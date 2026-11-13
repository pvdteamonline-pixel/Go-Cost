import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import ExpenseEntryPage from './pages/ExpenseEntryPage'
import ExpenseReportsPage from './pages/ExpenseReportsPage'
import ExpenseHistoryPage from './pages/ExpenseHistoryPage'
import PendingEditsPage from './pages/PendingEditsPage'
import UsersManagementPage from './pages/UsersManagementPage'
import StoresManagementPage from './pages/StoresManagementPage'
import ExecutiveDashboardPage from './pages/ExecutiveDashboardPage'
import AuditLogPage from './pages/AuditLogPage'
import WorkshopCreatePage from './pages/WorkshopCreatePage'
import WorkshopHistoryPage from './pages/WorkshopHistoryPage'
import WorkshopApprovalPage from './pages/WorkshopApprovalPage'
import TrialBalancePage from './pages/TrialBalancePage'
import ReportsHubPage from './pages/ReportsHubPage'
import AccountsHubPage from './pages/AccountsHubPage'
import BudgetsOtherHubPage from './pages/BudgetsOtherHubPage'
import NotificationsBell from './components/NotificationsBell'
import { NAV_GROUPS } from './lib/constants'
import { hasPagePermission } from './lib/permissions'
import Sidebar from './components/Sidebar'
import Icon from './components/Icon'

const IMPLEMENTED_PAGES = {
  'expense-report': ExpenseReportsPage,
  'expense-entry': ExpenseEntryPage,
  'expense-history': ExpenseHistoryPage,
  'pending-edits': PendingEditsPage,
  users: UsersManagementPage,
  stores: StoresManagementPage,
  accounts: (props) => <AccountsHubPage initialTab="accounts" {...props} />,
  'account-groups': (props) => <AccountsHubPage initialTab="account-groups" {...props} />,
  'account-import': (props) => <AccountsHubPage initialTab="account-import" {...props} />,
  'accounts-hub': (props) => <AccountsHubPage initialTab="accounts" {...props} />,
  'trial-balance': TrialBalancePage,
  budgets: (props) => <BudgetsOtherHubPage initialTab="budgets" {...props} />,
  'external-expenses': (props) => <BudgetsOtherHubPage initialTab="external-expenses" {...props} />,
  'budgets-hub': (props) => <BudgetsOtherHubPage initialTab="budgets" {...props} />,
  'exec-dashboard': ExecutiveDashboardPage,
  'exec-report': (props) => <ReportsHubPage initialTab="exec-report" {...props} />,
  'pl-report': (props) => <ReportsHubPage initialTab="pl-report" {...props} />,
  'tax-report': (props) => <ReportsHubPage initialTab="tax-report" {...props} />,
  'reports-hub': (props) => <ReportsHubPage initialTab="exec-report" {...props} />,
  'audit-log': AuditLogPage,
  'workshop-plan-create': WorkshopCreatePage,
  'workshop-plan-view': WorkshopHistoryPage,
  'workshop-approve': WorkshopApprovalPage,
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

function Shell() {
  const { currentUser } = useAuth()
  const firstPermitted = NAV_GROUPS.flatMap((g) => g.items).find((i) => hasPagePermission(currentUser, i.key))?.key ?? ''
  const [active, setActive] = useState(firstPermitted)
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    try { return localStorage.getItem('gocost_sidebar_collapsed') === 'true' } catch { return false }
  })
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches)
  const [mobileOpen, setMobileOpen] = useState(false)
  const collapsed = mobile ? !mobileOpen : desktopCollapsed
  useEffect(() => {
    const query = window.matchMedia('(max-width: 760px)')
    const update = () => { setMobile(query.matches); setMobileOpen(false) }
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  const setSidebarCollapsed = value => {
    setDesktopCollapsed(value)
    try { localStorage.setItem('gocost_sidebar_collapsed', String(value)) } catch { /* Optional storage. */ }
  }
  const toggleSidebar = () => {
    if (mobile) setMobileOpen(value => !value)
    else setDesktopCollapsed(value => {
      try { localStorage.setItem('gocost_sidebar_collapsed', String(!value)) } catch { /* Optional storage. */ }
      return !value
    })
  }
  const navigate = key => { setActive(key); setMobileOpen(false); window.scrollTo({ top: 0 }) }
  const ActivePage = IMPLEMENTED_PAGES[active]
  const activeLabel = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === active)?.label ?? ''
  const allowed = hasPagePermission(currentUser, active)
  const activeGroup = NAV_GROUPS.find(group => group.items.some(item => item.key === active))?.label
  const roleLabel = currentUser.role === 'ADMIN' ? 'ผู้ดูแลระบบ' : currentUser.role

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {mobile && mobileOpen && <button className="sidebar-scrim" aria-label="ปิดเมนูพื้นหลัง" tabIndex={-1} onClick={() => setMobileOpen(false)} />}
      <Sidebar active={active} onNavigate={navigate} collapsed={collapsed} onToggle={toggleSidebar} mobile={mobile} onClose={() => setMobileOpen(false)} onCollapsedChange={setSidebarCollapsed} />
      <div className="app-content" inert={mobile && mobileOpen}>
        <header className="app-header">
          <button className="icon-button mobile-menu" onClick={toggleSidebar} aria-label="เปิดเมนูหลัก" aria-expanded={!collapsed}><Icon name="menu" /></button>
          <nav className="app-breadcrumb" aria-label="ตำแหน่งหน้าปัจจุบัน"><Icon name="home" size={19} /><span className="breadcrumb-group">{activeGroup}</span><span aria-hidden="true">/</span><strong>{activeLabel}</strong></nav>
          <div className="header-tools"><NotificationsBell /><span className="header-role">{roleLabel}</span></div>
        </header>
        <main className="app-main">
          {!allowed && (
            <div className="max-w-2xl mx-auto glass p-10 text-center">
              <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
              <p className="text-ink-600 text-sm">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ — ติดต่อผู้ดูแลระบบ หากคิดว่าควรมีสิทธิ์</p>
            </div>
          )}
          {allowed && (ActivePage ? <ActivePage onNavigate={navigate} /> : <ComingSoon label={activeLabel} />)}
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

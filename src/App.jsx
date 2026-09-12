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
import { supabase } from './lib/supabaseClient'
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

// ─── Status Box: แสดงวันที่แนบไฟล์ล่าสุด + เดือน/ปีล่าสุด ───────────────────────
function DataStatusBox() {
  const { currentUser } = useAuth()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!currentUser?.id) return setLoading(false)
      setLoading(true)
      try {
        const { data: batches } = await supabase
          .rpc('get_import_batches', { p_actor_id: currentUser.id, p_batch_type: 'pl_estimate' })
        if (batches && batches.length > 0) {
          const sorted = [...batches].sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
          const latest = sorted[0]
          setStatus({
            latestImportAt: latest.uploaded_at,
            latestYear: Math.max(...batches.map(b => Number(b.year) || 0)) || latest.year,
            latestMonthRange: latest.month_range || null,
          })
        }
      } catch {
        // silent fail
      }
      setLoading(false)
    }
    load()
  }, [currentUser])

  if (loading) {
    return (
      <div className="mt-3 pt-3 border-t border-black/10">
        <p className="text-ink-400 text-[10px]">กำลังโหลดสถานะ...</p>
      </div>
    )
  }

  const importDate = status?.latestImportAt
    ? new Date(status.latestImportAt)
    : null

  const monthName = status?.latestMonthRange || null


  return (
    <div className="mt-3 pt-3 border-t border-black/10 space-y-2">
      <p className="text-[10px] uppercase tracking-wider text-ink-400">สถานะข้อมูล</p>
      {importDate ? (
        <div className="bg-white/50 border border-black/[0.07] rounded-xl p-2.5 space-y-1.5">
          <div className="flex items-start gap-1.5">
            <span className="text-xs mt-0.5">📂</span>
            <div>
              <p className="text-[10px] text-ink-500">แนบไฟล์ล่าสุด</p>
              <p className="text-[11px] font-medium text-ink-800">
                {importDate.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-[10px] text-ink-400">เวลา {importDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.</p>
            </div>
          </div>
          {monthName && (
            <div className="flex items-start gap-1.5">
              <span className="text-xs mt-0.5">📅</span>
              <div>
                <p className="text-[10px] text-ink-500">ช่วงเดือนที่ระบุในไฟล์</p>
                <p className="text-[11px] font-medium text-ocean">{monthName} ปี {status?.latestYear}</p>
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-2.5">
          <p className="text-[10px] text-amber-700">⚠️ ยังไม่มีข้อมูลในระบบ</p>
          <p className="text-[9px] text-amber-500 mt-0.5">กรุณาแนบไฟล์บัญชีก่อน</p>
        </div>
      )}
    </div>
  )
}

function Sidebar({ active, onNavigate, collapsed, onToggle }) {
  const { currentUser, logout } = useAuth()
  const visibleGroups = NAV_GROUPS
    .map((group) => ({ ...group, items: group.items.filter((item) => hasPagePermission(currentUser, item.key)) }))
    .filter((group) => group.items.length > 0)

  return (
    <aside id="main-navigation" className={`app-sidebar glass-solid ${collapsed ? "is-collapsed" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-copy"><h1 className="brand-shimmer font-display text-2xl">GoCost</h1>
        <p className="text-ink-500 text-xs mt-0.5">คุมค่าใช้จ่าย</p></div>
        <button className="icon-button" onClick={onToggle} aria-label={collapsed ? "เปิดเมนู" : "พับเมนู"} aria-expanded={!collapsed} aria-controls="main-navigation"><Icon name={collapsed ? "menu" : "collapse"} /></button>
      </div>

      <nav aria-label="เมนูหลัก" className="sidebar-nav">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            <p className="sidebar-group-title">{group.label}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  aria-current={active === item.key ? 'page' : undefined}
                  title={item.label}
                  className={`sidebar-link ${active === item.key ? 'is-active' : ''}`}
                >
                  <Icon name={item.icon} /><span className="sidebar-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <p className="text-ink-900 text-sm">{currentUser?.full_name || currentUser?.name}</p>
        <p className="text-ink-500 text-xs mb-3">{currentUser?.role}</p>
        <button onClick={logout} className="btn-ghost w-full text-sm">ออกจากระบบ</button>
        <DataStatusBox />
      </div>
    </aside>
  )
}

function Shell() {
  const { currentUser } = useAuth()
  const firstPermitted = NAV_GROUPS.flatMap((g) => g.items).find((i) => hasPagePermission(currentUser, i.key))?.key ?? ''
  const [active, setActive] = useState(firstPermitted)
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('gocost_sidebar_collapsed') === 'true' || window.matchMedia('(max-width: 760px)').matches } catch { return false }
  })
  const toggleSidebar = () => setCollapsed(value => {
    try { localStorage.setItem('gocost_sidebar_collapsed', String(!value)) } catch { /* Storage is optional. */ }
    return !value
  })
  const navigate = (key) => {
    setActive(key)
    if (window.matchMedia('(max-width: 760px)').matches) setCollapsed(true)
  }
  useEffect(() => {
    const close = (event) => { if (event.key === 'Escape') setCollapsed(true) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])
  const ActivePage = IMPLEMENTED_PAGES[active]
  const activeLabel = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.key === active)?.label ?? ''
  const allowed = hasPagePermission(currentUser, active)

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {!collapsed && <button className="sidebar-scrim" aria-label="ปิดเมนู" onClick={() => setCollapsed(true)} />}
      <Sidebar active={active} onNavigate={navigate} collapsed={collapsed} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="app-header">
          <button className="icon-button mobile-menu" onClick={toggleSidebar} aria-label="เปิดเมนูหลัก" aria-expanded={!collapsed}><Icon name="menu" /></button>
          <h2 className="brand-shimmer text-sm">{activeLabel}</h2>
          <NotificationsBell />
        </header>
        <main className="app-main">
          {!allowed && (
            <div className="max-w-2xl mx-auto glass p-10 text-center">
              <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
              <p className="text-ink-600 text-sm">คุณไม่มีสิทธิ์เข้าถึงหน้านี้ — ติดต่อ Admin หากคิดว่าควรมีสิทธิ์</p>
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

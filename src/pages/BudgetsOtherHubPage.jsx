import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import BudgetManagementPage from './BudgetManagementPage'
import ExternalExpensePage from './ExternalExpensePage'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const TABS = [
  { id: 'budgets', label: 'ตั้งงบประมาณ', icon: 'cash' },
  { id: 'external-expenses', label: 'ค่าใช้จ่ายช่องทางภายนอก (Beautrium)', icon: 'store' },
]

export default function BudgetsOtherHubPage({ initialTab = 'budgets', onNavigate }) {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Filter tabs by permission
  const allowedTabs = TABS.filter(tab => hasPagePermission(currentUser, tab.id))

  // Handle case where user has permission to some tabs
  const currentTab = allowedTabs.some(t => t.id === activeTab)
    ? activeTab
    : allowedTabs[0]?.id || 'budgets'

  return (
    <div className="space-y-6">
      {/* Box Bar Header for Tab Switching */}
      <div className="app-tabs" aria-label="หมวดหน้าที่เกี่ยวข้อง">
        {TABS.map((tab) => {
          const isAllowed = hasPagePermission(currentUser, tab.id)
          const isActive = currentTab === tab.id
          if (!isAllowed) return null

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`app-tab ${isActive ? 'is-active' : ''}`}
              aria-pressed={isActive}
            >
              <Icon name={tab.icon} size={17} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Render Selected Sub-Page */}
      <div className="transition-all duration-300">
        {currentTab === 'budgets' && <BudgetManagementPage onNavigate={onNavigate} />}
        {currentTab === 'external-expenses' && <ExternalExpensePage onNavigate={onNavigate} />}
      </div>
    </div>
  )
}

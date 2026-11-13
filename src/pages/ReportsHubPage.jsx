import { useState, useEffect } from 'react'
import Icon from '../components/Icon'
import ExecutiveReportPage from './ExecutiveReportPage'
import PLReportPage from './PLReportPage'
import TaxReportPage from './TaxReportPage'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const TABS = [
  { id: 'exec-report', label: 'รายงานผู้บริหาร', icon: 'chart' },
  { id: 'pl-report', label: 'รายงาน P&L (ประมาณการกำไรขาดทุน)', icon: 'chart' },
  { id: 'tax-report', label: 'รายงานสำหรับกรมสรรพากร', icon: 'file' },
]

export default function ReportsHubPage({ initialTab = 'exec-report', onNavigate }) {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState(initialTab)

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Filter tabs by permission
  const allowedTabs = TABS.filter(tab => hasPagePermission(currentUser, tab.id))

  // Handle case where user has permission to some report tabs
  const currentTab = allowedTabs.some(t => t.id === activeTab)
    ? activeTab
    : allowedTabs[0]?.id || 'exec-report'

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
        {currentTab === 'exec-report' && <ExecutiveReportPage onNavigate={onNavigate} />}
        {currentTab === 'pl-report' && <PLReportPage onNavigate={onNavigate} />}
        {currentTab === 'tax-report' && <TaxReportPage onNavigate={onNavigate} />}
      </div>
    </div>
  )
}

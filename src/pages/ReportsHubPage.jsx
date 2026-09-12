import React, { useState, useEffect } from 'react'
import ExecutiveReportPage from './ExecutiveReportPage'
import PLReportPage from './PLReportPage'
import TaxReportPage from './TaxReportPage'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const TABS = [
  { id: 'exec-report', label: 'รายงานผู้บริหาร', icon: '📊' },
  { id: 'pl-report', label: 'รายงาน P&L (ประมาณการกำไรขาดทุน)', icon: '📈' },
  { id: 'tax-report', label: 'รายงานสำหรับกรมสรรพากร', icon: '🧾' },
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
      <div className="bg-white/70 backdrop-blur-md p-2 rounded-2xl border border-black/10 shadow-sm flex flex-wrap gap-2">
        {TABS.map((tab) => {
          const isAllowed = hasPagePermission(currentUser, tab.id)
          const isActive = currentTab === tab.id
          if (!isAllowed) return null

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-ocean/10 to-ocean/5 text-ink-900 font-semibold shadow-sm border border-ocean/25 ring-2 ring-ocean/5'
                  : 'text-ink-600 hover:text-ink-900 hover:bg-white/80 border border-transparent'
              }`}
            >
              <span className="text-base">{tab.icon}</span>
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

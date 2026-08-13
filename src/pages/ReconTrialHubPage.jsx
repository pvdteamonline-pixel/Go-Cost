import React, { useState, useEffect } from 'react'
import ReconciliationPage from './ReconciliationPage'
import TrialBalancePage from './TrialBalancePage'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const TABS = [
  { id: 'reconciliation', label: 'เทียบยอด (Reconciliation)', icon: '⚖️' },
  { id: 'trial-balance', label: 'งบทดลอง (Trial Balance)', icon: '📊' },
]

export default function ReconTrialHubPage({ initialTab = 'reconciliation', onNavigate }) {
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
    : allowedTabs[0]?.id || 'reconciliation'

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
                  ? 'bg-gradient-to-r from-gold-pale to-amber-100/80 text-ink-900 font-semibold shadow-sm border border-gold/40 ring-2 ring-gold/20 scale-[1.01]'
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
        {currentTab === 'reconciliation' && <ReconciliationPage onNavigate={onNavigate} />}
        {currentTab === 'trial-balance' && <TrialBalancePage onNavigate={onNavigate} />}
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { MAIN_CATEGORIES } from '../lib/constants'

function formatBaht(n) {
  return (n ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const CATEGORIES = MAIN_CATEGORIES.filter(Boolean)

export default function BudgetManagementPage() {
  const { currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('category') // 'category' | 'groups' | 'accounts'
  const [year, setYear] = useState(new Date().getFullYear())

  // Tab 1: Category Budgets (เดิม)
  const [budgets, setBudgets] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [savingCategory, setSavingCategory] = useState(null)

  // Tab 2: Group Budgets
  const [accountGroups, setAccountGroups] = useState([])
  const [groupBudgets, setGroupBudgets] = useState({}) // group_id -> amount

  // Tab 3: Account Sub-limits
  const [allAccounts, setAllAccounts] = useState([])
  const [accountLimits, setAccountLimits] = useState({}) // account_id -> amount
  const [searchAccount, setSearchAccount] = useState('')

  const canUse = hasPagePermission(currentUser, 'budgets')

  // โหลด Category Budgets เดิม
  const loadCategoryBudgets = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_budgets', { p_actor_id: currentUser?.id ?? null, p_year: year })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    const map = {}
    for (const row of data ?? []) map[row.category] = row.amount
    setBudgets(map)
  }, [currentUser, year])

  // โหลด กลุ่มรหัสบัญชี และ รหัสบัญชีทั้งหมด
  const loadAccountGroupsAndAccounts = useCallback(async () => {
    const { data: grpData } = await supabase.rpc('get_account_groups', { p_actor_id: currentUser?.id ?? null })
    if (grpData) setAccountGroups(grpData)

    const { data: accData } = await supabase.from('accounts').select('id, code, name, category, group_id').order('code')
    if (accData) setAllAccounts(accData)
  }, [currentUser])

  useEffect(() => {
    if (canUse) {
      loadCategoryBudgets()
      loadAccountGroupsAndAccounts()
    }
  }, [canUse, loadCategoryBudgets, loadAccountGroupsAndAccounts])

  function updateLocalCat(category, value) {
    setBudgets((prev) => ({ ...prev, [category]: value }))
  }

  async function handleSaveCat(category) {
    setError('')
    const amount = Number(budgets[category] ?? 0)
    if (isNaN(amount) || amount < 0) return setError(`งบของหมวด "${category}" ต้องเป็นตัวเลขไม่ติดลบ`)
    setSavingCategory(category)
    const { data, error: err } = await supabase.rpc('save_budget', {
      p_category: category, p_year: year, p_amount: amount, p_actor_id: currentUser?.id ?? null,
    })
    setSavingCategory(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(`บันทึกงบหมวด "${category}" ปี ${year} สำเร็จ`)
  }

  // Save Account Budget Sub-limit
  async function handleSaveSubLimit(groupId, accountId, amount, label) {
    setError('')
    setNotice('')
    const num = Number(amount ?? 0)
    if (isNaN(num) || num < 0) return setError(`วงเงินของ "${label}" ต้องเป็นตัวเลขไม่ติดลบ`)

    const { data, error: err } = await supabase.rpc('save_account_budget', {
      p_actor_id: currentUser?.id ?? null,
      p_group_id: groupId || null,
      p_account_id: accountId || null,
      p_year: year,
      p_month: null,
      p_amount: num
    })

    if (err) return setError('เกิดข้อผิดพลาดในการบันทึก: ' + err.message)
    if (data && !data.success) return setError(data.message)
    setNotice(`บันทึก Limit ของ "${label}" ปี ${year} สำเร็จเรียบร้อย`)
  }

  const totalBudget = CATEGORIES.reduce((sum, c) => sum + (Number(budgets[c]) || 0), 0)

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  const filteredAccounts = allAccounts.filter(a => 
    a.code.toLowerCase().includes(searchAccount.toLowerCase()) || 
    a.name.toLowerCase().includes(searchAccount.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">ตั้งงบประมาณ & Set Limit Control</h1>
          <p className="text-ink-600 text-sm mt-1">กำหนด Budget Cap รายหมวด และ Sub-limits รหัสบัญชี (Hotel Pricing, Other)</p>
        </div>
        <select className="glass-input text-sm w-32" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-2 border-b border-black/10 pb-2">
        <button
          onClick={() => setActiveTab('category')}
          className={`px-4 py-2 text-sm rounded-xl transition-all ${
            activeTab === 'category' ? 'bg-gold-pale text-gold-dark font-medium border border-gold/30' : 'text-ink-600 hover:bg-black/5'
          }`}
        >
          🏷️ งบตามหมวดหมู่ค่าใช้จ่าย
        </button>
        <button
          onClick={() => setActiveTab('groups')}
          className={`px-4 py-2 text-sm rounded-xl transition-all ${
            activeTab === 'groups' ? 'bg-gold-pale text-gold-dark font-medium border border-gold/30' : 'text-ink-600 hover:bg-black/5'
          }`}
        >
          📂 งบตามกลุ่มบัญชี (Account Groups)
        </button>
        <button
          onClick={() => setActiveTab('accounts')}
          className={`px-4 py-2 text-sm rounded-xl transition-all ${
            activeTab === 'accounts' ? 'bg-gold-pale text-gold-dark font-medium border border-gold/30' : 'text-ink-600 hover:bg-black/5'
          }`}
        >
          🎯 Sub-limits รายรหัสบัญชี (Hotel, อื่นๆ)
        </button>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}

      {/* TAB 1: Main Category Budgets */}
      {!loading && activeTab === 'category' && (
        <div className="glass p-0 overflow-hidden space-y-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">หมวดหมู่ค่าใช้จ่าย</th>
                <th className="px-4 py-3">งบที่ตั้งไว้ (บาท/ปี)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((c) => (
                <tr key={c} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01]">
                  <td className="px-4 py-3 text-ink-900 font-medium">{c}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number" min="0" step="any"
                      className="glass-input text-sm w-44"
                      value={budgets[c] ?? ''}
                      onChange={(e) => updateLocalCat(c, e.target.value)}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleSaveCat(c)} disabled={savingCategory === c} className="btn-primary text-xs px-4 py-1.5 disabled:opacity-60">
                      {savingCategory === c ? 'กำลังบันทึก...' : 'บันทึก'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-black/10 bg-gold-pale/20">
                <td className="px-4 py-3 text-ink-900 font-medium">รวมงบทั้งหมดปี {year}</td>
                <td className="px-4 py-3 text-gold-dark font-display italic text-lg font-bold" colSpan={2}>{formatBaht(totalBudget)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* TAB 2: Group Budgets */}
      {activeTab === 'groups' && (
        <div className="glass p-5 space-y-4">
          <h3 className="font-display italic text-xl text-ink-900">งบประมาณตามกลุ่มรหัสบัญชี</h3>
          <p className="text-ink-600 text-xs">ตั้งวงเงินงบประมาณรวมของแต่ละกลุ่มรหัสบัญชี</p>
          <div className="divide-y divide-black/5">
            {accountGroups.length === 0 ? (
              <p className="text-ink-400 text-sm py-4">ไม่พบกลุ่มรหัสบัญชีในระบบ</p>
            ) : (
              accountGroups.map((g) => (
                <div key={g.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="doc-badge text-xs mr-2">{g.code}</span>
                    <span className="text-ink-900 font-medium text-sm">{g.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="glass-input text-sm w-44"
                      value={groupBudgets[g.id] ?? ''}
                      onChange={(e) => setGroupBudgets(prev => ({ ...prev, [g.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleSaveSubLimit(g.id, null, groupBudgets[g.id], g.name)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      บันทึก Limit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Account Sub-limits */}
      {activeTab === 'accounts' && (
        <div className="glass p-5 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="font-display italic text-xl text-ink-900">Set Limit รายรหัสบัญชีเฉพาะ</h3>
              <p className="text-ink-600 text-xs">เช่น กำหนดเพดานราคาโรงแรม (Hotel Pricing Cap), ค่า Content Cap</p>
            </div>
            <input
              type="text"
              placeholder="🔍 ค้นหารหัสหรือชื่อบัญชี..."
              className="glass-input text-xs w-56"
              value={searchAccount}
              onChange={(e) => setSearchAccount(e.target.value)}
            />
          </div>

          <div className="divide-y divide-black/5 max-h-[450px] overflow-y-auto">
            {filteredAccounts.length === 0 ? (
              <p className="text-ink-400 text-sm py-4 text-center">ไม่พบรหัสบัญชีตรงกับคำค้น</p>
            ) : (
              filteredAccounts.map((acc) => (
                <div key={acc.id} className="py-2.5 flex items-center justify-between gap-4 hover:bg-black/[0.01] px-2 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-ocean text-xs font-semibold w-24 shrink-0">{acc.code}</span>
                    <span className="text-ink-800 text-sm">{acc.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="0.00 (ไม่จำกัด)"
                      className="glass-input text-xs w-36"
                      value={accountLimits[acc.id] ?? ''}
                      onChange={(e) => setAccountLimits(prev => ({ ...prev, [acc.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => handleSaveSubLimit(null, acc.id, accountLimits[acc.id], `${acc.code} ${acc.name}`)}
                      className="btn-ghost text-xs px-2.5 py-1 border border-black/10 hover:border-gold"
                    >
                      ตั้ง Limit
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <p className="text-ink-400 text-xs">
        💡 ระบบจะนำวงเงินที่ตั้งไว้ไปประมวลผลการแจ้งเตือน alert 80% / 100% ในแดชบอร์ดฝ่ายบริหารอัตโนมัติ
      </p>
    </div>
  )
}

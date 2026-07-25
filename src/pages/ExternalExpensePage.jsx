import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

export default function ExternalExpensePage() {
  const { currentUser } = useAuth()
  const [sources, setSources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const canUse = hasPagePermission(currentUser, 'account-import') || hasPagePermission(currentUser, 'exec-dashboard')

  const loadSources = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data: res, error: err } = await supabase.rpc('get_external_sources', {
      p_actor_id: currentUser?.id ?? null,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!res.success) return setError(res.message)
    setSources(res.sources || [])
  }, [currentUser])

  useEffect(() => {
    if (canUse) loadSources()
  }, [canUse, loadSources])

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="doc-badge bg-ocean-pale text-ocean border-ocean/30 mb-2">Ready System / External Integration</span>
          <h1 className="font-display italic text-3xl text-ink-900">ค่าใช้จ่ายช่องทางภายนอก (Beautrium / E-Commerce)</h1>
          <p className="text-ink-600 text-sm mt-1">
            ระบบเตรียมความพร้อมสำหรับรองรับข้อมูลค่าใช้จ่ายและค่าบริการจากช่องทางภายนอกองค์กร
          </p>
        </div>
      </div>

      <div className="glass p-5 bg-gradient-to-br from-white to-gold-pale/10 border-gold/20">
        <div className="flex items-start gap-4">
          <span className="text-3xl">🔌</span>
          <div>
            <h3 className="text-ink-900 font-medium text-base">ระบบเชื่อมต่อค่าใช้จ่ายภายนอก (External Expense Adapter)</h3>
            <p className="text-ink-600 text-sm mt-1">
              รองรับการนำเข้าไฟล์ Excel/CSV หรือ API จากแพลตฟอร์มพันธมิตร เช่น บิวเทรียม (Beautrium), Shopee, Lazada และ TikTok Shop เพื่อกระทบยอดค่าใช้จ่ายและค่าธรรมเนียมภายนอกเข้ากับผังบัญชีหลัก
            </p>
          </div>
        </div>
      </div>

      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
      {loading && <p className="text-ink-500 text-sm">กำลังโหลดช่องทางภายนอก...</p>}

      {!loading && (
        <div className="space-y-4">
          <h2 className="text-ink-900 font-display italic text-xl">ช่องทางภายนอกที่รองรับในระบบ (Active Adapters)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sources.map((src) => (
              <div key={src.id} className="glass p-5 border-l-4 border-ocean flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="doc-badge text-xs font-mono">{src.code}</span>
                    <span className="text-xs text-sage font-medium bg-sage-pale border border-sage/20 px-2 py-0.5 rounded-full">
                      ● พร้อมใช้งาน (Ready)
                    </span>
                  </div>
                  <h3 className="font-medium text-ink-900 text-base">{src.name}</h3>
                  <p className="text-ink-500 text-xs mt-1">{src.note}</p>
                </div>
                <div className="pt-2 border-t border-black/5 flex items-center justify-between text-xs text-ink-400">
                  <span>Channel: {src.channel}</span>
                  <button className="btn-ghost text-xs px-2 py-1 text-ocean hover:underline" onClick={() => alert(`ช่องทาง ${src.name} พร้อมสำหรับนำเข้าข้อมูล API / Import`)}>
                    ตั้งค่าการนำเข้า ⚙️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

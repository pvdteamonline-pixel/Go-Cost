import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { supabase } from '../lib/supabaseClient'
import { groupExpenseDocuments } from '../lib/expenseSummary'
import DocumentCalendar from './DocumentCalendar'
import ExpenseInsight from './ExpenseInsight'

// Load each source through its existing permission-checked RPC. Creating a
// Workshop request does not implicitly grant access to financial documents.
export default function WorkshopDocumentCalendar({ revision = 0 }) {
  const { currentUser } = useAuth()
  const canReadExpenses = hasPagePermission(currentUser, 'expense-history') || hasPagePermission(currentUser, 'expense-report')
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [errors, setErrors] = useState([])
  const [selected, setSelected] = useState(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true); setErrors([]); setDocuments([]); setSelected(null)
      const sources = [
        { label: 'คำขอ Workshop', rpc: 'get_workshop_plans_v2', map: data => {
          if (!Array.isArray(data)) throw new Error('รูปแบบข้อมูลคำขอไม่ถูกต้อง')
          return data.map(plan => ({ ...plan, docNo: plan.id, type: 'Workshop', storeName: plan.store_name || plan.request_details?.party_name, eventDate: plan.planned_date, income: plan.sales_push_amount, storeSales: plan.workshop_sales_amount }))
        } },
        ...(canReadExpenses ? [{ label: 'เอกสารค่าใช้จ่าย', rpc: 'get_operational_report', map: data => {
          if (!data || !Array.isArray(data.expenses)) throw new Error('รูปแบบข้อมูลเอกสารไม่ถูกต้อง')
          return groupExpenseDocuments(data.expenses, data.requests ?? [])
        } }] : []),
      ]
      const results = await Promise.allSettled(sources.map(async source => {
        const { data, error } = await supabase.rpc(source.rpc, { p_actor_id: currentUser.id })
        if (error) throw error
        return source.map(data)
      }))
      if (cancelled) return
      setDocuments(results.flatMap(result => result.status === 'fulfilled' ? result.value : []))
      setErrors(results.flatMap((result, index) => result.status === 'rejected' ? [`โหลด${sources[index].label}ไม่สำเร็จ: ${result.reason?.message || 'กรุณาลองใหม่'}`] : []))
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [currentUser.id, canReadExpenses, revision, refresh])

  return <section className="space-y-4" aria-label="ปฏิทินเอกสารและ Workshop" aria-busy={loading}>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-ink-600">ดูตามวันจัดงาน · แสดงคำขอ Workshop{canReadExpenses ? ' และเอกสารค่าใช้จ่าย' : ''}ตามสิทธิ์ของคุณ</p>
      <button className="btn-ghost" disabled={loading} onClick={() => setRefresh(value => value + 1)}>รีเฟรชปฏิทิน</button>
    </div>
    {errors.map(error => <p key={error} role="alert" className="expense-alert">{error}</p>)}
    {loading ? <p role="status" className="document-empty">กำลังโหลดปฏิทิน…</p> : <DocumentCalendar documents={documents} onSelect={setSelected}/>}
    {selected && <ExpenseInsight doc={selected} onClose={() => setSelected(null)}/>}
  </section>
}

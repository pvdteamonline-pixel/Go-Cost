import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { groupWorkshopHistory } from '../lib/workshopHistory'
import { WORKSHOP_TYPES } from '../lib/workshopRequest'
import WorkshopHistoryTree from '../components/WorkshopHistoryTree'
import WorkshopApprovalDialog from '../components/WorkshopApprovalDialog'
import Icon from '../components/Icon'
import './WorkshopHistoryPage.css'

export default function WorkshopApprovalPage() {
  const { currentUser } = useAuth()
  const [plans, setPlans] = useState([]), [loading, setLoading] = useState(true)
  const [error, setError] = useState(''), [notice, setNotice] = useState('')
  const [selected, setSelected] = useState(null), [decisionError, setDecisionError] = useState(''), [busy, setBusy] = useState(false)
  const [search, setSearch] = useState(''), [typeFilter, setTypeFilter] = useState('')
  const decisionLock = useRef(false), loadSequence = useRef(0)
  const invalidateLoad = useCallback(() => { loadSequence.current++ }, [])
  const canApprove = hasPagePermission(currentUser, 'workshop-approve')
  const load = useCallback(async () => {
    const sequence = ++loadSequence.current
    setLoading(true); setError('')
    try {
      const { data, error: err } = await supabase.rpc('get_workshop_plans_v2', { p_actor_id: currentUser?.id ?? null })
      if (err) throw new Error(err.message)
      if (data != null && !Array.isArray(data)) throw new Error('รูปแบบข้อมูลคำขอไม่ถูกต้อง')
      if (sequence === loadSequence.current) setPlans(data ?? [])
    } catch (err) {
      if (sequence === loadSequence.current) { setPlans([]); setError('โหลดรายการไม่สำเร็จ: ' + err.message) }
    } finally { if (sequence === loadSequence.current) setLoading(false) }
  }, [currentUser?.id])
  useEffect(() => {
    setSelected(null)
    if (canApprove) load()
    else { setPlans([]); setLoading(false) }
    return invalidateLoad
  }, [canApprove, load, invalidateLoad])
  const history = useMemo(() => groupWorkshopHistory(plans, { search, type: typeFilter }), [plans, search, typeFilter])

  async function handleDecision(id, action, note = '') {
    if (decisionLock.current || !canApprove || !plans.some(plan => plan.id === id && plan.status === 'pending_approval')) return
    decisionLock.current = true; setBusy(true); setDecisionError(''); setNotice('')
    try {
      const { data, error: err } = await supabase.rpc(action === 'approve' ? 'approve_workshop_plan' : 'reject_workshop_plan', {
        p_plan_id: id, p_actor_id: currentUser?.id ?? null, ...(action === 'reject' ? { p_admin_note: note } : {}),
      })
      if (err) throw new Error(err.message)
      if (!data?.success) throw new Error(data?.message || 'ดำเนินการไม่สำเร็จ กรุณาลองใหม่')
      setNotice(data.message || (action === 'approve' ? 'อนุมัติคำขอแล้ว' : 'ปฏิเสธคำขอแล้ว'))
      setSelected(null)
      await load()
    } catch (err) { setDecisionError('เกิดข้อผิดพลาด: ' + err.message) }
    finally { decisionLock.current = false; setBusy(false) }
  }
  if (!canApprove) return <div className="max-w-2xl mx-auto glass p-10 text-center"><p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p><p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p></div>

  return <div className="workshop-history-c1 workshop-approval-c1">
    <div className="whc-heading"><div><h1>อนุมัติ Workshop</h1><p>แยกตามปีและเดือน · เปิด Insight เพื่อตรวจสอบและพิจารณาคำขอ</p></div></div>
    {notice && <p role="status" className="wac-notice">{notice}</p>}
    {error && <p role="alert" className="expense-alert">{error}</p>}
    <div className="whc-toolbar"><p className="whc-overview" aria-live="polite">{loading || error ? '—' : <strong>{history.summary.requests} รายการ · {history.years.filter(year => year.key !== 'unknown').length} ปี</strong>}</p>
      <label className="whc-search"><Icon name="search" size={19}/><input aria-label="ค้นหาคำขอ" placeholder="ค้นหาเลขที่คำขอ / ชื่อร้าน" value={search} onChange={event => setSearch(event.target.value)}/></label>
      <select aria-label="กรองประเภทงาน" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="">ทุกประเภทงาน</option>{WORKSHOP_TYPES.map(type => <option key={type}>{type}</option>)}</select>
      <button className="icon-button" aria-label="รีเฟรชรายการอนุมัติ Workshop" disabled={loading || busy} onClick={load}><Icon name="refresh" size={19}/></button>
      {(search || typeFilter) && <button className="whc-clear" onClick={() => { setSearch(''); setTypeFilter('') }}>ล้างตัวกรอง</button>}
    </div>
    <section aria-label="รายการอนุมัติ Workshop แยกปีและเดือน" aria-busy={loading}>
      {loading && <p className="document-empty" role="status">กำลังโหลดคำขอ...</p>}
      {!loading && !history.years.length && <p className="document-empty">{error ? 'ไม่สามารถโหลดรายการได้ กรุณาลองใหม่' : search || typeFilter ? 'ไม่พบคำขอตามตัวกรองที่เลือก' : 'ยังไม่มีคำขอ Workshop'}</p>}
      {!loading && !!history.years.length && <WorkshopHistoryTree key={JSON.stringify([search, typeFilter])} years={history.years} countMode="requests" onSelect={plan => { setDecisionError(''); setSelected(plan) }} hasActions={() => false}/>}
    </section>
    {!loading && !error && !!history.years.length && <p className="whc-count-note">นับจำนวนคำขอในแต่ละปีและเดือน · ร้านเดียวกันอาจมีหลายรายการ</p>}
    {selected && <WorkshopApprovalDialog key={selected.id} plan={selected} busy={busy} error={decisionError} onClose={() => { if (!decisionLock.current) setSelected(null) }} onDecision={handleDecision}/>}
  </div>
}

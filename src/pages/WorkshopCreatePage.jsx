import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import { supabase } from '../lib/supabaseClient'
import WorkshopRequestForm from '../components/WorkshopRequestForm'
import WorkshopCalendar from '../components/WorkshopCalendar'
import { todayInBangkok } from '../lib/workshopCalendar'
import Icon from '../components/Icon'

export default function WorkshopCreatePage() {
  const { currentUser } = useAuth()
  const canCreate = hasPagePermission(currentUser, 'workshop-plan-create')
  const [formDate, setFormDate] = useState(null)
  const [month, setMonth] = useState(() => todayInBangkok().slice(0, 7))
  const [selectedDate, setSelectedDate] = useState('')
  const [notice, setNotice] = useState('')
  const [plans, setPlans] = useState([]), [people, setPeople] = useState([])
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [peopleError, setPeopleError] = useState('')
  const [revision, setRevision] = useState(0)
  const [dirty, setDirty] = useState(false), [saving, setSaving] = useState(false)
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    if (!canCreate) return
    let cancelled = false
    async function load() {
      setLoading(true); setError(''); setPeopleError(''); setPlans([]); setPeople([])
      const [planResult, peopleResult] = await Promise.allSettled([
        supabase.rpc('get_workshop_plans_v2', { p_actor_id: currentUser.id }),
        supabase.rpc('get_users').select('id,name,role'),
      ])
      if (cancelled) return
      if (planResult.status === 'fulfilled' && !planResult.value.error && Array.isArray(planResult.value.data)) setPlans(planResult.value.data)
      else setError('โหลดแผนงานไม่สำเร็จ กรุณากดรีเฟรชปฏิทิน')
      if (peopleResult.status === 'fulfilled' && !peopleResult.value.error && Array.isArray(peopleResult.value.data)) setPeople(peopleResult.value.data)
      else setPeopleError('โหลดชื่อและบทบาทผู้เสนอไม่สำเร็จ')
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [currentUser.id, canCreate, revision])
  useEffect(() => {
    if (!dirty) return
    const warn = event => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  function openForm(date) { setNotice(''); setDirty(false); setFormDate(date); window.scrollTo({ top: 0 }) }
  function closeForm() {
    if (saving || (dirty && !window.confirm('มีข้อมูลที่ยังไม่ได้บันทึก ต้องการกลับปฏิทินและยกเลิกข้อมูลที่กรอกหรือไม่?'))) return
    setFormDate(null); setDirty(false); window.scrollTo({ top: 0 })
  }
  if (!canCreate) return <div className="max-w-2xl mx-auto glass p-10 text-center"><p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p><p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจากผู้ดูแลระบบก่อน</p></div>
  if (formDate !== null) return <div className="gc-form-page">
    <div className="gc-heading"><h1>สร้างคำขอ Workshop ใหม่</h1><button className="btn-ghost" disabled={saving} onClick={closeForm}><Icon name="chevronLeft" size={16}/>กลับปฏิทิน</button></div>
    <WorkshopRequestForm initialDate={formDate} onDirtyChange={setDirty} onBusyChange={setSaving} onCancel={closeForm} onCreated={data => {
      setFormDate(null); setDirty(false); setSaving(false); setMonth(data.plannedDate.slice(0, 7)); setSelectedDate(data.plannedDate)
      setNotice(`${data.message} (เลขที่เอกสาร ${data.planId})`); refresh(); window.scrollTo({ top: 0 })
    }}/>
  </div>
  return <div className="gc-page">
    <div className="gc-heading"><h1><Icon name="calendar" size={27}/>สร้างคำขอ Workshop ใหม่</h1></div>
    {notice && <p role="status" className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2 mb-4">{notice}</p>}
    <WorkshopCalendar plans={plans} people={people} loading={loading} error={error} peopleError={peopleError} month={month} onMonthChange={setMonth} selectedDate={selectedDate} onDateChange={setSelectedDate} onCreate={openForm} onRefresh={refresh}/>
  </div>
}

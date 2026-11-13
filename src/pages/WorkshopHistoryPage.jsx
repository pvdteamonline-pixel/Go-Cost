import { Fragment, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import WorkshopSchedule from '../components/WorkshopSchedule'
import WorkshopRequestForm from '../components/WorkshopRequestForm'
import { localDateISO } from '../lib/thaiDates'
import ExpenseInsight from '../components/ExpenseInsight'
import { openAttachment } from '../lib/expenseAttachments'
import DocumentGroupHeader from '../components/DocumentGroupHeader'
import Icon from '../components/Icon'
import { documentDate } from '../lib/expenseDocument'

import { WORKSHOP_TYPES, WORKSHOP_GROUPS, WORKSHOP_STATUS, approvalGroup, groupWorkshopPlans, monthLabel, formatMoney } from '../lib/workshopRequest'
import '../components/WorkshopRequest.css'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB

function formatBaht(n) {
  return n === null || n === undefined ? '-' : n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function WorkshopHistoryPage() {
  const { currentUser } = useAuth()
  const [insight,setInsight]=useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => localDateISO().slice(0, 7))
  const [selectedDate, setSelectedDate] = useState('')
  const [createDate, setCreateDate] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  // ฟอร์มกรอก/แก้ไขข้อมูลหลังงาน
  const [fillingPlan, setFillingPlan] = useState(null)
  const [fillMode, setFillMode] = useState('submit') // 'submit' | 'edit'
  const [fillStep, setFillStep] = useState('form') // 'form' | 'confirm'
  const [attendees, setAttendees] = useState('')
  const [salesPush, setSalesPush] = useState('')
  const [workshopSales, setWorkshopSales] = useState('')
  const [file, setFile] = useState(null)
  const [fileError, setFileError] = useState('')
  const [fillSubmitting, setFillSubmitting] = useState(false)

  // ฟอร์มแก้ไขคำขอ (ร้าน/วันที่)
  const [editingRequest, setEditingRequest] = useState(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState('')
  const [closedGroups, setClosedGroups] = useState({})

  // ยืนยันลบ (double confirm แบบ inline)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const canCreate = hasPagePermission(currentUser, 'workshop-plan-create')
  const canView = hasPagePermission(currentUser, 'workshop-plan-view')
  const canEdit = hasPagePermission(currentUser, 'workshop-plan-edit')
  const canDelete = hasPagePermission(currentUser, 'workshop-plan-delete')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await supabase.rpc('get_workshop_plans_v2', { p_actor_id: currentUser?.id ?? null })
      if (err) throw new Error(err.message)
      // The permission-checked RPC defines the readable dataset. Ownership only
      // restricts mutations; it must not hide history granted by page permission.
      if (data != null && !Array.isArray(data)) throw new Error('รูปแบบข้อมูลคำขอไม่ถูกต้อง')
      setPlans(data ?? [])
    } catch (err) {
      setPlans([])
      setError('โหลดประวัติไม่สำเร็จ: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [currentUser?.id])

  useEffect(() => { if (canView) load() }, [canView, load])

  // ── กรอก/แก้ไขข้อมูลหลังงาน ──────────────────────────
  function openFillForm(plan) {
    setFillingPlan(plan)
    setFillMode('submit')
    setFillStep('form')
    setAttendees('')
    setSalesPush('')
    setWorkshopSales('')
    setFile(null)
    setFileError('')
    setError('')
  }

  function openEditSalesForm(plan) {
    setFillingPlan(plan)
    setFillMode('edit')
    setFillStep('form')
    setAttendees(plan.attendees === null || plan.attendees === undefined ? '' : String(plan.attendees))
    setSalesPush(plan.sales_push_amount === null || plan.sales_push_amount === undefined ? '' : String(plan.sales_push_amount))
    setWorkshopSales(plan.workshop_sales_amount === null || plan.workshop_sales_amount === undefined ? '' : String(plan.workshop_sales_amount))
    setFile(null)
    setFileError('')
    setError('')
  }

  function handleFileChange(e) {
    const f = e.target.files?.[0]
    setFileError('')
    if (f && f.size > MAX_FILE_BYTES) {
      setFileError('ไฟล์ใหญ่เกิน 10MB กรุณาเลือกไฟล์ใหม่')
      setFile(null)
      return
    }
    setFile(f ?? null)
  }

  function goToFillConfirm(e) {
    e.preventDefault()
    setError('')
    // ไม่บังคับกรอกแล้ว แค่กันค่าติดลบถ้ามีการกรอกมา
    if (attendees !== '' && Number(attendees) < 0) return setError('จำนวนคนเข้างานต้องไม่ติดลบ')
    if (salesPush !== '' && Number(salesPush) < 0) return setError('ยอดขายดันเข้าร้านค้าต้องไม่ติดลบ')
    if (workshopSales !== '' && Number(workshopSales) < 0) return setError('ยอดขาย Workshop ต้องไม่ติดลบ')
    setFillStep('confirm')
  }

  async function handleConfirmFill() {
    setFillSubmitting(true)
    setError('')
    let attachmentPath = null

    if (file) {
      const path = `${fillingPlan.id}/${Date.now()}_${file.name}`
      const { error: uploadErr } = await supabase.storage.from('workshop-attachments').upload(path, file)
      if (uploadErr) {
        setFillSubmitting(false)
        return setError('อัปโหลดไฟล์ไม่สำเร็จ: ' + uploadErr.message)
      }
      attachmentPath = path
    }

    const rpcName = fillMode === 'edit' ? 'update_workshop_sales_data' : 'submit_workshop_sales_data'
    const { data, error: err } = await supabase.rpc(rpcName, {
      p_plan_id: fillingPlan.id,
      p_attendees: attendees === '' ? null : Number(attendees),
      p_sales_push_amount: salesPush === '' ? null : Number(salesPush),
      p_workshop_sales_amount: workshopSales === '' ? null : Number(workshopSales),
      p_attachment_path: attachmentPath,
      p_actor_id: currentUser?.id ?? null,
    })
    setFillSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setFillingPlan(null)
    load()
  }

  // ── แก้ไขคำขอ (ร้าน/วันที่) ──────────────────────────
  function openEditRequest(plan) { setEditingRequest(plan); setError('') }

  // ── ลบ (double confirm inline) ──────────────────────────
  async function handleConfirmDelete(plan) {
    setDeleteSubmitting(true)
    setError('')
    const { data, error: err } = await supabase.rpc('delete_workshop_plan', {
      p_plan_id: plan.id, p_actor_id: currentUser?.id ?? null,
    })
    setDeleteSubmitting(false)
    setConfirmingDeleteId(null)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  const groupedPlans = groupWorkshopPlans(plans, { search, type: typeFilter, month: monthFilter })
  const matchingPlans = groupedPlans.flatMap(group => WORKSHOP_GROUPS.flatMap(statusGroup => group[statusGroup.key]))
  const planDocument = plan => ({ ...plan, docNo: plan.id, type: 'Workshop', storeName: plan.store_name, eventDate: plan.planned_date, income: plan.sales_push_amount, storeSales: plan.workshop_sales_amount })

  if (!canView) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="workshop-history-g1 document-workspace space-y-5">
      <div className="wh-heading"><div><h1>ประวัติเสนอ Workshop</h1><p className="text-sm text-ink-500 mt-1">จัดกลุ่มตามเดือนและสถานะ · แสดงรายการตามสิทธิ์ดูประวัติ</p></div>
        {canCreate && <button className="btn-primary" onClick={() => { setCreateDate(localDateISO()); setNotice('') }}>+ สร้างคำขอ Workshop ใหม่</button>}
      </div>
      <details className="document-section wh-calendar"><summary>ตารางนัดหมาย Workshop · เปิดปฏิทิน</summary>
      <WorkshopSchedule
        plans={plans} month={calendarMonth} selectedDate={selectedDate} loading={loading} canCreate={canCreate}
        onMonthChange={month => { setCalendarMonth(month); setSelectedDate('') }}
        onDateChange={setSelectedDate}
        onCreate={date => { setCreateDate(date); setNotice('') }}
        onSelect={p => setInsight({...p,docNo:p.id,type:'Workshop',storeName:p.store_name,eventDate:p.planned_date,income:p.sales_push_amount,storeSales:p.workshop_sales_amount})}
      />
      </details>
      {createDate && canCreate && <WorkshopRequestForm key={createDate} initialDate={createDate} embedded onCancel={() => setCreateDate(null)} onCreated={data => {
        setCreateDate(null)
        setSelectedDate(data.plannedDate)
        setCalendarMonth(data.plannedDate.slice(0, 7))
        setNotice(`${data.message} (เลขที่เอกสาร ${data.planId}) — บันทึกไว้ในประวัตินี้แล้ว`)
        load()
      }} />}
      {insight&&<ExpenseInsight doc={insight} onClose={()=>setInsight(null)}/>}
      {notice && <p role="status" className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && !fillingPlan && !editingRequest && (
        <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>
      )}

      <section className="history-summary" aria-label="สรุปคำขอตามตัวกรอง">
        <div><span>คำขอทั้งหมด</span><strong>{loading || error ? '—' : matchingPlans.length} รายการ</strong></div>
        {WORKSHOP_GROUPS.map(group => <div key={group.key}><span>{group.label}</span><strong>{loading || error ? '—' : matchingPlans.filter(plan => approvalGroup(plan.status) === group.key).length}</strong></div>)}
      </section>
      <section className="grouped-table-panel" aria-label="ประวัติคำขอ Workshop" aria-busy={loading}>
        <div className="wh-filters">
          <input aria-label="ค้นหาคำขอ" className="glass-input" placeholder="ค้นหาเลขที่คำขอ / ร้านค้า / หัวข้ออบรม" value={search} onChange={e => setSearch(e.target.value)} />
          <select aria-label="กรองประเภทงาน" className="glass-input" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}><option value="">ทุกประเภทงาน</option>{WORKSHOP_TYPES.map(type => <option key={type}>{type}</option>)}</select>
          <select aria-label="กรองเดือนจัดงาน" className="glass-input" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}><option value="">ทุกเดือน</option>{[...new Set(plans.map(p => p.planned_date?.slice(0,7)).filter(Boolean))].sort().reverse().map(month => <option key={month} value={month}>{monthLabel(month)}</option>)}</select>
          <button className="icon-button" aria-label="รีเฟรชประวัติ Workshop" disabled={loading} onClick={load}><Icon name="refresh" size={18} /></button>
        </div>
        {loading && <p role="status" className="document-empty">กำลังโหลดคำขอ...</p>}
        {!loading && !groupedPlans.length && <p className="document-empty">{error ? 'ไม่สามารถโหลดประวัติได้ กรุณาลองใหม่' : search || typeFilter || monthFilter ? 'ไม่พบคำขอตามตัวกรองที่เลือก' : 'ยังไม่มีคำขอ Workshop'}</p>}
        {!loading && !!groupedPlans.length && <div className="grouped-table-scroll"><table className="grouped-table workshop-history-table">
          <thead><tr><th>เลขที่คำขอ / ร้านค้า</th><th>วันจัดงาน</th><th>สถานะ</th><th>ประเภทงาน</th><th className="number">งบประมาณ (บาท)</th><th><span className="expense-sr-only">การดำเนินการ</span></th></tr></thead>
          {groupedPlans.map(group => WORKSHOP_GROUPS.filter(statusGroup => group[statusGroup.key].length).map(statusGroup => {
            const key = `${group.month}-${statusGroup.key}`
            return <tbody key={key}>
              <DocumentGroupHeader label={`${monthLabel(group.month)} · ${statusGroup.label}`} count={group[statusGroup.key].length} unit="รายการ" colSpan={6} open={!closedGroups[key]} onToggle={() => setClosedGroups(previous => ({ ...previous, [key]: !previous[key] }))} />
              {!closedGroups[key] && group[statusGroup.key].map(plan => {
                const details = plan.request_details
                const own = plan.created_by === currentUser?.id
                const manage = own || currentUser?.role === 'ADMIN'
                const doc = planDocument(plan)
                return <Fragment key={plan.id}>
                  <tr className="document-data-row" data-document={plan.id}>
                    <td><button className="row-title" onClick={() => setInsight(doc)}>{plan.id}</button><span>{plan.store_name || '—'}</span>{details?.topic && <small>{details.topic}</small>}</td>
                    <td className="whitespace-nowrap">{documentDate(plan.planned_date)}{details?.start_time && <small>{details.start_time}–{details.end_time}</small>}</td>
                    <td><span className={`wh-status ${approvalGroup(plan.status)}`}>{WORKSHOP_STATUS[plan.status] || 'ไม่ทราบสถานะ'}</span>{plan.status === 'rejected' && plan.admin_note && <small>{plan.admin_note}</small>}</td>
                    <td>{details?.event_type || 'Workshop'}<small>{details?.expected_attendees != null ? `คาดการณ์ ${details.expected_attendees} คน` : 'คำขอเดิม'}</small></td>
                    <td className="number">{details?.estimated_cost == null ? '—' : formatMoney(details.estimated_cost)}{plan.sales_data_submitted_at != null && <small>รายได้บริษัท {formatBaht(plan.sales_push_amount)}<br />ยอดขายร้าน {formatBaht(plan.workshop_sales_amount)}</small>}</td>
                    <td><div className="grouped-row-actions">
                      <button aria-label={`Insight ${plan.id}`} onClick={() => setInsight(doc)}><Icon name="eye" size={16} />Insight</button>
                      {plan.attachment_path && <button onClick={() => openAttachment(plan.attachment_path).catch(e => setError(e.message))}>ไฟล์แนบ</button>}
                      {own && plan.status === 'awaiting_sales_data' && <button className="primary" onClick={() => openFillForm(plan)}>กรอกข้อมูลหลังงาน</button>}
                      {canEdit && manage && <><button onClick={() => openEditRequest(plan)}>แก้ไขคำขอ</button><button onClick={() => openEditSalesForm(plan)}>แก้ไขข้อมูลหลังงาน</button></>}
                      {canDelete && manage && <button className="danger" onClick={() => setConfirmingDeleteId(plan.id)}>ลบ</button>}
                    </div></td>
                  </tr>
                  {confirmingDeleteId === plan.id && <tr><td colSpan={6}><div className="inline-confirm"><p>ยืนยันลบคำขอ {plan.id} ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้</p><div><button className="btn-ghost" onClick={() => setConfirmingDeleteId(null)}>ยกเลิก</button><button className="btn-ghost text-rose" disabled={deleteSubmitting} onClick={() => handleConfirmDelete(plan)}>{deleteSubmitting ? 'กำลังลบ...' : 'ยืนยันลบ'}</button></div></div></td></tr>}
                </Fragment>
              })}
            </tbody>
          }))}
        </table></div>}
        {!loading && !error && <p className="grouped-table-footer">{matchingPlans.length} คำขอตามตัวกรอง · งบประมาณเป็นยอดคาดการณ์ รายได้หลังงานแสดงแยกจากงบประมาณ</p>}
      </section>

      {/* ── Modal: กรอก/แก้ไขข้อมูลหลังงาน ── */}
      {fillingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setFillingPlan(null)}>
          <div className="glass-solid max-w-lg w-full max-h-[85vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-xl text-ink-900">
                {fillMode === 'edit' ? 'แก้ไขข้อมูลหลังงาน' : 'กรอกข้อมูลหลังงาน'} <span className="doc-badge ml-2">{fillingPlan.id}</span>
              </h2>
              <button onClick={() => setFillingPlan(null)} className="text-ink-400 hover:text-ink-900">✕</button>
            </div>

            {fillStep === 'form' && (
              <form onSubmit={goToFillConfirm} className="space-y-4">
                <p className="text-ink-400 text-xs">ทุกช่องไม่บังคับกรอก — เว้นว่างไว้ได้ถ้ายังไม่มีข้อมูล</p>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">จำนวนคนเข้างาน</label>
                  <input type="number" min="0" className="glass-input w-full" value={attendees} onChange={(e) => setAttendees(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">ยอดขายดันเข้าร้านค้า (นับเป็นรายได้บริษัท)</label>
                  <input type="number" min="0" step="any" className="glass-input w-full" value={salesPush} onChange={(e) => setSalesPush(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">ยอดขาย Workshop (ยอดขายของร้าน ไม่นับรายได้บริษัท)</label>
                  <input type="number" min="0" step="any" className="glass-input w-full" value={workshopSales} onChange={(e) => setWorkshopSales(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">
                    แนบไฟล์ (ไม่เกิน 10MB){fillMode === 'edit' ? ' — เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยนไฟล์เดิม' : ''}
                  </label>
                  <input type="file" className="glass-input w-full" onChange={handleFileChange} />
                  {fileError && <p className="text-rose text-xs mt-1">{fileError}</p>}
                  {file && <p className="text-ink-500 text-xs mt-1">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</p>}
                </div>
                {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setFillingPlan(null)} className="btn-ghost text-sm">ยกเลิก</button>
                  <button type="submit" className="btn-primary text-sm">ตรวจสอบก่อนบันทึก</button>
                </div>
              </form>
            )}

            {fillStep === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-white/60 border border-black/[0.06] rounded-xl p-4 space-y-2 text-sm">
                  <p><span className="text-ink-500">ร้านค้า:</span> {fillingPlan.store_name}</p>
                  <p><span className="text-ink-500">จำนวนคนเข้างาน:</span> {attendees || '-'}</p>
                  <p><span className="text-ink-500">ยอดขายดันเข้าร้านค้า:</span> {salesPush ? formatBaht(Number(salesPush)) : '-'}</p>
                  <p><span className="text-ink-500">ยอดขาย Workshop:</span> {workshopSales ? formatBaht(Number(workshopSales)) : '-'}</p>
                  <p><span className="text-ink-500">ไฟล์แนบ:</span> {file ? file.name : (fillMode === 'edit' ? 'ไม่เปลี่ยนไฟล์เดิม' : 'ไม่มี')}</p>
                </div>
                {fillMode === 'submit' && (
                  <p className="text-gold-dark text-sm bg-gold-pale border border-gold/30 rounded-lg px-3 py-2">
                    ยืนยันแล้ว Workshop นี้จะถูกปิดเป็น "เสร็จสิ้น" ทันที
                  </p>
                )}
                {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setFillStep('form')} className="btn-ghost text-sm">แก้ไข</button>
                  <button onClick={handleConfirmFill} disabled={fillSubmitting} className="btn-primary text-sm disabled:opacity-60">
                    {fillSubmitting ? 'กำลังบันทึก...' : 'ยืนยันบันทึก'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editingRequest && <div className="wr-modal"><div className="wr-modal-content" role="dialog" aria-modal="true" aria-label="แก้ไขคำขอ">
        <WorkshopRequestForm key={editingRequest.id} plan={editingRequest} embedded onCancel={() => setEditingRequest(null)} onCreated={data => { setNotice(data.message); setEditingRequest(null); load() }} />
      </div></div>}
    </div>
  )
}

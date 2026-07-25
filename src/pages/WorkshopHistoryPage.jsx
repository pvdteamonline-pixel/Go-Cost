import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import StoreSearchDropdown from '../components/StoreSearchDropdown'

const STATUS_LABEL = {
  pending_approval: { text: 'รออนุมัติ', className: 'text-gold-dark bg-gold-pale border-gold/30' },
  rejected: { text: 'ถูกปฏิเสธ', className: 'text-rose bg-rose-pale border-rose/30' },
  awaiting_sales_data: { text: 'รอเซลล์อัพเดตข้อมูล', className: 'text-ocean bg-ocean-pale border-ocean/30' },
  completed: { text: 'เสร็จสิ้น', className: 'text-sage bg-sage-pale border-sage/30' },
}
const UNKNOWN_STATUS = { text: 'ไม่ทราบสถานะ', className: 'text-ink-500 bg-ink-100 border-black/10' }

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB

function formatBaht(n) {
  return n === null || n === undefined ? '-' : n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function WorkshopHistoryPage() {
  const { currentUser } = useAuth()
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
  const [editStep, setEditStep] = useState('form') // 'form' | 'confirm'
  const [editStore, setEditStore] = useState(null)
  const [editDate, setEditDate] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  // ยืนยันลบ (double confirm แบบ inline)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const canView = hasPagePermission(currentUser, 'workshop-plan-view')
  const canEdit = hasPagePermission(currentUser, 'workshop-plan-edit')
  const canDelete = hasPagePermission(currentUser, 'workshop-plan-delete')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_workshop_plans', { p_actor_id: currentUser?.id ?? null })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setPlans((data ?? []).filter((p) => p.created_by === currentUser?.id))
  }, [currentUser])

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
  function openEditRequest(plan) {
    setEditingRequest(plan)
    setEditStep('form')
    setEditStore({ id: plan.store_id, name: plan.store_name, province: plan.province, region: plan.region, assigned_sales_name: plan.assigned_sales_name })
    setEditDate(plan.planned_date)
    setError('')
  }

  function goToEditConfirm(e) {
    e.preventDefault()
    setError('')
    if (!editStore) return setError('กรุณาเลือกร้านค้า')
    if (!editDate) return setError('กรุณาเลือกวันที่วางแผนจัดงาน')
    setEditStep('confirm')
  }

  async function handleConfirmEditRequest() {
    setEditSubmitting(true)
    setError('')
    const { data, error: err } = await supabase.rpc('update_workshop_plan_request', {
      p_plan_id: editingRequest.id,
      p_store_id: editStore.id,
      p_planned_date: editDate,
      p_actor_id: currentUser?.id ?? null,
    })
    setEditSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    setEditingRequest(null)
    load()
  }

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

  if (!canView) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display italic text-3xl text-ink-900">ประวัติเสนอ Workshop</h1>
        <p className="text-ink-600 text-sm mt-1">ติดตามสถานะแผน Workshop ของคุณทั้งหมด</p>
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && !fillingPlan && !editingRequest && (
        <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="space-y-3">
        {loading && <p className="text-ink-500 text-sm">กำลังโหลด...</p>}
        {!loading && plans.length === 0 && (
          <div className="glass p-8 text-center text-ink-400 text-sm">ยังไม่มีคำขอ Workshop</div>
        )}
        {plans.map((p) => {
          const status = STATUS_LABEL[p.status] || UNKNOWN_STATUS
          const hasSalesData = p.sales_data_submitted_at != null
          return (
            <div key={p.id} className="glass p-4 space-y-2">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="doc-badge">{p.id}</span>
                    <span className={`text-xs border rounded-full px-2.5 py-0.5 ${status.className}`}>{status.text}</span>
                  </div>
                  <p className="text-ink-900 text-sm mt-1">{p.store_name} — {p.province}</p>
                  <p className="text-ink-500 text-xs">วันที่วางแผน: {p.planned_date}</p>
                  {p.status === 'rejected' && p.admin_note && (
                    <p className="text-rose text-xs mt-1">เหตุผล: {p.admin_note}</p>
                  )}
                  {hasSalesData && (
                    <p className="text-ink-500 text-xs mt-1">
                      คนเข้างาน: {p.attendees ?? '-'} · ยอดขายดันเข้าร้านค้า: {formatBaht(p.sales_push_amount)} · ยอดขาย Workshop: {formatBaht(p.workshop_sales_amount)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {p.status === 'awaiting_sales_data' && (
                    <button onClick={() => openFillForm(p)} className="btn-primary text-xs px-4 py-2">กรอกข้อมูลหลังงาน</button>
                  )}
                  {canEdit && (
                    <button onClick={() => openEditRequest(p)} className="btn-ghost text-xs px-3 py-1.5">แก้ไขคำขอ</button>
                  )}
                  {canEdit && (
                    <button onClick={() => openEditSalesForm(p)} className="btn-ghost text-xs px-3 py-1.5">แก้ไขข้อมูลหลังงาน</button>
                  )}
                  {canDelete && (
                    <button onClick={() => setConfirmingDeleteId(p.id)} className="text-rose text-xs hover:underline px-1">ลบ</button>
                  )}
                </div>
              </div>

              {confirmingDeleteId === p.id && (
                <div className="bg-rose-pale border border-rose/30 rounded-lg p-3 flex items-center justify-between gap-3">
                  <p className="text-rose text-sm">ยืนยันลบคำขอ {p.id} ใช่หรือไม่? การลบไม่สามารถย้อนกลับได้</p>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setConfirmingDeleteId(null)} className="btn-ghost text-xs px-3 py-1.5">ยกเลิก</button>
                    <button onClick={() => handleConfirmDelete(p)} disabled={deleteSubmitting}
                            className="bg-rose text-white text-xs px-3 py-1.5 rounded-xl disabled:opacity-60">
                      {deleteSubmitting ? 'กำลังลบ...' : 'ยืนยันลบ'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

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

      {/* ── Modal: แก้ไขคำขอ (ร้าน/วันที่) ── */}
      {editingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingRequest(null)}>
          <div className="glass-solid max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display italic text-xl text-ink-900">
                แก้ไขคำขอ <span className="doc-badge ml-2">{editingRequest.id}</span>
              </h2>
              <button onClick={() => setEditingRequest(null)} className="text-ink-400 hover:text-ink-900">✕</button>
            </div>

            {editStep === 'form' && (
              <form onSubmit={goToEditConfirm} className="space-y-4">
                <div>
                  <label className="block text-xs text-ink-600 mb-1">ร้านค้า *</label>
                  <StoreSearchDropdown selectedStore={editStore} onSelect={setEditStore} />
                </div>
                <div>
                  <label className="block text-xs text-ink-600 mb-1">วันที่วางแผนจัดงาน *</label>
                  <input type="date" className="glass-input w-full" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setEditingRequest(null)} className="btn-ghost text-sm">ยกเลิก</button>
                  <button type="submit" className="btn-primary text-sm">ตรวจสอบก่อนบันทึก</button>
                </div>
              </form>
            )}

            {editStep === 'confirm' && (
              <div className="space-y-4">
                <div className="bg-white/60 border border-black/[0.06] rounded-xl p-4 space-y-2 text-sm">
                  <p><span className="text-ink-500">ร้านค้าใหม่:</span> {editStore?.name}</p>
                  <p><span className="text-ink-500">วันที่ใหม่:</span> {editDate}</p>
                </div>
                {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditStep('form')} className="btn-ghost text-sm">แก้ไข</button>
                  <button onClick={handleConfirmEditRequest} disabled={editSubmitting} className="btn-primary text-sm disabled:opacity-60">
                    {editSubmitting ? 'กำลังบันทึก...' : 'ยืนยันการแก้ไข'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

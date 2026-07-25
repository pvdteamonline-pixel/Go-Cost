import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

function emptyForm() {
  return { id: null, customerCode: '', name: '', region: '', province: '', assignedSalesName: '' }
}

export default function StoresManagementPage() {
  const { currentUser } = useAuth()
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [submitting, setSubmitting] = useState(false)

  const canUse = hasPagePermission(currentUser, 'stores')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.rpc('get_stores', {
      p_actor_id: currentUser?.id ?? null,
      p_query: search.trim() || null,
    })
    setLoading(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    setStores(data ?? [])
  }, [currentUser, search])

  useEffect(() => { if (canUse) load() }, [canUse, load])

  function startEdit(s) {
    setForm({
      id: s.id, customerCode: s.customer_code || '', name: s.name,
      region: s.region || '', province: s.province || '', assignedSalesName: s.assigned_sales_name || '',
    })
  }

  function startCreate() {
    setForm(emptyForm())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) return setError('กรุณากรอกชื่อร้านค้า')

    setSubmitting(true)
    const rpcName = form.id ? 'update_store' : 'create_store'
    const params = form.id
      ? {
          p_id: form.id, p_customer_code: form.customerCode, p_name: form.name,
          p_region: form.region, p_province: form.province,
          p_assigned_sales_name: form.assignedSalesName, p_actor_id: currentUser?.id ?? null,
        }
      : {
          p_customer_code: form.customerCode, p_name: form.name,
          p_region: form.region, p_province: form.province,
          p_assigned_sales_name: form.assignedSalesName, p_actor_id: currentUser?.id ?? null,
        }
    const { data, error: err } = await supabase.rpc(rpcName, params)
    setSubmitting(false)
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    startCreate()
    load()
  }

  async function handleDelete(id) {
    if (!confirm('ยืนยันลบร้านค้านี้?')) return
    setError('')
    const { data, error: err } = await supabase.rpc('delete_store', { p_id: id, p_actor_id: currentUser?.id ?? null })
    if (err) return setError('เกิดข้อผิดพลาด: ' + err.message)
    if (!data.success) return setError(data.message)
    setNotice(data.message)
    load()
  }

  if (!canUse) {
    return (
      <div className="max-w-2xl mx-auto glass p-10 text-center">
        <p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p>
        <p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจาก Admin ก่อน</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display italic text-3xl text-ink-900">จัดการร้านค้า</h1>
          <p className="text-ink-600 text-sm mt-1">ข้อมูลร้านค้า/ลูกค้าที่ใช้ใน dropdown ตอนสร้างคำขอ Workshop</p>
        </div>
        <input className="glass-input text-sm w-64" placeholder="ค้นหาชื่อร้าน / รหัส / จังหวัด..."
               value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {notice && <p className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
      {error && <p className="text-rose text-sm bg-rose-pale border border-rose/30 rounded-lg px-3 py-2">{error}</p>}

      <form onSubmit={handleSubmit} className="glass p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <h2 className="sm:col-span-3 text-ink-900 font-medium">{form.id ? `แก้ไขร้านค้า #${form.id}` : 'เพิ่มร้านค้าใหม่'}</h2>
        <div>
          <label className="block text-xs text-ink-600 mb-1">รหัสลูกค้า</label>
          <input className="glass-input w-full" value={form.customerCode} onChange={(e) => setForm((f) => ({ ...f, customerCode: e.target.value }))} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-ink-600 mb-1">ชื่อร้านค้า *</label>
          <input className="glass-input w-full" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">ภาค</label>
          <input className="glass-input w-full" value={form.region} onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">จังหวัด</label>
          <input className="glass-input w-full" value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs text-ink-600 mb-1">เซลล์ที่สังกัด (ข้อความ)</label>
          <input className="glass-input w-full" value={form.assignedSalesName} onChange={(e) => setForm((f) => ({ ...f, assignedSalesName: e.target.value }))} />
        </div>
        <div className="sm:col-span-3 flex justify-end gap-2">
          {form.id && <button type="button" onClick={startCreate} className="btn-ghost text-sm">ยกเลิกแก้ไข</button>}
          <button type="submit" disabled={submitting} className="btn-primary text-sm disabled:opacity-60">
            {submitting ? 'กำลังบันทึก...' : form.id ? 'บันทึกการแก้ไข' : 'เพิ่มร้านค้า'}
          </button>
        </div>
      </form>

      <div className="glass p-0 overflow-hidden">
        {loading && <p className="text-ink-500 text-sm p-6">กำลังโหลด...</p>}
        {!loading && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left text-ink-500 text-xs uppercase tracking-wider">
                <th className="px-4 py-3">รหัส</th>
                <th className="px-4 py-3">ชื่อร้านค้า</th>
                <th className="px-4 py-3">ภาค / จังหวัด</th>
                <th className="px-4 py-3">เซลล์ที่สังกัด</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.id} className="border-b border-black/5 last:border-0">
                  <td className="px-4 py-3 text-ink-500">{s.customer_code || '-'}</td>
                  <td className="px-4 py-3 text-ink-900">{s.name}</td>
                  <td className="px-4 py-3 text-ink-700">{s.province || '-'} / {s.region || '-'}</td>
                  <td className="px-4 py-3 text-ink-700">{s.assigned_sales_name || <span className="text-ink-400">ยังไม่ได้กำหนด</span>}</td>
                  <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                    <button onClick={() => startEdit(s)} className="text-ocean text-xs hover:underline">แก้ไข</button>
                    <button onClick={() => handleDelete(s.id)} className="text-rose text-xs hover:underline">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && stores.length === 0 && (
          <p className="text-ink-400 text-sm text-center py-10">ไม่พบร้านค้า</p>
        )}
      </div>
    </div>
  )
}

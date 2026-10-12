import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import WorkshopRequestForm from '../components/WorkshopRequestForm'

export default function WorkshopCreatePage() {
  const { currentUser } = useAuth()
  const [notice, setNotice] = useState('')
  if (!hasPagePermission(currentUser, 'workshop-plan-create')) return <div className="max-w-2xl mx-auto glass p-10 text-center"><p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p><p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจากผู้ดูแลระบบก่อน</p></div>
  return <div className="max-w-2xl mx-auto space-y-6">
    <div><h1 className="font-display italic text-3xl text-ink-900">สร้างคำขอ Workshop ใหม่</h1><p className="text-ink-600 text-sm mt-1">เลือกร้านค้าและวันที่วางแผนจัดงาน ส่งให้ผู้บริหารอนุมัติ</p></div>
    {notice && <p role="status" className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
    <WorkshopRequestForm onCreated={data => setNotice(`${data.message} (เลขที่เอกสาร ${data.planId})`)} />
  </div>
}

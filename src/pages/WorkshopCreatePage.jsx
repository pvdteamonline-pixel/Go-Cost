import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'
import WorkshopRequestForm from '../components/WorkshopRequestForm'
import WorkshopDocumentCalendar from '../components/WorkshopDocumentCalendar'
import Icon from '../components/Icon'

export default function WorkshopCreatePage() {
  const { currentUser } = useAuth()
  const [notice, setNotice] = useState('')
  const [activeTab, setActiveTab] = useState('create')
  const [revision, setRevision] = useState(0)
  if (!hasPagePermission(currentUser, 'workshop-plan-create')) return <div className="max-w-2xl mx-auto glass p-10 text-center"><p className="doc-badge mb-4">ไม่มีสิทธิ์เข้าถึง</p><p className="text-ink-600 text-sm">หน้านี้ต้องได้รับสิทธิ์เข้าถึงจากผู้ดูแลระบบก่อน</p></div>
  return <div className="max-w-6xl mx-auto space-y-6">
    <div><h1 className="text-3xl font-bold text-ink-900">สร้างคำขอ Workshop ใหม่</h1><p className="text-ink-600 text-sm mt-1">สร้างคำขอและดูปฏิทินวันจัดงานในหน้าเดียวกัน</p></div>
    <div className="app-tabs" aria-label="งาน Workshop">
      <button className={`app-tab ${activeTab === 'create' ? 'is-active' : ''}`} aria-pressed={activeTab === 'create'} onClick={() => setActiveTab('create')}><Icon name="plus" size={17}/>สร้างคำขอ</button>
      <button className={`app-tab ${activeTab === 'calendar' ? 'is-active' : ''}`} aria-pressed={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')}><Icon name="calendar" size={17}/>ปฏิทินเอกสารและ Workshop</button>
    </div>
    {notice && <p role="status" className="text-sage text-sm bg-sage-pale border border-sage/30 rounded-lg px-3 py-2">{notice}</p>}
    <div hidden={activeTab !== 'create'}><WorkshopRequestForm onCreated={data => { setNotice(`${data.message} (เลขที่เอกสาร ${data.planId})`); setRevision(value => value + 1) }} /></div>
    {activeTab === 'calendar' && <WorkshopDocumentCalendar revision={revision}/>}
  </div>
}

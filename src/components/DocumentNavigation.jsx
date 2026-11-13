import { useAuth } from '../context/AuthContext'
import { hasPagePermission } from '../lib/permissions'

const destinations = [
  ['expense-history', 'เอกสารทั้งหมด'], ['expense-report', 'รายงาน'], ['audit-log', 'ประวัติกิจกรรม'],
]
export default function DocumentNavigation({ active, onNavigate }) {
  const { currentUser } = useAuth()
  if (!onNavigate) return null
  return <nav className="document-navigation" aria-label="หมวดเอกสารและรายงาน">
    {destinations.filter(([key]) => hasPagePermission(currentUser, key)).map(([key, label]) => <button key={key} type="button" aria-current={active === key ? 'page' : undefined} onClick={() => onNavigate(key)}>{label}</button>)}
  </nav>
}
